import { events } from "../data/events.js";

const DATE_FORMAT = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function initEvents() {
  const roots = document.querySelectorAll("[data-events-root]");
  if (!roots.length) return;

  const upcoming = upcomingEvents(events);

  roots.forEach((root) => {
    const list = root.querySelector("[data-events-list]");
    if (!list || !upcoming.length) return;

    const limit = Number(root.getAttribute("data-events-limit"));
    const visible = limit > 0 ? upcoming.slice(0, limit) : upcoming;

    root.querySelectorAll("[data-events-empty]").forEach((node) => {
      node.hidden = true;
    });

    list.hidden = false;
    list.replaceChildren(...visible.map(renderEvent));
  });
}

function upcomingEvents(list) {
  const today = startOfToday();
  return list
    .map(normalizeEvent)
    .filter((event) => event && event.dateValue >= today)
    .sort((a, b) => a.dateValue - b.dateValue || a.titre.localeCompare(b.titre, "fr"));
}

function normalizeEvent(raw) {
  if (!raw || typeof raw !== "object") return null;
  const titre = text(raw.titre);
  const dateValue = parseDate(raw.date);
  if (!titre || !dateValue) return null;
  return {
    titre,
    date: isoDate(dateValue),
    dateValue,
    heure: text(raw.heure),
    lieu: text(raw.lieu),
    resume: text(raw.resume),
    lien: safeUrl(raw.lien),
    lienLibelle: text(raw.lienLibelle) || "En savoir plus",
  };
}

function renderEvent(event) {
  const item = document.createElement("li");
  item.className = "event-card";

  const date = document.createElement("p");
  date.className = "event-card__date";
  const time = document.createElement("time");
  time.dateTime = event.date;
  time.textContent = DATE_FORMAT.format(event.dateValue);
  date.append(time);
  item.append(date);

  const title = document.createElement("h3");
  title.textContent = event.titre;
  item.append(title);

  const meta = [event.heure, event.lieu].filter(Boolean);
  if (meta.length) {
    const line = document.createElement("p");
    line.className = "event-card__meta";
    line.textContent = meta.join(", ");
    item.append(line);
  }

  if (event.resume) {
    const summary = document.createElement("p");
    summary.className = "event-card__resume";
    summary.textContent = event.resume;
    item.append(summary);
  }

  if (event.lien) {
    const link = document.createElement("a");
    link.className = "btn btn--secondary event-card__link";
    link.href = event.lien;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = event.lienLibelle;
    item.append(link);
  }

  return item;
}

function parseDate(value) {
  const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function text(value) {
  if (value == null) return "";
  return String(value).replace(/\s+/g, " ").trim();
}

function safeUrl(value) {
  const raw = text(value);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    return "";
  }
  return "";
}
