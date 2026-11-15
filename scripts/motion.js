/* =====================================================================
   motion.js — editorial reveals and layered parallax
   (assets/references/04-micro-interaction-language.svg, 05-parallax-layering.svg)

   · Reveals: one per editorial moment (a section header, a quote, a figure group) — never every element.
     Content is visible by default; it is only hidden-then-revealed once this script has run
     and the reader has not asked for reduced motion.
   · Parallax: decorative .layer images inside [data-parallax] scenes. The script only writes one
     custom property (--p, about −1…1, the scene's position in the viewport); CSS turns it into a
     small per-layer offset (sky 0.15× … foreground 0.8× of the page's speed).
     Text, buttons, the map and the itinerary are never inside a parallax scene. Scrolling is not altered.
   ===================================================================== */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;
  const root = document.documentElement;

  /* ---------------------------------------------------------------- reveals */
  const REVEAL = [
    ".cover-grid > div", ".cover-index", ".ownership-strip .own-grid", ".diamond-wrap",
    ".stage-open > div:not(.scene)", ".block > header", ".pull", ".reflection-quote", ".statement",
    ".hmw-band", ".closing", ".fragments", ".personas4", ".triptych", ".walk", ".directions",
    ".specimens", ".considerations", ".hybrid-flow", ".overview-trio", ".proto-head"
  ].join(",");
  root.classList.add("motion");
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }) : null;
  function arm(scope) {
    (scope || document).querySelectorAll(REVEAL).forEach((el) => {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal");
      // anything already on screen (or above it) shows at once — no waiting for content that is already in view
      const r = el.getBoundingClientRect();
      if (!io || r.top < window.innerHeight * 0.92) { el.classList.add("is-in"); return; }
      io.observe(el);
    });
  }
  // stage panels are shown and hidden by documentation.js; arm each one as it becomes visible
  arm();
  new MutationObserver((muts) => {
    muts.forEach((m) => { if (m.attributeName === "hidden" && !m.target.hidden) requestAnimationFrame(() => arm(m.target)); });
  }).observe(document.getElementById("stages") || document.body, { attributes: true, subtree: true, attributeFilter: ["hidden"] });

  /* ---------------------------------------------------------------- parallax */
  const scenes = () => document.querySelectorAll("[data-parallax]");
  let ticking = false;
  function update() {
    ticking = false;
    const vh = window.innerHeight;
    scenes().forEach((s) => {
      const r = s.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100 || !r.height) return;          // off screen: leave it alone
      const p = ((r.top + r.height / 2) - vh / 2) / vh;                         // ~ −1 (above) … 1 (below)
      s.style.setProperty("--p", Math.max(-1.2, Math.min(1.2, p)).toFixed(3));
    });
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("click", () => setTimeout(onScroll, 60));   // stage changes move scenes into view
  update();

  // if the reader switches reduced motion on mid-visit, stop at once
  reduce.addEventListener && reduce.addEventListener("change", (e) => {
    if (!e.matches) return;
    window.removeEventListener("scroll", onScroll);
    root.classList.remove("motion");
    scenes().forEach((s) => s.style.removeProperty("--p"));
  });
})();
