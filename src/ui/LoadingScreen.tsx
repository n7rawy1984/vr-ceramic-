import { BRAND } from "../config/brand";

/** Branded splash shown until the first frame of the 3D scene is ready, so
 * the customer never sees a blank canvas while the room initializes. */
export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-mark">{BRAND.name}</div>
      <div className="loading-text">Preparing your showroom…</div>
      <div className="loading-bar">
        <div className="loading-bar-fill" />
      </div>
    </div>
  );
}
