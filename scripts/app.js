/* =====================================================================
   app.js — small shared helpers used by documentation.js and prototype.js
   ===================================================================== */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** Escape user-supplied text before inserting it as HTML. */
  function esc(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /** Indian-format rupee string, e.g. 12500 → "₹12,500". */
  function inr(n) {
    const v = Math.round(n);
    return "₹" + v.toLocaleString("en-IN");
  }

  /** localStorage can be missing or throw (sandboxed frames, privacy modes). */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
    }
  };

  const reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** A polite live region for announcements that aren't otherwise visible to AT. */
  let live;
  function announce(msg) {
    if (!live) {
      live = document.createElement("div");
      live.className = "sr-only";
      live.setAttribute("aria-live", "polite");
      document.body.appendChild(live);
    }
    live.textContent = "";
    setTimeout(() => { live.textContent = msg; }, 30);
  }

  function scrollToEl(el, offset = 0) {
    if (!el) return;
    const header = document.querySelector(".site-header");
    const h = header ? header.getBoundingClientRect().height : 0;
    const y = el.getBoundingClientRect().top + window.scrollY - h - 16 - offset;
    window.scrollTo({ top: Math.max(0, y), behavior: reducedMotion() ? "auto" : "smooth" });
  }

  window.TP = { $, $$, esc, inr, store, reducedMotion, announce, scrollToEl };
})();
