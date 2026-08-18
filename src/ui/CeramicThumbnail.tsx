import { useMemo, useState } from "react";
import type { MaterialProduct } from "../catalog/types";
import { generateCeramicCanvas } from "../textures/generateCeramicTexture";

/**
 * Renders a product's real thumbnail from /public if present; otherwise
 * falls back to a small generated swatch matching its procedural texture.
 */
export function CeramicThumbnail({ product }: { product: MaterialProduct }) {
  const [failed, setFailed] = useState(false);

  const fallbackSrc = useMemo(() => {
    const canvas = generateCeramicCanvas(product.proceduralStyle, product.tileWidth, product.tileHeight, 128);
    return canvas.toDataURL("image/png");
  }, [product]);

  return (
    <img
      className="ceramic-thumb"
      src={failed ? fallbackSrc : product.thumbnail ?? fallbackSrc}
      alt={product.name}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
