import { useMemo } from 'react';
import { FLOOR_CERAMICS } from '../catalog/materials';
import { useLocalTileLibrary } from './demoLibrary';
/** All active material pickers/renderers resolve exactly the same identities and URLs. */
export function useTileProducts() {
  const local=useLocalTileLibrary(s=>s.products);
  return useMemo(()=>[...FLOOR_CERAMICS,...local],[local]);
}
