# AGENTS.md — KGS Text-Adventure (Vanilla)

## Ziel
Ein leicht wartbares, datengetriebenes Text-Adventure (HTML/CSS/JS) im "Chat-Story"-Stil.
Keine externen Libraries, keine Build-Tools, alles läuft als statische Seite.

## Projektregeln
- **Nur Vanilla**: HTML, CSS, JS (ES Modules). Keine Frameworks.
- **Keine privaten Daten**: Keine E-Mails, Telefonnummern, Adressen oder sonstige Kontaktdaten in Dialogen/Assets/Code.
- **Respektvoller Ton**: Reale Personen (NPCs) nur neutral/positiv, keine peinlichen/abwertenden Inhalte.
- **Erweiterbar**: Neue Orte/NPCs/Items sollen primär in `data/world.js` entstehen, nicht durch Hardcoding in `game.js`.

## Ordnerstruktur
- `index.html` — Layout (Scene, Log/Input, Help)
- `style.css` — Styling (Grid + responsive)
- `game.js` — Engine (State, Parser, Render, Save/Load)
- `data/world.js` — Content: Orte/Items/NPCs + optionale Hooks (`onExamine` etc.)
- `assets/` — Bilder je Ort (SVG/PNG/JPG)

## Engine-Konventionen (game.js)
- State Shape:
  - `state.locationId`
  - `state.inventory` (Array von itemIds)
  - `state.flags` (Objekt für Quest-Status)
  - `state.log` (Chat-Nachrichten)
- Parser:
  - Unterstützte Verben: `hilfe`, `wo`, `gehen`, `untersuche`, `rede`, `nimm`, `inventar`, `antworte`, `klar`
  - Synonyme werden im `verbMap` gemappt.
- Rendering:
  - Chat bubbles: `msg--system` und `msg--user`
  - Kontext-Hilfe rechts: dynamische Vorschläge (Buttons/Pills).

## World-Konventionen (data/world.js)
- `WORLD.locations[locId]` enthält:
  - `name`, `image`, `description`
  - `exits`: Array mit `{to,label,aliases,locked?,lock?,lockedText?}`
  - `npcs`: Array von npcIds
  - `items`: Array von itemIds (optional)
  - `objects`: Map, deren Werte `{name,aliases,description,onExamine?}` sein können
- `WORLD.npcs[npcId]` enthält:
  - `name`, `role`, `aliases`, `description`, `dialogue[]`
- `WORLD.items[itemId]` enthält:
  - `name`, `aliases`, `description`, `takeable`

## Wie erweitern?
### Neuen Ort hinzufügen
1. Neues SVG in `assets/` (oder Foto, falls erlaubt).
2. In `WORLD.locations` neuen Eintrag anlegen.
3. In passenden `exits` anderer Orte verlinken (bidirektional denken).
4. Optional: `objects` mit `onExamine` für kleine Events.

### Neuen NPC hinzufügen
1. In `WORLD.npcs` anlegen.
2. NPC-ID im passenden Ort in `npcs` eintragen.
3. Dialog in kurzen Sätzen (1–2 Zeilen). Keine privaten Infos.

### Neue Quest-Regel
- Möglichst über `state.flags` + `objects.onExamine` + `antworte` (oder später: eigenes `hooks.onCommand` Muster).
- Keine riesigen Switch-Cases in `game.js`, lieber "Content-Logik" nah an der Welt halten.

## Qualität
- Code: verständliche Funktionsnamen, kleine Funktionen, Kommentare nur wo nötig.
- UX: Fehlermeldungen sind hilfreich ("Beispiel: gehen mensa").
- Mobile: Haupt-Layout collapse auf 1 Spalte (ist schon drin).
