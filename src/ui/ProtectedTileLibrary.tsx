import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TileAssetView } from "../../shared/tileAsset";
import { api, ApiError } from "../tiles/api";
import { tileToProduct } from "../tiles/materialAdapter";
import { mmToCm } from "../utils/units";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { TileUploadForm } from "./TileUploadForm";
function TileImage({ tile }: { tile: TileAssetView }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  useEffect(() => { setFailedUrl(null); }, [tile.imageUrl, tile.imageUrlExpiresAt]);
  if (!tile.imageUrl || failedUrl === tile.imageUrl) return <div className="tile-image-unavailable">Image unavailable · Refresh library</div>;
  return <img src={tile.imageUrl} alt={tile.name} referrerPolicy="no-referrer" onError={() => setFailedUrl(tile.imageUrl)} />;
}
export function ProtectedTileLibrary({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [demoMode,setDemoMode]=useState(false);
  const [unavailable,setUnavailable]=useState(false);
  const [sessionAttempt,setSessionAttempt]=useState(0);
  const [code, setCode] = useState("");
  const [tiles, setTiles] = useState<TileAssetView[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const deleting = useRef(false);
  const cleanups = useRef(new Map<string, string>());
  const setProducts = useConfiguratorStore((s) => s.setUploadedProducts);
  const apply = useConfiguratorStore((s) => s.setSelectedFloorId);
  const selected = useConfiguratorStore((s) => s.selectedFloorId);
  const [applyError, setApplyError] = useState<string | null>(null);
  const publish = useCallback((items: TileAssetView[]) => { setTiles(items); setProducts(items.map(tileToProduct)); }, [setProducts]);
  const expire = useCallback(() => { setAuthenticated(false); setProducts([]); setTiles([]); setError("Your access session expired. Enter the access code again."); }, [setProducts]);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const value = await api<{ tiles: TileAssetView[] }>("tile-assets"); publish(value.tiles); }
    catch (reason) { if (reason instanceof ApiError && reason.status === 401) expire(); else setError(reason instanceof Error ? reason.message : "Could not load your tiles."); }
    finally { setLoading(false); }
  }, [expire, publish]);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    let active = true;
    setChecking(true); setUnavailable(false); setError("");
    api<{ authenticated: boolean; demoMode?: boolean }>("admin/session").then(async value => {
      if (!active) return;
      if(typeof value.authenticated!=="boolean")throw Error("Tile service unavailable.");
      setDemoMode(value.demoMode===true);
      setAuthenticated(value.authenticated);
      if (value.authenticated) await load();
      else { setProducts([]); setTiles([]); }
    }).catch(() => { if (active) {setUnavailable(true);setError("My Tiles is temporarily unavailable. Close this panel to continue designing.");} }).finally(() => { if (active) setChecking(false); });
    return () => { active = false; element?.close(); setChecking(true); };
  }, [open, load, setProducts, sessionAttempt]);
  useEffect(() => {
    if (!authenticated) return;
    // Renew signed image access while the component is mounted. Reopening the
    // library always lists again; URLs never become persistent metadata.
    const timer = setInterval(() => { void load(); }, 50 * 60_000);
    return () => clearInterval(timer);
  }, [authenticated, load]);
  async function login(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { await api("admin/login", "POST", { code }); setAuthenticated(true); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not unlock your library."); }
    finally { setCode(""); setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError("");
    try { await api("admin/logout", "POST", {}); setAuthenticated(false); publish([]); }
    catch (reason) { if (reason instanceof ApiError && reason.status === 401) expire(); else setError(reason instanceof Error ? reason.message : "Could not lock the library."); }
    finally { setBusy(false); }
  }
  async function remove(tile: TileAssetView) {
    if (deleting.current || !window.confirm(`Delete “${tile.name}” and its stored image?`)) return;
    deleting.current = true; setBusy(true); setError("");
    try {
      await api(`tile-assets/${tile.id}`, "DELETE", { cleanupReceipt: cleanups.current.get(tile.id) });
      cleanups.current.delete(tile.id); publish(tiles.filter(t => t.id !== tile.id));
    } catch (reason) {
      if (reason instanceof ApiError && reason.cleanupReceipt) cleanups.current.set(tile.id, reason.cleanupReceipt);
      if (reason instanceof ApiError && reason.status === 401) expire();
      else setError(reason instanceof Error ? reason.message : "Could not delete this tile. Please retry.");
    } finally { deleting.current = false; setBusy(false); }
  }
  async function applyTile(tile: TileAssetView) {
    if (!tile.imageUrl) return;
    setApplyError(null); setBusy(true);
    try {
      // Fail visibly before replacing the current floor if signed image access
      // expired or the uploaded image cannot be decoded by this browser.
      await new Promise<void>((resolve, reject) => {
        const image = new Image(); image.referrerPolicy = "no-referrer";
        const timer = setTimeout(() => {
          image.onload = image.onerror = null;
          image.src = "";
          reject(Error("Image loading timed out. Refresh the library and retry Apply."));
        }, 15_000);
        image.onload = () => { clearTimeout(timer); resolve(); };
        image.onerror = () => { clearTimeout(timer); reject(Error("Image could not be loaded. Refresh the library and retry Apply.")); };
        image.src = tile.imageUrl!;
      });
      apply(tile.id); onClose();
    } catch (reason) { setApplyError(reason instanceof Error ? reason.message : "Could not apply this image."); }
    finally { setBusy(false); }
  }
  if (!open) return null;
  return createPortal(<dialog ref={dialog} className="tile-library-dialog" aria-labelledby="tile-library-title" onCancel={event => { event.preventDefault(); if (!busy && !uploadBusy) onClose(); }}>
    <header className="tile-library-header"><div><span className="tile-eyebrow">Your materials</span><h2 id="tile-library-title">Tile Library</h2></div><button type="button" className="hud-button" disabled={busy || uploadBusy} onClick={onClose} aria-label="Close tile library">Close</button></header>
    {checking ? <p role="status">Opening your library…</p> : unavailable ? <button className="hud-button" onClick={()=>setSessionAttempt(v=>v+1)}>Retry My Tiles</button> : authenticated ? <>
      <div className="tile-library-toolbar"><span>Uploaded Tiles{demoMode&&<small> · Demo mode</small>}</span><div><button className="hud-button" disabled={busy || uploadBusy || loading} onClick={() => void load()}>{loading ? "Refreshing…" : "Refresh library"}</button>{!demoMode&&<button className="hud-button" disabled={busy || uploadBusy} onClick={logout}>Lock library</button>}</div></div>
      <div className="tile-library-columns">
        <TileUploadForm disabled={busy || loading} onSaved={tile => publish([tile, ...tiles.filter(t => t.id !== tile.id)])} onExpired={expire} onBusy={setUploadBusy} />
        <section className="saved-tile-library" aria-label="Saved uploaded tiles">
          <h3>Saved Tiles <span>({tiles.length})</span></h3>
          {loading && <p role="status">Loading tiles…</p>}
          {!loading && !tiles.length && <div className="tile-library-empty">Add your first tile to see it at real scale in the room.</div>}
          <div className="saved-tile-grid">{tiles.map(tile => <article className="saved-tile-card" key={tile.id}>
            <TileImage tile={tile} />
            <h4>{tile.name}</h4><p>{mmToCm(tile.width_mm)} × {mmToCm(tile.height_mm)} cm</p>
            <p>{tile.material_type} · {tile.finish[0].toUpperCase() + tile.finish.slice(1)}</p>
            {tile.imageError && <p className="tile-error">{tile.imageError}</p>}
            <div><button className="hud-button hud-button-primary" disabled={!tile.imageUrl || busy || uploadBusy || loading} onClick={() => void applyTile(tile)}>{selected === tile.id ? "Apply again" : "Apply"}</button><button className="hud-button tile-delete" disabled={busy || uploadBusy || loading} onClick={() => void remove(tile)}>Delete</button></div>
          </article>)}</div>
        </section>
      </div>
      <p className="tile-fidelity-note">Material appearance is representative. Confirm final color and finish against an approved physical sample.</p>
    </> : <form className="tile-access-form" onSubmit={login}>
      <h3>Unlock your tile library</h3><p>Enter the operator access code to add and manage saved tiles.</p>
      <label>Access code<input type="password" required maxLength={512} autoComplete="off" value={code} onChange={e => setCode(e.target.value)} /></label>
      <button className="hud-button hud-button-primary" disabled={busy || !code} type="submit">{busy ? "Checking…" : "Unlock library"}</button>
    </form>}
    {error && <p className="tile-error" role="alert">{error}</p>}
    {applyError && <p className="tile-error" role="alert">{applyError}</p>}
  </dialog>, document.body);
}
