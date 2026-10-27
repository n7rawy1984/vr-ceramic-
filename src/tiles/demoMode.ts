/** Build-time public switch; contains no credentials and never enables server access. */
export const clientDemoMode = import.meta.env.VITE_PUBLIC_DEMO_MODE === "true";
