import { PhysicalSizeEditor } from './PhysicalSizeEditor';
import { effectiveProduct } from '../tiles/physicalSize';
import { ImageQuality } from './ImageQuality';
import { useState } from "react";
import { FLOOR_CERAMICS, getProductById } from "../catalog/materials";
import type { MaterialFinish } from "../catalog/types";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { useFloorDesignStore } from "../state/useFloorDesignStore";
import { TileLibrary } from "./TileLibrary";
import { useTileProducts } from "../tiles/useTileProducts";
import { selectSimpleMaterial } from "../state/selectSimpleMaterial";
import { CeramicThumbnail } from "./CeramicThumbnail";

const FINISH_LABEL: Record<MaterialFinish, string> = {
  polished: "Polished",
  matte: "Matte",
  satin: "Satin",
  honed: "Honed",
};

/** Screen UI panel for picking a floor ceramic. Swapping the selection
 * replaces the floor material instantly without reloading the room. Docked
 * to the lower-right rather than spanning the bottom of the screen, so the
 * floor — the actual product being demonstrated — stays the visual focus.
 * Collapses to a small edge tab so it can be fully cleared from view. */
export function CeramicCatalog() {
  const designEnabled = useFloorDesignStore(s=>s.enabled);
  const simpleMaterial = useFloorDesignStore(s=>s.setEnabled);
  const products = useTileProducts();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const selectedFloorId = useConfiguratorStore((s) => s.selectedFloorId);
  const previousFloorId = useConfiguratorStore((s) => s.previousFloorId);
  const compareActive = useConfiguratorStore((s) => s.compareActive);

  const toggleCompare = useConfiguratorStore((s) => s.toggleCompare);

  const [isOpen, setIsOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= 640));

  const selected = getProductById(selectedFloorId, products) ?? FLOOR_CERAMICS[0];
  const previous = previousFloorId ? getProductById(previousFloorId, products) : undefined;
  // Whichever product is actually on the floor right now — the previous one
  // while Compare is active, otherwise the real selection.
  const sizeOverride=useConfiguratorStore(s=>s.compareActive&&s.previousFloorId?s.previousPhysicalOverride:s.physicalOverride);
  const displayed = effectiveProduct(compareActive && previous ? previous : selected,sizeOverride);

  if (!isOpen) {
    return (
      <>
      <TileLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <button className="catalog-tab" onClick={() => setIsOpen(true)} aria-label="Open ceramic catalog">
        <span className="catalog-tab-icon" aria-hidden>
          ◧
        </span>
        <span>Materials</span>
      </button>
      </>
    );
  }

  return (
    <>
    <TileLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} />
    <div className="catalog-panel">
      <div className="catalog-header">
        <div className="catalog-header-titles">
          <h2>Choose Floor Ceramic</h2>
          <div className="selected-info">
            <span className="selected-name">{displayed.name}</span>
            <span className="selected-meta">
              {displayed.source==='upload'?'My Tiles':displayed.code} · {displayed.tileWidth} × {displayed.tileHeight} cm · {displayed.productKind==='slab'?'Slab':'Tile'}
              {displayed.finish ? ` · ${FINISH_LABEL[displayed.finish]}` : ""}
            </span>
          </div>
          <ImageQuality product={displayed}/>
        </div>
        <button
          className="drawer-toggle"
          onClick={() => setIsOpen(false)}
          aria-label="Collapse materials"
          aria-expanded={true}
        >
          ✕
        </button>
      </div>

      {previous && (
        <button
          className={`hud-button compare-button${compareActive ? " active" : ""}`}
          disabled={designEnabled}
          onClick={toggleCompare}
          title={designEnabled ? "Use Simple material mode to compare floor materials." : `Compare with ${previous.name}`}
        >
          {compareActive ? `Comparing with ${selected.name}` : `Compare with ${previous.name}`}
        </button>
      )}

      {designEnabled&&<div className="catalog-design-note">Floor Design is active. Set its tiles in the design panel. <button className="hud-button" onClick={()=>{simpleMaterial(false);useConfiguratorStore.setState({compareActive:false});}}>Simple material / Compare</button></div>}
      {!designEnabled&&!compareActive&&<PhysicalSizeEditor key={selected.id} product={selected} override={sizeOverride} onChange={physicalOverride=>useConfiguratorStore.setState({physicalOverride})} onSaved={id=>useConfiguratorStore.getState().setSelectedFloorId(id)}/> }
      <button className="hud-button tile-library-button" onClick={() => setLibraryOpen(true)}>My Tiles · Add Tile</button>
      <div className="catalog-cards">
        {products.map((product) => {
          const active = product.id === displayed.id;
          return (
            <button
              key={product.id}
              className={`ceramic-card${active ? " active" : ""}`}
              onClick={() => selectSimpleMaterial(product.id)}
              aria-pressed={active}
            >
              <CeramicThumbnail product={product} />
              <div className="ceramic-card-info">
                <span className="ceramic-name">{product.name}</span>
                <span className="ceramic-code">{product.source==='upload'?'My Tiles':product.code}</span>
                <span className="ceramic-size">
                  {product.tileWidth} × {product.tileHeight} cm · {product.productKind==='slab'?'Slab':'Tile'}
                  {product.finish ? ` · ${FINISH_LABEL[product.finish]}` : ""}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}
