#!/usr/bin/env python3
"""Check kit/facts.yaml against content/latin.yaml.
Errors (exit 1): a fact points at a content id that does not exist, or a verified fact has no checked_by/checked_on.
Reports: unverified facts, and lib_* pages that no fact covers.   Run: python3 tools/check_facts.py"""
import pathlib, sys, yaml
root = pathlib.Path(__file__).resolve().parent.parent
facts = yaml.safe_load((root / "kit/facts.yaml").read_text(encoding="utf-8"))
ids = {e["id"] for e in yaml.safe_load((root / "content/latin.yaml").read_text(encoding="utf-8"))}
bad = []
for f in facts:
    for g in f["game"]:
        if g not in ids: bad.append(f"{f['id']}: unknown content id {g}")
    if f["verified"] and not (f["checked_by"] and f["checked_on"]): bad.append(f"{f['id']}: verified but no checked_by/checked_on")
covered = {g for f in facts for g in f["game"]}
pages = sorted(i for i in ids if i.startswith("lib_") and not i.endswith("_q") and i != "lib_title")
print(f"{len(facts)} facts, {sum(f['verified'] for f in facts)} verified, {sum(not f['verified'] for f in facts)} still to verify")
print("pages with no fact:", [p for p in pages if p not in covered] or "none")
for b in bad: print("ERROR", b)
sys.exit(1 if bad else 0)
