/** Device-level cache of display preferences (read before first paint). User data lives in the database. */
export const STORAGE_KEY = "sadu-device-v2";
/** Pre-database storage: everything was kept in the browser. Read once to migrate into the account. */
export const LEGACY_STORAGE_KEY = "sadu-state-v1";

export const SESSION_COOKIE = "sadu_session";
/** Pages reachable before entering name + email (path after the locale). Everything else needs a session. */
export const PUBLIC_PATHS = ["/", "/start", "/language", "/privacy", "/faq", "/contact", "/accessibility", "/lab"];

/** Runs before first paint: applies saved theme / contrast / motion / text size to <html>. */
export const PREFS_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||localStorage.getItem(${JSON.stringify(
  LEGACY_STORAGE_KEY,
)})||"null");var p=s&&s.prefs;var r=document.documentElement;if(!p){if(window.matchMedia("(prefers-color-scheme: dark)").matches){r.classList.add("dark")}return}if(p.theme==="dark")r.classList.add("dark");if(p.contrast)r.classList.add("contrast");if(p.reduceMotion)r.classList.add("reduce-motion");if(p.textSize)r.dataset.textSize=String(p.textSize)}catch(e){}})();`;
