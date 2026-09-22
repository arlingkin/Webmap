(function () {
  "use strict";

  var header = document.querySelector(".nav");
  var menuBtn = document.getElementById("menu-toggle");
  var menu = document.getElementById("menu");

  function onScroll() {
    if (!header) return;
    header.style.boxShadow = window.scrollY > 10 ? "0 4px 20px rgba(0,0,0,0.15)" : "none";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() {
    if (!menu || !menuBtn) return;
    menu.classList.remove("open");
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      menuBtn.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  var revealables = document.querySelectorAll(".card, .section-title, .section-sub, .hero-content");
  if ("IntersectionObserver" in window) {
    revealables.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  function animateValue(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var target = parseFloat(el.dataset.count || "0");
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    var duration = 1200;
    var start = performance.now();
    var step = function (now) {
      var p = Math.min((now - start) / duration, 1);
      p = 1 - Math.pow(1 - p, 3);
      var value = target * p;
      if (decimals > 0) {
        el.textContent = value.toFixed(decimals);
      } else {
        el.textContent = Math.round(value).toLocaleString("id-ID");
      }
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll(".kpi-value");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll("[data-count]").forEach(animateValue);
          if (entry.target.dataset.count) animateValue(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { animateValue(el); });
  }

  var form = document.getElementById("contact-form");
  if (form) {
    var fields = {
      nama: { el: document.getElementById("nama"), test: function (v) { return v.trim().length >= 3; }, msg: "Nama minimal 3 karakter." },
      email: { el: document.getElementById("email"), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: "Format email tidak valid." },
      pesan: { el: document.getElementById("pesan"), test: function (v) { return v.trim().length >= 10; }, msg: "Pesan minimal 10 karakter." }
    };

    Object.keys(fields).forEach(function (key) {
      var f = fields[key];
      f.el.addEventListener("input", function () { validate(key); });
    });

    function validate(key) {
      var f = fields[key];
      var ok = f.test(f.el.value);
      f.el.closest(".field").classList.toggle("invalid", !ok);
      f.el.closest(".field").querySelector(".err").textContent = ok ? "" : f.msg;
      return ok;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = Object.keys(fields).map(validate).every(Boolean);
      var msg = form.querySelector(".form-msg");
      if (ok) {
        msg.hidden = false;
        msg.textContent = "✅ Terima kasih! Pesanmu terkirim (demo, tanpa backend).";
        form.reset();
        Object.keys(fields).forEach(function (k) {
          fields[k].el.closest(".field").classList.remove("invalid");
          fields[k].el.closest(".field").querySelector(".err").textContent = "";
        });
      } else {
        msg.hidden = false;
        msg.textContent = "⚠️ Periksa kembali isian yang ditandai merah.";
        msg.style.background = "rgba(248,113,113,0.12)";
        msg.style.color = "var(--down)";
        msg.style.borderColor = "var(--down)";
      }
    });
  }

  fetch("/api/kpi")
    .then(function (r) {
      if (!r.ok) throw new Error("api");
      return r.json();
    })
    .then(function (d) {
      var kpi = (d && d.kpi) || {};
      document.querySelectorAll(".kpi-value[data-key]").forEach(function (el) {
        if (kpi[el.dataset.key] === undefined || kpi[el.dataset.key] === null) return;
        var inner = el.querySelector("[data-count]") || el;
        inner.dataset.count = String(kpi[el.dataset.key]);
        animateValue(inner);
      });
    })
    .catch(function () {});
})();