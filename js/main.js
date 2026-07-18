import { STRIPE_PAYMENT_LINK, DONATE_MAILTO } from "./modules/config.js";
import { initNav } from "./modules/nav.js";
import { initReveal } from "./modules/reveal.js";

function initDonateLinks() {
  const href =
    STRIPE_PAYMENT_LINK && STRIPE_PAYMENT_LINK.startsWith("http")
      ? STRIPE_PAYMENT_LINK
      : DONATE_MAILTO;

  const external = href.startsWith("http");

  document.querySelectorAll("[data-donate]").forEach((el) => {
    el.setAttribute("href", href);
    if (external) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    } else {
      el.removeAttribute("target");
      el.removeAttribute("rel");
    }
  });
}

function initMerciBanner() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("don") === "merci") {
    const merci = document.getElementById("merci");
    if (merci) {
      merci.hidden = false;
      merci.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initReveal();
  initDonateLinks();
  initMerciBanner();
});
