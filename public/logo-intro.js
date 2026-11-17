(function initCoverLogoAnim() {
  const wrap = document.getElementById("cover-logo");
  if (!wrap) return;

  const STORAGE_KEY = "vitalcap-logo-intro-v1";
  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const played = window.sessionStorage.getItem(STORAGE_KEY) === "1";

  if (prefersReduced || played) {
    wrap.classList.add("logo-wrap--static");
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, "1");

  /* After connect beat, settle on the raster logo for pixel-perfect brand match */
  window.setTimeout(() => {
    wrap.classList.add("logo-wrap--done");
  }, 3200);
})();