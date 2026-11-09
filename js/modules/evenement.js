import { loadProgrammation } from "../data/programmation.js";
import {
  categoryLabel,
  el,
  formatMoney,
  formatRange,
  isClosed,
  isOnline,
  placeLabel,
  safeImage,
  spotsLabel,
  ticketButton,
} from "./event-utils.js";

export async function initEvenement() {
  const root = document.querySelector("[data-evenement]");
  if (!root) return;

  const slug = new URLSearchParams(window.location.search).get("slug") || "";
  const { events } = await loadProgrammation();
  const event = events.find((item) => item.slug === slug || item.id === slug);

  if (!event) {
    renderNotFound(root);
    return;
  }

  document.title = `${event.title} | Fondation Honorer Aimer`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) metaDescription.setAttribute("content", event.resume || event.description || event.title);

  const hero = document.querySelector("[data-event-hero]");
  if (hero) {
    hero.querySelector("[data-event-category]").textContent = categoryLabel(event);
    hero.querySelector("[data-event-title]").textContent = event.title;
    const lead = hero.querySelector("[data-event-lead]");
    lead.textContent = formatRange(event);
    if (event.example) hero.querySelector("[data-event-example]").hidden = false;
  }

  root.replaceChildren(renderDetail(event));
  setupLightbox(root);
}

function renderDetail(event) {
  const wrap = el("div", "event-detail");

  const main = el("div", "event-detail__main");
  const image = safeImage(event.image);
  if (image) {
    const figure = el("figure", "event-detail__image");
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt || event.title;
    img.decoding = "async";
    figure.appendChild(img);
    main.appendChild(figure);
  }

  if (event.resume) main.appendChild(el("p", "event-detail__resume", event.resume));

  const description = event.description || (!event.resume ? "Les détails de cette activité seront précisés bientôt." : "");
  description
    .split(/\n{2,}|\r\n\r\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .forEach((paragraph) => main.appendChild(el("p", "event-detail__text", paragraph)));

  const gallery = event.gallery.map(safeImage).filter(Boolean).slice(0, 3);
  if (gallery.length) {
    const section = el("section", "event-gallery");
    section.setAttribute("aria-label", "Galerie de photos");
    section.appendChild(el("h2", "event-gallery__title", "En images"));
    const list = el("ul", "event-gallery__list");
    gallery.forEach((photo, index) => {
      const li = document.createElement("li");
      const button = el("button", "event-gallery__item");
      button.type = "button";
      button.dataset.lightboxSrc = photo.src;
      button.dataset.lightboxAlt = photo.alt || `${event.title}, photo ${index + 1}`;
      button.setAttribute("aria-label", `Agrandir la photo ${index + 1}`);
      const img = document.createElement("img");
      img.src = photo.src;
      img.alt = "";
      img.loading = "lazy";
      button.appendChild(img);
      li.appendChild(button);
      list.appendChild(li);
    });
    section.appendChild(list);
    main.appendChild(section);
  }

  wrap.appendChild(main);
  wrap.appendChild(renderAside(event));
  return wrap;
}

function renderAside(event) {
  const aside = el("aside", "event-info");
  aside.setAttribute("aria-label", "Informations pratiques");
  const dl = el("dl", "event-info__list");

  const add = (label, value) => {
    if (!value) return;
    const row = el("div", "event-info__row");
    row.appendChild(el("dt", null, label));
    const dd = el("dd");
    if (value instanceof Node) dd.appendChild(value);
    else dd.textContent = value;
    row.appendChild(dd);
    dl.appendChild(row);
  };

  add("Quand", formatRange(event));
  const where = placeLabel(event);
  if (!isOnline(event) && event.adresse) {
    const frag = document.createDocumentFragment();
    frag.appendChild(el("span", "event-info__strong", where));
    frag.appendChild(document.createElement("br"));
    frag.appendChild(document.createTextNode(event.adresse));
    add("Où", frag);
  } else {
    add("Où", where);
  }
  if (event.animatrices.length) add(event.animatrices.length > 1 ? "Animatrices" : "Animatrice", event.animatrices.join(", "));
  add("Contribution suggérée", formatMoney(event.contribution));
  add("Places", spotsLabel(event));
  aside.appendChild(dl);

  if (event.billets.length) {
    const tickets = el("div", "event-tickets");
    tickets.appendChild(el("h2", "event-tickets__title", "Billets"));
    const ul = el("ul", "event-tickets__list");
    event.billets.forEach((billet) => {
      const li = el("li", "event-ticket");
      const head = el("p", "event-ticket__head");
      head.appendChild(el("span", "event-ticket__name", billet.nom || "Billet"));
      const price = formatMoney(billet.prix);
      if (price) head.appendChild(el("span", "event-ticket__price", price));
      li.appendChild(head);
      if (billet.description) li.appendChild(el("p", "event-ticket__text", billet.description));
      ul.appendChild(li);
    });
    tickets.appendChild(ul);
    aside.appendChild(tickets);
  }

  if (!isClosed(event)) aside.appendChild(ticketButton(event));
  else aside.appendChild(el("p", "event-info__closed", spotsLabel(event)));

  const back = el("a", "event-info__back", "Toute la programmation");
  back.href = "programmation.html";
  aside.appendChild(back);
  return aside;
}

function renderNotFound(root) {
  const box = el("div", "event-missing");
  box.appendChild(el("h2", "section__title", "Activité introuvable"));
  box.appendChild(el("p", null, "Cette activité n’est plus affichée ou le lien est incomplet."));
  const link = el("a", "btn btn--primary", "Voir la programmation");
  link.href = "programmation.html";
  box.appendChild(link);
  root.replaceChildren(box);
  const title = document.querySelector("[data-event-title]");
  if (title) title.textContent = "Activité introuvable";
  const lead = document.querySelector("[data-event-lead]");
  if (lead) lead.textContent = "";
}

function setupLightbox(root) {
  const buttons = root.querySelectorAll("[data-lightbox-src]");
  if (!buttons.length || typeof HTMLDialogElement === "undefined") return;
  const dialog = el("dialog", "event-lightbox");
  dialog.setAttribute("aria-label", "Photo agrandie");
  const img = document.createElement("img");
  const close = el("button", "event-lightbox__close", "Fermer");
  close.type = "button";
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.append(close, img);
  document.body.appendChild(dialog);
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      img.src = button.dataset.lightboxSrc;
      img.alt = button.dataset.lightboxAlt || "";
      dialog.showModal();
    });
  });
}
