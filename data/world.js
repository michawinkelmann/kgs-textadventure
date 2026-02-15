// data/world.js
// Hinweis: Diese Datei hängt absichtlich am globalen `window.WORLD` (kein ES-Module),
// damit das Spiel auch bei file:// (direkt aus dem Explorer) funktioniert.

function talkCycle(state, key, lines) {
  if (!Array.isArray(lines) || lines.length === 0) return "";
  const flagKey = `talk_cycle_${key}`;
  const idx = Number.isInteger(state.flags[flagKey]) ? state.flags[flagKey] : 0;
  const line = lines[idx % lines.length];
  state.flags[flagKey] = (idx + 1) % lines.length;
  return line;
}

window.WORLD = {
  meta: {
    title: "KGS Text-Adventure",
    setting: "KGS Wilhelm-Röpke-Schule (KGS Schwarmstedt)"
  },

  // Mini-Map (linker Bereich unten)
  map: {
    viewBox: "0 0 1000 600",
    nodes: {
      // Zentrum
      pausenhalle:   { x: 500, y: 270, label: "Pausenhalle" },
      aula:         { x: 500, y: 160, label: "Aula" },
      schulhof:     { x: 500, y: 360, label: "Schulhof" },

      // Verwaltung / Beratung
      sekretariat:  { x: 280, y: 260, label: "Sekretariat" },
      sekretariat2: { x: 160, y: 260, label: "Sekretariat 2" },
      schulleitung: { x: 280, y: 140, label: "Schulleitung" },
      personalrat:  { x: 260, y: 330, label: "Personalrat / Gremien" },
      beratungsraum:{ x: 260, y: 400, label: "Beratungsraum" },
      sv_ecke:      { x: 620, y: 260, label: "SV‑Ecke" },

      // Lernen / Technik
      mediothek:    { x: 740, y: 220, label: "Mediothek" },
      it_labor:     { x: 880, y: 160, label: "IT‑Labor" },
      serverraum:   { x: 970, y: 140, label: "Serverraum" },
      lehrerzimmer: { x: 700, y: 120, label: "Lehrerzimmer" },

      // Fachbereiche
      mathe_flur:       { x: 820, y: 260, label: "Mathe/Info‑Flur" },
      naturwissenschaften:{ x: 920, y: 320, label: "Naturwissenschaften" },
      awt_werkstatt:    { x: 920, y: 410, label: "AWT" },
      kunstwerkstatt:   { x: 250, y: 520, label: "Kunstwerkstatt" },

      // Wege / Essen / Sport
      mensa:        { x: 660, y: 430, label: "Mensa" },
      cafeteria:    { x: 820, y: 430, label: "Cafeteria" },
      trakt3:       { x: 320, y: 440, label: "Trakt 3" },
      bruecke:      { x: 450, y: 440, label: "Brücke" },
      hausmeister:  { x: 500, y: 520, label: "Hausmeister" },
      sporthalle:   { x: 820, y: 520, label: "Sporthalle" },
      sportplatz:   { x: 700, y: 585, label: "Sportplatz" }
    }
  },

  start: {
    locationId: "pausenhalle",
    inventory: ["schuelerausweis", "fuenf_euro"],
    flags: {},
    relationships: {},
    knownRelationships: {}
  },

  relationshipHighlights: ["pietsch", "sauer", "seiberlich", "engel", "stunkel", "ommen", "semrau"],

  events: [
    {
      id: "pausenhalle_durchsage",
      locations: ["pausenhalle", "schulhof"],
      cooldown: 3,
      chance: 0.7,
      text: "Eine kurze Durchsage knistert über die Lautsprecher – irgendwo wird schon wieder nach einem Schlüssel gesucht.",
      effect: {
        type: "setFlag",
        key: "heard_campus_durchsage"
      }
    },
    {
      id: "sekretariat_notizzettel",
      locations: ["sekretariat", "sekretariat2"],
      cooldown: 5,
      chance: 0.55,
      when: (state) => !state.taken.flur_notiz && !state.inventory.includes("flur_notiz"),
      text: "Am Kopierer rutscht ein kleiner Zettel vom Stapel. Jemand hat schnell ‚Nicht vergessen: Trakt 3!‘ gekritzelt.",
      effect: {
        type: "spawnItem",
        itemId: "flur_notiz",
        spawnText: "📌 Ein **Notizzettel** liegt jetzt hier auf dem Tisch."
      }
    },
    {
      id: "mediothek_hint",
      locations: ["mediothek", "it_labor"],
      cooldown: 4,
      chance: 0.6,
      when: (state) => !state.flags.q_ipad_done,
      text: "Zwischen Tastaturklackern hörst du ein halblautes: ‚Frag mal Sauer, der weiß, wo die Ersatzkabel sind.‘",
      effect: {
        type: "npcHint",
        npcId: "sauer"
      }
    },
    {
      id: "aula_mikro_check",
      locations: ["aula"],
      cooldown: 4,
      chance: 0.6,
      text: "Vom Bühnenrand weht ein kurzer Soundcheck herüber. Für einen Moment wirkt alles wie vor einer Premiere.",
      effect: {
        type: "setFlag",
        key: "heard_aula_soundcheck"
      }
    }
  ],

  quests: [
    // --- V4-Quests (Basis) ---
    {
      id: "mensa",
      category: "main",
      title: "Mensa‑Ready",
      steps: [
        { text: "Sprich im Sekretariat mit Anja Pietsch.", done: s => !!s.flags.q_mensa_started },
        { text: "Hol das Codewort in der Mediothek (Schild untersuchen).", done: s => !!s.flags.saw_codeword_mediothek },
        { text: "Hole den Baustellenpass im Sekretariat (antworte mediothek).", done: s => s.inventory.includes("baustellenpass") },
        { text: "Finde deinen Mensa‑Chip (Hausmeister‑Stützpunkt → Fundkiste).", done: s => s.inventory.includes("transponderchip") },
        { text: "In die Mensa: untersuche „Ausgabe“. ", done: s => !!s.flags.q_mensa_done }
      ]
    },
    {
      id: "ipad",
      category: "main",
      title: "iPad‑Rettung",
      steps: [
        { text: "Rede in der Mediothek mit Thomas Sauer.", done: s => !!s.flags.q_ipad_started },
        { text: "Hole dir von Kerstin Borges (Sekretariat 2) eine Schrankkarte.", done: s => s.inventory.includes("schrankkarte") },
        { text: "Im Lehrerzimmer: untersuche den Kabel‑Schrank.", done: s => s.inventory.includes("usb_c_kabel") },
        { text: "Gib das USB‑C‑Kabel an Sauer zurück.", done: s => !!s.flags.q_ipad_done }
      ]
    },
    {
      id: "presse",
      category: "main",
      title: "Presse‑AG Mini‑Bericht",
      steps: [
        { text: "Rede in der Aula mit Maren Engel.", done: s => !!s.flags.q_presse_started },
        { text: "Trakt 3: untersuche den Baustellen‑Aushang.", done: s => s.inventory.includes("presse_notiz") },
        { text: "Gib die Notiz an Maren Engel.", done: s => !!s.flags.q_presse_done }
      ]
    },
    {
      id: "plan",
      category: "main",
      title: "Stundenplan‑Chaos",
      steps: [
        { text: "Rede in der Schulleitung mit Mascha Seiberlich‑Ehrhardt.", done: s => !!s.flags.q_plan_started },
        { text: "Drucke im IT‑Labor den Stundenplan (Drucker untersuchen).", done: s => s.inventory.includes("stundenplan") },
        { text: "Gib den Stundenplan an Jan Stünkel.", done: s => !!s.flags.q_plan_done }
      ]
    },

    // --- Neue Hauptquest (Variante 2) ---
    {
      id: "finale",
      category: "main",
      title: "Tag der offenen Tür: Aula‑Finale",
      steps: [
        { text: "Starte die Hauptquest: rede mit Tjark Ommen (Schulleitung).", done: s => !!s.flags.q_finale_started },
        { text: "Hole die Technik‑Checkliste im Sekretariat.", done: s => s.inventory.includes("checkliste") },
        { text: "Finde den HDMI‑Adapter (Lehrerzimmer: Technikschublade untersuchen).", done: s => s.inventory.includes("hdmi_adapter") },
        { text: "Finde Batterien fürs Funkmikro (Cafeteria: Fundkorb untersuchen).", done: s => s.inventory.includes("batterien") },
        { text: "Drucke den Programmflyer (IT‑Labor: Drucker untersuchen).", done: s => s.inventory.includes("programmflyer") },
        { text: "Besorge den WLAN‑Code (Sidequest: QR‑Rallye bei Ole Semrau).", done: s => s.inventory.includes("wifi_code") },
        { text: "Serverraum: untersuche das Rack (Beamer‑Config fixen).", done: s => !!s.flags.server_ok },
        { text: "Aula: untersuche die Bühne – wenn alles passt, ist das Finale geschafft.", done: s => !!s.flags.q_finale_done }
      ]
    },

    // --- Sidequests ---
    {
      id: "qr",
      category: "side",
      title: "QR‑Rallye (WLAN‑Code)",
      steps: [
        { text: "Rede mit Ole Semrau (Digitalisierung).", done: s => !!s.flags.q_qr_started },
        { text: "Scanne QR‑Spot 1 (Pausenhalle: Aushang untersuchen).", done: s => !!s.flags.qr_spot1 },
        { text: "Scanne QR‑Spot 2 (Mensa: Ausgabe untersuchen).", done: s => !!s.flags.qr_spot2 },
        { text: "Scanne QR‑Spot 3 (Sporthalle: Anzeigetafel untersuchen).", done: s => !!s.flags.qr_spot3 },
        { text: "Zurück zu Ole Semrau: WLAN‑Code abholen.", done: s => s.inventory.includes("wifi_code") }
      ]
    },
    {
      id: "kunst",
      category: "side",
      title: "Kunst‑AG: Farbe bekennen",
      steps: [
        { text: "Rede mit Dörte Frech (Ästhetik).", done: s => !!s.flags.q_kunst_started },
        { text: "Finde das Pinselset (Sekretariat 2: Materialschublade untersuchen).", done: s => s.inventory.includes("pinselset") || !!s.flags.q_kunst_done },
        { text: "Gib das Pinselset an Dörte Frech.", done: s => !!s.flags.q_kunst_done }
      ]
    },
    {
      id: "poster",
      category: "side",
      title: "Aushang‑Aktion (Gleichstellung)",
      steps: [
        { text: "Rede mit Jenny Hoffrichter (Gleichstellungsbeauftragte).", done: s => !!s.flags.q_poster_started },
        { text: "Hol Klebeband (Hausmeister: Werkzeugwand untersuchen).", done: s => s.inventory.includes("klebeband") || !!s.flags.q_poster_done },
        { text: "Gib das Klebeband an Jenny Hoffrichter.", done: s => !!s.flags.q_poster_done }
      ]
    },
    {
      id: "frieden",
      category: "side",
      title: "Friedensrunde (Soziales Lernen)",
      steps: [
        { text: "Rede mit Simona Jeske (Soziales Lernen).", done: s => !!s.flags.q_frieden_started },
        { text: "Finde Konfliktkarten (Mediothek: Methodenregal untersuchen).", done: s => s.inventory.includes("konfliktkarten") || !!s.flags.q_frieden_done },
        { text: "Gib die Konfliktkarten an Simona Jeske.", done: s => !!s.flags.q_frieden_done }
      ]
    },
    {
      id: "kaenguru",
      category: "side",
      title: "Känguru‑Bogen (Mathe/Info)",
      steps: [
        { text: "Rede mit Dr. Jan‑Wilhelm Fischer.", done: s => !!s.flags.q_kaenguru_started },
        { text: "Drucke den Känguru‑Bogen (IT‑Labor: Drucker untersuchen).", done: s => s.inventory.includes("kaenguru_bogen") || !!s.flags.q_kaenguru_done },
        { text: "Gib den Bogen an Dr. Fischer.", done: s => !!s.flags.q_kaenguru_done }
      ]
    },
    {
      id: "experiment",
      category: "side",
      title: "Labor‑Zugang (Naturwissenschaften)",
      steps: [
        { text: "Rede mit Kevin Krämer (NaWi).", done: s => !!s.flags.q_nawi_started },
        { text: "Hole eine Schutzbrille (Hausmeister: Brillen‑Kiste untersuchen).", done: s => s.inventory.includes("laborbrille") || s.inventory.includes("werkstattpass") || !!s.flags.q_nawi_done },
        { text: "Gib die Schutzbrille an Kevin Krämer (Werkstatt‑Pass).", done: s => s.inventory.includes("werkstattpass") }
      ]
    },
    {
      id: "sport",
      category: "side",
      title: "Ball‑Mission (Sport & Ganztag)",
      steps: [
        { text: "Rede mit Christoph Religa (Sport).", done: s => !!s.flags.q_sport_started },
        { text: "Finde die Ballpumpe (Sporthalle: Geräteraum untersuchen).", done: s => s.inventory.includes("ballpumpe") || s.inventory.includes("sportpass") || !!s.flags.q_sport_done },
        { text: "Gib die Ballpumpe an Christoph Religa (Sportplatz‑Pass).", done: s => s.inventory.includes("sportpass") }
      ]
    },
    {
      id: "dienstplan",
      category: "side",
      title: "Gremien‑Druck (Personalrat)",
      steps: [
        { text: "Rede mit Alfred Thienel (Personalrat).", done: s => !!s.flags.q_dienstplan_started },
        { text: "Drucke den Dienstplan (IT‑Labor: Drucker untersuchen).", done: s => s.inventory.includes("dienstplan") || !!s.flags.q_dienstplan_done },
        { text: "Gib den Dienstplan an Alfred Thienel.", done: s => !!s.flags.q_dienstplan_done }
      ]
    },
    {
      id: "sprachen",
      category: "side",
      title: "Vokabel‑Alarm (Fremdsprachen)",
      steps: [
        { text: "Rede mit Johanna Steinbeck.", done: s => !!s.flags.q_sprachen_started },
        { text: "Finde die Vokabelkarten (Cafeteria: Zuckerdose untersuchen).", done: s => s.inventory.includes("vokabelkarten") || !!s.flags.q_sprachen_done },
        { text: "Gib die Vokabelkarten an Johanna Steinbeck.", done: s => !!s.flags.q_sprachen_done }
      ]
    },
    {
      id: "theater",
      category: "side",
      title: "Theaterprobe (Deutsch/DS)",
      steps: [
        { text: "Rede mit Kathrin Remmers.", done: s => !!s.flags.q_theater_started },
        { text: "Finde die Skript‑Seite (Aula: Sitzreihe untersuchen).", done: s => s.inventory.includes("skript_seite") || !!s.flags.q_theater_done },
        { text: "Gib die Skript‑Seite an Kathrin Remmers.", done: s => !!s.flags.q_theater_done }
      ]
    },
    {
      id: "barriere",
      category: "side",
      title: "Barriere‑Check (Nebenaufgabe)",
      steps: [
        { text: "Rede mit Kristina Peper in der Pausenhalle.", done: s => !!s.flags.q_barriere_started },
        { text: "Schau dir das Wegweiser‑Schild auf dem Schulhof an.", done: s => !!s.flags.q_barriere_schild },
        { text: "Gib Kristina Peper eine kurze Rückmeldung.", done: s => !!s.flags.q_barriere_done }
      ]
    },
    {
      id: "atem",
      category: "side",
      title: "Atempause (Nebenaufgabe)",
      steps: [
        { text: "Untersuche im Beratungsraum die Ruhekarte.", done: s => !!s.flags.q_atem_started },
        { text: "Nimm den Hinweis mit und rede mit Simona Jeske.", done: s => !!s.flags.q_atem_done }
      ]
    },
    {
      id: "werkbank",
      category: "side",
      title: "Werkbank‑Check (Nebenaufgabe)",
      steps: [
        { text: "Rede mit Kay Kretzer in der AWT‑Werkstatt.", done: s => !!s.flags.q_werkbank_started },
        { text: "Untersuche die Werkzeugbank in der Werkstatt.", done: s => !!s.flags.q_werkbank_checked },
        { text: "Melde dich bei Kay Kretzer zurück.", done: s => !!s.flags.q_werkbank_done }
      ]
    },
    {
      id: "tribuene",
      category: "side",
      title: "Tribünen‑Gruß (Nebenaufgabe)",
      steps: [
        { text: "Untersuche die kleine Tribüne auf dem Sportplatz.", done: s => !!s.flags.q_tribuene_started },
        { text: "Rede danach mit Christoph Religa.", done: s => !!s.flags.q_tribuene_done }
      ]
    }
  ],

  items: {
    // --- Startitems ---
    schuelerausweis: {
      name: "Schülerausweis",
      aliases: ["ausweis", "id", "karte"],
      description: "Dein Schülerausweis. Fühlt sich wichtig an.",
      takeable: false
    },
    fuenf_euro: {
      name: "5‑Euro‑Schein",
      aliases: ["5euro", "fünf euro", "fuenf euro", "schein"],
      description: "Ein 5‑Euro‑Schein. Für Notfälle (und vielleicht Cafeteria‑Dinge).",
      takeable: false
    },

    // --- V4 Items ---
    baustellenpass: {
      name: "Baustellenpass",
      aliases: ["pass", "baustelle", "baustellen-pass"],
      description: "Ein Pass, der dir den Weg über die Baustellen‑Brücke erlaubt.",
      takeable: false
    },
    transponderchip: {
      name: "Transponderchip",
      aliases: ["chip", "transponder", "mensa chip", "essenchip"],
      description: "Dein Mensa‑Chip. Ohne den läuft (fast) nichts.",
      takeable: true
    },
    schrankkarte: {
      name: "Schrankkarte",
      aliases: ["schrankkarte", "karte schrank", "karte"],
      description: "Eine Karte, die einen Schrank im Lehrerzimmer öffnet.",
      takeable: true
    },
    usb_c_kabel: {
      name: "USB‑C‑Kabel",
      aliases: ["usb", "usb c", "usb-c", "kabel"],
      description: "Ein USB‑C‑Kabel. Gerade noch rechtzeitig.",
      takeable: true
    },
    it_pass: {
      name: "IT‑Pass",
      aliases: ["it pass", "it-pass", "pass it"],
      description: "Erlaubt dir Zugang zum IT‑Labor.",
      takeable: false
    },
    presse_notiz: {
      name: "Baustellen‑Notiz",
      aliases: ["notiz", "presse", "notiz baustelle"],
      description: "Eine kleine Notiz für den Mini‑Bericht.",
      takeable: true
    },
    stundenplan: {
      name: "Stundenplan (Ausdruck)",
      aliases: ["stundenplan", "plan", "ausdruck"],
      description: "Ein frischer Ausdruck. Riecht nach Drucker.",
      takeable: true
    },
    hallpass: {
      name: "Flur‑Pass",
      aliases: ["hallpass", "flurpass", "pass"],
      description: "Ein kleiner Pass, der zeigt: du bist ‚im Auftrag‘ unterwegs.",
      takeable: false
    },

    // --- Hauptquest Items ---
    checkliste: {
      name: "Technik‑Checkliste",
      aliases: ["checkliste", "liste", "technikliste"],
      description: "Eine Liste mit Punkten: Beamer, Ton, WLAN, Programmflyer…",
      takeable: true
    },
    hdmi_adapter: {
      name: "HDMI‑Adapter",
      aliases: ["hdmi", "adapter", "hdmi adapter"],
      description: "Der Adapter, der aus ‚passt nicht‘ wieder ‚läuft‘ macht.",
      takeable: true
    },
    batterien: {
      name: "Batterien",
      aliases: ["batterie", "batterien", "aa"],
      description: "Frische Batterien fürs Funkmikro. Hoffentlich.",
      takeable: true
    },
    programmflyer: {
      name: "Programmflyer",
      aliases: ["programm", "flyer", "programmflyer"],
      description: "Gedrucktes Programm für den Tag der offenen Tür.",
      takeable: true
    },
    aula_badge: {
      name: "Aula‑Badge",
      aliases: ["badge", "aula badge"],
      description: "Ein kleines Abzeichen: ‚Team Aula‘.",
      takeable: false
    },

    // --- Sidequest Items ---
    wifi_code: {
      name: "WLAN‑Code",
      aliases: ["wifi", "wlan", "code", "wlan code"],
      description: "Ein Code für das Gäste‑WLAN (und den Serverraum).",
      takeable: false
    },
    pinselset: {
      name: "Pinselset",
      aliases: ["pinsel", "pinselset", "pinsel set"],
      description: "Ein Set Pinsel – sauber, fast neu.",
      takeable: true
    },
    klebeband: {
      name: "Klebeband",
      aliases: ["tape", "klebeband", "band"],
      description: "Gutes Klebeband. Hält Plakate UND dein Selbstvertrauen zusammen.",
      takeable: true
    },
    konfliktkarten: {
      name: "Konfliktkarten",
      aliases: ["karten", "konfliktkarten", "konflikt"],
      description: "Karten mit Gesprächsregeln, Ich‑Botschaften und de‑eskalierenden Fragen.",
      takeable: true
    },
    kaenguru_bogen: {
      name: "Känguru‑Bogen",
      aliases: ["kaenguru", "känguru", "bogen", "kaenguru bogen"],
      description: "Aufgaben, die harmlos anfangen und dann plötzlich ernst werden.",
      takeable: true
    },
    laborbrille: {
      name: "Schutzbrille",
      aliases: ["brille", "schutzbrille", "laborbrille"],
      description: "Eine Schutzbrille. Sicherheit first.",
      takeable: true
    },
    werkstattpass: {
      name: "Werkstatt‑Pass",
      aliases: ["werkstatt", "werkstattpass", "pass werkstatt"],
      description: "Erlaubt Zugang zur AWT‑Werkstatt.",
      takeable: false
    },
    ballpumpe: {
      name: "Ballpumpe",
      aliases: ["pumpe", "ballpumpe"],
      description: "Eine kleine Pumpe, die große Sport‑Dramen verhindert.",
      takeable: true
    },
    sportpass: {
      name: "Sportplatz‑Pass",
      aliases: ["sportpass", "sportplatz pass", "pass sport"],
      description: "Erlaubt Zugang zum Sportplatz.",
      takeable: false
    },
    dienstplan: {
      name: "Dienstplan",
      aliases: ["dienstplan", "plan dienst", "plan"],
      description: "Ein Ausdruck mit Schichten, Zeiten, Häkchen‑Felder.",
      takeable: true
    },
    vokabelkarten: {
      name: "Vokabelkarten",
      aliases: ["vokabel", "vokabelkarten", "karten vokabel"],
      description: "Karten mit Wortschatz – irgendwie nach Cafeteria duftend.",
      takeable: true
    },
    skript_seite: {
      name: "Skript‑Seite",
      aliases: ["skript", "seite", "skript seite"],
      description: "Eine einzelne Seite aus einem Theater‑Skript. Wichtig. Vielleicht.",
      takeable: true
    },
    flur_notiz: {
      name: "Notizzettel",
      aliases: ["notiz", "notizzettel", "zettel"],
      description: "Ein kleiner Zettel mit krakeliger Erinnerung: ‚Trakt 3 zuerst prüfen‘.",
      takeable: true
    }
  },

  npcs: {
    pietsch: {
      name: "Anja Pietsch",
      role: "Schülerangelegenheiten Oberstufe, Mittagessen",
      aliases: ["pietsch", "frau pietsch", "anja"],
      description: "Beschäftigt, aber freundlich. Wenn es um Mensa/Organisation geht, weiß sie Bescheid.",
      onTalk: (state, api) => {
        const rep = api.getReputation("pietsch");

        if (state.flags.q_mensa_done) {
          api.say("system",
            "**Anja Pietsch**\n" +
            talkCycle(state, "pietsch_done", [
              "Mensa läuft? Perfekt. Dann ist heute ein Chaos weniger.",
              "Schön, dass das mit dem Chip geklappt hat. Guten Hunger!"
            ])
          );
          return;
        }

        if (!state.flags.q_mensa_started) {
          state.flags.q_mensa_started = true;
          api.say("system",
            "**Anja Pietsch**\n" +
            "Gut, dass du da bist. Wir klären zuerst dein Mensa‑Thema – dann läuft der Rest entspannter."
          );
          api.changeReputation("pietsch", 1);
          return;
        }

        // Hauptquest-Checkliste
        if (state.flags.q_finale_started && !api.hasItem("checkliste")) {
          api.giveItem("checkliste");
          api.say("system",
            "**Anja Pietsch**\n" +
            "Ah, Team Aula? Hier ist die **Technik‑Checkliste**. Denk an: Adapter, Batterien, Programmflyer… und WLAN."
          );
          return;
        }

        if (api.hasItem("checkliste") && !state.flags.q_finale_done) {
          api.say("system",
            "**Anja Pietsch**\n" +
            "Die Checkliste hast du schon – stark. Häkchen helfen heute wirklich."
          );
          return;
        }

        if (state.flags.saw_codeword_mediothek && !api.hasItem("baustellenpass")) {
          if (rep >= 2 && !state.flags.pietsch_fastpass_hint){
            state.flags.pietsch_fastpass_hint = true;
            api.say("system", "**Anja Pietsch**\nDu hast zuverlässig geholfen – ich kann den Pass direkt freigeben. Sag einfach: `antworte mediothek`.");
            api.changeReputation("pietsch", 1);
            return;
          }
          api.say("system",
            "**Anja Pietsch**\n" +
            "Codewort sitzt? Super. Jetzt noch `antworte mediothek`, dann bekommst du den Baustellenpass."
          );
          return;
        }

        if (!api.hasItem("transponderchip")) {
          if (!api.hasItem("baustellenpass")) {
            api.say("system",
              "**Anja Pietsch**\n" +
              "Ohne Chip kannst du in der Mensa nichts bestellen.\n" +
              "Vielleicht liegt dein Chip im Hausmeister‑Stützpunkt (Fundkiste).\n" +
              "Wegen Umbau/Brücke brauchst du aber einen Baustellenpass.\n\n" +
              "Bring mir das Codewort aus der Mediothek (Schild untersuchen) und tippe dann: `antworte mediothek`."
            );
            return;
          }
          api.say("system",
            "**Anja Pietsch**\n" +
            talkCycle(state, "pietsch_progress", [
              "Mit Baustellenpass kommst du zur Fundkiste. Viel Erfolg!",
              "Fundkiste beim Hausmeister‑Stützpunkt – dort solltest du den Chip finden.",
              "Du bist nah dran: Pass ist da, jetzt fehlt nur noch dein Chip."
            ])
          );
          return;
        }

        api.say("system",
          "**Anja Pietsch**\n" +
          "Chip gefunden – perfekt. Kurz vor Abschluss: Geh in die Mensa und untersuche die Ausgabe."
        );
      }
    },

    sauer: {
      name: "Thomas Sauer",
      role: "Technik, iPads, Homepage",
      aliases: ["sauer", "herr sauer", "thomas"],
      description: "Technik‑Ecke, Aushänge, Kabel… er wirkt wie jemand, der Probleme lösungsorientiert anguckt.",
      onTalk: (state, api) => {
        const rep = api.getReputation("sauer");

        if (!state.flags.q_ipad_started) {
          state.flags.q_ipad_started = true;
          api.say("system",
            "**Thomas Sauer**\n" +
            "Mein iPad‑Koffer ist tot, weil ein USB‑C‑Kabel fehlt. Kannst du kurz retten?"
          );
          api.changeReputation("sauer", 1);
          return;
        }

        if (state.flags.q_ipad_done) {
          api.say("system",
            "**Thomas Sauer**\n" +
            talkCycle(state, "sauer_done", [
              "Top, Kabelproblem gelöst. Wenn du was drucken musst: das IT‑Labor ist jetzt für dich ok.",
              "Danke nochmal. Seit dem Kabel läuft die Technik wieder deutlich friedlicher."
            ])
          );
          return;
        }

        if (api.hasItem("usb_c_kabel")) {
          api.say("system",
            "**Thomas Sauer**\n" +
            "Ah! Du hast ein USB‑C‑Kabel. Gib es mir mit: `gib usb_c_kabel sauer`."
          );
          return;
        }

        if (rep >= 3 && !api.hasItem("schrankkarte") && !state.flags.sauer_shortcut){
          state.flags.sauer_shortcut = true;
          api.giveItem("schrankkarte");
          api.say("system", "**Thomas Sauer**\nDu bist verlässlich – ich lege dir die Schrankkarte direkt hier bereit. Spare dir den Extra‑Weg.");
          api.changeReputation("sauer", 1);
          return;
        }

        if (api.hasItem("schrankkarte")) {
          api.say("system",
            "**Thomas Sauer**\n" +
            "Sehr gut, Schrankkarte ist da. Jetzt fehlt nur noch das Kabel aus dem Lehrerzimmer."
          );
          return;
        }

        api.say("system",
          "**Thomas Sauer**\n" +
          talkCycle(state, "sauer_progress", [
            "Frag mal im **Sekretariat 2** nach einer Schrankkarte.",
            "Ohne Schrankkarte kommen wir nicht ans Kabel im Lehrerzimmer.",
            "Kleiner Reminder: Sekretariat 2 → Schrankkarte, dann Lehrerzimmer."
          ])
        );
      }
    },

    michaelis: {
      name: "Maik Michaelis",
      role: "Haustechnik, Wartung, Instandhaltung",
      aliases: ["michaelis", "maik", "hausmeister"],
      description: "Hausmeister‑Aura: Schlüssel, Kisten, kurz nicken, Problem gelöst.",
      onTalk: (state, api) => {
        api.say("system",
          "**Maik Michaelis**\n" +
          "Moin. Fundkiste ist da drüben. Und: nichts anfassen, was summt."
        );
      }
    },

    borges: {
      name: "Kerstin Borges",
      role: "Lehrerangelegenheiten, Budgetverwaltung",
      aliases: ["borges", "kerstin", "sekretariat2"],
      description: "Sie jongliert Listen, Formulare und bleibt dabei erstaunlich ruhig.",
      onTalk: (state, api) => {
        if (!api.hasItem("schrankkarte")) {
          api.giveItem("schrankkarte");
          api.say("system",
            "**Kerstin Borges**\n" +
            "Du brauchst eine Schrankkarte? Bitte. Aber bring sie nicht in die Mensa."
          );
          return;
        }
        api.say("system",
          "**Kerstin Borges**\n" +
          "Noch mehr Karten? Ich hab hier ein ganzes Universum davon."
        );
      }
    },

    bouda: {
      name: "Martina Bouda",
      role: "Lehrerangelegenheiten, Klassenfahrten",
      aliases: ["bouda", "martina"],
      description: "Organisiert, pragmatisch. Wenn irgendwo etwas fährt, weiß sie wann.",
      onTalk: (state, api) => {
        api.say("system",
          "**Martina Bouda**\n" +
          "Wenn du irgendwo hin willst: erst Plan, dann Pass – und dann los."
        );
      }
    },

    gotzkowsky: {
      name: "Dirk Gotzkowsky",
      role: "Unterrichtstechnik, PC's, Schulbücher",
      aliases: ["gotzkowsky", "dirk"],
      description: "Er wirkt, als könnte er einen Beamer mit einem Blick reparieren.",
      onTalk: (state, api) => {
        if (state.flags.q_finale_started && !state.flags.server_ok){
          api.say("system",
            "**Dirk Gotzkowsky**\n" +
            "Für den Beamer‑Kram musst du in den **Serverraum**. Hol dir vorher den **WLAN‑Code** (Semrau) – sonst kommst du nicht rein."
          );
          return;
        }
        api.say("system",
          "**Dirk Gotzkowsky**\n" +
          "Technikregel: Wenn es blinkt, ist es gut. Wenn es raucht, ist es… spannend."
        );
      }
    },

    spohr: {
      name: "Matthias Spohr",
      role: "Haustechnik, Wartung, Instandhaltung",
      aliases: ["spohr", "matthias"],
      description: "Baustellen‑Profi. Kennt Abkürzungen, die nicht auf Plänen stehen.",
      onTalk: (state, api) => {
        api.say("system",
          "**Matthias Spohr**\n" +
          "Trakt 3 ist sicher – solange du da bleibst, wo die Absperrung nicht ist."
        );
      }
    },

    ommen: {
      name: "Tjark Ommen",
      role: "Gesamtschuldirektor",
      aliases: ["ommen", "herr ommen", "tjark"],
      description: "Ruhig, organisiert – Schulleitungs‑Energie.",
      onTalk: (state, api) => {
        const rep = api.getReputation("ommen");

        if (!state.flags.q_finale_started) {
          state.flags.q_finale_started = true;
          api.say("system",
            "**Tjark Ommen**\n" +
            "Heute ist **Tag der offenen Tür** – und die Aula muss sitzen.\n" +
            "Hol dir im Sekretariat die **Technik‑Checkliste**.\n" +
            "Dann: Adapter, Batterien, Programmflyer und WLAN‑Code.\n" +
            "Wenn der Serverraum läuft, sind wir entspannt."
          );
          api.changeReputation("ommen", 1);
          return;
        }

        if (state.flags.q_finale_done) {
          api.say("system",
            "**Tjark Ommen**\n" +
            "Stark. Das Finale steht. Teamwork in Reinform."
          );
          return;
        }

        const finaleParts = ["checkliste", "hdmi_adapter", "batterien", "programmflyer", "wifi_code"];
        const missing = finaleParts.filter(itemId => !api.hasItem(itemId));

        if (missing.length === 0 && state.flags.server_ok) {
          api.say("system",
            "**Tjark Ommen**\n" +
            "Perfekt vorbereitet – jetzt fehlt nur noch die Bühne in der Aula. Du bist kurz vor dem Abschluss."
          );
          return;
        }

        if (rep >= 3 && !api.hasItem("checkliste")) {
          api.giveItem("checkliste");
          api.say("system", "**Tjark Ommen**\nDu bekommst die kompakte Checkliste direkt von mir – wir sparen Zeit.");
          return;
        }

        if (api.hasItem("wifi_code") && !state.flags.server_ok) {
          api.say("system",
            "**Tjark Ommen**\n" +
            "WLAN‑Code ist da – stark. Nächster Schritt: Serverraum prüfen und das Rack untersuchen."
          );
          return;
        }

        api.say("system",
          "**Tjark Ommen**\n" +
          talkCycle(state, "ommen_progress", [
            "Wie läuft’s? Checkliste, Adapter, Batterien, Programmflyer und WLAN‑Code – dann Serverraum – dann Bühne.",
            `Zwischenstand: Es fehlen noch ${missing.length} Baustein(e) fürs Finale.`,
            "Du hältst das Team gerade zusammen. Wenn alles da ist, geht’s direkt in die Aula."
          ])
        );
      }
    },

    seiberlich: {
      name: "Mascha Seiberlich‑Ehrhardt",
      role: "Direktorstellvertreterin",
      aliases: ["seiberlich", "mascha", "frau seiberlich"],
      description: "Stundenpläne, Organisation, Lehrkräfteeinsatz – sie wirkt immer einen Schritt voraus.",
      onTalk: (state, api) => {
        const rep = api.getReputation("seiberlich");

        if (!state.flags.q_plan_started) {
          state.flags.q_plan_started = true;
          api.say("system",
            "**Mascha Seiberlich‑Ehrhardt**\n" +
            "Willkommen im Stundenplan‑Chaos. Wir brauchen schnell einen frischen Ausdruck aus dem IT‑Labor."
          );
          api.changeReputation("seiberlich", 1);
          return;
        }

        if (state.flags.q_plan_done) {
          api.say("system",
            "**Mascha Seiberlich‑Ehrhardt**\n" +
            talkCycle(state, "seiberlich_done", [
              "Super, Planproblem gelöst. Danke!",
              "Alles wieder im Takt – danke für die schnelle Hilfe."
            ])
          );
          return;
        }

        if (api.hasItem("stundenplan")) {
          api.say("system",
            "**Mascha Seiberlich‑Ehrhardt**\n" +
            "Sehr gut, der Ausdruck ist da. Jan Stünkel wartet auf den Plan (`gib stundenplan stunkel`)."
          );
          return;
        }

        if (rep >= 3 && !api.hasItem("it_pass") && !state.flags.seiberlich_direct_it_pass){
          state.flags.seiberlich_direct_it_pass = true;
          api.giveItem("it_pass");
          api.say("system", "**Mascha Seiberlich‑Ehrhardt**\nWeil du so zuverlässig bist: Hier ist direkt ein **IT‑Pass** als Abkürzung.");
          api.changeReputation("seiberlich", 1);
          return;
        }

        if (api.hasItem("it_pass")) {
          api.say("system",
            "**Mascha Seiberlich‑Ehrhardt**\n" +
            "IT‑Pass hast du bereits. Dann fehlt nur noch der Druck am Drucker."
          );
          return;
        }

        api.say("system",
          "**Mascha Seiberlich‑Ehrhardt**\n" +
          talkCycle(state, "seiberlich_progress", [
            "Wir brauchen dringend einen Ausdruck vom aktuellen Stundenplan. Geh ins IT‑Labor und untersuche den Drucker.",
            "Sobald du den Ausdruck hast, direkt zu Jan Stünkel damit.",
            "Der Plan ist unser Flaschenhals – du bist knapp vor der Lösung."
          ])
        );
      }
    },

    engel: {
      name: "Maren Engel",
      role: "Didaktische Leitung",
      aliases: ["engel", "maren", "frau engel"],
      description: "Plant, koordiniert, behält die Ruhe. Sogar wenn überall Papier ist.",
      onTalk: (state, api) => {
        const rep = api.getReputation("engel");

        if (!state.flags.q_presse_started) {
          state.flags.q_presse_started = true;
          api.say("system",
            "**Maren Engel**\n" +
            "Hi! Ich brauche einen kurzen Baustellen‑Mini‑Bericht für die Presse‑AG."
          );
          api.changeReputation("engel", 1);
          return;
        }

        if (state.flags.q_presse_done) {
          api.say("system",
            "**Maren Engel**\n" +
            talkCycle(state, "engel_done", [
              "Danke für den Bericht! Wenn du noch helfen willst: Team Aula braucht heute viele Hände.",
              "Presse‑AG ist versorgt – richtig gut. Danke dir!"
            ])
          );
          return;
        }

        if (rep >= 3 && !state.flags.engel_shortcut_note && !api.hasItem("presse_notiz")) {
          state.flags.engel_shortcut_note = true;
          api.giveItem("presse_notiz");
          api.say("system", "**Maren Engel**\nDu arbeitest super mit uns. Ich nehme als Abkürzung eine Kurznotiz von dir und trage den Rest selbst nach.");
          return;
        }

        if (api.hasItem("presse_notiz")){
          api.say("system",
            "**Maren Engel**\n" +
            "Ah, du hast eine Notiz. Gib sie mir mit: `gib presse_notiz engel`."
          );
          return;
        }

        api.say("system",
          "**Maren Engel**\n" +
          talkCycle(state, "engel_progress", [
            "Schau im Trakt 3 nach dem Baustellen‑Aushang.",
            "Mir reicht eine kurze Notiz – Hauptsache aktuell und verständlich.",
            "Wenn du die Notiz schon hast, gib sie mir direkt."
          ])
        );
      }
    },

    stunkel: {
      name: "Jan Stünkel",
      role: "Gymnasialzweigleiter",
      aliases: ["stunkel", "stünkel", "jan"],
      description: "Schnell im Kopf, freundlich im Ton – aber er mag klare Unterlagen.",
      onTalk: (state, api) => {
        if (state.flags.q_plan_done) {
          api.say("system", "**Jan Stünkel**\n" + talkCycle(state, "stunkel_done", [
            "Alles im grünen Bereich. Danke!",
            "Der Plan hängt, die Kurse laufen. Sauber erledigt."
          ]));
          return;
        }

        if (!state.flags.q_plan_started) {
          api.say("system",
            "**Jan Stünkel**\n" +
            "Wenn der Stundenplan fehlt, sprich zuerst mit Frau Seiberlich in der Schulleitung."
          );
          return;
        }

        if (api.hasItem("stundenplan")) {
          api.say("system", "**Jan Stünkel**\nGib mir den Plan: `gib stundenplan stunkel`.");
          return;
        }

        api.say("system", "**Jan Stünkel**\n" + talkCycle(state, "stunkel_progress", [
          "Wenn du einen Ausdruck vom Stundenplan hast, bring ihn rüber.",
          "Ohne Ausdruck kann ich nicht freigeben – Drucker im IT‑Labor ist der Schlüssel.",
          "Kurzer Statuscheck: Plan unterwegs?"
        ]));
      }
    },

    janssen: {
      name: "Uwe Janßen",
      role: "Oberstufenkoordinator",
      aliases: ["janssen", "janßen", "uwe"],
      description: "Er hat den Überblick über Sek II – und wahrscheinlich über 30 Formulare gleichzeitig.",
      onTalk: (state, api) => {
        api.say("system",
          "**Uwe Janßen**\n" +
          "Oberstufe ist Organisation und Freiheit gleichzeitig. Wenn du heute hilfst: Respekt."
        );
      }
    },

    thienel: {
      name: "Alfred Thienel",
      role: "Vorsitzender des Schulpersonalrats",
      aliases: ["thienel", "alfred"],
      description: "Ruhig, sachlich – und sehr froh über ausgedruckte Pläne.",
      onTalk: (state, api) => {
        state.flags.q_dienstplan_started = true;

        if (state.flags.q_dienstplan_done){
          api.say("system", "**Alfred Thienel**\nAlles klar. Danke dir!");
          return;
        }

        if (api.hasItem("dienstplan")){
          api.say("system", "**Alfred Thienel**\nGib ihn mir: `gib dienstplan thienel`.");
          return;
        }

        api.say("system",
          "**Alfred Thienel**\n" +
          "Für die Aushänge brauche ich einen **Dienstplan‑Ausdruck**.\n" +
          "Druck ihn im IT‑Labor aus."
        );
      }
    },

    hoffrichter: {
      name: "Jenny Hoffrichter",
      role: "Gleichstellungsbeauftragte",
      aliases: ["hoffrichter", "jenny"],
      description: "Fokussiert – und sie findet immer den richtigen Ton (und das richtige Plakat).",
      onTalk: (state, api) => {
        state.flags.q_poster_started = true;

        if (state.flags.q_poster_done){
          api.say("system", "**Jenny Hoffrichter**\nPlakat hängt. Wirkt. Danke!");
          return;
        }

        if (api.hasItem("klebeband")){
          api.say("system", "**Jenny Hoffrichter**\nPerfekt! Gib es mir: `gib klebeband hoffrichter`.");
          return;
        }

        api.say("system",
          "**Jenny Hoffrichter**\n" +
          "Mir fehlt Klebeband fürs Aushang‑Board. Hausmeister‑Stützpunkt – Werkzeugwand."
        );
      }
    },

    jeske: {
      name: "Simona Jeske",
      role: "Soziales Lernen",
      aliases: ["jeske", "simona"],
      description: "Prävention, Gespräch, Teamgefühl – sie hat die Ruhe weg.",
      onTalk: (state, api) => {
        if (state.flags.q_atem_started && !state.flags.q_atem_done){
          state.flags.q_atem_done = true;
          api.say("system",
            "**Simona Jeske**\n" +
            "Danke für den Hinweis aus dem Beratungsraum. Ich hänge die Atemkarte gleich aus.\n" +
            "✅ Nebenaufgabe abgeschlossen: **Atempause**\n" +
            "💬 Kleiner Vorteil: Bei Stress hilft oft `wo` + einmal tief durchatmen."
          );
          return;
        }

        state.flags.q_frieden_started = true;

        if (state.flags.q_frieden_done){
          api.say("system", "**Simona Jeske**\nSehr gut. Damit können wir die Runde starten.");
          return;
        }
        if (api.hasItem("konfliktkarten")){
          api.say("system", "**Simona Jeske**\nGib sie mir: `gib konfliktkarten jeske`.");
          return;
        }
        api.say("system",
          "**Simona Jeske**\n" +
          "Ich suche **Konfliktkarten** für eine Friedensrunde.\n" +
          "Frag in der Mediothek – Methodenregal."
        );
      }
    },

    frech: {
      name: "Dörte Frech",
      role: "Ästhetik / Kunst",
      aliases: ["frech", "doerte", "dörte"],
      description: "Kunst‑Energie: Ideen, Farben, und ‚nur noch schnell‘ wird zu 30 Minuten.",
      onTalk: (state, api) => {
        state.flags.q_kunst_started = true;

        if (state.flags.q_kunst_done){
          api.say("system", "**Dörte Frech**\nMega. Jetzt sieht’s hier nach Kunst aus, nicht nach Chaos.");
          return;
        }
        if (api.hasItem("pinselset")){
          api.say("system", "**Dörte Frech**\nYes! Gib’s her: `gib pinselset frech`.");
          return;
        }
        api.say("system",
          "**Dörte Frech**\n" +
          "Mir fehlt ein **Pinselset**. Vielleicht im Sekretariat 2 in der Materialschublade?"
        );
      }
    },

    semrau: {
      name: "Ole Semrau",
      role: "Fachbereich Digitalisierung",
      aliases: ["semrau", "ole"],
      description: "Digitalisierung, QR‑Codes, iPad‑Ordnung. Und trotzdem nett.",
      onTalk: (state, api) => {
        const rep = api.getReputation("semrau");

        if (!state.flags.q_qr_started) {
          state.flags.q_qr_started = true;
          api.say("system",
            "**Ole Semrau**\n" +
            "QR‑Rallye! Drei Spots scannen, dann bekommst du den WLAN‑Code."
          );
          api.changeReputation("semrau", 1);
          return;
        }

        if (api.hasItem("wifi_code")) {
          api.say("system", "**Ole Semrau**\n" + talkCycle(state, "semrau_done", [
            "WLAN‑Code hast du ja. Bleib fair: nicht weitergeben 😉",
            "Code ist raus, Mission erfüllt. Viel Erfolg bei der Aula‑Technik!"
          ]));
          return;
        }

        const a = !!state.flags.qr_spot1;
        const b = !!state.flags.qr_spot2;
        const c = !!state.flags.qr_spot3;

        if (rep >= 3 && !a && !b && !c && state.flags.q_finale_started) {
          api.giveItem("wifi_code");
          api.say("system", "**Ole Semrau**\nFürs Finale gebe ich dir den WLAN‑Code direkt – du hast dir Vertrauen verdient.");
          api.changeReputation("semrau", 1);
          return;
        }

        if (a && b && c) {
          api.giveItem("wifi_code");
          api.say("system",
            "**Ole Semrau**\n" +
            "Sauber! Hier ist der **WLAN‑Code**. Der öffnet auch eine Tür, die offiziell ‚nicht existiert‘."
          );
          return;
        }

        const doneCount = [a, b, c].filter(Boolean).length;
        if (doneCount >= 2) {
          api.say("system",
            "**Ole Semrau**\n" +
            "Fast geschafft – dir fehlt nur noch ein QR‑Spot. Danach gibt's direkt den WLAN‑Code."
          );
          return;
        }

        if (state.flags.q_finale_started && doneCount === 0) {
          api.say("system",
            "**Ole Semrau**\n" +
            "Fürs Aula‑Finale brauchst du den WLAN‑Code. Starte am besten beim Aushang in der Pausenhalle."
          );
          return;
        }

        api.say("system",
          "**Ole Semrau**\n" +
          talkCycle(state, "semrau_progress", [
            "QR‑Rallye! Scanne drei Spots:\n1) Pausenhalle‑Aushang\n2) Mensa‑Ausgabe\n3) Sporthalle‑Anzeigetafel\nDann kommst du wieder.",
            `Aktueller Stand: ${doneCount}/3 QR‑Spots erledigt.`,
            "Tipp: Alle Spots liegen auf Hauptwegen – du musst keinen Umweg laufen."
          ])
        );
      }
    },

    fischer: {
      name: "Dr. Jan‑Wilhelm Fischer",
      role: "Mathematik / Informatik",
      aliases: ["fischer", "dr fischer", "jan"],
      description: "Mathe/Info – er erklärt Sachen so, dass sie plötzlich Sinn ergeben (meistens).",
      onTalk: (state, api) => {
        state.flags.q_kaenguru_started = true;

        if (state.flags.q_kaenguru_done){
          api.say("system", "**Dr. Fischer**\nDanke! Viel Erfolg beim Knobeln.");
          return;
        }
        if (api.hasItem("kaenguru_bogen")){
          api.say("system", "**Dr. Fischer**\nGib ihn mir: `gib kaenguru_bogen fischer`.");
          return;
        }
        api.say("system",
          "**Dr. Fischer**\n" +
          "Ich brauche den **Känguru‑Bogen** als Ausdruck. Drucker im IT‑Labor."
        );
      }
    },

    kraemer: {
      name: "Kevin Krämer",
      role: "Naturwissenschaften",
      aliases: ["kraemer", "krämer", "kevin"],
      description: "NaWi‑Vibes: Experimente, Sammlungen, und ‚bitte Schutzbrille‘.",
      onTalk: (state, api) => {
        state.flags.q_nawi_started = true;

        if (api.hasItem("werkstattpass")){
          api.say("system", "**Kevin Krämer**\nWerkstatt‑Pass ist raus. Viel Spaß – und bitte ordentlich.");
          return;
        }
        if (api.hasItem("laborbrille")){
          api.say("system", "**Kevin Krämer**\nGib sie mir: `gib laborbrille kraemer`.");
          return;
        }
        api.say("system",
          "**Kevin Krämer**\n" +
          "Für die Sammlungen brauche ich noch eine **Schutzbrille**. Hausmeister‑Stützpunkt – Brillen‑Kiste."
        );
      }
    },

    religa: {
      name: "Christoph Religa",
      role: "Sport und Ganztag",
      aliases: ["religa", "christoph"],
      description: "Sport‑Energie: motivierend, direkt, fair. Und er hasst platte Bälle.",
      onTalk: (state, api) => {
        if (state.flags.q_tribuene_started && !state.flags.q_tribuene_done){
          state.flags.q_tribuene_done = true;
          api.changeReputation("religa", 1);
          api.say("system",
            "**Christoph Religa**\n" +
            "Starker Blick von der Tribüne. Das motiviert das Team direkt.\n" +
            "✅ Nebenaufgabe abgeschlossen: **Tribünen‑Gruß**\n" +
            "🏟️ Kosmetik: ‚Team Sport‘ nickt dir anerkennend zu."
          );
          return;
        }

        state.flags.q_sport_started = true;

        if (api.hasItem("sportpass")){
          api.say("system", "**Christoph Religa**\nSportplatz‑Pass hast du. Denk dran: Fair Play.");
          return;
        }
        if (api.hasItem("ballpumpe")){
          api.say("system", "**Christoph Religa**\nGib sie mir: `gib ballpumpe religa`.");
          return;
        }
        api.say("system",
          "**Christoph Religa**\n" +
          "Ich brauche dringend eine **Ballpumpe**. Such in der Sporthalle im Geräteraum."
        );
      }
    },

    kretzer: {
      name: "Kay Kretzer",
      role: "Arbeit‑Wirtschaft‑Technik (AWT)",
      aliases: ["kretzer", "kay"],
      description: "AWT‑Werkstatt: Schrauben, Holz, Ideen. Und ein Auge für Sicherheit.",
      onTalk: (state, api) => {
        if (!state.flags.q_werkbank_started){
          state.flags.q_werkbank_started = true;
          api.say("system", "**Kay Kretzer**\nKannst du kurz einen Blick auf die Werkzeugbank werfen? Da fehlt angeblich ein Hinweiszettel.");
          return;
        }

        if (state.flags.q_werkbank_checked && !state.flags.q_werkbank_done){
          state.flags.q_werkbank_done = true;
          api.changeReputation("kretzer", 1);
          api.say("system",
            "**Kay Kretzer**\n" +
            "Top, genau den Hinweis brauchte ich.\n" +
            "✅ Nebenaufgabe abgeschlossen: **Werkbank‑Check**\n" +
            "🔧 Vorteil: Du kennst jetzt eine nützliche Abkürzung über die Werkstattwege."
          );
          return;
        }

        if (!api.hasItem("werkstattpass")){
          api.say("system",
            "**Kay Kretzer**\n" +
            "Werkstatt ist nur mit **Werkstatt‑Pass**. Frag bei Krämer nach, der verteilt die Zugänge heute."
          );
          return;
        }
        api.say("system",
          "**Kay Kretzer**\n" +
          "Wenn du schon drin bist: untersuche mal die Werkzeugbank – da liegt manchmal was Spannendes."
        );
      }
    },

    woehler: {
      name: "Alexander Wöhler",
      role: "Gesellschaftswissenschaften",
      aliases: ["woehler", "wöhler", "alexander"],
      description: "Gesellschaft: Fragen stellen, Perspektiven wechseln, diskutieren ohne Stress.",
      onTalk: (state, api) => {
        api.say("system",
          "**Alexander Wöhler**\n" +
          "Wenn du dich orientieren willst: Die Mini‑Karte links zeigt dir die Wege. Gesperrte Wege sind markiert."
        );
      }
    },

    remmers: {
      name: "Kathrin Remmers",
      role: "Deutsch und Darstellendes Spiel",
      aliases: ["remmers", "kathrin"],
      description: "Deutsch/DS: Text, Bühne, Timing. Und ein sehr ernstes Gesicht, wenn Seiten fehlen.",
      onTalk: (state, api) => {
        state.flags.q_theater_started = true;

        if (state.flags.q_theater_done){
          api.say("system", "**Kathrin Remmers**\nDanke! Ohne Seite keine Probe.");
          return;
        }
        if (api.hasItem("skript_seite")){
          api.say("system", "**Kathrin Remmers**\nGib sie mir: `gib skript_seite remmers`.");
          return;
        }
        api.say("system",
          "**Kathrin Remmers**\n" +
          "Mir fehlt eine **Skript‑Seite**. Schau in der Aula bei den Sitzreihen."
        );
      }
    },

    steinbeck: {
      name: "Johanna Steinbeck",
      role: "Fremdsprachen (kommissarisch)",
      aliases: ["steinbeck", "johanna"],
      description: "Sprachen: Sie hört Fehler, bevor du sie aussprichst – aber nett dabei.",
      onTalk: (state, api) => {
        state.flags.q_sprachen_started = true;

        if (state.flags.q_sprachen_done){
          api.say("system", "**Johanna Steinbeck**\nSuper. Danke!");
          return;
        }
        if (api.hasItem("vokabelkarten")){
          api.say("system", "**Johanna Steinbeck**\nGib sie mir: `gib vokabelkarten steinbeck`.");
          return;
        }
        api.say("system",
          "**Johanna Steinbeck**\n" +
          "Mir fehlen **Vokabelkarten**. Ich wette, die sind in der Cafeteria gelandet…"
        );
      }
    },

    peper: {
      name: "Kristina Peper",
      role: "Inklusion",
      aliases: ["peper", "kristina"],
      description: "Sie achtet darauf, dass Wege für alle funktionieren. Und sie sieht Details sofort.",
      onTalk: (state, api) => {
        if (!state.flags.q_barriere_started){
          state.flags.q_barriere_started = true;
          api.say("system",
            "**Kristina Peper**\n" +
            "Hast du kurz Zeit für einen **Barriere‑Check**? Schau dir bitte das Wegweiser‑Schild auf dem Schulhof an."
          );
          return;
        }

        if (state.flags.q_barriere_done){
          api.say("system", "**Kristina Peper**\nDanke nochmal. Deine Rückmeldung hat dem Team richtig geholfen.");
          return;
        }

        if (state.flags.q_barriere_schild){
          state.flags.q_barriere_done = true;
          api.changeReputation("peper", 1);
          api.say("system",
            "**Kristina Peper**\n" +
            "Super beobachtet. Ich notiere das direkt fürs Team.\n" +
            "✅ Nebenaufgabe abgeschlossen: **Barriere‑Check**\n" +
            "🙂 Sympathie‑Boost bei Kristina Peper."
          );
          return;
        }

        api.say("system",
          "**Kristina Peper**\n" +
          "Wenn du heute unterwegs bist: Achte auf Barrieren. Kleine Dinge machen viel aus."
        );
      }
    }
  },

  locations: {
    pausenhalle: {
      name: "Pausenhalle",
      image: "./assets/sv_ecke.png",
      description:
        "Der Treffpunkt. Stimmen, Schritte, Snack‑Geruch. Von hier kommst du (fast) überall hin.",
      exits: [
        { to: "sekretariat", label: "Sekretariat", aliases: ["sekretariat"] },
        { to: "mensa", label: "Mensa", aliases: ["mensa"] },
        { to: "mediothek", label: "Mediothek", aliases: ["bücherei", "buecherei", "mediothek"] },
        { to: "trakt3", label: "Trakt 3 (neue Räume)", aliases: ["trakt 3", "trakt3", "neue räume", "neue raeume"] },
        { to: "aula", label: "Aula", aliases: ["aula"] },
        { to: "sporthalle", label: "Sporthalle", aliases: ["sporthalle", "halle"] },
        { to: "schulhof", label: "Schulhof", aliases: ["schulhof", "hof"] },
        { to: "sv_ecke", label: "SV‑Ecke", aliases: ["sv", "sv ecke", "sv-ecke"] }
      ],
      items: [],
      npcs: ["peper"],
      objects: {
        info_aushang: {
          name: "Info‑Aushang",
          aliases: ["aushang", "info", "info aushang"],
          description: "Ein Aushang mit QR‑Code und zu vielen Pfeilen.",
          onExamine: (state, api) => {
            if (!state.flags.q_qr_started){
              api.say("system", "Du siehst einen QR‑Code. Vielleicht kennt jemand die Regeln dazu (Semrau?).");
              return;
            }
            if (state.flags.qr_spot1){
              api.say("system", "QR‑Spot 1 hast du schon gescannt.");
              return;
            }
            state.flags.qr_spot1 = true;
            api.say("system", "✅ QR‑Spot 1 gescannt. (Pausenhalle)");
          }
        },
        bank: {
          name: "Sitzbank",
          aliases: ["bank", "sitzbank"],
          description: "Eine Bank. Unter ihr liegt… Staub. Oder doch etwas?",
          onExamine: (state, api) => {
            api.say("system", "Nur Staub. Aber du merkst dir: In der Cafeteria landen oft verlorene Zettel.");
          }
        }
      }
    },

    schulhof: {
      name: "Schulhof",
      image: "./assets/schulhof.png",
      description:
        "Draußen. Luft, Geräusche, irgendwo ein Ball. Du kannst von hier aus in Ruhe planen.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
        { to: "sportplatz", label: "Zum Sportplatz", aliases: ["sportplatz"], locked: true, lock: { type: "item", itemId: "sportpass" }, lockedText: "Zum Sportplatz geht’s heute nur mit **Sportplatz‑Pass**." }
      ],
      items: [],
      npcs: [],
      objects: {
        schild: {
          name: "Wegweiser‑Schild",
          aliases: ["schild", "wegweiser"],
          description: "Pfeile: Aula, Mensa, Sporthalle… und ein kleines ‚Bitte nicht über die Beete‘.",
          onExamine: (state, api) => {
            if (state.flags.q_barriere_started && !state.flags.q_barriere_schild){
              state.flags.q_barriere_schild = true;
              api.say("system", "✅ Du notierst dir einen Hinweis fürs Leitsystem. Melde dich bei Kristina Peper zurück.");
              return;
            }
            api.say("system", "Du fühlst dich kurz wie in einem Open‑World‑Game – nur mit Pausengong.");
          }
        }
      }
    },

    sv_ecke: {
      name: "SV‑Ecke",
      image: "./assets/sv_ecke.png",
      description:
        "Ein Bereich mit Pinnwand, ein paar Stühlen und sehr vielen Ideen.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
        { to: "personalrat", label: "Personalrat / Gremien", aliases: ["gremien", "personalrat"] }
      ],
      items: [],
      npcs: [],
      objects: {
        pinnwand: {
          name: "Pinnwand",
          aliases: ["pinnwand", "board"],
          description: "Zettel, Termine, Aufrufe. Einer davon schreit: ‚HILFE FÜR DIE AULA‘.",
          onExamine: (state, api) => {
            api.say("system", "Tipp: Für das Aula‑Finale brauchst du Dinge aus verschiedenen Ecken. Die Karte links hilft.");
          }
        }
      }
    },

    sekretariat: {
      name: "Sekretariat",
      image: "./assets/sekretariat.png",
      description:
        "Telefonklingeln, Ordner, freundliches Chaos. Hier sitzt das organisatorische Gehirn der Schule.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
        { to: "sekretariat2", label: "Sekretariat 2", aliases: ["sekretariat2", "sekretariat 2"] },
        { to: "schulleitung", label: "Schulleitung", aliases: ["schulleitung"] },
        { to: "lehrerzimmer", label: "Lehrerzimmer", aliases: ["lehrerzimmer"] },
        { to: "personalrat", label: "Personalrat / Gremien", aliases: ["gremien", "personalrat"] },
        { to: "beratungsraum", label: "Beratung", aliases: ["beratung", "beratungsraum"] },
        { to: "kunstwerkstatt", label: "Kunstwerkstatt", aliases: ["kunst", "kunstwerkstatt"] }
      ],
      items: [],
      npcs: ["pietsch"],
      objects: {}
    },

    sekretariat2: {
      name: "Sekretariat 2",
      image: "./assets/sekretariat.png",
      description:
        "Die zweite Schaltzentrale. Viele Unterlagen. Sehr viel ‚kurz mal‘.",
      exits: [
        { to: "sekretariat", label: "Zurück ins Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["borges", "bouda"],
      objects: {
        materialschublade: {
          name: "Materialschublade",
          aliases: ["schublade", "material", "materialschublade"],
          description: "Eine Schublade mit Stiften, Klammern… und?",
          onExamine: (state, api) => {
            if (!state.flags.q_kunst_started){
              api.say("system", "Du siehst ein Pinselset, lässt es aber liegen. Vielleicht fragt dich jemand danach.");
              return;
            }
            if (api.hasItem("pinselset")){
              api.say("system", "Du hast das Pinselset schon.");
              return;
            }
            api.giveItem("pinselset");
            api.say("system", "Du nimmst ein **Pinselset** aus der Schublade.");
          }
        }
      }
    },

    schulleitung: {
      name: "Schulleitung",
      image: "./assets/personalrat.png",
      description:
        "Hier werden Entscheidungen getroffen. Und sehr viele Termine koordiniert.",
      exits: [
        { to: "sekretariat", label: "Zurück ins Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["ommen", "seiberlich", "stunkel", "janssen"],
      objects: {}
    },

    personalrat: {
      name: "Personalrat / Gremien",
      image: "./assets/personalrat.png",
      description:
        "Ein Raum für Gespräche, Aushänge und klare Absprachen.",
      exits: [
        { to: "sekretariat", label: "Zum Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] },
        { to: "sv_ecke", label: "Zur SV‑Ecke", aliases: ["sv", "sv ecke"] }
      ],
      items: [],
      npcs: ["thienel", "hoffrichter"],
      objects: {
        aushangbrett: {
          name: "Aushangbrett",
          aliases: ["aushang", "brett", "aushangbrett"],
          description: "Viele Infos. Einige brauchen dringend frisches Klebeband.",
          onExamine: (state, api) => {
            api.say("system", "Hier hängt alles, was nicht verloren gehen darf. Und trotzdem geht’s manchmal verloren.");
          }
        }
      }
    },

    beratungsraum: {
      name: "Beratungsraum",
      image: "./assets/beratungsraum.png",
      description:
        "Ruhig. Ein Ort zum Reden, Sortieren, Durchatmen.",
      exits: [
        { to: "sekretariat", label: "Zum Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["jeske"],
      objects: {
        ruhekarte: {
          name: "Ruhekarte",
          aliases: ["ruhe", "ruhekarte", "atemkarte"],
          description: "Eine kleine Karte mit Atemtipp und kurzer Checkliste für stressige Momente.",
          onExamine: (state, api) => {
            if (state.flags.q_atem_started){
              api.say("system", "Du hast die Ruhekarte schon gelesen. Vielleicht freut sich Simona Jeske über den Hinweis.");
              return;
            }
            state.flags.q_atem_started = true;
            api.say("system", "🧘 Nebenaufgabe gestartet: **Atempause**. Nimm den Hinweis mit zu Simona Jeske.");
          }
        }
      }
    },

    kunstwerkstatt: {
      name: "Kunstwerkstatt",
      image: "./assets/kunstwerkstatt.png",
      description:
        "Farben, Papier, Ideen. Hier wird ‚Chaos‘ zu ‚Kunst‘ umbenannt.",
      exits: [
        { to: "sekretariat", label: "Zum Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["frech"],
      objects: {
        staffelei: {
          name: "Staffelei",
          aliases: ["staffelei", "easel"],
          description: "Eine Staffelei mit halbfertigem Plakat.",
          onExamine: (state, api) => {
            api.say("system", "Du bekommst spontan Lust, ein Schulhof‑Poster zu gestalten.");
          }
        }
      }
    },

    mediothek: {
      name: "Mediothek",
      image: "./assets/bibliothek.png",
      description:
        "Regale, Arbeitsplätze, leises Tippen. Ein guter Ort zum Durchatmen (und für Hinweise).",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
        { to: "it_labor", label: "IT‑Labor", aliases: ["it", "it labor", "it-labor"], locked: true, lock: { type: "item", itemId: "it_pass" }, lockedText: "Tür zu. Du brauchst einen **IT‑Pass**." },
        { to: "mathe_flur", label: "Mathe/Info‑Flur", aliases: ["mathe", "mathe flur", "info", "mathe/info"] }
      ],
      items: [],
      npcs: ["sauer", "semrau"],
      objects: {
        schild: {
          name: "Schild (Codewort)",
          aliases: ["schild", "codewort", "code"],
          description: "Ein Schild: ‚Codewort der Woche: MEDIOTHEK‘",
          onExamine: (state, api) => {
            state.flags.saw_codeword_mediothek = true;
            api.say("system", "Du merkst dir das Codewort: **mediothek**. (Tipp: `antworte mediothek` im Sekretariat.)");
          }
        },
        methodenregal: {
          name: "Methodenregal",
          aliases: ["regal", "methoden", "methodenregal"],
          description: "Ein Regal mit Boxen: Klassenrat, Gespräch, Team.",
          onExamine: (state, api) => {
            if (!state.flags.q_frieden_started){
              api.say("system", "Viele Boxen. Du bist beeindruckt. Und leicht überfordert.");
              return;
            }
            if (api.hasItem("konfliktkarten")){
              api.say("system", "Die Konfliktkarten hast du schon.");
              return;
            }
            api.giveItem("konfliktkarten");
            api.say("system", "Du findest **Konfliktkarten** im Methodenregal.");
          }
        }
      }
    },

    it_labor: {
      name: "IT‑Labor",
      image: "./assets/mathe_informatik.png",
      description:
        "Monitore, Tastaturen, ein Drucker, der geheimnisvoll brummt.",
      exits: [
        { to: "mediothek", label: "Zurück zur Mediothek", aliases: ["mediothek", "zurück", "zurueck"] },
        { to: "serverraum", label: "Serverraum", aliases: ["server", "serverraum"], locked: true, lock: { type: "item", itemId: "wifi_code" }, lockedText: "Tür mit Codepad. Ohne **WLAN‑Code** kommst du nicht rein." }
      ],
      items: [],
      npcs: ["gotzkowsky"],
      objects: {
        drucker: {
          name: "Drucker",
          aliases: ["drucker", "printer"],
          description: "Ein Drucker. Wenn er will, spuckt er Papier aus.",
          onExamine: (state, api) => {
            if (state.flags.q_plan_started && !api.hasItem("stundenplan") && !state.flags.q_plan_done){
              api.giveItem("stundenplan");
              api.say("system", "Der Drucker spuckt einen **Stundenplan** aus. Frisch, warm, offiziell.");
              return;
            }

            if (state.flags.q_kaenguru_started && !api.hasItem("kaenguru_bogen") && !state.flags.q_kaenguru_done){
              api.giveItem("kaenguru_bogen");
              api.say("system", "Du druckst den **Känguru‑Bogen** aus. Achtung: Denkaufgaben!");
              return;
            }

            if (state.flags.q_dienstplan_started && !api.hasItem("dienstplan") && !state.flags.q_dienstplan_done){
              api.giveItem("dienstplan");
              api.say("system", "Der **Dienstplan** kommt raus. Sieht nach Verantwortung aus.");
              return;
            }

            if (state.flags.q_finale_started && !api.hasItem("programmflyer")){
              api.giveItem("programmflyer");
              api.say("system", "Du druckst den **Programmflyer** für den Tag der offenen Tür.");
              return;
            }

            api.say("system", "Der Drucker brummt… aber gerade ist nichts zu drucken (oder keine Quest aktiv).");
          }
        }
      }
    },

    serverraum: {
      name: "Serverraum",
      image: "./assets/serverraum.png",
      description:
        "Kühl, leise, viele Lämpchen. Du spürst: Hier wohnt das WLAN.",
      exits: [
        { to: "it_labor", label: "Zurück ins IT‑Labor", aliases: ["it", "it labor", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: [],
      objects: {
        rack: {
          name: "Server‑Rack",
          aliases: ["rack", "server", "schrank"],
          description: "Ein Rack voller Technik. Du siehst Ports, Kabel, und eine kleine Checkliste am Rand.",
          onExamine: (state, api) => {
            if (!state.flags.q_finale_started){
              api.say("system", "Du hast keine offizielle Mission hier. Trotzdem faszinierend.");
              return;
            }
            if (state.flags.server_ok){
              api.say("system", "✅ Beamer‑Config steht. Alles stabil.");
              return;
            }
            state.flags.server_ok = true;
            api.say("system",
              "Du findest die Beamer‑Config und setzt alles neu.\n" +
              "✅ Serverraum‑Aufgabe erledigt. (Beamer & WLAN stabil)"
            );
          }
        }
      }
    },

    lehrerzimmer: {
      name: "Lehrerzimmer",
      image: "./assets/lehrerzimmer.png",
      description:
        "Kaffeegeruch, Listen, Stapel. Du bist nur kurz hier – versprochen.",
      exits: [
        { to: "sekretariat", label: "Zurück ins Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["steinbeck", "remmers"],
      objects: {
        schrank: {
          name: "Kabel‑Schrank",
          aliases: ["schrank", "kabelschrank", "kabel"],
          description: "Ein Schrank mit Technik‑Zubehör. Er ist abgeschlossen.",
          onExamine: (state, api) => {
            if (!api.hasItem("schrankkarte")){
              api.say("system", "Abgeschlossen. Du brauchst eine **Schrankkarte** (Sekretariat 2).");
              return;
            }
            if (api.hasItem("usb_c_kabel")){
              api.say("system", "Du hast das Kabel schon.");
              return;
            }
            api.giveItem("usb_c_kabel");
            api.say("system", "Du öffnest den Schrank und findest ein **USB‑C‑Kabel**.");
          }
        },
        technikschublade: {
          name: "Technikschublade",
          aliases: ["schublade", "technik", "technikschublade"],
          description: "Eine Schublade mit Adaptern, Kabelbindern und seltsamen Steckern.",
          onExamine: (state, api) => {
            if (!state.flags.q_finale_started){
              api.say("system", "Viele Adapter. Du bist kurz versucht, einen mitzunehmen.");
              return;
            }
            if (api.hasItem("hdmi_adapter")){
              api.say("system", "HDMI‑Adapter hast du schon.");
              return;
            }
            api.giveItem("hdmi_adapter");
            api.say("system", "Du findest den gesuchten **HDMI‑Adapter**.");
          }
        }
      }
    },

    mathe_flur: {
      name: "Mathe/Info‑Flur",
      image: "./assets/mathe_informatik.png",
      description:
        "Knobel‑Poster, Rechner‑Aushänge und irgendwo ein ‚Bitte leise‘‑Schild, das niemand beachtet.",
      exits: [
        { to: "mediothek", label: "Zur Mediothek", aliases: ["mediothek", "zurück", "zurueck"] },
        { to: "naturwissenschaften", label: "NaWi‑Räume", aliases: ["nawi", "natur", "naturwissenschaften"] }
      ],
      items: [],
      npcs: ["fischer"],
      groupScenes: [
        {
          id: "flur_knobelrunde",
          triggers: ["enter", "talk"],
          cooldown: 4,
          chance: 0.7,
          lines: [
            { speaker: "Dr. Fischer", text: "Kurze Denkpause: Wer den Drucker sucht, ist im IT‑Labor besser aufgehoben." },
            { speaker: "Schülerstimme", text: "Und wer eine Challenge sucht: Känguru‑Bogen ist heute heiß begehrt." }
          ],
          hint: "Optional: `rede fischer` startet die Mathe‑Quest, ist aber kein Pflichtweg.",
          effect: { type: "adjustReputation", key: "matheflur", delta: 1, text: "📈 Dein Ruf im Mathe/Info‑Flur steigt leicht." }
        }
      ],
      objects: {}
    },

    naturwissenschaften: {
      name: "Naturwissenschaften",
      image: "./assets/naturwissenschaften.png",
      description:
        "Modelle, Poster, eine Sammlung, die normalerweise verschlossen ist. Es riecht nach ‚Experiment‘.",
      exits: [
        { to: "mathe_flur", label: "Zurück zum Flur", aliases: ["flur", "zurück", "zurueck"] },
        { to: "awt_werkstatt", label: "AWT‑Werkstatt", aliases: ["awt", "werkstatt"], locked: true, lock: { type: "item", itemId: "werkstattpass" }, lockedText: "Werkstatt ist gesperrt. Du brauchst einen **Werkstatt‑Pass**." }
      ],
      items: [],
      npcs: ["kraemer"],
      objects: {
        sammlung: {
          name: "Sammlungstür",
          aliases: ["sammlung", "tür", "tuer"],
          description: "Eine Tür mit Schild: ‚Nur unter Aufsicht‘.",
          onExamine: (state, api) => {
            api.say("system", "Du fühlst dich kurz wie vor einem Endboss – nur mit Chemie‑Poster.");
          }
        }
      }
    },

    awt_werkstatt: {
      name: "AWT‑Werkstatt",
      image: "./assets/awt_werkstatt.png",
      description:
        "Werkbänke, Werkzeuge, Holz – und die Regel: erst denken, dann bohren.",
      exits: [
        { to: "naturwissenschaften", label: "Zurück zu NaWi", aliases: ["nawi", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["kretzer"],
      objects: {
        werkzeugbank: {
          name: "Werkzeugbank",
          aliases: ["bank", "werkzeug", "werkzeugbank"],
          description: "Eine Werkbank voller Ordnung (und trotzdem findet man nichts).",
          onExamine: (state, api) => {
            if (state.flags.q_werkbank_started && !state.flags.q_werkbank_checked){
              state.flags.q_werkbank_checked = true;
              api.say("system", "📝 Du findest den gesuchten Hinweiszettel zwischen den Werkzeugkästen.");
              return;
            }
            api.say("system", "Du findest: Kabelbinder. Holzreste. Und den Drang, etwas zu bauen.");
          }
        }
      }
    },

    trakt3: {
      name: "Trakt 3",
      image: "./assets/kunstwerkstatt.png",
      description:
        "Neue Klassenräume, helle Flure, irgendwo sind gemütliche Sitzecken.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
        {
          to: "bruecke",
          label: "Brücke Richtung Trakt 2",
          aliases: ["brücke", "bruecke", "trakt 2", "trakt2"],
          locked: true,
          lock: { type: "item", itemId: "baustellenpass" },
          lockedText: "Ein Bauzaun blockiert den Weg. Ohne **Baustellenpass** kommst du nicht rüber."
        }
      ],
      items: [],
      npcs: ["spohr"],
      objects: {
        aushang_baustelle: {
          name: "Baustellen‑Aushang",
          aliases: ["baustelle", "aushang baustelle", "baustellen aushang", "aushang"],
          description: "Infos über den Umbau. Jemand hat ein paar Stichpunkte notiert.",
          onExamine: (state, api) => {
            if (!state.flags.q_presse_started){
              api.say("system", "Du liest den Aushang. Für einen Bericht wäre das nützlich – falls dich jemand darum bittet.");
              return;
            }
            if (api.hasItem("presse_notiz")){
              api.say("system", "Du hast die Notiz schon.");
              return;
            }
            api.giveItem("presse_notiz");
            api.say("system", "Du schreibst eine **Baustellen‑Notiz** für den Mini‑Bericht.");
          }
        }
      }
    },

    bruecke: {
      name: "Brücke",
      image: "./assets/mathe_informatik.png",
      description:
        "Eine Verbindung über die Baustelle. Du fühlst dich kurz wie in einem Abenteuerfilm, nur mit Schulrucksack.",
      exits: [
        { to: "trakt3", label: "Zurück nach Trakt 3", aliases: ["trakt3", "trakt 3", "zurück", "zurueck"] },
        { to: "hausmeister", label: "Hausmeister‑Stützpunkt", aliases: ["hausmeister", "stützpunkt", "stuetzpunkt"] }
      ],
      items: [],
      npcs: [],
      objects: {}
    },

    hausmeister: {
      name: "Hausmeister‑Stützpunkt",
      image: "./assets/awt_werkstatt.png",
      description:
        "Werkzeug, Ersatzteile, Kisten. Hier findet man Dinge – und manchmal genau das, was man braucht.",
      exits: [
        { to: "bruecke", label: "Zur Brücke", aliases: ["brücke", "bruecke", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["michaelis"],
      objects: {
        fundkiste: {
          name: "Fundkiste",
          aliases: ["fundkiste", "fundbüro", "fundbuero", "kiste"],
          description: "Eine Kiste mit gefundenen Sachen. Vielleicht ist dein Chip hier drin…",
          onExamine: (state, api) => {
            if (api.hasItem("transponderchip")) {
              api.say("system", "Du hast deinen Chip ja schon.");
              return;
            }
            api.giveItem("transponderchip");
            api.say("system", "Yes! Du findest deinen **Transponderchip** in der Fundkiste.");
          }
        },
        werkzeugwand: {
          name: "Werkzeugwand",
          aliases: ["werkzeugwand", "wand", "werkzeug"],
          description: "Haken, Zangen, Rollen. Eine Rolle Klebeband lacht dich an.",
          onExamine: (state, api) => {
            if (!state.flags.q_poster_started){
              api.say("system", "Hier hängt Klebeband. Vielleicht brauchst du das später.");
              return;
            }
            if (api.hasItem("klebeband")){
              api.say("system", "Klebeband hast du schon.");
              return;
            }
            api.giveItem("klebeband");
            api.say("system", "Du nimmst eine Rolle **Klebeband**.");
          }
        },
        brillenkiste: {
          name: "Brillen‑Kiste",
          aliases: ["brillen", "brille", "kiste"],
          description: "Eine Kiste mit Schutzbrillen in verschiedenen Größen.",
          onExamine: (state, api) => {
            if (!state.flags.q_nawi_started){
              api.say("system", "Schutzbrillen. Sicher ist sicher.");
              return;
            }
            if (api.hasItem("laborbrille")){
              api.say("system", "Du hast schon eine Schutzbrille.");
              return;
            }
            api.giveItem("laborbrille");
            api.say("system", "Du nimmst eine **Schutzbrille**.");
          }
        }
      }
    },

    mensa: {
      name: "Mensa",
      image: "./assets/cafeteria.png",
      description:
        "Tische, Tabletts, Essensgeruch. Ohne Chip geht hier wenig.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
        { to: "cafeteria", label: "Zur Cafeteria", aliases: ["cafeteria"] }
      ],
      items: [],
      npcs: [],
      groupScenes: [
        {
          id: "mensa_chiptalk",
          triggers: ["enter", "talk"],
          cooldown: 5,
          chance: 0.75,
          lines: [
            { speaker: "Mensa‑Team", text: "Heute läuft es flott – mit Chip geht’s am schnellsten." },
            { speaker: "Stimme aus der Schlange", text: "Wenn dir was fehlt: Hausmeister oder Sekretariat helfen oft weiter." }
          ],
          hint: "Optionaler Hinweis: Für Mensa‑Fortschritt lohnt sich `untersuche ausgabe`.",
          effect: [
            { type: "setFlag", key: "heard_mensa_group_hint" },
            { type: "adjustReputation", key: "mensa", delta: 1, text: "🙂 Die Stimmung bleibt freundlich – dein Ruf in der Mensa verbessert sich." }
          ]
        }
      ],
      objects: {
        ausgabe: {
          name: "Ausgabe",
          aliases: ["ausgabe", "essen", "theke"],
          description: "Die Essensausgabe. Hier wird’s ernst.",
          onExamine: (state, api) => {
            if (state.flags.q_qr_started && !state.flags.qr_spot2){
              state.flags.qr_spot2 = true;
              api.say("system", "✅ QR‑Spot 2 gescannt. (Mensa)");
              return;
            }

            if (!api.hasItem("transponderchip")){
              api.say("system", "Die Ausgabe schaut dich an: ‚Ohne Chip kein Essen.‘");
              return;
            }
            state.flags.q_mensa_done = true;
            api.say("system", "✅ Du hältst deinen Chip hin. Du bist offiziell **mensa‑ready**.");
          }
        }
      }
    },

    cafeteria: {
      name: "Cafeteria",
      image: "./assets/cafeteria.png",
      description:
        "Snacks, Getränke, ein bisschen Trubel. Hier verschwinden Dinge – und tauchen wieder auf.",
      exits: [
        { to: "mensa", label: "Zurück zur Mensa", aliases: ["mensa", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: [],
      objects: {
        fundkorb: {
          name: "Fundkorb",
          aliases: ["fundkorb", "korb", "fund"],
          description: "Ein Korb mit verlorenen Kleinigkeiten.",
          onExamine: (state, api) => {
            if (state.flags.q_finale_started && !api.hasItem("batterien")){
              api.giveItem("batterien");
              api.say("system", "Du findest **Batterien** im Fundkorb. Jackpot.");
              return;
            }
            api.say("system", "Nur Kleingeld, ein Radiergummi und… ein Löffel. Klassisch.");
          }
        },
        zuckerdose: {
          name: "Zuckerdose",
          aliases: ["zucker", "dose", "zuckerdose"],
          description: "Eine Dose, die ‚Zucker‘ sagt, aber nach Geheimversteck aussieht.",
          onExamine: (state, api) => {
            if (!state.flags.q_sprachen_started){
              api.say("system", "Du schaust rein. Nur Zucker. (Oder?)");
              return;
            }
            if (api.hasItem("vokabelkarten")){
              api.say("system", "Du hast die Vokabelkarten schon.");
              return;
            }
            api.giveItem("vokabelkarten");
            api.say("system", "Zwischen Zuckerpäckchen liegen **Vokabelkarten**. Wie sind die denn hier gelandet?");
          }
        }
      }
    },

    aula: {
      name: "Aula",
      image: "./assets/aula.png",
      description:
        "Bühne, Stuhlreihen, Licht. Hier finden die großen Momente statt.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["engel", "woehler"],
      groupScenes: [
        {
          id: "aula_vorprobe",
          triggers: ["enter"],
          cooldown: 4,
          chance: 0.65,
          lines: [
            { speaker: "Maren Engel", text: "Kurz und klar: Wir halten den Ablauf kompakt, dann klappt die Probe." },
            { speaker: "Dirk Wöhler", text: "Licht steht, Ton checken wir gleich nochmal." }
          ],
          hint: "Optional: `rede engel` oder `rede woehler` für individuelle Aufgaben.",
          effect: { type: "setFlag", key: "heard_aula_groupscene" }
        },
        {
          id: "aula_talkrunde",
          triggers: ["talk"],
          cooldown: 3,
          chance: 0.8,
          lines: [
            { speaker: "Bühnencrew", text: "Wir stimmen uns kurz ab: Sicherheit zuerst, dann Bühne frei." },
            { speaker: "Maren Engel", text: "Wenn du Material dabeihast, nimm gern den direkten Weg über `gib`." }
          ],
          hint: "Kein Pflichtpfad: Diese Runde liefert nur Orientierung fürs Finale.",
          effect: { type: "adjustReputation", key: "aula", delta: 1, text: "👏 Dein Ruf bei der Bühnencrew steigt ein wenig." }
        }
      ],
      objects: {
        sitzreihe: {
          name: "Sitzreihe",
          aliases: ["sitz", "sitzreihe", "stühle", "stuehle"],
          description: "Reihe um Reihe. Irgendwo klemmt Papier.",
          onExamine: (state, api) => {
            if (!state.flags.q_theater_started){
              api.say("system", "Du findest Krümel. Und das Gefühl, dass hier gestern jemand Chips gegessen hat.");
              return;
            }
            if (api.hasItem("skript_seite")){
              api.say("system", "Du hast die Skript‑Seite schon.");
              return;
            }
            api.giveItem("skript_seite");
            api.say("system", "Du findest eine **Skript‑Seite** zwischen den Sitzen.");
          }
        },
        buehne: {
          name: "Bühne",
          aliases: ["buehne", "bühne", "stage"],
          description: "Die Bühne. Wenn hier etwas schiefgeht, merkt es jeder.",
          onExamine: (state, api) => {
            if (!state.flags.q_finale_started){
              api.say("system", "Du stehst kurz auf der Bühne. Applaus in deinem Kopf. Dann gehst du wieder runter.");
              return;
            }
            if (state.flags.q_finale_done){
              api.say("system", "✅ Finale ist geschafft. Bühne steht. Team steht.");
              return;
            }

            const missing = [];
            if (!api.hasItem("checkliste")) missing.push("Checkliste");
            if (!api.hasItem("hdmi_adapter")) missing.push("HDMI‑Adapter");
            if (!api.hasItem("batterien")) missing.push("Batterien");
            if (!api.hasItem("programmflyer")) missing.push("Programmflyer");
            if (!api.hasItem("wifi_code")) missing.push("WLAN‑Code");
            if (!state.flags.server_ok) missing.push("Serverraum‑Fix");

            if (missing.length){
              api.say("system",
                "Noch nicht bereit. Es fehlt:\n" +
                "• " + missing.join("\n• ")
              );
              return;
            }

            state.flags.q_finale_done = true;
            api.giveItem("aula_badge");
            api.say("system",
              "🎉 **Aula‑Finale geschafft!**\n" +
              "Beamer läuft, Ton steht, Programmflyer sind da.\n" +
              "Du bekommst: **Aula‑Badge**."
            );
          }
        }
      }
    },

    sporthalle: {
      name: "Sporthalle",
      image: "./assets/sporthalle.png",
      description:
        "Hallengeruch, Linien auf dem Boden, Bälle, Echo. Hier wird Energie in Bewegung übersetzt.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["religa"],
      objects: {
        anzeigetafel: {
          name: "Anzeigetafel",
          aliases: ["anzeige", "anzeigetafel", "tafel"],
          description: "Sie zeigt 00:00. Und einen QR‑Sticker.",
          onExamine: (state, api) => {
            if (!state.flags.q_qr_started){
              api.say("system", "Du siehst einen QR‑Sticker. Vielleicht ist das Teil einer Rallye (Semrau?).");
              return;
            }
            if (state.flags.qr_spot3){
              api.say("system", "QR‑Spot 3 hast du schon.");
              return;
            }
            state.flags.qr_spot3 = true;
            api.say("system", "✅ QR‑Spot 3 gescannt. (Sporthalle)");
          }
        },
        geraeteraum: {
          name: "Geräteraum",
          aliases: ["geraeteraum", "geräte", "geraete"],
          description: "Bälle, Matten, Kisten. Der wahre Dungeon der Sporthalle.",
          onExamine: (state, api) => {
            if (!state.flags.q_sport_started){
              api.say("system", "Hier ist alles. Nur nicht das, was du gerade suchst.");
              return;
            }
            if (api.hasItem("ballpumpe")){
              api.say("system", "Du hast die Ballpumpe schon.");
              return;
            }
            api.giveItem("ballpumpe");
            api.say("system", "Du findest eine **Ballpumpe** in einer Kiste.");
          }
        }
      }
    },

    sportplatz: {
      name: "Sportplatz",
      image: "./assets/sportplatz.png",
      description:
        "Weite, Luft, Linien, Tore. Du hast’s bis hierher geschafft.",
      exits: [
        { to: "schulhof", label: "Zurück zum Schulhof", aliases: ["schulhof", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: [],
      objects: {
        tribuene: {
          name: "Kleine Tribüne",
          aliases: ["tribuene", "tribüne", "bank"],
          description: "Du setzt dich kurz. Das Leben ist gut, solange kein Sprinttest ansteht.",
          onExamine: (state, api) => {
            if (!state.flags.q_tribuene_started){
              state.flags.q_tribuene_started = true;
              api.say("system", "🏁 Nebenaufgabe gestartet: **Tribünen‑Gruß**. Religa freut sich über ein kurzes Update.");
              return;
            }
            api.say("system", "Du siehst die Schule aus einer anderen Perspektive. Orientierung: +10.");
          }
        }
      }
    }
  }
};
