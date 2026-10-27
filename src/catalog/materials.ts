import type { MaterialProduct } from "./types.ts";

/**
 * Demo product catalog. This is the only place ceramic products are defined —
 * new products (or entire new categories such as "wall" or "wood") are added
 * here without touching scene/UI code. Designed to scale to hundreds of SKUs;
 * swap this static array for a fetch from a real catalog service later.
 */
export const FLOOR_CERAMICS: MaterialProduct[] = [
  {
    id: "ceramic-01",
    name: "Carrara White",
    code: "CR-001",
    category: "floor",
    tileWidth: 60,
    tileHeight: 120,
    texture: "/textures/ceramics/ceramic-01.jpg",
    thumbnail: "/textures/thumbnails/ceramic-01.jpg",
    baseColor: "#f2ede3",
    proceduralStyle: "marble",
    groutWidth: 0.4,
    groutColor: "#bdb7ab",
    roughnessValue: 0.28,
    finish: "polished",
  },
  {
    id: "ceramic-02",
    name: "Travertine Beige",
    code: "CR-002",
    category: "floor",
    tileWidth: 60,
    tileHeight: 60,
    texture: "/textures/ceramics/ceramic-02.jpg",
    thumbnail: "/textures/thumbnails/ceramic-02.jpg",
    baseColor: "#cdb18a",
    proceduralStyle: "travertine",
    groutWidth: 0.4,
    groutColor: "#a98f6b",
    roughnessValue: 0.82,
    finish: "matte",
  },
  {
    id: "ceramic-03",
    name: "Dark Stone",
    code: "CR-003",
    category: "floor",
    tileWidth: 80,
    tileHeight: 80,
    texture: "/textures/ceramics/ceramic-03.jpg",
    thumbnail: "/textures/thumbnails/ceramic-03.jpg",
    baseColor: "#524f49",
    proceduralStyle: "darkstone",
    groutWidth: 0.4,
    groutColor: "#332f2c",
    roughnessValue: 0.42,
    finish: "satin",
  },
];

/** Placeholder for future categories (wall ceramics, wood flooring, paint, ...). */
export const CATALOG: Record<string, MaterialProduct[]> = {
  floor: FLOOR_CERAMICS,
};

export function getProductById(id: string, uploaded: MaterialProduct[] = []): MaterialProduct | undefined {
  return FLOOR_CERAMICS.find((p) => p.id === id) ?? uploaded.find((p) => p.id === id);
}
