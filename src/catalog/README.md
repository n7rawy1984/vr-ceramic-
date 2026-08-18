# Adding a new ceramic product

The catalog is the single source of truth for materials — the room, floor,
and every UI (desktop cards, the VR materials panel) all read from it. You
never need to touch scene or UI code to add a product.

## 1. Place the texture files

Drop the color (albedo) JPG in `/public/textures/ceramics/`, e.g.:

```
public/textures/ceramics/ceramic-04.jpg
```

Optionally add a normal map and/or roughness map next to it (any filename),
and a catalog-card thumbnail in `/public/textures/thumbnails/`. None of
these are required — see step 3.

## 2. Add the metadata

Append an entry to `FLOOR_CERAMICS` in `materials.ts`:

```ts
{
  id: "ceramic-04",
  name: "Honed Basalt",
  code: "CR-004",
  category: "floor",
  tileWidth: 60,   // cm — real physical tile width
  tileHeight: 60,  // cm — real physical tile height
  texture: "/textures/ceramics/ceramic-04.jpg",
  thumbnail: "/textures/thumbnails/ceramic-04.jpg",
  baseColor: "#4a4a4c",       // used by the procedural fallback + as a tint
  proceduralStyle: "darkstone", // "marble" | "travertine" | "darkstone"
  groutWidth: 0.3,   // cm
  groutColor: "#2a2a2a",
  roughnessValue: 0.5,  // 0 = mirror, 1 = fully matte — ignored if roughnessTexture is set
  finish: "satin",      // "polished" | "matte" | "satin" — shown in the UI
}
```

## 3. Physical sizing and optional maps

- `tileWidth`/`tileHeight` are in **centimeters** and directly drive how many
  times the texture repeats across the floor — a 60×120cm tile always
  covers 0.6×1.2 real meters, never stretched to fit the room.
- `normalTexture`/`roughnessTexture` are entirely optional. Omit them and
  the material falls back to a flat `roughnessValue`; add them later and
  the material picks them up automatically, no other changes needed.
- If `texture` fails to load (wrong path, not deployed yet), the app
  generates a demo texture from `proceduralStyle`/`baseColor` instead of
  breaking — useful for staging a product before photography is ready.

## 4. New categories

`CATALOG` in `materials.ts` is a `Record<MaterialCategory, MaterialProduct[]>`.
Adding a wall-ceramic, wood-flooring, or paint catalog later is:

```ts
export const CATALOG: Record<string, MaterialProduct[]> = {
  floor: FLOOR_CERAMICS,
  wall: WALL_CERAMICS, // new array, same MaterialProduct shape
};
```

No scene or UI component needs to change for this — they already read from
whichever array they're given.
