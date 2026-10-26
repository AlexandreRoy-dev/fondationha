/**
 * Programmation de la Fondation Honorer Aimer.
 *
 * EXEMPLE. Les fiches de ce fichier ne sont pas des activités réelles.
 * Elles servent à construire la page en attendant l'objet personnalisé
 * GoHighLevel « Programmation ». Chaque fiche d'exemple a example: true,
 * ce qui affiche le badge « Exemple » sur la carte.
 *
 * Forme d'une fiche, alignée sur les champs prévus du CRM :
 * - title            titre
 * - category         catégorie (voir CATEGORIES)
 * - startsAt         date et heure, ISO 8601, fuseau America/Toronto
 * - place.mode       "lieu" ou "en-ligne"
 * - place.label      nom du lieu, ou libellé pour le virtuel
 * - place.onlinePlatform
 *                    TODO(client): "zoom" ou "meet". Laisser null.
 *                    Ne pas inventer l'outil ni un lien de rencontre.
 * - description      texte court
 * - image            { src, alt } ou null
 *                    TODO(crm): URL de l'image quand le champ existe.
 * - capacity         capacité totale (nombre)
 *                    TODO(client): capacité réelle. Les nombres ci-dessous
 *                    sont fictifs, uniquement pour l'exemple.
 * - spotsRemaining   places restantes (nombre). 0 affiche « Complet ».
 *                    TODO(client): nombre réel. Les nombres ci-dessous
 *                    sont fictifs.
 * - ticketUrl        URL de billetterie. « # » est un placeholder.
 * - example          true tant que la fiche n'est pas une donnée CRM
 *
 * TODO(client): ne pas rédiger ici de courriel (confirmation, rappel,
 * complet). Le client doit fournir ces textes.
 * TODO(crm): quand l'objet existe, remplacer SAMPLE_EVENTS par
 * fetchProgrammation() et mapProgrammationRecord().
 */

export const CATEGORIES = [
  { id: "tous", label: "Tous" },
  { id: "journee-bien-etre", label: "Journées bien-être" },
  { id: "atelier-creatif", label: "Ateliers créatifs" },
  { id: "atelier-en-ligne", label: "Ateliers en ligne" },
];

export const CATEGORY_LABELS = {
  "journee-bien-etre": "Journée bien-être",
  "atelier-creatif": "Atelier créatif",
  "atelier-en-ligne": "Atelier en ligne",
};

/** @type {Array<ProgrammationEvent>} */
export const SAMPLE_EVENTS = [
  {
    id: "exemple-journee-salle",
    example: true,
    title: "Journée bien-être en salle",
    category: "journee-bien-etre",
    startsAt: "2026-11-14T09:30:00-05:00",
    place: {
      mode: "lieu",
      label: "Lieu à confirmer",
      onlinePlatform: null,
    },
    description: "Exemple de journée pour ralentir et se déposer, en salle.",
    image: null,
    capacity: 18,
    spotsRemaining: 6,
    ticketUrl: "#",
  },
  {
    id: "exemple-respiration-ligne",
    example: true,
    title: "Atelier de respiration en ligne",
    category: "atelier-en-ligne",
    startsAt: "2026-11-18T19:00:00-05:00",
    place: {
      mode: "en-ligne",
      label: "En ligne",
      // TODO(client): Zoom ou Meet. Ne pas deviner.
      onlinePlatform: null,
    },
    description: "Exemple d’atelier tenu en ligne. L’outil de rencontre n’est pas choisi.",
    image: null,
    capacity: 40,
    spotsRemaining: 11,
    ticketUrl: "#",
  },
  {
    id: "exemple-ecriture",
    example: true,
    title: "Atelier d’écriture",
    category: "atelier-creatif",
    startsAt: "2026-11-21T13:30:00-05:00",
    place: {
      mode: "lieu",
      label: "Lieu à confirmer",
      onlinePlatform: null,
    },
    description: "Exemple d’atelier d’écriture, en salle.",
    image: null,
    capacity: 10,
    spotsRemaining: 1,
    ticketUrl: "#",
  },
  {
    id: "exemple-journee-complet",
    example: true,
    title: "Journée bien-être en petit groupe",
    category: "journee-bien-etre",
    startsAt: "2026-12-05T10:00:00-05:00",
    place: {
      mode: "lieu",
      label: "Lieu à confirmer",
      onlinePlatform: null,
    },
    description: "Exemple de journée en petit groupe, en salle.",
    image: null,
    capacity: 14,
    spotsRemaining: 0,
    ticketUrl: "#",
  },
  {
    id: "exemple-parole-ligne",
    example: true,
    title: "Atelier de parole en ligne",
    category: "atelier-en-ligne",
    startsAt: "2026-12-09T19:00:00-05:00",
    place: {
      mode: "en-ligne",
      label: "En ligne",
      onlinePlatform: null,
    },
    description: "Exemple d’atelier tenu en ligne. L’outil de rencontre n’est pas choisi.",
    image: null,
    capacity: 25,
    spotsRemaining: 4,
    ticketUrl: "#",
  },
  {
    id: "exemple-creation",
    example: true,
    title: "Atelier de création manuelle",
    category: "atelier-creatif",
    startsAt: "2027-01-16T14:00:00-05:00",
    place: {
      mode: "lieu",
      label: "Lieu à confirmer",
      onlinePlatform: null,
    },
    description: "Exemple d’atelier de création manuelle, en salle.",
    image: null,
    capacity: 8,
    spotsRemaining: 3,
    ticketUrl: "#",
  },
];

/**
 * Adaptateur pour un enregistrement de l'objet GoHighLevel « Programmation ».
 * Les noms de champs CRM sont des propositions, à confirmer.
 *
 * TODO(crm): remplacer les clés record.* par les vrais champs de l'objet.
 * TODO(client): capacity, spotsRemaining, onlinePlatform, ticketUrl,
 * et les textes de courriel restent vides tant qu'ils ne sont pas fournis.
 *
 * @param {Record<string, unknown>} record
 */
export function mapProgrammationRecord(record) {
  const imageUrl = typeof record.imageUrl === "string" ? record.imageUrl : "";
  const platform = record.onlinePlatform;
  return {
    id: String(record.id || ""),
    example: false,
    title: typeof record.title === "string" ? record.title : "",
    category: typeof record.category === "string" ? record.category : "",
    startsAt: typeof record.startsAt === "string" ? record.startsAt : "",
    place: {
      mode: record.placeMode === "en-ligne" ? "en-ligne" : "lieu",
      label: typeof record.placeLabel === "string" ? record.placeLabel : "",
      onlinePlatform: platform === "zoom" || platform === "meet" ? platform : null,
    },
    description: typeof record.description === "string" ? record.description : "",
    image: imageUrl
      ? {
          src: imageUrl,
          alt: typeof record.imageAlt === "string" ? record.imageAlt : "",
        }
      : null,
    capacity: toCount(record.capacity),
    spotsRemaining: toCount(record.spotsRemaining),
    ticketUrl: typeof record.ticketUrl === "string" && record.ticketUrl ? record.ticketUrl : "#",
  };
}

/**
 * Point d'entrée unique pour la page.
 * TODO(crm): lire l'objet personnalisé « Programmation » et retourner
 * records.map(mapProgrammationRecord). Ne pas appeler l'API tant que
 * l'objet n'est pas en place.
 */
export function fetchProgrammation() {
  return SAMPLE_EVENTS;
}

function toCount(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.round(number));
}
