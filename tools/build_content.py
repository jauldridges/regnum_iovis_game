#!/usr/bin/env python3
"""Turn content/latin.yaml into content/latin.js (works when opened from a folder)."""
import json, pathlib, yaml
root = pathlib.Path(__file__).resolve().parent.parent
entries = yaml.safe_load((root / "content/latin.yaml").read_text(encoding="utf-8"))
ids = [e["id"] for e in entries]
assert len(ids) == len(set(ids)), "duplicate ids"
for e in entries:
    assert e["review_status"] in ("draft", "approved"), e["id"]
for e in entries:
    if e["type"] == "card_question":
        assert 0 <= e["answer"] < len(e["choices"]) == len(e["en_choices"]), e["id"]
(root / "content/latin.js").write_text(
    "window.CONTENT = " + json.dumps(entries, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print(f"{len(entries)} entries -> content/latin.js")
