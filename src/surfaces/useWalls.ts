import { useMemo } from 'react';
import { useFloorDesignStore } from '../state/useFloorDesignStore';
import { useTileProducts } from '../tiles/useTileProducts';
import { layoutAsset } from '../layout/assets';
import { cachedWallCompile, wallSurface, type WallSurface } from './compiler';
import type { WallId } from './model';
export function useWall(id:WallId){
  const size=useFloorDesignStore(s=>s.roomSize),architecture=useFloorDesignStore(s=>s.architecture),design=useFloorDesignStore(s=>s.walls[id]);
  const products=useTileProducts();
  const surfaceKey=JSON.stringify(wallSurface(id,size,architecture));
  const surface=useMemo(()=>JSON.parse(surfaceKey) as WallSurface,[surfaceKey]);
  const result=useMemo(()=>design.enabled?cachedWallCompile(surface,design,products.map(layoutAsset)):null,[surface,design,products]);
  return {size,surface,design,products,result};
}
