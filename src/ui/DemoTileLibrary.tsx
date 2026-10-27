import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { removeDemoTile, useLocalTileLibrary, localTileLibrary } from "../tiles/demoLibrary";
import { selectSimpleMaterial } from "../state/selectSimpleMaterial";
import { mmToCm } from "../utils/units";
import { TileUploadForm } from "./TileUploadForm";

export function DemoTileLibrary({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tiles = useLocalTileLibrary(s => s.tiles);
  const apply = selectSimpleMaterial;
  const status=useLocalTileLibrary(s=>s.status);
  const storageError=useLocalTileLibrary(s=>s.error);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, [open]);
  async function remove(id:string) {
    if(!window.confirm("Delete this tile from this device?"))return;
    setBusy(true);setError("");
    try{await removeDemoTile(id);}catch(reason){setError(reason instanceof Error?reason.message:"Could not delete this tile.");}finally{setBusy(false);}
  }
  if (!open) return null;
  return createPortal(<dialog ref={dialog} className="tile-library-dialog" aria-labelledby="demo-library-title" onCancel={event => { event.preventDefault(); if(!busy)onClose(); }}>
    <header className="tile-library-header"><div><span className="tile-eyebrow">Your materials</span><h2 id="demo-library-title">My Tiles</h2></div><button className="hud-button" disabled={busy} onClick={onClose} aria-label="Close tile library">Close</button></header>
    <p className="tile-help">Saved on this device.</p>
    {(storageError||error)&&<p className="tile-error" role="alert">{error||storageError}</p>}
    {status==='error'&&<button className="hud-button" onClick={()=>void localTileLibrary.hydrate()}>Retry My Tiles</button>}
    <div className="tile-library-columns">
      <TileUploadForm localOnly disabled={busy||status!=="ready"} onSaved={() => {}} onExpired={() => {}} onBusy={setBusy} />
      <section className="saved-tile-library" aria-label="Saved uploaded tiles">
        <h3>Saved Tiles <span>({tiles.length})</span></h3>
        {!tiles.length && <div className="tile-library-empty">Add your first tile to see it at real scale in the room.</div>}
        <div className="saved-tile-grid">{tiles.map(tile => <article className="saved-tile-card" key={tile.id}>
          <img src={tile.imageUrl!} alt={tile.name} />
          <h4>{tile.name}</h4><p>{mmToCm(tile.width_mm)} × {mmToCm(tile.height_mm)} cm</p>
          <p>{tile.material_type} · {tile.finish[0].toUpperCase() + tile.finish.slice(1)}</p>
          <div><button className="hud-button hud-button-primary" disabled={busy} onClick={() => { apply(tile.id); onClose(); }}>Apply</button><button className="hud-button tile-delete" disabled={busy} onClick={() => void remove(tile.id)}>Delete</button></div>
        </article>)}</div>
      </section>
    </div>
  </dialog>, document.body);
}
