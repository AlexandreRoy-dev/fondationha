#!/usr/bin/env python3
"""TEMPORAIRE : affiche le schema (cles, libelles, types, options) et la forme
des enregistrements, sans valeurs personnelles. A retirer avant fusion."""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import sync_events as s

token = os.environ["GHL_FHA_TOKEN"].strip()
data = s.api_request("GET", f"/objects/{s.OBJECT_KEY}", token, params=f"?locationId={s.LOCATION_ID}&fetchProperties=true")
obj = data.get("object") or {}
print("OBJET:", obj.get("key"), "|", (obj.get("labels") or {}))
fields = data.get("fields") or obj.get("fields") or []
print(f"CHAMPS ({len(fields)}):")
for f in sorted(fields, key=lambda x: str(x.get("fieldKey"))):
    opts = f.get("options") or []
    o = [f"{x.get('key')}={x.get('label')}" for x in opts if isinstance(x, dict)]
    extra = {k: f.get(k) for k in ("maxFileLimit", "allowCustomOption", "isMultipleFile") if k in f}
    print(f"  {f.get('fieldKey')} | {f.get('name')} | {f.get('dataType')}" + (f" | options: {o}" if o else "") + (f" | {extra}" if extra else ""))

recs = s.fetch_records(token)
print(f"ENREGISTREMENTS: {len(recs)}")
safe_keys = ("publier", "statut", "categorie", "type", "status")
for i, r in enumerate(recs, 1):
    props = r.get("properties") or {}
    print(f"  #{i} cles hors properties: {sorted(k for k in r if k != 'properties')}")
    for k in sorted(props):
        v = props[k]
        suffix = k.split(".")[-1]
        if any(t in suffix for t in safe_keys):
            shown = v
        elif isinstance(v, list):
            shown = f"list[{len(v)}] " + (json.dumps({kk: type(vv).__name__ for kk, vv in v[0].items()}) if v and isinstance(v[0], dict) else (type(v[0]).__name__ if v else ""))
            if v and isinstance(v[0], dict) and isinstance(v[0].get("url"), str):
                shown += " host=" + v[0]["url"].split("/")[2]
        elif isinstance(v, dict):
            shown = "dict " + json.dumps({kk: type(vv).__name__ for kk, vv in v.items()})[:200]
        else:
            shown = type(v).__name__
        print(f"     {k}: {shown}")
