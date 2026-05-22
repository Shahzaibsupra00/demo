/**
 * MAIN.JS - Global JavaScript Handler
 * Dynamic themes, sidebars, toast banners, scroll behaviors, animations
 */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileNav();
  initSidebar();
  initScrollTop();
  setupScrollAnimations();
});

/* ==========================================
 * 1. THEME MANAGEMENT (LIGHT/DARK TOGGLE)
 * ========================================== */
function initTheme() {
  const themeToggle = document.getElementById("theme-toggle");
  if (!themeToggle) return;

  // Retrieve previous theme or default to system preference (Light default per rule)
  const savedTheme = localStorage.getItem("site-theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("site-theme", nextTheme);
    
    showToast(`Switched to ${nextTheme} visual theme.`, "info");
  });
}

/* ==========================================
 * 2. MOBILE MENU NAVBAR TOGGLE
 * ========================================== */
function initMobileNav() {
  const hamburger = document.getElementById("mobile-hamburger");
  const mainNav = document.getElementById("main-navigation");

  if (!hamburger || !mainNav) return;

  hamburger.addEventListener("click", (e) => {
    e.stopPropagation();
    mainNav.classList.toggle("mobile-open");
    
    // Transform hamburger icon visual if desired
    const lines = hamburger.querySelectorAll(".hamburger-inner");
    if (mainNav.classList.contains("mobile-open")) {
      if (lines[0]) lines[0].style.transform = "translateY(8px) rotate(45deg)";
      if (lines[1]) lines[1].style.opacity = "0";
      if (lines[2]) lines[2].style.transform = "translateY(-8px) rotate(-45deg)";
    } else {
      if (lines[0]) lines[0].style.transform = "none";
      if (lines[1]) lines[1].style.opacity = "1";
      if (lines[2]) lines[2].style.transform = "none";
    }
  });

  // Clicking outside collapses the mobile dropdown
  document.addEventListener("click", (e) => {
    if (!mainNav.contains(e.target) && !hamburger.contains(e.target)) {
      if (mainNav.classList.contains("mobile-open")) {
        mainNav.classList.remove("mobile-open");
        const lines = hamburger.querySelectorAll(".hamburger-inner");
        if (lines[0]) lines[0].style.transform = "none";
        if (lines[1]) lines[1].style.opacity = "1";
        if (lines[2]) lines[2].style.transform = "none";
      }
    }
  });
}

/* ==========================================
 * 3. RESPONSIVE SIDEBAR DRAWER TOGGLE
 * ========================================== */
function initSidebar() {
  const sidebarBtn = document.getElementById("sidebar-toggle-btn");
  const sidebar = document.getElementById("dashboard-sidebar");

  if (!sidebarBtn || !sidebar) return;

  sidebarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("sidebar-open");
  });

  document.addEventListener("click", (e) => {
    if (sidebar.classList.contains("sidebar-open") && !sidebar.contains(e.target) && !sidebarBtn.contains(e.target)) {
      sidebar.classList.remove("sidebar-open");
    }
  });
}

/* ==========================================
 * 4. SCROLL TO TOP UTILITY
 * ========================================== */
function initScrollTop() {
  const scrollTopBtn = document.getElementById("scroll-to-top-btn");
  if (!scrollTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.add("show");
    } else {
      scrollTopBtn.classList.remove("show");
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });
}

/* ==========================================
 * 5. TOAST MESSAGE ENGINE
 * ========================================== */
export function showToast(message, type = "success") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  // Choose icons dynamically based on type
  let iconSvg = "";
  if (type === "success") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === "error") {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
}

// Attach globally
window.showToast = showToast;

/* ==========================================
 * 6. SUBTLE CUSTOM SCROLL ANIMATIONS
 * ========================================== */
function setupScrollAnimations() {
  const elements = document.querySelectorAll(".animate-on-scroll");
  if (elements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target); // trigger animation once
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  });

  elements.forEach((el) => observer.observe(el));
}
