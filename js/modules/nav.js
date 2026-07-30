export function initNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const links = nav ? nav.querySelectorAll("a") : [];
  const mobileQuery = window.matchMedia("(max-width: 959px)");

  if (!header || !toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    nav.classList.toggle("is-open", open);
    if (mobileQuery.matches) {
      nav.toggleAttribute("inert", !open);
    } else {
      nav.removeAttribute("inert");
    }
    document.body.style.overflow = open ? "hidden" : "";
  };

  const syncViewport = () => {
    if (!mobileQuery.matches) {
      setOpen(false);
      nav.removeAttribute("inert");
      document.body.style.overflow = "";
    } else if (toggle.getAttribute("aria-expanded") !== "true") {
      nav.setAttribute("inert", "");
    }
  };

  syncViewport();
  mobileQuery.addEventListener("change", syncViewport);

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    setOpen(open);
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileQuery.matches) setOpen(false);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const currentPage = document.body.dataset.page;
  if (currentPage) {
    links.forEach((link) => {
      if (link.dataset.page === currentPage) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  // Keep section highlighting available for in-page navigation.
  const sections = [...document.querySelectorAll("main section[id]")];
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach((link) => {
          const match = link.getAttribute("href") === `#${id}`;
          if (match) link.setAttribute("aria-current", "location");
          else if (link.getAttribute("aria-current") === "location") {
            link.removeAttribute("aria-current");
          }
        });
      });
    },
    { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}
