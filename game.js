/* ============================================================================
  Projektwoche – Offline Textadventure (Grundgerüst)
  - Datengetriebene Szenen
  - State-Machine: { day, sceneId, player, stats, inventory, flags, log }
  - Conditions & Effects
  - Save/Load via localStorage (1 Slot)
  - 3 Dummy-Szenen zum Test
============================================================================ */

(() => {
  "use strict";

  // -----------------------------
  // Konfiguration
  // -----------------------------
  const SAVE_KEY = "pw_textadventure_save_v1";
  const STATE_VERSION = 1;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  // -----------------------------
  // State
  // -----------------------------
  function createNewState(playerName = "", pronoun = "neutral") {
    return {
      version: STATE_VERSION,
      day: 1,
      sceneId: "S1", // erste Dummy-Szene
      player: { name: playerName, pronoun },
      stats: {
        mut: 5,
        fokus: 5,
        charme: 5,
        kreativitaet: 5
      },
      inventory: ["Schülerausweis"],
      flags: {
        // z.B. mysteryStarted: true
      },
      log: ["Neues Spiel gestartet."]
    };
  }

  let state = createNewState();

  // -----------------------------
  // Szene-Daten (3 Dummy-Szenen)
  // Jede Szene:
  // { id, text(state)->string|array, choices:[{ label, condition?, effects?, next }] }
  // -----------------------------
    const SCENES = {
      // =========================================================================
      // Woche – Projektwoche (Mo–Fr)
      // =========================================================================

      // -----------------------------
      // TAG 1 (Mo) – Einstieg + Projektwahl
      // -----------------------------
      S1: {
        id: "S1",
        text: (s) => [
          `<p><span class="stage">Montag, Foyer.</span> Projektwoche startet. Plakate, Stimmen, Klingel – Wusel-Mode.</p>`,
          `<p><span class="speaker">Mina:</span> „${safeName(s)}! Hilfst du kurz mit den Gruppenlisten? Sonst wird’s Chaos deluxe.“</p>`,
          `<p><span class="speaker">Jonas:</span> „Oder wir gehen Info farmen. Wissenschaftliches Rumlaufen.“</p>`
        ],
        choices: [
          {
            label: "Mina helfen (geordnet starten)",
            effects: [
              { type: "stat", key: "fokus", delta: +1 },
              { type: "addItem", item: "Projektplan" },
              { type: "log", text: "Du hilfst Mina. Kompetent fühlt sich… ungewohnt gut an." }
            ],
            next: "D1_AULA"
          },
          {
            label: "Mit Jonas losziehen (Gerüchte vs. Fakten)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "addItem", item: "Projektplan" },
              { type: "log", text: "Du ziehst mit Jonas los. Er sammelt Gerüchte. Du sammelst Hinweise." }
            ],
            next: "D1_AULA"
          }
        ]
      },

      D1_AULA: {
        id: "D1_AULA",
        text: () => [
          `<p><span class="stage">Aula.</span> Projektleitung vorne. Es wird… überraschend still.</p>`,
          `<p><span class="speaker">Herr Yilmaz:</span> „Info: Das Projektwochen-Maskottchen ist verschwunden. Wir bleiben ruhig – und finden’s.“</p>`,
          `<p>Jemand flüstert: „Okay… wild.“</p>`
        ],
        choices: [
          {
            label: "„Ich helfe mit suchen.“",
            effects: [
              { type: "flag", key: "mysteryStarted", value: true },
              { type: "stat", key: "mut", delta: +1 },
              { type: "log", text: "Du meldest dich. Stabil." }
            ],
            next: "D1_NACH_AULA"
          },
          {
            label: "Erst beobachten (Beweise zuerst)",
            effects: [
              { type: "flag", key: "mysteryStarted", value: true },
              { type: "stat", key: "fokus", delta: +1 },
              { type: "log", text: "Du checkst Reaktionen. Wer guckt weg? Wer zu schnell weg?" }
            ],
            next: "D1_PROJEKTWAHL"
          }
        ]
      },

      D1_PROJEKTWAHL: {
        id: "D1_PROJEKTWAHL",
        text: () => [
          `<p><span class="stage">Infotafel.</span> Drei Projekte sind noch offen. Entscheidung jetzt – Boss-Level-Vibes.</p>`,
          `<p><span class="speaker">Mina:</span> „Bitte nicht nach dem Motto ‚yolo‘.“</p>`,
          `<p><span class="speaker">Jonas:</span> „Ich bin Team Alles. Neutral-ish.“</p>`
        ],
        choices: [
          {
            label: "Film/Medien (Beamer, Schnitt, „wo ist der Adapter?!“)",
            effects: [
              { type: "flag", key: "projectDay1", value: "film" },
              { type: "stat", key: "kreativitaet", delta: +1 },
              { type: "log", text: "Du wählst Film/Medien. Talia hat safe Plan B bis Z." }
            ],
            next: "D1_FILM_01"
          },
          {
            label: "Kunst/Design (Plakate, Bühne, Kleber-Realität)",
            effects: [
              { type: "flag", key: "projectDay1", value: "kunst" },
              { type: "stat", key: "kreativitaet", delta: +1 },
              { type: "log", text: "Du wählst Kunst/Design. Es riecht nach Farbe und Ideen." }
            ],
            next: "D1_KUNST_01"
          },
          {
            label: "Sport/Outdoor (Orga, Moves, Hof-Laufwege)",
            effects: [
              { type: "flag", key: "projectDay1", value: "sport" },
              { type: "stat", key: "mut", delta: +1 },
              { type: "log", text: "Du wählst Sport/Outdoor. Eren ist direkt im Orga-Turbo." }
            ],
            next: "D1_SPORT_01"
          }
        ]
      },

      D1_FILM_01: {
        id: "D1_FILM_01",
        text: () => [
          `<p><span class="stage">Medienraum.</span> Beamer: blaues Nichts. Klassiker.</p>`,
          `<p><span class="speaker">Talia:</span> „Adapter fehlt. Das ist kein Zufall mehr.“</p>`,
          `<p><span class="speaker">Herr Lehnert:</span> „Step by step. Nicht eskalieren.“</p>`
        ],
        choices: [
          {
            label: "Kabel-Check (Fokus)",
            effects: [
              { type: "stat", key: "fokus", delta: +1 },
              { type: "log", text: "Du sortierst Kabel. Talia nickt: Respekt." }
            ],
            next: "D1_COMMON_01"
          },
          {
            label: "Rumfragen (Charme)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "log", text: "Du fragst locker rum. „Vorhin war hier kurz ’ne Gruppe…“" }
            ],
            next: "D1_COMMON_01"
          }
        ]
      },

      D1_KUNST_01: {
        id: "D1_KUNST_01",
        text: () => [
          `<p><span class="stage">Kunstraum.</span> Farbflecken, Papier, Klebeband – Projektwoche pur.</p>`,
          `<p><span class="speaker">Frau Mertens:</span> „Kleber auf Scheren = Scheren-Therapie.“</p>`,
          `<p>Auf einer Plakatrolle klebt ein Sticker. Neu. Fremd. Auffällig.</p>`
        ],
        choices: [
          {
            label: "Sticker sichern (unauffällig)",
            effects: [
              { type: "flag", key: "stickerTrail", value: true },
              { type: "addItem", item: "Sticker-Set" },
              { type: "log", text: "Sticker gesichert. Offiziell eine Spur." }
            ],
            next: "D1_COMMON_01"
          },
          {
            label: "Nur merken (kein Risiko)",
            effects: [
              { type: "stat", key: "fokus", delta: +1 },
              { type: "log", text: "Du merkst dir Details. Sam würde nicken." }
            ],
            next: "D1_COMMON_01"
          }
        ]
      },

      D1_SPORT_01: {
        id: "D1_SPORT_01",
        text: () => [
          `<p><span class="stage">Sportbereich / Hof.</span> Eren organisiert, als hätte er ein eingebautes Headset.</p>`,
          `<p><span class="speaker">Eren:</span> „Plan = easy. Kein Plan = aua.“</p>`,
          `<p>Du hörst: „Maskottchen war eben noch bei der Aula… oder?“</p>`
        ],
        choices: [
          {
            label: "Aula-Vorraum checken (Mut)",
            effects: [
              { type: "stat", key: "mut", delta: +1 },
              { type: "flag", key: "stickerTrail", value: true },
              { type: "log", text: "Am Aushang klebt ein Sticker. Wieder derselbe Style. Hmm." }
            ],
            next: "D1_COMMON_01"
          },
          {
            label: "Zeiten abfragen (Charme)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "log", text: "Du sammelst Zeit-Schnipsel. Nicht fancy, aber gut." }
            ],
            next: "D1_COMMON_01"
          }
        ]
      },

      D1_COMMON_01: {
        id: "D1_COMMON_01",
        text: () => [
          `<p><span class="stage">Flur.</span> Du willst weiter – und BAM: „Wo ist Raum 204?“</p>`,
          `<p><span class="speaker">Jonas:</span> „Raum 204 ist ein Mythos. Wie pünktliche Busse.“</p>`,
          `<p><span class="speaker">Sam:</span> „Ihr lauft im Kreis. Seit… fünf Minuten.“</p>`
        ],
        choices: [
          {
            label: "Sam fragen (Fokus)",
            effects: [{ type: "stat", key: "fokus", delta: +1 }, { type: "log", text: "Sam zeigt den Weg – Speedrun-Style." }],
            next: "D1_COMMON_02"
          },
          {
            label: "Allein lösen (Mut)",
            effects: [{ type: "stat", key: "mut", delta: +1 }, { type: "log", text: "Du findest’s. Mit Extra-Schleifen. Zählt." }],
            next: "D1_COMMON_02"
          }
        ]
      },

      D1_COMMON_02: {
        id: "D1_COMMON_02",
        text: () => [
          `<p><span class="stage">Mensa-Schlange.</span> Länger als dein Akku am Freitag.</p>`,
          `<p><span class="speaker">Mina:</span> „Gerüchte bringen uns nicht weiter.“</p>`,
          `<p><span class="speaker">Jonas:</span> „Aber sie sind entertaining…“</p>`
        ],
        choices: [
          {
            label: "Gerüchte runterfahren (Charme)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "addItem", item: "Mensa-Bon" },
              { type: "log", text: "Du beruhigst die Runde. Bonus: Zeitstempel-Bon gesichert." }
            ],
            next: "D1_BONCHECK"
          },
          {
            label: "Zuhören & notieren (Fokus)",
            effects: [
              { type: "stat", key: "fokus", delta: +1 },
              { type: "addItem", item: "Mensa-Bon" },
              { type: "log", text: "Du sammelst Fakten. Puzzle statt Panik." }
            ],
            next: "D1_END"
          }
        ]
      },

      D1_END: {
        id: "D1_END",
        text: (s) => [
          `<p><span class="stage">Montagabend.</span> Projekt gewählt. Mystery gestartet. Und der Sticker taucht zu oft auf.</p>`,
          `<p><strong>Check:</strong> Mystery <em>${s.flags.mysteryStarted ? "✅" : "❌"}</em> • Sticker <em>${s.flags.stickerTrail ? "✅" : "❌"}</em></p>`,
          `<p><span class="speaker">Sam:</span> „Morgen wird’s ernster. Heute war Tutorial.“</p>`
        ],
        choices: [
          { label: "Speichern", effects: [{ type: "save" }], next: "D1_END" },
          { label: "Weiter zu Tag 2", effects: [{ type: "setDay", value: 2 }, { type: "log", text: "Dienstag: neue Projekte, neue Hinweise." }], next: "D2_PROJEKTWAHL" },
          { label: "Tag 1 nochmal (Projektwahl)", effects: [{ type: "log", text: "Zurück zur Projektwahl (Testlauf)." }], next: "D1_PROJEKTWAHL" },
          { label: "Neues Spiel", effects: [{ type: "reset" }], next: "S1" }
        ]
      },

      // -----------------------------
      // TAG 2 (Di) – Beweise werden konkret
      // -----------------------------
      D2_PROJEKTWAHL: {
        id: "D2_PROJEKTWAHL",
        text: () => [
          `<p><span class="stage">Dienstag, Foyer.</span> Vertretungsplan hängt… und ein Sticker klebt halb drüber. Frech.</p>`,
          `<p><span class="speaker">Sam:</span> „Gleicher Stil wie gestern.“</p>`,
          `<p><span class="speaker">Mina:</span> „Projekt wählen. Nebenbei Hinweise sammeln. Bitte ohne Panik.“</p>`
        ],
        choices: [
          {
            label: "Escape-Room-AG (Codes, Kisten, Rätsel)",
            effects: [
              { type: "flag", key: "projectDay2", value: "escape" },
              { type: "addItem", item: "Mini-Taschenlampe" },
              { type: "log", text: "Escape-Room. Mini-Taschenlampe bekommen. Very detective." }
            ],
            next: "D2_ESCAPE"
          },
          {
            label: "Podcast/Interview (Infos aus Gesprächen)",
            effects: [
              { type: "flag", key: "projectDay2", value: "podcast" },
              { type: "stat", key: "charme", delta: +1 },
              { type: "log", text: "Podcast. Heute wird geredet – und du hörst richtig zu." }
            ],
            next: "D2_PODCAST"
          },
          {
            label: "Mensa-Team (Zeiten, Belege, Realität)",
            effects: [
              { type: "flag", key: "projectDay2", value: "mensa" },
              { type: "stat", key: "fokus", delta: +1 },
              { type: "log", text: "Mensa-Team. Zeitstempel-Mode aktiviert." }
            ],
            next: "D2_MENSA"
          }
        ]
      },

      D2_ESCAPE: {
        id: "D2_ESCAPE",
        text: () => [
          `<p><span class="stage">Escape-Room.</span> Rätsel an der Tafel. Kisten. Zettel. Jonas guckt eine Kiste an, als hätte sie ihn beleidigt.</p>`,
          `<p><span class="speaker">Jonas:</span> „Wenn ich hier scheitere, zieh ich ins Lehrerzimmer.“</p>`,
          `<p>Unter einem Hinweis klebt wieder ein Sticker. Überraschung: null.</p>`
        ],
        choices: [
          {
            label: "Rätsel lösen (Fokus)",
            effects: [
              { type: "stat", key: "fokus", delta: +1 },
              { type: "flag", key: "stickerTrail", value: true },
              { type: "incFlag", key: "codePieces", delta: 1 },
              { type: "log", text: "Code-Schnipsel gefunden (1/3). Sticker-Spur bestätigt." }
            ],
            next: "D2_FLURHINWEIS"
          },
          {
            label: "Querdenken (Kreativität)",
            effects: [
              { type: "stat", key: "kreativitaet", delta: +1 },
              { type: "flag", key: "stickerTrail", value: true },
              { type: "incFlag", key: "codePieces", delta: 1 },
              { type: "log", text: "Abkürzung gefunden. Code-Schnipsel gesichert (1/3)." }
            ],
            next: "D2_END"
          }
        ]
      },

      D2_PODCAST: {
        id: "D2_PODCAST",
        text: () => [
          `<p><span class="stage">Bibliothek, Audio-Ecke.</span> Mikro steht. Einer bumpst den Tisch. Natürlich.</p>`,
          `<p><span class="speaker">Herr Yilmaz:</span> „Wir suchen Wahrheit, nicht Drama.“</p>`,
          `<p>Er nennt eine Zeitspanne, in der das Maskottchen sicher noch da war.</p>`
        ],
        choices: [
          {
            label: "Nachfragen (Charme)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "flag", key: "alibiCleared", value: true },
              { type: "addItem", item: "AG-Flyer (Projektwoche)" },
              { type: "log", text: "Zeitinfo klarer. Alibi-Fenster enger." }
            ],
            next: "D2_FLURHINWEIS"
          },
          {
            label: "Notieren (Fokus)",
            effects: [
              { type: "stat", key: "fokus", delta: +1 },
              { type: "flag", key: "alibiCleared", value: true },
              { type: "log", text: "Fakten notiert. Keine Spekulationen." }
            ],
            next: "D2_END"
          }
        ]
      },

      D2_MENSA: {
        id: "D2_MENSA",
        text: () => [
          `<p><span class="stage">Mensa, Backstage.</span> Laut. Schnell. Und Zeiten sind hier echte Währung.</p>`,
          `<p><span class="speaker">Mina:</span> „Bons = Beweise.“</p>`,
          `<p>Jemand flüstert: „Gestern lag irgendwo ein USB-Stick…“</p>`
        ],
        choices: [
          {
            label: "Ort + Leute abfragen (Charme)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "addItem", item: "Notiz: USB-Hinweis" },
              { type: "log", text: "USB-Hinweis eingesammelt. Noch vage, aber nützlich." }
            ],
            next: "D2_FLURHINWEIS"
          },
          {
            label: "Zeiten vergleichen (Fokus)",
            effects: [
              { type: "stat", key: "fokus", delta: +1 },
              { type: "flag", key: "alibiCleared", value: true },
              { type: "log", text: "Ein Gerücht zerbricht sofort. Nice." }
            ],
            next: "D2_END"
          }
        ]
      },

      D2_END: {
        id: "D2_END",
        text: (s) => [
          `<p><span class="stage">Dienstagabend.</span> Ihr habt echte Puzzleteile – nicht nur „ich hab gehört…“.</p>`,
          `<p><strong>Code:</strong> <em>${Number(s.flags.codePieces) || 0}/3</em> • <strong>Alibi:</strong> <em>${s.flags.alibiCleared ? "✅" : "❌"}</em></p>`,
          `<p><span class="speaker">Jonas:</span> „Morgen wird’s safe noch weirder.“</p>`
        ],
        choices: [
          { label: "Speichern", effects: [{ type: "save" }], next: "D2_END" },
          { label: "Weiter zu Tag 3", effects: [{ type: "setDay", value: 3 }, { type: "log", text: "Mittwoch: Twist-Tag, ich fühl’s." }], next: "D3_PROJEKTWAHL" },
          { label: "Zurück zu Tag 2", effects: [{ type: "log", text: "Tag 2 nochmal – andere Route." }], next: "D2_PROJEKTWAHL" }
        ]
      },

      // -----------------------------
      // TAG 3 (Mi) – Manipulation wird klar
      // -----------------------------
      D3_PROJEKTWAHL: {
        id: "D3_PROJEKTWAHL",
        text: () => [
          `<p><span class="stage">Mittwoch, Schulhof.</span> Gerüchte sind überall. Karo kommt an wie eine Eilmeldung.</p>`,
          `<p><span class="speaker">Karo:</span> „Alle sagen, Freitag fällt aus. Ich sag: nope.“</p>`,
          `<p><span class="speaker">Sam:</span> „Leise Beweise, keine lauten Storys.“</p>`
        ],
        choices: [
          {
            label: "Technik/Präsentation (USB, Dateien, Versions-Drama)",
            effects: [
              { type: "flag", key: "projectDay3", value: "technik" },
              { type: "stat", key: "fokus", delta: +1 },
              { type: "log", text: "Technik. Talia: „Bitte nicht anfassen.“" }
            ],
            next: "D3_TECH"
          },
          {
            label: "Theater/Impro (Spontan + Hinweise?)",
            effects: [
              { type: "flag", key: "projectDay3", value: "impro" },
              { type: "stat", key: "kreativitaet", delta: +1 },
              { type: "log", text: "Impro. Heute ist alles spontan. Also: alles." }
            ],
            next: "D3_IMPRO"
          },
          {
            label: "Schulgarten/Umwelt (ruhiger Kopf)",
            effects: [
              { type: "flag", key: "projectDay3", value: "garten" },
              { type: "stat", key: "fokus", delta: +1 },
              { type: "log", text: "Garten. Weniger Lärm, mehr Denken." }
            ],
            next: "D3_GARTEN"
          }
        ]
      },

      D3_TECH: {
        id: "D3_TECH",
        text: () => [
          `<p><span class="stage">Medienraum.</span> Talia zeigt einen USB-Stick. Kein Drama. Nur Fakten.</p>`,
          `<p><span class="speaker">Talia:</span> „Dateiversionen passen nicht. Jemand hat rumgedreht.“</p>`,
          `<p>Manipulation. Nicht „aus Versehen“.</p>`
        ],
        choices: [
          {
            label: "Versionen vergleichen (Fokus)",
            effects: [
              { type: "addItem", item: "USB-Stick" },
              { type: "flag", key: "usbDecoded", value: true },
              { type: "log", text: "Manipulation gefunden. Das ist jetzt offiziell ein Fall." }
            ],
            next: "D3_ZWISCHEN"
          },
          {
            label: "Zugriffe sammeln (Charme)",
            effects: [
              { type: "addItem", item: "USB-Stick" },
              { type: "stat", key: "charme", delta: +1 },
              { type: "log", text: "Du sammelst: wer, wann, wo. Das Netz wird dichter." }
            ],
            next: "D3_END"
          }
        ]
      },

      D3_IMPRO: {
        id: "D3_IMPRO",
        text: () => [
          `<p><span class="stage">Probenraum.</span> Requisitenkiste auf. Chaos rein. Jonas: „Ich bin Regie!“</p>`,
          `<p><span class="speaker">Jonas:</span> „Detektiv findet Hinweis. Action!“</p>`,
          `<p>Und tatsächlich: Zwischen Papier steckt ein Code-Schnipsel.</p>`
        ],
        choices: [
          {
            label: "In Szene einbauen (Kreativität)",
            effects: [
              { type: "incFlag", key: "codePieces", delta: 1 },
              { type: "stat", key: "kreativitaet", delta: +1 },
              { type: "log", text: "Code gesichert. (2/3 vibes.)" }
            ],
            next: "D3_ZWISCHEN"
          },
          {
            label: "Direkt sichern (Fokus)",
            effects: [
              { type: "incFlag", key: "codePieces", delta: 1 },
              { type: "stat", key: "fokus", delta: +1 },
              { type: "log", text: "Code gesichert. Jonas: „Okay, du bist halt klug.“" }
            ],
            next: "D3_END"
          }
        ]
      },

      D3_GARTEN: {
        id: "D3_GARTEN",
        text: () => [
          `<p><span class="stage">Schulgarten.</span> Kurz Ruhe. Nur Wind. Und weit weg: „Ding-dong“.</p>`,
          `<p><span class="speaker">Sam:</span> „Hier denkt man besser.“</p>`,
          `<p>Im Gras: ein neuer Schlüsselanhänger. Sieht… absichtlich verloren aus.</p>`
        ],
        choices: [
          {
            label: "Mitnehmen (Beweis)",
            effects: [
              { type: "addItem", item: "Schlüsselanhänger" },
              { type: "log", text: "Schlüsselanhänger gesichert. Beweise sind Beweise." }
            ],
            next: "D3_ZWISCHEN"
          },
          {
            label: "Ins Fundbüro (korrekt, aber merken)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "log", text: "Du gibst ihn ab. Und merkst dir jedes Detail." }
            ],
            next: "D3_END"
          }
        ]
      },

      D3_END: {
        id: "D3_END",
        text: (s) => [
          `<p><span class="stage">Mittwochabend.</span> Jetzt ist klar: Jemand dreht am Ablauf. Absichtlich.</p>`,
          `<p><strong>USB:</strong> <em>${s.flags.usbDecoded ? "✅" : "❌"}</em> • <strong>Code:</strong> <em>${Number(s.flags.codePieces) || 0}/3</em></p>`,
          `<p><span class="speaker">Mina:</span> „Donnerstag: sauber durchziehen.“</p>`
        ],
        choices: [
          { label: "Speichern", effects: [{ type: "save" }], next: "D3_END" },
          { label: "Weiter zu Tag 4", effects: [{ type: "setDay", value: 4 }, { type: "log", text: "Donnerstag. Countdown-Feeling." }], next: "D4_PROJEKTWAHL" },
          { label: "Zurück zu Tag 3", effects: [{ type: "log", text: "Tag 3 nochmal – andere Route." }], next: "D3_PROJEKTWAHL" }
        ]
      },

      // -----------------------------
      // TAG 4 (Do) – Letzte Puzzleteile
      // -----------------------------
      D4_PROJEKTWAHL: {
        id: "D4_PROJEKTWAHL",
        text: () => [
          `<p><span class="stage">Donnerstag.</span> Stimmung: „Wir müssen liefern“. In der Aula wird für Freitag geprobt.</p>`,
          `<p><span class="speaker">Herr Yilmaz:</span> „Heute sichern wir den Ablauf.“</p>`,
          `<p><span class="speaker">Talia:</span> „Und bitte keine Überraschungen.“</p>`
        ],
        choices: [
          {
            label: "Deko/Event (Aula-Nähe, Überblick)",
            effects: [
              { type: "flag", key: "projectDay4", value: "event" },
              { type: "stat", key: "charme", delta: +1 },
              { type: "log", text: "Event-Team. Du bist nah am Finale-Ort." }
            ],
            next: "D4_EVENT"
          },
          {
            label: "Recherche (Bibliothek, Timeline)",
            effects: [
              { type: "flag", key: "projectDay4", value: "recherche" },
              { type: "stat", key: "fokus", delta: +1 },
              { type: "log", text: "Recherche. Mina liebt’s. Jonas leidet ein bisschen." }
            ],
            next: "D4_RECH"
          },
          {
            label: "Sport-Orga (Wege, Alibis)",
            effects: [
              { type: "flag", key: "projectDay4", value: "sportorga" },
              { type: "stat", key: "mut", delta: +1 },
              { type: "log", text: "Sport-Orga. Viele Wege = viele Infos." }
            ],
            next: "D4_SPORTORGA"
          }
        ]
      },

      D4_EVENT: {
        id: "D4_EVENT",
        text: () => [
          `<p><span class="stage">Aula-Vorraum.</span> Kisten, Deko, Kabel. Jemand ruft: „Wo ist der Projektor?!“</p>`,
          `<p><span class="speaker">Mina:</span> „Wenn das Maskottchen morgen fehlt, wird’s unangenehm.“</p>`,
          `<p>An einer Kiste: ein Label, das wie ein Code-Hinweis aussieht.</p>`
        ],
        choices: [
          {
            label: "Labels checken (Fokus)",
            effects: [
              { type: "incFlag", key: "codePieces", delta: 1 },
              { type: "flag", key: "finalHint", value: "kisten" },
              { type: "addItem", item: "Klebeband" },
              { type: "log", text: "Code-Teil gefunden. Klebeband eingesackt. Projektwoche halt." }
            ],
            next: "D4_PANIK"
          },
          {
            label: "Okay holen (Charme)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "flag", key: "finalHint", value: "kisten" },
              { type: "log", text: "Okay geholt. Sicherer Weg, weniger Stress." }
            ],
            next: "D4_END"
          }
        ]
      },

      D4_RECH: {
        id: "D4_RECH",
        text: () => [
          `<p><span class="stage">Bibliothek.</span> Sam baut ein Beweisboard. Mina zieht eine Timeline. Jonas malt ein Smiley.</p>`,
          `<p><span class="speaker">Sam:</span> „Sticker. Zeiten. USB. Alles muss passen.“</p>`,
          `<p>Ein Aushang nennt eine „Materialausgabe“-Zeit. Passt auffällig gut.</p>`
        ],
        choices: [
          {
            label: "Timeline fertig (Fokus)",
            effects: [
              { type: "stat", key: "fokus", delta: +1 },
              { type: "flag", key: "alibiCleared", value: true },
              { type: "flag", key: "finalHint", value: "zeitlinie" },
              { type: "log", text: "Timeline steht. Alibis werden klarer." }
            ],
            next: "D4_PANIK"
          },
          {
            label: "Lücke finden (Kreativität)",
            effects: [
              { type: "stat", key: "kreativitaet", delta: +1 },
              { type: "flag", key: "finalHint", value: "luecke" },
              { type: "log", text: "Du findest eine Lücke ohne Zeugen. Genau da passiert was." }
            ],
            next: "D4_END"
          }
        ]
      },

      D4_SPORTORGA: {
        id: "D4_SPORTORGA",
        text: () => [
          `<p><span class="stage">Hof / Sportbereich.</span> Eren verteilt Aufgaben. Jonas jongliert. Er scheitert fair.</p>`,
          `<p><span class="speaker">Eren:</span> „Wer war wann wo? Wir brauchen’s jetzt.“</p>`,
          `<p>Eine Person nennt plötzlich zwei Zeiten. Aha.</p>`
        ],
        choices: [
          {
            label: "Ruhig ansprechen (Mut)",
            effects: [
              { type: "stat", key: "mut", delta: +1 },
              { type: "flag", key: "alibiCleared", value: true },
              { type: "log", text: "Du klärst es ohne Stress. Infos kommen raus." }
            ],
            next: "D4_PANIK"
          },
          {
            label: "Smooth drehen (Charme)",
            effects: [
              { type: "stat", key: "charme", delta: +1 },
              { type: "flag", key: "alibiCleared", value: true },
              { type: "log", text: "Du bekommst die Info, ohne dass jemand dichtmacht." }
            ],
            next: "D4_END"
          }
        ]
      },

      D4_END: {
        id: "D4_END",
        text: (s) => [
          `<p><span class="stage">Donnerstagabend.</span> Ihr habt genug, um morgen nicht blind zu rennen.</p>`,
          `<p><strong>Code:</strong> <em>${Number(s.flags.codePieces) || 0}/3</em> • <strong>USB:</strong> <em>${s.flags.usbDecoded ? "✅" : "❌"}</em> • <strong>Alibi:</strong> <em>${s.flags.alibiCleared ? "✅" : "❌"}</em></p>`,
          `<p><span class="speaker">Talia:</span> „Morgen Finale. Bitte keine Plot-Twists.“</p>`
        ],
        choices: [
          { label: "Speichern", effects: [{ type: "save" }], next: "D4_END" },
          { label: "Weiter zu Tag 5 (Finale)", effects: [{ type: "setDay", value: 5 }, { type: "log", text: "Freitag. Jetzt wird’s ernst." }], next: "D5_START" },
          { label: "Zurück zu Tag 4", effects: [{ type: "log", text: "Tag 4 nochmal – andere Route." }], next: "D4_PROJEKTWAHL" }
        ]
      },

      // -----------------------------
      // TAG 5 (Fr) – Finale + Enden
      // -----------------------------
      D5_START: {
        id: "D5_START",
        text: () => [
          `<p><span class="stage">Freitag, Aula.</span> Generalprobe gleich. Nervös. Hype. Mischung.</p>`,
          `<p><span class="speaker">Herr Yilmaz:</span> „Ruhig bleiben. Schritt für Schritt.“</p>`,
          `<p><span class="speaker">Mina:</span> „Bitte keine Chaos-Aktionen.“</p>`
        ],
        choices: [
          { label: "Beweise zuerst (Fokus-Route)", effects: [{ type: "stat", key: "fokus", delta: +1 }, { type: "log", text: "Du gehst auf Beweis-Route." }], next: "D5_BRIEFING" },
          { label: "Leute zuerst (Charme-Route)", effects: [{ type: "stat", key: "charme", delta: +1 }, { type: "log", text: "Du gehst auf Gesprächs-Route." }], next: "D5_BRIEFING" }
        ]
      },

      D5_SEARCH: {
        id: "D5_SEARCH",
        text: (s) => [
          `<p><span class="stage">Finale Suche.</span> Jeder Flur fühlt sich an wie ein Level. Aber diesmal: keine zweite Chance… außer Save.</p>`,
          `<p><strong>Route:</strong> <em>${escapeHTML(String(s.flags.finalHint || "systematisch"))}</em> • <strong>Code:</strong> <em>${Number(s.flags.codePieces) || 0}/3</em></p>`,
          `<p><span class="speaker">Sam:</span> „Nicht rennen. Denken zuerst.“</p>`
        ],
        choices: [
          { label: "Aula-Kisten-Route", condition: (s) => s.flags.finalHint === "kisten", effects: [{ type: "log", text: "Ihr geht zur Kisten-Route." }], next: "D5_RUSH" },
          { label: "Plan-Route (Zeitlinie/Lücke)", condition: (s) => s.flags.finalHint === "zeitlinie" || s.flags.finalHint === "luecke", effects: [{ type: "log", text: "Ihr folgt der Plan-Route." }], next: "D5_RUSH" },
          { label: "Sticker-Spur", condition: (s) => !!s.flags.stickerTrail, effects: [{ type: "log", text: "Ihr folgt der Sticker-Spur." }], next: "D5_RUSH" },
          { label: "Systematisch (immer)", effects: [{ type: "stat", key: "mut", delta: +1 }, { type: "log", text: "Ihr sucht systematisch. Langsam. Effektiv." }], next: "D5_RUSH" }
        ]
      },

      D5_REVEAL: {
        id: "D5_REVEAL",
        text: () => [
          `<p><span class="stage">Fund.</span> Hinter Projektmaterial: das Maskottchen. Eingewickelt. Unversehrt. Plus Notiz.</p>`,
          `<p><span class="speaker">Talia:</span> „Okay. Es lebt. Danke.“</p>`,
          `<p><span class="speaker">Mina:</span> „Jetzt lösen wir das ohne Bloßstellen.“</p>`,
          `<p>Notiz: alte Tradition, schlecht erklärt – und jemand hat’s „spannender“ gemacht. 🙃</p>`
        ],
        choices: [
      { label: "Was jetzt? (Entscheiden)", effects: [{ type: "log", text: "Ihr atmet kurz durch. Jetzt kommt die Entscheidung." }], next: "D5_DECIDE" },
      { label: "Nochmal kurz checken (zurück)", effects: [{ type: "log", text: "Ihr wollt nichts übersehen und geht nochmal die Route durch." }], next: "D5_SEARCH" }
    ]
    , next: "END_A" },
          { label: "Rausposaunen (Chaos-Ende)", effects: [{ type: "log", text: "Du gehst auf Drama. Es wird laut." }], next: "END_B" },
          { label: "Code komplett nutzen (Geheim-Ende)", condition: (s) => (Number(s.flags.codePieces) || 0) >= 3 && s.flags.usbDecoded && s.stats.kreativitaet >= 6, effects: [{ type: "log", text: "Du setzt alles zusammen und checkst die Tradition." }], next: "END_C" }
        ]
      },

      END_A: {
        id: "END_A",
        text: () => [
          `<p><span class="stage">Held*innen-Ende.</span> Maskottchen zurück – rechtzeitig. Du erklärst ruhig: Tradition + schlechte Kommunikation + „spannend machen“.</p>`,
          `<p><span class="speaker">Herr Yilmaz:</span> „Danke. Richtig gut gelöst.“</p>`,
          `<p><span class="speaker">Jonas:</span> „Main Characters confirmed.“</p>`
        ],
        choices: [
          { label: "Speichern", effects: [{ type: "save" }], next: "END_A" },
          { label: "Neues Spiel", effects: [{ type: "reset" }], next: "S1" }
        ]
      },

      END_B: {
        id: "END_B",
        text: () => [
          `<p><span class="stage">Chaos-Ende.</span> Du enthüllst alles vor allen. „Ooooh!“-Geräusche. Fast stolpert jemand über ein Kabel. Fast.</p>`,
          `<p><span class="speaker">Mina:</span> „Ich… hab doch gesagt: kein Chaos.“</p>`,
          `<p>Die Show klappt – aber mit 200% Adrenalin. Am Ende lachen trotzdem alle.</p>`
        ],
        choices: [
          { label: "Speichern", effects: [{ type: "save" }], next: "END_B" },
          { label: "Neues Spiel", effects: [{ type: "reset" }], next: "S1" }
        ]
      },

      END_C: {
        id: "END_C",
        text: () => [
          `<p><span class="stage">Geheim-Ende.</span> Code komplett. Du findest die Tradition: jedes Jahr ein Mini-Rätsel – diesmal nur… eskaliert.</p>`,
          `<p><span class="speaker">Sam:</span> „Also war’s geplant. Nur schlecht gemacht.“</p>`,
          `<p><span class="speaker">Talia:</span> „Nächstes Jahr gibt’s eine Anleitung. Mit Bildern.“</p>`,
          `<p>Du bewahrst das Geheimnis. Spoiler sind uncool. Ende.</p>`
        ],
        choices: [
          { label: "Speichern", effects: [{ type: "save" }], next: "END_C" },
          { label: "Neues Spiel", effects: [{ type: "reset" }], next: "S1" }
        ]
      }
,
  // -----------------------------
  // Zusätzliche Szenen (Erweiterung): Jeder Tag +2–3 Szenen
  // -----------------------------

  // TAG 1 – extra
  D1_NACH_AULA: {
    id: "D1_NACH_AULA",
    text: (s) => [
      `<p><span class="stage">Aula-Vorraum.</span> Alle strömen raus. Man hört schon wieder: „Wo muss ich hin?“</p>`,
      `<p><span class="speaker">Sam:</span> „Wenn jemand was geplant hat, gibt’s Muster. Sticker sind Muster.“</p>`,
      `<p><span class="speaker">Jonas:</span> „Oder es ist einfach nur… Projektwoche. Chaos ist Tradition.“</p>`
    ],
    choices: [
      {
        label: "Schwarzes Brett checken (Hinweis-Jagd)",
        effects: [
          { type: "stat", key: "fokus", delta: +1 },
          { type: "flag", key: "noticeClue", value: true },
          { type: "addItem", item: "Notizzettel" },
          { type: "log", text: "Du findest einen zerknitterten Zettel am Brett. Kein Name – aber ein komisches Kürzel." }
        ],
        next: "D1_PROJEKTWAHL"
      },
      {
        label: "Direkt zur Projektwahl (keine Zeit verlieren)",
        effects: [
          { type: "stat", key: "mut", delta: +1 },
          { type: "log", text: "Du lässt Smalltalk liegen und gehst straight zur Entscheidung." }
        ],
        next: "D1_PROJEKTWAHL"
      }
    ]
  },

  D1_BONCHECK: {
    id: "D1_BONCHECK",
    text: (s) => [
      `<p><span class="stage">Mensa-Ausgang.</span> Du hast den Bon. Nice. Aber: Was machst du damit?</p>`,
      `<p><span class="speaker">Mina:</span> „Wenn Zeiten stimmen, können wir Gerüchte direkt löschen.“</p>`,
      `<p><span class="speaker">Karo:</span> „Oder wir hängen uns an die Sticker-Spur. Das klingt wenigstens spannend.“</p>`
    ],
    choices: [
      {
        label: "Bon + Projektplan vergleichen (Fokus-Route)",
        effects: [
          { type: "stat", key: "fokus", delta: +1 },
          { type: "flag", key: "timelineSeed", value: true },
          { type: "log", text: "Du startest eine Mini-Zeitlinie. Kleine Sache – aber genau so fängt’s an." }
        ],
        next: "D1_END"
      },
      {
        label: "Sticker-Spur priorisieren (Mut-Route)",
        effects: [
          { type: "stat", key: "mut", delta: +1 },
          { type: "log", text: "Du entscheidest dich für die Spur. Risiko, aber fühlt sich richtig an." }
        ],
        next: "D1_END"
      }
    ]
  },

  // TAG 2 – extra
  D2_FLURHINWEIS: {
    id: "D2_FLURHINWEIS",
    text: (s) => [
      `<p><span class="stage">Flur nach dem Projekt.</span> Du willst gerade nur trinken… und dann siehst du’s.</p>`,
      `<p>Ein Sticker klebt an einer Ecke, wo ihn niemand „aus Versehen“ hinsetzt. Genau dieselbe Optik.</p>`,
      `<p><span class="speaker">Sam:</span> „Das ist wie Breadcrumbs. Nur… aus Klebefolie.“</p>`
    ],
    choices: [
      {
        label: "Sticker fotografieren/merken (Fokus)",
        effects: [
          { type: "stat", key: "fokus", delta: +1 },
          { type: "addItem", item: "Foto: Sticker" },
          { type: "log", text: "Beweis gesichert. Nicht zerstören, nur dokumentieren." }
        ],
        next: "D2_DEBRIEF"
      },
      {
        label: "Sticker vorsichtig abziehen (Mut)",
        effects: [
          { type: "stat", key: "mut", delta: +1 },
          { type: "flag", key: "stickerTrail", value: true },
          { type: "log", text: "Du nimmst ihn mit. Kleber an den Fingern, aber Hinweis in der Tasche." }
        ],
        next: "D2_DEBRIEF"
      }
    ]
  },

  D2_DEBRIEF: {
    id: "D2_DEBRIEF",
    text: (s) => [
      `<p><span class="stage">Kurzes Debrief (Bibliothek-Ecke).</span> Mina legt Zettel hin, Sam sortiert, Jonas kommentiert alles wie Livestream.</p>`,
      `<p><span class="speaker">Mina:</span> „Wir brauchen einen gemeinsamen Stand. Sonst rennen wir morgen in drei Richtungen.“</p>`
    ],
    choices: [
      {
        label: "Alles teilen (Teamplay)",
        effects: [
          { type: "incFlag", key: "teamTrust", delta: 1 },
          { type: "stat", key: "charme", delta: +1 },
          { type: "log", text: "Ihr seid synced. Das fühlt sich direkt stabiler an." }
        ],
        next: "D2_END"
      },
      {
        label: "Ein Detail für dich behalten (erst checken)",
        effects: [
          { type: "incFlag", key: "teamTrust", delta: -1 },
          { type: "stat", key: "fokus", delta: +1 },
          { type: "log", text: "Du behältst ein Detail zurück. Vielleicht schlau. Vielleicht riskant." }
        ],
        next: "D2_END"
      }
    ]
  },

  // TAG 3 – extra
  D3_ZWISCHEN: {
    id: "D3_ZWISCHEN",
    text: () => [
      `<p><span class="stage">Treppenhaus.</span> Klingel. Alle bewegen sich wie eine NPC-Masse – nur mit Rucksäcken.</p>`,
      `<p><span class="speaker">Karo:</span> „Ich hab jemanden gesehen, der so getan hat, als wär’s zufällig.“</p>`,
      `<p><span class="speaker">Sam:</span> „‚So getan‘ ist kein Beweis. Aber es ist ein Start.“</p>`
    ],
    choices: [
      {
        label: "Nachfragen: Wer genau? (Charme)",
        effects: [
          { type: "stat", key: "charme", delta: +1 },
          { type: "flag", key: "suspectVibes", value: true },
          { type: "log", text: "Karo beschreibt Kleidung/Route (ohne Namen). Du merkst dir’s." }
        ],
        next: "D3_SPUR"
      },
      {
        label: "Erst Umgebung checken (Fokus)",
        effects: [
          { type: "stat", key: "fokus", delta: +1 },
          { type: "log", text: "Du scannst den Bereich. Sticker? Zettel? Irgendwas?" }
        ],
        next: "D3_SPUR"
      }
    ]
  },

  D3_SPUR: {
    id: "D3_SPUR",
    text: (s) => [
      `<p><span class="stage">Flur-Knick.</span> Du siehst an einer Ecke Kleberreste. Frisch. Als hätte jemand gerade erst was abgezogen.</p>`,
      `<p><span class="speaker">Talia:</span> „Wenn jemand klebt und abzieht, dann plant jemand.“</p>`
    ],
    choices: [
      {
        label: "Spur folgen (Mut)",
        effects: [
          { type: "stat", key: "mut", delta: +1 },
          { type: "flag", key: "trailFollowed", value: true },
          { type: "log", text: "Du folgst der Spur bis zur nächsten Ecke. Nicht weit – aber eindeutig absichtlich." }
        ],
        next: "D3_END"
      },
      {
        label: "Erst zurück zur Gruppe (Team)",
        effects: [
          { type: "incFlag", key: "teamTrust", delta: 1 },
          { type: "log", text: "Du holst die Gruppe dazu. Mehr Augen, weniger Risiko." }
        ],
        next: "D3_END"
      }
    ]
  },

  // TAG 4 – extra
  D4_PANIK: {
    id: "D4_PANIK",
    text: () => [
      `<p><span class="stage">Kurz vor der Probe.</span> Plötzlich: irgendwo klappt ein Kabel raus. Jemand so: „Nicht jetzt!“</p>`,
      `<p><span class="speaker">Talia:</span> „Wenn heute was schiefgeht, geht morgen alles schief.“</p>`
    ],
    choices: [
      {
        label: "Technik helfen (Fokus)",
        effects: [
          { type: "stat", key: "fokus", delta: +1 },
          { type: "flag", key: "calmedTech", value: true },
          { type: "log", text: "Du hilfst, ohne im Weg zu sein. Talia wirkt 2% weniger gestresst." }
        ],
        next: "D4_ABSPRACHE"
      },
      {
        label: "Nebenbei Kisten-Umfeld checken (Mut)",
        effects: [
          { type: "stat", key: "mut", delta: +1 },
          { type: "flag", key: "finalHint", value: "kisten" },
          { type: "log", text: "Du checkst kurz die Umgebung. Irgendwas wurde umgestellt. Safe." }
        ],
        next: "D4_ABSPRACHE"
      }
    ]
  },

  D4_ABSPRACHE: {
    id: "D4_ABSPRACHE",
    text: (s) => [
      `<p><span class="stage">Team-Absprache.</span> Ihr steht im Kreis wie ein Mini-Strategie-Meeting.</p>`,
      `<p><span class="speaker">Mina:</span> „Morgen lösen wir das. Wie?“</p>`,
      `<p><span class="speaker">Sam:</span> „Ruhig. Mit Beweisen.“</p>`
    ],
    choices: [
      {
        label: "Plan: privat & fair klären",
        effects: [
          { type: "flag", key: "approachPlan", value: "privat" },
          { type: "incFlag", key: "teamTrust", delta: 1 },
          { type: "log", text: "Ihr entscheidet euch für eine ruhige, faire Lösung." }
        ],
        next: "D4_END"
      },
      {
        label: "Plan: öffentlich (wenn’s sein muss)",
        effects: [
          { type: "flag", key: "approachPlan", value: "oeffentlich" },
          { type: "log", text: "Ihr wollt Druck machen – Risiko: Drama." }
        ],
        next: "D4_END"
      }
    ]
  },

  // TAG 5 – extra
  D5_BRIEFING: {
    id: "D5_BRIEFING",
    text: (s) => [
      `<p><span class="stage">Freitag, letztes Briefing.</span> Ihr stellt euch neben die Bühne. Mina hat den Plan. Jonas hat… Energie.</p>`,
      `<p><span class="speaker">Sam:</span> „Heute entscheiden Kleinigkeiten.“</p>`,
      `<p><strong>Team-Vertrauen:</strong> <em>${Number(s.flags.teamTrust) || 0}</em></p>`
    ],
    choices: [
      {
        label: "Aufgaben verteilen (Fokus-Plan)",
        effects: [
          { type: "stat", key: "fokus", delta: +1 },
          { type: "incFlag", key: "teamTrust", delta: 1 },
          { type: "log", text: "Ihr verteilt Aufgaben. Es wirkt plötzlich wie ein echtes Team." }
        ],
        next: "D5_SEARCH"
      },
      {
        label: "Impro-Plan: flexibel bleiben (Kreativität)",
        effects: [
          { type: "stat", key: "kreativitaet", delta: +1 },
          { type: "log", text: "Ihr bleibt flexibel. Riskant – aber manchmal klappt’s genau so." }
        ],
        next: "D5_SEARCH"
      }
    ]
  },

  D5_RUSH: {
    id: "D5_RUSH",
    text: () => [
      `<p><span class="stage">Auf dem Weg.</span> Genau jetzt ist natürlich der Flur voll. Genau jetzt ist natürlich jemand „kurz stehen geblieben“.</p>`,
      `<p><span class="speaker">Jonas:</span> „NPCs blocken den Weg, ich kann nicht mehr!“</p>`
    ],
    choices: [
      {
        label: "Ruhig durch (Charme)",
        effects: [
          { type: "stat", key: "charme", delta: +1 },
          { type: "log", text: "Du kommst durch, ohne zu drängeln. Respekt von Mina." }
        ],
        next: "D5_REVEAL"
      },
      {
        label: "Tempo machen (Mut)",
        effects: [
          { type: "stat", key: "mut", delta: +1 },
          { type: "log", text: "Du ziehst durch. Kein Rempeln – aber eindeutig: jetzt zählt’s." }
        ],
        next: "D5_REVEAL"
      }
    ]
  },

  D5_DECIDE: {
    id: "D5_DECIDE",
    text: (s) => [
      `<p><span class="stage">Entscheidung.</span> Ihr habt das Maskottchen. Jetzt kommt der schwierige Teil: Wie löst ihr das?</p>`,
      `<p><strong>Plan:</strong> <em>${escapeHTML(String(s.flags.approachPlan || "offen"))}</em> • <strong>Beweise:</strong> <em>${s.flags.usbDecoded ? "USB ✅" : "USB ❌"}</em>, <em>${s.flags.alibiCleared ? "Alibi ✅" : "Alibi ❌"}</em></p>`
    ],
    choices: [
      { label: "Fair & clean (Held*innen-Ende)", condition: (s) => s.flags.usbDecoded && s.flags.alibiCleared, effects: [{ type: "log", text: "Ihr bleibt fair. Ihr bleibt ruhig. Ihr bleibt korrekt." }], next: "END_A" },
      { label: "Dramatisch rausposaunen (Chaos-Ende)", effects: [{ type: "log", text: "Du gehst auf Drama. Es wird laut. Es wird legendär… vielleicht." }], next: "END_B" },
      { label: "Code komplett nutzen (Geheim-Ende)", condition: (s) => (Number(s.flags.codePieces) || 0) >= 3 && s.flags.usbDecoded && s.stats.kreativitaet >= 6, effects: [{ type: "log", text: "Du setzt alles zusammen und checkst den Hidden-Lore." }], next: "END_C" }
    ]
  }

};


  // -----------------------------
  // DOM Cache
  // -----------------------------
  const el = {};
  document.addEventListener("DOMContentLoaded", () => {
    el.storyText = document.getElementById("storyText");
    el.choicesWrap = document.getElementById("choicesWrap");

    el.metaDay = document.getElementById("metaDay");
    el.metaScene = document.getElementById("metaScene");
    el.playerChip = document.getElementById("playerChip");

    el.valMut = document.getElementById("valMut");
    el.valFokus = document.getElementById("valFokus");
    el.valCharme = document.getElementById("valCharme");
    el.valKrea = document.getElementById("valKrea");

    el.barMut = document.getElementById("barMut");
    el.barFokus = document.getElementById("barFokus");
    el.barCharme = document.getElementById("barCharme");
    el.barKrea = document.getElementById("barKrea");

    el.invCount = document.getElementById("invCount");
    el.invOverlay = document.getElementById("invOverlay");
    el.invList = document.getElementById("invList");
    el.flagList = document.getElementById("flagList");

    el.logList = document.getElementById("logList");

    el.btnInventory = document.getElementById("btnInventory");
    el.btnInventory2 = document.getElementById("btnInventory2");
    el.btnInvClose = document.getElementById("btnInvClose");

    el.btnSave = document.getElementById("btnSave");
    el.btnLoad = document.getElementById("btnLoad");
    el.btnNew = document.getElementById("btnNew");

    el.startOverlay = document.getElementById("startOverlay");
    el.startForm = document.getElementById("startForm");
    el.playerName = document.getElementById("playerName");
    el.playerPronoun = document.getElementById("playerPronoun");
    el.btnStartLoad = document.getElementById("btnStartLoad");

    bindUI();
    boot();
  });

  // -----------------------------
  // Boot / New Game / Load
  // -----------------------------
  function boot() {
    // Wenn kein Name gesetzt ist, erst Start-Overlay zeigen
    if (!state.player.name) {
      showStartOverlay(true);
    } else {
      render();
    }
  }

  function startNewGameFromForm() {
    const name = (el.playerName.value || "").trim();
    const pronoun = el.playerPronoun.value || "neutral";
    state = createNewState(name, pronoun);
    showStartOverlay(false);
    render();
  }

  function showStartOverlay(show) {
    el.startOverlay.hidden = !show;
    if (show) {
      // UX: Name-Feld fokussieren
      setTimeout(() => el.playerName.focus(), 0);
    }
  }

  // -----------------------------
  // Rendering
  // -----------------------------
  function render() {
    const scene = SCENES[state.sceneId];
    if (!scene) {
      // Fallback: wenn Scene-ID kaputt ist (z.B. durch falsches Save)
      state.sceneId = "S1";
      state.log.push("⚠️ Szene nicht gefunden. Zurück zum Start (S1).");
      return render();
    }

    // Meta
    el.metaDay.textContent = `Tag ${state.day}`;
    el.metaScene.textContent = `Scene: ${scene.id}`;
    el.playerChip.textContent = `Spieler*in: ${state.player.name || "—"}`;

    // Text
    const text = typeof scene.text === "function" ? scene.text(state) : scene.text;
    el.storyText.innerHTML = Array.isArray(text) ? text.join("") : String(text);

    // Choices
    renderChoices(scene);

    // Status / Panels
    renderStats();
    renderInventoryMini();
    renderLog();
  }

  function renderChoices(scene) {
    el.choicesWrap.innerHTML = "";

    scene.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn";
      btn.dataset.choiceIndex = String(idx);

      const isAllowed = canChoose(choice);
      btn.disabled = !isAllowed;

      btn.textContent = choice.label + (!isAllowed ? " (gesperrt)" : "");
      el.choicesWrap.appendChild(btn);
    });

    // Event Delegation (kein Button-Listener pro Choice nötig)
    el.choicesWrap.onclick = (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.tagName !== "BUTTON") return;
      const idx = Number(target.dataset.choiceIndex);
      const choice = scene.choices[idx];
      if (!choice || !canChoose(choice)) return;
      pickChoice(choice);
    };
  }

  function renderStats() {
    const s = state.stats;
    setStatUI("mut", s.mut, el.valMut, el.barMut);
    setStatUI("fokus", s.fokus, el.valFokus, el.barFokus);
    setStatUI("charme", s.charme, el.valCharme, el.barCharme);
    setStatUI("kreativitaet", s.kreativitaet, el.valKrea, el.barKrea);
  }

  function setStatUI(_key, value, valEl, barEl) {
    const v = clamp(Number(value) || 0, 0, 10);
    valEl.textContent = String(v);
    barEl.style.width = `${(v / 10) * 100}%`;
  }

  function renderInventoryMini() {
    el.invCount.textContent = `${state.inventory.length} Item${state.inventory.length === 1 ? "" : "s"}`;
  }

  function renderLog() {
    el.logList.innerHTML = "";
    const last = state.log.slice(-6).reverse();
    last.forEach((entry) => {
      const li = document.createElement("li");
      li.innerHTML = escapeHTML(entry);
      el.logList.appendChild(li);
    });
  }

  function renderInventoryModal() {
    // Items
    el.invList.innerHTML = "";
    if (state.inventory.length === 0) {
      el.invList.innerHTML = "<li><em>(leer)</em></li>";
    } else {
      state.inventory.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        el.invList.appendChild(li);
      });
    }

    // Flags
    el.flagList.innerHTML = "";
    const keys = Object.keys(state.flags);
    if (keys.length === 0) {
      el.flagList.innerHTML = "<li><em>(keine)</em></li>";
    } else {
      keys.sort().forEach((k) => {
        const li = document.createElement("li");
        li.textContent = `${k}: ${String(state.flags[k])}`;
        el.flagList.appendChild(li);
      });
    }
  }

  // -----------------------------
  // Choice Handling
  // -----------------------------
  function canChoose(choice) {
    if (!choice.condition) return true;
    try {
      return !!choice.condition(state);
    } catch {
      return false;
    }
  }

  function pickChoice(choice) {
    applyEffects(choice.effects || []);
    if (choice.next) state.sceneId = choice.next;
    render();
  }

  // Effects-Format:
  // { type:'stat', key:'mut'|'fokus'|'charme'|'kreativitaet', delta:+1/-1 }
  // { type:'addItem', item:'...' }
  // { type:'removeItem', item:'...' }
  // { type:'flag', key:'stickerTrail', value:true }
  // { type:'log', text:'...' }
  // { type:'save' }  // convenience
  // { type:'reset' } // startet neues Spiel (öffnet Start-Overlay)
  function applyEffects(effects) {
    effects.forEach((eff) => {
      switch (eff.type) {
        case "stat": {
          const k = eff.key;
          if (!Object.prototype.hasOwnProperty.call(state.stats, k)) return;
          const delta = Number(eff.delta) || 0;
          state.stats[k] = clamp(state.stats[k] + delta, 0, 10);
          break;
        }
        case "addItem": {
          const item = String(eff.item || "").trim();
          if (!item) return;
          if (!state.inventory.includes(item)) state.inventory.push(item);
          break;
        }
        case "removeItem": {
          const item = String(eff.item || "").trim();
          state.inventory = state.inventory.filter((x) => x !== item);
          break;
        }
        case "flag": {
          const key = String(eff.key || "").trim();
          if (!key) return;
          state.flags[key] = eff.value;
          break;
        }
        case "incFlag": {
          const key = String(eff.key || "").trim();
          if (!key) return;
          const delta = Number(eff.delta) || 0;
          const current = Number(state.flags[key]) || 0;
          state.flags[key] = current + delta;
          // Optional clamp for known counters
          if (key === "codePieces") state.flags[key] = clamp(Number(state.flags[key]) || 0, 0, 3);
          break;
        }
        case "setDay": {
          const v = clamp(Number(eff.value) || state.day, 1, 5);
          state.day = v;
          break;
        }
        case "log": {
          const t = String(eff.text || "").trim();
          if (t) state.log.push(t);
          break;
        }
        case "save": {
          saveGame();
          break;
        }
        case "reset": {
          state = createNewState("", "neutral");
          showStartOverlay(true);
          break;
        }
        default:
          break;
      }
    });
  }

  // -----------------------------
  // Save / Load
  // -----------------------------
  function saveGame() {
    try {
      const payload = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, payload);
      state.log.push("💾 Gespeichert.");
    } catch (_err) {
      state.log.push("⚠️ Speichern hat nicht geklappt (Browser/Storage).");
    }
    renderLog();
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        state.log.push("🫥 Kein Spielstand gefunden.");
        renderLog();
        return;
      }
      const parsed = JSON.parse(raw);

      if (!parsed || parsed.version !== STATE_VERSION) {
        state.log.push("⚠️ Spielstand-Version passt nicht. (Reset empfohlen)");
        renderLog();
        return;
      }
      if (!parsed.sceneId || !SCENES[parsed.sceneId]) {
        parsed.sceneId = "S1";
      }

      parsed.stats = parsed.stats || {};
      parsed.stats.mut = clamp(Number(parsed.stats.mut) || 0, 0, 10);
      parsed.stats.fokus = clamp(Number(parsed.stats.fokus) || 0, 0, 10);
      parsed.stats.charme = clamp(Number(parsed.stats.charme) || 0, 0, 10);
      parsed.stats.kreativitaet = clamp(Number(parsed.stats.kreativitaet) || 0, 0, 10);

      parsed.inventory = Array.isArray(parsed.inventory) ? parsed.inventory : [];
      parsed.flags = parsed.flags && typeof parsed.flags === "object" ? parsed.flags : {};
      parsed.log = Array.isArray(parsed.log) ? parsed.log : [];

      state = parsed;
      state.log.push("📦 Geladen.");
      showStartOverlay(false);
      render();
    } catch (_err) {
      state.log.push("⚠️ Laden hat nicht geklappt (Datei kaputt?).");
      renderLog();
    }
  }

  // -----------------------------
  // UI Binding
  // -----------------------------
  function bindUI() {
    const openInv = () => {
      renderInventoryModal();
      el.invOverlay.hidden = false;
    };
    const closeInv = () => (el.invOverlay.hidden = true);

    el.btnInventory.addEventListener("click", openInv);
    el.btnInventory2.addEventListener("click", openInv);
    el.btnInvClose.addEventListener("click", closeInv);

    el.invOverlay.addEventListener("click", (e) => {
      if (e.target === el.invOverlay) closeInv();
    });

    el.btnSave.addEventListener("click", () => saveGame());
    el.btnLoad.addEventListener("click", () => loadGame());
    el.btnNew.addEventListener("click", () => {
      state = createNewState("", "neutral");
      showStartOverlay(true);
      render();
    });

    el.startForm.addEventListener("submit", (e) => {
      e.preventDefault();
      startNewGameFromForm();
    });

    el.btnStartLoad.addEventListener("click", () => loadGame());

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !el.invOverlay.hidden) {
        el.invOverlay.hidden = true;
      }
    });
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  function safeName(s) {
    const n = (s.player?.name || "").trim();
    return n ? escapeHTML(n) : "Du";
  }

  function escapeHTML(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
