/* tuiboard landing v2 — "CRT phosphor poster".
   Motion model: the stylesheet's default state is FINAL and fully legible, so
   content is never JS-gated for no-JS users. Effects are ON BY DEFAULT for
   everyone (html.fx, set pre-paint by the inline head script); the in-page [fx]
   toggle / `f` shortcut is an explicit opt-out, persisted in localStorage —
   which deliberately overrides the OS prefers-reduced-motion setting.
   Everything interactive (copy, tabs, shortcuts, help) works in BOTH modes. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js-ready"); // cancels the inline anti-FOUC safety timeout

  /* ================= fx system ================= */
  var FX_KEY = "tuiboard-fx";

  function fxStored() { try { return localStorage.getItem(FX_KEY); } catch (e) { return null; } }
  function fxOn() {
    return fxStored() !== "off"; // effects ON by default; only explicit opt-out disables
  }
  function applyFx(animateBoot) {
    var on = fxOn();
    root.classList.toggle("fx", on);
    var btn = document.getElementById("fx-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      var state = btn.querySelector("[data-fx-state]");
      if (state) state.textContent = on ? "on" : "off";
    }
    if (on && animateBoot) runBoot();
    if (on) initTicker();
    if (on) initCursor();
  }

  var fxBtn = document.getElementById("fx-toggle");
  if (fxBtn) {
    fxBtn.addEventListener("click", function () {
      try { localStorage.setItem(FX_KEY, fxOn() ? "off" : "on"); } catch (e) { /* ignore */ }
      applyFx(false);
      // when enabling fx mid-session, settle everything to visible immediately
      if (fxOn()) settleAll();
    });
  }

  /* mark everything visible (used when fx flips on after load, and as a
     safety net so no [data-line]/[data-reveal] can ever stay hidden) */
  function settleAll() {
    document.querySelectorAll("[data-line]").forEach(function (el) { el.classList.add("is-on"); });
    document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach(function (el) { el.classList.add("is-in"); });
    var wm = document.querySelector("[data-wm]");
    if (wm) { wm.classList.remove("is-booting"); wm.classList.add("is-on"); }
  }

  /* ================= boot sequence (fx only, skippable) ================= */
  var booted = false;
  function runBoot() {
    if (booted) return;
    booted = true;
    var boot = document.getElementById("boot");
    var log = document.getElementById("boot-log");
    var wm = document.querySelector("[data-wm]");
    var hero = document.querySelector(".hero");
    if (!boot || !log || !wm || !hero) { settleAll(); return; }

    var LINES = [
      "tuiboard BIOS v" + version,
      "mounting boards .......... <span class=\"okx\">ok</span>",
      "calendar bridge .......... <span class=\"okx\">ok</span>",
      "agents ................... <span class=\"okx\">3 live</span>",
      "starting session ▋",
    ];
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      boot.classList.remove("is-on");
      document.body.style.overflow = "";
      wm.classList.remove("is-booting");
      wm.classList.add("is-on");
      // staggered hero lines
      var lines = hero.querySelectorAll("[data-line]");
      lines.forEach(function (el, i) {
        setTimeout(function () { el.classList.add("is-on"); }, 140 + i * 110);
      });
      // everything below the hero is observer-driven; also hard-settle late
      setTimeout(settleAllBelow, 2400);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("wheel", finish);
      window.removeEventListener("touchstart", finish);
    }
    function settleAllBelow() {
      document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
      });
    }

    wm.classList.add("is-booting");
    boot.classList.add("is-on");
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", finish, { passive: true });
    window.addEventListener("pointerdown", finish, { passive: true });
    window.addEventListener("wheel", finish, { passive: true });
    window.addEventListener("touchstart", finish, { passive: true });

    var i = 0;
    (function nextLine() {
      if (done) return;
      if (i >= LINES.length) { setTimeout(finish, 220); return; }
      log.innerHTML += (i ? "\n" : "") + LINES[i];
      i++;
      setTimeout(nextLine, 150);
    })();
    setTimeout(finish, 2200); // hard safety
  }

  /* ================= live version (always) ================= */
  var version = "0.8.3";
  (function () {
    var nodes = document.querySelectorAll("[data-version]");
    if (nodes.length) version = nodes[0].textContent.trim() || version;
    try {
      fetch("https://registry.npmjs.org/tuiboard/latest", { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) {
          if (d && d.version) {
            version = String(d.version);
            nodes.forEach(function (n) { n.textContent = version; });
          }
        })
        .catch(function () { /* fallback stays */ });
    } catch (e) { /* fallback stays */ }
  })();

  /* ================= copy buttons (always) ================= */
  document.querySelectorAll(".copybtn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";
      var done = function () {
        btn.textContent = "[ copied ✓ ]";
        btn.classList.add("is-done");
        setTimeout(function () { btn.textContent = "[ copy ]"; btn.classList.remove("is-done"); }, 1400);
      };
      function fallbackCopy() {
        try {
          var ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select(); document.execCommand("copy");
          document.body.removeChild(ta); done();
        } catch (e) { /* ignore */ }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallbackCopy);
      } else { fallbackCopy(); }
    });
  });

  /* ================= hero terminal tabs + cycler ================= */
  var term = document.querySelector("[data-term]");
  if (term) {
    var tabs = Array.prototype.slice.call(term.querySelectorAll(".term__tab"));
    var order = ["kanban", "planner", "agenda", "agents"];
    var userStopped = false;
    var idx = 0;

    function setActive(name) {
      idx = order.indexOf(name); if (idx < 0) idx = 0;
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === name;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      term.querySelectorAll(".panel").forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-panel") === name);
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { userStopped = true; setActive(t.getAttribute("data-tab")); });
    });

    var timer = null, inView = true;
    function tick() {
      if (userStopped || !inView || !root.classList.contains("fx")) return;
      setActive(order[(idx + 1) % order.length]);
    }
    function start() { if (!timer) timer = setInterval(tick, 4500); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    start();
    term.addEventListener("mouseenter", stop);
    term.addEventListener("mouseleave", function () { if (!userStopped) start(); });
    term.addEventListener("focusin", stop);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (ents) {
        inView = ents[0].isIntersecting;
        if (inView && !userStopped) start(); else stop();
      }, { threshold: 0.2 }).observe(term);
    }
  }

  /* ================= ticker marquee (fx only) ================= */
  var tickerInited = false;
  function initTicker() {
    if (tickerInited) return;
    var track = document.querySelector("[data-ticker]");
    if (!track) return;
    tickerInited = true;
    // duplicate the items for a seamless -50% loop; the copy lives in a
    // display:contents wrapper so it can be hidden when fx is toggled off
    var dup = document.createElement("span");
    dup.className = "ticker__dup";
    dup.setAttribute("aria-hidden", "true");
    dup.innerHTML = track.innerHTML;
    track.appendChild(dup);
    track.classList.add("is-marquee");
  }

  /* ================= cursor follower (fx + fine pointer) ================= */
  var cursorInited = false;
  function initCursor() {
    if (cursorInited) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    var cur = document.getElementById("cur");
    if (!cur) return;
    cursorInited = true;
    var tx = -100, ty = -100, x = -100, y = -100, raf = null;
    function loop() {
      x += (tx - x) * 0.22; y += (ty - y) * 0.22;
      cur.style.transform = "translate(" + (x + 14) + "px," + (y + 6) + "px)";
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) { raf = requestAnimationFrame(loop); }
      else { raf = null; }
    }
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!raf && root.classList.contains("fx")) raf = requestAnimationFrame(loop);
    }, { passive: true });
  }

  /* ================= compose toggles (always) ================= */
  document.querySelectorAll(".tgrow").forEach(function (row) {
    row.addEventListener("click", function () {
      var on = row.getAttribute("data-on") === "1";
      row.setAttribute("data-on", on ? "0" : "1");
      row.setAttribute("aria-pressed", on ? "false" : "true");
      var tg = row.querySelector(".tg");
      if (tg) tg.textContent = on ? "[ ]" : "[x]";
    });
  });

  /* ================= scroll reveals (fx only; default is final) ================= */
  if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach(function (el) { revealObs.observe(el); });
  } else {
    settleAll();
  }

  /* ================= bottom bar: pane indicator ================= */
  (function () {
    var links = document.querySelectorAll("[data-panes] a");
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("data-pane")] = a; });
    var paneObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        links.forEach(function (a) { a.classList.toggle("is-here", a.getAttribute("data-pane") === id); });
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    ["intro", "board", "day", "cal", "agents", "install"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) paneObs.observe(el);
    });
  })();

  /* ================= bottom bar: clock + scroll % ================= */
  (function () {
    var clock = document.getElementById("clock");
    var pct = document.getElementById("scrollpct");
    function tickClock() {
      if (!clock) return;
      var d = new Date();
      var p2 = function (n) { return String(n).padStart(2, "0"); };
      clock.textContent = root.classList.contains("fx")
        ? p2(d.getHours()) + ":" + p2(d.getMinutes()) + ":" + p2(d.getSeconds())
        : p2(d.getHours()) + ":" + p2(d.getMinutes());
    }
    tickClock();
    setInterval(tickClock, 1000);
    var pctRaf = null;
    function updatePct() {
      pctRaf = null;
      if (!pct) return;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var v = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      pct.textContent = v + "%";
    }
    window.addEventListener("scroll", function () {
      if (!pctRaf) pctRaf = requestAnimationFrame(updatePct);
    }, { passive: true });
    updatePct();
  })();

  /* ================= keyboard shortcuts + help (always) ================= */
  (function () {
    var help = document.getElementById("help");
    function toggleHelp(force) {
      if (!help) return;
      var show = typeof force === "boolean" ? force : help.hidden;
      help.hidden = !show;
    }
    if (help) help.addEventListener("click", function () { toggleHelp(false); });
    window.addEventListener("keydown", function (e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      if (k === "Escape") { toggleHelp(false); return; }
      if (k === "?") { toggleHelp(); return; }
      if (help && !help.hidden) { toggleHelp(false); return; }
      if (k === "g") { window.open("https://github.com/NazzarenoGiannelli/tuiboard", "_blank", "noopener"); }
      else if (k === "n") { window.open("https://www.npmjs.com/package/tuiboard", "_blank", "noopener"); }
      else if (k === "i") { var el = document.getElementById("install"); if (el) el.scrollIntoView({ behavior: root.classList.contains("fx") ? "smooth" : "auto" }); }
      else if (k === "t") { window.scrollTo({ top: 0, behavior: root.classList.contains("fx") ? "smooth" : "auto" }); }
      else if (k === "f") { if (fxBtn) fxBtn.click(); }
    });
  })();

  /* ================= go ================= */
  try {
    applyFx(true);
    if (!root.classList.contains("fx")) settleAll();
  } catch (e) {
    // last-resort safety: never leave content hidden behind a half-run effect
    settleAll();
    var bootEl = document.getElementById("boot");
    if (bootEl) bootEl.classList.remove("is-on");
    document.body.style.overflow = "";
  }
})();
