# AGENTS.md — KGS Text-Adventure (Vanilla)

## Was neu ist (v2)
- **Bugfix "Eingabe passiert nichts":** Kein ES-Module mehr (kein `type="module"`). Dadurch läuft es auch bei **file://** (direkt aus dem Explorer).
- Mehr Content: **4 Quests**, mehr NPCs, mehr Orte & Items.
- Neue Commands: `nimm`, `gib`, `quests`.
- Quest-Tracker im rechten Panel.

## Ziel
Ein leicht wartbares, datengetriebenes Text-Adventure (HTML/CSS/JS) im "Chat-Story"-Stil.
Keine externen Libraries, keine Build-Tools, alles läuft als statische Seite.

## Projektregeln
- **Nur Vanilla**: HTML, CSS, JS. Keine Frameworks.
- **Keine privaten Daten**: Keine E-Mails, Telefonnummern, Adressen oder sonstige Kontaktdaten in Dialogen/Assets/Code.
- **Respektvoller Ton**: Reale Personen (NPCs) nur neutral/positiv.
- **Erweiterbar**: Neue Orte/NPCs/Items primär in `data/world.js`, nicht als Hardcoding in `game.js`.

## Ordnerstruktur
- `index.html` — Layout (Scene, Log/Input, Help)
- `style.css` — Styling (Grid + responsive)
- `game.js` — Engine (State, Parser, Render, Save/Load)
- `data/world.js` — Content: Orte/Items/NPCs + Hooks (`onExamine`, `onTalk`)
- `assets/` — Bilder je Ort (SVG placeholders, später ersetzbar)

## Ausführen
- Doppelklick auf `index.html` reicht (läuft auch offline).
- Alternativ mit lokalem Server (VS Code Live Server etc.).

## Engine-Konventionen (game.js)
- State Shape:
  - `state.locationId`
  - `state.inventory` (Array von itemIds)
  - `state.flags` (Objekt für Quest-Status)
  - `state.log` (Chat-Nachrichten)
  - `state.taken` (Map itemId->true für einmalig aufgesammelte Items)
- Parser:
  - Verben: `hilfe`, `wo`, `gehen`, `untersuche`, `rede`, `nimm`, `gib`, `inventar`, `quests`, `klar`
  - Synonyme im `verbMap`.
- Rendering:
  - Kontext-Hilfe rechts: dynamische Vorschläge (Buttons/Pills)
  - Quest-Tracker rechts: Fortschritt pro Quest/Step
- Save/Load:
  - Autosave in `localStorage` (Key `kgs_textadventure_save_v2`)

## World-Konventionen (data/world.js)
- Global: `window.WORLD = {...}`
- `WORLD.locations[locId]` enthält:
  - `name`, `image`, `description`
  - `exits`: Array mit `{to,label,aliases,locked?,lock?,lockedText?}`
  - `npcs`: Array von npcIds
  - `items`: Array von itemIds (optional)
  - `objects`: Map `{name,aliases,description,onExamine?}`
- `WORLD.npcs[npcId]` enthält:
  - `name`, `role`, `aliases`, `description`, optional `onTalk(state, api)`
- `WORLD.items[itemId]` enthält:
  - `name`, `aliases`, `description`, `takeable`
- `WORLD.quests` enthält Steps mit `done(state)` Funktionen.

## Wie erweitern?
### Neuen Ort hinzufügen
1. Neues SVG in `assets/` (oder Foto, falls erlaubt).
2. In `WORLD.locations` neuen Eintrag anlegen.
3. Exits von/zu anderen Orten setzen.
4. Optional: `objects.onExamine` für Events.

### Neuen NPC hinzufügen
1. In `WORLD.npcs` anlegen.
2. NPC-ID im passenden Ort unter `npcs` eintragen.
3. Optional: `onTalk` für dynamische Quest-Logik.

### Neue Quest
1. `WORLD.quests` erweitern (id/title/steps).
2. Flags/Items in `onTalk`, `onExamine`, oder beim `gib`-Command anstoßen.
3. Quest-Status wird automatisch im rechten Panel angezeigt.

## Test-Checklist (schnell)
- Start: `hilfe`, `wo` funktionieren.
- Bewegung: `gehen sekretariat`, `gehen mediothek` …
- Quest 1: `rede pietsch` → `gehen mediothek` + `untersuche schild` → zurück `antworte mediothek` → Trakt3 → Brücke → Fundkiste → Mensa Ausgabe.
- Quest 2: `rede sauer` → `gehen sekretariat` → `gehen sekretariat2` → `rede borges` → `gehen lehrerzimmer` → `untersuche schrank` → `gib usb_c_kabel sauer`.
- Quest 3: `gehen aula` → `rede engel` → `gehen trakt3` → `untersuche aushang` → `gib presse_notiz engel`.
- Quest 4: `gehen schulleitung` → `rede seiberlich` → `gehen mediothek` → (IT-Labor) → `untersuche drucker` → `gib stundenplan stunkel`.
