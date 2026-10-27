import { test } from "node:test";
import assert from "node:assert/strict";
import { saveDemoTile, removeDemoTile, useDemoLibrary } from "../src/tiles/demoLibrary.ts";
import { tileToProduct } from "../src/tiles/materialAdapter.ts";
import { layoutAsset } from "../src/layout/assets.ts";

test("session library owns prepared image URLs and preserves real tile dimensions without network", async () => {
  const fetch = globalThis.fetch;
  globalThis.fetch = () => { throw Error("Demo must not use the network"); };
  try {
    const tile = saveDemoTile({ blob: new Blob(["prepared pixels"], { type: "image/png" }), name: "Session tile", filename: "tile.png", widthMm: 600, heightMm: 600, materialType: "Porcelain", finish: "satin", rotation: 90, crop: { x: .1, y: 0, width: .9, height: 1 } });
    assert.match(tile.imageUrl!, /^blob:/);
    assert.equal(tile.imageUrlExpiresAt, null);
    assert.equal(tile.storage_path, "");
    assert.equal(useDemoLibrary.getState().tiles[0], tile);
    const product = tileToProduct(tile);
    assert.deepEqual(product.physicalSizeMm, { width: 600, height: 600 });
    assert.equal(product.textureRotationDeg, 0, "prepared rotation is not applied twice");
    assert.equal(layoutAsset(product).widthMm, 600);
    assert.equal(layoutAsset(product).heightMm, 600);
    removeDemoTile(tile.id);
    assert.deepEqual(useDemoLibrary.getState().tiles, []);
    await assert.rejects(fetch(tile.imageUrl!), /fetch failed/, "removed tile URL is revoked");
  } finally { globalThis.fetch = fetch; }
});
test("invalid demo metadata cannot enter the installation pipeline", () => {
  const input = { blob: new Blob(["image"], { type: "image/webp" }), name: "Tile", filename: "tile.webp", widthMm: 600, heightMm: 600, materialType: "Ceramic", finish: "matte" as const, rotation: 0, crop: null };
  for (const changes of [{widthMm: 0}, {heightMm: NaN}, {name: " "}, {rotation: 45}, {blob: new Blob(["bad"], {type: "text/html"})}]) assert.throws(() => saveDemoTile({...input, ...changes}));
  assert.equal(useDemoLibrary.getState().tiles.length, 0);
});
