import { CATEGORY_LABELS } from "../data/programmation.js";

const dateFormat = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const moneyFormat = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function categoryLabel(event) {
  return CATEGORY_LABELS[event.category] || event.categoryLabel || event.type || "Activité";
}

export function formatDate(dateValue) {
  const match = String(dateValue || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  return dateFormat.format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function formatWhen(dateValue, timeText) {
  const time = typeof timeText === "string" ? timeText.trim() : "";
  const dateLabel = formatDate(dateValue);
  if (!dateLabel) return time || "Date à confirmer";
  return time ? `${dateLabel}, ${time}` : dateLabel;
}

/** Plage complète : « 14 novembre 2026, 9 h 30 à 16 h » ou sur plusieurs jours. */
export function formatRange(event) {
  const start = formatWhen(event.dateDebut, event.heureDebut);
  const sameDay = !event.dateFin || event.dateFin === event.dateDebut;
  if (sameDay) {
    return event.heureFin ? `${start} à ${event.heureFin}` : start;
  }
  const end = formatWhen(event.dateFin, event.heureFin);
  return `Du ${start} au ${end}`;
}

export function formatMoney(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return moneyFormat.format(value);
}

export function isOnline(event) {
  const lieu = (event.lieu || "").trim().toLowerCase();
  return event.category === "ateliers_en_ligne" || lieu === "en ligne" || (event.enLigne && !lieu);
}

export function placeLabel(event) {
  const lieu = (event.lieu || "").trim();
  if (isOnline(event)) {
    return event.enLigne ? "En ligne" : "En ligne (Zoom ou Meet à confirmer)";
  }
  return lieu || "Lieu à confirmer";
}

export function isClosed(event) {
  if (event.statut === "complet" || event.statut === "termine") return true;
  return typeof event.placesRestantes === "number" && event.placesRestantes <= 0;
}

export function spotsLabel(event) {
  if (event.statut === "termine") return "Terminé";
  if (isClosed(event)) return "Complet";
  if (event.placesRestantes == null) return "Places à confirmer";
  if (event.placesRestantes === 1) return "1 place restante";
  return `${event.placesRestantes} places restantes`;
}

export function detailUrl(event) {
  return `evenement.html?slug=${encodeURIComponent(event.slug || event.id || "")}`;
}

export function safeUrl(url) {
  if (typeof url !== "string") return "#";
  const trimmed = url.trim();
  if (!trimmed || trimmed === "#") return "#";
  try {
    const parsed = new URL(trimmed, window.location.href);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch {
    return "#";
  }
  return "#";
}

export function safeImage(image) {
  if (!image || typeof image.src !== "string" || !image.src.trim()) return null;
  const src = image.src.trim();
  const alt = typeof image.alt === "string" ? image.alt : "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(src) && !/^https?:/i.test(src)) return null;
  try {
    return { src: new URL(src, window.location.href).href, alt };
  } catch {
    return null;
  }
}

export function el(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent != null) node.textContent = textContent;
  return node;
}

export function ticketButton(event, label = "Réserver mon billet") {
  const link = el("a", "btn btn--primary", label);
  const ticketUrl = safeUrl(event.ticketUrl);
  link.href = ticketUrl;
  const sr = el("span", "sr-only", `, ${event.title || "cette activité"}`);
  link.appendChild(sr);
  if (ticketUrl === "#") {
    link.addEventListener("click", (clickEvent) => clickEvent.preventDefault());
  } else {
    link.target = "_blank";
    link.rel = "noopener";
  }
  return link;
}
