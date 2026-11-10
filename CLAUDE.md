# Rēgnum Iovis
Read regnum-iovis-design.md before doing anything. It is the plan.
Rules: keep it simple (plain browser game, no heavy tools without asking). All Latin lives in content/latin.yaml, never in code.
Every content entry has review_status draft or approved; students see only approved. Every fact has a source in kit/facts.yaml;
nothing is "verified" until a person has read the passage. Build one step at a time and stop after each. Explain how to run and
test in plain language. Commit and push to the task branch after each change; open a pull request only when asked.
This repo is PRIVATE and paid. Never copy its content into a public repo.

Fact checking runs on the side. The review page is a private Artifact (https://claude.ai/artifact/E2ZBZ4XUhbaqnh5khr68aG); decisions
live in its database. At the start of each step read them (ArtifactData list, collection "decisions") and apply them with
tools/apply_factcheck.py. After adding or changing any fact in kit/facts.yaml, run tools/build_factcheck_page.py and republish the
same file (build/factcheck.html) to the same URL; the page marks new claims, and saved decisions survive republishing.
