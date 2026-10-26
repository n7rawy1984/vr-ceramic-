import { useEffect, useRef, useState } from "react";
import { FINISHES, MATERIAL_TYPES, validDimensionMm, validImage, type TileAssetView, type TileFinish, type CropData } from "../../shared/tileAsset";
import { cmToMm } from "../utils/units";
import { api, ApiError, type SavedTileResponse } from "../tiles/api";
import { FULL_CROP, prepareImage } from "../tiles/prepareImage";

type Prepared = { blob: Blob; url: string; file: File; crop: CropData; rotation: number };
export function TileUploadForm({ onSaved, onExpired, onBusy, disabled = false }: {
  disabled?: boolean;
  onSaved: (tile: TileAssetView) => void; onExpired: () => void; onBusy: (busy: boolean) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [width, setWidth] = useState("60");
  const [height, setHeight] = useState("60");
  const [material, setMaterial] = useState<typeof MATERIAL_TYPES[number]>("Ceramic");
  const [finish, setFinish] = useState<TileFinish>("matte");
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<CropData>(FULL_CROP);
  const [cropOpen, setCropOpen] = useState(false);
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const reservation = useRef<{ blob: Blob; uploadReceipt: string; expiresAt: number } | null>(null);

  useEffect(() => {
    setPrepared(null);
    if (!file) { setPreparing(false); return; }
    let active = true;
    let url: string | null = null;
    setPreparing(true);
    const timer = setTimeout(() => {
      prepareImage(file, crop, rotation).then(blob => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setPrepared({ blob, url, file, crop, rotation });
        setPreparing(false);
      }, reason => { if (active) { setError(reason.message); setPreparing(false); } });
    }, 180);
    return () => { active = false; clearTimeout(timer); if (url) URL.revokeObjectURL(url); };
  }, [file, crop, rotation]);

  const imageReady = prepared?.file === file && prepared?.crop === crop && prepared?.rotation === rotation;
  const dimensionsValid = validDimensionMm(cmToMm(Number(width))) && validDimensionMm(cmToMm(Number(height)));
  const canSave = !disabled && imageReady && !preparing && !!name.trim() && name.trim().length <= 120 && dimensionsValid;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!canSave || !prepared || submitting.current) return;
    submitting.current = true; setBusy(true); onBusy(true); setError("");
    try {
      let receipt = reservation.current;
      if (!receipt || receipt.blob !== prepared.blob || receipt.expiresAt <= Date.now()) {
        setPhase("Preparing upload…");
        const signed = await api<{ uploadUrl: string; uploadReceipt: string; expiresAt: number }>("tile-assets/upload-url", "POST", {
          mimeType: prepared.blob.type, fileSize: prepared.blob.size, filename: file!.name,
        });
        setPhase("Uploading…");
        let uploaded: Response;
        try {
          uploaded = await fetch(signed.uploadUrl, { method: "PUT", credentials: "omit", referrerPolicy: "no-referrer", headers: { "Content-Type": prepared.blob.type, "x-upsert": "false" }, body: prepared.blob, signal: AbortSignal.timeout(120_000) });
        } catch { throw Error("Image upload failed. Check your connection and retry Save tile."); }
        if (!uploaded.ok) throw Error("Image upload failed. Check the private bucket configuration and retry Save tile.");
        receipt = { blob: prepared.blob, uploadReceipt: signed.uploadReceipt, expiresAt: signed.expiresAt };
        reservation.current = receipt;
      }
      setPhase("Saving tile…");
      const { tile } = await api<SavedTileResponse>("tile-assets", "POST", {
        uploadReceipt: receipt.uploadReceipt, name: name.trim(), widthMm: cmToMm(Number(width)), heightMm: cmToMm(Number(height)),
        materialType: material, finish, imageRotation: rotation, cropData: crop === FULL_CROP ? null : crop,
      });
      onSaved(tile); reservation.current = null;
      setName(""); setFile(null); setCrop(FULL_CROP); setRotation(0); setCropOpen(false);
      if (inputRef.current) inputRef.current.value = "";
      setPhase("Ready · tile saved. Apply it from your library.");
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 400) reservation.current = null;
      if (reason instanceof ApiError && reason.status === 401) onExpired();
      setError(reason instanceof Error ? reason.message : "Could not save this tile. Please retry.");
      setPhase("");
    } finally { submitting.current = false; setBusy(false); onBusy(false); }
  }
  function cropEdge(edge: "left" | "right" | "top" | "bottom", percent: number) {
    const value = Math.max(0, Math.min(95, percent)) / 100;
    setError("");
    setCrop(current => {
      const left = edge === "left" ? Math.min(value, 0.98 - (1 - current.x - current.width)) : current.x;
      const top = edge === "top" ? Math.min(value, 0.98 - (1 - current.y - current.height)) : current.y;
      const right = edge === "right" ? Math.min(value, 0.98 - left) : 1 - current.x - current.width;
      const bottom = edge === "bottom" ? Math.min(value, 0.98 - top) : 1 - current.y - current.height;
      return { x: left, y: top, width: 1 - left - right, height: 1 - top - bottom };
    });
  }
  return <form className="tile-upload-form" onSubmit={save}>
    <h3>Add Tile</h3>
    <fieldset disabled={busy || disabled}>
      <label className="tile-file-label">Tile image · JPG, PNG or WebP · up to 5 MB
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Tile image" onChange={event => {
          const next = event.target.files?.[0] ?? null;
          setError(""); setPhase(""); reservation.current = null; setRotation(0); setCrop(FULL_CROP);
          if (next && !validImage(next.type, next.size)) { setFile(null); setError("Choose a JPG, PNG or WebP image no larger than 5 MB."); event.target.value = ""; return; }
          setFile(next); if (next && !name) setName(next.name.replace(/\.[^.]+$/, "").slice(0, 120));
        }} />
      </label>
      {file && <>
        <div className="tile-image-preview" aria-busy={preparing}>
          {imageReady && prepared ? <img src={prepared.url} alt="Prepared tile preview" /> : <span>Preparing preview…</span>}
        </div>
        <p className="tile-image-caption">{file.name} · {width || "—"} × {height || "—"} cm · {rotation}°</p>
        <div className="tile-preparation-actions">
          <label>Rotate image<select value={rotation} onChange={e => { setError(""); setRotation(Number(e.target.value)); }}>
            {[0, 90, 180, 270].map(v => <option key={v} value={v}>{v}°</option>)}
          </select></label>
          <button type="button" className="hud-button" aria-expanded={cropOpen} onClick={() => setCropOpen(v => !v)}>Crop image</button>
        </div>
        {cropOpen && <div className="tile-crop-controls">
          <p>Trim each edge (%). The preview shows the stored image.</p>
          {([['left', crop.x], ['right', 1 - crop.x - crop.width], ['top', crop.y], ['bottom', 1 - crop.y - crop.height]] as const).map(([edge, amount]) =>
            <label key={edge}>Trim {edge}<input type="range" min="0" max="95" step="1" value={Math.round(amount * 100)} onChange={e => cropEdge(edge, Number(e.target.value))} /><output>{Math.round(amount * 100)}%</output></label>)}
          <button type="button" className="hud-button" onClick={() => setCrop(FULL_CROP)}>Reset crop</button>
        </div>}
      </>}
      <label>Tile name<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Carrara White" /></label>
      <div className="tile-field-row">
        <label>Width (cm)<input required type="number" inputMode="decimal" min="0.0001" max="10000" step="0.0001" value={width} onChange={e => setWidth(e.target.value)} /></label>
        <label>Height (cm)<input required type="number" inputMode="decimal" min="0.0001" max="10000" step="0.0001" value={height} onChange={e => setHeight(e.target.value)} /></label>
      </div>
      <div className="tile-field-row">
        <label>Material type<select value={material} onChange={e => setMaterial(e.target.value as typeof material)}>{MATERIAL_TYPES.map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Finish<select value={finish} onChange={e => setFinish(e.target.value as TileFinish)}>{FINISHES.map(v => <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>)}</select></label>
      </div>
      <p className="tile-help">Dimensions describe one finished tile. Image rotation changes the photograph; it does not swap physical dimensions.</p>
    </fieldset>
    {error && <p className="tile-error" role="alert">{error}</p>}
    {phase && <p role="status">{phase}</p>}
    <button className="hud-button hud-button-primary" disabled={busy || !canSave} type="submit">{busy ? phase : "Save tile"}</button>
  </form>;
}
