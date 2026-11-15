/* =====================================================================
   prototype.js — AI trip planner prototype (simulated)
   ---------------------------------------------------------------------
   One journey: six friends from Bangalore plan a relaxed weekend.
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
    "bus-out": { kind: "transport", day: 1, name: "Overnight sleeper bus to Madikeri", label: "Suggested transport", area: "Madikeri bus stand", x: 392, y: 338, time: "Fri 22:30 → Sat 06:30", cost: 950, thumb: "bus",
      why: ["Leaves after work on Friday — no leave needed", "Overnight travel saves a hotel night", "Lowest cost of the three ways to get there"], caveat: "Seat availability unverified" },
    "car-out": { kind: "transport", day: 1, name: "Self-drive, two rental cars", label: "Alternative transport", area: "Arrive at the homestay", x: 392, y: 338, time: "Sat 05:00 → 10:30", cost: 1400, thumb: "car",
      why: ["Flexible stops on the way", "Cars available for the whole weekend"], tradeoff: "+₹450 pp; arrive 4 h later; two people drive", affects: "Day 1 coffee walk moves from 10:00 to 11:30" },
    "train-out": { kind: "transport", day: 1, name: "Morning train to Mysuru + shared cab", label: "Trade-off transport", area: "Mysuru → Madikeri by cab", x: 392, y: 338, time: "Sat 06:15 → 11:30", cost: 800, thumb: "train",
      why: ["Cheapest door-to-door", "Comfortable seats; no night travel"], tradeoff: "−₹150 pp; arrive 5 h later", affects: "Day 1 coffee walk is dropped; lunch moves to 13:30" },
    // --- stay
    "homestay": { kind: "stay", day: "both", name: "Coffee-estate homestay (sample)", label: "Recommended stay", area: "Estate road, south of Madikeri", x: 300, y: 438, time: "Sat 09:30 check-in · Sun 10:30 check-out", cost: 1800, unit: "pp · 1 night", thumb: "homestay",
      why: ["Within the ~₹2,000 per-person stay share", "Quiet and green — matches “greenery” and “not hectic”", "≈12 min to the Day 1 coffee walk"], caveat: "Room availability unverified · name is a placeholder" },
    "guesthouse": { kind: "stay", day: "both", name: "Town-centre guesthouse (sample)", label: "Alternative stay", area: "Madikeri town", x: 378, y: 290, time: "Sat 09:30 check-in · Sun 10:30 check-out", cost: 1200, unit: "pp · 1 night", thumb: "guesthouse",
      why: ["Walk to cafes and the fort", "Private rooms"], tradeoff: "−₹600 pp; in town, less green", affects: "Day 1 coffee walk becomes a 20 min drive" },
    "dorm": { kind: "stay", day: "both", name: "Backpacker hostel dorm (sample)", label: "Trade-off stay", area: "Madikeri town", x: 410, y: 312, time: "Sat 09:30 check-in · Sun 10:30 check-out", cost: 650, unit: "pp · 1 night", thumb: "hostel", needsShared: true,
      why: ["Lowest-cost safe option", "Common area for the group"], tradeoff: "−₹1,150 pp; shared dorm, less privacy", affects: "Day 1 coffee walk becomes a 20 min drive" },
    // --- Day 1
    "coffee-walk": { kind: "activity", day: 1, name: "Guided coffee plantation walk", label: "Morning activity", area: "Estate near the homestay", x: 222, y: 482, time: "10:00–12:00", cost: 500, thumb: "coffee", shared: true,
      why: ["Matches “greenery” and “small cafes”", "Starts next to the stay — minimal travel", "Gentle pace"] },
    "spice-garden": { kind: "activity", day: 1, name: "Spice garden & honey farm visit (sample)", label: "Alternative activity", area: "Between estate and town", x: 248, y: 392, time: "10:00–11:30", cost: 300, thumb: "market", shared: true,
      why: ["Local produce and tastings", "Shorter and cheaper"], tradeoff: "−₹200 pp; less walking in greenery" },
    "kodava-lunch": { kind: "food", day: 1, name: "Kodava home-style lunch", label: "Local food", area: "Madikeri town", x: 400, y: 368, time: "12:45", cost: 350, thumb: "food", shared: true,
      why: ["“Local food” — regional cuisine", "On the way into town"] },
    "cafe-lunch": { kind: "food", day: 1, name: "Cafe lunch on Main Road (sample)", label: "Alternative lunch", area: "Madikeri town", x: 410, y: 352, time: "12:45", cost: 450, thumb: "cafe", shared: true,
      why: ["Small independent cafe", "Vegetarian-friendly menu (unverified)"], tradeoff: "+₹100 pp" },
    "fort-walk": { kind: "activity", day: 1, name: "Madikeri Fort & old-town walk", label: "Afternoon sightseeing", area: "Madikeri town", x: 348, y: 300, time: "15:00–16:30", cost: 0, thumb: "fort", shared: true,
      why: ["Walkable and low-effort", "Free to enter (simulated)", "10 min from the sunset point"], caveat: "Opening hours unverified" },
    "rajas-seat": { kind: "activity", day: 1, name: "Raja's Seat sunset viewpoint", label: "Evening", area: "Madikeri town", x: 286, y: 246, time: "17:15–18:30", cost: 50, thumb: "viewpoint", shared: true,
      why: ["A slow, scenic end to the day", "Close to dinner"] },
    "cafe-dinner": { kind: "food", day: 1, name: "Dinner at a small local cafe", label: "Dinner", area: "Madikeri town", x: 318, y: 352, time: "19:30", cost: 450, thumb: "cafe", shared: true,
      why: ["“Small cafes” preference", "Short drive back to the stay"] },
    // --- Day 2
    "abbey-falls": { kind: "activity", day: 2, name: "Abbey Falls morning walk", label: "Morning nature walk", area: "Abbey Falls, west of Madikeri", x: 168, y: 206, time: "08:00–09:30", cost: 50, thumb: "waterfall", shared: true,
      why: ["Nature walk while it's cool", "Short trail — relaxed pace"], caveat: "Trail conditions unverified" },
    "food-trail": { kind: "food", day: 2, name: "Madikeri local food trail", label: "Alternative morning", area: "Madikeri town", x: 430, y: 330, time: "08:30–10:00", cost: 400, thumb: "market", shared: true,
      why: ["Builds on your “local food” preference", "In town — less driving before check-out"], tradeoff: "+₹350 pp; ≈25 min less travel", affects: "Day 2 route recalculated; nothing else changes" },
    "market-walk": { kind: "activity", day: 2, name: "Spice & honey market stroll", label: "Alternative morning", area: "Madikeri town", x: 420, y: 316, time: "08:30–09:30", cost: 150, thumb: "market", shared: true,
      why: ["Easy walk, local produce"], tradeoff: "+₹100 pp; shorter", affects: "Day 2 route recalculated" },
    "rafting": { kind: "activity", day: 2, name: "White-water rafting at Dubare", label: "Optional · adventure", area: "Dubare, on the Kaveri", x: 704, y: 566, time: "11:30–13:00", cost: 1500, thumb: "raft", optional: true, who: "2 of 6",
      why: ["The adventure option two of you asked for", "Same stop as the riverside option — the group stays together"], caveat: "Seasonal · availability unverified" },
    "kayak": { kind: "activity", day: 2, name: "Kayaking at Harangi reservoir (sample)", label: "Optional · adventure", area: "Harangi", x: 606, y: 296, time: "11:30–13:00", cost: 900, thumb: "raft", optional: true, who: "2 of 6",
      why: ["Calmer water sport", "Similar time slot"], tradeoff: "−₹600 pp for the two; splits the group for 2 h", affects: "Adds a separate route for two people" },
    "river-walk": { kind: "activity", day: 2, name: "Dubare riverside & elephant camp visit", label: "Optional · relaxed", area: "Dubare, on the Kaveri", x: 738, y: 538, time: "11:30–13:00", cost: 300, thumb: "elephant", optional: true, who: "4 of 6",
      why: ["Easy riverside time for the four who prefer a relaxed day", "Meets the rafters at the same place"], caveat: "Camp timings vary · unverified" },
    "river-cafe": { kind: "food", day: 2, name: "Free time at a riverside cafe (sample)", label: "Optional · rest", area: "Near Dubare", x: 688, y: 508, time: "11:30–13:00", cost: 200, thumb: "rest", optional: true, who: "4 of 6",
      why: ["Rest and rejoin later"], tradeoff: "−₹100 pp" },
    "tibetan-lunch": { kind: "food", day: 2, name: "Tibetan lunch in Bylakuppe", label: "Lunch", area: "Bylakuppe", x: 788, y: 442, time: "13:45", cost: 300, thumb: "food", shared: true,
      why: ["Everyone regroups here", "On the way home"] },
    "monastery": { kind: "activity", day: 2, name: "Namdroling Monastery (Golden Temple)", label: "Culture stop", area: "Bylakuppe", x: 822, y: 386, time: "15:00–16:15", cost: 0, thumb: "monastery", shared: true,
      why: ["Culture stop with no detour — it's on the return route", "Calm, walkable grounds"], caveat: "Visiting hours unverified" },
    "bus-back": { kind: "transport", day: 2, name: "Evening bus to Bangalore", label: "Return", area: "Kushalnagar bus stand", x: 652, y: 420, time: "17:30 → ~23:30", cost: 900, thumb: "bus",
      why: ["Home Sunday night, before work on Monday", "Leaves from the town nearest the monastery"], caveat: "Seat availability unverified" },
    "early-bus": { kind: "transport", day: 2, name: "Earlier bus at 15:00 (sample)", label: "Alternative return", area: "Kushalnagar bus stand", x: 652, y: 420, time: "15:00 → ~21:00", cost: 900, thumb: "bus",
      why: ["Home 2.5 h earlier"], tradeoff: "Same price; monastery visit shortened to 40 min", affects: "Monastery visit shortened" }
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

  const DESTS = [
    { id: "coorg", name: "Coorg (Kodagu)", rank: "Best match", cls: "best", img: "dest-coorg", hours: "≈5–6 h by road", hoursMax: 6, range: [6750, 7950],
      why: ["Coffee-estate greenery and misty viewpoints", "Small cafes and Kodava food", "Gentle walks, with rafting nearby for the two who want adventure"] },
    { id: "chikmagalur", name: "Chikmagalur", rank: "Alternative", cls: "", img: "dest-chikmagalur", hours: "≈5 h by road", hoursMax: 5, range: [7000, 8400],
      why: ["Coffee country with hill views", "Treks suit the adventure pair", "Fewer easy walks for the relaxed four"] },
    { id: "wayanad", name: "Wayanad", rank: "Trade-off", cls: "", img: "dest-wayanad", hours: "≈6–7 h by road", hoursMax: 7, range: [7600, 9200],
      why: ["Dense forest and wildlife", "Longer travel each way", "Usually above this budget"] }
  ];

  const PREF_RULES = [
    { id: "nature", re: /green|greenery|nature|hill|mountain|forest|tree|mist/i, label: "Green, nature-led places" },
    { id: "cafes", re: /cafe|café|coffee/i, label: "Small independent cafes" },
    { id: "food", re: /food|eat|cuisine|local dish|street/i, label: "Local food" },
    { id: "walk", re: /walk|stroll|wander/i, label: "Walkable places" },
    { id: "relaxed", re: /relax|slow|not (too |very )?hectic|chill|calm|rest|easy/i, label: "Relaxed pace" },
    { id: "adventure", re: /adventure|raft|trek|thrill|adrenaline|kayak/i, label: "Some adventure (part of the group)" },
    { id: "culture", re: /history|heritage|fort|temple|monaster|culture|museum/i, label: "Culture & heritage" },
    { id: "budget", re: /budget|cheap|afford|₹|\brs\b|\d+\s?k\b/i, label: "Budget-conscious" }
  ];
  const SAMPLE = "Six of us from Bangalore want a weekend away. Lots of greenery, small cafes, local food and walking around — nothing too hectic. Two of us want a bit of adventure. Around ₹8,000 each.";

  /* =================================================================== STATE */
  const fresh = () => ({
    step: "welcome",
    entry: "idea",
    prefs: [],
    notes: [],
    c: { from: "Bangalore", fromKnown: false, when: "this", people: 6, peopleKnown: false, budget: 8000, budgetKnown: false, back: true, maxh: false, veg: false, priv: false, group: true },
    dest: null,
    plan: null,          // { slotId: itemId | null }
    optionalAddOn: false,
    flags: {},           // { unverified: itemId, unavailable: itemId }
    history: [],
    day: "all",
    view: "map",
    selected: null,
    detailOpen: false,
    mapError: false,
    summary: false,
    changed: [],
    busy: false,
    techFailNext: false,
    mobileView: "chat"
  });
  let S = fresh();
  let runToken = 0;          // cancels in-flight loaders when the user restarts/jumps
  const instant = () => reducedMotion() || S.fast;

  /* =================================================================== SHELL */
  root.innerHTML = `
    <div class="app-top">
      <div class="logo"><i aria-hidden="true"></i>Trip Planner <small>an AI concept for MakeMyTrip</small></div>
      <div class="crumbs" aria-label="Planning progress">
        <span data-crumb="welcome">Discover</span><span data-crumb="constraints">Clarify</span><span data-crumb="destinations">Destinations</span><span data-crumb="itinerary">Itinerary</span><span data-crumb="summary">Review</span>
      </div>
    </div>
    <div class="app-switch" role="tablist" aria-label="Prototype view">
      <button role="tab" aria-selected="true" data-mview="chat">Conversation</button>
      <button role="tab" aria-selected="false" data-mview="trip">Trip plan <span data-trip-dot></span></button>
    </div>
    <div class="app-body" data-view="chat">
      <section class="chat" aria-label="Conversation with the AI planner">
        <div class="chat-log" id="chatLog" aria-live="polite" aria-relevant="additions"></div>
        <div class="composer">
          <div class="suggestions" id="suggest" aria-label="Suggested replies"></div>
          <form id="composer" autocomplete="off">
            <label for="chatInput" class="sr-only">Message the trip planner</label>
            <textarea id="chatInput" rows="1" placeholder="Describe your ideal trip…"></textarea>
            <button class="send" type="submit" aria-label="Send">➤</button>
          </form>
          <div class="hint">Enter to send · Shift+Enter for a new line · replies are simulated</div>
        </div>
      </section>
      <section class="ws" id="ws" aria-label="Trip workspace"></section>
    </div>`;

  const log = $("#chatLog", root);
  const ws = $("#ws", root);
  const input = $("#chatInput", root);
  const suggest = $("#suggest", root);
  const body = $(".app-body", root);
  const peek = document.getElementById("peek");

  /* =================================================================== CHAT HELPERS */
  function msg(who, html, opts = {}) {
    const m = document.createElement("div");
    m.className = "msg " + who;
    if (who === "system") m.innerHTML = `<div class="bubble">${html}</div>`;
    else m.innerHTML = `<div class="who">${who === "ai" ? '<span class="av" aria-hidden="true"></span>Planner' : "You"}</div><div class="bubble">${html}</div>`;
    log.appendChild(m);
    if (opts.focusTrip !== true && S.mobileView === "trip" && opts.needsAction) setMobileView("chat");
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
    return m;
  }
  const ai = (html, o) => msg("ai", html, o);
  const user = (text) => msg("user", esc(text));
  const sys = (html) => msg("system", html);

  function setSuggestions(list) {
    suggest.innerHTML = list.map((s) => `<button type="button" class="chip" data-say="${esc(s)}">${esc(s)}</button>`).join("");
  }

  /** Staged loader: shows what the system is doing, step by step; cancellable. */
  function loader(title, steps, done, opts = {}) {
    const token = ++runToken;
    S.busy = true;
    const el = ai(`<div class="loader"><div class="ltitle"><span class="route-dots" aria-hidden="true"><i></i><i></i><i></i></span>${esc(title)}</div>
      <ol>${steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${opts.cancellable ? '<button type="button" class="btn btn-sm btn-ghost cancel" data-act="cancel-load">Cancel</button>' : ""}</div>`);
    const lis = $$("li", el);
    const wait = instant() ? 30 : (opts.speed || 520);
    let i = 0;
    function tick() {
      if (token !== runToken) { return; }
      if (i > 0) { lis[i - 1].classList.remove("doing"); lis[i - 1].classList.add("done"); }
      if (i < lis.length) { lis[i].classList.add("doing"); i++; setTimeout(tick, wait); }
      else {
        S.busy = false;
        const c = $(".cancel", el); if (c) c.remove();
        const lt = $(".ltitle", el); lt.querySelector(".route-dots").remove();
        if (S.techFailNext) {
          S.techFailNext = false;
          lis[lis.length - 1].classList.remove("done");
          techError(() => done());
          return;
        }
        done();
      }
    }
    tick();
    el.dataset.token = token;
    return el;
  }

  function techError(retry) {
    const m = ai(`<p><b>We hit a small roadblock while planning.</b> ${S.plan ? "Your existing itinerary is still here." : "Everything you've told me is still here."} Let's try again.</p>
      <p class="tiny-note">Technical error (simulated) — not a problem with your choices.</p>
      <div class="msg-actions"><button class="btn btn-sm btn-primary" data-act="retry">Try again</button></div>`, { needsAction: true });
    m._retry = retry;
  }

  /* =================================================================== STEP 0 — WELCOME */
  function welcome() {
    log.innerHTML = "";
    ai(`<p>Hi! I'm your trip planner. <b>Before we plan your next trip, tell me what a perfect getaway looks like to you.</b></p>
        <p class="tiny-note">You don't need a destination yet. I'll suggest, explain and let you change anything — you make the final call.</p>
        <div class="msg-actions">
          <button class="chip" data-act="entry-idea">Start with a travel idea</button>
          <button class="chip" data-act="entry-dates">Start with available dates</button>
          <button class="chip" data-act="entry-dest">I already have a destination</button>
        </div>`);
    setSuggestions([SAMPLE, "A slow weekend somewhere green with good coffee", "Somewhere with history and food, two of us"]);
    input.placeholder = "Describe your ideal trip…";
    renderWS();
  }

  /* =================================================================== STEP 1 — PREFERENCES */
  function interpret(text, quick) {
    S.rawText = text;
    const prefs = [];
    PREF_RULES.forEach((r) => {
      const m = text.match(r.re);
      if (m) prefs.push({ id: r.id, label: r.label, from: m[0], inferred: false });
    });
    const notes = [];
    // structured details mentioned in passing (never asked again later)
    const cities = /(bangalore|bengaluru|delhi|mumbai|chennai|hyderabad|pune|kolkata)/i.exec(text);
    if (cities) {
      const c = cities[1].toLowerCase();
      S.c.fromKnown = true;
      if (c === "bangalore" || c === "bengaluru") S.c.from = "Bangalore";
      else { S.c.from = "Bangalore"; notes.push(`This prototype's sample data starts from Bangalore, so I'll plan from there to show the flow (you said ${esc(cities[1])}).`); }
    }
    const words = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
    const ppl = /(\d+|two|three|four|five|six|seven|eight)\s*(of us|friends|people|pax|adults)/i.exec(text) || /we are (\d+|two|three|four|five|six|seven|eight)/i.exec(text);
    if (ppl) { const v = words[ppl[1].toLowerCase()] || parseInt(ppl[1], 10); if (v > 0 && v < 20) { S.c.people = v; S.c.peopleKnown = true; } }
    const bud = /₹\s?([\d,]+)/.exec(text) || /(\d+(?:\.\d)?)\s?k\b/i.exec(text) || /(?:rs\.?|inr)\s?([\d,]+)/i.exec(text);
    if (bud) {
      let v = bud[0].toLowerCase().includes("k") && !bud[0].includes("₹") ? parseFloat(bud[1]) * 1000 : parseInt(bud[1].replace(/,/g, ""), 10);
      if (v >= 2000 && v <= 50000) { S.c.budget = Math.round(v / 500) * 500; S.c.budgetKnown = true; }
    }
    if (/beach|sea|goa/i.test(text)) notes.push("Beach destinations aren't in this prototype's sample data, so I'll focus on the rest of what you said.");
    if (!prefs.length) {
      ["nature", "relaxed", "food"].forEach((id) => { const r = PREF_RULES.find((x) => x.id === id); prefs.push({ id, label: r.label, from: "", inferred: true }); });
      notes.push("I didn't pick up many specifics, so these are starting guesses (dashed) — change them freely.");
    }
    S.prefs = prefs;
    S.notes = notes;
    S.step = "prefs";
    const go = () => showPrefCard();
    if (quick) go(); else loader("Getting to know your kind of getaway…", ["Reading what you described", "Matching it to trip styles"], go);
  }

  function prefSummary() {
    const has = (id) => S.prefs.some((p) => p.id === id);
    const bits = [];
    if (has("nature")) bits.push("green, nature-led");
    if (has("relaxed")) bits.push("slow-paced");
    if (has("culture")) bits.push("culture-rich");
    let s = bits.length ? bits.join(", ") + " getaways" : "getaways";
    const extra = [];
    if (has("food")) extra.push("local food");
    if (has("cafes")) extra.push("small cafes");
    if (has("walk")) extra.push("time to wander on foot");
    if (extra.length) s += " with " + extra.join(", ").replace(/, ([^,]*)$/, " and $1");
    if (has("adventure")) s += " — plus a little adventure for part of the group";
    return s;
  }

  function showPrefCard() {
    const notes = S.notes.map((n) => `<p class="tiny-note">${n}</p>`).join("");
    const m = ai(`<p>Based on what you've described, you seem to enjoy <b>${esc(prefSummary())}</b>. Does that sound like your kind of trip?</p>
      <div class="pref-card" data-pref-card>
        <h4 style="margin:0">Trip preferences <span class="badge b-assume" style="margin-left:4px">Inferred</span></h4>
        <div class="pref-list" data-pref-list>${prefChips()}</div>
        <form class="pref-add" data-act-form="add-pref"><label class="sr-only" for="prefAdd">Add a preference</label><input id="prefAdd" placeholder="Add something (e.g. sunrise views)"><button class="btn btn-sm" type="submit">Add</button></form>
        <span class="tiny-note">A temporary summary of <i>this</i> trip — not a profile of you. Remove anything that's wrong.</span>
      </div>
      ${notes}
      <div class="msg-actions">
        <button class="btn btn-sm btn-primary" data-act="prefs-ok">Yes, that's my kind of trip</button>
        <button class="btn btn-sm" data-act="prefs-other">Try a different direction</button>
      </div>`, { needsAction: true });
    setSuggestions(["Add: sunrise views", "Remove the adventure bit", "Yes, that's it"]);
    input.placeholder = "Add or correct anything…";
    return m;
  }
  function prefChips() {
    return S.prefs.map((p, i) => `<span class="pref ${p.inferred ? "inferred" : ""}">${esc(p.label)}${p.from ? ` <span class="from">· “${esc(p.from)}”</span>` : ""}<button type="button" data-act="rm-pref" data-i="${i}" aria-label="Remove ${esc(p.label)}">✕</button></span>`).join("") || '<span class="tiny-note">No preferences yet — add one, or I\'ll suggest broadly.</span>';
  }
  function refreshPrefCards() { $$("[data-pref-list]", log).slice(-1).forEach((el) => { el.innerHTML = prefChips(); }); }

  /* =================================================================== STEP 2 — CONSTRAINTS */
  function nextWeekend(offsetWeeks) {
    const d = new Date();
    const add = (5 - d.getDay() + 7) % 7 + (offsetWeeks * 7);
    const fri = new Date(d.getFullYear(), d.getMonth(), d.getDate() + add);
    const sun = new Date(fri.getFullYear(), fri.getMonth(), fri.getDate() + 2);
    const f = (x) => x.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
    return `${f(fri)} night – ${f(sun)}`;
  }
  function showConstraintCard() {
    S.step = "constraints";
    const c = S.c;
    const known = (k) => k ? '<span class="known">✓ from your message</span>' : "";
    ai(`<p>${S.entry === "dates" ? "Great — tell me when you're free and roughly what you'd spend. I'll suggest places that fit." : "Lovely. A few details so I only suggest places that actually work — I've filled in what you already told me."}</p>
      <form class="constraint-card" data-act-form="constraints">
        <div class="field"><label for="cFrom">Leaving from ${known(c.fromKnown)}</label><input type="text" id="cFrom" value="${esc(c.from)}" readonly aria-describedby="cFromNote"><span class="tiny-note" id="cFromNote">Sample data covers departures from Bangalore.</span></div>
        <div class="field"><span class="flabel" id="cWhenL">When</span>
          <div class="seg" role="radiogroup" aria-labelledby="cWhenL">
            <label><input type="radio" name="when" value="this" ${c.when === "this" ? "checked" : ""}><span>This weekend · ${nextWeekend(0)}</span></label>
            <label><input type="radio" name="when" value="next" ${c.when === "next" ? "checked" : ""}><span>Next weekend · ${nextWeekend(1)}</span></label>
          </div></div>
        <div class="field"><span class="flabel">Travellers ${known(c.peopleKnown)}</span>
          <div class="stepper"><button type="button" data-act="ppl" data-d="-1" aria-label="Fewer travellers">−</button><output id="cPeople" aria-live="polite">${c.people}</output><button type="button" data-act="ppl" data-d="1" aria-label="More travellers">+</button></div></div>
        <div class="field"><label for="cBudget">Budget per person ${known(c.budgetKnown)}</label>
          <span class="budget-out" id="cBudgetOut">${inr(c.budget)}</span>
          <input type="range" id="cBudget" min="3000" max="15000" step="500" value="${c.budget}" aria-valuetext="${inr(c.budget)} per person"></div>
        <fieldset class="field" style="border:0;padding:0;margin:0 0 10px"><legend class="flabel" style="padding:0">Must-haves (optional)</legend>
          <label class="small"><input type="checkbox" name="back" ${c.back ? "checked" : ""}> Back by Sunday night (work on Monday)</label>
          <label class="small"><input type="checkbox" name="maxh" ${c.maxh ? "checked" : ""}> At most ~6 h travel each way</label>
          <label class="small"><input type="checkbox" name="priv" ${c.priv ? "checked" : ""}> Private rooms only</label>
        </fieldset>
        <div class="field" data-groupbox ${c.people >= 3 ? "" : "hidden"}><span class="flabel">Group preferences <span class="badge b-assume">Illustrative group</span></span>
          <div class="group-list">
            <div><span class="av" style="background:var(--sage)">4</span>Relaxed, nature, food &amp; cafes<span class="tag shared">most</span></div>
            <div><span class="av" style="background:var(--coral)">2</span>Want some adventure<span class="tag opt">some</span></div>
          </div><span class="tiny-note">In the full product each friend could add their own; here it's represented for the group.</span></div>
        <button class="btn btn-primary btn-sm" type="submit">Find places that fit</button>
      </form>`, { needsAction: true });
    setSuggestions(["We're 6, about ₹8,000 each", "Make it ₹10,000 each", "Just 2 of us"]);
    input.placeholder = "Or just type it, e.g. “6 of us, ₹8k each”";
    renderWS();
  }
  function readConstraints(form) {
    const c = S.c;
    c.when = (form.querySelector("input[name=when]:checked") || {}).value || "this";
    c.budget = parseInt(form.querySelector("#cBudget").value, 10);
    c.back = form.querySelector("input[name=back]").checked;
    c.maxh = form.querySelector("input[name=maxh]").checked;
    c.priv = form.querySelector("input[name=priv]").checked;
  }

  /* =================================================================== STEP 3 — DESTINATIONS */
  function exploreDestinations(quick) {
    S.step = "destinations";
    const go = () => showDestinations();
    if (quick) go(); else loader("Looking for places that match your travel mood…", ["Checking what's reachable from " + S.c.from + " in a weekend", "Comparing a few possibilities side by side", "Estimating costs per person (simulated)"], go, { cancellable: true });
  }
  function destCard(d) {
    const fits = d.range[1] <= S.c.budget ? `fits ${inr(S.c.budget)}` : d.range[0] <= S.c.budget ? `may exceed ${inr(S.c.budget)}` : `over ${inr(S.c.budget)}`;
    const tooFar = S.c.maxh && d.hoursMax > 6;
    return `<div class="dest ${d.cls}">
      <img src="assets/illustrations/${d.img}.svg" alt="" width="360" height="200">
      <div class="dbody">
        <div class="dhead"><h5>${d.name}</h5><span class="rank">${d.rank}</span></div>
        <div class="facts"><span>🚌 ${d.hours}</span><span>${inr(d.range[0])}–${inr(d.range[1]).slice(1)} pp</span><span>${fits}</span></div>
        ${tooFar ? '<p class="tiny-note" style="color:var(--coral-text)">Exceeds your ~6 h travel limit.</p>' : ""}
        <ul>${d.why.map((w) => `<li>${w}</li>`).join("")}</ul>
        <div class="dact"><button class="btn btn-sm ${d.id === "coorg" ? "btn-primary" : ""}" data-act="pick-dest" data-id="${d.id}">Plan this trip</button></div>
      </div></div>`;
  }
  function showDestinations() {
    S.step = "destinations";
    ai(`<p>Here are three places that could work for <b>${S.c.people} ${S.c.people === 1 ? "person" : "people"}</b> from ${S.c.from}, ${nextWeekend(S.c.when === "next" ? 1 : 0)}, around <b>${inr(S.c.budget)}</b> each.</p>
      <div class="dest-grid">${DESTS.map(destCard).join("")}</div>
      <div class="msg-actions"><button class="btn btn-sm btn-ghost" data-act="compare">Compare side by side</button></div>
      <p class="tiny-note">Journey times and cost ranges are simulated estimates. Coorg has a full sample itinerary in this prototype.</p>`, { needsAction: true });
    setSuggestions(["Why Coorg?", "Plan Coorg", "Compare them"]);
    input.placeholder = "Ask about a place, or pick one…";
    renderWS();
  }
  function compareTable() {
    const rows = [["Journey (est.)", (d) => d.hours], ["Cost pp (est.)", (d) => `${inr(d.range[0])}–${inr(d.range[1]).slice(1)}`], ["Budget fit", (d) => d.range[1] <= S.c.budget ? "✓ fits" : "may exceed"], ["Relaxed four", (d) => d.id === "chikmagalur" ? "partial" : "good"], ["Adventure two", (d) => d.id === "wayanad" ? "partial" : "good"], ["Greenery", () => "good"]];
    return `<table class="compare-tbl"><thead><tr><th></th>${DESTS.map((d) => `<th>${d.name.split(" ")[0]}</th>`).join("")}</tr></thead><tbody>${rows.map(([l, f]) => `<tr><th scope="row">${l}</th>${DESTS.map((d) => `<td>${f(d)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }
  function pickDest(id, quick) {
    if (id !== "coorg") {
      const d = DESTS.find((x) => x.id === id);
      ai(`<p><b>I don't have enough sample data to plan ${d.name} in this prototype.</b></p>
        <p class="tiny-note">Empty result — the simulated dataset only contains a full Coorg weekend. In the real product this would search live inventory.</p>
        <div class="msg-actions"><button class="btn btn-sm btn-primary" data-act="pick-dest" data-id="coorg">Plan Coorg instead</button><button class="btn btn-sm btn-ghost" data-act="back-dest">See the options again</button></div>`, { needsAction: true });
      return;
    }
    S.dest = "coorg";
    const build = () => {
      S.plan = {};
      SLOTS.forEach((s) => { S.plan[s.id] = s.alts[0]; });
      if (!S.prefs.some((p) => p.id === "adventure")) { S.plan.d2b = null; }
      S.step = "itinerary";
      S.selected = null;
      S.history = [];
      renderWS();
      const b = budget();
      ai(`<p>Here's a first plan for <b>a relaxed weekend in Coorg</b> — ${S.c.people} travellers, ${nextWeekend(S.c.when === "next" ? 1 : 0)}.</p>
        <ul><li><b>Shared anchors</b> everyone does together</li>${S.plan.d2b ? "<li><b>Two optional choices</b> on Sunday: rafting for the adventure pair, a riverside visit for the rest — same place, so you regroup for lunch</li>" : ""}<li>Estimated <b>${inr(b.min)}${b.max !== b.min ? "–" + inr(b.max).slice(1) : ""} per person</b> against your ${inr(S.c.budget)} <span class="tag sim">Simulated</span></li></ul>
        <p>Tap any stop on the map or in the list to see why it's there, its alternatives, and what changing it would affect.</p>`);
      setSuggestions(["I don't want another waterfall on Day 2", "Can we make it cheaper?", "Why this homestay?", "Review the trip"]);
      input.placeholder = "Ask for a change…";
      setMobileView("trip");
      flagTripDot();
    };
    if (quick) build(); else loader("Putting the pieces of your trip together…", ["Transport from " + S.c.from, "A stay that suits the group", "Day-by-day activities", "Route & travel time between stops", "Budget per person"], build, { cancellable: true });
  }

  /* =================================================================== BUDGET */
  function budget(plan = S.plan, addOn = S.optionalAddOn) {
    if (!plan) return { shared: 0, min: 0, max: 0, lines: [] };
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
      // Day 1: arrive → stay → activities
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
      // optional parallel choices branch from the same point; the main line continues from the last shared stop
      if (!o.it.optional) prevMain = o;
    });
    return segs;
  }

  /* =================================================================== WORKSPACE RENDER */
  function renderWS() {
    $$("[data-crumb]", root).forEach((c) => {
      const order = ["welcome", "constraints", "destinations", "itinerary", "summary"];
      const cur = S.summary ? "summary" : S.step === "prefs" ? "welcome" : S.step;
      const ci = order.indexOf(cur), i = order.indexOf(c.dataset.crumb);
      c.className = i === ci ? "on" : i < ci ? "done" : "";
    });
    if (!S.plan) {
      if (S.step === "destinations" || S.step === "constraints") {
        ws.innerHTML = `<div class="ws-main" style="grid-template-columns:1fr;grid-template-rows:1fr"><div class="map-pane" style="border:0">${mapHTML(true)}</div></div>`;
        return;
      }
      ws.innerHTML = `<div class="ws-empty"><div><img src="assets/illustrations/plan-next.svg" alt="" width="300" height="200"><h3>Your trip will take shape here</h3><p>Tell me what kind of getaway you're after. Once we've picked a place, the day-by-day plan and an illustrated map appear in this space — linked to each other.</p></div></div>`;
      return;
    }
    if (S.summary) { ws.innerHTML = summaryHTML(); return; }
    const b = budget();
    const over = b.check > S.c.budget;
    const pct = Math.min(100, (b.check / Math.max(S.c.budget, b.check)) * 100);
    const relaxedN = 4, advN = S.plan.d2b ? 2 : 0;
    ws.innerHTML = `
      <div class="trip-head">
        <div><h3>A relaxed weekend in Coorg</h3>
          <div class="facts"><span>${S.c.from} → Madikeri</span><span>${nextWeekend(S.c.when === "next" ? 1 : 0)}</span><span>${S.c.people} travellers</span><span class="tag sim">Simulated data</span></div></div>
        <div class="trip-actions">
          <button class="btn btn-sm btn-ghost" data-act="undo" ${S.history.length ? "" : "disabled"} aria-label="Undo last change">↶ Undo</button>
          <button class="btn btn-sm btn-dark" data-act="summary">Review trip →</button>
        </div>
        <div class="budget">
          <span>Est. per person</span>
          <span class="budget-track" role="img" aria-label="Estimated ${inr(b.check)} of ${inr(S.c.budget)} budget"><i class="${over ? "over" : ""}" style="width:${pct}%"></i></span>
          <span><span class="budget-num" id="budgetNum">${inr(b.min)}${b.max !== b.min ? "–" + inr(b.max).slice(1) : ""}</span> / ${inr(S.c.budget)} <button class="link-btn" data-act="edit-budget" style="font-size:.72rem">edit</button></span>
        </div>
        ${S.optionalAddOn ? '<div class="consensus"><span class="tag opt">Optional activities paid as personal add-ons</span></div>' : ""}
        ${over ? `<div class="consensus" style="color:var(--coral-text)"><b>Over budget by ${inr(b.check - S.c.budget)}</b> — <button class="link-btn" data-act="show-conflict">see options</button></div>` : ""}
        <div class="consensus" aria-label="Group consensus">
          <span class="dots" aria-hidden="true">${"<i style='background:var(--sage)'></i>".repeat(relaxedN)}${"<i style='background:var(--coral)'></i>".repeat(advN)}</span>
          <span>${advN ? `${relaxedN} prefer relaxed · ${advN} want adventure → shared base + optional choices` : "Shared plan for everyone"}</span>
        </div>
      </div>
      <div class="day-bar" role="group" aria-label="Show day">
        <span class="lbl-t">Show</span>
        <button class="day-btn" aria-pressed="${S.day === "all"}" data-act="day" data-day="all">Whole trip</button>
        <button class="day-btn" aria-pressed="${S.day === 1}" data-act="day" data-day="1"><i style="background:var(--day1)"></i>Day 1 · Sat</button>
        <button class="day-btn" aria-pressed="${S.day === 2}" data-act="day" data-day="2"><i style="background:#B9DCF2"></i>Day 2 · Sun</button>
        <span class="view-toggle"><button class="day-btn" aria-pressed="${S.view === "map"}" data-act="view" data-v="map">Map + list</button><button class="day-btn" aria-pressed="${S.view === "list"}" data-act="view" data-v="list">List only</button></span>
      </div>
      <div class="ws-main ${S.view === "list" ? "list-only" : ""}">
        <div class="map-pane">${mapHTML(false)}</div>
        <div class="itin" id="itin">${itinHTML()}${detailShell()}</div>
      </div>
      <div class="toast-zone" id="toasts" aria-live="polite"></div>`;
    if (S.selected) applySelection(S.selected, { noScroll: true });
    if (S.detailOpen && S.selected) openDetail(S.selected, { noFocus: true });
    S.changed = [];
  }

  function markerCls(it) {
    const d = it.day === "both" ? "both" : "d" + it.day;
    return `k-${it.kind === "free" ? "activity" : it.kind} ${d} ${it.optional ? "optional" : ""}`;
  }
  function numbering() {
    const n = {};
    [1, 2].forEach((day) => {
      let k = 0;
      stopsForDay(day).forEach((o) => { if (o.it.kind === "stay") n[o.id] = "S"; else n[o.id] = String(++k); });
    });
    return n;
  }

  function mapHTML(overview) {
    if (S.mapError && !overview) {
      return `<div class="map-error" role="alert"><div class="box"><h3>The map couldn't load.</h3><p class="small">Your itinerary is still here in the list. The map is an aid, not the plan.</p><button class="btn btn-sm btn-primary" data-act="map-retry">Retry map</button> <button class="btn btn-sm btn-ghost" data-act="view" data-v="list">Use list only</button><p class="tiny-note">Simulated failure from the states lab.</p></div></div>`;
    }
    const labels = `
      <span class="map-label place" style="left:44%;top:31%">MADIKERI</span>
      <span class="map-label place" style="left:62%;top:65%">KUSHALNAGAR</span>
      <span class="map-label" style="left:86%;top:66%">BYLAKUPPE</span>
      <span class="map-label" style="left:75%;top:87%">DUBARE</span>
      <span class="map-label" style="left:13%;top:33%">ABBEY FALLS</span>
      <span class="map-label" style="left:61%;top:35%">HARANGI</span>
      <span class="map-label river" style="left:42%;top:86%">Kaveri river</span>
      <span class="map-label" style="left:auto;right:1%;top:59%;transform:none">→ TO BANGALORE</span>`;
    if (overview) {
      return `<div class="map-stage"><div class="map-canvas"><img src="assets/illustrations/map-coorg.svg" alt="Illustrated overview map of Coorg: Madikeri in the hills, Kushalnagar and Bylakuppe to the east, Dubare on the Kaveri river." width="1000" height="700">${labels}</div></div>
        <div class="map-note">${S.step === "destinations" ? "Destination overview: Coorg. Choose “Plan this trip” to build a route." : "Destination overview appears here once we know where you might go."}</div>`;
    }
    const nums = numbering();
    let paths = "";
    [1, 2].forEach((day) => {
      const col = day === 1 ? "#FF5C34" : "#2F6E95";
      segmentsFor(day).forEach((sg) => {
        const mx = (sg.a.x + sg.b.x) / 2 + (sg.b.y - sg.a.y) * 0.12;
        const my = (sg.a.y + sg.b.y) / 2 - (sg.b.x - sg.a.x) * 0.12;
        const dim = S.day !== "all" && S.day !== day ? "dim" : "";
        const ch = S.changed.includes(sg.to) || S.changed.includes(sg.from) ? "changed" : "";
        paths += `<path class="seg ${dim} ${ch}" data-to="${sg.to}" data-from="${sg.from}" d="M${sg.a.x},${sg.a.y} Q${mx.toFixed(1)},${my.toFixed(1)} ${sg.b.x},${sg.b.y}" stroke="${col}" ${sg.optional ? 'stroke-dasharray="3 7"' : ""}/>`;
      });
    });
    // the walkable town cluster — makes "near" visible at a glance
    const cluster = `<ellipse class="cluster" cx="352" cy="318" rx="110" ry="82"/>`;
    // travel-time chips on each leg; long legs (≥ 40 min, simulated) are drawn dark so "far" reads instantly
    let chips = "";
    const seenChip = new Set();
    [1, 2].forEach((day) => {
      segmentsFor(day).forEach((sg) => {
        const m = legMin(sg.a, sg.b);
        if (m < 30) return;                        // short hops stay quiet; the cluster already says "near"
        const key = sg.from + (sg.optional ? "-opt" : "");
        if (sg.optional && seenChip.has(sg.from)) return;   // parallel optional legs share one chip
        if (sg.optional) seenChip.add(sg.from);
        const mx = (sg.a.x + sg.b.x) / 2 + (sg.b.y - sg.a.y) * 0.06;
        const my = (sg.a.y + sg.b.y) / 2 - (sg.b.x - sg.a.x) * 0.06;
        const dim = S.day !== "all" && S.day !== day ? "dim" : "";
        chips += `<span class="leg-chip ${m >= 40 ? "far" : ""} ${dim}" style="left:${mx / 10}%;top:${my / 7}%">≈${m}′</span>`;
      });
    });
    const seen = new Set();
    let markers = "";
    SLOTS.forEach((s) => {
      const id = S.plan[s.id];
      if (!id || seen.has(id)) return;
      seen.add(id);
      const it = ITEMS[id];
      const dim = S.day !== "all" && it.day !== "both" && it.day !== S.day ? "dim" : "";
      const ch = S.changed.includes(id) ? "pulse" : "";
      const dayTxt = it.day === "both" ? "Both days" : "Day " + it.day;
      markers += `<button type="button" class="marker ${markerCls(it)} ${dim} ${ch}" style="left:${it.x / 10}%;top:${it.y / 7}%" data-stop="${id}" aria-label="${dayTxt}, ${nums[id] === "S" ? "stay" : "stop " + nums[id]}: ${esc(it.name)}, ${esc(it.time)}"><span>${nums[id]}</span></button>`;
    });
    return `<div class="map-stage"><div class="map-canvas">
        <img src="assets/illustrations/map-coorg.svg" alt="" width="1000" height="700" data-mapimg>
        <svg class="routes" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">${cluster}${paths}</svg>
        ${labels}<span class="map-label cl" style="left:35%;top:57%">walkable town cluster</span>${chips}${markers}
      </div></div>
      <div class="map-note">Conceptual map · not to scale · routes &amp; times simulated</div>
      <div class="map-legend" aria-label="Map legend">
        <span><i class="lg-d1"></i>Day 1</span><span><i class="lg-d2"></i>Day 2</span>
        <span><i class="lg-act"></i>Activity</span><span><i class="lg-food"></i>Food</span>
        <span><i class="lg-stay"></i>Stay (S)</span><span><i class="lg-tr"></i>Transport</span>
        <span><i class="lg-opt"></i>Optional</span><span><i class="lg-far"></i>≥ 40 min leg</span>
      </div>`;
  }

  function stopHTML(o, nums) {
    const it = o.it, id = o.id;
    const dim = S.day !== "all" && it.day !== "both" && it.day !== S.day ? "dim" : "";
    const tags = [];
    if (it.optional) tags.push(`<span class="tag opt">Optional · ${it.who}</span>`);
    else if (it.kind !== "transport" && it.kind !== "stay") tags.push('<span class="tag shared">Shared</span>');
    if (o.slot.alts[0] === id && o.slot.alts.length > 1) tags.push('<span class="tag rec">Recommended</span>');
    if (S.flags.unverified === id) tags.push('<span class="tag unv">Couldn\'t confirm</span>');
    if (S.flags.unavailable === id) tags.push('<span class="tag" style="background:var(--plum-soft);color:var(--plum);border-color:var(--plum)">Unavailable</span>');
    if (it.needsShared && S.c.priv) tags.push('<span class="tag" style="background:var(--coral-soft)">Conflicts: private rooms</span>');
    const ch = S.changed.includes(id) ? "just-changed" : "";
    return `<button type="button" class="stop ${it.optional ? "optional" : ""} ${dim} ${ch}" data-stop="${id}">
      <span class="sn ${markerCls(it)}">${nums[id]}</span>
      <span><span class="st"><span>${esc(it.time)}</span><span>${it.cost ? inr(it.cost) + (it.unit ? " " + it.unit : " pp") : "Free"} <span class="sr-only">simulated</span></span></span>
      <span class="sname">${esc(it.name)}</span>
      <span class="smeta"><span>${esc(it.label)}</span><span>· ${esc(it.area)}</span></span>
      ${tags.length ? `<span class="stags">${tags.join("")}</span>` : ""}</span></button>`;
  }
  function itinHTML() {
    const nums = numbering();
    let html = "";
    [1, 2].forEach((day) => {
      if (S.day !== "all" && S.day !== day) return;
      const st = stopsForDay(day);
      html += `<div class="itin-day"><h4><i style="background:${day === 1 ? "var(--day1)" : "#B9DCF2"}"></i>Day ${day} · ${day === 1 ? "Saturday" : "Sunday"} <small>${st.length} stops</small></h4>`;
      let prevMain = null;
      st.forEach((o, i) => {
        if (day === 2 && o.it.kind === "stay") {
          html += `<div class="leg" style="padding-left:12px">Start from your stay · ${esc(ITEMS[o.id].name)}</div>`;
          prevMain = o; return;
        }
        if (prevMain) {
          const lm = legMin(prevMain.it, o.it);
          html += `<div class="leg ${lm >= 40 ? "far" : ""}">≈ ${lm} min by cab${lm >= 40 ? " · longer drive" : ""} <span class="sr-only">(simulated)</span></div>`;
        }
        html += stopHTML(o, nums);
        if (!o.it.optional) prevMain = o;
      });
      if (day === 2 && S.plan.d2b && S.plan.d2c) html += `<p class="tiny-note" style="padding-left:40px;margin-top:-2px">Both optional choices share a time slot — everyone regroups for lunch.</p>`;
      html += "</div>";
    });
    return html;
  }
  function detailShell() {
    return `<div class="detail" id="detail" role="dialog" aria-modal="false" aria-labelledby="detailTitle" aria-hidden="true"></div>`;
  }

  /* =================================================================== SELECTION / SYNC */
  function applySelection(id, opts = {}) {
    S.selected = id;
    $$(".marker", ws).forEach((m) => m.classList.toggle("active", m.dataset.stop === id));
    $$(".stop", ws).forEach((s) => s.classList.toggle("active", s.dataset.stop === id));
    $$(".routes .seg", ws).forEach((p) => p.classList.toggle("hot", p.dataset.to === id));
    if (!opts.noScroll) {
      const st = $(`.stop[data-stop="${id}"]`, ws);
      if (st && opts.from === "map") st.scrollIntoView({ block: "nearest", behavior: instant() ? "auto" : "smooth" });
      const mk = $(`.marker[data-stop="${id}"]`, ws);
      if (mk && opts.from === "list") { mk.classList.remove("pulse"); void mk.offsetWidth; mk.classList.add("pulse"); }
    }
  }

  function openDetail(id, opts = {}) {
    const it = ITEMS[id];
    const slot = SLOTS.find((s) => s.alts.includes(id));
    const panel = $("#detail", ws);
    if (!panel) return;
    S.detailOpen = true;
    const others = slot.alts.filter((a) => a !== id);
    const st = stopsForDay(it.day === "both" ? 1 : it.day);
    const idx = st.findIndex((o) => o.id === id);
    const next = idx > -1 && st[idx + 1] ? st[idx + 1] : null;
    const altHTML = others.map((a) => {
      const x = ITEMS[a];
      const delta = x.cost - it.cost;
      const conflict = x.needsShared && S.c.priv;
      const unavailableNote = S.flags.unavailable === a ? " (unavailable)" : "";
      return `<div class="alt"><img src="assets/illustrations/thumb-${x.thumb}.svg" alt=""><div><b>${esc(x.name)}${unavailableNote}</b>
        <span class="ad">${esc(x.tradeoff || x.label)}${x.tradeoff && /₹|price/i.test(x.tradeoff) ? "" : " · " + (delta === 0 ? "same cost" : (delta > 0 ? "+" : "−") + inr(Math.abs(delta)) + " pp")}</span>
        ${conflict ? '<span class="ad" style="color:var(--coral-text);display:block">Conflicts with your “private rooms” must-have</span>' : ""}
        <br><button class="btn btn-sm" data-act="propose" data-slot="${slot.id}" data-to="${a}">Replace with this</button></div></div>`;
    }).join("") || '<p class="small muted">No alternatives in the sample data for this stop.</p>';
    const status = S.flags.unverified === id ? '<span class="tag unv">Couldn\'t confirm just now</span>' : S.flags.unavailable === id ? '<span class="tag" style="background:var(--plum-soft);color:var(--plum);border-color:var(--plum)">Unavailable (simulated)</span>' : '<span class="tag unv">Unverified in prototype</span>';
    panel.innerHTML = `
      <div class="detail-head"><span class="tag ${it.optional ? "opt" : slot.alts[0] === id ? "rec" : "shared"}">${esc(it.label)}</span><button class="x" data-act="close-detail" aria-label="Close details">✕</button></div>
      <div class="detail-body">
        <img src="assets/illustrations/thumb-${it.thumb}.svg" alt="Illustration of ${esc(it.name)}">
        <div class="inner">
          <span class="small muted">${it.day === "both" ? "Both days" : "Day " + it.day} · ${esc(it.time)}</span>
          <h3 id="detailTitle">${esc(it.name)}</h3>
          <dl class="kv">
            <dt>Where</dt><dd>${esc(it.area)}</dd>
            <dt>Cost</dt><dd>${it.cost ? inr(it.cost) + " " + (it.unit || "per person") : "Free"} <span class="tag sim">Simulated</span></dd>
            ${it.who ? `<dt>Who</dt><dd>${it.who} travellers (optional)</dd>` : ""}
            ${next ? `<dt>To next stop</dt><dd>≈ ${legMin(it, next.it)} min to ${esc(next.it.name)} <span class="tag sim">Est.</span></dd>` : ""}
            <dt>Source</dt><dd>${status}<br><span class="tiny-note">Real product: MakeMyTrip listing data, verified reviews and live availability. Ratings aren't shown because none are connected.</span></dd>
            ${it.caveat ? `<dt>Caveat</dt><dd>${esc(it.caveat)}</dd>` : ""}
          </dl>
          <h4>Why it's here</h4>
          <ul>${it.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
          <h4>Alternatives</h4>
          ${altHTML}
          <div class="detail-actions">
            ${it.kind === "activity" || it.kind === "food" ? `<button class="btn btn-sm btn-ghost" data-act="remove" data-slot="${slot.id}">Remove from plan</button>` : ""}
            <button class="btn btn-sm btn-ghost" data-act="ask-why" data-id="${id}">Ask the planner about this</button>
          </div>
        </div>
      </div>`;
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    if (!opts.noFocus) $(".x", panel).focus();
  }
  function closeDetail() {
    const panel = $("#detail", ws);
    S.detailOpen = false;
    if (panel) { panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true"); }
    const st = S.selected && $(`.stop[data-stop="${S.selected}"]`, ws);
    if (st) st.focus();
  }

  /* hover / focus preview (desktop enhancement; never the only way) */
  function showPeek(el) {
    if (!peek || !el.dataset.stop || window.matchMedia("(hover: none)").matches) return;
    const it = ITEMS[el.dataset.stop];
    peek.innerHTML = `<img src="assets/illustrations/thumb-${it.thumb}.svg" alt=""><div class="pb"><b>${esc(it.name)}</b>${esc(it.time)} · ${it.cost ? inr(it.cost) + " pp" : "Free"} <span class="tag sim">Sim.</span><div style="margin-top:4px">${esc(it.why[0])}</div><span class="hint">Click or press Enter for details &amp; alternatives</span></div>`;
    const r = el.getBoundingClientRect();
    const w = 260, h = peek.offsetHeight || 190;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
    let top = r.top - h - 10;
    if (top < 8) top = r.bottom + 10;
    peek.style.left = left + "px";
    peek.style.top = top + "px";
    peek.classList.add("show");
  }
  const hidePeek = () => peek && peek.classList.remove("show");

  /* =================================================================== CHANGES */
  function proposeChange(slotId, toId, opts = {}) {
    const fromId = S.plan[slotId];
    const from = fromId ? ITEMS[fromId] : null;
    const to = ITEMS[toId];
    closeDetail();
    const go = () => {
      const after = Object.assign({}, S.plan, { [slotId]: toId });
      const b0 = budget(), b1 = budget(after);
      const dmin = b1.min - b0.min, dmax = b1.max - b0.max;
      const unchanged = SLOTS.filter((s) => s.id !== slotId && S.plan[s.id]).length;
      const deltaTxt = (d) => d === 0 ? "no change" : `<span class="${d > 0 ? "delta-up" : "delta-down"}">${d > 0 ? "+" : "−"}${inr(Math.abs(d))} pp</span>`;
      const conflictPriv = to.needsShared && S.c.priv;
      const card = ai(`${opts.intro ? `<p>${opts.intro}</p>` : ""}
        <div class="change-card">
          <h5>Here's what would change</h5>
          <dl class="diff">
            <dt>Changing</dt><dd>${from ? `<span class="old">${esc(from.name)}</span> → ` : ""}<b>${esc(to.name)}</b></dd>
            <dt>Unchanged</dt><dd>Stay, transport and ${unchanged} other stop${unchanged === 1 ? "" : "s"} stay as they are</dd>
            <dt>Budget</dt><dd>${deltaTxt(dmax === dmin ? dmin : dmax)} · new est. ${inr(b1.min)}${b1.max !== b1.min ? "–" + inr(b1.max).slice(1) : ""}</dd>
            <dt>Affects</dt><dd>${esc(to.affects || (to.day === "both" ? "Routes on both days recalculated" : `Day ${to.day} route recalculated`))}</dd>
            ${conflictPriv ? '<dt>Note</dt><dd style="color:var(--coral-text)">Breaks your “private rooms” must-have</dd>' : ""}
            ${(S.optionalAddOn ? b1.min : b1.max) > S.c.budget ? `<dt>Heads-up</dt><dd style="color:var(--coral-text)">Takes the plan ${inr((S.optionalAddOn ? b1.min : b1.max) - S.c.budget)} over your ${inr(S.c.budget)} budget — I'll suggest ways to balance it if you confirm</dd>` : ""}
          </dl>
          <div class="msg-actions"><button class="btn btn-sm btn-primary" data-act="confirm-change" data-slot="${slotId}" data-to="${toId}">Confirm change</button><button class="btn btn-sm btn-ghost" data-act="keep">Keep original</button></div>
        </div>`, { needsAction: true });
      return card;
    };
    if (opts.quick) go();
    else loader("Making that change while keeping the rest of your trip intact…", ["Finding what this affects", "Recalculating route and budget"], go);
  }
  function applyChange(slotId, toId) {
    S.history.push({ plan: Object.assign({}, S.plan), budget: S.c.budget, addOn: S.optionalAddOn, flags: Object.assign({}, S.flags) });
    const fromId = S.plan[slotId];
    S.plan[slotId] = toId;
    if (S.flags.unavailable === fromId) delete S.flags.unavailable;
    if (S.flags.unverified === fromId) delete S.flags.unverified;
    S.changed = [toId];
    S.selected = toId;
    S.detailOpen = false;
    renderWS();
    const bn = $("#budgetNum", ws); if (bn) bn.classList.add("flash");
    toast(`<b>Your itinerary has been updated.</b> ${esc(ITEMS[toId].name)} is in; everything else is unchanged.`, true);
    announce("Itinerary updated: " + ITEMS[toId].name);
    flagTripDot();
    const b = budget();
    if (b.check > S.c.budget) {
      ai(`<p>Done. Heads-up: the plan is now <b>${inr(b.check - S.c.budget)} over</b> your ${inr(S.c.budget)} budget.</p><div class="msg-actions"><button class="btn btn-sm" data-act="show-conflict">Show ways to balance it</button><button class="btn btn-sm btn-ghost" data-act="undo">Undo the change</button></div>`);
    }
  }
  function undo() {
    const h = S.history.pop();
    if (!h) return;
    S.plan = h.plan; S.c.budget = h.budget; S.optionalAddOn = h.addOn; S.flags = h.flags;
    S.changed = [];
    renderWS();
    toast("Restored the previous version of your trip.");
    sys("Undid the last change.");
  }
  function toast(html, withUndo) {
    const z = $("#toasts", ws);
    if (!z) return;
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span>${html}</span>${withUndo ? '<button class="link-btn" data-act="undo">Undo</button>' : ""}`;
    z.appendChild(t);
    setTimeout(() => t.remove(), instant() ? 4000 : 6000);
  }

  /* =================================================================== CONFLICTS */
  function checkBudget(opts = {}) {
    if (!S.plan) return false;
    const b = budget();
    if (b.check <= S.c.budget) return false;
    if (!opts.quiet || opts.force) showConflict();
    return true;
  }
  function showConflict() {
    const b = budget();
    const B = S.c.budget;
    const over = b.check - B;
    // contributors
    const stay = ITEMS[S.plan.stay];
    const biggestOpt = b.optional.slice().sort((x, y) => y.cost - x.cost)[0];
    const opts = [];
    // A — change accommodation (most comfortable stay that fits)
    const stays = ["guesthouse", "dorm"].filter((s) => s !== S.plan.stay && ITEMS[s].cost < stay.cost);
    const fitStay = stays.find((s) => budget(Object.assign({}, S.plan, { stay: s })).check <= B && !(ITEMS[s].needsShared && S.c.priv));
    if (fitStay) {
      const nb = budget(Object.assign({}, S.plan, { stay: fitStay }));
      opts.push(`<div class="opt"><h6><span>Change the stay</span><span class="delta-down">${inr(nb.check)}</span></h6>
        <dl><dt>Changes</dt><dd>${esc(stay.name)} → ${esc(ITEMS[fitStay].name)}</dd><dt>Keeps</dt><dd>Coorg, your dates, every activity</dd><dt>Compromise</dt><dd>${esc(ITEMS[fitStay].tradeoff)}</dd><dt>Why it works</dt><dd>The stay is the largest single cost (${inr(stay.cost)} pp)</dd></dl>
        <button class="btn btn-sm" data-act="resolve" data-how="stay" data-to="${fitStay}">Choose this</button></div>`);
    } else if (stays.length) {
      opts.push(`<div class="opt"><h6><span>Change the stay</span><span class="muted">not enough alone</span></h6><p class="tiny-note">${S.c.priv ? "Cheaper stays either don't fit or break your “private rooms” must-have." : "Even the cheapest stay leaves you over budget."}</p></div>`);
    }
    // B — optional activities as personal add-ons
    if (biggestOpt && !S.optionalAddOn && b.min <= B) {
      opts.push(`<div class="opt"><h6><span>Make optional activities personal add-ons</span><span class="delta-down">${inr(b.min)}</span></h6>
        <dl><dt>Changes</dt><dd>${esc(biggestOpt.name)} (${inr(biggestOpt.cost)}) is paid only by those who join</dd><dt>Keeps</dt><dd>Everything in the plan</dd><dt>Compromise</dt><dd>The ${biggestOpt.who} doing it pay more than the rest</dd><dt>Why it works</dt><dd>The shared budget only needs to cover shared things</dd></dl>
        <button class="btn btn-sm" data-act="resolve" data-how="addon">Choose this</button></div>`);
    }
    // C — raise budget slightly
    const nbud = Math.ceil(b.check / 500) * 500;
    opts.push(`<div class="opt"><h6><span>Increase the budget slightly</span><span class="delta-up">${inr(nbud)}</span></h6>
      <dl><dt>Changes</dt><dd>Budget ${inr(B)} → ${inr(nbud)} per person (+${inr(nbud - B)})</dd><dt>Keeps</dt><dd>Destination, stay and every activity</dd><dt>Compromise</dt><dd>Costs more</dd><dt>Why it works</dt><dd>Covers the plan exactly as it is</dd></dl>
      <button class="btn btn-sm" data-act="resolve" data-how="budget" data-to="${nbud}">Choose this</button></div>`);
    const pct = Math.min(100, (B / b.check) * 100);
    ai(`<p><b>This combination isn't quite working.</b> I couldn't fit this Coorg plan within <b>${inr(B)} per person</b> with the current stay and activities. Let's find another way.</p>
      <div class="conflict-card">
        <h5>What's conflicting</h5>
        <div class="conflict-bar" aria-hidden="true"><i style="width:100%"></i><b style="left:${pct}%"></b></div>
        <div class="tiny-note" style="display:flex;justify-content:space-between"><span>Budget ${inr(B)} ▲</span><span>Plan ${inr(b.check)} (over by ${inr(over)})</span></div>
        <div class="conflict-why">Biggest costs: stay ${inr(stay.cost)} · transport ${inr(ITEMS[S.plan.go].cost + ITEMS[S.plan.ret].cost)} · local cab ${inr(LOCAL_CAB)}${biggestOpt ? ` · optional ${esc(biggestOpt.name.split(" at ")[0].toLowerCase())} ${inr(biggestOpt.cost)}` : ""}. <span class="tag sim">Simulated</span></div>
        ${opts.join("")}
        <p class="tiny-note">Or keep ${inr(B)} and <button class="link-btn" data-act="closer">explore a closer destination</button>. Nothing changes until you choose.</p>
      </div>`, { needsAction: true });
    setSuggestions(["Make the rafting a personal add-on", "Raise the budget a little", "Undo"]);
  }
  function resolve(how, to) {
    S.history.push({ plan: Object.assign({}, S.plan), budget: S.c.budget, addOn: S.optionalAddOn, flags: Object.assign({}, S.flags) });
    if (how === "stay") { S.plan.stay = to; S.changed = [to]; }
    if (how === "addon") S.optionalAddOn = true;
    if (how === "budget") S.c.budget = parseInt(to, 10);
    renderWS();
    const bn = $("#budgetNum", ws); if (bn) bn.classList.add("flash");
    const b = budget();
    ai(`<p><b>Done — the plan now fits.</b> Estimated ${inr(b.check)} per person against ${inr(S.c.budget)}. ${how === "stay" ? "Your routes on both days were recalculated from the new stay." : ""}</p>`);
    toast("<b>Your itinerary has been updated.</b> Here's what changed — see the chat.", true);
    flagTripDot();
  }

  /* =================================================================== SUMMARY */
  function summaryHTML() {
    const b = budget();
    const day = (d) => stopsForDay(d).filter((o) => o.it.kind !== "stay").map((o) => `<li>${esc(o.it.time.split("–")[0])} — ${esc(o.it.name)}${o.it.optional ? ` <span class="tag opt">optional · ${o.it.who}</span>` : ""}</li>`).join("");
    const go = ITEMS[S.plan.go], ret = ITEMS[S.plan.ret], stay = ITEMS[S.plan.stay];
    const caveats = ["All prices, times and distances are simulated estimates", "Availability for transport, stay and activities is unverified", "Opening hours and seasonal activities (e.g. rafting) need checking", "Ratings and reviews aren't shown — no verified source is connected"];
    if (S.flags.unverified) caveats.push(`${ITEMS[S.flags.unverified].name}: details couldn't be confirmed`);
    return `<div class="summary">
      <button class="link-btn small" data-act="back-itin">← Back to the itinerary</button>
      <span class="kicker-in" style="display:block;margin-top:10px">Final trip summary · review before booking</span>
      <h3>A relaxed weekend in Coorg</h3>
      <div class="sum-grid">
        <div><h4>Dates &amp; travellers</h4>${nextWeekend(S.c.when === "next" ? 1 : 0)}<br>${S.c.people} travellers from ${S.c.from}</div>
        <div><h4>Transport</h4>${esc(go.name)} (${esc(go.time)})<br>${esc(ret.name)} (${esc(ret.time)})</div>
        <div><h4>Stay</h4>${esc(stay.name)}<br>${esc(stay.time)}</div>
      </div>
      <div class="sum-days">
        <div><h4>Day 1 · Saturday</h4><ol>${day(1)}</ol></div>
        <div><h4>Day 2 · Sunday</h4><ol>${day(2)}</ol></div>
      </div>
      <div class="table-wrap" style="margin-top:10px"><table>
        <thead><tr><th>Estimated cost per person</th><th style="text-align:right">Simulated</th></tr></thead>
        <tbody>${b.lines.map((l) => `<tr><td>${esc(l.name)}</td><td style="text-align:right">${l.cost ? inr(l.cost) : "Free"}</td></tr>`).join("")}
        ${b.optional.map((o) => `<tr><td>${esc(o.name)} <span class="tag opt">optional · ${o.who}</span></td><td style="text-align:right">${inr(o.cost)}</td></tr>`).join("")}
        <tr><th>Shared total${S.optionalAddOn ? " (optional paid separately)" : ""}</th><th style="text-align:right">${inr(b.shared)}</th></tr>
        <tr><th>Per person incl. optional</th><th style="text-align:right">${inr(b.min)}${b.max !== b.min ? "–" + inr(b.max).slice(1) : ""}</th></tr></tbody></table></div>
      <div class="caveats"><b>Important assumptions &amp; caveats</b><ul>${caveats.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
      <div class="msg-actions"><button class="btn btn-primary" data-act="handoff">Continue to booking options →</button><button class="btn btn-ghost" data-act="back-itin">Keep editing</button></div>
      <div class="handoff" id="handoff" hidden>
        <b>In the real product</b>, this hands each component to MakeMyTrip's existing booking flows — bus, stay and activities — with live prices and availability checked first, and your approval at each step.
        <br><br><b>This prototype stops here.</b> No booking has been made and nothing has been paid. There is no confirmation number.
      </div>
    </div>`;
  }

  /* =================================================================== STATES LAB */
  function lab(kind) {
    if (kind === "reset") { reset(); return; }
    if (kind === "empty") {
      if (S.step === "welcome" || S.step === "prefs") { jump("destinations"); }
      ai(`<p>I searched for <i>a beach weekend under ₹5,000 within 4 hours of Bangalore</i>.</p>
        <div class="pref-card"><b>No suitable option in the sample data.</b><p class="tiny-note">Empty result (simulated) — different from an error: the system worked, but nothing matched.</p>
        <div class="msg-actions"><button class="btn btn-sm" data-act="back-dest">See green getaways instead</button><button class="btn btn-sm btn-ghost" data-act="say" data-text="Raise budget to ₹8,000">Raise the budget</button></div></div>`, { needsAction: true });
      return;
    }
    if (kind === "tech") {
      if (!S.plan) jump("destinations", { silent: true });
      S.techFailNext = true;
      if (S.plan) { proposeChange("d2a", S.plan.d2a === "abbey-falls" ? "food-trail" : "abbey-falls"); }
      else pickDest("coorg");
      return;
    }
    if (!S.plan) jump("itinerary", { silent: true });
    if (kind === "conflict") {
      S.c.budget = 7000;
      if (S.plan.d2b == null) S.plan.d2b = "rafting";
      S.optionalAddOn = false;
      renderWS();
      sys("States lab: budget lowered to ₹7,000 per person.");
      showConflict();
    }
    if (kind === "unavailable") {
      if (!S.plan.d2b) S.plan.d2b = "rafting";
      const id = S.plan.d2b;
      S.flags.unavailable = id;
      renderWS();
      ai(`<p><b>${esc(ITEMS[id].name)} isn't available on your dates</b> (simulated: seasonal closure). Here's a similar option, and the rest of your trip is unchanged.</p>`, { needsAction: true });
      proposeChange("d2b", id === "rafting" ? "kayak" : "rafting", { quick: true });
    }
    if (kind === "unverified") {
      S.flags.unverified = "rajas-seat";
      renderWS();
      ai(`<p><b>I couldn't confirm Raja's Seat's evening hours just now.</b> Here's what we can try instead.</p>
        <div class="msg-actions"><button class="btn btn-sm" data-act="keep-flag">Keep it, flagged as unconfirmed</button><button class="btn btn-sm" data-act="extend-fort">Extend the fort walk instead</button></div>
        <p class="tiny-note">Information unavailable — not an error and not a budget conflict.</p>`, { needsAction: true });
      setMobileView("chat");
    }
    if (kind === "maperror") {
      S.mapError = true;
      S.view = "map";
      renderWS();
      sys("States lab: the map failed to load — the itinerary list still works.");
      setMobileView("trip");
    }
  }

  /* =================================================================== FREE TEXT */
  function handleText(text) {
    const t = text.trim();
    if (!t) return;
    user(t);
    input.value = "";
    autoGrow();
    if (S.busy) { sys("Still working on the last request…"); return; }
    if (S.step === "welcome") { interpret(t); return; }
    if (S.step === "prefs") {
      if (/^(yes|yep|yeah|sure|ok|that'?s it|sounds good)/i.test(t)) { showConstraintCard(); return; }
      const rm = /remove|drop|no (more )?/i.test(t);
      let touched = false;
      PREF_RULES.forEach((r) => {
        if (r.re.test(t)) {
          touched = true;
          if (rm) S.prefs = S.prefs.filter((p) => p.id !== r.id);
          else if (!S.prefs.some((p) => p.id === r.id)) S.prefs.push({ id: r.id, label: r.label, from: (t.match(r.re) || [""])[0], inferred: false });
        }
      });
      if (!touched && !rm) { const lbl = t.replace(/^add:?\s*/i, ""); S.prefs.push({ id: "c" + Date.now(), label: lbl.charAt(0).toUpperCase() + lbl.slice(1), from: "", inferred: false }); }
      refreshPrefCards();
      ai(`<p>Updated — ${esc(prefSummary())}. Anything else, or shall we go on?</p><div class="msg-actions"><button class="btn btn-sm btn-primary" data-act="prefs-ok">Looks right</button></div>`);
      return;
    }
    if (S.step === "constraints") {
      const n = /(\d+)\s*(of us|people|friends)?/i.exec(t);
      const bud = /₹\s?([\d,]+)|(\d+)\s?k/i.exec(t);
      if (bud) { const v = bud[1] ? parseInt(bud[1].replace(/,/g, ""), 10) : parseInt(bud[2], 10) * 1000; if (v >= 3000 && v <= 15000) { S.c.budget = v; S.c.budgetKnown = true; } }
      if (n && (!bud || n.index !== bud.index) && parseInt(n[1], 10) < 20) { S.c.people = parseInt(n[1], 10); S.c.peopleKnown = true; }
      if (/just (2|two)/i.test(t)) { S.c.people = 2; S.c.peopleKnown = true; }
      const last = $$("form[data-act-form=constraints]", log).pop();
      if (last) { $("#cPeople", last).textContent = S.c.people; const r = $("#cBudget", last); r.value = S.c.budget; $("#cBudgetOut", last).textContent = inr(S.c.budget); $("[data-groupbox]", last).hidden = S.c.people < 3; }
      ai(`<p>Got it — ${S.c.people} ${S.c.people === 1 ? "person" : "people"}, about ${inr(S.c.budget)} each. I've updated the card above.</p><div class="msg-actions"><button class="btn btn-sm btn-primary" data-act="submit-constraints">Find places that fit</button></div>`);
      return;
    }
    if (S.step === "destinations") {
      if (/why/i.test(t)) { ai(`<p><b>Why Coorg?</b> It's the closest match to “greenery, small cafes, local food, not hectic”, it's reachable overnight from Bangalore so you don't lose Saturday, and Dubare gives the adventure pair rafting at the same stop where the others can relax. Estimated ${inr(6750)}–${inr(7950).slice(1)} pp <span class="tag sim">Simulated</span>.</p>`); return; }
      if (/compar/i.test(t)) { ai(compareTable()); return; }
      if (/chik/i.test(t)) { pickDest("chikmagalur"); return; }
      if (/way/i.test(t)) { pickDest("wayanad"); return; }
      pickDest("coorg");
      return;
    }
    // itinerary / summary intents
    if (/waterfall|abbey|falls/i.test(t)) {
      if (S.plan.d2a !== "abbey-falls") { ai("<p>There's no waterfall on Day 2 any more — you already swapped it.</p>"); return; }
      S.summary = false; renderWS();
      proposeChange("d2a", "food-trail", { intro: "Of course. Since you enjoyed the local food suggestions earlier, I can replace the waterfall visit with a <b>local food trail</b> in Madikeri. It also cuts about 25 minutes of driving before check-out." });
      return;
    }
    if (/undo/i.test(t)) { undo(); return; }
    if (/add[- ]?on|personal/i.test(t)) { resolve("addon"); return; }
    if (/raise|increase/i.test(t) && /budget/i.test(t)) { const b = budget(); resolve("budget", Math.ceil(Math.max(b.check, S.c.budget + 500) / 500) * 500); return; }
    const num = /₹\s?([\d,]{4,6})|(\d{4,5})|(\d+)\s?k\b/i.exec(t);
    if (/budget|cheap|cost|expensive|afford|less money/i.test(t) || num) {
      if (num) { const v = num[1] ? parseInt(num[1].replace(/,/g, ""), 10) : num[2] ? parseInt(num[2], 10) : parseInt(num[3], 10) * 1000; if (v >= 3000 && v <= 20000) { S.c.budget = v; renderWS(); sys(`Budget set to ${inr(v)} per person.`); if (!checkBudget({ force: true, quiet: false })) ai(`<p>That still fits — estimated ${inr(budget().check)} per person.</p>`); return; } }
      const b = budget();
      ai(`<p>Right now it's about <b>${inr(b.min)}${b.max !== b.min ? "–" + inr(b.max).slice(1) : ""}</b> per person <span class="tag sim">Simulated</span>. The stay (${inr(ITEMS[S.plan.stay].cost)}) is the biggest piece. What would you like to aim for?</p>
        <div class="msg-actions"><button class="chip" data-act="say" data-text="Budget ₹7,000">₹7,000</button><button class="chip" data-act="say" data-text="Budget ₹6,500">₹6,500</button><button class="chip" data-act="open" data-id="${S.plan.stay}">See cheaper stays</button></div>`);
      return;
    }
    if (/hotel|stay|homestay|room|dorm|hostel/i.test(t)) { S.summary = false; S.view = S.view; renderWS(); applySelection(S.plan.stay); openDetail(S.plan.stay); setMobileView("trip"); ai("<p>I've opened the stay — the reasons it was picked and two alternatives are in the panel.</p>"); return; }
    if (/summary|review|done|finali|book|confirm/i.test(t)) { openSummary(); return; }
    if (/rest|tired|relax|lazy/i.test(t)) { ai("<p>Sunday late morning is already split: the two who want adventure can raft while the others take the easy riverside option — everyone regroups for lunch. Want me to make that slot free time at a cafe instead?</p><div class=\"msg-actions\"><button class=\"btn btn-sm\" data-act=\"propose\" data-slot=\"d2c\" data-to=\"river-cafe\">Yes, free time at a cafe</button></div>"); return; }
    if (/map/i.test(t)) { S.view = "map"; renderWS(); setMobileView("trip"); return; }
    if (/list/i.test(t)) { S.view = "list"; renderWS(); setMobileView("trip"); return; }
    if (/why/i.test(t)) { ai("<p>Open any stop — map marker or list card — and the <b>Why it's here</b> section explains it. Ask me about a specific place too, like “why this homestay?”.</p>"); return; }
    ai(`<p>I can change a stop, adjust the budget, explain a choice or take you to the summary. Try one of these:</p>`);
    setSuggestions(["I don't want another waterfall on Day 2", "Budget ₹7,000", "Why this homestay?", "Review the trip"]);
  }

  function openSummary() {
    S.summary = true; S.detailOpen = false;
    renderWS();
    ai("<p>Here's everything in one place. Check the caveats — nothing is booked until you go through each booking step yourself.</p>");
    setMobileView("trip");
    flagTripDot();
  }

  /* =================================================================== EVENTS */
  root.addEventListener("click", (e) => {
    const say = e.target.closest("[data-say]");
    if (say) { handleText(say.dataset.say); return; }
    const mv = e.target.closest("[data-mview]");
    if (mv) { setMobileView(mv.dataset.mview); return; }
    const stop = e.target.closest("[data-stop]");
    if (stop && !e.target.closest("[data-act]")) {
      const id = stop.dataset.stop;
      hidePeek();
      applySelection(id, { from: stop.classList.contains("marker") ? "map" : "list" });
      openDetail(id);
      return;
    }
    const a = e.target.closest("[data-act]");
    if (!a) return;
    const act = a.dataset.act;
    switch (act) {
      case "entry-idea": input.focus(); setSuggestions([SAMPLE, "A slow weekend somewhere green with good coffee"]); break;
      case "entry-dates": S.entry = "dates"; user("Start with available dates"); S.prefs = []; showConstraintCard(); break;
      case "entry-dest": user("I already have a destination"); ai(`<p>Nice — where are you thinking? In this prototype, <b>Coorg</b> has full sample data.</p><div class="msg-actions"><button class="btn btn-sm btn-primary" data-act="dest-known">Coorg</button><button class="btn btn-sm btn-ghost" data-act="dest-else">Somewhere else</button></div>`); break;
      case "dest-known": user("Coorg"); S.entry = "dest"; S.prefs = PREF_RULES.filter((r) => ["nature", "relaxed", "food"].includes(r.id)).map((r) => ({ id: r.id, label: r.label, from: "", inferred: true })); S.step = "destinations"; showConstraintCard(); break;
      case "dest-else": user("Somewhere else"); ai("<p>I don't have sample data for other destinations yet. Describe the kind of trip you want and I'll show where Coorg fits — or doesn't.</p>"); break;
      case "rm-pref": S.prefs.splice(parseInt(a.dataset.i, 10), 1); refreshPrefCards(); break;
      case "prefs-ok": user("Yes, that's my kind of trip"); showConstraintCard(); break;
      case "prefs-other": user("Try a different direction");
        ai(`<p>Sure — which of these feels closer?</p><div class="msg-actions"><button class="chip" data-act="dir" data-d="city">City break: food &amp; culture</button><button class="chip" data-act="dir" data-d="adv">Adventure-first weekend</button><button class="chip" data-act="dir" data-d="beach">Beach escape</button></div>`); break;
      case "dir": {
        const d = a.dataset.d;
        const set = d === "city" ? ["food", "culture", "walk", "cafes"] : d === "adv" ? ["adventure", "nature"] : [];
        if (d === "beach") { ai("<p>Beach trips aren't in this prototype's sample data, so I can't plan one honestly here. Want to keep the green getaway instead?</p><div class=\"msg-actions\"><button class=\"btn btn-sm\" data-act=\"prefs-ok\">Keep the green getaway</button></div>"); break; }
        S.prefs = set.map((id) => { const r = PREF_RULES.find((x) => x.id === id); return { id, label: r.label, from: "", inferred: true }; });
        S.notes = [];
        showPrefCard(); break;
      }
      case "ppl": {
        S.c.people = Math.max(1, Math.min(12, S.c.people + parseInt(a.dataset.d, 10)));
        const f = a.closest("form"); $("#cPeople", f).textContent = S.c.people; $("[data-groupbox]", f).hidden = S.c.people < 3; break;
      }
      case "submit-constraints": { const f = $$("form[data-act-form=constraints]", log).pop(); if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true })); break; }
      case "cancel-load": runToken++; S.busy = false; a.closest(".loader").innerHTML = '<div class="ltitle">Stopped.</div><p class="tiny-note">Nothing changed — everything you entered is still here.</p>'; break;
      case "retry": { const m = a.closest(".msg"); a.disabled = true; if (m && m._retry) { sys("Retrying…"); m._retry(); } break; }
      case "compare": ai(compareTable()); break;
      case "pick-dest": user("Plan " + DESTS.find((d) => d.id === a.dataset.id).name); pickDest(a.dataset.id); break;
      case "back-dest": S.plan = null; S.summary = false; showDestinations(); break;
      case "closer": user("Explore a closer destination"); ai("<p>A closer destination would mean starting a new plan. In this prototype only Coorg has sample data, so here are the options again — your current plan stays saved until you pick.</p>"); showDestinations(); S.step = "itinerary"; break;
      case "day": S.day = a.dataset.day === "all" ? "all" : parseInt(a.dataset.day, 10); renderWS(); break;
      case "view": S.view = a.dataset.v; if (a.dataset.v === "list") S.mapError = S.mapError; renderWS(); break;
      case "map-retry": S.mapError = false; renderWS(); toast("Map loaded."); break;
      case "close-detail": closeDetail(); break;
      case "propose": user(`Replace with ${ITEMS[a.dataset.to].name}`); proposeChange(a.dataset.slot, a.dataset.to); setMobileView("chat"); break;
      case "confirm-change": a.closest(".msg-actions").innerHTML = '<span class="tag shared">Confirmed</span>'; applyChange(a.dataset.slot, a.dataset.to); setMobileView("trip"); break;
      case "keep": a.closest(".msg-actions").innerHTML = '<span class="tag unv">Kept original</span>'; sys("No changes made."); break;
      case "remove": { const slot = a.dataset.slot; S.history.push({ plan: Object.assign({}, S.plan), budget: S.c.budget, addOn: S.optionalAddOn, flags: Object.assign({}, S.flags) }); const nm = ITEMS[S.plan[slot]].name; S.plan[slot] = null; S.selected = null; S.detailOpen = false; renderWS(); toast(`Removed <b>${esc(nm)}</b>. Times around it are unchanged.`, true); break; }
      case "ask-why": { const it = ITEMS[a.dataset.id]; ai(`<p><b>${esc(it.name)}</b> is here because: ${it.why.map(esc).join("; ").toLowerCase()}.</p>`); setMobileView("chat"); break; }
      case "undo": undo(); break;
      case "summary": user("Review the trip"); openSummary(); break;
      case "back-itin": S.summary = false; renderWS(); break;
      case "handoff": { const h = $("#handoff", ws); if (h) { h.hidden = false; h.scrollIntoView({ block: "nearest" }); } break; }
      case "edit-budget": editBudget(a); break;
      case "show-conflict": showConflict(); setMobileView("chat"); break;
      case "resolve": a.closest(".conflict-card").querySelectorAll("button").forEach((b) => (b.disabled = true)); resolve(a.dataset.how, a.dataset.to); break;
      case "keep-flag": a.closest(".msg-actions").innerHTML = '<span class="tag unv">Kept · flagged</span>'; toast("Raja's Seat kept, marked as unconfirmed."); break;
      case "extend-fort": a.closest(".msg-actions").innerHTML = '<span class="tag shared">Removed sunset stop</span>'; S.history.push({ plan: Object.assign({}, S.plan), budget: S.c.budget, addOn: S.optionalAddOn, flags: Object.assign({}, S.flags) }); S.plan.d1d = null; delete S.flags.unverified; renderWS(); toast("Fort walk extended; sunset stop removed.", true); break;
      case "say": handleText(a.dataset.text); break;
      case "open": applySelection(a.dataset.id); openDetail(a.dataset.id); setMobileView("trip"); break;
    }
  });

  function editBudget(anchor) {
    const wrap = anchor.parentElement;
    wrap.innerHTML = `<label class="sr-only" for="budEdit">Budget per person</label><input id="budEdit" type="range" min="4000" max="15000" step="500" value="${S.c.budget}" style="width:110px;vertical-align:middle;accent-color:var(--coral)"> <b id="budEditOut">${inr(S.c.budget)}</b> <button class="btn btn-sm" data-act="noop" id="budApply">Apply</button>`;
    const r = $("#budEdit", wrap), out = $("#budEditOut", wrap);
    r.addEventListener("input", () => { out.textContent = inr(r.value); });
    r.focus();
    $("#budApply", wrap).addEventListener("click", (e) => {
      e.stopPropagation();
      const v = parseInt(r.value, 10);
      user(`Budget ₹${v.toLocaleString("en-IN")} per person`);
      S.c.budget = v;
      renderWS();
      if (!checkBudget({ force: true })) ai(`<p>That works — the plan is estimated at ${inr(budget().check)} per person.</p>`);
      else setMobileView("chat");
    });
  }

  root.addEventListener("submit", (e) => {
    const f = e.target;
    if (f.id === "composer") { e.preventDefault(); handleText(input.value); return; }
    if (f.dataset.actForm === "add-pref") {
      e.preventDefault();
      const v = $("input", f).value.trim();
      if (v) { S.prefs.push({ id: "c" + Date.now(), label: v, from: "", inferred: false }); refreshPrefCards(); $("input", f).value = ""; }
      return;
    }
    if (f.dataset.actForm === "constraints") {
      e.preventDefault();
      readConstraints(f);
      $$("input,button", f).forEach((x) => (x.disabled = true));
      user(`${S.c.people} travellers · ${inr(S.c.budget)} each · ${S.c.when === "next" ? "next" : "this"} weekend`);
      if (S.entry === "dest") { S.step = "destinations"; renderWS(); pickDest("coorg"); }
      else exploreDestinations();
    }
  });
  root.addEventListener("input", (e) => {
    if (e.target.id === "cBudget") {
      const f = e.target.closest("form");
      $("#cBudgetOut", f).textContent = inr(e.target.value);
      e.target.setAttribute("aria-valuetext", inr(e.target.value) + " per person");
    }
    if (e.target === input) autoGrow();
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleText(input.value); }
  });
  function autoGrow() { input.style.height = "auto"; input.style.height = Math.min(120, input.scrollHeight) + "px"; }

  // hover + focus previews and Escape to close
  root.addEventListener("mouseover", (e) => { const s = e.target.closest("[data-stop]"); if (s && ws.contains(s)) showPeek(s); });
  root.addEventListener("mouseout", (e) => { const s = e.target.closest("[data-stop]"); if (s && !s.contains(e.relatedTarget)) hidePeek(); });
  root.addEventListener("focusin", (e) => { const s = e.target.closest("[data-stop]"); if (s && ws.contains(s) && e.target.matches(":focus-visible")) showPeek(s); });
  root.addEventListener("focusout", hidePeek);
  root.addEventListener("keydown", (e) => { if (e.key === "Escape") { hidePeek(); if (S.detailOpen) closeDetail(); } });
  window.addEventListener("scroll", hidePeek, { passive: true });

  // map image failure → fall back to list with message
  root.addEventListener("error", (e) => { if (e.target.matches && e.target.matches("[data-mapimg]")) { S.mapError = true; renderWS(); } }, true);

  /* mobile view switching */
  function setMobileView(v) {
    S.mobileView = v;
    body.dataset.view = v;
    $$("[data-mview]", root).forEach((b) => b.setAttribute("aria-selected", b.dataset.mview === v));
    if (v === "trip") { const d = $("[data-trip-dot]", root); if (d) d.textContent = ""; }
  }
  function flagTripDot() { if (S.mobileView !== "trip") { const d = $("[data-trip-dot]", root); if (d) d.textContent = "●"; } }

  /* =================================================================== JUMP / RESET (used by the case study) */
  function reset() { runToken++; S = fresh(); welcome(); setMobileView("chat"); }
  function jump(to, opts = {}) {
    runToken++;
    S = fresh();
    S.fast = true;
    log.innerHTML = "";
    if (!opts.silent) sys(`Jumped to: ${to}. Earlier steps were filled with the sample scenario.`);
    if (to === "welcome") { S.fast = false; welcome(); return; }
    user(SAMPLE);
    interpret(SAMPLE, true);
    if (to === "prefs") { S.fast = false; return; }
    user("Yes, that's my kind of trip");
    showConstraintCard();
    if (to === "constraints") { S.fast = false; return; }
    user(`${S.c.people} travellers · ${inr(S.c.budget)} each · this weekend`);
    showDestinations();
    if (to === "destinations") { S.fast = false; return; }
    user("Plan Coorg (Kodagu)");
    pickDest("coorg", true);
    S.fast = false;
    if (to === "replace") { setTimeout(() => { applySelection("abbey-falls", { from: "list" }); openDetail("abbey-falls"); handleText("I don't want to visit another waterfall on Day 2. Can you suggest something different?"); }, 60); }
    if (to === "conflict") { setTimeout(() => lab("conflict"), 60); }
    if (to === "summary") { setTimeout(() => openSummary(), 60); }
  }

  window.Prototype = { jump, reset };
  welcome();

  // reviewer controls live outside #app
  document.addEventListener("click", (e) => {
    const l = e.target.closest("[data-lab]");
    if (l) { e.preventDefault(); lab(l.dataset.lab); }
  });
})();
