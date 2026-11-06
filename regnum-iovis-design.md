# Rēgnum Iovis — Design Document (v2)

*The Reign of Jupiter: a Pokémon-style Latin game for Unit 2*

> **What is new in v2.** Part I (§1–§12) is your original game design, with a few notes marked **(v2)**. Part II (§13–§23) adds everything worked out while building and classroom-testing Condenda Rōma and deciding how to sell: the **classroom kit (teacher guide, sub plan, student PDF)** that ships with every game, the **fact map and primary-source bibliography**, how to **fit a 50/30/90-minute class**, what to do about **students not reading**, **score and finale**, **selling and the TPT AI ban**, **repos, hosting and licensing**, the **build order** and the **open decisions**. The appendices give a starter `CLAUDE.md`, a summary of Game 1 and the list of claims that need sources.

## 1. Summary

The player is Jupiter, from his hidden infancy on Crete to his victory over Saturn. Along the way he gathers allies: his swallowed siblings, the monsters Saturn imprisoned, and a few helpers and turncoat Titans. With them he wins the war for the sky. The story mostly follows Hesiod's *Theogony*, with Roman names and a short Roman ending: Saturn flees to Latium, a golden age begins, and Rome remembers him.

| | |
|---|---|
| Length | 30–40 minutes, one sitting |
| Device | School Chromebooks (touchscreen and keyboard) |
| Versions | Latin and English, chosen on the title screen |
| Saving | None. Each play starts fresh. (v2: see §14 for how this fits a 50-minute class.) |
| Audience | Latin I (Latin version); social studies classes of all ages (English version) |
| Structure | Linear chapters, each with a small area to explore |
| Use | Review. All target grammar appears mixed throughout. |
| Product (v2) | The game link plus a paid classroom kit (teacher guide, sub plan, student PDF); two kits, Latin and History/Social Studies. See §13. |
| Class fit (v2) | Plans for 50 minutes (main), 30 and 90. See §14. |
| Privacy (v2) | Nothing about students is stored or sent. |

## 2. Learning goals

Students learn by playing. The game never explains or names any grammar. The Latin is comprehensible input: short sentences whose meaning is made clear by what happens on screen.

**Grammar that recurs naturally**
- **Genitive.** Possession and family are everywhere: *fulmen Iovis*, *tridēns Neptūnī*, *fīlius Saturnī et Opis*, *custōdēs Saturnī*. Every collection book entry states parentage in the genitive.
- **Dative.** The story runs on giving: Ops gives Saturn the stone, Jupiter gives Saturn the drink, the Cyclopes give the gods their weapons, Ceres gives the allies grain. Many overworld choices are choices about whom to give something to.
- **Third declension.** Most of the cast is third declension (*Iuppiter, Iovis*; *Cerēs, Cereris*; *Plūtō, Plūtōnis*; *Titān, Titānis*; *Ops, Opis*), and so are many key nouns (*fulmen*, *nūbēs*, *mōns*, *rēx*, *tridēns*).

**Culture**
- Roman names of the gods and Titans, with the Greek names alongside
- The succession story: Caelus → Saturn → Jupiter
- Each god's domain and symbol
- Rome's public life: each god's place in the city of Rome (see §7)
- A short foreshadowing of Juno's hostility to Carthage and the Punic Wars

Every collection entry, battle move, and scene is tagged with its NLE Level I category (mythology, grammar feature, or Roman life). Results can later be shared with the practice app. **(v2 flag:** this conflicts with "nothing stored or sent" and needs its own privacy design first; see §23.)

## 3. Story and chapters

Each chapter is a linear path through scenes, with one small area to explore (objects to inspect, people to talk to, one or two optional battles) and one main battle or story choice at the end.

Target times total about 37 minutes.

### Prologue — Caelus et Terra (3 min)
A storybook scene with narration and simple choices. The player does not move around yet.
- Chaos, then Terra, then Caelus. Their children are the Titans, the Cyclopes, and the Hundred-Handers.
- Caelus fears his children and shuts some of them under the earth. Terra is angry and gives Saturn a sickle.
- **Softened:** Saturn defeats his father off screen (the screen fades to black and the sound of thunder plays). Saturn is now king.
- A prophecy: one of Saturn's sons will overthrow him.

Key lines:
- *Prīmō erat Chaos. Ex Chaō orta est Terra.*
- *Terra īrāta fīliō suō Saturnō falcem dat.*
- *Saturnus patrem vincit. Nunc Saturnus rēx est.*
- *"Fīlius tuus tē vincet."*

### Chapter 1 — Saturn's Hall (4 min)
The player controls **Ops**, Saturn's wife.
- **Softened:** Saturn swallows each newborn child whole in one cartoon gulp. The children appear inside him as five small glowing lights, safe and waiting.
- Ops hides the newest baby, Jupiter. Saturn comes for him.
- **Key choice:** Ops must hand Saturn something. The options are a stone wrapped in a blanket, or the baby. Choosing correctly shows the scene *Ops saxum Saturnō dat. Saturnus saxum dēvorat!* Choosing the baby triggers the story consequence: Saturn reaches for the cradle, Ops snatches it back, and the choice comes around again.
- Exploration: Saturn's hall. Inspect the throne (*sella Saturnī*) and the sickle on the wall (*falx Saturnī*), and talk to a servant who warns Ops.

### Chapter 2 — Crete (7 min)
The player now controls young **Jupiter** in a cave on Mount Ida.
- Recruit **Amalthea**, the goat. *Capella ēsurit.* The player must feed her (*capellae herbam dā*). In return, she nurses Jupiter and becomes a healer.
- Recruit the **Curetes**. Saturn's guards are searching the island, and baby Jupiter's crying could give him away. The Curetes clash their shields to cover the noise.
- First battles: Saturn's guards (*custōdēs Saturnī*) patrol the hillside. They are weak practice opponents who run away when beaten (*fugit*).
- Jupiter learns his first moves: thunder (*Tonā!*) and cover in clouds (*Nūbibus tē tege!*).

### Chapter 3 — Metis and the Drink (7 min)
Jupiter, now grown, goes to the edge of Ocean.
- Recruit **Metis**, the wise goddess (*Mētis dea sapiēns est*). She gives Jupiter a drug: *Mētis Iovī medicāmentum dat.*
- Jupiter disguises himself as Saturn's cupbearer. **Key choice:** whom to give the cup to. The right answer: *Iuppiter Saturnō pōculum dat.*
- Saturn drinks and brings everything up. First comes the stone (the collection book notes that it was later set up at Delphi). Then the siblings come out in reverse order: **Neptune, Pluto, Juno, Ceres, Vesta**. All five join the party.
- Saturn wakes in a rage, and the war begins.
- Exploration: Saturn's hall again, now with more guards, and an optional battle.

### Chapter 4 — Tartarus (7 min)
The gods go down under the earth to free the prisoners.
- Boss: **Campē**, the jailer of Tartarus (*Campē custōs Tartarī est*).
- Free the **Cyclopes** (Brontes, Steropes, Arges), and they forge the gods' weapons. This is the key sentence of the chapter:
  *Cyclōpēs Iovī fulmen, Neptūnō tridentem, Plūtōnī galeam dant.*
- Jupiter learns *Fulmen iace!* Neptune and Pluto each gain a weapon move.
- Free the **Hundred-Handers** (*Centimanī*: Briareus, Cottus, Gyges). They join as one unit.
- Exploration: the dark halls of Tartarus. Chains (*catēnae*), locked gates, and inscriptions that hint how to get through.

### Chapter 5 — The War (Titānomachia) (7 min)
Mount Olympus against Mount Othrys.
- Mid-chapter, two Titans switch sides: **Prometheus** and **Themis** (*Promētheus Titān est, sed Iovī auxilium dat*).
- **Styx** arrives first of all the allies and brings **Victoria**.
- Boss battles in order: **Hyperion** → **Iapetus** → **Atlas** (general of the Titans) → **Saturn**.
- Final battle: *Iuppiter fulmen iacit. Saturnus cadit.*
- Aftermath: the Titans go to Tartarus, with the Hundred-Handers as their guards. Atlas holds up the sky: *Atlās caelum umerīs portat.*

### Epilogue — Latium (2 min)
Narrated scenes; no more battles.
- The brothers draw lots: *Iuppiter caelum, Neptūnus mare, Plūtō rēgnum īnferōrum habet.*
- Saturn flees to Italy and hides: *Saturnus in Latium fugit et ibi latet.* (The collection book notes that *Latium* is linked to *latēre*.)
- Saturn teaches farming, and a golden age begins. In Rome, his temple holds the treasury (*aerārium*), and every December the Saturnalia remembers him.
- Final scene: Juno looks out across the sea at a coast where a city will one day stand. *Ibi Carthāgō erit.* Fade out.

## 4. The party

### Main party: the siblings (battle)
Jupiter plus up to three siblings fight in battle. The player can swap them in the collection book between battles.

### Monster allies: power-ups
The Cyclopes and Hundred-Handers do not take turns in battle. Each can be called once per battle as a special move.

### Helpers: support
Amalthea, the Curetes, Metis, Prometheus, Themis, and Victoria each give one support ability, usable in battle or while exploring.

### Move list (draft)

Commands are short Latin imperatives. The animation shows what each one means.

| Character | Move | Effect on screen |
|---|---|---|
| Iuppiter | *Tonā!* | Thunder rolls; enemy stunned |
| | *Nūbibus tē tege!* | Clouds surround Jupiter; shield |
| | *Fulmen iace!* (Ch. 4) | Lightning strike; heavy damage |
| | *Aquilam vocā!* | Eagle swoops on the enemy |
| Neptūnus | *Tridente percute!* | Trident strike |
| | *Undās excitā!* | Wave hits all enemies |
| | *Terram movē!* | Earthquake |
| Plūtō | *Galeam indue!* | Turns invisible; dodges the next attack |
| | *Umbrās vocā!* | Shades rise and slow the enemy |
| Iūnō | *Hostēs terrē!* | Enemy weakened |
| | *Rēgīnae pārē!* | Ally strengthened |
| Cerēs | *Sociīs frūgēs dā!* | Grain falls; heals all allies |
| | *Agrōs serē!* | Vines hold the enemy in place |
| Vesta | *Flammā fovē!* | Warm fire; heals one ally |
| | *Ignem accende!* | Fire damage |
| Cyclōpēs | *Malleō percute!* | Hammer blow (once per battle) |
| Centimanī | *Centum saxa iace!* | Hundred-rock barrage (once per battle) |
| Amalthēa | *Iovī lac dā!* | Heals Jupiter |
| Cūrētēs | *Scūta pulsā!* | Clash shields; escape a battle |
| Mētis | *Cōnsilium dā!* | Reveals the enemy's weakness |
| Promētheus | *Ignem fer!* | Gives an ally fire power |
| Themis | *Lēgem dīc!* | Cancels the enemy's next move |
| Victōria | *Iovī victōriam dā!* | Final-battle power-up |

**The battle log** narrates each turn in the third person and is where most genitive and dative input happens: *Fulmen Iovis Hyperīonem ferit. Cerēs sociīs frūgēs dat. Atlās montem iacit.*

**Enemy moves** are also narrated: *Saturnus falcem vibrat. Hyperīōn lūcem iacit. Iapetus hastam iacit.*

### Kinds of power
A simple advantage chart, shown with icons only:
- **Caelum** (sky): Jupiter, Juno
- **Mare** (sea): Neptune
- **Īnferī** (underworld): Pluto
- **Terra** (earth): Ceres, the Titans
- **Ignis** (fire): Vesta, Prometheus

Sky beats Earth, Earth beats Sea, Sea beats Fire, Fire beats Underworld, Underworld beats Sky.

## 5. Battle rules

- Turn-based. The player taps a command button, and the animation plays.
- There is no time pressure.
- **Latin version:** buttons show Latin only. The meaning comes from the animation.
- **English version:** buttons show English, with the Latin underneath as a small label.
- Healing comes from the helpers (Amalthea, Ceres, Vesta) and from items found while exploring.

### Losing: story consequences
The game never shows a "game over" screen. Losing changes the story.
- **Before Chapter 3:** Saturn's guards find the cave. The Curetes carry Jupiter to a new hiding place (a short scene), and the battle starts again.
- **Chapter 3 onward:** Saturn swallows the most recently recruited sibling again (cartoon gulp). Jupiter must do a short rescue: find Metis's drink in the area and choose correctly whom to give it to (*Saturnō pōculum dā*). The sibling returns and the battle starts again.

Wrong choices while exploring also lead to small story consequences, such as Amalthea wandering off, Saturn hearing the baby cry, or a guard taking an item.

## 6. Exploring

- **Objects** carry short Latin descriptions or inscriptions: *Haec est sella Saturnī. Hīc dormit capella.*
- **People** speak short Latin lines. The player answers by choosing from 2–3 options. Understanding the Latin leads to the good outcome.
- **Glōria** (points) are earned for good choices, battles won, objects inspected, and allies recruited. The total is shown at the end.
- Each chapter's area is small (about two screens) and has a clear exit to the next scene.

## 7. Collection book — *Liber Deōrum*

Every recruited character and every boss gets a page. A sample page:

> **Iuppiter, Iovis**
> *Graecē:* Zeus
> *Familia:* fīlius Saturnī et Opis
> *Rēgnum:* caelum
> *Signum:* fulmen, aquila
> *Rōmae:* Templum Iovis in Capitōliō stat. Triumphī ad hoc templum veniunt.

**The *Rōmae* line** ties each god to Roman public life. Planned lines:
- **Iuppiter:** the Capitoline temple, where triumphs end.
- **Iūnō:** Juno Moneta, the mint, and the sacred geese of the Capitol.
- **Vesta:** the eternal flame and the Vestal Virgins.
- **Cerēs:** the Aventine temple, a center for the plebeians.
- **Saturnus:** the temple that holds the treasury (*aerārium*), and the Saturnalia.
- **Neptūnus:** the Neptunalia, in high summer.

Pages for the Titans and monsters give parentage and a fact about each (for example, Atlas holding the sky, or Briareus's hundred hands).

## 8. Latin rules

- Macrons on all Latin.
- Vocabulary: DCC core words the class has had. New words are glossed (underlined; tap or hover to see the gloss), except in battle commands, where the animation carries the meaning.
- Present tense by default. Perfect tense only for a few key story lines, glossed.
- Sentences of 3–8 words. One new idea per line.
- Names keep their Roman forms. Greek names appear only on collection book pages, and in the English version at a character's first appearance (for example, "Saturn (Kronos)").
- Latin status: draft; all Latin is reviewed by the teacher before use with students. **(v2:** the `review_status` of `draft` or `approved` on every content entry enforces this; students see only `approved` lines.)
- **(v2)** In the Latin version, key information appears only in Latin; English appears on hover or in the finale review. See §16.

## 9. English version

- The same game, scenes, and choices, with all text in English.
- Roman names are used throughout, with the Greek name in parentheses at first appearance and on every collection page.
- Command buttons show English, with the Latin as a small label underneath.
- Suitable for grade 4 and up. All content is kept within the softened treatment in §3.

## 10. Look and build

- **Style:** top-down pixel art in the style of early Pokémon. Small tiled maps, chunky characters, side-view battle screens with simple animations (lightning, waves, clouds, fire).
- **Art is drawn by the game itself** from small pixel patterns, so there are no image files to manage or license. **(v2 flag:** code-drawn art made with AI help may be treated as AI-generated art by some marketplaces; see §18 and §23.)
- **Simple sound effects** (thunder, waves, shield clash), with a mute button.
- **One self-contained web page** that runs in Chrome on a Chromebook, including offline once loaded. Hosted separately from the practice app.
- Works with both touch and keyboard. Large tap targets. A text-size option.
- **Start screen:** choose Latin or English.
- **End screen:** glōria total, number of allies collected, and a short recap of the story. The screen is easy for a teacher to check at a glance or screenshot. Nothing is saved.

## 11. End screen recap (draft)

*Iuppiter Saturnum vīcit. Nunc Iuppiter rēx deōrum est.*
*Sociī tuī: [number]. Glōria tua: [number].*

## 12. Sources

- Hesiod, *Theogony* 116–210 (Chaos, Earth and Sky, the overthrow of Ouranos), 453–506 (Kronos swallows his children; the stone; the Cyclopes freed), 617–735 (the Hundred-Handers and the Titanomachy)
- Apollodorus, *Library* 1.1–1.2 (Metis's drug, Campe, the weapons of the Cyclopes, the lots)
- Callimachus, *Hymn to Zeus* (Amalthea and the Curetes)
- Homer, *Iliad* 15.187–193 (the three brothers draw lots)
- Ovid, *Fasti* 1.233–238 (Saturn in Latium; *Latium* from *latēre*), 4.197–214 (the swallowing and the Curetes), 5.111–128 (Amalthea)
- Vergil, *Aeneid* 8.319–327 (Saturn's golden age in Latium), 1.12–22 (Juno's love for Carthage)

---

# Part II: Product, process and lessons (new in v2)

*Everything below was worked out while building and classroom-testing Condenda Rōma (Game 1), and while deciding how to sell this game and the ones after it. Part I (§1–§12) is the game design. Part II is how we make it a product, how we make it fit a classroom, and how we build it without repeating Game 1's mistakes.*

## 13. The product: a game plus a classroom kit

Every game we make ships as **two things**: the game (a link) and a **classroom kit** (PDFs) that makes it easy to teach with. A teacher should be able to hand the kit to a substitute and the lesson runs itself.

**Two kits per game**
- **Latin kit** for Latin teachers. Latin version of the game, NLE Level I tagging, grammar and vocabulary tables, ACTFL alignment.
- **History / Social Studies kit** for history and social studies teachers. English version of the game, aligned to Common Core literacy standards for history and social studies and to the C3 Framework, with a source-analysis focus. (Both kits use the same game; only the entry page and the PDFs differ.)

Each kit has a **teacher guide PDF** and a **student PDF**, in a plain **classroom-handout style** (printable, black-and-white friendly), not a glossy brochure.

**Teacher guide contents**
1. **Quick start (1 page):** time needed, level, tech needs (Chromebook, link, sound on), a 5-minute prep checklist, and a plain statement that the game collects, stores and sends no student data.
2. **Learning target and aim:** "I can…" statements, essential question, success criteria, and a table of the vocabulary and grammar practiced (generated from the `spec_node_id` tags on each content entry).
3. **Standards alignment:** ACTFL World-Readiness Standards; NLE Level I categories; Common Core literacy standards for history and social studies (and C3 for the Social Studies kit). Exact standard codes are checked by a person before release.
4. **Timed lesson plan** with Do Now, anticipatory set or mini-lesson, game play, check for understanding, discussion, exit ticket and extension. Written for three schedules: **50 minutes (the main version)**, **30 minutes (shortened day)** and **90 minutes (block)**. See §14.
5. **Teacher script:** word-for-word lines for each stage, plus likely student questions with answers.
6. **Substitute plan:** a one-page version that needs no Latin or history knowledge. Step-by-step, what to collect at the end, what to do if the game will not load.
7. **Differentiation and accommodations:** supports, challenges, read-aloud and extra-time options.
8. **Assessment:** rubric, exit ticket, answer keys (card questions, final check), and how to read the finale screen (score bands and ranks).
9. **Background and primary-source bibliography:** the story and every fact in the game with its source passage (see §15).
10. **Tech help, license and credits.**

**Student PDF contents:** Do Now; word list of the Latin commands and key words; a play log to fill in while playing; a short primary-source reading with questions; exit ticket and reflection; optional extension tasks; a certificate.

**How the PDFs are made.** Each game has a `kit/` folder of plain-text data files (lesson plan parts, standards, facts and sources). A tool turns them into PDFs through headless Chromium (HTML to PDF), with the same look for every game. Anything that can be derived from the game's content (vocabulary tables, answer keys, the bibliography, the grammar table) is generated from the content files, so the PDFs can never disagree with the game.

**Who writes the kit text.** This is a per-platform decision (see §18). On a marketplace that bans AI-generated text, the teacher writes the kit text and Claude builds only tools (layout code, source checker, answer-key generator). On the teacher's own site, Claude may draft kit text that the teacher edits and verifies, and the product says so openly.

## 14. Fitting a class period

Typical periods are **50 minutes**; shortened schedules are **30**; block periods are occasionally **90**.

The game is 30–40 minutes with no saving. In a 50-minute period that leaves almost no room for a Do Now, set-up and exit ticket, and on a 30-minute day the game cannot be finished at all. Problem to solve before building:

| Option | How it works | Saves any data? |
|---|---|---|
| **A. Chapter select** (recommended) | The title screen lets the teacher (or a link) start at a chapter, so the teacher assigns "today: Prologue to Chapter 2". | No |
| **B. Resume code** | At the end of a session the game shows a short code that encodes the chapter and party. The student types it next day. | No (the code lives on paper) |
| **C. One sitting only** | Keep as designed; use the 90-minute plan or two days. | No |

Suggested sessions if we use A or B: **Session 1** Prologue to Chapter 2 (~14 min), **Session 2** Chapters 3–4 (~14 min), **Session 3** Chapter 5 and Epilogue (~9 min). A 50-minute period then holds one session plus a Do Now (5 min), set-up (3 min), exit ticket (7 min) and discussion (10 min), with slack for logging in.

*Open decision:* A, B or both. The default in §1 ("Saving: None") stays true either way.

## 15. Facts and sources

**Rule: no fact ships without a source.** Every factual claim the game makes (in the story text, the collection book, the Rōmae lines, the card questions, the English text) is listed in a **fact map** with a source passage. The teacher guide's bibliography is generated from it.

**File:** `kit/facts.yaml` in the game's folder. One entry per claim:

```yaml
- id: kronos_swallowed_children          # short name
  claim: Saturn swallowed his children as soon as they were born.
  game: [lib_saturnus, ch1_scene_hall]   # where it appears (content entry ids)
  kind: tradition                        # tradition | archaeology | language | etymology | date | scholarship | gameplay
  sources:
    - { type: primary, work: Hesiod, ref: "Theogony 453-491" }
    - { type: secondary, work: "…", ref: "…" }
  confidence: medium                     # how sure Claude is of the citation (it cites from memory)
  verified: false                        # becomes true only when a person has read the passage
  checked_by: ""                         # e.g. J. Sullivan
  checked_on: ""                         # date
  note: "versions that differ, wording to watch"
```

**Kinds.** `gameplay` marks a rule of the game that is not history (for example, the type-advantage chart). `tradition` means "what the ancient sources say happened", which is not the same as history. `scholarship` and `archaeology` need a modern source. The student PDF and the teacher guide label each fact so teachers can separate legend from evidence.

**Versions of a story.** When ancient sources disagree, record that in the `note` (in Game 1, Livy has Romulus kill Remus in anger; Plutarch and Dionysius have a man named Celer do it). The teacher guide gets a "versions of the story" box.

**Translations.** Quote or link older public-domain translations (for example those on Perseus) and check each one's reuse terms. Modern Loeb translations are copyrighted.

**Checking workflow (used for Game 1).**
1. Claude lists every claim in the game and drafts candidate citations **from memory**, each with a confidence rating, `verified: false`. Claude cannot open Perseus from its working environment, so a person must read the passage.
2. Claude builds a **review page** (`tools/build_factcheck_page.py` fills `tools/factcheck_template.html`, published as an Artifact). It shows one card per claim with the claim in large type, the citation (editable), a **Find passage** button that opens a search for that citation, and three buttons: **Looks right**, **Fix it**, **Can't find it**. Decisions save automatically.
3. The teacher says "done". Claude reads the saved decisions, updates `facts.yaml` (`verified`, corrected citations, notes) and, if the teacher asks, edits the card wording to match.
4. A check fails the build if any approved content entry has a fact with `verified: false`. (To add when the kit tooling is built.)

**Status in Game 1:** 8 claims on the Romulus and Remus card verified; 5 pōmerium claims pending; 8 more cards to do.

**Sources already listed for this game** are in §12. Each citation there becomes a fact-map entry and must be verified before release. Claims in Part I that need a source of their own are listed in **Appendix C**.

## 16. Making students read: lessons from the first classroom test

Game 1 was played by students on Chromebooks. What we saw, and what we will do here:

| What happened | What we do in this game |
|---|---|
| Students clicked through history cards without reading ("their gut impulse is not to read"). | Every text card, collection-book page and story panel **waits 3 seconds** before Continue works (a countdown shows on the button; Enter and Space do nothing during it). |
| Optional history had no reward. | **A question follows each card or collection page.** A right answer earns points and a small in-game gift; a wrong answer sends the student back to re-read the text and ask again for half the points; a second miss shows the right answer and play goes on. Questions are drafted as `draft` and a teacher approves them before students see any. |
| Some students pressed "Play again" by accident because they did not know the game had ended. | The end is a full **finale screen** (see §17), and **Play again asks "Start over? Your score will be lost."** before doing anything. |
| Students minimised the bottom bar and it stuck at the small size when reopened, hiding buttons. | **Test every UI state**, including fold/unfold and resizing, at Chromebook size (1366×768). Keep a UI element's own height separate from any measured height. |
| A lot of reading time, not much doing. | Aim for most of the time spent **doing**, not reading. Text is short; the game explains nothing in grammar terms; the kit explains instead. |
| Clicking placed buildings when students wanted to select people. | Interaction modes must be obvious and cancellable. For this game: tap targets large, a clear cancel, no hidden modes. |
| Sprites overlapped each other and walked through walls and houses. | Use **tile collision from the start** (nothing overlaps, nothing walks through solid tiles, NPCs block). |
| Music was inaudible on laptop speakers at first. | Keep notes in a range laptop speakers can play (no very low bass); music starts only after the first click; always have a mute button; use two themes (calm and tense) and switch with the story. |
| Students could not catch the Latin in the overlay. | Show the Latin of a command above the cursor when hovering over what it applies to. |

Other rules carried over from Game 1:
- **Latin mode shows key information only in Latin**; English appears on hover or in the finale review, never in the way.
- **English mode is the same game in English** with the Latin as a small label under command buttons.
- **No scrolling the map by dragging or edge scrolling**; each area fits one screen. (This game's areas are about two screens; design them to fit one if possible, and never scroll when the cursor leaves the window.)
- **Hints for English readers are plain** (no Latin jargon).

## 17. Score, rank and the finale

Game 1 gives points, a rank and a big end screen. This game does the same, in Rēgnum Iovis's own terms.

**Points (Glōria).** Earned for: allies recruited, objects inspected, correct key choices, battles won, collection-book questions answered (full points first try, half after a retry), the final comprehension check (per right answer), and a **speed bonus** (counts only time spent playing, not time spent reading cards). All values live in one config block in the mission file so we can tune them after seeing real scores.

For reference, Game 1's numbers: house 30, wall piece 5, gate 20, forum 60; scroll 20; card question 50 (25 on retry) plus a small gift; wave 100; final-check question 100; speed bonus up to 500, falling to nothing after 15 minutes of play; "Congratulations!" at 1300 or more. These were first guesses, not tuned.

**Ranks.** A rank title rises as the player progresses, with a small reward at each step. Titles are Latin (in the content file) with English on hover.

**The finale.**
- Title "The End", then **Congratulations!** (at or above a goal score) or **Nice try!** (below it).
- The score **counts up** to the final number, then the player's **rank** (Latin title, English translation underneath), then a **breakdown** of where the points came from.
- A review of the final check (translation and right answer shown only now).
- **Play again** is a small button that asks for confirmation. If the score was under the goal the button says "Try again".
- Easy for a teacher to check at a glance or screenshot. **Nothing is stored or sent.**

**Leaderboard.** Not for now, because the game stores and sends nothing. Options if we want one later: (A) none; the student shows the finale screen; (B) the finale links to a teacher-made Google Form where students enter a name and score; (C) a per-computer top-5 saved in the browser only. Any shared leaderboard needs a privacy review first.

## 18. Selling the kit

**Goal.** Extra income, for now, from resources already made for and tested with the teacher's own students. A little marketing time is fine. If it takes off, follow it.

**Plan.**
1. **Latin kit first, on the teacher's own site, with Payhip.** Latin teachers are a small, community-reached audience; a marketplace's search traffic is not worth much to them. Payhip's own page says it takes about 5% per sale (check its current pricing page). No exclusivity rule, no marketplace AI rule.
2. **The game link stays free** as the sample. The paid product is the kit. (Check this against any marketplace's rules about free copies before listing there.)
3. **History / Social Studies kit later.** That is a far bigger market where a marketplace's traffic is worth more. Decide after the first kit sells.
4. **Marketing, lightly:** Latin teacher communities and lists, the American Classical League and regional classical associations, and a short post with a screenshot or clip, the free game link and the kit link. Use student feedback with names removed and only with permission.
5. **Start low on price** and adjust; the right price is unknown.

**What we learned about Teachers Pay Teachers (as of October 2026, from press and seller reports; re-check their official pages).**
- TPT announced it will **ban AI-generated resources** (text and images, including covers, thumbnails, previews and descriptions) and wants existing listings fixed. The written policy was still pending, and **"AI-generated" versus "AI-assisted" was not defined**. No disclosure scheme was reported.
- A new **Exclusive Seller** membership requires digital educational resources to be sold **only on TPT** (including anything that could be sold there). Reported terms: Exclusive pays 77.5% for $59.95 a year; Basic pays 55% for a one-time $29. Courses, professional development, Boom Cards and Kindle books are among the things that may be sold elsewhere. One guide says a resource free on your own site cannot be a paid product on TPT.
- TPT has a help page on resources **hosted on a third-party site** (a game is one); read it before listing there.

**What the AI ban means for us.** A lot of this project was made with AI: the game code, the pixel art drawn by code, the first drafts of the Latin and English text, and the portraits (made with an AI image tool from the prompts in `docs/PORTRAIT-PROMPTS.md`). Rules for ourselves:
- If a marketplace bans AI-generated text, **the teacher writes the kit text**; Claude builds tools only. We do not help hide AI use or evade detection.
- Screenshots of AI-made art in thumbnails or previews could count as AI images. Options: commission an artist, draw it by hand, or keep them out of listings.
- On our own site we may use AI-drafted text that the teacher edits and verifies, **and we tell buyers how it was made.**
- **Ask TPT directly** before relying on it: is AI-assisted code allowed; does a linked website count as part of the resource; do screenshots of AI-drawn art count; is disclosure required. Keep their written answer.

**Other sellers' platforms** (fees approximate, from vendor and affiliate blogs; verify): Payhip (about 5%, less on paid plans), Gumroad (about 10% plus $0.50 direct; 30% via its marketplace), Etsy (about 11–14% effective, broad audience, teacher resources compete with other printables), and teacher marketplaces such as Tes Resources, Made By Teachers and TeachBuySell. Direct school or department licenses are another route.

**Before listing anywhere:**
- Check your **district or school policy** on outside income and on selling materials made for your classes.
- **Taxes:** side income is taxable and sales-tax rules for digital goods vary. Ask a tax professional.
- **License the product clearly** (see §19). This is not legal advice.

## 19. Repos, hosting and licensing

- **Game 1 (Condenda Rōma):** public repo `jauldridges/build-rome-game`, hosted on GitHub Pages. Students' link is the `latin.html` page (Latin only, no choice); teachers who want the choice use `index.html`. License: **free for classroom use; no resale; no reuse of text, art or music in another product; no republishing modified versions.** The copyright holder line uses the GitHub username.
- **This game (and every paid game):** a **separate private repo**. Copy the shared parts in rather than depending on the Game 1 repo (§20). Never put paid content in the public repo: git history keeps it forever, even after deletion.
- **Hosting caveat.** GitHub Pages on a free account serves only public repos. Options: a static host that can serve a private repo (several do; check current terms), or publish only the built game files to a public place while the source stays private. Decide before launch.
- **Nothing in a browser game is secret.** Anyone who plays can view the code. Protection is the license, the quality of the content and kit, and support, not hiding code.
- **Two entry pages** in every game: `index.html` (title screen with the Latin/English choice, for other teachers) and `latin.html` (starts in Latin, ignores `?lang=en`, for the teacher's own students). A script (`tools/make_latin_page.sh`) rebuilds `latin.html` from `index.html`. For the History kit, a matching English-only page can be added the same way.
- **Privacy.** The game stores nothing and sends nothing (no logins, no analytics). Say so in the kit. Git commits show the author's email, so turn on GitHub's "Keep my email addresses private" before the first commit of a new repo.

## 20. How we build (carried over from Game 1)

**Rules (put these in the new repo's `CLAUDE.md`; see Appendix A):**
- Keep it simple: a plain browser game, no heavy tools without asking.
- **All Latin lives in the content file, never in code.**
- Build **one step at a time and stop after each**; explain in plain language how to run and test it.
- Every content entry has a `review_status` (`draft` or `approved`); students see only `approved` lines (a test mode, `?drafts=1`, shows drafts marked `[draft]`).
- Every fact has a source (§15).
- Commit and push after each change to a task branch; open a pull request only when asked; merge is the teacher's step.

**Stack.** Static HTML, Canvas and plain JavaScript; scripts share globals; a small `boot.js` loads one mission's content and then the engine scripts. Python is used only for build tools (`build_content.py` turns `content/latin.yaml` into `content/latin.js` so the page works when opened from a folder).

**Content entry (one per line of text)** — fields: `id`, `latin`, `english`, optional `en` / `en_title` / `en_status` for English-mode wording, `type` (vocab, order, message, culture_note, quiz_item, card_question, ui_label), `nle_category`, `spec_node_id` (from the Latin 1 spec file), `review_status`. Quiz and question entries add `question`, `choices`, `answer` (a number from 0). Draft entries never reach students.

**What to copy from Game 1 into the new repo**
- `boot.js`, the title screen and the Latin-only entry page script.
- The content pipeline: `build_content.py`, `export_review.py` (a spreadsheet of everything still to proofread), `coverage.py` (which spec nodes the game practices).
- `line()` (text lookup for Latin and English mode), the draft/approved rules.
- `sound.js` (chiptune effects, two switchable music themes, mute buttons).
- History cards with the 3-second pause and the question step; the closing check; `score.js`; the finale and the confirm-before-restart.
- The fact-check page tools (`build_factcheck_page.py`, template) and the kit PDF tool when built.
- The Playwright smoke test pattern (plays the whole game in a headless browser in both languages and checks the main moments) and the feature tests.

**What not to copy:** the strategy-game map, farmers and buildings, the wave and defense system, and the unit collision/pathfinding (this game is tile-based; use simple tile collision). Reuse the art-from-code approach only after the art-and-AI decision in §18 and §23.

**Testing.** A headless browser plays the game to the end and checks the key moments; run it before every push. Test at 1366×768. Ask real students to play and watch where they skip, click wrongly or get lost.

**Delivery workflow.** Work on a task branch; push; the teacher merges a pull request; GitHub Pages (or the chosen host) republishes within a couple of minutes; hard-refresh (Ctrl+Shift+R) to see the new version. A normal refresh may show an old saved copy.

## 21. Look and sound (additions to §10)

- Top-down pixel art for exploring, side-view for battles, as in §10. Anything that moves collides with solid tiles; characters never overlap.
- **Day/dusk lighting, shadows, small ambient animals and effects** made Game 1 feel alive; reuse the idea for a few ambient details per area.
- **Portraits** for speakers appear beside dialogue (Game 1 used painted portraits for the king and simple stand-ins for others). For this game, decide the art source (§23).
- **Music:** a calm theme for exploring and a tense theme for battles, switching when a battle begins and ending when it does. Keep notes in a range laptop speakers can play.
- **Names are original.** The style is "like early handheld creature-collecting games", but names, creatures and designs are our own.

## 22. Build order (one step at a time; stop after each)

0. **Set up the private repo.** Copy the shared parts (§20), write `CLAUDE.md`, put this design file in it, confirm the privacy settings (§19).
1. **A small tile map you can walk around** (keys and touch), with one NPC who speaks a line of Latin in a message box with the 3-second pause. Placeholder art.
2. **Inspecting objects and choosing** (Chapter 1's hall; Ops hides Jupiter; the stone-or-baby choice). First content entries drafted for proofreading.
3. **A battle screen with one move** (*Tonā!*), Latin buttons only, the battle log narrating in Latin.
4. **Party and the collection book** with the card-pause and question step.
5. **Score, rank and the finale** (including the confirm-before-restart).
6. **Chapters 1–3 complete;** play it with a few students.
7. **Chapters 4–5 and the epilogue.**
8. **Chapter select or resume code** (§14).
9. **Fact map complete and verified; kit PDFs generated;** playtest again; prepare to sell.

## 23. Decisions and open questions

**Decided**
- Pokémon-style exploration and battles; Latin teaches by comprehensible input and never names grammar in the game.
- Two versions (Latin, English) from one game; separate Latin-only entry page for the teacher's own students.
- No saving, no logins, nothing stored or sent about students.
- A paid classroom kit with every game: teacher guide and student PDF; two kits (Latin; History/Social Studies); classroom-handout style; plans for 50, 30 and 90 minutes; Common Core aligned for the History kit.
- Every fact has a verified source passage (primary where one exists, otherwise a modern scholar).
- 3-second card pause and a question after each text; points, ranks and a finale with confirm-before-restart.
- First sales channel: the teacher's own site via Payhip, kit paid, game free, extra income as the goal; the History kit and TPT later, if at all.
- A separate private repo for paid games; no paid content in the public repo.

**Open**
1. **Art source.** The code-drawn art and portraits were made with AI help. Keep them, draw by hand, or commission an artist? Affects any marketplace listing (§18).
2. **Resume mechanism.** Chapter select, resume code, or both (§14).
3. **Hosting** for a private repo (§19).
4. **Kit authorship per platform** (§13, §18): teacher-written for any AI-banning marketplace; AI-drafted and teacher-verified on the teacher's own site, with disclosure.
5. **Leaderboard** (§17): none for now.
6. **Sharing results with the practice app** (§2 says "later"): this conflicts with "nothing stored or sent"; needs its own privacy design before building.
7. **Student age range** for the English version (§9 says grade 4 and up); confirm against content that has violence (the Titan war) even in softened form.
8. **Price** and where else to list.
9. **Greek names** shown only in the collection book and at first appearance in English (as in §8); confirm the exact spellings with the Latin teacher.
10. **Standards codes** for the kits: check the exact current wording.

---

# Appendices

## Appendix A: Suggested `CLAUDE.md` for the new repo

```
# Rēgnum Iovis
Read regnum-iovis-design.md before doing anything. It is the plan.
Rules: keep it simple (plain browser game, no heavy tools without asking). All Latin lives in content/latin.yaml, never in code.
Every content entry has review_status draft or approved; students see only approved. Every fact has a source in kit/facts.yaml;
nothing is "verified" until a person has read the passage. Build one step at a time and stop after each. Explain how to run and
test in plain language. Commit and push to the task branch after each change; open a pull request only when asked.
This repo is PRIVATE and paid. Never copy its content into a public repo.
```

## Appendix B: Condenda Rōma at a glance (Game 1, the reference build)

- **What it is:** a real-time town-building and defense game teaching Latin commands (*Collige*, *Aedificā*, *Ambulā*, *Dēfende*, *Fer*, *Fac*, *Relege*) and the founding of Rome. Latin and English versions. About 15–20 minutes. Played by Latin I students on Chromebooks.
- **Flow:** opening cards and orders (gather wood and stone, walk to the river and hill, build a house, wall, gate and forum), farmers arriving, the scout's warning, three waves of Sabine attackers (north, west, east) with a build clock, soldiers that can be trained with stone, a checkpoint if the whole town falls, optional history scrolls with rewards, a scroll-gathering prompt after the last wave, the closing history cards, a five-question closing check, and the finale.
- **Text:** 94 entries, all approved; 12 history-card questions approved; fact map in progress (`missions/rome/kit/facts.yaml`).
- **Link for students:** the `latin.html` page of the Pages site. **License:** free for classroom use, no resale.
- **Engine files:** `core.js`, `defense.js`, `collision.js`, `score.js`, `quiz.js`, `sound.js`, `art.js`, `debug.js`, `boot.js`, `style.css`; mission in `missions/rome/mission.js`; content in `missions/rome/content/latin.yaml`.
- **Tools:** `build_content.py`, `export_review.py`, `coverage.py`, `prep_portrait.py`, `make_latin_page.sh`, `build_factcheck_page.py`; docs in `docs/MAKING-A-MISSION.md` and `docs/PORTRAIT-PROMPTS.md`.
- **Tests:** a Playwright smoke test plays the whole game in both languages, then checks the card pause, the card questions, scoring and the finale.

## Appendix C: Claims in this design that need a source

These are the claims in Part I that must go into `kit/facts.yaml` and be verified before release. Candidate passages are Claude's recollection and **unverified**. Section 12 lists further sources to check.

*Story*
- Chaos, then Terra, then Caelus; the Titans, Cyclopes and Hundred-Handers are their children (Hesiod, *Theogony* ~116–210).
- Caelus imprisons some of his children; Terra gives Saturn a sickle; Saturn overthrows his father (Hesiod, *Theogony* ~154–206).
- A prophecy that a son will overthrow Saturn (Hesiod, *Theogony* ~463–465; Apollodorus 1.1.5–1.2.1).
- Saturn swallows his children; Ops hides Jupiter and gives Saturn a stone (Hesiod, *Theogony* ~453–491).
- The stone later set up at Delphi (Hesiod, *Theogony* ~498–500).
- Jupiter raised on Crete; Amalthea the goat; the Curetes clash shields to hide his crying (Callimachus, *Hymn to Zeus*; Ovid, *Fasti* 4.197–214 and 5.111–128).
- Metis's drug; Jupiter or Metis gives Saturn the drink; the children come out in reverse order (Apollodorus 1.2.1; Hesiod, *Theogony* ~495–497 for the order).
- Campē the jailer of Tartarus; the Cyclopes freed and forging thunderbolt, trident and helmet (Apollodorus 1.2.1; Hesiod, *Theogony* ~501–506).
- The Hundred-Handers (Briareus, Cottus, Gyges) help in the Titan war (Hesiod, *Theogony* ~617–735).
- **Prometheus and Themis switching sides** is not in Hesiod's *Theogony* as the design describes it; check Aeschylus, *Prometheus Bound* (~209–221) and Apollodorus. **Flag.**
- Styx comes first to the gods' side, bringing Victory (Nike) and her siblings (Hesiod, *Theogony* ~383–403).
- **Atlas as the Titans' general** and the specific order of boss battles (Hyperion, Iapetus, Atlas, Saturn) look like game choices, not tradition; mark as `gameplay` unless a source is found. **Flag.**
- Atlas holds up the sky (Hesiod, *Theogony* ~517–520).
- The three brothers draw lots for sky, sea and the underworld (Homer, *Iliad* 15.187–193).
- Saturn flees to Latium; *Latium* from *latēre*; a golden age (Ovid, *Fasti* 1.233–238; Vergil, *Aeneid* 8.319–327).
- Juno's hostility to Carthage (Vergil, *Aeneid* 1.12–22).

*Rome (the Rōmae lines)*
- Temple of Jupiter on the Capitoline; triumphs go there.
- Juno Moneta, the mint, and the sacred geese of the Capitol.
- Vesta, the eternal flame and the Vestal Virgins.
- Ceres's temple on the Aventine as a centre for the plebeians.
- The temple of Saturn holding the treasury (*aerārium*); the Saturnalia in December.
- The Neptunalia in high summer.

*Language and numbers*
- Etymologies and glosses given in the collection book (for example *Latium* and *latēre*).
- Roman and Greek name pairs (Jupiter/Zeus, Saturn/Kronos, Juno/Hera, Neptune/Poseidon, Pluto/Hades, Ceres/Demeter, Vesta/Hestia, and the rest).
- The advantage chart (sky beats earth, and so on) is `gameplay`, not history.
