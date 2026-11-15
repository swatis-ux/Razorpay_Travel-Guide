/* =====================================================================
   documentation.js — case-study behaviour
   Tabs (Double Diamond stages), hash routing, section TOCs with scroll-spy,
   tooltips, accordions helpers, matrix/log filters, IA tree, checklist.
   ===================================================================== */
(function () {
  "use strict";
  const { $, $$, store, scrollToEl, announce } = window.TP;

  const STAGES = ["discover", "define", "develop", "deliver"];
  const tabs = $$(".stage-tab");
  const panels = STAGES.map((s) => document.getElementById("panel-" + s));
  const stagesTop = document.getElementById("stages");
  const scrollMemory = {};          // remembers reading position per stage
  const visited = new Set(store.get("tp-visited", []));
  let current = null;

  /* ---------------------------------------------------------------- stage switching */
  function showStage(stage, opts = {}) {
    if (!STAGES.includes(stage)) return;
    const prev = current;
    if (prev && prev !== stage) scrollMemory[prev] = window.scrollY;

    tabs.forEach((t) => {
      const on = t.dataset.stage === stage;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle("done", visited.has(t.dataset.stage) && !on);
    });
    panels.forEach((p) => {
      const on = p.dataset.stage === stage;
      p.hidden = !on;
      if (on && prev !== stage) { p.classList.remove("panel-enter"); void p.offsetWidth; p.classList.add("panel-enter"); }
    });
    $$("#diamondSvg .dz").forEach((g) => g.classList.toggle("active", g.dataset.go === stage));
    const fill = document.getElementById("progressFill");
    if (fill) fill.style.width = (STAGES.indexOf(stage) + 1) * 25 + "%";

    visited.add(stage);
    store.set("tp-visited", Array.from(visited));
    current = stage;

    if (opts.updateHash !== false && location.hash.slice(1) !== stage) {
      // only plain #name hashes, per hosting constraints
      history.replaceState ? history.replaceState(null, "", "#" + stage) : (location.hash = stage);
    }

    if (opts.target) {
      requestAnimationFrame(() => scrollToEl(document.getElementById(opts.target)));
    } else if (opts.scroll === "top") {
      requestAnimationFrame(() => scrollToEl(stagesTop));
    } else if (opts.scroll === "restore" && scrollMemory[stage] != null && prev !== stage) {
      requestAnimationFrame(() => window.scrollTo({ top: scrollMemory[stage] }));
    } else if (prev && prev !== stage) {
      requestAnimationFrame(() => {
        if (stagesTop.getBoundingClientRect().top < 0) scrollToEl(stagesTop);
      });
    }
    if (prev !== stage) announce("Showing stage: " + stage);
    refreshSpy();
  }

  // Tab clicks + roving keyboard focus (Left/Right/Home/End)
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => showStage(tab.dataset.stage, { scroll: "restore" }));
    tab.addEventListener("keydown", (e) => {
      let n = null;
      if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") n = 0;
      if (e.key === "End") n = tabs.length - 1;
      if (n != null) { e.preventDefault(); tabs[n].focus(); showStage(tabs[n].dataset.stage, { scroll: "restore" }); }
    });
  });

  // Anything with data-go switches stage (diamond, "next stage" buttons)
  document.addEventListener("click", (e) => {
    const go = e.target.closest("[data-go]");
    if (go) { e.preventDefault(); showStage(go.dataset.go, { scroll: "top" }); return; }
    const jump = e.target.closest("[data-jump]");
    if (jump) { e.preventDefault(); showStage(jump.dataset.jump, { target: jump.dataset.target }); return; }
    const proto = e.target.closest("[data-go-prototype]");
    if (proto) { e.preventDefault(); showStage("deliver", { target: "prototype" }); return; }
    const back = e.target.closest("[data-back-to-case]");
    if (back) { e.preventDefault(); scrollToEl(document.getElementById("l-walk")); return; }
    const pj = e.target.closest("[data-proto-jump]");
    if (pj) {
      e.preventDefault();
      showStage("deliver", { target: "prototype" });
      if (window.Prototype) window.Prototype.jump(pj.dataset.protoJump);
    }
  });
  $$("#diamondSvg .dz").forEach((g) => {
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showStage(g.dataset.go, { scroll: "top" }); }
    });
  });

  /* ---------------------------------------------------------------- hash routing */
  function routeFromHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (!h) return false;
    if (STAGES.includes(h)) { showStage(h, { updateHash: false, scroll: "top" }); return true; }
    if (h === "prototype") { showStage("deliver", { updateHash: false, target: "prototype" }); return true; }
    const el = document.getElementById(h);
    if (el) {
      const panel = el.closest(".stage-panel");
      if (panel) { showStage(panel.dataset.stage, { updateHash: false, target: h }); return true; }
    }
    return false;
  }
  window.addEventListener("hashchange", routeFromHash);

  /* ---------------------------------------------------------------- per-stage contents + scroll-spy */
  const spyLinks = new Map();
  panels.forEach((panel) => {
    const blocks = $$(".block[id]", panel).filter((b) => b.querySelector("h2"));
    const nav = $(".toc", panel);
    const mob = $(".toc-mobile", panel);
    const ol = document.createElement("ol");
    const sel = document.createElement("select");
    sel.setAttribute("aria-label", "Jump to a section");
    sel.innerHTML = '<option value="">On this page…</option>';
    blocks.forEach((b) => {
      const title = b.querySelector("h2").textContent.replace(/\s+/g, " ").trim();
      const eyebrow = b.querySelector(".kicker") || b.querySelector(".eyebrow");
      const label = eyebrow ? eyebrow.textContent.split("·").pop().trim() : title;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + b.id;
      a.textContent = label;
      a.title = title;
      a.addEventListener("click", (e) => { e.preventDefault(); scrollToEl(b); history.replaceState && history.replaceState(null, "", "#" + b.id); });
      li.appendChild(a);
      ol.appendChild(li);
      spyLinks.set(b, a);
      const o = document.createElement("option");
      o.value = b.id; o.textContent = label;
      sel.appendChild(o);
    });
    if (nav) { const h = document.createElement("h4"); h.textContent = "In this stage"; nav.append(h, ol); }
    if (mob) { mob.appendChild(sel); sel.addEventListener("change", () => { const t = document.getElementById(sel.value); if (t) scrollToEl(t); sel.value = ""; }); }
  });

  let spyObserver;
  function refreshSpy() {
    if (!("IntersectionObserver" in window)) return;
    if (spyObserver) spyObserver.disconnect();
    spyObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const panel = en.target.closest(".stage-panel");
          $$(".toc a", panel).forEach((a) => a.classList.remove("current"));
          const a = spyLinks.get(en.target);
          if (a) a.classList.add("current");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    const p = document.getElementById("panel-" + current);
    if (p) $$(".block[id]", p).forEach((b) => spyLinks.has(b) && spyObserver.observe(b));
  }

  /* ---------------------------------------------------------------- tooltips (hover, focus, tap) */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".tip-btn");
    $$(".tip.open").forEach((t) => { if (!btn || !t.contains(btn)) t.classList.remove("open"); });
    if (btn) btn.parentElement.classList.toggle("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".tip.open").forEach((t) => t.classList.remove("open"));
  });

  /* ---------------------------------------------------------------- persona matrix */
  const LEVELS = { "Low": 1, "Low–medium": 1.5, "Medium": 2, "Medium–high": 2.5, "High": 3, "High / variable": 3, "Very high": 4 };
  $$("#personaMatrix td[data-lvl]").forEach((td) => {
    const label = td.dataset.lvl;
    const v = LEVELS[label] || 0;
    let dots = "";
    for (let i = 1; i <= 4; i++) {
      const cls = v >= i ? "on" : v >= i - 0.5 ? "half" : "";
      dots += `<b class="${cls}"></b>`;
    }
    td.innerHTML = `<span class="lvl"><i aria-hidden="true">${dots}</i><small>${label}</small></span>`;
  });

  function pressGroup(btns, active) { btns.forEach((b) => b.setAttribute("aria-pressed", b === active ? "true" : "false")); }

  const mBtns = $$("[data-matrix-filter]");
  mBtns.forEach((b) => b.addEventListener("click", () => {
    pressGroup(mBtns, b);
    const f = b.dataset.matrixFilter;
    const show = f === "all" ? ["a", "b", "c", "d"] : f === "selected" ? ["a", "c"] : [f];
    $$("#personaMatrix [data-col]").forEach((c) => {
      const on = show.includes(c.dataset.col);
      c.style.opacity = on ? "" : ".28";
      c.classList.toggle("col-hl", f !== "all" && on);
    });
    $$("[data-persona]").forEach((p) => { p.style.opacity = show.includes(p.dataset.persona) ? "" : ".4"; });
  }));

  /* ---------------------------------------------------------------- synthesis chains */
  const cBtns = $$("[data-chain]");
  cBtns.forEach((b) => b.addEventListener("click", () => {
    cBtns.forEach((x) => { const on = x === b; x.setAttribute("aria-pressed", on); x.setAttribute("aria-selected", on); });
    $$("[data-chain-panel]").forEach((p) => { p.hidden = p.dataset.chainPanel !== b.dataset.chain; });
  }));

  /* ---------------------------------------------------------------- decision log filters */
  const lBtns = $$("[data-log-filter]");
  lBtns.forEach((b) => b.addEventListener("click", () => {
    pressGroup(lBtns, b);
    const f = b.dataset.logFilter;
    $$("[data-log] tbody tr").forEach((tr) => { tr.hidden = !(f === "all" || tr.dataset.d === f); });
  }));
  const sBtns = $$("[data-stage-filter]");
  sBtns.forEach((b) => b.addEventListener("click", () => {
    pressGroup(sBtns, b);
    const f = b.dataset.stageFilter;
    $$("[data-stage-log] tbody tr").forEach((tr) => { tr.hidden = !(f === "all" || tr.dataset.s === f); });
  }));

  /* ---------------------------------------------------------------- AI prompt evidence logs */
  $$("[data-ailog-block]").forEach((block) => {
    const btns = $$("[data-ailog]", block);
    btns.forEach((b) => b.addEventListener("click", () => {
      pressGroup(btns, b);
      const f = b.dataset.ailog;
      $$(".log-entry", block).forEach((en) => { en.hidden = !(f === "all" || en.dataset.type === f); });
    }));
    const ex = $("[data-ailog-expand]", block);
    if (ex) ex.addEventListener("click", () => {
      const open = ex.textContent.startsWith("Expand");
      $$(".log-entry", block).forEach((en) => { if (!en.hidden) en.open = open; });
      ex.textContent = open ? "Collapse all" : "Expand all";
    });
  });
  // P2 / P3 summary cards scroll to the scenario
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-scroll-sim]");
    if (!a) return;
    e.preventDefault();
    scrollToEl(document.getElementById(a.getAttribute("href").slice(1)));
  });

  /* ---------------------------------------------------------------- IA tree */
  $$("#iaTree .ia-node > button").forEach((btn) => {
    const list = btn.nextElementSibling;
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      list.hidden = open;
    });
  });
  $$("[data-ia-all]").forEach((b) => b.addEventListener("click", () => {
    const open = b.dataset.iaAll === "open";
    $$("#iaTree .ia-node > button").forEach((btn) => { btn.setAttribute("aria-expanded", open); btn.nextElementSibling.hidden = !open; });
  }));

  /* ---------------------------------------------------------------- detail-on-demand demo (Develop) */
  const dod = document.getElementById("dodDemo");
  const dodPanel = document.getElementById("dodDemoPanel");
  if (dod && dodPanel) {
    let pinned = false;
    const set = (open) => { dodPanel.hidden = !open; dod.setAttribute("aria-expanded", open); dod.classList.toggle("active", open); };
    dod.addEventListener("mouseenter", () => set(true));
    dod.closest(".dod-demo").addEventListener("mouseleave", () => { if (!pinned) set(false); });
    dod.addEventListener("focus", () => set(true));
    dod.addEventListener("click", () => { pinned = !pinned; set(pinned || dodPanel.hidden); });
    dod.addEventListener("keydown", (e) => { if (e.key === "Escape") { pinned = false; set(false); } });
  }

  /* ---------------------------------------------------------------- submission checklist */
  const boxes = $$("#checklist input[type=checkbox]");
  const saved = store.get("tp-checklist", {});
  function updateProgress() {
    const done = boxes.filter((b) => b.checked).length;
    const out = document.getElementById("clProgress");
    if (out) out.textContent = `${done} / ${boxes.length} ticked`;
  }
  boxes.forEach((b) => {
    b.checked = !!saved[b.id];
    b.addEventListener("change", () => { saved[b.id] = b.checked; store.set("tp-checklist", saved); updateProgress(); });
  });
  updateProgress();

  /* ---------------------------------------------------------------- init */
  if (!routeFromHash()) showStage("discover", { updateHash: false });
})();
