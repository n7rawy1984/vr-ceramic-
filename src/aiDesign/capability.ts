/** Vite injects only this non-secret boolean. No configuration request at startup. */
declare const __AI_DESIGN_ENABLED__:boolean;
export const aiDesignEnabled=typeof __AI_DESIGN_ENABLED__!=='undefined'&&__AI_DESIGN_ENABLED__;
