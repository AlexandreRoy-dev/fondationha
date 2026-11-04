#!/usr/bin/env python3
"""Synchronise la programmation de la Fondation Honorer Aimer depuis GoHighLevel.

Lit les enregistrements de l'objet personnalise custom_objects.programmations
(sous-compte FHA), garde ceux qui sont publics, retire les champs internes,
telecharge les images dans assets/images/events/<slug>/ et ecrit
data/events.json, trie par date.

Variables d'environnement :
  GHL_FHA_TOKEN     jeton Private Integration (obligatoire, lecture seule suffit :
                    objects/schema.readonly et objects/record.readonly)
  GHL_LOCATION_ID   sous-compte (defaut : vytdZ9CJafKxgnpVRP9U)
  GHL_OBJECT_KEY    cle de l'objet (defaut : custom_objects.programmations)
  MOCK_RECORDS      chemin d'un JSON de test {"records": [...]} au lieu de l'API
  SKIP_IMAGES=1     ne pas telecharger les images (test)

Aucune dependance externe : bibliotheque standard seulement.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_JSON = ROOT / "data" / "events.json"
IMG_DIR = ROOT / "assets" / "images" / "events"
IMG_URL_PREFIX = "assets/images/events"

API = "https://services.leadconnectorhq.com"
API_VERSION = "2021-07-28"
LOCATION_ID = os.environ.get("GHL_LOCATION_ID", "vytdZ9CJafKxgnpVRP9U")
OBJECT_KEY = os.environ.get("GHL_OBJECT_KEY", "custom_objects.programmations")
PAGE_LIMIT = 100
MAX_EXTRA_IMAGES = 3
MAX_IMAGE_BYTES = 12 * 1024 * 1024
MAX_TICKETS = 5

# ---------------------------------------------------------------------------
# Correspondance des champs (a ajuster quand les vraies cles seront connues).
#
# Pour chaque champ logique, on essaie dans l'ordre :
#   1. les cles listees (suffixe seul ou cle complete custom_objects.x.suffixe)
#   2. le libelle du champ dans le schema GHL (si l'API schema repond),
#      compare sans accents ni ponctuation.
# Le premier qui a une valeur gagne. Un champ introuvable reste vide.
# ---------------------------------------------------------------------------
FIELD_MAP: dict[str, dict[str, list[str]]] = {
    "title": {
        "keys": ["nom_de_levenement", "nom_de_l_evenement", "nom_evenement", "nom", "name", "titre"],
        "labels": ["Nom de l'événement", "Nom", "Titre"],
    },
    "date_debut": {"keys": ["date_de_debut", "date_debut", "debut"], "labels": ["Date de début"]},
    "date_fin": {"keys": ["date_de_fin", "date_fin", "fin"], "labels": ["Date de fin"]},
    "heure_debut": {"keys": ["heure_de_debut", "heure_debut"], "labels": ["Heure de début"]},
    "heure_fin": {"keys": ["heure_de_fin", "heure_fin"], "labels": ["Heure de fin"]},
    "lieu": {"keys": ["lieu"], "labels": ["Lieu"]},
    "adresse": {"keys": ["adresse", "address"], "labels": ["Adresse"]},
    "lien_en_ligne": {
        "keys": ["lien_en_ligne", "lien_enligne", "lien"],
        "labels": ["Lien en ligne", "Lien (en ligne)", "Lien"],
    },
    "lien_paiement": {
        "keys": ["lien_de_paiement_stripe", "lien_de_paiement", "lien_paiement", "lien_stripe"],
        "labels": ["Lien de paiement Stripe", "Lien de paiement"],
    },
    "contribution": {
        "keys": ["contribution_suggeree", "contribution"],
        "labels": ["Contribution suggérée"],
    },
    "places_maximum": {"keys": ["places_maximum", "places_max"], "labels": ["Places maximum"]},
    "places_reservees": {"keys": ["places_reservees"], "labels": ["Places réservées"]},
    "places_restantes": {"keys": ["places_restantes"], "labels": ["Places restantes"]},
    "description": {
        "keys": ["description_publique", "description"],
        "labels": ["Description publique", "Description"],
    },
    "resume": {"keys": ["resume_court", "resume"], "labels": ["Résumé court", "Résumé"]},
    "image": {
        "keys": ["image_principale", "image"],
        "labels": ["Image principale", "Image"],
    },
    "images_extra": {
        "keys": ["images_additionnelles", "images_supplementaires", "galerie"],
        "labels": ["Images additionnelles", "Images supplémentaires", "Galerie"],
    },
    "categorie": {"keys": ["categorie", "category"], "labels": ["Catégorie"]},
    "statut": {"keys": ["statut", "status"], "labels": ["Statut"]},
    "animatrices": {"keys": ["animatrices", "animatrice", "animateurs"], "labels": ["Animatrices"]},
    "type": {"keys": ["type_devenement", "type_d_evenement", "type_evenement", "type"], "labels": ["Type d'événement"]},
    "publier": {
        "keys": ["publier_sur_le_site", "publier_sur_site", "publier"],
        "labels": ["Publier sur le site"],
    },
}

# Billets : "Billet 1 : nom", "Billet 1 : prix", "Billet 1 : description", etc.
TICKET_PARTS = {"nom": ["nom", "name", "titre"], "prix": ["prix", "price", "montant"], "description": ["description", "desc"]}

# Champs internes, jamais publies (documentation : ils ne sont pas lus du tout).
INTERNAL_FIELDS = ["notes", "responsable", "objectif_de_collecte", "montant_amasse", "places_reservees"]

PUBLIC_STATUTS_EXCLUDED = {"annule", "brouillon"}
YES_VALUES = {"oui", "yes", "true", "1", "vrai", "o", "y"}

CATEGORY_ALIASES = {
    "journees_bien_etre": "journees_bien_etre",
    "journee_bien_etre": "journees_bien_etre",
    "ateliers_creatifs": "ateliers_creatifs",
    "atelier_creatif": "ateliers_creatifs",
    "ateliers_en_ligne": "ateliers_en_ligne",
    "atelier_en_ligne": "ateliers_en_ligne",
}
STATUT_ALIASES = {
    "brouillon": "brouillon",
    "publie": "publie",
    "inscriptions_ouvertes": "publie",
    "planifie": "publie",
    "complet": "complet",
    "annule": "annule",
    "termine": "termine",
}


# ---------------------------------------------------------------------------
def norm(value: str) -> str:
    """'Nom de l'événement' -> 'nom_de_l_evenement' (sans accents)."""
    s = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "_", s.lower()).strip("_")
    return s


def compact(value: str) -> str:
    return norm(value).replace("_", "")


def clean_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, (list, tuple)):
        value = ", ".join(clean_text(v) for v in value if clean_text(v))
    if isinstance(value, dict):
        value = value.get("value") or value.get("label") or value.get("name") or ""
    s = str(value).strip()
    # Regle du site : aucun tiret long ni demi-cadratin.
    s = re.sub(r"\s*[\u2014\u2013]\s*", ", ", s) if re.search(r"\s[\u2014\u2013]\s", s) else s
    s = s.replace("\u2014", "-").replace("\u2013", "-")
    return s


def api_request(method: str, path: str, token: str, body=None, params: str = ""):
    url = f"{API}{path}{params}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Version", API_VERSION)
    req.add_header("Accept", "application/json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                return json.loads(resp.read().decode() or "{}")
        except urllib.error.HTTPError as err:
            if err.code == 429 or err.code >= 500:
                time.sleep(2 * (attempt + 1))
                continue
            detail = err.read().decode(errors="replace")[:300]
            raise SystemExit(f"Erreur API {err.code} sur {method} {path} : {detail}")
        except urllib.error.URLError as err:
            time.sleep(2 * (attempt + 1))
            print(f"Reseau : {err}", file=sys.stderr)
    raise SystemExit(f"API injoignable : {path}")


def fetch_schema_labels(token: str) -> dict[str, str]:
    """Retourne {suffixe_normalise: libelle_normalise}. Vide si indisponible."""
    try:
        data = api_request(
            "GET", f"/objects/{OBJECT_KEY}", token,
            params=f"?locationId={LOCATION_ID}&fetchProperties=true",
        )
    except SystemExit as err:
        print(f"Schema non lu ({err}). On continue avec les cles seulement.", file=sys.stderr)
        return {}
    fields = data.get("fields") or data.get("object", {}).get("fields") or []
    out = {}
    for f in fields:
        key = str(f.get("fieldKey") or f.get("key") or "")
        suffix = key.split(".")[-1]
        if suffix:
            out[norm(suffix)] = norm(f.get("name") or f.get("label") or "")
    return out


def fetch_records(token: str) -> list[dict]:
    records, page = [], 1
    while True:
        data = api_request(
            "POST", f"/objects/{OBJECT_KEY}/records/search", token,
            body={"locationId": LOCATION_ID, "page": page, "pageLimit": PAGE_LIMIT, "query": ""},
        )
        batch = data.get("records") or []
        records.extend(batch)
        total = data.get("total")
        if not batch or len(batch) < PAGE_LIMIT or (isinstance(total, int) and len(records) >= total):
            break
        page += 1
        if page > 50:
            break
    return records


# ---------------------------------------------------------------------------
class FieldReader:
    def __init__(self, record: dict, labels: dict[str, str]):
        props = record.get("properties") or {}
        self.values: dict[str, object] = {}
        for k, v in list(props.items()) + [(k, v) for k, v in record.items() if k != "properties"]:
            suffix = norm(str(k).split(".")[-1])
            if suffix not in self.values or self.values[suffix] in (None, "", []):
                self.values[suffix] = v
        # libelle -> valeur, via le schema
        self.by_label: dict[str, object] = {}
        for suffix, label in labels.items():
            if label and suffix in self.values:
                self.by_label[label] = self.values[suffix]

    @staticmethod
    def _has(v) -> bool:
        return v not in (None, "", [], {})

    def get(self, logical: str):
        spec = FIELD_MAP[logical]
        for key in spec["keys"]:
            v = self.values.get(norm(key.split(".")[-1]))
            if self._has(v):
                return v
        for label in spec["labels"]:
            v = self.by_label.get(norm(label))
            if self._has(v):
                return v
        # dernier recours : comparaison compacte (sans underscores)
        wanted = {compact(k) for k in spec["keys"]} | {compact(l) for l in spec["labels"]}
        for suffix, v in self.values.items():
            if compact(suffix) in wanted and self._has(v):
                return v
        return None

    def tickets(self) -> list[dict]:
        sources = dict(self.values)
        sources.update({k: v for k, v in self.by_label.items() if k not in sources})
        found: dict[int, dict] = {}
        for key, value in sources.items():
            m = re.match(r"^billet_?(\d+)_?(.*)$", key)
            if not m or not self._has(value):
                continue
            idx, part = int(m.group(1)), m.group(2)
            for name, aliases in TICKET_PARTS.items():
                if part in aliases or compact(part) in aliases:
                    found.setdefault(idx, {})[name] = value
        out = []
        for idx in sorted(found)[:MAX_TICKETS]:
            t = found[idx]
            ticket = {
                "nom": clean_text(t.get("nom")),
                "prix": to_money(t.get("prix")),
                "description": clean_text(t.get("description")),
            }
            if ticket["nom"] or ticket["prix"] is not None:
                out.append(ticket)
        return out


def to_date(value) -> str:
    if value in (None, ""):
        return ""
    if isinstance(value, (int, float)) or (isinstance(value, str) and value.isdigit()):
        ms = float(value)
        if ms > 1e11:
            ms /= 1000
        return datetime.fromtimestamp(ms, tz=timezone.utc).strftime("%Y-%m-%d")
    m = re.match(r"(\d{4}-\d{2}-\d{2})", str(value))
    return m.group(1) if m else ""


def to_money(value):
    if isinstance(value, dict):
        value = value.get("value", value.get("amount"))
    if value in (None, ""):
        return None
    s = re.sub(r"[^0-9,.\-]", "", str(value)).replace(",", ".")
    try:
        return round(float(s), 2)
    except ValueError:
        return None


def to_count(value):
    if value in (None, ""):
        return None
    try:
        return max(0, int(round(float(str(value).replace(",", ".")))))
    except ValueError:
        return None


def to_list(value) -> list[str]:
    if isinstance(value, (list, tuple)):
        return [clean_text(v) for v in value if clean_text(v)]
    s = clean_text(value)
    if not s:
        return []
    return [p.strip() for p in re.split(r"[;\n]|,(?=\s*[A-ZÀ-Ý])", s) if p.strip()]


def is_yes(value) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, (list, tuple)):
        return any(is_yes(v) for v in value)
    return norm(clean_text(value)) in YES_VALUES


def file_urls(value) -> list[str]:
    """Extrait les URL d'un champ televersement GHL (liste, dict uuid->meta, ou texte)."""
    urls: list[str] = []
    if value in (None, ""):
        return urls
    if isinstance(value, str):
        urls += re.findall(r"https?://[^\s,\"']+", value)
    elif isinstance(value, list):
        for v in value:
            urls += file_urls(v)
    elif isinstance(value, dict):
        direct = value.get("url") or value.get("fileUrl") or value.get("src")
        if isinstance(direct, str):
            urls.append(direct)
        else:
            for v in value.values():
                if isinstance(v, (dict, list)):
                    urls += file_urls(v)
    seen, out = set(), []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def make_slug(title: str, date: str) -> str:
    base = norm(title).replace("_", "-")[:60].strip("-") or "activite"
    return f"{base}-{date}" if date else base


EXT_BY_TYPE = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif", "image/avif": ".avif"}


STATS = {"non_publie": 0, "statut_exclu": 0, "sans_titre": 0, "images_ok": 0, "images_auth": 0, "images_echec": 0}


def download_image(url: str, dest_stem: Path, token: str | None) -> str | None:
    """Telecharge url vers dest_stem.<ext>. Retourne le chemin relatif au site.

    Essaie d'abord sans authentification (URL publiques du stockage GHL),
    puis avec le jeton si le premier essai echoue.
    """
    if os.environ.get("SKIP_IMAGES") == "1":
        return None
    result = _download_image(url, dest_stem, token)
    if result:
        STATS["images_ok"] += 1
    else:
        STATS["images_echec"] += 1
    return result


def _download_image(url: str, dest_stem: Path, token: str | None) -> str | None:
    if os.environ.get("SKIP_IMAGES") == "1":
        return None
    for auth in (False, True):
        req = urllib.request.Request(url, headers={"User-Agent": "fha-events-sync/1.0"})
        if auth and token:
            req.add_header("Authorization", f"Bearer {token}")
            req.add_header("Version", API_VERSION)
        elif auth:
            break
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                ctype = (resp.headers.get("Content-Type") or "").split(";")[0].strip().lower()
                data = resp.read(MAX_IMAGE_BYTES + 1)
        except (urllib.error.HTTPError, urllib.error.URLError) as err:
            print(f"Image non telechargee ({'avec' if auth else 'sans'} jeton, {err}) : {url.split('?')[0]}", file=sys.stderr)
            continue
        if auth:
            STATS["images_auth"] += 1
        if len(data) > MAX_IMAGE_BYTES:
            print(f"Image trop lourde, ignoree : {url}", file=sys.stderr)
            return None
        ext = EXT_BY_TYPE.get(ctype) or Path(url.split("?")[0]).suffix.lower()
        if ext not in EXT_BY_TYPE.values() and ext != ".jpeg":
            print(f"Pas une image ({ctype}), ignoree : {url}", file=sys.stderr)
            return None
        dest_stem.parent.mkdir(parents=True, exist_ok=True)
        dest = dest_stem.with_suffix(".jpg" if ext == ".jpeg" else ext)
        for old in dest_stem.parent.glob(dest_stem.name + ".*"):
            if old != dest:
                old.unlink()
        if not dest.exists() or dest.read_bytes() != data:
            dest.write_bytes(data)
        return f"{IMG_URL_PREFIX}/{dest.parent.name}/{dest.name}"
    return None


# ---------------------------------------------------------------------------
def build_event(record: dict, labels: dict[str, str], token: str | None):
    r = FieldReader(record, labels)
    if not is_yes(r.get("publier")):
        STATS["non_publie"] += 1
        return None
    statut_raw = clean_text(r.get("statut"))
    statut = STATUT_ALIASES.get(norm(statut_raw), norm(statut_raw))
    if statut in PUBLIC_STATUTS_EXCLUDED:
        STATS["statut_exclu"] += 1
        return None

    title = clean_text(r.get("title"))
    date_debut = to_date(r.get("date_debut"))
    if not title:
        STATS["sans_titre"] += 1
        return None
    slug = make_slug(title, date_debut)

    cat_raw = clean_text(r.get("categorie"))
    category = CATEGORY_ALIASES.get(norm(cat_raw), norm(cat_raw))

    img_dir = IMG_DIR / slug
    main_url = (file_urls(r.get("image")) or [None])[0]
    image = download_image(main_url, img_dir / "principale", token) if main_url else None
    gallery = []
    for i, url in enumerate(file_urls(r.get("images_extra"))[:MAX_EXTRA_IMAGES], start=1):
        path = download_image(url, img_dir / f"image-{i}", token)
        if path:
            gallery.append({"src": path, "alt": f"{title}, photo {i}"})
    if img_dir.exists():
        keep = {Path(image).name} if image else set()
        keep |= {Path(g["src"]).name for g in gallery}
        for f in img_dir.iterdir():
            if f.name not in keep:
                f.unlink()

    lieu = clean_text(r.get("lieu"))
    return {
        "id": str(record.get("id", "")),
        "slug": slug,
        "title": title,
        "category": category,
        "categoryLabel": cat_raw,
        "type": clean_text(r.get("type")),
        "statut": statut or "publie",
        "dateDebut": date_debut,
        "heureDebut": clean_text(r.get("heure_debut")),
        "dateFin": to_date(r.get("date_fin")),
        "heureFin": clean_text(r.get("heure_fin")),
        "lieu": lieu,
        "adresse": clean_text(r.get("adresse")),
        "enLigne": bool(clean_text(r.get("lien_en_ligne"))) or norm(lieu) == "en_ligne",
        "ticketUrl": clean_text(r.get("lien_paiement")),
        "contribution": to_money(r.get("contribution")),
        "placesMaximum": to_count(r.get("places_maximum")),
        "placesRestantes": to_count(r.get("places_restantes")),
        "animatrices": to_list(r.get("animatrices")),
        "resume": clean_text(r.get("resume")),
        "description": clean_text(r.get("description")),
        "billets": r.tickets(),
        "image": {"src": image, "alt": title} if image else None,
        "gallery": gallery,
    }


def sort_key(event: dict) -> str:
    m = re.search(r"(\d{1,2})\s*[h:]\s*(\d{2})?", event.get("heureDebut") or "")
    clock = f"{int(m.group(1)):02d}:{m.group(2) or '00'}" if m else "00:00"
    return f"{event.get('dateDebut') or '9999-12-31'}T{clock}"


def main() -> int:
    mock = os.environ.get("MOCK_RECORDS")
    token = os.environ.get("GHL_FHA_TOKEN", "").strip()
    if mock:
        payload = json.loads(Path(mock).read_text(encoding="utf-8"))
        records = payload.get("records", payload if isinstance(payload, list) else [])
        labels = {norm(k): norm(v) for k, v in (payload.get("labels") or {}).items()} if isinstance(payload, dict) else {}
    else:
        if not token:
            print("GHL_FHA_TOKEN absent : rien a synchroniser. data/events.json n'est pas modifie.")
            return 0
        labels = fetch_schema_labels(token)
        records = fetch_records(token)
    print(f"{len(records)} enregistrement(s) lu(s).")

    events, slugs = [], set()
    for rec in records:
        ev = build_event(rec, labels, token or None)
        if not ev:
            continue
        base, n = ev["slug"], 2
        while ev["slug"] in slugs:
            ev["slug"] = f"{base}-{n}"
            n += 1
        slugs.add(ev["slug"])
        events.append(ev)
    events.sort(key=sort_key)

    # Nettoyer les dossiers d'images des activites retirees.
    if IMG_DIR.exists():
        for d in IMG_DIR.iterdir():
            if d.is_dir() and d.name not in slugs:
                shutil.rmtree(d)

    print("Bilan : " + ", ".join(f"{k}={v}" for k, v in STATS.items()) + f", publies={len(events)}")

    out = {"source": OBJECT_KEY, "count": len(events), "events": events}
    text = json.dumps(out, ensure_ascii=False, indent=2) + "\n"
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    if OUT_JSON.exists() and OUT_JSON.read_text(encoding="utf-8") == text:
        print("Aucun changement.")
    else:
        OUT_JSON.write_text(text, encoding="utf-8")
        print(f"{len(events)} activite(s) publiee(s) dans data/events.json.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
