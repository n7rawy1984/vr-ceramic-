/** sessionStorage key gating the opening dedication to once per browser
 * session. To preview it again during development, run in the console:
 *   sessionStorage.removeItem("dedicationSeen")
 * then reload the page. */
const SESSION_KEY = "dedicationSeen";

/** Whether the one-time opening dedication should be shown this session. */
export function shouldShowDedication(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== "true";
  } catch {
    // Storage unavailable (e.g. strict privacy mode) — fail open and show it.
    return true;
  }
}

export function markDedicationSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, "true");
  } catch {
    // Nothing to do — worst case it shows again next load.
  }
}
