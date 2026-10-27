import { DemoTileLibrary } from "./DemoTileLibrary";

/** Presentation build: always local; protected implementation is preserved separately. */
export function TileLibrary({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <DemoTileLibrary open={open} onClose={onClose} />;
}
