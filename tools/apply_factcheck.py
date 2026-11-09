#!/usr/bin/env python3
"""Apply fact-check decisions to kit/facts.yaml.
    python3 tools/apply_factcheck.py DECISIONS --by "J. Sullivan" [--write] [--facts kit/facts.yaml]
DECISIONS is a folder of <fact_id>.json files (saved from the review page's database) or one JSON file {fact_id: decision}.
Each decision: {status: ok|fix|cant, sources: [{work, ref}], note}.
  ok   -> verified: true, checked_by, checked_on, citation as edited
  fix  -> citation updated; verified: true only if the citation was changed (the checker found the right passage);
          otherwise verified stays false and the note is kept
  cant -> verified stays false; note records that the passage was not found
Without --write it only prints what would change."""
import argparse, datetime, json, pathlib, yaml
ap = argparse.ArgumentParser()
ap.add_argument("decisions"); ap.add_argument("--by", required=True); ap.add_argument("--write", action="store_true")
ap.add_argument("--facts", default=str(pathlib.Path(__file__).resolve().parent.parent / "kit/facts.yaml"))
a = ap.parse_args()
src = pathlib.Path(a.decisions)
if src.is_dir():
    dec = {}
    for p in sorted(src.rglob("*.json")):
        d = json.loads(p.read_text(encoding="utf-8")); dec[p.stem] = d.get("data", d)
else:
    dec = json.loads(src.read_text(encoding="utf-8"))
path = pathlib.Path(a.facts)
facts = yaml.safe_load(path.read_text(encoding="utf-8"))
today = datetime.date.today().isoformat(); n = 0
for f in facts:
    d = dec.get(f["id"])
    if not d or not d.get("status"): continue
    old = [(s["work"], s["ref"]) for s in f["sources"]]
    new = [{"type": "primary", "work": s["work"], "ref": s["ref"]} for s in d.get("sources", []) if s.get("work") or s.get("ref")]
    changed = bool(new) and [(s["work"], s["ref"]) for s in new] != old
    if new:   # keep the original source type where the work is unchanged
        types = {(s["work"]): s["type"] for s in f["sources"]}
        for s in new: s["type"] = types.get(s["work"], s["type"])
        f["sources"] = new
    note = (d.get("note") or "").strip()
    if d["status"] == "ok" or (d["status"] == "fix" and changed):
        f["verified"], f["checked_by"], f["checked_on"] = True, a.by, today
        if note: f["note"] = (f["note"] + " | " if f["note"] else "") + f"{a.by}: {note}"
    elif d["status"] == "fix":
        f["note"] = (f["note"] + " | " if f["note"] else "") + f"{a.by} flagged: {note or 'needs a fix'}"
    elif d["status"] == "cant":
        f["note"] = (f["note"] + " | " if f["note"] else "") + f"{a.by} could not find the passage" + (f": {note}" if note else "")
    n += 1
    print(f"{f['id']}: {d['status']}" + (" (citation changed)" if changed else "") + f" -> verified={f['verified']}")
print(f"{n} decisions applied" + ("" if a.write else " (dry run, nothing written; add --write)"))
if a.write:
    path.write_text("# Fact map. No fact ships without a source. verified stays false until a person has read the passage.\n"
                    + yaml.safe_dump(facts, allow_unicode=True, sort_keys=False, width=1000), encoding="utf-8")
