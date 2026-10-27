import { createLocalTileRepository } from './localTileRepository.ts';
import { indexedTileStorage } from './localTileStorage.ts';
import { FLOOR_CERAMICS } from '../catalog/materials.ts';
import { useConfiguratorStore } from '../state/useConfiguratorStore.ts';
import { useFloorDesignStore } from '../state/useFloorDesignStore.ts';
/** Historical filename; the forced local library now persists prepared blobs on this device. */
export const localTileLibrary=createLocalTileRepository(indexedTileStorage(),tiles=>{
  const ids=new Set([...FLOOR_CERAMICS.map(t=>t.id),...tiles.map(t=>t.id)]);
  useConfiguratorStore.getState().reconcileAssetIds(ids);
  useFloorDesignStore.getState().reconcileAssets(ids);
});
export const useLocalTileLibrary=localTileLibrary.useLibrary;
export const saveDemoTile=localTileLibrary.save;
export const removeDemoTile=localTileLibrary.remove;
