import { useState } from "react";
import { FLOOR_CERAMICS, getProductById } from "../catalog/materials";
import type { MaterialFinish } from "../catalog/types";
import { useConfiguratorStore } from "../state/useConfiguratorStore";
import { TileLibrary } from "./TileLibrary";
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
  const uploadedProducts = useConfiguratorStore((s) => s.uploadedProducts);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const selectedFloorId = useConfiguratorStore((s) => s.selectedFloorId);
  const previousFloorId = useConfiguratorStore((s) => s.previousFloorId);
  const compareActive = useConfiguratorStore((s) => s.compareActive);
  const setSelectedFloorId = useConfiguratorStore((s) => s.setSelectedFloorId);
  const toggleCompare = useConfiguratorStore((s) => s.toggleCompare);

  const [isOpen, setIsOpen] = useState(() => (typeof window === "undefined" ? true : window.innerWidth >= 640));

  const selected = getProductById(selectedFloorId, uploadedProducts) ?? FLOOR_CERAMICS[0];
  const previous = previousFloorId ? getProductById(previousFloorId, uploadedProducts) : undefined;
  // Whichever product is actually on the floor right now — the previous one
  // while Compare is active, otherwise the real selection.
  const displayed = compareActive && previous ? previous : selected;

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
              {displayed.code} · {displayed.tileWidth} × {displayed.tileHeight} cm
              {displayed.finish ? ` · ${FINISH_LABEL[displayed.finish]}` : ""}
            </span>
          </div>
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
          onClick={toggleCompare}
          title={`Compare with ${previous.name}`}
        >
          {compareActive ? `Comparing with ${selected.name}` : `Compare with ${previous.name}`}
        </button>
      )}

      <button className="hud-button tile-library-button" onClick={() => setLibraryOpen(true)}>My Tiles · Add Tile</button>
      <div className="catalog-cards">
        {FLOOR_CERAMICS.map((product) => {
          const active = product.id === displayed.id;
          return (
            <button
              key={product.id}
              className={`ceramic-card${active ? " active" : ""}`}
              onClick={() => setSelectedFloorId(product.id)}
              aria-pressed={active}
            >
              <CeramicThumbnail product={product} />
              <div className="ceramic-card-info">
                <span className="ceramic-name">{product.name}</span>
                <span className="ceramic-code">{product.code}</span>
                <span className="ceramic-size">
                  {product.tileWidth} × {product.tileHeight} cm
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
