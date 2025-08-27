// Mobile menu toggle
function toggleMenu() {
  const navLinks = document.querySelector(".nav-links");
  navLinks.classList.toggle("active");
}

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// Fade in animation on scroll
function fadeInOnScroll() {
  const elements = document.querySelectorAll(".fade-in");
  elements.forEach((element) => {
    const elementTop = element.getBoundingClientRect().top;
    const elementVisible = 150;

    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add("visible");
    }
  });
}

window.addEventListener("scroll", fadeInOnScroll);
window.addEventListener("load", fadeInOnScroll);

// Counter animation
function animateCounters() {
  const counters = document.querySelectorAll(".stat-number");
  counters.forEach((counter) => {
    const target = counter.textContent;
    const numericTarget = parseInt(target.replace(/\D/g, ""));
    let current = 0;
    const increment = numericTarget / 100;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericTarget) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        if (target.includes("M")) {
          counter.textContent = Math.floor(current) + "M+";
        } else if (target.includes("+")) {
          counter.textContent = Math.floor(current) + "+";
        } else {
          counter.textContent = Math.floor(current);
        }
      }
    }, 20);
  });
}

// Trigger counter animation when stats section is visible
const statsSection = document.querySelector(".stats");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounters();
      observer.unobserve(entry.target);
    }
  });
});

if (statsSection) {
  observer.observe(statsSection);
}

// Add some interactive effects
document.querySelectorAll(".symbol-card").forEach((card) => {
  card.addEventListener("mouseenter", function () {
    this.style.transform = "scale(1.05)";
    this.style.transition = "transform 0.3s ease";
  });

  card.addEventListener("mouseleave", function () {
    this.style.transform = "scale(1)";
  });
});

function initTimelineFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const timelineItems = document.querySelectorAll(".timeline-item");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active class from all buttons
      filterBtns.forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");

      const period = this.getAttribute("data-period");

      timelineItems.forEach((item) => {
        if (period === "all" || item.getAttribute("data-period") === period) {
          item.classList.remove("hidden");
        } else {
          item.classList.add("hidden");
        }
      });
    });
  });
}

function animateTimelineItems() {
  const items = document.querySelectorAll(".timeline-item:not(.hidden)");
  items.forEach((item, index) => {
    setTimeout(() => {
      item.style.opacity = "1";
      item.style.transform = "translateX(0)";
    }, index * 100);
  });
}

// Initialize timeline filters when page loads
window.addEventListener("load", function () {
  initTimelineFilters();
  animateTimelineItems();
});

/* Stats dashboard behaviour:
   - filter toggles
   - animated counters
   - animate progress bars
   - animate comparison bars
*/
(function () {
  // helpers
  const qs = (s) => document.querySelector(s);
  const qsa = (s) => Array.from(document.querySelectorAll(s));

  // init filters
  function initFilters() {
    const buttons = qsa(".stats-filter-btn");
    const cards = qsa(".stat-card-interactive");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const cat = btn.getAttribute("data-category");
        cards.forEach((card) => {
          const c = card.getAttribute("data-category") || "all";
          if (cat === "all" || c === cat) {
            card.classList.remove("hidden");
            // ensure visible
            card.style.display = "";
          } else {
            card.classList.add("hidden");
            // preserve layout but hide interactively (if you prefer remove completely use display='none')
            card.style.display = "none";
          }
        });
        // when filters change, re-run animations for visible items:
        animateProgressBars();
        animateComparisonBars();
        animateNumbers(); // idempotent
      });
    });
  }

  // animate numeric counters
  function animateNumbers() {
    const els = qsa(".stat-number-animated");
    els.forEach((el) => {
      // if already animated, skip
      if (el.dataset.animated === "true") return;
      const raw = el.getAttribute("data-target") || el.textContent || "0";
      // try parse float
      const target = parseFloat(raw);
      if (isNaN(target)) {
        el.textContent = raw;
        el.dataset.animated = "true";
        return;
      }

      // determine decimals to show
      const decimals =
        raw.indexOf(".") >= 0 ? Math.min(3, raw.split(".")[1].length) : 0;
      const duration = 1100;
      const start = 0;
      const startTime = performance.now();

      function step(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        // easeOutQuad
        const eased = t * (2 - t);
        const value = start + (target - start) * eased;
        el.textContent = formatNumber(value, decimals, raw);
        if (t < 1) requestAnimationFrame(step);
        else {
          // final exact value
          el.textContent = formatNumber(target, decimals, raw);
          el.dataset.animated = "true";
        }
      }
      requestAnimationFrame(step);
    });
  }

  function formatNumber(v, decimals, raw) {
    // special-case small decimals like HDI (0.727)
    if (decimals > 0) {
      return Number(v).toFixed(decimals);
    }
    // else show with thousand separators
    return Math.round(v).toLocaleString();
  }

  // progress bars animation
  function animateProgressBars() {
    const bars = qsa(".stat-progress .progress-bar");
    bars.forEach((bar) => {
      const parentCard = bar.closest(".stat-card-interactive");
      if (parentCard && parentCard.style.display === "none") {
        // skip hidden cards
        bar.style.width = "0%";
        return;
      }
      const p = parseFloat(bar.getAttribute("data-progress")) || 0;
      // clamp
      const pct = Math.max(0, Math.min(100, p));
      // set width
      requestAnimationFrame(() => (bar.style.width = pct + "%"));
    });
  }

  // comparison bars animation
  function animateComparisonBars() {
    const bars = qsa(".chart-bar .bar-fill-inner");
    bars.forEach((inner) => {
      const container = inner.closest(".chart-bar");
      const visible = container && container.offsetParent !== null;
      if (!visible) {
        inner.style.height = "0%";
        return;
      }
      const track =
        container.querySelector(".bar-fill") ||
        container.querySelector(".bar-track");
      const desired =
        parseFloat(
          (track && track.getAttribute("data-height")) ||
            (track && track.dataset.height)
        ) || 0;
      const pct = Math.max(0, Math.min(100, desired));
      // animate height
      requestAnimationFrame(() => (inner.style.height = pct + "%"));
    });
  }

  // intersection observer to trigger animations when visible (optional)
  function observeAndTrigger() {
    const target = qs(".stats-dashboard") || qs("#achievements");
    if (!target) {
      // fallback: run immediately
      animateNumbers();
      animateProgressBars();
      animateComparisonBars();
      return;
    }
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            animateNumbers();
            animateProgressBars();
            animateComparisonBars();
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(target);
  }

  // init everything on load
  window.addEventListener("load", () => {
    initFilters();
    observeAndTrigger();
    // small re-run on resize to adjust bars
    window.addEventListener("resize", () => {
      animateComparisonBars();
    });
  });
})();

const flag = document.getElementById("flag");
const coat = document.getElementById("coat");
const anthem = document.getElementById("anthem");

const flagInfo = document.getElementById("flag-info");
const coatInfo = document.getElementById("coat-info");
const anthemInfo = document.getElementById("anthem-info");

function hideAll() {
  flagInfo.style.display = "none";
  coatInfo.style.display = "none";
  anthemInfo.style.display = "none";
}

// Flag toggle
flag.addEventListener("click", () => {
  if (flagInfo.style.display === "block") {
    flagInfo.style.display = "none";
  } else {
    hideAll();
    flagInfo.style.display = "block";
  }
});

// Coat toggle
coat.addEventListener("click", () => {
  if (coatInfo.style.display === "block") {
    coatInfo.style.display = "none";
  } else {
    hideAll();
    coatInfo.style.display = "block";
  }
});

// Anthem toggle
anthem.addEventListener("click", () => {
  if (anthemInfo.style.display === "block") {
    anthemInfo.style.display = "none";
  } else {
    hideAll();
    anthemInfo.style.display = "block";
  }
});
