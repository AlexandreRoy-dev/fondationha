import {
  CATEGORIES,
  CATEGORY_LABELS,
  fetchProgrammation,
} from "../data/programmation.js";

const dateTimeFormat = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Toronto",
});

export function initProgrammation() {
  const root = document.querySelector("[data-programmation]");
  if (!root) return;

  const filtersEl = root.querySelector("[data-prog-filters]");
  const listEl = root.querySelector("[data-prog-list]");
  const statusEl = root.querySelector("[data-prog-status]");
  const emptyEl = root.querySelector("[data-prog-empty]");
  if (!filtersEl || !listEl || !statusEl || !emptyEl) return;

  const events = fetchProgrammation()
    .slice()
    .sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));

  let active = "tous";

  const apply = (categoryId) => {
    active = categoryId;
    filtersEl.querySelectorAll("[data-prog-filter]").forEach((button) => {
      const pressed = button.dataset.progFilter === categoryId;
      button.setAttribute("aria-pressed", pressed ? "true" : "false");
    });

    const visible = events.filter(
      (event) => categoryId === "tous" || event.category === categoryId
    );
    listEl.replaceChildren();
    visible.forEach((event) => {
      listEl.appendChild(renderCard(event));
    });

    const empty = visible.length === 0;
    emptyEl.hidden = !empty;
    statusEl.textContent = countLabel(visible.length);
  };

  CATEGORIES.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "prog-filter";
    button.dataset.progFilter = category.id;
    button.textContent = category.label;
    button.setAttribute("aria-pressed", category.id === "tous" ? "true" : "false");
    button.addEventListener("click", () => apply(category.id));
    filtersEl.appendChild(button);
  });

  filtersEl.addEventListener("keydown", (event) => {
    const buttons = [...filtersEl.querySelectorAll("[data-prog-filter]")];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;

    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = buttons[(index + 1) % buttons.length];
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      next = buttons[(index - 1 + buttons.length) % buttons.length];
    } else if (event.key === "Home") {
      next = buttons[0];
    } else if (event.key === "End") {
      next = buttons[buttons.length - 1];
    }
    if (!next) return;
    event.preventDefault();
    next.focus();
    next.click();
  });

  apply(active);
}

function renderCard(event) {
  const item = document.createElement("li");
  const article = document.createElement("article");
  article.className = "prog-card";

  const media = document.createElement("div");
  media.className = "prog-card__media";
  const image = safeImage(event.image);
  if (image) {
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.alt;
    img.loading = "lazy";
    media.appendChild(img);
  } else {
    media.setAttribute("aria-hidden", "true");
  }
  article.appendChild(media);

  const body = document.createElement("div");
  body.className = "prog-card__body";

  if (event.example) {
    const badge = document.createElement("p");
    badge.className = "prog-badge";
    badge.textContent = "Exemple";
    body.appendChild(badge);
  }

  const date = document.createElement("p");
  date.className = "prog-card__date";
  const time = document.createElement("time");
  time.dateTime = event.startsAt || "";
  time.textContent = formatWhen(event.startsAt);
  date.appendChild(time);
  body.appendChild(date);

  const category = document.createElement("p");
  category.className = "prog-card__category";
  category.textContent = CATEGORY_LABELS[event.category] || "Activité";
  body.appendChild(category);

  const title = document.createElement("h2");
  title.className = "prog-card__title";
  title.textContent = event.title || "Activité";
  body.appendChild(title);

  if (event.description) {
    const description = document.createElement("p");
    description.className = "prog-card__text";
    description.textContent = event.description;
    body.appendChild(description);
  }

  const place = document.createElement("p");
  place.className = "prog-card__place";
  place.textContent = placeLabel(event.place);
  body.appendChild(place);

  const spots = document.createElement("p");
  spots.className = "prog-card__spots";
  const spotsText = spotsLabel(event.spotsRemaining);
  spots.textContent = spotsText;
  if (spotsText === "Complet") spots.classList.add("is-full");
  body.appendChild(spots);

  const link = document.createElement("a");
  link.className = "btn btn--primary";
  const ticketUrl = safeTicketUrl(event.ticketUrl);
  link.href = ticketUrl;
  link.textContent = "Réserver mon billet";
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = `, ${event.title || "cette activité"}`;
  link.appendChild(sr);
  if (ticketUrl === "#") {
    link.addEventListener("click", (clickEvent) => {
      clickEvent.preventDefault();
    });
  }
  body.appendChild(link);

  article.appendChild(body);
  item.appendChild(article);
  return item;
}

function formatWhen(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  const parts = dateTimeFormat.formatToParts(date);
  const pick = (type) => parts.find((part) => part.type === type)?.value || "";
  const day = pick("day");
  const month = pick("month");
  const year = pick("year");
  const hour = pick("hour");
  const minute = pick("minute");
  return `${day} ${month} ${year}, ${hour} h ${minute}`;
}

function placeLabel(place) {
  if (!place || place.mode === "en-ligne") {
    const platform = place && place.onlinePlatform;
    if (platform === "zoom") return "En ligne, Zoom";
    if (platform === "meet") return "En ligne, Google Meet";
    return "En ligne (Zoom ou Meet à confirmer)";
  }
  return place.label || "Lieu à confirmer";
}

function spotsLabel(value) {
  if (value === null || value === undefined || value === "") {
    return "Places à confirmer";
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return "Places à confirmer";
  if (number <= 0) return "Complet";
  if (number === 1) return "1 place restante";
  return `${number} places restantes`;
}

function countLabel(count) {
  if (count === 0) return "Aucune activité dans cette catégorie.";
  if (count === 1) return "1 activité.";
  return `${count} activités.`;
}

function safeTicketUrl(url) {
  if (typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "#";
  if (trimmed.startsWith("#") || trimmed.startsWith("/") || trimmed.startsWith("./")) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch {
    return "#";
  }
  return "#";
}

function safeImage(image) {
  if (!image || typeof image.src !== "string" || !image.src.trim()) return null;
  const src = image.src.trim();
  const alt = typeof image.alt === "string" ? image.alt : "";
  if (src.startsWith("/") || src.startsWith("./") || src.startsWith("../")) {
    return { src, alt };
  }
  try {
    const parsed = new URL(src, window.location.origin);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return { src: parsed.href, alt };
    }
  } catch {
    return null;
  }
  return null;
}
