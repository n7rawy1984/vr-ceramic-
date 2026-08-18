import { useEffect, useState } from "react";
import { markDedicationSeen } from "../utils/dedicationSession";

const FADE_IN_MS = 900;
const HOLD_MS = 2600;
const FADE_OUT_MS = 900;

/**
 * A brief, cinematic full-screen dedication shown once before the showroom
 * appears. Purely a page-load moment — unrelated to and never repeated by
 * the WebXR/Enter VR flow. Sits above the loading screen (same dark family
 * of background) so there is never a blank or white frame while the 3D
 * scene keeps loading underneath it.
 */
export function Dedication({ onFinished }: { onFinished: () => void }) {
  const [entered, setEntered] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    markDedicationSeen();

    const raf = requestAnimationFrame(() => setEntered(true));
    const exitTimer = setTimeout(() => setExiting(true), FADE_IN_MS + HOLD_MS);
    const doneTimer = setTimeout(onFinished, FADE_IN_MS + HOLD_MS + FADE_OUT_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinished]);

  return (
    <div className={`dedication-overlay${exiting ? " exiting" : ""}`}>
      <div className="dedication-glow" aria-hidden="true" />
      <div
        className={`dedication-text${entered ? " entered" : ""}${exiting ? " exiting" : ""}`}
        dir="rtl"
        lang="ar"
      >
        <p className="dedication-line dedication-line-main">إلى هدير…</p>
        <p className="dedication-line">شكرًا لأن بعض الجمال يبدأ من شخص،</p>
        <p className="dedication-line">ولأن بعض الأثر الجميل يبقى أكثر مما نظن.</p>
      </div>
    </div>
  );
}
