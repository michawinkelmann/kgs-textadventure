// data/world.js
// Erweiterte Welt mit drei Quest-Kapiteln

export const WORLD = {
  meta: {
    title: "KGS Text-Adventure",
    setting: "KGS Wilhelm-Röpke-Schule (KGS Schwarmstedt)"
  },

  start: {
    locationId: "pausenhalle",
    inventory: ["schuelerausweis", "fuenf_euro"],
    flags: {}
  },

  items: {
    schuelerausweis: {
      name: "Schülerausweis",
      aliases: ["ausweis", "id"],
      description: "Dein Schülerausweis. Fühlt sich wichtig an.",
      takeable: false
    },
    fuenf_euro: {
      name: "5‑Euro‑Schein",
      aliases: ["5euro", "fünf euro", "fuenf euro", "schein"],
      description: "Ein 5‑Euro‑Schein. Perfekt für Notfälle.",
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
    laborzugang: {
      name: "Laborzugangskarte",
      aliases: ["laborzugang", "zugangskarte", "karte", "labor karte"],
      description: "Eine Karte mit Hologramm-Aufdruck: Zugang zum Innovationslabor.",
      takeable: false
    },
    energiezelle: {
      name: "Energiezelle",
      aliases: ["zelle", "energie", "akku"],
      description: "Eine geladene Energiezelle für das Solarsystem im Dachgarten.",
      takeable: true
    },
    notiz_der_ag: {
      name: "AG‑Notiz",
      aliases: ["notiz", "ag notiz", "zettel"],
      description: "„Danke! Das Solarsystem läuft wieder. Präsentation gerettet.“",
      takeable: true
    }
  },

  npcs: {
    pietsch: {
      name: "Anja Pietsch",
      role: "Schülerangelegenheiten Oberstufe, Mittagessen",
      aliases: ["pietsch", "frau pietsch", "anja"],
      description: "Sie wirkt beschäftigt, aber freundlich. Sie kennt sich mit Mensa‑Themen aus.",
      dialogue: [
        "Hi! Wenn’s um Mittagessen geht, bist du hier richtig.",
        "Ohne Chip kannst du in der Mensa nichts bestellen.",
        "Vielleicht liegt dein Chip im Hausmeister‑Stützpunkt (Fundkiste).",
        "Wegen Umbau/Brücke brauchst du aber einen Baustellenpass.",
        "Ich stelle dir einen aus – aber nur, wenn du mir das Codewort aus der Mediothek bringst.",
        "Wenn du’s weißt: tippe `antworte <codewort>`.",
        "Für das neue Innovationslabor brauche ich später noch ein zweites Codewort vom Mensa-Board."
      ]
    },

    sauer: {
      name: "Thomas Sauer",
      role: "Technik, iPads, Homepage",
      aliases: ["sauer", "herr sauer", "thomas"],
      description: "Er sitzt zwischen Technik‑Kram und Aushängen. Sieht aus, als hätte er immer einen Plan.",
      dialogue: [
        "Moin! Wenn irgendwas mit Technik klemmt – sag Bescheid.",
        "Die Mediothek ist hier um die Ecke. Schau dir das Schild an, dann weißt du das Codewort.",
        "Wenn du später im Labor bist: prüf unbedingt die Ladestation."
      ]
    },

    michaelis: {
      name: "Maik Michaelis",
      role: "Haustechnik, Wartung, Instandhaltung",
      aliases: ["michaelis", "hausmeister", "maik"],
      description: "Hausmeister‑Vibes: Schlüssel, Werkzeug, und ein Blick, der jeden quietschenden Stuhl einschüchtert.",
      dialogue: [
        "Fundkiste? Klar. Wenn’s drin ist, gehört’s dir – wenn du’s beweisen kannst.",
        "Mit Baustellenpass darfst du hier auch sein.",
        "Im Dachgarten läuft eine Solar-AG-Demo. Wenn dort etwas fehlt, sag kurz Bescheid."
      ]
    },

    ommen: {
      name: "Tjark Ommen",
      role: "Gesamtschuldirektor",
      aliases: ["ommen", "herr ommen", "tjark"],
      description: "Er wirkt ruhig und organisiert. Schulleitungs‑Energie.",
      dialogue: [
        "Hallo! Schön, dass du dich zurechtfindest.",
        "Wenn du irgendwo nicht weiterkommst: Frag im Sekretariat, die helfen dir.",
        "Teamwork ist hier alles – besonders bei Projekttagen."
      ]
    },

    karim: {
      name: "Lea Karim",
      role: "Leitung Robotik‑AG",
      aliases: ["karim", "lea", "ag"],
      description: "Sie koordiniert Materialien und wirkt fokussiert, aber entspannt.",
      dialogue: [
        "Hey! Wir richten gerade das Innovationslabor ein.",
        "Ohne geladene Energiezelle startet unser Modell im Dachgarten nicht.",
        "Wenn du die Anlage aktivierst, rettest du unsere Präsentation."
      ]
    }
  },

  locations: {
    pausenhalle: {
      name: "Pausenhalle",
      image: "./assets/pausenhalle.svg",
      description:
        "Du stehst in der Pausenhalle. Hier laufen alle Wege zusammen. Du hörst Stimmen, Schritte und das typische Schul‑Grundrauschen.",
      exits: [
        { to: "sekretariat", label: "Sekretariat", aliases: ["sekretariat"] },
        { to: "mensa", label: "Mensa", aliases: ["mensa"] },
        { to: "mediothek", label: "Mediothek", aliases: ["bücherei", "buecherei", "mediothek"] },
        { to: "trakt3", label: "Trakt 3 (neue Räume)", aliases: ["trakt 3", "trakt3", "neue räume", "neue raeume"] }
      ],
      items: [],
      npcs: [],
      objects: {
        aushang: {
          name: "Aushang",
          aliases: ["zettel", "plakat", "aushang"],
          description: "Ein Aushang: „Tipp: Wer Mensa‑Probleme hat, fragt im Sekretariat.“"
        }
      }
    },

    sekretariat: {
      name: "Sekretariat",
      image: "./assets/sekretariat.svg",
      description:
        "Das Sekretariat: Telefon klingelt irgendwo, es riecht nach Papier und Ordnung.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
        { to: "schulleitung", label: "Schulleitung (Gang)", aliases: ["schulleitung", "leitung"] }
      ],
      items: [],
      npcs: ["pietsch"],
      objects: {
        schild: {
          name: "Türschild",
          aliases: ["schild", "türschild", "tuerschild"],
          description: "Auf einem Schild steht: „Sekretariat“. Überraschend."
        }
      }
    },

    schulleitung: {
      name: "Schulleitung (Gang)",
      image: "./assets/sekretariat.svg",
      description:
        "Ein ruhiger Gang. Türen, Namensschilder, und das Gefühl, man sollte leiser laufen.",
      exits: [
        { to: "sekretariat", label: "Zurück ins Sekretariat", aliases: ["sekretariat", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["ommen"],
      objects: {}
    },

    mediothek: {
      name: "Mediothek / Bücherei",
      image: "./assets/mediothek.svg",
      description:
        "Regale, Arbeitsplätze, leises Tippen. Ein guter Ort zum Durchatmen (und für Hinweise).",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] }
      ],
      items: [],
      npcs: ["sauer"],
      objects: {
        schild: {
          name: "Schild am Raum",
          aliases: ["schild", "raum schild", "raumschild"],
          description: "Da steht groß: „Mediothek“. Klingt nach einem Codewort.",
          onExamine: (state, api) => {
            api.setFlag("saw_codeword_mediothek", true);
            api.say("system", "Du prägst dir das Codewort ein: **MEDIOTHEK**.");
          }
        }
      }
    },

    trakt3: {
      name: "Trakt 3 (neue Räume)",
      image: "./assets/trakt3.svg",
      description:
        "Neue Klassenräume, helle Flure, irgendwo sind gemütliche Sitzecken. Es sieht nach frischem Umbau aus.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] },
        {
          to: "bruecke",
          label: "Brücke Richtung Trakt 2",
          aliases: ["brücke", "bruecke", "trakt 2", "trakt2"],
          locked: true,
          lock: { type: "item", itemId: "baustellenpass" },
          lockedText: "Ein Bauzaun blockiert den Weg. Ohne **Baustellenpass** kommst du nicht rüber."
        },
        {
          to: "innovationslabor",
          label: "Innovationslabor",
          aliases: ["labor", "innovationslabor", "innovation"],
          locked: true,
          lock: { type: "item", itemId: "laborzugang" },
          lockedText: "Das Labor ist gesichert. Du brauchst eine **Laborzugangskarte** aus dem Sekretariat."
        }
      ],
      items: [],
      npcs: [],
      objects: {
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
        "Werkzeug, Ersatzteile, Kisten. Hier findet man Dinge, die man nie gesucht hat – und manchmal genau das, was man braucht.",
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
        "Die Mensa: Tische, Stimmen, und das Gefühl, dass gleich irgendwer „Pommes?“ fragt.",
      exits: [
        { to: "pausenhalle", label: "Zur Pausenhalle", aliases: ["pausenhalle", "zurück", "zurueck"] }
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
              if (!api.getFlag("chapter1_complete")) {
                api.setFlag("chapter1_complete", true);
                api.say("system", "✅ Kapitel 1 geschafft: **Mensa ready!**");
                api.say("system", "Neues Ziel: Finde im Mensa-Bereich den Hinweis fürs Innovationslabor.");
              } else {
                api.say("system", "Du bist schon offiziell Mensa‑ready.");
              }
            } else {
              api.say("system", "Ohne Chip geht hier nichts. Tipp: Im Sekretariat fragen (Frau Pietsch).");
            }
          }
        },
        schwarzesbrett: {
          name: "Schwarzes Brett",
          aliases: ["brett", "schwarzes brett", "board"],
          description: "Ein Plakat zur Projektwoche mit dem Stichwort: „SOLARIS“.",
          onExamine: (state, api) => {
            api.setFlag("saw_codeword_solaris", true);
            api.say("system", "Du merkst dir das zweite Codewort: **SOLARIS**.");
          }
        }
      }
    },

    innovationslabor: {
      name: "Innovationslabor",
      image: "./assets/innovationslabor.svg",
      description:
        "Lötstationen, Whiteboards und Modelle. Hier baut die Robotik‑AG an ihrer Präsentation.",
      exits: [
        { to: "trakt3", label: "Zurück nach Trakt 3", aliases: ["trakt3", "trakt 3", "zurück", "zurueck"] },
        { to: "dachgarten", label: "Treppe zum Dachgarten", aliases: ["dachgarten", "treppe", "dach"] }
      ],
      items: [],
      npcs: ["karim"],
      objects: {
        ladestation: {
          name: "Ladestation",
          aliases: ["station", "ladestation", "ladegeraet", "ladegerät"],
          description: "Eine Dockingstation mit einer blinkenden grünen LED.",
          onExamine: (state, api) => {
            if (api.hasItem("energiezelle")) {
              api.say("system", "Die Energiezelle ist bereits in deinem Inventar.");
              return;
            }
            api.giveItem("energiezelle");
            api.say("system", "Du nimmst eine voll geladene **Energiezelle** mit.");
          }
        }
      }
    },

    dachgarten: {
      name: "Dachgarten",
      image: "./assets/dachgarten.svg",
      description:
        "Über den Dächern der Schule: Beete, Sitzbänke und eine kleine Solar-Demostation.",
      exits: [
        { to: "innovationslabor", label: "Zurück ins Innovationslabor", aliases: ["labor", "innovationslabor", "zurück", "zurueck"] }
      ],
      items: ["notiz_der_ag"],
      npcs: [],
      objects: {
        solarstation: {
          name: "Solarstation",
          aliases: ["solar", "solaranlage", "station"],
          description: "Ein Modell mit Anschluss für eine Energiezelle.",
          onExamine: (state, api) => {
            if (!api.hasItem("energiezelle")) {
              api.say("system", "Die Anlage braucht eine Energiezelle aus dem Innovationslabor.");
              return;
            }
            if (!api.getFlag("chapter3_complete")) {
              api.setFlag("chapter3_complete", true);
              api.say("system", "🌞 Die Solaranlage startet! Kapitel 3 abgeschlossen.");
              api.say("system", "Du siehst eine AG-Notiz auf der Bank. Vielleicht kannst du sie `nimm notiz` einsammeln.");
            } else {
              api.say("system", "Die Solaranlage summt stabil vor sich hin.");
            }
          }
        },
        bank: {
          name: "Bank",
          aliases: ["sitzbank", "bank"],
          description: "Eine Holzbank mit Blick über den Schulhof."
        }
      }
    }
  }
};
