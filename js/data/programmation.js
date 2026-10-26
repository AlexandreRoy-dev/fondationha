/**
 * Programmation de la Fondation Honorer Aimer.
 *
 * EXEMPLE. SAMPLE_RECORDS n'est pas la programmation réelle.
 * Chaque fiche a example: true, ce qui affiche le badge « Exemple ».
 *
 * Objet GoHighLevel déjà créé :
 * - sous-compte vytdZ9CJafKxgnpVRP9U
 * - id 6adea9c73f6d09acc64bf0bd
 * - clé custom_objects.programmations
 *
 * Le spec compte 18 clés (nom, champ principal, plus 17 champs).
 * L'objet en ligne est annoncé à 17 champs. mapProgrammationRecord()
 * lit chaque suffixe du spec. Un champ absent sur l'enregistrement
 * reste vide. Rien n'est inventé pour le remplacer.
 *
 * Intégration prévue, sans appel depuis le navigateur.
 * La clé Private Integration est en lecture seule et ne doit jamais
 * être exposée côté client (aucun jeton dans ce fichier).
 * Chemin : un proxy serveur ou une fonction serverless, ou un export
 * au moment du build, lit les enregistrements de
 * custom_objects.programmations. Le jeton reste sur le serveur.
 * La réponse publique ne garde que les enregistrements dont le statut
 * est publie ou complet. fetchProgrammation() remplace alors
 * SAMPLE_RECORDS par ces enregistrements, chacun passé à
 * mapProgrammationRecord().
 *
 * TODO(client): ne pas remplir ici places_maximum, places_reservees,
 * places_restantes, lien_en_ligne (Zoom ou Meet), lien_paiement,
 * contribution_suggeree, ni aucun texte de courriel.
 */

export const PROGRAMMATION_OBJECT = {
  locationId: "vytdZ9CJafKxgnpVRP9U",
  objectId: "6adea9c73f6d09acc64bf0bd",
  key: "custom_objects.programmations",
};

/** Suffixes du spec. La clé complète est custom_objects.programmations.<suffixe>. */
export const FIELD_SUFFIXES = [
  "nom",
  "date_debut",
  "date_fin",
  "heure_debut",
  "heure_fin",
  "categorie",
  "animatrices",
  "lien_en_ligne",
  "lieu",
  "contribution_suggeree",
  "places_maximum",
  "places_reservees",
  "places_restantes",
  "lien_paiement",
  "statut",
  "notes",
  "description",
  "image_principale",
];

export const CATEGORIES = [
  { id: "tous", label: "Tous" },
  { id: "journees_bien_etre", label: "Journées bien-être" },
  { id: "ateliers_creatifs", label: "Ateliers créatifs" },
  { id: "ateliers_en_ligne", label: "Ateliers en ligne" },
];

export const CATEGORY_LABELS = {
  journees_bien_etre: "Journées bien-être",
  ateliers_creatifs: "Ateliers créatifs",
  ateliers_en_ligne: "Ateliers en ligne",
};

const CATEGORY_ALIASES = {
  journees_bien_etre: "journees_bien_etre",
  "journées bien-être": "journees_bien_etre",
  "journees bien-etre": "journees_bien_etre",
  ateliers_creatifs: "ateliers_creatifs",
  "ateliers créatifs": "ateliers_creatifs",
  "ateliers creatifs": "ateliers_creatifs",
  ateliers_en_ligne: "ateliers_en_ligne",
  "ateliers en ligne": "ateliers_en_ligne",
};

const STATUT_ALIASES = {
  brouillon: "brouillon",
  publie: "publie",
  publié: "publie",
  complet: "complet",
  annule: "annule",
  annulé: "annule",
};

const PUBLIC_STATUTS = new Set(["publie", "complet"]);

/**
 * Fiches d'exemple, dans la forme d'un enregistrement GHL
 * (id + properties, clés complètes).
 * Les champs EN ATTENTE sont null. Ce ne sont pas des valeurs réelles.
 */
export const SAMPLE_RECORDS = [
  sampleRecord("exemple-journee-salle", {
    nom: "Journée bien-être en salle",
    categorie: "journees_bien_etre",
    date_debut: "2026-11-14",
    heure_debut: "9 h 30",
    lieu: "Lieu à confirmer",
    statut: "publie",
    description: "Exemple de journée pour ralentir et se déposer, en salle.",
  }),
  sampleRecord("exemple-respiration-ligne", {
    nom: "Atelier de respiration en ligne",
    categorie: "ateliers_en_ligne",
    date_debut: "2026-11-18",
    heure_debut: "19 h 00",
    lieu: "En ligne",
    statut: "publie",
    description: "Exemple d’atelier tenu en ligne. L’outil de rencontre n’est pas choisi.",
  }),
  sampleRecord("exemple-ecriture", {
    nom: "Atelier d’écriture",
    categorie: "ateliers_creatifs",
    date_debut: "2026-11-21",
    heure_debut: "13 h 30",
    lieu: "Lieu à confirmer",
    statut: "publie",
    description: "Exemple d’atelier d’écriture, en salle.",
  }),
  sampleRecord("exemple-journee-complet", {
    nom: "Journée bien-être en petit groupe",
    categorie: "journees_bien_etre",
    date_debut: "2026-12-05",
    heure_debut: "10 h 00",
    lieu: "Lieu à confirmer",
    statut: "complet",
    description: "Exemple de journée en petit groupe, en salle.",
  }),
  sampleRecord("exemple-parole-ligne", {
    nom: "Atelier de parole en ligne",
    categorie: "ateliers_en_ligne",
    date_debut: "2026-12-09",
    heure_debut: "19 h 00",
    lieu: "En ligne",
    statut: "publie",
    description: "Exemple d’atelier tenu en ligne. L’outil de rencontre n’est pas choisi.",
  }),
  sampleRecord("exemple-creation", {
    nom: "Atelier de création manuelle",
    categorie: "ateliers_creatifs",
    date_debut: "2027-01-16",
    heure_debut: "14 h 00",
    lieu: "Lieu à confirmer",
    statut: "publie",
    description: "Exemple d’atelier de création manuelle, en salle.",
  }),
];

/**
 * Adaptateur d'un enregistrement de custom_objects.programmations.
 * Accepte properties avec la clé complète ou le suffixe seul.
 *
 * @param {Record<string, unknown>} record
 */
export function mapProgrammationRecord(record) {
  const source = record || {};
  const categorie = normalizeCategory(readField(source, "categorie"));
  const statut = normalizeStatut(readField(source, "statut"));
  const dateDebut = text(readField(source, "date_debut"));
  const heureDebut = text(readField(source, "heure_debut"));
  const lieu = text(readField(source, "lieu"));
  const lienEnLigne = text(readField(source, "lien_en_ligne"));
  const lienPaiement = text(readField(source, "lien_paiement"));

  return {
    id: String(source.id || ""),
    example: source.example === true,
    title: text(readField(source, "nom")),
    category: categorie,
    dateDebut,
    heureDebut,
    dateFin: text(readField(source, "date_fin")),
    heureFin: text(readField(source, "heure_fin")),
    sortKey: sortKey(dateDebut, heureDebut),
    animatrices: toList(readField(source, "animatrices")),
    lienEnLigne,
    lieu,
    contribution: toMoney(readField(source, "contribution_suggeree")),
    placesMaximum: toCount(readField(source, "places_maximum")),
    placesReservees: toCount(readField(source, "places_reservees")),
    placesRestantes: toCount(readField(source, "places_restantes")),
    ticketUrl: lienPaiement || "#",
    statut,
    notes: text(readField(source, "notes")),
    description: text(readField(source, "description")),
    image: imageFromField(readField(source, "image_principale")),
  };
}

/**
 * Point d'entrée de la page. Pas d'appel réseau.
 * TODO(crm): remplacer SAMPLE_RECORDS par la réponse du proxy
 * ou de l'export de build, puis mapper.
 */
export function fetchProgrammation() {
  return SAMPLE_RECORDS.map(mapProgrammationRecord).filter((event) =>
    PUBLIC_STATUTS.has(event.statut)
  );
}

function sampleRecord(id, values) {
  const properties = {};
  FIELD_SUFFIXES.forEach((suffix) => {
    properties[fieldKey(suffix)] = Object.prototype.hasOwnProperty.call(values, suffix)
      ? values[suffix]
      : null;
  });
  return { id, example: true, properties };
}

function fieldKey(suffix) {
  return `${PROGRAMMATION_OBJECT.key}.${suffix}`;
}

function readField(record, suffix) {
  const full = fieldKey(suffix);
  const bags = [record.properties, record].filter(
    (bag) => bag && typeof bag === "object"
  );
  for (const bag of bags) {
    if (Object.prototype.hasOwnProperty.call(bag, full) && bag[full] != null && bag[full] !== "") {
      return bag[full];
    }
    if (Object.prototype.hasOwnProperty.call(bag, suffix) && bag[suffix] != null && bag[suffix] !== "") {
      return bag[suffix];
    }
  }
  return null;
}

function text(value) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeCategory(value) {
  const raw = text(value).toLowerCase();
  return CATEGORY_ALIASES[raw] || "";
}

function normalizeStatut(value) {
  const raw = text(value).toLowerCase();
  return STATUT_ALIASES[raw] || "";
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter(Boolean);
  }
  const single = text(value);
  return single ? [single] : [];
}

function toCount(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.round(number));
}

function toMoney(value) {
  if (value == null || value === "") return null;
  const number = Number(String(value).replace(",", "."));
  if (!Number.isFinite(number)) return null;
  return number;
}

function imageFromField(value) {
  if (!value) return null;
  if (typeof value === "string") return { src: value, alt: "" };
  if (Array.isArray(value)) return imageFromField(value[0]);
  if (typeof value === "object") {
    const src = text(value.url || value.src || value.fileUrl);
    if (!src) return null;
    return { src, alt: text(value.alt) };
  }
  return null;
}

function sortKey(dateValue, timeText) {
  const day = text(dateValue).match(/^(\d{4}-\d{2}-\d{2})/);
  const date = day ? day[1] : "9999-99-99";
  const clock = parseHeure(timeText) || "00:00";
  return `${date}T${clock}`;
}

function parseHeure(timeText) {
  const match = text(timeText).match(/(\d{1,2})\s*h(?:\s*(\d{2}))?/i);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2] || "00"}`;
}
