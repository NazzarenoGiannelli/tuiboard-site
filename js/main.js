/* tuiboard landing — progressive enhancement.
   Copy buttons and terminal tabs work always (even reduced-motion / no anim).
   Reveal animations, the hero boot, and the terminal auto-cycler run only when
   motion is allowed. Reduced-motion users get the final state on first paint. */
(function () {
  "use strict";

  var root = document.documentElement;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canAnimate = !prefersReduced;

  /* -------- copy buttons (always) -------- */
  document.querySelectorAll(".copybtn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";
      var done = function () {
        var orig = "[ copy ]";
        btn.textContent = "[ copied ✓ ]";
        btn.classList.add("is-done");
        setTimeout(function () {
          btn.textContent = orig;
          btn.classList.remove("is-done");
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallbackCopy);
      } else {
        fallbackCopy();
      }
      function fallbackCopy() {
        try {
          var ta = document.createElement("textarea");
          ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select(); document.execCommand("copy");
          document.body.removeChild(ta); done();
        } catch (e) { /* ignore */ }
      }
    });
  });

  /* -------- hero terminal: tabs (always) + auto-cycle (motion only) -------- */
  var term = document.querySelector("[data-term]");
  if (term) {
    var tabs = Array.prototype.slice.call(term.querySelectorAll(".term__tab"));
    var order = ["kanban", "planner", "agenda", "agents"];
    var userStopped = false;

    function setActive(name) {
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
      t.addEventListener("click", function () {
        userStopped = true;
        setActive(t.getAttribute("data-tab"));
      });
    });

    if (canAnimate) {
      var idx = 0;
      var timer = null;
      var inView = true;
      function tick() {
        if (userStopped || !inView) return;
        idx = (idx + 1) % order.length;
        setActive(order[idx]);
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
  }

  /* -------- mark compose toggles that are [x] -------- */
  document.querySelectorAll("[data-toggles] [data-tg]").forEach(function (tg) {
    if (tg.textContent.indexOf("[x]") !== -1) tg.setAttribute("data-on", "1");
  });

  /* ===================== motion-only enhancements ===================== */
  if (!canAnimate) return;
  root.classList.add("motion");

  /* reveal-on-scroll */
  if ("IntersectionObserver" in window) {
    var revealObs = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal], [data-reveal-group], [data-shot], [data-trust], [data-toggles]")
      .forEach(function (el) { revealObs.observe(el); });
  } else {
    document.querySelectorAll("[data-reveal], [data-reveal-group], [data-shot], [data-trust], [data-toggles]")
      .forEach(function (el) { el.classList.add("is-in"); });
  }

  /* hero boot reveal: wordmark wipe + status-line type-on, fully skippable */
  var wordmark = document.querySelector("[data-reveal='wordmark']");
  var bootline = document.querySelector("[data-boot]");
  var bootText = bootline ? bootline.querySelector(".bootline__text") : null;
  var fullBoot = bootText ? bootText.textContent : "";
  var booted = false;

  function settleBoot() {
    if (booted) return;
    booted = true;
    if (wordmark) { wordmark.classList.remove("is-booting"); wordmark.classList.add("is-revealed"); }
    if (bootline) bootline.classList.remove("is-booting");
    if (bootText) bootText.textContent = fullBoot;
    window.removeEventListener("keydown", settleBoot);
    window.removeEventListener("wheel", settleBoot);
    window.removeEventListener("touchstart", settleBoot);
    window.removeEventListener("pointerdown", settleBoot);
  }

  try {
    if (wordmark && bootline && bootText) {
      wordmark.classList.add("is-booting");
      bootline.classList.add("is-booting");
      bootText.textContent = "";
      window.addEventListener("keydown", settleBoot, { passive: true });
      window.addEventListener("wheel", settleBoot, { passive: true });
      window.addEventListener("touchstart", settleBoot, { passive: true });
      window.addEventListener("pointerdown", settleBoot, { passive: true });

      requestAnimationFrame(function () {
        wordmark.classList.remove("is-booting");
        wordmark.classList.add("is-revealed");
        bootline.classList.remove("is-booting");
        // type the status line after the wordmark wipe (~600ms)
        setTimeout(function () {
          var i = 0;
          (function type() {
            if (booted) return;
            bootText.textContent = fullBoot.slice(0, i);
            i++;
            if (i <= fullBoot.length) { setTimeout(type, 16); } else { settleBoot(); }
          })();
        }, 560);
      });
      // hard safety: settle no matter what
      setTimeout(settleBoot, 2600);
    }
  } catch (e) {
    settleBoot();
  }
})();
