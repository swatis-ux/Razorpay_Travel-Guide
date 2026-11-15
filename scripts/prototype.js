/* =====================================================================
   prototype.js — AI trip planner prototype (simulated), simplified
   ---------------------------------------------------------------------
   Three stages in one connected workspace:
     1 Tell us   — one open prompt; missing details asked one at a time
     2 Explore   — best fit + two alternatives; map and day plan side by side
     3 Review    — one clean summary; one way back to edit
   The "AI" is scripted logic + keyword matching. Every price, time,
   distance and availability value below is SIMULATED and labelled so.
   Map marker IDs === itinerary item IDs, so both views stay in sync.
   ===================================================================== */
(function () {
  "use strict";
  const { $, $$, esc, inr, announce, reducedMotion } = window.TP;
  const root = document.getElementById("app");
  if (!root) return;

  /* =================================================================== DATA (simulated) */
  // Map coordinates are in the 1000×700 space of assets/illustrations/map-coorg.svg (schematic, not to scale).
  const ITEMS = {
    // --- getting there
    "bus-out": { kind: "transport", day: 1, name: "Overnight sleeper bus to Madikeri", short: "Night bus", area: "Madikeri bus stand", x: 392, y: 338, time: "Fri 22:30 → Sat 06:30", cost: 950, thumb: "bus",
      why: ["Leaves after work on Friday — no leave needed", "Overnight travel saves a hotel night", "Lowest cost of the three ways to get there"], caveat: "Seat availability unverified" },
    "car-out": { kind: "transport", day: 1, name: "Self-drive, two rental cars", short: "Rental cars", area: "Arrive at the homestay", x: 392, y: 338, time: "Sat 05:00 → 10:30", cost: 1400, thumb: "car",
      why: ["Flexible stops on the way", "Cars for the whole weekend"], tradeoff: "Arrive 4 h later; two people drive", affects: "The coffee walk moves to 11:30" },
    "train-out": { kind: "transport", day: 1, name: "Morning train to Mysuru + shared cab", short: "Train + cab", area: "Mysuru → Madikeri by cab", x: 392, y: 338, time: "Sat 06:15 → 11:30", cost: 800, thumb: "train",
      why: ["Cheapest door-to-door", "No night travel"], tradeoff: "Arrive 5 h later", affects: "The coffee walk is dropped" },
    // --- stay
    "homestay": { kind: "stay", day: "both", name: "Coffee-estate homestay (sample)", short: "Homestay", area: "Estate road, south of Madikeri", x: 300, y: 438, time: "Sat 09:30 check-in · Sun 10:30 check-out", cost: 1800, unit: "pp · 1 night", thumb: "homestay",
      why: ["Quiet and green — matches “greenery” and “not hectic”", "Within the ~₹2,000 per-person stay share", "≈12 min to the Day 1 coffee walk"], caveat: "Room availability unverified · name is a placeholder" },
    "guesthouse": { kind: "stay", day: "both", name: "Town-centre guesthouse (sample)", short: "Guesthouse", area: "Madikeri town", x: 378, y: 290, time: "Sat 09:30 check-in · Sun 10:30 check-out", cost: 1200, unit: "pp · 1 night", thumb: "guesthouse",
      why: ["Walk to cafés and the fort", "Private rooms"], tradeoff: "In town, less green", affects: "The coffee walk becomes a 20 min drive" },
    "dorm": { kind: "stay", day: "both", name: "Backpacker hostel dorm (sample)", short: "Hostel dorm", area: "Madikeri town", x: 410, y: 312, time: "Sat 09:30 check-in · Sun 10:30 check-out", cost: 650, unit: "pp · 1 night", thumb: "hostel", needsShared: true,
      why: ["Lowest-cost safe option", "Common area for the group"], tradeoff: "Shared dorm, less privacy", affects: "The coffee walk becomes a 20 min drive" },
    // --- Day 1
    "coffee-walk": { kind: "activity", day: 1, name: "Guided coffee plantation walk", area: "Estate near the homestay", x: 222, y: 482, time: "10:00–12:00", cost: 500, thumb: "coffee", shared: true,
      why: ["Matches “greenery” and “small cafés”", "Starts next to the stay — minimal travel", "Gentle pace"] },
    "spice-garden": { kind: "activity", day: 1, name: "Spice garden & honey farm (sample)", area: "Between estate and town", x: 248, y: 392, time: "10:00–11:30", cost: 300, thumb: "market", shared: true,
      why: ["Local produce and tastings", "Shorter and cheaper"], tradeoff: "Less walking in greenery" },
    "kodava-lunch": { kind: "food", day: 1, name: "Kodava home-style lunch", area: "Madikeri town", x: 400, y: 368, time: "12:45", cost: 350, thumb: "food", shared: true,
      why: ["“Local food” — regional cuisine", "On the way into town"] },
    "cafe-lunch": { kind: "food", day: 1, name: "Café lunch on Main Road (sample)", area: "Madikeri town", x: 410, y: 352, time: "12:45", cost: 450, thumb: "cafe", shared: true,
      why: ["A small independent café", "Vegetarian-friendly menu (unverified)"], tradeoff: "A little pricier" },
    "fort-walk": { kind: "activity", day: 1, name: "Madikeri Fort & old-town walk", area: "Madikeri town", x: 348, y: 300, time: "15:00–16:30", cost: 0, thumb: "fort", shared: true,
      why: ["Walkable and low-effort", "Free to enter (simulated)", "10 min from the sunset point"], caveat: "Opening hours unverified" },
    "rajas-seat": { kind: "activity", day: 1, name: "Raja's Seat sunset viewpoint", area: "Madikeri town", x: 286, y: 246, time: "17:15–18:30", cost: 50, thumb: "viewpoint", shared: true,
      why: ["A slow, scenic end to the day", "Close to dinner"] },
    "cafe-dinner": { kind: "food", day: 1, name: "Dinner at a small local café", area: "Madikeri town", x: 318, y: 352, time: "19:30", cost: 450, thumb: "cafe", shared: true,
      why: ["Your “small cafés” preference", "Short drive back to the stay"] },
    // --- Day 2
    "abbey-falls": { kind: "activity", day: 2, name: "Abbey Falls morning walk", area: "Abbey Falls, west of Madikeri", x: 168, y: 206, time: "08:00–09:30", cost: 50, thumb: "waterfall", shared: true,
      why: ["A nature walk while it's cool", "Short trail — relaxed pace"], caveat: "Trail conditions unverified" },
    "food-trail": { kind: "food", day: 2, name: "Madikeri local food trail", area: "Madikeri town", x: 430, y: 330, time: "08:30–10:00", cost: 400, thumb: "market", shared: true,
      why: ["Builds on your “local food” preference", "In town — less driving before check-out"], tradeoff: "≈25 min less driving", affects: "Only the Day 2 route changes" },
    "market-walk": { kind: "activity", day: 2, name: "Spice & honey market stroll", area: "Madikeri town", x: 420, y: 316, time: "08:30–09:30", cost: 150, thumb: "market", shared: true,
      why: ["An easy walk among local produce"], tradeoff: "Shorter", affects: "Only the Day 2 route changes" },
    "rafting": { kind: "activity", day: 2, name: "White-water rafting at Dubare", area: "Dubare, on the Kaveri", x: 704, y: 566, time: "11:30–13:00", cost: 1500, thumb: "raft", optional: true, who: "2 of 6",
      why: ["The adventure two of you asked for", "Same place as the riverside option — the group stays together"], caveat: "Seasonal · availability unverified" },
    "kayak": { kind: "activity", day: 2, name: "Kayaking at Harangi reservoir (sample)", area: "Harangi", x: 606, y: 296, time: "11:30–13:00", cost: 900, thumb: "raft", optional: true, who: "2 of 6",
      why: ["A calmer water sport", "Same time slot"], tradeoff: "Splits the group for 2 h", affects: "Adds a separate route for two people" },
    "river-walk": { kind: "activity", day: 2, name: "Dubare riverside & elephant camp", area: "Dubare, on the Kaveri", x: 738, y: 538, time: "11:30–13:00", cost: 300, thumb: "elephant", optional: true, who: "4 of 6",
      why: ["Easy riverside time for the four who'd rather relax", "Meets the rafters at the same place"], caveat: "Camp timings vary · unverified" },
    "river-cafe": { kind: "food", day: 2, name: "Free time at a riverside café (sample)", area: "Near Dubare", x: 688, y: 508, time: "11:30–13:00", cost: 200, thumb: "rest", optional: true, who: "4 of 6",
      why: ["Rest, then rejoin the group"], tradeoff: "Slower, cheaper" },
    "tibetan-lunch": { kind: "food", day: 2, name: "Tibetan lunch in Bylakuppe", area: "Bylakuppe", x: 788, y: 442, time: "13:45", cost: 300, thumb: "food", shared: true,
      why: ["Everyone regroups here", "On the way home"] },
    "monastery": { kind: "activity", day: 2, name: "Namdroling Monastery (Golden Temple)", area: "Bylakuppe", x: 822, y: 386, time: "15:00–16:15", cost: 0, thumb: "monastery", shared: true,
      why: ["On the return route — no detour", "Calm, walkable grounds"], caveat: "Visiting hours unverified" },
    "bus-back": { kind: "transport", day: 2, name: "Evening bus to Bangalore", short: "Evening bus home", area: "Kushalnagar bus stand", x: 652, y: 420, time: "17:30 → ~23:30", cost: 900, thumb: "bus",
      why: ["Home Sunday night, before work on Monday", "Leaves from the town nearest the monastery"], caveat: "Seat availability unverified" },
    "early-bus": { kind: "transport", day: 2, name: "Earlier bus at 15:00 (sample)", short: "Earlier bus home", area: "Kushalnagar bus stand", x: 652, y: 420, time: "15:00 → ~21:00", cost: 900, thumb: "bus",
      why: ["Home 2.5 h earlier"], tradeoff: "Shorter monastery visit", affects: "The monastery visit shrinks to 40 min" }
  };

  // Slots are the ordered positions in the trip. Alternatives replace an item inside its slot.
  const SLOTS = [
    { id: "go", day: 1, alts: ["bus-out", "car-out", "train-out"] },
    { id: "stay", day: "both", alts: ["homestay", "guesthouse", "dorm"] },
    { id: "d1a", day: 1, alts: ["coffee-walk", "spice-garden"] },
    { id: "d1b", day: 1, alts: ["kodava-lunch", "cafe-lunch"] },
    { id: "d1c", day: 1, alts: ["fort-walk"] },
    { id: "d1d", day: 1, alts: ["rajas-seat"] },
    { id: "d1e", day: 1, alts: ["cafe-dinner"] },
    { id: "d2a", day: 2, alts: ["abbey-falls", "food-trail", "market-walk"] },
    { id: "d2b", day: 2, alts: ["rafting", "kayak"], group: "opt" },
    { id: "d2c", day: 2, alts: ["river-walk", "river-cafe"], group: "opt" },
    { id: "d2d", day: 2, alts: ["tibetan-lunch"] },
    { id: "d2e", day: 2, alts: ["monastery"] },
    { id: "ret", day: 2, alts: ["bus-back", "early-bus"] }
  ];
  const LOCAL_CAB = 1100; // per person, group tempo traveller for 2 days (simulated)

  // One best fit, two alternatives — each with one sentence. Longer reasons only on request.
  const DESTS = [
    { id: "coorg", name: "Coorg", rank: "Best fit", img: "dest-coorg", hours: "5–6 h", hoursMax: 6, range: [6750, 7950],
      why: "Green coffee hills, small cafés and Kodava food — with rafting nearby for the two who want it.",
      more: "It matches “green, cafés, local food, not hectic”. An overnight bus from Bangalore means you don't lose Saturday, and at Dubare the adventure pair can raft while the others relax in the same place." },
    { id: "chikmagalur", name: "Chikmagalur", rank: "Also good", img: "dest-chikmagalur", hours: "≈5 h", hoursMax: 5, range: [7000, 8400],
      why: "Coffee hills and treks, but fewer easy walks for the relaxed four." },
    { id: "wayanad", name: "Wayanad", rank: "A stretch", img: "dest-wayanad", hours: "6–7 h", hoursMax: 7, range: [7600, 9200],
      why: "Forest and wildlife, but a longer drive and usually over budget." }
  ];

  const PREF_RULES = [
    { id: "nature", re: /green|greenery|nature|hill|mountain|forest|tree|mist/i, label: "Green, nature-led places" },
    { id: "cafes", re: /cafe|café|coffee/i, label: "Small cafés" },
    { id: "food", re: /food|eat|cuisine|local dish|street/i, label: "Local food" },
    { id: "walk", re: /walk|stroll|wander/i, label: "Walking around" },
    { id: "relaxed", re: /relax|slow|not (too |very )?hectic|chill|calm|rest|easy/i, label: "A relaxed pace" },
    { id: "adventure", re: /adventure|raft|trek|thrill|adrenaline|kayak/i, label: "A little adventure (for some)" },
    { id: "culture", re: /history|heritage|fort|temple|monaster|culture|museum/i, label: "Culture & heritage" },
    { id: "budget", re: /afford|cheap|budget/i, label: "Good value" }
  ];
  const SAMPLE = "Six of us from Bangalore want a weekend away. Lots of greenery, small cafes, local food and walking around — nothing too hectic. Two of us want a bit of adventure. Around ₹8,000 each.";
  const EXAMPLES = ["A relaxed weekend in the hills", "A short trip with friends", "Somewhere affordable with good food and nature"];

  // the follow-up questions, asked one at a time and only when the answer is missing
  const ASK = {
    start:  { q: "Tell me what kind of trip you have in mind.", sub: "No destination needed — just the feeling you're after." },
    from:   { q: "Where will you be starting from?", chips: ["Bangalore", "Chennai", "Mumbai"] },
    when:   { q: "When are you free?", chips: ["This weekend", "Next weekend"] },
    people: { q: "How many of you are going?", chips: ["Just me", "2 of us", "4 friends", "6 friends"] },
    budget: { q: "Roughly how much can each person spend?", chips: ["₹5,000", "₹8,000", "₹12,000"] },
    confirm:{ q: "Got it. Does this look right?", sub: "Change anything below — or let's find your trip." }
  };
  const ASK_ORDER = ["from", "when", "people", "budget"];

  /* =================================================================== STATE */
  const fresh = () => ({
    stage: "tell",          // tell → explore → review
    ask: "start",
    said: "",               // the traveller's last message, echoed once
    note: "",               // one short planner aside (e.g. sample-data limits)
    prefs: [],
    c: { from: "Bangalore", fromKnown: false, when: "this", whenKnown: false, people: 6, peopleKnown: false, budget: 8000, budgetKnown: false, maxh: false, priv: false },
    plan: null,             // { slotId: itemId | null }
    optionalAddOn: false,
    flags: {},              // { unverified: itemId, unavailable: itemId }
    history: [],
    day: 1,
    selected: null,
    open: null,             // { id, mode: null | "why" | "swap" } — the one stop expanded in the list
    changed: [],
    mapError: false,
    building: false,
    buildError: false,
    busy: false,
    techFailNext: false,
    say: null               // the planner's current line in Explore: { html, chips }
  });
  let S = fresh();
  let runToken = 0;
  const instant = () => reducedMotion() || S.fast;

  /* =================================================================== SHELL */
  root.innerHTML = `
    <div class="app-top">
      <div class="logo"><i aria-hidden="true"></i>Trip Planner</div>
      <ol class="steps" aria-label="Planning stages">
        <li data-step="tell"><button type="button" data-act="goto" data-to="tell"><span>1</span>Tell us</button></li>
        <li data-step="explore"><button type="button" data-act="goto" data-to="explore"><span>2</span>Explore</button></li>
        <li data-step="review"><button type="button" data-act="goto" data-to="review"><span>3</span>Review</button></li>
      </ol>
    </div>
    <div class="app-main" id="appMain"></div>`;
  const main = $("#appMain", root);

  /* =================================================================== SMALL HELPERS */
  function nextWeekend(offsetWeeks) {
    const d = new Date();
    const add = (5 - d.getDay() + 7) % 7 + (offsetWeeks * 7);
    const fri = new Date(d.getFullYear(), d.getMonth(), d.getDate() + add);
    const sun = new Date(fri.getFullYear(), fri.getMonth(), fri.getDate() + 2);
    const f = (x) => x.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    return `${f(fri)} – ${f(sun)}`;
  }
  const dates = () => nextWeekend(S.c.when === "next" ? 1 : 0);
  const range = (min, max) => inr(min) + (max !== min ? "–" + inr(max).slice(1) : "");
  const chipsHTML = (list) => list.length ? `<div class="quick" aria-label="Quick answers">${list.map((s) => `<button type="button" class="chip" data-say="${esc(typeof s === "string" ? s : s.say)}">${esc(typeof s === "string" ? s : s.label)}</button>`).join("")}</div>` : "";
  const composer = (ph) => `<form class="composer" id="composer" autocomplete="off"><label for="chatInput" class="sr-only">Message the trip planner</label><input id="chatInput" type="text" placeholder="${esc(ph)}"><button class="send" type="submit" aria-label="Send">→</button></form>`;
  const snapshot = () => ({ plan: Object.assign({}, S.plan), budget: S.c.budget, addOn: S.optionalAddOn, flags: Object.assign({}, S.flags) });
  const sleep = (ms) => new Promise((r) => setTimeout(r, instant() ? 20 : ms));

  /* =================================================================== RENDER */
  function render(opts = {}) {
    const order = ["tell", "explore", "review"];
    $$(".steps li", root).forEach((li) => {
      const i = order.indexOf(li.dataset.step), cur = order.indexOf(S.stage);
      li.className = i === cur ? "on" : i < cur ? "done" : "";
      const b = $("button", li);
      b.disabled = !(i === 0 || (i >= 1 && S.plan));
      if (i === cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current");
    });
    main.dataset.stage = S.stage;
    if (S.stage === "tell") main.innerHTML = tellHTML();
    else if (S.stage === "explore") main.innerHTML = S.building ? buildingHTML() : exploreHTML();
    else main.innerHTML = reviewHTML();
    if (S.stage === "explore" && S.selected && !S.building) applySelection(S.selected, { noScroll: true });
    if (opts.focus) { const el = $(opts.focus, main); if (el) el.focus({ preventScroll: !!opts.noScroll }); }
    S.changed = [];
  }

  /* -------------------------------------------------- 1 · TELL US */
  function knownCount() { const c = S.c; return [c.fromKnown, c.whenKnown, c.peopleKnown, c.budgetKnown].filter(Boolean).length + (S.prefs.length ? 1 : 0); }
  function notesHTML() {
    if (!knownCount() && !S.said) return "";
    const c = S.c, row = (k, v, ok) => `<div class="${ok ? "" : "missing"}"><dt>${k}</dt><dd>${ok ? v : "—"}</dd></div>`;
    const likes = S.prefs.map((p, i) => `<span class="pref ${p.inferred ? "inferred" : ""}">${esc(p.label)}<button type="button" data-act="rm-pref" data-i="${i}" aria-label="Remove ${esc(p.label)}">×</button></span>`).join("");
    return `<div class="notes" aria-label="Your trip so far">
      <h4>Your trip so far</h4>
      <dl>
        ${row("From", esc(c.from), c.fromKnown)}
        ${row("When", c.when === "next" ? "Next weekend" : "This weekend", c.whenKnown)}
        ${row("Who", c.people === 1 ? "Just you" : c.people + " travellers", c.peopleKnown)}
        ${row("Budget", inr(c.budget) + " each", c.budgetKnown)}
        <div class="likes"><dt>You'd like</dt><dd><span class="pref-list" data-pref-list>${likes || '<span class="muted">—</span>'}</span>
          <form class="pref-add" data-act-form="add-pref"><label class="sr-only" for="prefAdd">Add something you'd like</label><input id="prefAdd" placeholder="+ add"></form></dd></div>
      </dl>
      ${S.prefs.some((p) => p.inferred) ? '<p class="tiny-note">Dashed ones are my guesses — remove any that are wrong.</p>' : ""}
    </div>`;
  }
  function tellHTML() {
    const a = ASK[S.ask] || ASK.start;
    const chips = S.ask === "start" ? [...EXAMPLES, { label: "Try the sample: six friends from Bangalore", say: SAMPLE }] : (a.chips || []);
    const thinking = S.busy ? `<p class="thinking"><span class="route-dots" aria-hidden="true"><i></i><i></i><i></i></span>Reading that…</p>` : "";
    return `<div class="tell">
      <figure class="tell-art"><img src="assets/illustrations/hero-journey.svg" alt="" width="1400" height="540"></figure>
      <div class="tell-talk">
        ${S.said ? `<p class="said"><span>You</span>“${esc(S.said)}”</p>` : ""}
        <div class="say" aria-live="polite">${thinking || `<h3>${esc(a.q)}</h3>${S.note ? `<p class="aside">${S.note}</p>` : a.sub ? `<p class="aside">${esc(a.sub)}</p>` : ""}`}</div>
        ${S.busy ? "" : chipsHTML(chips)}
        ${S.ask === "confirm" ? `<div class="go-row"><button class="btn btn-primary" data-act="find">Find my trip →</button></div>` : composer(S.ask === "start" ? "Describe your trip…" : "Or type your answer…")}
        ${notesHTML()}
      </div>
    </div>`;
  }

  /* -------------------------------------------------- 2 · EXPLORE */
  function buildingHTML() {
    if (S.buildError) return `<div class="building" role="alert"><img src="assets/illustrations/plan-next.svg" alt="" width="300" height="200"><h3>Something went wrong on our side.</h3><p class="aside">Everything you told me is safe. It wasn't your choices.</p><div class="go-row"><button class="btn btn-primary" data-act="retry-build">Try again</button><button class="btn btn-ghost" data-act="goto" data-to="tell">Back</button></div><p class="tiny-note">Technical error (simulated).</p></div>`;
    // the route draws itself while the trip is assembled (a mask reveals the dotted line), then the last pin settles
    const d = "M24,62 C110,20 170,24 240,52 S380,86 450,44 S540,18 576,36";
    return `<div class="building" aria-live="polite">
      <svg class="build-route" viewBox="0 0 600 90" aria-hidden="true"><defs><mask id="buildMask"><path class="draw" d="${d}" pathLength="1"/></mask></defs>
        <path class="dots" d="${d}" mask="url(#buildMask)"/><circle class="pin" cx="24" cy="62" r="8"/><circle class="pin mid" cx="240" cy="52" r="8"/><circle class="pin end" cx="576" cy="36" r="8"/></svg>
      <h3><span class="route-dots" aria-hidden="true"><i></i><i></i><i></i></span>Putting your trip together…</h3>
      <ol class="build-steps">${["Getting there from " + S.c.from, "A stay for the group", "Day-by-day plan", "Cost per person"].map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <button class="btn btn-sm btn-ghost" data-act="cancel-build">Cancel</button></div>`;
  }
  function tripBarHTML() {
    const b = budget(), over = b.check > S.c.budget;
    const pct = Math.min(100, (b.check / Math.max(S.c.budget, b.check)) * 100);
    return `<header class="trip-bar">
      <div class="tb-title"><h3>A relaxed weekend in Coorg</h3><p class="facts">${esc(S.c.from)} → Coorg · ${dates()} · ${S.c.people} ${S.c.people === 1 ? "traveller" : "travellers"}</p></div>
      <button type="button" class="budget ${over ? "over" : ""}" data-act="edit-budget" aria-label="Estimated ${range(b.min, b.max)} per person against a ${inr(S.c.budget)} budget. Change budget">
        <span class="b-num" id="budgetNum">${range(b.min, b.max)}</span>
        <span class="b-of">per person · budget ${inr(S.c.budget)} <span class="tag sim">Simulated</span></span>
        <span class="b-track" aria-hidden="true"><i style="width:${pct}%"></i></span>
      </button>
      <div class="tb-actions"><button class="btn btn-sm btn-ghost" data-act="undo" ${S.history.length ? "" : "disabled"}>↶ Undo</button><button class="btn btn-primary" data-act="review">Review plan →</button></div>
    </header>`;
  }
  function sayHTML() {
    const s = S.say || { html: "" };
    const busy = S.busy ? `<p class="thinking"><span class="route-dots" aria-hidden="true"><i></i><i></i><i></i></span>Updating your plan…</p>` : "";
    return `<section class="planner ${s.kind || ""}" aria-label="Planner">
      ${S.said ? `<p class="said"><span>You</span>“${esc(S.said)}”</p>` : ""}
      <div class="say" aria-live="polite">${busy || s.html}</div>
      ${S.busy ? "" : chipsHTML(s.chips || [])}
      ${composer("Ask for a change, or why…")}
    </section>`;
  }
  function picksHTML() {
    return `<section class="picks" aria-label="Destinations">
      ${DESTS.map((d) => {
        const best = d.id === "coorg";
        const fit = d.range[1] <= S.c.budget ? "fits budget" : d.range[0] <= S.c.budget ? "may exceed budget" : "over budget";
        const far = S.c.maxh && d.hoursMax > 6 ? " · over 6 h" : "";
        return `<article class="pick ${best ? "best" : ""}">
          <img src="assets/illustrations/${d.img}.svg" alt="" width="120" height="80">
          <div><span class="rank">${d.rank}</span><b>${d.name}</b><p>${d.why}</p><small>${d.hours} · ${range(d.range[0], d.range[1])} pp · ${fit}${far}</small></div>
          ${best ? `<button class="link-btn" data-act="why-dest">Why Coorg?</button>` : `<button class="link-btn" data-act="alt-dest" data-id="${d.id}">Explore</button>`}
        </article>`;
      }).join("")}
    </section>`;
  }
  function exploreHTML() {
    return `<div class="explore">
      ${tripBarHTML()}
      ${sayHTML()}
      ${picksHTML()}
      <section class="plan-map" aria-label="Map">
        <div class="day-switch" role="group" aria-label="Choose a day">
          ${[1, 2].map((d) => `<button type="button" aria-pressed="${S.day === d}" data-act="day" data-day="${d}"><i class="dd d${d}" aria-hidden="true"></i>Day ${d} · ${d === 1 ? "Sat" : "Sun"}</button>`).join("")}
        </div>
        <div class="map-pane">${mapHTML()}</div>
        <p class="map-key">Numbers match the list · <b>S</b> is your stay · dashed = optional · not to scale</p>
      </section>
      <section class="plan-list" aria-label="Day ${S.day} plan">
        <ol class="itin" id="itin">${itinHTML()}</ol>
        <p class="tiny-note">Times and prices are simulated estimates.</p>
      </section>
    </div>`;
  }

  function markerCls(it) {
    const d = it.day === "both" ? "both" : "d" + it.day;
    return `k-${it.kind} ${d} ${it.optional ? "optional" : ""}`;
  }
  function numbering() {
    const n = {};
    [1, 2].forEach((day) => {
      let k = 0;
      stopsForDay(day).forEach((o) => { if (o.it.kind === "stay") n[o.id] = "S"; else n[o.id] = String(++k); });
    });
    return n;
  }

  // Only the chosen day's stops, its route, and the few place names that matter for that day.
  function mapHTML() {
    if (S.mapError) {
      return `<div class="map-error" role="alert"><div class="box"><h3>The map didn't load.</h3><p class="small">Your plan is still here in the list.</p><button class="btn btn-sm btn-primary" data-act="map-retry">Try the map again</button><p class="tiny-note">Simulated failure.</p></div></div>`;
    }
    const day = S.day, nums = numbering();
    const labels = (day === 1
      ? [["Madikeri", 44, 31, "place"]]
      : [["Madikeri", 44, 31, "place"], ["Dubare", 75, 87, ""], ["Bylakuppe", 86, 66, ""]])
      .map(([t, x, y, c]) => `<span class="map-label ${c}" style="left:${x}%;top:${y}%">${t}</span>`).join("") +
      `<span class="map-label" style="left:auto;right:1%;top:59%;transform:none">→ Bangalore</span>`;
    const col = day === 1 ? "#C87555" : "#5E7F86"; // terracotta / deep blue — match --day1, --day2
    let paths = "";
    segmentsFor(day).forEach((sg) => {
      const mx = (sg.a.x + sg.b.x) / 2 + (sg.b.y - sg.a.y) * 0.12;
      const my = (sg.a.y + sg.b.y) / 2 - (sg.b.x - sg.a.x) * 0.12;
      const ch = S.changed.includes(sg.to) || S.changed.includes(sg.from) ? "changed" : "";
      paths += `<path class="seg ${ch}" data-to="${sg.to}" data-from="${sg.from}" d="M${sg.a.x},${sg.a.y} Q${mx.toFixed(1)},${my.toFixed(1)} ${sg.b.x},${sg.b.y}" stroke="${col}" ${sg.optional ? 'stroke-dasharray="3 7"' : ""}/>`;
    });
    const seen = new Set();
    let markers = "";
    stopsForDay(day).forEach((o) => {
      if (seen.has(o.id)) return;
      seen.add(o.id);
      const it = o.it;
      const ch = S.changed.includes(o.id) ? "pulse" : "";
      markers += `<button type="button" class="marker ${markerCls(it)} ${ch}" style="left:${it.x / 10}%;top:${it.y / 7}%" data-stop="${o.id}" aria-label="${nums[o.id] === "S" ? "Your stay" : "Stop " + nums[o.id]}: ${esc(it.name)}, ${esc(it.time)}"><span>${nums[o.id]}</span></button>`;
    });
    return `<div class="map-canvas ${S.arrive ? "arrive" : ""}">
        <img src="assets/illustrations/map-coorg.svg" alt="Illustrated map of Coorg showing Day ${day}'s route." width="1000" height="700" data-mapimg>
        <svg class="routes" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>
        ${labels}${markers}
      </div>`;
  }

  function itinHTML() {
    const nums = numbering(), day = S.day;
    let html = "", prevMain = null;
    stopsForDay(day).forEach((o) => {
      if (day === 2 && o.it.kind === "stay") { html += `<li class="from-stay">Start from your stay · ${esc(o.it.short || o.it.name)}</li>`; prevMain = o; return; }
      let leg = "";
      if (prevMain) { const lm = legMin(prevMain.it, o.it); leg = `<span class="leg ${lm >= 40 ? "far" : ""}">≈ ${lm} min by cab${lm >= 40 ? " · longer drive" : ""}</span>`; }
      html += stopHTML(o, nums, leg);
      if (!o.it.optional) prevMain = o;
    });
    if (day === 2 && S.plan.d2b && S.plan.d2c) html += `<li class="from-stay">The two optional stops share a slot — everyone regroups for lunch.</li>`;
    return html;
  }
  function stopHTML(o, nums, leg) {
    const it = o.it, id = o.id, open = S.open && S.open.id === id;
    const flags = [];
    if (it.optional) flags.push(`<span class="tag opt">Optional · ${it.who}</span>`);
    if (S.flags.unverified === id) flags.push('<span class="tag unv">Unconfirmed</span>');
    if (S.flags.unavailable === id) flags.push('<span class="tag warn">Unavailable</span>');
    if (it.needsShared && S.c.priv) flags.push('<span class="tag warn">Not private rooms</span>');
    const ch = S.changed.includes(id) ? "just-changed" : "";
    return `<li class="stop-li ${open ? "open" : ""}">${leg}
      <button type="button" class="stop ${it.optional ? "optional" : ""} ${ch}" data-stop="${id}" aria-expanded="${open}" aria-controls="sd-${id}">
        <span class="sn ${markerCls(it)}">${nums[id]}</span>
        <span class="s-main"><span class="sname">${esc(it.name)}</span><span class="smeta">${esc(it.time)} · ${it.cost ? inr(it.cost) + (it.unit ? " " + it.unit : " pp") : "Free"}</span></span>
        ${flags.length ? `<span class="s-flags">${flags.join("")}</span>` : ""}
      </button>
      ${open ? detailHTML(id) : ""}
    </li>`;
  }
  // Detail on demand, inside the list: one reason first; the rest only when asked.
  function detailHTML(id) {
    const it = ITEMS[id], mode = S.open.mode;
    const slot = SLOTS.find((s) => s.alts.includes(id));
    const others = slot.alts.filter((a) => a !== id);
    const removable = it.kind === "activity" || it.kind === "food";
    const status = S.flags.unverified === id ? "Couldn't confirm just now" : S.flags.unavailable === id ? "Unavailable on your dates (simulated)" : "Unverified in this prototype";
    let body = "";
    if (mode === "why") {
      body = `<ul class="why-all">${it.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
        <p class="tiny-note">${esc(it.area)} · ${status}${it.caveat ? " · " + esc(it.caveat) : ""}. The real product would use MakeMyTrip listings and live availability.</p>`;
    }
    if (mode === "swap") {
      body = `<div class="alts">${others.map((a) => {
        const x = ITEMS[a], delta = x.cost - it.cost;
        const dTxt = delta === 0 ? "same cost" : `<span class="${delta > 0 ? "delta-up" : "delta-down"}">${delta > 0 ? "+" : "−"}${inr(Math.abs(delta))} pp</span>`;
        const warn = x.needsShared && S.c.priv ? " · not private rooms" : S.flags.unavailable === a ? " · unavailable" : "";
        return `<div class="alt"><img src="assets/illustrations/thumb-${x.thumb}.svg" alt=""><div><b>${esc(x.name)}</b><span>${dTxt}${x.tradeoff ? " · " + esc(x.tradeoff) : ""}${warn}</span>${x.affects ? `<span class="muted">${esc(x.affects)}</span>` : ""}</div><button class="btn btn-sm btn-primary" data-act="swap" data-slot="${slot.id}" data-to="${a}">Swap</button></div>`;
      }).join("")}</div>`;
    }
    return `<div class="stop-detail" id="sd-${id}">
      <img src="assets/illustrations/thumb-${it.thumb}.svg" alt="">
      <div class="sd-body">
        <p class="why1">${esc(it.why[0])}.</p>
        ${body}
        <div class="sd-actions">
          <button class="btn btn-sm ${mode === "why" ? "on" : ""}" data-act="why" data-id="${id}" aria-pressed="${mode === "why"}">Why this?</button>
          ${others.length ? `<button class="btn btn-sm ${mode === "swap" ? "on" : ""}" data-act="swap-open" data-id="${id}" aria-pressed="${mode === "swap"}">Replace</button>` : ""}
          ${removable ? `<button class="btn btn-sm btn-ghost" data-act="remove" data-slot="${slot.id}">Remove</button>` : ""}
        </div>
      </div>
    </div>`;
  }

  /* -------------------------------------------------- 3 · REVIEW */
  function reviewHTML() {
    const b = budget();
    const acts = (d) => stopsForDay(d).filter((o) => o.it.kind === "activity" || o.it.kind === "food").map((o) => `<li>${esc(o.it.name)}${o.it.optional ? ` <span class="tag opt">optional · ${o.it.who}</span>` : ""}</li>`).join("");
    const go = ITEMS[S.plan.go], ret = ITEMS[S.plan.ret], stay = ITEMS[S.plan.stay];
    const notes = [];
    if (b.check > S.c.budget) notes.push(`About ${inr(b.check - S.c.budget)} over your ${inr(S.c.budget)} budget`);
    if (S.optionalAddOn) notes.push("Optional activities are paid only by those who join");
    if (b.optional.length) notes.push("Sunday splits for 90 minutes; everyone regroups for lunch");
    if (S.flags.unverified) notes.push(`${ITEMS[S.flags.unverified].name}: couldn't be confirmed`);
    notes.push("Prices, times and availability are simulated and unverified");
    return `<div class="review">
      <figure class="rv-art"><img src="assets/illustrations/dest-coorg.svg" alt="" width="360" height="200"></figure>
      <div class="rv-body">
        <span class="kicker-in">Your plan</span>
        <h3>A relaxed weekend in Coorg</h3>
        <dl class="rv-facts">
          <div><dt>When</dt><dd>${dates()}</dd></div>
          <div><dt>Who</dt><dd>${S.c.people} ${S.c.people === 1 ? "traveller" : "travellers"} from ${esc(S.c.from)}</dd></div>
          <div><dt>Stay</dt><dd>${esc(stay.name)}</dd></div>
          <div><dt>Getting there</dt><dd>${esc(go.short || go.name)} out · ${esc(ret.short || ret.name)}</dd></div>
        </dl>
        <div class="rv-days"><div><h4>Saturday</h4><ul>${acts(1)}</ul></div><div><h4>Sunday</h4><ul>${acts(2)}</ul></div></div>
        <div class="rv-cost"><span class="b-num">${range(b.min, b.max)}</span> <span>per person <span class="tag sim">Simulated</span></span>
          <details class="cost-more"><summary>See the breakdown</summary><table><tbody>
            ${b.lines.map((l) => `<tr><td>${esc(l.name)}</td><td>${l.cost ? inr(l.cost) : "Free"}</td></tr>`).join("")}
            ${b.optional.map((o) => `<tr><td>${esc(o.name)} <span class="tag opt">optional</span></td><td>${inr(o.cost)}</td></tr>`).join("")}
          </tbody></table></details></div>
        <div class="rv-notes"><h4>Worth knowing</h4><ul>${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>
        <div class="go-row"><button class="btn btn-primary" data-act="edit-plan">← Edit the plan</button></div>
        <p class="tiny-note">Nothing is booked or paid. The real product would hand each piece to MakeMyTrip's own booking flow.</p>
      </div>
    </div>`;
  }

  /* =================================================================== BUDGET */
  function budget(plan = S.plan, addOn = S.optionalAddOn) {
    if (!plan) return { shared: 0, min: 0, max: 0, check: 0, optional: [], lines: [] };
    let shared = LOCAL_CAB;
    const lines = [{ name: "Local cab for the group, 2 days", cost: LOCAL_CAB }];
    const optional = [];
    SLOTS.forEach((s) => {
      const id = plan[s.id];
      if (!id) return;
      const it = ITEMS[id];
      if (it.optional) optional.push(it);
      else { shared += it.cost; lines.push({ name: it.name, cost: it.cost }); }
    });
    const optCosts = optional.map((o) => o.cost);
    const minOpt = optCosts.length ? Math.min(...optCosts) : 0;
    const maxOpt = optCosts.length ? Math.max(...optCosts) : 0;
    const min = shared + minOpt;
    const max = shared + maxOpt;
    const check = addOn ? min : max;
    return { shared, min, max, check, optional, lines };
  }

  /* =================================================================== GEO / ROUTES */
  function stopsForDay(day, plan = S.plan) {
    const out = [];
    SLOTS.forEach((s) => {
      const id = plan[s.id];
      if (!id) return;
      const it = ITEMS[id];
      const onDay = it.day === day || (it.day === "both");
      if (!onDay) return;
      if (it.kind === "stay" && day === 2) { out.unshift({ id, it, slot: s }); return; }   // Day 2 starts at the stay
      out.push({ id, it, slot: s });
    });
    if (day === 1) {
      const go = out.findIndex((o) => o.slot.id === "go");
      const st = out.findIndex((o) => o.slot.id === "stay");
      if (go > -1 && st > -1 && st !== go + 1) { const [x] = out.splice(st, 1); out.splice(go + 1, 0, x); }
    }
    return out;
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const legMin = (a, b) => Math.round(6 + dist(a, b) * 0.13);
  function segmentsFor(day) {
    const st = stopsForDay(day);
    const segs = [];
    let prevMain = null;
    st.forEach((o) => {
      if (!prevMain) { prevMain = o; return; }
      segs.push({ from: prevMain.id, to: o.id, a: prevMain.it, b: o.it, optional: !!o.it.optional, day });
      if (!o.it.optional) prevMain = o;
    });
    return segs;
  }

  /* =================================================================== SELECTION / SYNC */
  function applySelection(id, opts = {}) {
    S.selected = id;
    $$(".marker", main).forEach((m) => m.classList.toggle("active", m.dataset.stop === id));
    $$(".stop", main).forEach((s) => s.classList.toggle("active", s.dataset.stop === id));
    $$(".routes .seg", main).forEach((p) => p.classList.toggle("hot", p.dataset.to === id));
    if (!opts.noScroll) {
      const mk = $(`.marker[data-stop="${id}"]`, main);
      if (mk && opts.from === "list") { mk.classList.remove("pulse"); void mk.offsetWidth; mk.classList.add("pulse"); }
      const st = $(`.stop[data-stop="${id}"]`, main);
      if (st && opts.from === "map") st.scrollIntoView({ block: "nearest", behavior: instant() ? "auto" : "smooth" });
    }
  }
  // open one stop in the list (from the list or the map); switches day if needed.
  // Details open and close in place: the height eases (240 ms) so the list below moves naturally.
  const EASE = "cubic-bezier(.22,.61,.36,1)";
  function easeHeight(el, from, to, ms, done) {
    if (!el || !el.animate || instant()) { if (done) done(); return; }
    el.style.overflow = "hidden";
    const a = el.animate([{ height: from + "px", opacity: from ? 1 : 0 }, { height: to + "px", opacity: to ? 1 : 0 }], { duration: ms, easing: EASE, fill: done ? "forwards" : "none" });
    a.onfinish = () => { el.style.overflow = ""; if (done) done(); };
  }
  function openStop(id, mode = null, from = "list") {
    const it = ITEMS[id];
    const dayChange = it.day !== "both" && it.day !== S.day;
    if (dayChange) S.day = it.day;
    const same = S.open && S.open.id === id;
    const next = same && mode === null && from === "list" ? null : { id, mode: same && S.open.mode === mode ? null : mode };
    const prevEl = S.open && !dayChange ? $(`#sd-${S.open.id}`, main) : null;
    const prevH = prevEl ? prevEl.offsetHeight : 0;
    const finish = () => {
      S.open = next; S.selected = id;
      render();
      applySelection(id, { from });
      const btn = $(`.stop[data-stop="${id}"]`, main);
      if (btn) btn.focus({ preventScroll: from !== "map" });
      const el = next && $(`#sd-${next.id}`, main);
      if (el) easeHeight(el, same ? prevH : 0, el.offsetHeight, 240);
    };
    if (!next && prevEl) easeHeight(prevEl, prevH, 0, 200, finish);   // closing: collapse first, then settle the list
    else finish();
  }
  // a small checkmark that draws itself when a change is saved
  const CHECK = '<svg class="check" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" pathLength="1"/></svg>';

  /* =================================================================== 1 · UNDERSTANDING */
  const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
  function interpret(text, isStart) {
    const c = S.c;
    const city = /(bangalore|bengaluru|delhi|mumbai|chennai|hyderabad|pune|kolkata)/i.exec(text);
    if (city) {
      c.fromKnown = true;
      const k = city[1].toLowerCase();
      c.from = "Bangalore";
      if (k !== "bangalore" && k !== "bengaluru") S.note = `The sample trips start from Bangalore, so I'll plan from there to show you how it works.`;
    }
    if (/next week/i.test(text)) { c.when = "next"; c.whenKnown = true; }
    else if (/this week|weekend|saturday|sunday|friday/i.test(text) && (/this|weekend/i.test(text))) { if (!/next/i.test(text)) { c.when = "this"; c.whenKnown = /this week/i.test(text) || S.ask === "when"; } }
    const ppl = /(\d+|one|two|three|four|five|six|seven|eight)\s*(of us|friends|people|pax|adults|travellers)/i.exec(text) || /we are (\d+|two|three|four|five|six|seven|eight)/i.exec(text);
    if (ppl) { const v = WORDS[ppl[1].toLowerCase()] || parseInt(ppl[1], 10); if (v > 0 && v < 20) { c.people = v; c.peopleKnown = true; } }
    if (/just me|only me|solo|by myself/i.test(text)) { c.people = 1; c.peopleKnown = true; }
    const bud = /₹\s?([\d,]+)/.exec(text) || /(\d+(?:\.\d)?)\s?k\b/i.exec(text) || /(?:rs\.?|inr)\s?([\d,]+)/i.exec(text) || (S.ask === "budget" ? /(\d{4,6})/.exec(text) : null);
    if (bud) {
      const v = /k\b/i.test(bud[0]) && !bud[0].includes("₹") ? parseFloat(bud[1]) * 1000 : parseInt(bud[1].replace(/,/g, ""), 10);
      if (v >= 2000 && v <= 50000) { c.budget = Math.round(v / 500) * 500; c.budgetKnown = true; }
    }
    if (/private room/i.test(text)) c.priv = true;
    if (/6\s?h|six hours|not too far/i.test(text)) c.maxh = true;
    // likes
    const found = [];
    PREF_RULES.forEach((r) => { const m = text.match(r.re); if (m) found.push({ id: r.id, label: r.label, inferred: false }); });
    if (isStart) S.prefs = found;
    else found.forEach((f) => { if (!S.prefs.some((p) => p.id === f.id)) S.prefs.push(f); });
    if (isStart && !S.prefs.length) {
      S.prefs = ["nature", "relaxed", "food"].map((id) => ({ id, label: PREF_RULES.find((x) => x.id === id).label, inferred: true }));
    }
    if (/beach|sea|goa/i.test(text)) S.note = "Beach trips aren't in the sample data yet, so I'll focus on the rest of what you said.";
  }
  function nextAsk() {
    const k = { from: "fromKnown", when: "whenKnown", people: "peopleKnown", budget: "budgetKnown" };
    return ASK_ORDER.find((a) => !S.c[k[a]]) || "confirm";
  }
  async function answer(text) {
    const asked = S.ask;
    S.said = text;
    if (asked !== "start") S.note = "";
    // answers to the specific question
    if (asked === "when") { S.c.whenKnown = true; S.c.when = /next/i.test(text) ? "next" : "this"; }
    if (asked === "from" && !/(bangalore|bengaluru|delhi|mumbai|chennai|hyderabad|pune|kolkata)/i.test(text)) {
      S.c.fromKnown = true; S.c.from = "Bangalore"; S.note = "The sample trips start from Bangalore, so I'll plan from there.";
    }
    if (asked === "people") { const n = /(\d+)/.exec(text); if (n && +n[1] > 0 && +n[1] < 20) { S.c.people = +n[1]; S.c.peopleKnown = true; } }
    interpret(text, asked === "start");
    if (/coorg|kodagu/i.test(text)) S.note = "Coorg it is — I'll still check it against what you need.";
    const before = asked;
    S.ask = nextAsk();
    if (before === S.ask && before !== "start" && before !== "confirm") S.note = "Sorry, I didn't catch that — one of these, or type it.";
    S.busy = true; render();
    await sleep(before === "start" ? 650 : 250);
    S.busy = false; render({ focus: S.ask === "confirm" ? "[data-act=find]" : "#chatInput", noScroll: true });
  }

  /* =================================================================== 2 · BUILD THE TRIP */
  async function build() {
    const token = ++runToken;
    S.stage = "explore"; S.building = true; S.buildError = false; S.said = "";
    render();
    const lis = $$(".build-steps li", main);
    for (let i = 0; i < lis.length; i++) {
      lis[i].classList.add("doing");
      await sleep(480);
      if (token !== runToken) return;
      lis[i].classList.replace("doing", "done");
    }
    if (S.techFailNext) { S.techFailNext = false; S.buildError = true; render({ focus: "[data-act=retry-build]" }); return; }
    S.plan = {};
    SLOTS.forEach((s) => { S.plan[s.id] = s.alts[0]; });
    if (!S.prefs.some((p) => p.id === "adventure")) S.plan.d2b = null;
    S.building = false; S.day = 1; S.selected = null; S.open = null; S.history = [];
    S.say = { html: `<p><b>Coorg fits best</b> — green hills, cafés and local food, about ${inr(budget().check)} each. Tap any stop to see why it's there or to change it.</p>`,
      chips: ["Why Coorg?", "No waterfall on Day 2", "Make it cheaper"] };
    S.arrive = true; render(); S.arrive = false;     // the stops settle onto the map once, together
    announce("Your Coorg plan is ready.");
    if (budget().check > S.c.budget) conflictSay();
  }

  /* =================================================================== CHANGES */
  async function swap(slotId, toId) {
    const to = ITEMS[toId];
    S.busy = true; render();
    await sleep(450);
    S.busy = false;
    if (S.techFailNext) {
      S.techFailNext = false;
      S.say = { kind: "error", html: `<p><b>Something went wrong on our side.</b> Your plan is exactly as it was.</p><div class="say-actions"><button class="btn btn-sm btn-primary" data-act="swap" data-slot="${slotId}" data-to="${toId}">Try again</button></div><p class="tiny-note">Technical error (simulated).</p>` };
      render(); return;
    }
    S.history.push(snapshot());
    const fromId = S.plan[slotId];
    S.plan[slotId] = toId;
    if (S.flags.unavailable === fromId) delete S.flags.unavailable;
    if (S.flags.unverified === fromId) delete S.flags.unverified;
    S.changed = [toId];
    S.selected = toId;
    S.open = { id: toId, mode: null };
    if (to.day !== "both") S.day = to.day;
    const b = budget();
    if (b.check > S.c.budget) { conflictSay(`<b>${esc(to.name)}</b> is in. `); }
    else S.say = { kind: "saved", html: `<p>${CHECK}<b>${esc(to.name)}</b> is in. Nothing else changed — about ${inr(b.check)} each now.</p><div class="say-actions"><button class="btn btn-sm btn-ghost" data-act="undo">Undo</button></div>` };
    render();
    const bn = $("#budgetNum", main); if (bn) bn.classList.add("flash");
    announce("Plan updated: " + to.name);
  }
  function removeStop(slotId) {
    S.history.push(snapshot());
    const nm = ITEMS[S.plan[slotId]].name;
    S.plan[slotId] = null; S.selected = null; S.open = null;
    S.say = { html: `<p>Removed <b>${esc(nm)}</b>. The times around it stay the same.</p><div class="say-actions"><button class="btn btn-sm btn-ghost" data-act="undo">Undo</button></div>` };
    render();
  }
  function undo() {
    const h = S.history.pop();
    if (!h) return;
    S.plan = h.plan; S.c.budget = h.budget; S.optionalAddOn = h.addOn; S.flags = h.flags;
    S.open = null;
    S.say = { html: "<p>Back to how it was.</p>" };
    render();
  }

  /* =================================================================== CONFLICTS */
  // A budget conflict is one compact message: the gap, then up to three fixes. Nothing changes until one is chosen.
  function conflictSay(prefix = "") {
    const b = budget(), B = S.c.budget, over = b.check - B;
    const stay = ITEMS[S.plan.stay];
    const biggestOpt = b.optional.slice().sort((x, y) => y.cost - x.cost)[0];
    const fixes = [];
    const fitStay = ["guesthouse", "dorm"].filter((s) => s !== S.plan.stay && ITEMS[s].cost < stay.cost)
      .find((s) => budget(Object.assign({}, S.plan, { stay: s })).check <= B && !(ITEMS[s].needsShared && S.c.priv));
    if (fitStay) fixes.push({ how: "stay", to: fitStay, title: "A cheaper stay", line: `${ITEMS[fitStay].name.replace(" (sample)", "")} — ${ITEMS[fitStay].tradeoff.toLowerCase()}`, result: budget(Object.assign({}, S.plan, { stay: fitStay })).check });
    if (biggestOpt && !S.optionalAddOn && b.min <= B) fixes.push({ how: "addon", title: "Pay for extras separately", line: `${biggestOpt.name.split(" at ")[0]} is paid only by the ${biggestOpt.who} who go`, result: b.min });
    const nb = Math.ceil(b.check / 500) * 500;
    fixes.push({ how: "budget", to: nb, title: "Stretch the budget", line: `${inr(B)} → ${inr(nb)} each, plan unchanged`, result: b.check });
    S.say = { kind: "conflict", html: `<p>${prefix}<b>That's ${inr(over)} over your ${inr(B)} budget.</b> Pick a fix — nothing changes until you do.</p>
      <div class="fixes">${fixes.map((f) => `<button type="button" class="fix" data-act="resolve" data-how="${f.how}" data-to="${f.to || ""}"><b>${f.title}</b><span>${esc(f.line)}</span><em>${inr(f.result)} pp</em></button>`).join("")}</div>
      <details class="why-cost"><summary>What's driving the cost?</summary><p>Stay ${inr(stay.cost)} · buses ${inr(ITEMS[S.plan.go].cost + ITEMS[S.plan.ret].cost)} · local cab ${inr(LOCAL_CAB)}${biggestOpt ? ` · ${esc(biggestOpt.name.split(" at ")[0].toLowerCase())} ${inr(biggestOpt.cost)}` : ""} <span class="tag sim">Simulated</span></p></details>` };
  }
  function resolve(how, to) {
    S.history.push(snapshot());
    if (how === "stay") { S.plan.stay = to; S.changed = [to]; }
    if (how === "addon") S.optionalAddOn = true;
    if (how === "budget") { S.c.budget = parseInt(to, 10); S.c.budgetKnown = true; }
    const b = budget();
    S.say = { kind: "saved", html: `<p>${CHECK}<b>Done — it fits now.</b> About ${inr(b.check)} each against ${inr(S.c.budget)}.</p><div class="say-actions"><button class="btn btn-sm btn-ghost" data-act="undo">Undo</button></div>` };
    render();
    const bn = $("#budgetNum", main); if (bn) bn.classList.add("flash");
  }
  function setBudget(v) {
    S.c.budget = v; S.c.budgetKnown = true;
    if (budget().check > S.c.budget) conflictSay();
    else S.say = { html: `<p>Budget set to ${inr(v)} each — the plan fits at about ${inr(budget().check)}.</p>` };
    render();
  }

  /* =================================================================== FREE TEXT IN EXPLORE */
  function exploreText(t) {
    S.said = t;
    const plan = S.plan;
    if (S.awaitBudget) {
      S.awaitBudget = false;
      const n = /₹?\s?([\d,]{4,6})|(\d+)\s?k\b/i.exec(t);
      if (n) { const v = n[1] ? parseInt(n[1].replace(/,/g, ""), 10) : parseInt(n[2], 10) * 1000; if (v >= 3000 && v <= 20000) { setBudget(v); return; } }
    }
    if (/waterfall|abbey|falls/i.test(t)) {
      if (plan.d2a !== "abbey-falls") { S.say = { html: "<p>There's no waterfall on Day 2 any more.</p>" }; render(); return; }
      S.day = 2; S.open = { id: "abbey-falls", mode: "swap" }; S.selected = "abbey-falls";
      S.say = { html: `<p>Sure. A <b>local food trail</b> in Madikeri fits your love of local food and cuts ≈25 min of driving — ${inr(350)} more each.</p><div class="say-actions"><button class="btn btn-sm btn-primary" data-act="swap" data-slot="d2a" data-to="food-trail">Swap it in</button></div>` };
      render(); applySelection("abbey-falls", { from: "list" }); return;
    }
    if (/undo/i.test(t)) { undo(); return; }
    if (/chik/i.test(t)) { altDest("chikmagalur"); return; }
    if (/wayan/i.test(t)) { altDest("wayanad"); return; }
    if (/why/i.test(t) && /coorg|here|place|destination/i.test(t)) { whyDest(); return; }
    if (/why/i.test(t) && /stay|homestay|hotel/i.test(t)) { openStop(plan.stay, "why"); S.say = { html: "<p>Here's why I picked the stay — open in your plan.</p>" }; render(); applySelection(plan.stay); return; }
    if (/add[- ]?on|separate|personal/i.test(t)) { resolve("addon"); return; }
    if (/raise|increase|stretch/i.test(t) && /budget/i.test(t)) { resolve("budget", Math.ceil(Math.max(budget().check, S.c.budget + 500) / 500) * 500); return; }
    const num = /₹\s?([\d,]{4,6})|(\d{4,5})|(\d+)\s?k\b/i.exec(t);
    if (num) { const v = num[1] ? parseInt(num[1].replace(/,/g, ""), 10) : num[2] ? parseInt(num[2], 10) : parseInt(num[3], 10) * 1000; if (v >= 3000 && v <= 20000) { setBudget(v); return; } }
    if (/cheap|cost|expensive|afford|less money|budget/i.test(t)) {
      S.say = { html: `<p>It's about <b>${range(budget().min, budget().max)}</b> each now. The stay is the biggest piece.</p><div class="say-actions"><button class="btn btn-sm" data-act="open" data-id="${plan.stay}" data-mode="swap">See cheaper stays</button><button class="btn btn-sm btn-ghost" data-act="edit-budget">Set a budget</button></div>` };
      render(); return;
    }
    if (/hotel|stay|homestay|room|dorm|hostel/i.test(t)) { S.say = { html: "<p>Your stay is open below, with its alternatives.</p>" }; openStop(plan.stay, "swap"); return; }
    if (/day ?2|sunday/i.test(t)) { S.day = 2; S.say = { html: "<p>Here's Sunday.</p>" }; render(); return; }
    if (/day ?1|saturday/i.test(t)) { S.day = 1; S.say = { html: "<p>Here's Saturday.</p>" }; render(); return; }
    if (/summary|review|done|finish|book|confirm/i.test(t)) { goReview(); return; }
    if (/why/i.test(t)) { S.say = { html: "<p>Tap any stop and choose <b>Why this?</b> — or ask “why Coorg?”.</p>" }; render(); return; }
    S.say = { html: "<p>I can swap a stop, explain a choice or change the budget.</p>", chips: ["No waterfall on Day 2", "Make it cheaper", "Why Coorg?"] };
    render();
  }
  function whyDest() { S.say = { html: `<p><b>Why Coorg?</b> ${DESTS[0].more}</p>` }; render(); }
  function altDest(id) {
    const d = DESTS.find((x) => x.id === id);
    S.say = { kind: "empty", html: `<p><b>I can't plan ${d.name} yet</b> — the sample data only has a full Coorg trip. Your Coorg plan is unchanged.</p><p class="tiny-note">Empty result (simulated) — the system worked; nothing matched.</p>` };
    render();
  }
  function goReview() { S.stage = "review"; S.open = null; render({ focus: ".review h3" }); $(".review h3", main).setAttribute("tabindex", "-1"); }

  /* =================================================================== STATES LAB (reviewer controls above the prototype) */
  function ensurePlan() { if (!S.plan) jump("itinerary", { quiet: true }); S.stage = "explore"; S.building = false; }
  function lab(kind) {
    if (kind === "reset") { reset(); return; }
    if (kind === "tech") {
      S.techFailNext = true;
      if (S.plan) { S.stage = "explore"; swap("d2a", S.plan.d2a === "abbey-falls" ? "food-trail" : "abbey-falls"); }
      else { jump("prefs", { quiet: true }); S.techFailNext = true; build(); }
      return;
    }
    ensurePlan();
    if (kind === "empty") {
      S.said = "A beach weekend under ₹5,000, within 4 hours";
      S.say = { kind: "empty", html: `<p><b>Nothing in the sample data matches that.</b> That's an empty result, not an error.</p><div class="say-actions"><button class="btn btn-sm" data-act="dismiss">Keep the green getaway</button><button class="btn btn-sm btn-ghost" data-act="edit-budget">Change the budget</button></div>` };
    }
    if (kind === "conflict") {
      S.c.budget = 7000;
      if (S.plan.d2b == null) S.plan.d2b = "rafting";
      S.optionalAddOn = false;
      S.said = "";
      conflictSay("I lowered the budget to ₹7,000 to show this. ");
    }
    if (kind === "unavailable") {
      if (!S.plan.d2b) S.plan.d2b = "rafting";
      const id = S.plan.d2b, alt = id === "rafting" ? "kayak" : "rafting";
      S.flags.unavailable = id; S.day = 2; S.open = { id, mode: "swap" }; S.selected = id;
      S.say = { html: `<p><b>${esc(ITEMS[id].name)} isn't running on your dates</b> (simulated). ${esc(ITEMS[alt].name)} is similar; the rest of your trip stays as it is.</p><div class="say-actions"><button class="btn btn-sm btn-primary" data-act="swap" data-slot="d2b" data-to="${alt}">Swap it in</button></div>` };
    }
    if (kind === "unverified") {
      S.flags.unverified = "rajas-seat"; S.day = 1; S.selected = "rajas-seat"; S.open = null;
      S.say = { html: `<p><b>I couldn't confirm Raja's Seat's evening hours.</b> Keep it flagged, or drop it?</p><div class="say-actions"><button class="btn btn-sm" data-act="keep-flag">Keep it, flagged</button><button class="btn btn-sm btn-ghost" data-act="drop-flag">Drop it</button></div><p class="tiny-note">Information unavailable — not an error.</p>` };
    }
    if (kind === "maperror") {
      S.mapError = true;
      S.say = { html: "<p>The map didn't load, but your plan is all here in the list.</p>" };
    }
    render();
    if (S.selected) applySelection(S.selected, { noScroll: true });
  }

  /* =================================================================== EVENTS */
  function handleText(text) {
    const t = (text || "").trim();
    if (!t || S.busy || S.building) return;
    if (S.stage === "tell") { answer(t); return; }
    if (S.stage === "review") { S.stage = "explore"; }
    exploreText(t);
  }
  root.addEventListener("click", (e) => {
    const say = e.target.closest("[data-say]");
    if (say) { handleText(say.dataset.say); return; }
    const stop = e.target.closest("[data-stop]");
    if (stop && !e.target.closest("[data-act]")) { openStop(stop.dataset.stop, null, stop.classList.contains("marker") ? "map" : "list"); return; }
    const a = e.target.closest("[data-act]");
    if (!a || a.disabled) return;
    switch (a.dataset.act) {
      case "goto":
        if (a.dataset.to === "tell") { runToken++; S.stage = "tell"; S.building = false; S.ask = S.plan ? "confirm" : nextAsk() === "confirm" && !S.said ? "start" : (S.ask === "start" ? "start" : nextAsk()); render(); }
        else if (a.dataset.to === "explore" && S.plan) { S.stage = "explore"; render(); }
        else if (a.dataset.to === "review" && S.plan) goReview();
        break;
      case "rm-pref": S.prefs.splice(parseInt(a.dataset.i, 10), 1); render({ focus: "#prefAdd", noScroll: true }); break;
      case "find": if (S.plan) { S.stage = "explore"; render(); } else build(); break;
      case "retry-build": build(); break;
      case "cancel-build": runToken++; S.stage = "tell"; S.building = false; S.ask = "confirm"; S.note = "Stopped — nothing's lost."; render(); break;
      case "day": S.day = parseInt(a.dataset.day, 10); S.open = null; S.arrive = true; render(); S.arrive = false; break;
      case "why": openStop(a.dataset.id, "why"); break;
      case "swap-open": openStop(a.dataset.id, "swap"); break;
      case "open": openStop(a.dataset.id, a.dataset.mode || null); break;
      case "swap": S.said = ""; swap(a.dataset.slot, a.dataset.to); break;
      case "remove": removeStop(a.dataset.slot); break;
      case "undo": undo(); break;
      case "review": goReview(); break;
      case "edit-plan": S.stage = "explore"; render({ focus: "[data-act=review]", noScroll: true }); break;
      case "edit-budget": S.awaitBudget = true; S.said = ""; S.say = { html: "<p>What should each person spend, roughly?</p>", chips: ["₹6,500", "₹7,000", "₹8,000", "₹10,000"] }; if (S.stage !== "explore") S.stage = "explore"; render({ focus: "#chatInput", noScroll: true }); break;
      case "resolve": resolve(a.dataset.how, a.dataset.to); break;
      case "why-dest": S.said = ""; whyDest(); break;
      case "alt-dest": S.said = ""; altDest(a.dataset.id); break;
      case "map-retry": S.mapError = false; S.say = { html: "<p>Map's back.</p>" }; render(); break;
      case "keep-flag": S.say = { html: "<p>Kept, marked as unconfirmed.</p>" }; render(); break;
      case "drop-flag": S.history.push(snapshot()); S.plan.d1d = null; delete S.flags.unverified; S.selected = null; S.say = { html: "<p>Dropped the sunset stop; the fort walk runs longer.</p><div class=\"say-actions\"><button class=\"btn btn-sm btn-ghost\" data-act=\"undo\">Undo</button></div>" }; render(); break;
      case "dismiss": S.said = ""; S.say = { html: "<p>Sticking with Coorg.</p>" }; render(); break;
    }
  });
  root.addEventListener("submit", (e) => {
    const f = e.target;
    e.preventDefault();
    if (f.id === "composer") { const i = $("#chatInput", f); const v = i.value; i.value = ""; handleText(v); return; }
    if (f.dataset.actForm === "add-pref") {
      const v = $("input", f).value.trim();
      if (v) { S.prefs.push({ id: "c" + Date.now(), label: v.charAt(0).toUpperCase() + v.slice(1), inferred: false }); render({ focus: "#prefAdd", noScroll: true }); }
    }
  });
  root.addEventListener("keydown", (e) => { if (e.key === "Escape" && S.open) { const id = S.open.id; S.open = null; render({ focus: `.stop[data-stop="${id}"]`, noScroll: true }); } });
  // map image failure → keep the plan, explain, offer a retry
  root.addEventListener("error", (e) => { if (e.target.matches && e.target.matches("[data-mapimg]")) { S.mapError = true; render(); } }, true);

  /* =================================================================== JUMP / RESET (used by the case study's walkthrough) */
  // Old walkthrough targets map onto the three stages:
  // welcome → Tell us · prefs/constraints → Tell us, understood · destinations/itinerary → Explore ·
  // replace → Explore with a swap offered · conflict → Explore with a budget conflict · summary → Review
  function reset() { runToken++; S = fresh(); render(); }
  function jump(to, opts = {}) {
    runToken++;
    S = fresh();
    if (to === "welcome") { render(); return; }
    interpret(SAMPLE, true);
    S.said = SAMPLE;
    if (to === "constraints") { S.ask = nextAsk(); render(); return; }       // asks the one missing detail: when
    S.c.whenKnown = true;
    S.ask = "confirm";
    if (to === "prefs") { if (!opts.quiet) render(); return; }
    S.plan = {};
    SLOTS.forEach((s) => { S.plan[s.id] = s.alts[0]; });
    S.stage = "explore"; S.said = "";
    S.say = { html: `<p><b>Coorg fits best</b> — green hills, cafés and local food, about ${inr(budget().check)} each. Tap any stop to see why it's there or to change it.</p>`, chips: ["Why Coorg?", "No waterfall on Day 2", "Make it cheaper"] };
    if (opts.quiet) return;
    if (to === "replace") { exploreText("I don't want another waterfall on Day 2"); return; }
    if (to === "conflict") { render(); lab("conflict"); return; }
    if (to === "summary") { goReview(); return; }
    render();
  }

  window.Prototype = { jump, reset };
  render();

  // reviewer controls live outside #app
  document.addEventListener("click", (e) => {
    const l = e.target.closest("[data-lab]");
    if (l) { e.preventDefault(); lab(l.dataset.lab); }
  });
})();
