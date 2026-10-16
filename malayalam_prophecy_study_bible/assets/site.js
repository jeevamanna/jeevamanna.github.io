/* Ultimate Prophecy Bible Study — site behaviour. No dependencies. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* theme */
  var KEY = "upbs-theme";
  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
  }
  var s = stored(); if (s) root.setAttribute("data-theme", s);
  $$("[data-theme-toggle]").forEach(function (b) {
    b.addEventListener("click", function () {
      var cur = root.getAttribute("data-theme") ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      setTheme(cur === "dark" ? "light" : "dark");
    });
  });

  /* nav */
  var nav = $(".nav");
  var burger = $(".burger");
  if (burger) burger.addEventListener("click", function () {
    var o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o);
  });
  $$(".nav-links a").forEach(function (a) { a.addEventListener("click", function () { nav.classList.remove("open"); }); });

  /* split headline words */
  $$(".words").forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(doc.createTextNode(" ")); return; }
            var w = doc.createElement("span"); w.className = "w";
            var in_ = doc.createElement("span"); in_.textContent = t; in_.style.setProperty("--i", i++);
            w.appendChild(in_); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) {
          walk(n);
        }
      });
    })(el);
  });

  /* reveal on scroll */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: .14, rootMargin: "0px 0px -6% 0px" }) : null;
  $$(".rv,.words,.bc,.stat").forEach(function (el) {
    if (io && !reduce) io.observe(el); else el.classList.add("in");
  });

  /* twinkling stars in the hero */
  var sky = $(".hero .sky");
  if (sky && !reduce) {
    for (var k = 0; k < 46; k++) {
      var d = doc.createElement("i"); d.className = "dot";
      var sz = 2 + Math.random() * 4;
      d.style.cssText = "left:" + Math.random() * 100 + "%;top:" + Math.random() * 100 + "%;width:" + sz + "px;height:" + sz +
        "px;--t:" + (3 + Math.random() * 4) + "s;--dl:" + (Math.random() * -6) + "s";
      sky.appendChild(d);
    }
  }

  /* counters */
  function count(el) {
    var to = parseFloat(el.getAttribute("data-count")), dur = 1800, t0 = performance.now();
    var fmt = new Intl.NumberFormat("en-US");
    function f(t) {
      var p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt.format(Math.round(to * e)) + (el.getAttribute("data-suffix") || "");
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }
  var cio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } });
  }, { threshold: .6 }) : null;
  $$("[data-count]").forEach(function (el) {
    if (cio && !reduce) { el.textContent = "0" + (el.getAttribute("data-suffix") || ""); cio.observe(el); }
  });

  /* tilt + spotlight */
  $$("[data-tilt]").forEach(function (el) {
    var host = el.parentElement;
    host.addEventListener("pointermove", function (e) {
      if (reduce || e.pointerType === "touch") return;
      var r = host.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = "rotateY(" + x * 14 + "deg) rotateX(" + -y * 10 + "deg)";
    });
    host.addEventListener("pointerleave", function () { el.style.transform = ""; });
  });
  $$(".bc").forEach(function (c) {
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px"); c.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* scroll driven work, one rAF per frame */
  var progress = $(".progress i");
  var par = $$("[data-speed]");
  var tour = $(".tour"), steps = $$(".step"), shots = $$(".tour-phone .scr img"), bars = $$(".dots i");
  var gal = $(".gal"), track = $(".gal-track"), galBar = $(".gal-bar i");
  var fan = $(".fan");
  var cmp = $(".cmp"), cmpDone = false;
  var vh = innerHeight, galDist = 0;

  function measure() {
    vh = innerHeight;
    if (gal && track) {
      galDist = Math.max(0, track.scrollWidth - innerWidth);
      gal.style.height = galDist + vh * 1.15 + "px";
    }
  }
  measure(); addEventListener("resize", measure); addEventListener("load", measure);

  var active = -1;
  function setStep(i) {
    if (i === active) return; active = i;
    steps.forEach(function (s, n) { s.classList.toggle("on", n === i); });
    shots.forEach(function (s, n) { s.classList.toggle("on", n === i); });
  }

  var ticking = false;
  function frame() {
    ticking = false;
    var y = scrollY, h = root.scrollHeight - vh;
    if (progress) progress.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    if (nav) nav.classList.toggle("scrolled", y > 24);

    if (!reduce) par.forEach(function (el) {
      var r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var c = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute("data-speed"));
      el.style.translate = "0 " + c.toFixed(1) + "px";
    });

    if (tour && steps.length) {
      var r = tour.getBoundingClientRect(), total = r.height - vh;
      var p = clamp(-r.top / total, 0, .9999), n = steps.length;
      setStep(Math.floor(p * n));
      bars.forEach(function (b, i) { b.style.setProperty("--f", clamp(p * n - i, 0, 1)); });
    }
    if (gal && track) {
      var g = gal.getBoundingClientRect(), gp = clamp(-g.top / (g.height - vh), 0, 1);
      track.style.transform = "translate3d(" + (-galDist * gp).toFixed(1) + "px,0,0)";
      if (galBar) galBar.style.transform = "scaleX(" + gp + ")";
    }
    if (fan) {
      var f = fan.getBoundingClientRect();
      fan.classList.toggle("spread", f.top < vh * .62 && f.bottom > vh * .2);
    }
    if (cmp && !cmpDone) {
      var c = cmp.getBoundingClientRect();
      if (c.top < vh * .7 && c.bottom > vh * .3) { cmpDone = true; sweep(); }
    }
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener("scroll", req, { passive: true }); addEventListener("resize", req);
  frame();

  /* light / dark comparison */
  function sweep() {
    var range = $("input", cmp);
    if (reduce || !range) return;
    var t0 = performance.now();
    (function f(t) {
      var p = clamp((t - t0) / 2600, 0, 1);
      var v = 50 + Math.sin(p * Math.PI * 2) * 38 * (1 - p * .4);
      set(v); if (p < 1 && !cmp.dataset.touched) requestAnimationFrame(f);
    })(t0);
  }
  function set(v) { cmp.style.setProperty("--p", v + "%"); var r = $("input", cmp); if (r) r.value = v; }
  if (cmp) {
    var range = $("input", cmp);
    range.addEventListener("input", function () { cmp.dataset.touched = 1; set(range.value); });
    set(50);
  }

  /* video: play only while on screen */
  var vio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (v.preload === "none") { v.preload = "auto"; } var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: .35 }) : null;
  $$("video[data-auto]").forEach(function (v) { if (vio && !reduce) vio.observe(v); });
  $$(".vcard button").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = $("video", b.parentElement); v.muted = !v.muted;
      b.setAttribute("aria-pressed", !v.muted);
      b.querySelector(".off").style.display = v.muted ? "" : "none";
      b.querySelector(".on").style.display = v.muted ? "none" : "";
    });
  });

  /* legal: table of contents highlight */
  var tocLinks = $$(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var secs = tocLinks.map(function (a) { return $(a.getAttribute("href")); });
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); });
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    secs.forEach(function (s) { if (s) tio.observe(s); });
  }
})();
