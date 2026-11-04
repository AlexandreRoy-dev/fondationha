import { CATEGORIES, loadProgrammation } from "../data/programmation.js";
import {
  categoryLabel,
  detailUrl,
  el,
  formatWhen,
  isClosed,
  placeLabel,
  safeImage,
  spotsLabel,
  ticketButton,
} from "./event-utils.js";

export async function initProgrammation() {
  const root = document.querySelector("[data-programmation]");
  if (!root) return;

  const filtersEl = root.querySelector("[data-prog-filters]");
  const listEl = root.querySelector("[data-prog-list]");
  const statusEl = root.querySelector("[data-prog-status]");
  const emptyEl = root.querySelector("[data-prog-empty]");
  if (!filtersEl || !listEl || !statusEl || !emptyEl) return;

  statusEl.textContent = "Chargement des activités.";
  const { events: loaded, fromSync } = await loadProgrammation();
  const events = loaded
    .slice()
    .sort((a, b) => String(a.sortKey).localeCompare(String(b.sortKey)));

  const lead = document.querySelector("[data-prog-lead]");
  if (lead && fromSync) {
    lead.textContent = "Journées bien-être, ateliers créatifs et ateliers en ligne. Choisissez une activité pour voir les détails et réserver votre place.";
  }

  // Filtres : catégories connues, puis toute autre catégorie présente dans les données.
  const filters = [...CATEGORIES];
  events.forEach((event) => {
    if (event.category && !filters.some((f) => f.id === event.category)) {
      filters.push({ id: event.category, label: categoryLabel(event) });
    }
  });

  let active = "tous";

  const apply = (categoryId) => {
    active = categoryId;
    filtersEl.querySelectorAll("[data-prog-filter]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.progFilter === categoryId ? "true" : "false");
    });

    const visible = events.filter((event) => categoryId === "tous" || event.category === categoryId);
    listEl.replaceChildren(...visible.map(renderCard));
    emptyEl.hidden = visible.length !== 0;
    if (events.length === 0) {
      emptyEl.textContent = "La prochaine programmation sera annoncée bientôt. Revenez nous voir.";
      statusEl.textContent = "";
      filtersEl.hidden = true;
      return;
    }
    statusEl.textContent = countLabel(visible.length);
  };

  filters.forEach((category) => {
    const button = el("button", "prog-filter", category.label);
    button.type = "button";
    button.dataset.progFilter = category.id;
    button.setAttribute("aria-pressed", category.id === "tous" ? "true" : "false");
    button.addEventListener("click", () => apply(category.id));
    filtersEl.appendChild(button);
  });

  filtersEl.addEventListener("keydown", (event) => {
    const buttons = [...filtersEl.querySelectorAll("[data-prog-filter]")];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = buttons[(index + 1) % buttons.length];
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = buttons[(index - 1 + buttons.length) % buttons.length];
    else if (event.key === "Home") next = buttons[0];
    else if (event.key === "End") next = buttons[buttons.length - 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
    next.click();
  });

  apply(active);
}

function renderCard(event) {
  const item = document.createElement("li");
  const article = el("article", "prog-card");
  const href = detailUrl(event);

  const media = el("a", "prog-card__media");
  media.href = href;
  media.tabIndex = -1;
  media.setAttribute("aria-hidden", "true");
  const image = safeImage(event.image);
  if (image) {
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    media.appendChild(img);
  }
  article.appendChild(media);

  const body = el("div", "prog-card__body");

  if (event.example) body.appendChild(el("p", "prog-badge", "Exemple"));

  const date = el("p", "prog-card__date");
  const time = el("time", null, formatWhen(event.dateDebut, event.heureDebut));
  time.dateTime = event.sortKey || "";
  date.appendChild(time);
  body.appendChild(date);

  body.appendChild(el("p", "prog-card__category", categoryLabel(event)));

  const title = el("h2", "prog-card__title");
  const titleLink = el("a", "prog-card__link", event.title || "Activité");
  titleLink.href = href;
  title.appendChild(titleLink);
  body.appendChild(title);

  const summary = event.resume || event.description;
  if (summary) body.appendChild(el("p", "prog-card__text", summary));

  body.appendChild(el("p", "prog-card__place", placeLabel(event)));

  const spotsText = spotsLabel(event);
  const spots = el("p", "prog-card__spots", spotsText);
  if (isClosed(event)) spots.classList.add("is-full");
  body.appendChild(spots);

  const actions = el("div", "prog-card__actions");
  if (!isClosed(event)) actions.appendChild(ticketButton(event));
  const more = el("a", "btn btn--secondary", "Voir les détails");
  more.href = href;
  more.appendChild(el("span", "sr-only", `, ${event.title || "cette activité"}`));
  actions.appendChild(more);
  body.appendChild(actions);

  article.appendChild(body);
  item.appendChild(article);
  return item;
}

function countLabel(count) {
  if (count === 0) return "Aucune activité dans cette catégorie.";
  if (count === 1) return "1 activité.";
  return `${count} activités.`;
}
