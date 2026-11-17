(function initCoverLogoAnim() {
  const wrap = document.getElementById("cover-logo");
  if (!wrap) return;

  const STORAGE_KEY = "vitalcap-logo-intro-v5";
  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const played = window.sessionStorage.getItem(STORAGE_KEY) === "1";

  if (prefersReduced || played) {
    wrap.classList.add("logo-wrap--static");
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, "1");

  window.setTimeout(() => {
    wrap.classList.add("logo-wrap--done");
  }, 2200);
})();