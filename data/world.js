// data/world.js
// Hinweis: Diese Datei hängt absichtlich am globalen `window.WORLD` (kein ES-Module),
// damit das Spiel auch bei file:// (direkt aus dem Explorer) funktioniert.

(function(){
  const WORLD = {
    meta: {
      title: "KGS Text-Adventure",
      setting: "KGS Wilhelm-Röpke-Schule (KGS Schwarmstedt)"
    },

    map: {
      viewBox: "0 0 1000 600",
      nodes: {
        pausenhalle:   { x: 500, y: 270, label: "Pausenhalle" },
        sekretariat:   { x: 260, y: 270, label: "Sekretariat" },
        sekretariat2:  { x: 140, y: 190, label: "Sekr. 2" },
        schulleitung:  { x: 140, y: 370, label: "Schulleitung" },
        lehrerzimmer:  { x: 310, y: 410, label: "Lehrerzimmer" },

        mediothek:     { x: 740, y: 270, label: "Mediothek" },
        it_labor:      { x: 860, y: 190, label: "IT‑Labor" },

        mensa:         { x: 720, y: 440, label: "Mensa" },
        cafeteria:     { x: 880, y: 500, label: "Cafeteria" },

        trakt3:        { x: 500, y: 120, label: "Trakt 3" },
        bruecke:       { x: 660, y: 120, label: "Brücke" },
        hausmeister:   { x: 820, y: 120, label: "Hausmeister" },

        aula:          { x: 500, y: 520, label: "Aula" },
        sporthalle:    { x: 620, y: 540, label: "Sporthalle" }
      }
    },

    start: {
      locationId: "pausenhalle",
      inventory: ["schuelerausweis", "fuenf_euro"],
      flags: {}
    },

    quests: [
      {
        id: "mensa",
        title: "Mensa‑Ready",
        steps: [
          { text: "Sprich im Sekretariat mit Anja Pietsch.", done: s => !!s.flags.q_mensa_started },
          { text: "Hol das Codewort in der Mediothek (Schild untersuchen).", done: s => !!s.flags.saw_codeword_mediothek },
          { text: "Hole den Baustellenpass im Sekretariat (antworte mediothek).", done: s => (s.inventory || []).includes("baustellenpass") },
          { text: "Finde deinen Mensa‑Chip (Hausmeister‑Stützpunkt → Fundkiste).", done: s => (s.inventory || []).includes("transponderchip") },
          { text: "In die Mensa: untersuche „Ausgabe“.", done: s => !!s.flags.won_mensa },
        ]
      },
      {
        id: "ipad",
        title: "iPad‑Rettung",
        steps: [
          { text: "Rede in der Mediothek mit Thomas Sauer.", done: s => !!s.flags.q_ipad_started },
          { text: "Hole dir von Kerstin Borges (Sekretariat 2) eine Schrankkarte.", done: s => (s.inventory || []).includes("schrankkarte") },
          { text: "Im Lehrerzimmer: untersuche den Kabel‑Schrank.", done: s => (s.inventory || []).includes("usb_c_kabel") },
          { text: "Gib das USB‑C‑Kabel an Sauer zurück.", done: s => !!s.flags.q_ipad_done },
        ]
      },
      {
        id: "presse",
        title: "Presse‑AG Mini‑Bericht",
        steps: [
          { text: "Rede in der Aula mit Maren Engel.", done: s => !!s.flags.q_presse_started },
          { text: "Trakt 3: untersuche den Baustellen‑Aushang.", done: s => (s.inventory || []).includes("presse_notiz") },
          { text: "Gib die Notiz an Maren Engel.", done: s => !!s.flags.q_presse_done },
        ]
      },
      {
        id: "plan",
        title: "Stundenplan‑Chaos",
        steps: [
          { text: "Rede in der Schulleitung mit Mascha Seiberlich‑Ehrhardt.", done: s => !!s.flags.q_plan_started },
          { text: "Drucke im IT‑Labor den Stundenplan (Drucker untersuchen).", done: s => (s.inventory || []).includes("stundenplan") },
          { text: "Gib den Stundenplan an Jan Stünkel.", done: s => !!s.flags.q_plan_done },
        ]
      },
    ],

    items: {
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
        aliases: ["usb c kabel", "usbc", "kabel"],
        description: "Ein USB‑C‑Kabel. Genau das, was man immer sucht.",
        takeable: true
      },
      it_pass: {
        name: "IT‑Pass",
        aliases: ["it pass", "itpass", "technik-pass", "technikpass"],
        description: "Du darfst ins IT‑Labor, wenn du was brauchst.",
        takeable: false
      },
      presse_notiz: {
        name: "Presse‑Notiz",
        aliases: ["notiz", "presse", "presse-notiz"],
        description: "Notiz mit Fakten zum Umbau/Brücke. Perfekt für ein Mini‑Projekt.",
        takeable: true
      },
      stundenplan: {
        name: "Stundenplan‑Ausdruck",
        aliases: ["stundenplan", "plan", "ausdruck"],
        description: "Ein frischer Ausdruck. Riecht nach Drucker.",
        takeable: true
      },
      hallpass: {
        name: "Flur‑Pass",
        aliases: ["hallpass", "flurpass", "pass"],
        description: "Ein kleiner Pass: Du kommst ohne Umwege in die Sporthalle.",
        takeable: false
      }
    },

    npcs: {
      // Kontaktseite / Schulverwaltung (öffentlich auf der KGS-Seite)
      pietsch: {
        name: "Anja Pietsch",
        role: "Schülerangelegenheiten Oberstufe, Mittagessen",
        aliases: ["pietsch", "frau pietsch", "anja"],
        description: "Beschäftigt, aber freundlich. Wenn es um Mensa/Chip geht, weiß sie Bescheid.",
        onTalk: (state, api) => {
          state.flags.q_mensa_started = true;

          if (!api.hasItem("transponderchip")) {
            if (!api.hasItem("baustellenpass")) {
              api.say("system",
                "**Anja Pietsch** (Schülerangelegenheiten Oberstufe, Mittagessen)\n" +
                "Ohne Chip kannst du in der Mensa nichts bestellen.\n" +
                "Vielleicht liegt dein Chip im Hausmeister‑Stützpunkt (Fundkiste).\n" +
                "Wegen Umbau/Brücke brauchst du aber einen Baustellenpass.\n\n" +
                "Bring mir das Codewort aus der Mediothek (Schild untersuchen) und tippe dann: `antworte mediothek`."
              );
            } else {
              api.say("system",
                "**Anja Pietsch** (Schülerangelegenheiten Oberstufe, Mittagessen)\n" +
                "Du hast den Baustellenpass – super. Dann ab zur Fundkiste!"
              );
            }
          } else {
            api.say("system",
              "**Anja Pietsch** (Schülerangelegenheiten Oberstufe, Mittagessen)\n" +
              "Chip wieder da? Perfekt. Dann kann’s losgehen: ab in die Mensa."
            );
          }
        }
      },

      sauer: {
        name: "Thomas Sauer",
        role: "Technik, iPads, Homepage",
        aliases: ["sauer", "herr sauer", "thomas"],
        description: "Technik‑Ecke, Aushänge, Kabel… er wirkt wie jemand, der Probleme lösungsorientiert anguckt.",
        onTalk: (state, api) => {
          // startet Quest 2
          state.flags.q_ipad_started = true;

          if (state.flags.q_ipad_done) {
            api.say("system",
              "**Thomas Sauer** (Technik, iPads, Homepage)\n" +
              "Top, Kabelproblem gelöst. Wenn du was drucken musst: das IT‑Labor ist jetzt für dich ok."
            );
            return;
          }

          if (api.hasItem("usb_c_kabel")) {
            api.say("system",
              "**Thomas Sauer** (Technik, iPads, Homepage)\n" +
              "Ah! Du hast ein USB‑C‑Kabel. Gib es mir mit: `gib usb_c_kabel sauer`."
            );
            return;
          }

          api.say("system",
            "**Thomas Sauer** (Technik, iPads, Homepage)\n" +
            "Mini‑Notfall: Im iPad‑Wagen fehlt ein USB‑C‑Kabel.\n" +
            "Im Lehrerzimmer gibt’s einen Kabel‑Schrank – aber du brauchst eine Karte.\n" +
            "Frag in *Sekretariat 2* nach (Kerstin Borges)."
          );
        }
      },

      michaelis: {
        name: "Maik Michaelis",
        role: "Haustechnik, Wartung, Instandhaltung",
        aliases: ["michaelis", "hausmeister", "maik"],
        description: "Schlüssel, Werkzeug – und eine Fundkiste, die schon viele gerettet hat.",
        onTalk: (state, api) => {
          api.say("system",
            "**Maik Michaelis** (Haustechnik, Wartung, Instandhaltung)\n" +
            "Fundkiste? Da hinten. Wenn’s dein Chip ist, wirst du’s merken."
          );
        }
      },

      borges: {
        name: "Kerstin Borges",
        role: "Lehrerangelegenheiten, Budgetverwaltung",
        aliases: ["borges", "kerstin", "frau borges"],
        description: "Organisations‑Profi. Hier wird sortiert, gestempelt und geregelt.",
        onTalk: (state, api) => {
          if (!state.flags.q_ipad_started) {
            api.say("system",
              "**Kerstin Borges** (Lehrerangelegenheiten, Budgetverwaltung)\n" +
              "Hi! Wenn du was für den Unterricht brauchst, sag’s kurz und klar."
            );
            return;
          }

          if (!api.hasItem("schrankkarte")) {
            api.giveItem("schrankkarte");
            api.say("system",
              "**Kerstin Borges** (Lehrerangelegenheiten, Budgetverwaltung)\n" +
              "Ah, fürs Kabel? Hier – eine Schrankkarte. Bitte wieder abgeben (im Spiel: behalten 😉)."
            );
          } else {
            api.say("system",
              "**Kerstin Borges** (Lehrerangelegenheiten, Budgetverwaltung)\n" +
              "Du hast die Karte schon. Lehrerzimmer → Kabel‑Schrank untersuchen."
            );
          }
        }
      },

      bouda: {
        name: "Martina Bouda",
        role: "Lehrerangelegenheiten, Klassenfahrten",
        aliases: ["bouda", "martina", "frau bouda"],
        description: "Sie wirkt, als hätte sie schon 20 Listen im Kopf.",
        onTalk: (state, api) => {
          api.say("system",
            "**Martina Bouda** (Lehrerangelegenheiten, Klassenfahrten)\n" +
            "Wenn du mal wissen willst, wie viel Planung hinter Ausflügen steckt: sehr viel."
          );
        }
      },

      gotzkowsky: {
        name: "Dirk Gotzkowsky",
        role: "Unterrichtstechnik, PC's, Schulbücher",
        aliases: ["gotzkowsky", "dirk", "herr gotzkowsky"],
        description: "Er kann wahrscheinlich jeden Beamer mit einem Blick einschüchtern.",
        onTalk: (state, api) => {
          api.say("system",
            "**Dirk Gotzkowsky** (Unterrichtstechnik, PC's, Schulbücher)\n" +
            "Wenn ein Beamer flackert: einmal aus, einmal an. Wenn’s dann noch flackert: ich komme."
          );
        }
      },

      spohr: {
        name: "Matthias Spohr",
        role: "Haustechnik, Wartung, Instandhaltung",
        aliases: ["spohr", "matthias"],
        description: "Hausmeister‑Support. Kenner der Baustelle und der Wege durch die Schule.",
        onTalk: (state, api) => {
          api.say("system",
            "**Matthias Spohr** (Haustechnik, Wartung, Instandhaltung)\n" +
            "Trakt 3 hat einiges an neuen Räumen bekommen. Aushänge dazu findest du hier im Flur."
          );
        }
      },

      // Schulleitung (öffentlich)
      ommen: {
        name: "Tjark Ommen",
        role: "Gesamtschuldirektor",
        aliases: ["ommen", "herr ommen", "tjark"],
        description: "Ruhig, organisiert – Schulleitungs‑Energie.",
        onTalk: (state, api) => {
          api.say("system",
            "**Tjark Ommen** (Gesamtschuldirektor)\n" +
            "Hallo! Wenn du dich in der Schule zurechtfindest, ist schon viel gewonnen."
          );
        }
      },

      seiberlich: {
        name: "Mascha Seiberlich‑Ehrhardt",
        role: "Direktorstellvertreterin",
        aliases: ["seiberlich", "mascha", "frau seiberlich"],
        description: "Stundenpläne, Organisation, Lehrkräfteeinsatz – sie wirkt immer einen Schritt voraus.",
        onTalk: (state, api) => {
          state.flags.q_plan_started = true;

          if (state.flags.q_plan_done) {
            api.say("system",
              "**Mascha Seiberlich‑Ehrhardt** (Direktorstellvertreterin)\n" +
              "Gut, dass du den Plan abgegeben hast. Weniger Chaos, mehr Unterricht."
            );
            return;
          }

          if (!api.hasItem("it_pass")) {
            api.say("system",
              "**Mascha Seiberlich‑Ehrhardt** (Direktorstellvertreterin)\n" +
              "Dein Stundenplan wirkt… kreativ. Ich brauche einen frischen Ausdruck.\n" +
              "Hol ihn bitte im IT‑Labor (du brauchst dafür einen IT‑Pass – frag Thomas Sauer)."
            );
            return;
          }

          if (api.hasItem("stundenplan")) {
            api.say("system",
              "**Mascha Seiberlich‑Ehrhardt** (Direktorstellvertreterin)\n" +
              "Perfekt. Gib den Ausdruck bitte an Jan Stünkel: `gib stundenplan stunkel`."
            );
            return;
          }

          api.say("system",
            "**Mascha Seiberlich‑Ehrhardt** (Direktorstellvertreterin)\n" +
            "Bitte im IT‑Labor am Drucker den Stundenplan ausdrucken: `untersuche drucker`."
          );
        }
      },

      engel: {
        name: "Maren Engel",
        role: "Didaktische Leitung",
        aliases: ["engel", "maren", "frau engel"],
        description: "Projekt‑Mensch. Strukturiert. Hat für alles eine Idee (und einen Plan B).",
        onTalk: (state, api) => {
          state.flags.q_presse_started = true;

          if (state.flags.q_presse_done) {
            api.say("system",
              "**Maren Engel** (Didaktische Leitung)\n" +
              "Danke! Genau so wird aus einer Idee ein ordentliches Projekt."
            );
            return;
          }

          if (api.hasItem("presse_notiz")) {
            api.say("system",
              "**Maren Engel** (Didaktische Leitung)\n" +
              "Ah, du hast die Notiz. Gib sie mir: `gib presse_notiz engel`."
            );
            return;
          }

          api.say("system",
            "**Maren Engel** (Didaktische Leitung)\n" +
            "Kleines Mini‑Projekt: Ich brauche 2–3 Fakten zum Umbau in Trakt 3.\n" +
            "Schau dir den Baustellen‑Aushang in Trakt 3 an."
          );
        }
      },

      stunkel: {
        name: "Jan Stünkel",
        role: "Gymnasialzweigleiter",
        aliases: ["stunkel", "stünkel", "jan"],
        description: "Oberstufe‑Struktur. Der Blick sagt: ‚Wir kriegen das hin‘.",
        onTalk: (state, api) => {
          api.say("system",
            "**Jan Stünkel** (Gymnasialzweigleiter)\n" +
            "Hi. Wenn du einen Ausdruck für mich hast, sag einfach: `gib stundenplan stunkel`."
          );
        }
      },

      janssen: {
        name: "Uwe Janßen",
        role: "Oberstufenkoordinator",
        aliases: ["janssen", "janßen", "uwe"],
        description: "Oberstufe‑Koordination. Ruhig, aber sehr klar.",
        onTalk: (state, api) => {
          api.say("system",
            "**Uwe Janßen** (Oberstufenkoordinator)\n" +
            "Wenn’s um die Oberstufe geht: gute Vorbereitung ist die halbe Miete."
          );
        }
      }
    },

    locations: {
      pausenhalle: {
        name: "Pausenhalle",
        image: "./assets/pausenhalle.svg",
        description:
          "Zentraler Knotenpunkt. Du hörst Stimmen, Schritte und das typische Schul‑Grundrauschen.",
        exits: [
          { to: "sekretariat", label: "Sekretariat", aliases: ["sekretariat"] },
          { to: "mensa", label: "Mensa", aliases: ["mensa"] },
          { to: "mediothek", label: "Mediothek", aliases: ["bücherei", "buecherei", "mediothek"] },
          { to: "trakt3", label: "Trakt 3 (neue Räume)", aliases: ["trakt 3", "trakt3", "neue räume", "neue raeume"] },
          { to: "aula", label: "Aula", aliases: ["aula"] },
          { to: "sporthalle", label: "Sporthalle", aliases: ["sporthalle", "halle"] }
        ],
        items: [],
        npcs: [],
        objects: {
          aushang: {
            name: "Aushang",
            aliases: ["zettel", "plakat", "aushang"],
            description: "„Tipp: Mensa‑Probleme? Sekretariat. Technik‑Probleme? Mediothek.“"
          }
        }
      },

      sekretariat: {
        name: "Sekretariat",
        image: "./assets/sekretariat.svg",
        description:
          "Telefon klingelt irgendwo, es riecht nach Papier und Ordnung.",
        exits: [
          { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
          { to: "schulleitung", label: "Schulleitung (Gang)", aliases: ["schulleitung", "leitung"] },
          { to: "sekretariat2", label: "Sekretariat 2", aliases: ["sekretariat 2", "sekretariat2"] },
          { to: "lehrerzimmer", label: "Lehrerzimmer", aliases: ["lehrerzimmer"] }
        ],
        items: [],
        npcs: ["pietsch"],
        objects: {
          schild: {
            name: "Türschild",
            aliases: ["schild", "türschild", "tuerschild"],
            description: "Auf dem Schild steht: „Sekretariat“. Überraschend."
          }
        }
      },

      sekretariat2: {
        name: "Sekretariat 2",
        image: "./assets/sekretariat2.svg",
        description:
          "Hier wird organisiert, geplant und verwaltet. Man spricht automatisch leiser.",
        exits: [
          { to: "sekretariat", label: "Zurück ins Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
        ],
        items: [],
        npcs: ["borges", "bouda", "gotzkowsky"],
        objects: {
          stempel: {
            name: "Stempel",
            aliases: ["stempel"],
            description: "Ein Stempel mit Schul-Feeling. Nicht anfassen (also: nur im Spiel)."
          }
        }
      },

      schulleitung: {
        name: "Schulleitung (Gang)",
        image: "./assets/schulleitung.svg",
        description:
          "Ein ruhiger Gang. Türen, Namensschilder, und das Gefühl, man sollte leiser laufen.",
        exits: [
          { to: "sekretariat", label: "Zurück ins Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
        ],
        items: [],
        npcs: ["ommen", "seiberlich", "engel", "stunkel", "janssen"],
        objects: {
          pinwand: {
            name: "Pinwand",
            aliases: ["pinwand", "aushang"],
            description: "Zettel, Termine, Hinweise. Alles wirkt sehr… geplant."
          }
        }
      },

      mediothek: {
        name: "Mediothek / Bücherei",
        image: "./assets/mediothek.svg",
        description:
          "Regale, Arbeitsplätze, leises Tippen. Ein guter Ort zum Durchatmen (und für Hinweise).",
        exits: [
          { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
          { to: "it_labor", label: "IT‑Labor", aliases: ["it", "it labor", "it-labor"], locked: true, lock: { type: "item", itemId: "it_pass" }, lockedText: "Tür zu. Du brauchst einen **IT‑Pass**." }
        ],
        items: [],
        npcs: ["sauer"],
        objects: {
          schild: {
            name: "Schild am Raum",
            aliases: ["schild", "raum schild", "raumschild"],
            description:
              "Da steht groß: „Mediothek“.",
            onExamine: (state, api) => {
              state.flags.saw_codeword_mediothek = true;
              api.say("system", "Du prägst dir das Codewort ein: **MEDIOTHEK**.");
            }
          }
        }
      },

      it_labor: {
        name: "IT‑Labor",
        image: "./assets/it_labor.svg",
        description:
          "Monitore, Tastaturen, ein Drucker, der geheimnisvoll brummt.",
        exits: [
          { to: "mediothek", label: "Zurück zur Mediothek", aliases: ["mediothek", "zurück", "zurueck"] }
        ],
        items: [],
        npcs: [],
        objects: {
          drucker: {
            name: "Drucker",
            aliases: ["drucker", "printer"],
            description: "Ein Drucker. Wenn er will, spuckt er Papier aus.",
            onExamine: (state, api) => {
              if (!state.flags.q_plan_started) {
                api.say("system", "Du könntest hier was drucken, aber gerade brauchst du nichts Konkretes.");
                return;
              }
              if (api.hasItem("stundenplan")) {
                api.say("system", "Du hast schon einen Stundenplan‑Ausdruck.");
                return;
              }
              api.giveItem("stundenplan");
              api.say("system", "🖨️ Der Drucker rattert. Du bekommst einen **Stundenplan‑Ausdruck**.");
            }
          }
        }
      },

      lehrerzimmer: {
        name: "Lehrerzimmer",
        image: "./assets/lehrerzimmer.svg",
        description:
          "Kaffeegeruch, Listen, Stapel. Du bist nur kurz hier – versprochen.",
        exits: [
          { to: "sekretariat", label: "Zurück ins Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
        ],
        items: [],
        npcs: [],
        objects: {
          schrank: {
            name: "Kabel‑Schrank",
            aliases: ["schrank", "kabelschrank", "kabel"],
            description: "Ein Schrank mit Technik‑Zubehör. Er ist abgeschlossen.",
            onExamine: (state, api) => {
              if (!api.hasItem("schrankkarte")) {
                api.say("system", "Abgeschlossen. Du brauchst eine **Schrankkarte** (Sekretariat 2).");
                return;
              }
              if (api.hasItem("usb_c_kabel")) {
                api.say("system", "Du hast das Kabel schon.");
                return;
              }
              api.giveItem("usb_c_kabel");
              api.say("system", "Du öffnest den Schrank und findest ein **USB‑C‑Kabel**.");
            }
          }
        }
      },

      trakt3: {
        name: "Trakt 3 (neue Räume)",
        image: "./assets/trakt3.svg",
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
            description: "Ein Aushang mit Fakten zum Umbau.",
            onExamine: (state, api) => {
              if (api.hasItem("presse_notiz")) {
                api.say("system", "Du hast die wichtigsten Fakten schon notiert.");
                return;
              }
              api.giveItem("presse_notiz");
              api.say("system",
                "Du schreibst dir eine Notiz:\n" +
                "• 5 neue Räume, 8 alte erneuert\n" +
                "• Brücke: direkter Weg von Trakt 3 zu Trakt 2\n" +
                "• Mehr Platz für Förderprogramme / Differenzierungsräume"
              );
            }
          },
          sitzecke: {
            name: "Sitzecke",
            aliases: ["sitz", "sitzecke", "möbel", "moebel"],
            description: "Sieht bequem aus. Du würdest hier sofort eine Springstunde überleben."
          }
        }
      },

      bruecke: {
        name: "Brücke (Trakt 3 ↔ Trakt 2)",
        image: "./assets/bruecke.svg",
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
        image: "./assets/hausmeister.svg",
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
          }
        }
      },

      mensa: {
        name: "Mensa",
        image: "./assets/mensa.svg",
        description:
          "Tische, Stimmen – und das Gefühl, dass gleich irgendwer „Pommes?“ fragt.",
        exits: [
          { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
          { to: "cafeteria", label: "Cafeteria", aliases: ["cafeteria", "cafe"] }
        ],
        items: [],
        npcs: [],
        objects: {
          ausgabe: {
            name: "Essensausgabe",
            aliases: ["ausgabe", "essen", "bestellen"],
            description: "Ein Schild: „Bitte Chip bereithalten.“",
            onExamine: (state, api) => {
              if (api.hasItem("transponderchip")) {
                if (!state.flags.won_mensa) {
                  state.flags.won_mensa = true;
                  api.say("system", "✅ Du hältst deinen Chip hoch. Alles klappt. Quest abgeschlossen: **Mensa‑Ready**.");
                } else {
                  api.say("system", "Du bist schon offiziell Mensa‑ready.");
                }
              } else {
                api.say("system", "Ohne Chip geht hier nichts. Tipp: Sekretariat → Anja Pietsch.");
              }
            }
          }
        }
      },

      cafeteria: {
        name: "Cafeteria",
        image: "./assets/cafeteria.svg",
        description:
          "Snacks, Gespräche, kurze Pause. Man bleibt hier gerne hängen.",
        exits: [
          { to: "mensa", label: "Zurück zur Mensa", aliases: ["mensa", "zurück", "zurueck"] }
        ],
        items: [],
        npcs: [],
        objects: {
          snack: {
            name: "Snack‑Tafel",
            aliases: ["snack", "tafel", "angebot"],
            description: "Heute im Angebot: irgendwas, das genau jetzt gut wäre."
          }
        }
      },

      aula: {
        name: "Aula",
        image: "./assets/aula.svg",
        description:
          "Großer Raum für Veranstaltungen, Projekte, Auftritte. Hier passieren oft die spannenden Dinge.",
        exits: [
          { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] }
        ],
        items: [],
        npcs: ["engel"],
        objects: {
          buehne: {
            name: "Bühne",
            aliases: ["buehne", "bühne"],
            description: "Du stehst kurz da und fühlst dich, als würdest du gleich moderieren."
          }
        }
      },

      sporthalle: {
        name: "Sporthalle",
        image: "./assets/sporthalle.svg",
        description:
          "Schuhe quietschen, Bälle prallen, irgendwo wird gepfiffen.",
        exits: [
          { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] }
        ],
        items: [],
        npcs: [],
        objects: {
          umkleide: {
            name: "Umkleide‑Tür",
            aliases: ["umkleide", "tuer", "tür"],
            description: "Zugegeben: Sporttaschen haben hier schon Legendenstatus."
          }
        }
      }
    }
  };

  window.WORLD = WORLD;
})();
