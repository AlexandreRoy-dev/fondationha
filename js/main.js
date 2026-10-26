import { initDonateLinks, initDonateForms } from "./modules/donate.js";
import { initNav } from "./modules/nav.js";
import { initProgrammation } from "./modules/programmation.js";
import { initReveal } from "./modules/reveal.js";

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
  initProgrammation();
  initNav();
  initReveal();
  initDonateForms();
  initDonateLinks();
  initMerciBanner();
});
