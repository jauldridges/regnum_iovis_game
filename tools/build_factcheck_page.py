#!/usr/bin/env python3
"""Build the fact-check review page from kit/facts.yaml and content/latin.yaml.
    python3 tools/build_factcheck_page.py [--out build/factcheck.html]
Publish the result as an Artifact. Each card shows one claim with its citation (editable), a Find passage link,
the game lines that make the claim, and three buttons. Riskiest claims come first."""
import argparse, json, pathlib, yaml
root = pathlib.Path(__file__).resolve().parent.parent
ap = argparse.ArgumentParser(); ap.add_argument("--out", default=str(root / "build/factcheck.html")); a = ap.parse_args()
facts = yaml.safe_load((root / "kit/facts.yaml").read_text(encoding="utf-8"))
content = {e["id"]: e for e in yaml.safe_load((root / "content/latin.yaml").read_text(encoding="utf-8"))}
rank = {"low": 0, "medium": 1, "high": 2}
def key(f): return (f["kind"] == "gameplay", rank.get(f["confidence"], 1), not f.get("note"), f["id"])   # risky first, gameplay last
out = []
for f in sorted(facts, key=key):
    lines = []
    for g in f["game"]:
        e = content.get(g)
        if e and e["type"] != "card_question": lines.append({"id": g, "en": e["english"].replace("\n", " / "), "la": e["latin"]})
    out.append({"id": f["id"], "claim": f["claim"], "kind": f["kind"], "confidence": f["confidence"], "note": f.get("note", ""),
                "sources": [{"work": s["work"], "ref": s["ref"], "type": s["type"]} for s in f["sources"]], "lines": lines[:4]})
tpl = (root / "tools/factcheck_template.html").read_text(encoding="utf-8")
data = json.dumps(out, ensure_ascii=False).replace("</", "<\\/")
pathlib.Path(a.out).parent.mkdir(parents=True, exist_ok=True)
pathlib.Path(a.out).write_text(tpl.replace("/*FACTS_JSON*/", data), encoding="utf-8")
print(f"{len(out)} facts -> {a.out}")
