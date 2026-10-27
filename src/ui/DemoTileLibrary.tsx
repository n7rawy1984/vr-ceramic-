import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { removeDemoTile, useDemoLibrary } from "../tiles/demoLibrary";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { mmToCm } from "../utils/units";
import { TileUploadForm } from "./TileUploadForm";
import { tileToProduct } from "../tiles/materialAdapter";

export function DemoTileLibrary({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tiles = useDemoLibrary(s => s.tiles);
  const apply = useConfiguratorStore(s => s.setSelectedFloorId);
  const setProducts = useConfiguratorStore(s => s.setUploadedProducts);
  useEffect(() => { setProducts(tiles.map(tileToProduct)); }, [tiles, setProducts]);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, [open]);
  if (!open) return null;
  return createPortal(<dialog ref={dialog} className="tile-library-dialog" aria-labelledby="demo-library-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="tile-library-header"><div><span className="tile-eyebrow">Your materials</span><h2 id="demo-library-title">My Tiles</h2></div><button className="hud-button" onClick={onClose} aria-label="Close tile library">Close</button></header>
    <p className="tile-help">Demo uploads are kept for this session.</p>
    <div className="tile-library-columns">
      <TileUploadForm localOnly onSaved={() => {}} onExpired={() => {}} onBusy={() => {}} />
      <section className="saved-tile-library" aria-label="Saved uploaded tiles">
        <h3>Saved Tiles <span>({tiles.length})</span></h3>
        {!tiles.length && <div className="tile-library-empty">Add your first tile to see it at real scale in the room.</div>}
        <div className="saved-tile-grid">{tiles.map(tile => <article className="saved-tile-card" key={tile.id}>
          <img src={tile.imageUrl!} alt={tile.name} />
          <h4>{tile.name}</h4><p>{mmToCm(tile.width_mm)} × {mmToCm(tile.height_mm)} cm</p>
          <p>{tile.material_type} · {tile.finish[0].toUpperCase() + tile.finish.slice(1)}</p>
          <div><button className="hud-button hud-button-primary" onClick={() => { apply(tile.id); onClose(); }}>Apply</button><button className="hud-button tile-delete" onClick={() => { if (window.confirm(`Delete “${tile.name}”?`)) removeDemoTile(tile.id); }}>Delete</button></div>
        </article>)}</div>
      </section>
    </div>
  </dialog>, document.body);
}
