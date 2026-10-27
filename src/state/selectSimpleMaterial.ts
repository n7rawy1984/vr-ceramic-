import { useFloorDesignStore } from './useFloorDesignStore.ts';
import { useConfiguratorStore } from './useConfiguratorStore.ts';
/** Catalog selection explicitly owns the render mode; Room presentation alone does not. */
export function selectSimpleMaterial(id: string) {
  const design=useFloorDesignStore.getState();
  design.setEnabled(false);design.closePanel();
  useConfiguratorStore.getState().setSelectedFloorId(id);
}
