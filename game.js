// game.js
// Engine ohne ES-Module (damit file:// funktioniert)
(function(){
  const WORLD = window.WORLD;

  const els = {
    locationLine: document.querySelector("#locationLine"),
    sceneImg: document.querySelector("#sceneImg"),
    sceneTitle: document.querySelector("#sceneTitle"),
    sceneMeta: document.querySelector("#sceneMeta"),
    log: document.querySelector("#log"),
    form: document.querySelector("#inputForm"),
    input: document.querySelector("#commandInput"),
    nextStepBox: document.querySelector("#nextStepBox"),
    contextBox: document.querySelector("#contextBox"),
    questBox: document.querySelector("#questBox"),
    relationshipBox: document.querySelector("#relationshipBox"),
    mapBox: document.querySelector("#mapBox"),
    mapModeNear: document.querySelector("#mapModeNear"),
    mapModeAll: document.querySelector("#mapModeAll"),
    btnSave: document.querySelector("#btnSave"),
    btnReset: document.querySelector("#btnReset"),
  };

  const STORAGE_KEY = "kgs_textadventure_save_v2";

  const state = {
    locationId: WORLD?.start?.locationId || "pausenhalle",
    inventory: [...(WORLD?.start?.inventory || [])],
    relationships: { ...(WORLD?.start?.relationships || {}) },
    knownRelationships: { ...(WORLD?.start?.knownRelationships || {}) },
    flags: { ...(WORLD?.start?.flags || {}) },
    log: [],
    taken: {}, // itemId -> true (für Locations-Items)
    priorityHint: "",
    eventMemory: {}, // eventId -> moveCount der letzten Auslösung
    groupSceneMemory: {}, // sceneKey -> actionCount der letzten Auslösung
    spawnedItems: {}, // locationId -> [itemId]
    moveCount: 0,
    actionCount: 0
  };

  const NEXT_STEP_COMMANDS = {
    mensa: ["rede pietsch", "gehen mediothek", "antworte mediothek", "gehen hausmeister", "gehen mensa"],
    ipad: ["rede sauer", "gehen sekretariat2", "gehen lehrerzimmer", "gib usb_c_kabel sauer"],
    presse: ["rede engel", "gehen trakt3", "gib presse_notiz engel"],
    plan: ["rede seiberlich", "gehen it_labor", "gib stundenplan stunkel"],
    finale: ["rede ommen", "gehen sekretariat", "gehen lehrerzimmer", "gehen cafeteria", "gehen it_labor", "rede semrau", "gehen serverraum", "gehen aula"],
    qr: ["rede semrau", "untersuche aushang", "gehen mensa", "gehen sporthalle", "rede semrau"],
    kunst: ["rede frech", "gehen sekretariat2", "gib pinselset frech"],
    poster: ["rede hoffrichter", "gehen hausmeister", "gib klebeband hoffrichter"],
    frieden: ["rede jeske", "gehen mediothek", "gib konfliktkarten jeske"],
    kaenguru: ["rede fischer", "gehen it_labor", "gib kaenguru_bogen fischer"],
    nawi: ["rede kraemer", "gehen hausmeister", "gib laborbrille kraemer"],
    sport: ["rede religa", "gehen sporthalle", "gib ballpumpe religa"],
    dienstplan: ["rede thienel", "gehen it_labor", "gib dienstplan thienel"],
    sprachen: ["rede steinbeck", "gehen cafeteria", "gib vokabelkarten steinbeck"],
    theater: ["rede remmers", "untersuche sitzreihe", "gib skript_seite remmers"]
  };

  function nowTag(){
    const d = new Date();
    return d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  }

  const api = {
    say(role, text) {
      state.log.push({ role, text, t: nowTag() });
      renderLog(true);
      saveAuto();
    },
    setFlag(key, val) { state.flags[key] = val; saveAuto(); renderHelp(); },
    getFlag(key) { return !!state.flags[key]; },
    hasItem(itemId) { return state.inventory.includes(itemId); },
    giveItem(itemId) {
      if (!state.inventory.includes(itemId)) state.inventory.push(itemId);
      saveAuto();
      renderAll();
    },
    removeItem(itemId) {
      state.inventory = state.inventory.filter(x => x !== itemId);
      saveAuto();
      renderAll();
    },
    moveTo(locationId) {
      if (state.locationId === locationId) return;
      state.locationId = locationId;
      state.moveCount += 1;
      renderAll();
      saveAuto();
    },
    getReputation(npcId) {
      if (!npcId) return 0;
      const val = Number(state.relationships[npcId]);
      return Number.isFinite(val) ? val : 0;
    },
    changeReputation(npcId, delta) {
      if (!npcId) return 0;
      const current = api.getReputation(npcId);
      const next = Math.max(-5, Math.min(5, current + (Number(delta) || 0)));
      state.relationships[npcId] = next;
      state.knownRelationships[npcId] = true;
      saveAuto();
      renderRelationshipBox();
      return next;
    },
    noteRelationship(npcId) {
      if (!npcId) return;
      state.knownRelationships[npcId] = true;
      if (!Number.isFinite(Number(state.relationships[npcId]))) {
        state.relationships[npcId] = 0;
      }
      saveAuto();
      renderRelationshipBox();
    }
  };

  function norm(s){
    return (s || "")
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ß/g, "ss")
      .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
      .replace(/\s+/g, " ");
  }

  function splitCommand(input){
    const raw = (input || "").trim();
    const cleaned = norm(raw);
    if (!cleaned) return null;

    const parts = cleaned.split(" ");
    const verbRaw = parts[0];
    const rest = parts.slice(1).join(" ").trim();

    const verbMap = new Map([
      ["h", "hilfe"], ["help", "hilfe"], ["hilfe", "hilfe"],
      ["wo", "wo"], ["ort", "wo"],
      ["geh", "gehen"], ["gehe", "gehen"], ["gehen", "gehen"],
      ["untersuche", "untersuche"], ["schau", "untersuche"], ["sieh", "untersuche"], ["check", "untersuche"],
      ["rede", "rede"], ["sprich", "rede"], ["talk", "rede"],
      ["nimm", "nimm"], ["nehm", "nimm"], ["nehme", "nimm"], ["take", "nimm"],
      ["gib", "gib"], ["gebe", "gib"], ["give", "gib"],
      ["inventar", "inventar"], ["inv", "inventar"],
      ["quests", "quests"], ["quest", "quests"],
      ["klar", "klar"], ["clear", "klar"],
      ["antworte", "antworte"], ["antwort", "antworte"], // legacy support
    ]);

    const verb = verbMap.get(verbRaw) || verbRaw;
    return { verb, rest, raw };
  }

  function currentLoc(){ return WORLD.locations[state.locationId]; }

  function getNpcByQuery(q){
    const qn = norm(q);
    const loc = currentLoc();
    const npcIds = loc?.npcs || [];
    for (const id of npcIds){
      const npc = WORLD.npcs[id];
      const all = [npc?.name, ...(npc?.aliases || [])].filter(Boolean).map(norm);
      if (all.includes(qn)) return { npc, id };
    }
    return null;
  }

  function getObjectByQuery(q){
    const qn = norm(q);
    const loc = currentLoc();
    const objs = loc?.objects || {};
    for (const key of Object.keys(objs)){
      const obj = objs[key];
      const all = [obj?.name, ...(obj?.aliases || [])].filter(Boolean).map(norm);
      if (all.includes(qn)) return obj;
    }
    return null;
  }

  function availableLocationItems(loc){
    const itemIds = loc?.items || [];
    const spawned = state.spawnedItems[state.locationId] || [];
    const allItems = [...itemIds, ...spawned];
    return allItems.filter((id, idx) => !state.taken[id] && allItems.indexOf(id) === idx);
  }

  function getLocationItemsById(locationId){
    const loc = WORLD.locations[locationId];
    const baseItems = loc?.items || [];
    const spawned = state.spawnedItems[locationId] || [];
    const all = [...baseItems, ...spawned];
    return all.filter((id, idx) => !state.taken[id] && all.indexOf(id) === idx);
  }

  function ensureSpawnedItem(locationId, itemId){
    if (!locationId || !itemId) return false;
    if (state.taken[itemId] || api.hasItem(itemId)) return false;
    const locItems = getLocationItemsById(locationId);
    if (locItems.includes(itemId)) return false;
    if (!Array.isArray(state.spawnedItems[locationId])) state.spawnedItems[locationId] = [];
    state.spawnedItems[locationId].push(itemId);
    return true;
  }

  function getLocationEvents(locationId){
    const globalEvents = (WORLD.events || []).filter(ev => !Array.isArray(ev.locations) || ev.locations.includes(locationId));
    const locEvents = Array.isArray(WORLD.locations[locationId]?.events) ? WORLD.locations[locationId].events : [];
    return [...globalEvents, ...locEvents];
  }

  function resolveEventText(event){
    if (typeof event.text === "function") return event.text(state, api);
    return event.text || "";
  }

  function applyEventEffects(effect){
    if (!effect) return;
    const effects = Array.isArray(effect) ? effect : [effect];

    for (const fx of effects){
      if (!fx || typeof fx !== "object") continue;

      if (fx.type === "setFlag" && fx.key){
        state.flags[fx.key] = fx.value !== undefined ? fx.value : true;
      }

      if (fx.type === "spawnItem" && fx.itemId){
        const targetLoc = fx.locationId || state.locationId;
        const spawned = ensureSpawnedItem(targetLoc, fx.itemId);
        if (spawned && fx.spawnText){
          api.say("system", fx.spawnText);
        }
      }

      if (fx.type === "npcHint" && fx.npcId){
        const npc = WORLD.npcs[fx.npcId];
        const hintText = fx.text || (npc ? `Vielleicht solltest du kurz mit **${npc.name}** sprechen.` : "Du hast das Gefühl, jemand hätte einen hilfreichen Hinweis.");
        api.say("system", hintText);
      }

      if (fx.type === "adjustReputation"){
        const repKey = `ruf_${fx.key || "campus"}`;
        const delta = Number(fx.delta) || 0;
        const current = Number(state.flags[repKey]) || 0;
        state.flags[repKey] = current + delta;
        if (fx.text){
          api.say("system", fx.text);
        }
      }

      if (fx.type === "custom" && typeof fx.run === "function"){
        fx.run(state, api);
      }
    }
  }

  function sceneMemoryKey(locationId, scene, idx){
    return `${locationId}:${scene.id || `scene_${idx}`}`;
  }

  function maybeTriggerGroupScene(locationId, triggerType, options = {}){
    const loc = WORLD.locations[locationId];
    const scenes = Array.isArray(loc?.groupScenes) ? loc.groupScenes : [];
    if (!scenes.length) return false;

    const eligible = scenes.filter((scene, idx) => {
      const triggers = Array.isArray(scene.triggers) ? scene.triggers : ["enter", "talk"];
      if (!triggers.includes(triggerType)) return false;
      const cooldown = Number.isFinite(scene.cooldown) ? scene.cooldown : 3;
      const memoryKey = sceneMemoryKey(locationId, scene, idx);
      const lastSeenAt = Number.isFinite(state.groupSceneMemory[memoryKey]) ? state.groupSceneMemory[memoryKey] : -999;
      const cooldownPassed = (state.actionCount - lastSeenAt) >= cooldown;
      const conditionOk = typeof scene.when === "function" ? !!scene.when(state) : true;
      return cooldownPassed && conditionOk;
    });

    if (!eligible.length) return false;

    const scene = eligible[Math.floor(Math.random() * eligible.length)];
    const chance = Number.isFinite(scene.chance) ? scene.chance : 0.75;
    if (!options.force && Math.random() > chance) return false;

    const sceneKey = sceneMemoryKey(locationId, scene, scenes.indexOf(scene));
    state.groupSceneMemory[sceneKey] = state.actionCount;

    if (scene.title){
      api.say("system", `**${scene.title}**`);
    }

    const lines = Array.isArray(scene.lines) ? scene.lines : [];
    for (const line of lines){
      if (typeof line === "string"){
        api.say("system", line);
        continue;
      }
      if (!line || typeof line !== "object") continue;
      const speaker = line.speaker || "Stimmen im Hintergrund";
      const text = line.text || "…";
      api.say("system", `**${speaker}**\n${text}`);
    }

    if (scene.hint){
      api.say("system", `💡 ${scene.hint}`);
    }

    applyEventEffects(scene.effect);
    renderHelp();
    saveAuto();
    return true;
  }

  function maybeTriggerLocationEvent(locationId){
    const events = getLocationEvents(locationId);
    if (!events.length) return;

    const eligible = events.filter((event, idx) => {
      const eventId = event.id || `${locationId}_event_${idx}`;
      const cooldown = Number.isFinite(event.cooldown) ? event.cooldown : 3;
      const lastSeenAt = Number.isFinite(state.eventMemory[eventId]) ? state.eventMemory[eventId] : -999;
      const cooldownPassed = (state.moveCount - lastSeenAt) >= cooldown;
      const conditionOk = typeof event.when === "function" ? !!event.when(state) : true;
      return cooldownPassed && conditionOk;
    });

    if (!eligible.length) return;

    const selected = eligible[Math.floor(Math.random() * eligible.length)];
    const chance = Number.isFinite(selected.chance) ? selected.chance : 0.65;
    if (Math.random() > chance) return;

    const selectedId = selected.id || `${locationId}_event_${events.indexOf(selected)}`;
    state.eventMemory[selectedId] = state.moveCount;

    const text = resolveEventText(selected);
    if (text) api.say("system", text);

    applyEventEffects(selected.effect);
    renderHelp();
    saveAuto();
  }

  function getLocItemByQuery(q){
    const qn = norm(q);
    const loc = currentLoc();
    const itemIds = availableLocationItems(loc);
    for (const id of itemIds){
      const item = WORLD.items[id];
      const all = [item?.name, ...(item?.aliases || [])].filter(Boolean).map(norm);
      if (all.includes(qn)) return { item, id };
    }
    return null;
  }

  function getInvItemByQuery(q){
    const qn = norm(q);
    for (const id of state.inventory){
      const item = WORLD.items[id];
      const all = [item?.name, ...(item?.aliases || [])].filter(Boolean).map(norm);
      if (all.includes(qn)) return { item, id };
    }
    return null;
  }

  function findExitByQuery(q){
    const qn = norm(q);
    const loc = currentLoc();
    for (const ex of (loc?.exits || [])){
      const all = [ex.label, ...(ex.aliases || [])].filter(Boolean).map(norm);
      if (all.includes(qn)) return ex;
    }
    return null;
  }

  function isExitCurrentlyLocked(ex){
    return ex?.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId);
  }

  function listExitLabels(){
    const loc = currentLoc();
    return (loc?.exits || []).map(ex => isExitCurrentlyLocked(ex) ? `${ex.label} (gesperrt)` : ex.label);
  }

  function findExitSuggestion(q){
    const qn = norm(q);
    if (!qn) return null;

    const exits = currentLoc()?.exits || [];
    const candidates = [];

    for (const ex of exits){
      const tokens = [ex.label, ...(ex.aliases || [])].filter(Boolean).map(norm);
      for (const token of tokens){
        candidates.push({ ex, token });
      }
    }

    const prefixMatch = candidates.find(c => c.token.startsWith(qn) || qn.startsWith(c.token));
    if (prefixMatch) return prefixMatch.ex;

    const byDistance = candidates
      .map(c => ({ ...c, dist: Math.abs(c.token.length - qn.length) + [...qn].filter(ch => !c.token.includes(ch)).length }))
      .sort((a, b) => a.dist - b.dist)[0];

    if (!byDistance || byDistance.dist > Math.max(2, Math.floor(qn.length / 2))) return null;
    return byDistance.ex;
  }

  function describeLocation(){
    const loc = currentLoc();
    const items = availableLocationItems(loc).map(id => WORLD.items[id]?.name).filter(Boolean);
    const npcs = (loc?.npcs || []).map(id => WORLD.npcs[id]?.name).filter(Boolean);
    const objs = Object.values(loc?.objects || {}).map(o => o.name).filter(Boolean);

    let extra = "";
    if (items.length) extra += `\n\n**Items hier:** ${items.join(", ")}`;
    if (npcs.length) extra += `\n**Personen hier:** ${npcs.join(", ")}`;
    if (objs.length) extra += `\n**Interaktionen:** ${objs.join(", ")}`;

    api.say("system", `**${loc.name}**\n${loc.description}${extra}`);
  }

  function describeInventory(){
    if (!state.inventory.length){
      api.say("system", "Dein Inventar ist leer.");
      return;
    }
    const lines = state.inventory.map(id => `- ${WORLD.items[id]?.name || id}`);
    api.say("system", `**Inventar:**\n${lines.join("\n")}`);
  }

  function help(){
    api.say("system",
`**Hilfe**
- \`wo\` / \`hilfe\`
- \`gehen <ziel>\`
- \`untersuche <ding>\`
- \`rede <name>\`
- \`nimm <item>\`
- \`gib <item> <name>\`
- \`gib <name> <item>\`
- \`inventar\`
- \`quests\`

Tipp: Nutze die Vorschläge im Kontext‑Kasten rechts.`);
  }

  function clearChat(){
    state.log = [];
    renderLog(false);
    api.say("system", "Chat geleert.");
  }

  function getQuestProgressSnapshot(){
    const snap = {};
    for (const q of (WORLD.quests || [])){
      snap[q.id] = q.steps.filter(s => s.done(state)).length;
    }
    return snap;
  }

  function getPriorityHintText(){
    return state.priorityHint || "";
  }

  function getQuestNextCommand(quest){
    const nextIdx = quest.steps.findIndex(step => !step.done(state));
    if (nextIdx < 0) return "quests";
    const cmds = NEXT_STEP_COMMANDS[quest.id] || [];
    return cmds[nextIdx] || "quests";
  }

  function suggestNextStep(beforeProgress){
    if (!beforeProgress) return;
    for (const q of (WORLD.quests || [])){
      const beforeDone = beforeProgress[q.id] || 0;
      const nowDone = q.steps.filter(s => s.done(state)).length;
      if (nowDone <= beforeDone) continue;

      const command = getQuestNextCommand(q);
      const hintText = `Als Nächstes: \`${command}\``;
      state.priorityHint = hintText;
      api.say("system", hintText);
      renderHelp();
      return;
    }
  }

  function talkTo(q){
    if (!q){
      const triggered = maybeTriggerGroupScene(state.locationId, "talk", { force: true });
      if (!triggered) api.say("system", "Mit wem? Beispiel: `rede pietsch`");
      return;
    }
    const hit = getNpcByQuery(q);
    if (!hit){
      api.say("system", "Hier ist niemand mit diesem Namen.");
      return;
    }
    const { npc, id } = hit;
    api.noteRelationship(id);
    const beforeProgress = getQuestProgressSnapshot();
    if (typeof npc.onTalk === "function"){
      npc.onTalk(state, api);
    } else if (Array.isArray(npc.dialogue) && npc.dialogue.length){
      const idxKey = `talk_${norm(npc.name)}`;
      const idx = (state.flags[idxKey] || 0);
      const line = npc.dialogue[idx] ?? npc.dialogue[npc.dialogue.length - 1];
      state.flags[idxKey] = Math.min(idx + 1, npc.dialogue.length - 1);
      api.say("system", `**${npc.name}** (${npc.role})\n${line}`);
    } else {
      api.say("system", `**${npc.name}** (${npc.role})\n…`);
    }
    suggestNextStep(beforeProgress);
    renderHelp();
  }

  function examine(q){
    if (!q){
      api.say("system", "Was soll ich untersuchen? Beispiel: `untersuche schild`");
      return;
    }

    const obj = getObjectByQuery(q);
    if (obj){
      const beforeProgress = getQuestProgressSnapshot();
      api.say("system", `**${obj.name}**\n${obj.description}`);
      if (typeof obj.onExamine === "function") obj.onExamine(state, api);
      suggestNextStep(beforeProgress);
      return;
    }

    const npcHit = getNpcByQuery(q);
    if (npcHit){
      const { npc } = npcHit;
      api.say("system", `**${npc.name}**\n${npc.description}`);
      return;
    }

    const inv = getInvItemByQuery(q);
    if (inv){
      api.say("system", `**${inv.item.name}**\n${inv.item.description}`);
      return;
    }

    const locItem = getLocItemByQuery(q);
    if (locItem){
      api.say("system", `**${locItem.item.name}**\n${locItem.item.description}\n(Tipp: nimm ${norm(locItem.item.name)})`);
      return;
    }

    api.say("system", "Dazu finde ich hier nichts Passendes.");
  }

  function moveTo(q){
    if (!q){
      api.say("system", "Wohin? Beispiel: `gehen mensa`");
      return;
    }

    const exit = findExitByQuery(q);
    if (!exit){
      const options = listExitLabels();
      const suggestion = findExitSuggestion(q);
      let msg = "Dahin kommst du von hier aus nicht direkt.";
      if (options.length){
        msg += `\nVon hier aus geht: ${options.join(", ")}.`;
      }
      if (suggestion){
        msg += `\nMeintest du **${suggestion.label}**?`;
      }
      api.say("system", msg);
      return;
    }

    if (exit.locked){
      const lock = exit.lock || {};
      if (lock.type === "item" && !api.hasItem(lock.itemId)){
        api.say("system", exit.lockedText || "Der Weg ist gerade gesperrt.");
        return;
      }
    }

    api.moveTo(exit.to);
    describeLocation();
    maybeTriggerGroupScene(exit.to, "enter");
    maybeTriggerLocationEvent(exit.to);
  }

  function takeItem(q){
    if (!q){
      api.say("system", "Was willst du nehmen? Beispiel: `nimm chip`");
      return;
    }

    const hit = getLocItemByQuery(q);
    if (!hit){
      api.say("system", "Das Item liegt hier nicht (oder du hast es schon genommen).");
      return;
    }

    if (!hit.item.takeable){
      api.say("system", "Das kannst du nicht einfach mitnehmen.");
      return;
    }

    state.taken[hit.id] = true;
    api.giveItem(hit.id);
    api.say("system", `Du nimmst: **${hit.item.name}**.`);
  }

  function giveItem(rest){
    // Formate: gib <item> <name> | gib <name> <item>
    const parts = (rest || "").split(" ").filter(Boolean);
    if (parts.length < 2){
      api.say("system", "Wie genau? Beispiel: `gib usb_c_kabel sauer`");
      return;
    }

    let inv = null;
    let npcHit = null;
    let sawNpc = false;
    let sawInvItem = false;

    // Alle möglichen Trennstellen testen (vorwärts + rückwärts),
    // damit sowohl "gib <item> <npc>" als auch "gib <npc> <item>" erkannt werden.
    const splitIndexes = [];
    for (let i = 1; i < parts.length; i++) splitIndexes.push(i);
    for (let i = parts.length - 1; i >= 1; i--) splitIndexes.push(i);

    for (const splitAt of splitIndexes){
      const left = parts.slice(0, splitAt).join(" ");
      const right = parts.slice(splitAt).join(" ");

      const leftInv = getInvItemByQuery(left);
      const rightNpc = getNpcByQuery(right);
      const leftNpc = getNpcByQuery(left);
      const rightInv = getInvItemByQuery(right);

      if (leftInv || rightInv) sawInvItem = true;
      if (leftNpc || rightNpc) sawNpc = true;

      if (leftInv && rightNpc){
        inv = leftInv;
        npcHit = rightNpc;
        break;
      }

      if (leftNpc && rightInv){
        inv = rightInv;
        npcHit = leftNpc;
        break;
      }
    }

    if (!inv || !npcHit){
      if (sawNpc && !sawInvItem){
        api.say("system", "Person erkannt, aber dieses Item hast du nicht im Inventar.");
        return;
      }
      if (sawInvItem && !sawNpc){
        api.say("system", "Item erkannt, aber diese Person ist gerade nicht hier.");
        return;
      }

      api.say("system", "Wie genau? Beispiele: `gib usb_c_kabel sauer` oder `gib sauer usb_c_kabel`");
      return;
    }

    const npcId = npcHit.id;
    const beforeProgress = getQuestProgressSnapshot();
    // Guard: In dieser Funktion wird ausschließlich `npcId` als NPC-Identifier verwendet.

    // Quest-specific handovers
    if (npcId === "sauer" && inv.id === "usb_c_kabel" && state.flags.q_ipad_started && !state.flags.q_ipad_done){
      api.removeItem(inv.id);
      state.flags.q_ipad_done = true;
      if (!api.hasItem("it_pass")) api.giveItem("it_pass");
      api.say("system",
        "**Thomas Sauer** nimmt das Kabel.\n" +
        "✅ Quest abgeschlossen: **iPad‑Rettung**\n" +
        "Du bekommst: **IT‑Pass** (IT‑Labor ist freigeschaltet)."
      );
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "engel" && inv.id === "presse_notiz" && state.flags.q_presse_started && !state.flags.q_presse_done){
      api.removeItem(inv.id);
      state.flags.q_presse_done = true;
      api.say("system",
        "**Maren Engel** nimmt die Notiz.\n" +
        "✅ Quest abgeschlossen: **Presse‑AG Mini‑Bericht**"
      );
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "stunkel" && inv.id === "stundenplan" && state.flags.q_plan_started && !state.flags.q_plan_done){
      api.removeItem(inv.id);
      state.flags.q_plan_done = true;
      if (!api.hasItem("hallpass")) api.giveItem("hallpass");
      api.say("system",
        "**Jan Stünkel** nimmt den Ausdruck.\n" +
        "✅ Quest abgeschlossen: **Stundenplan‑Chaos**\n" +
        "Du bekommst: **Flur‑Pass**."
      );
      suggestNextStep(beforeProgress);
      return;
    }

    
    // --- Erweiterte Sidequests / Hauptquest (V6) ---
    if (npcId === "frech" && inv.id === "pinselset" && state.flags.q_kunst_started && !state.flags.q_kunst_done){
      api.removeItem(inv.id);
      state.flags.q_kunst_done = true;
      api.say("system", "✅ Du gibst das **Pinselset** ab. Dörte Frech grinst: \"Perfekt!\"");
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "hoffrichter" && inv.id === "klebeband" && state.flags.q_poster_started && !state.flags.q_poster_done){
      api.removeItem(inv.id);
      state.flags.q_poster_done = true;
      api.say("system", "✅ Klebeband übergeben. Das Plakat hängt – und hält.");
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "jeske" && inv.id === "konfliktkarten" && state.flags.q_frieden_started && !state.flags.q_frieden_done){
      api.removeItem(inv.id);
      state.flags.q_frieden_done = true;
      api.say("system", "✅ Konfliktkarten übergeben. Friedensrunde gerettet.");
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "fischer" && inv.id === "kaenguru_bogen" && state.flags.q_kaenguru_started && !state.flags.q_kaenguru_done){
      api.removeItem(inv.id);
      state.flags.q_kaenguru_done = true;
      api.say("system", "✅ Känguru‑Bogen abgegeben. Jetzt wird geknobelt.");
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "kraemer" && inv.id === "laborbrille" && state.flags.q_nawi_started && !api.hasItem("werkstattpass")){
      api.removeItem(inv.id);
      api.giveItem("werkstattpass");
      state.flags.q_nawi_done = true;
      api.say("system", "✅ Schutzbrille übergeben. Du bekommst einen **Werkstatt‑Pass**.");
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "religa" && inv.id === "ballpumpe" && state.flags.q_sport_started && !api.hasItem("sportpass")){
      api.removeItem(inv.id);
      api.giveItem("sportpass");
      state.flags.q_sport_done = true;
      api.say("system", "✅ Ballpumpe abgegeben. Du bekommst einen **Sportplatz‑Pass**.");
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "thienel" && inv.id === "dienstplan" && state.flags.q_dienstplan_started && !state.flags.q_dienstplan_done){
      api.removeItem(inv.id);
      state.flags.q_dienstplan_done = true;
      api.say("system", "✅ Dienstplan übergeben. Aushänge gerettet.");
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "steinbeck" && inv.id === "vokabelkarten" && state.flags.q_sprachen_started && !state.flags.q_sprachen_done){
      api.removeItem(inv.id);
      state.flags.q_sprachen_done = true;
      api.say("system", "✅ Vokabelkarten übergeben. Sprach‑Panik abgewendet.");
      suggestNextStep(beforeProgress);
      return;
    }

    if (npcId === "remmers" && inv.id === "skript_seite" && state.flags.q_theater_started && !state.flags.q_theater_done){
      api.removeItem(inv.id);
      state.flags.q_theater_done = true;
      api.say("system", "✅ Skript‑Seite übergeben. Probe kann weitergehen.");
      suggestNextStep(beforeProgress);
      return;
    }
    api.say("system", "Die Übergabe hat gerade keinen Effekt (oder ist nicht nötig).");
  }

  function answerLegacy(rest){
    // legacy: antworte mediothek -> Baustellenpass im Sekretariat
    const loc = currentLoc();
    const a = norm(rest);

    if (loc?.name?.includes("Sekretariat")){
      if (!state.flags.q_mensa_started){
        api.say("system", "Sprich zuerst mit Anja Pietsch: `rede pietsch`.");
        return;
      }
      if (!state.flags.saw_codeword_mediothek){
        api.say("system", "Du hast noch kein Codewort. Tipp: Mediothek → `untersuche schild`.");
        return;
      }
      if (a === "mediothek"){
        if (!api.hasItem("baustellenpass")){
          api.giveItem("baustellenpass");
          api.say("system", "✅ Du bekommst einen **Baustellenpass**.");
        } else {
          api.say("system", "Du hast den Baustellenpass schon.");
        }
        return;
      }
      api.say("system", "Das klingt nicht richtig. Tipp: Das Wort steht auf dem Schild in der Mediothek.");
      return;
    }

    api.say("system", "Hier erwartet gerade niemand eine Antwort.");
  }

  function showQuests(){
    // Auch als Chat-Ausgabe
    const lines = [];
    for (const q of (WORLD.quests || [])){
      const doneSteps = q.steps.filter(s => s.done(state)).length;
      const total = q.steps.length;
      lines.push(`- **${q.title}** (${doneSteps}/${total})`);
    }
    api.say("system", `**Quest-Status**\n${lines.join("\n")}`);
  }

  
  function sceneMetaLine(loc){
    const exits = (loc?.exits || []).map(ex => {
      const locked = ex.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId);
      return locked ? `${ex.label} (gesperrt)` : ex.label;
    });
    return exits.length ? `Ausgänge: ${exits.join(" • ")}` : "Keine Ausgänge.";
  }

  function buildAdjacency(){
    // directed graph from exits, honoring locks (blocked if missing required item)
    const adj = {};
    for (const [fromId, loc] of Object.entries(WORLD.locations || {})){
      adj[fromId] = [];
      for (const ex of (loc.exits || [])){
        if (!WORLD.locations[ex.to]) continue;
        const locked = ex.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId);
        if (locked) continue;
        adj[fromId].push({ to: ex.to, via: ex });
      }
    }
    return adj;
  }

  function shortestRoute(fromId, toId){
    if (fromId === toId) return [fromId];
    const adj = buildAdjacency();
    const q = [fromId];
    const prev = { [fromId]: null };
    while (q.length){
      const cur = q.shift();
      for (const nxt of (adj[cur] || [])){
        if (prev[nxt.to] !== undefined) continue;
        prev[nxt.to] = cur;
        if (nxt.to === toId) {
          q.length = 0; // break outer by clearing
          break;
        }
        q.push(nxt.to);
      }
    }
    if (prev[toId] === undefined) return null;
    // reconstruct
    const path = [];
    let cur = toId;
    while (cur){
      path.push(cur);
      cur = prev[cur];
    }
    path.reverse();
    return path;
  }

  function exitCommand(fromId, toId){
    const loc = WORLD.locations[fromId];
    const ex = (loc?.exits || []).find(e => e.to === toId);
    if (!ex) return null;
    const token = (ex.aliases && ex.aliases[0]) ? ex.aliases[0] : ex.label;
    return `gehen ${token}`;
  }

  function renderMap(){
  if (!els.mapBox) return;
  const map = WORLD.map;
  const nodes = map?.nodes || {};
  const viewBox = map?.viewBox || "0 0 1000 600";

  const curId = state.locationId;
  const curLoc = currentLoc();

  // neighborMap: exits from current (including locked)
  const neighborMap = new Map();
  for (const ex of (curLoc?.exits || [])){
    neighborMap.set(ex.to, ex);
  }

  // Build undirected unique edges from exits
  const edges = new Map();
  for (const [fromId, loc] of Object.entries(WORLD.locations || {})){
    for (const ex of (loc.exits || [])){
      const a = fromId;
      const b = ex.to;
      if (!nodes[a] || !nodes[b]) continue;
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!edges.has(key)) edges.set(key, { a, b });
    }
  }

  // Determine which nodes to show (declutter)
  // - near: show current + neighbors + 2-step nodes (faint), hide everything else
  // - all : show all nodes
  const mode = state.mapMode || "near";
  const show = new Set();
  const faint = new Set();

  const addNeighbors = (fromId) => {
    const loc = WORLD.locations[fromId];
    for (const ex of (loc?.exits || [])){
      if (!nodes[ex.to]) continue;
      show.add(ex.to);
    }
  };

  show.add(curId);
  addNeighbors(curId);

  if (mode !== "all"){
    // 2-step nodes (faint)
    for (const nId of Array.from(show)){
      if (nId === curId) continue;
      const loc = WORLD.locations[nId];
      for (const ex of (loc?.exits || [])){
        if (!nodes[ex.to]) continue;
        if (!show.has(ex.to) && ex.to !== curId){
          faint.add(ex.to);
        }
      }
    }
    for (const f of faint) show.add(f);
  } else {
    for (const k of Object.keys(nodes)) show.add(k);
  }

  // SVG setup
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("role", "img");

  // subtle background grid (light)
  const grid = document.createElementNS(NS, "g");
  grid.setAttribute("opacity", "0.25");
  const step = 80;
  for (let x=0; x<=1000; x+=step){
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", x); l.setAttribute("y1", 0);
    l.setAttribute("x2", x); l.setAttribute("y2", 600);
    l.setAttribute("stroke", "rgba(255,255,255,0.06)");
    l.setAttribute("stroke-width", "2");
    grid.appendChild(l);
  }
  for (let y=0; y<=600; y+=step){
    const l = document.createElementNS(NS, "line");
    l.setAttribute("x1", 0); l.setAttribute("y1", y);
    l.setAttribute("x2", 1000); l.setAttribute("y2", y);
    l.setAttribute("stroke", "rgba(255,255,255,0.06)");
    l.setAttribute("stroke-width", "2");
    grid.appendChild(l);
  }
  svg.appendChild(grid);

  // Draw edges (only if both ends shown)
  for (const {a, b} of edges.values()){
    if (!show.has(a) || !show.has(b)) continue;
    const A = nodes[a], B = nodes[b];

    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", A.x); line.setAttribute("y1", A.y);
    line.setAttribute("x2", B.x); line.setAttribute("y2", B.y);

    let opacity = "0.18";
    let stroke = "rgba(229,231,235,0.22)";
    let width = "4";
    let dash = "";

    const touchesCur = (a === curId || b === curId);
    if (touchesCur){ opacity = "0.65"; stroke = "rgba(59,130,246,0.55)"; width = "6"; }

    // If neighbor from current is locked, draw dashed + amber
    const neighborId = (a === curId) ? b : (b === curId ? a : null);
    if (neighborId){
      const ex = neighborMap.get(neighborId);
      if (ex && ex.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId)){
        dash = "10 7";
        stroke = "rgba(245,158,11,0.65)";
        opacity = "0.70";
        width = "6";
      }
    }

    // Faint edges to faint nodes
    if (faint.has(a) || faint.has(b)){
      opacity = touchesCur ? opacity : "0.12";
    }

    line.setAttribute("stroke", stroke);
    line.setAttribute("stroke-width", width);
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("opacity", opacity);
    if (dash) line.setAttribute("stroke-dasharray", dash);

    svg.appendChild(line);
  }

  // Tooltip layer (HTML)
  els.mapBox.style.position = "relative";
  let tip = els.mapBox.querySelector(".map__tooltip");
  if (!tip){
    tip = document.createElement("div");
    tip.className = "map__tooltip";
    els.mapBox.appendChild(tip);
  }

  const showTip = (x, y, title, meta) => {
    tip.innerHTML = `${title}${meta ? `<br><small>${meta}</small>` : ""}`;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
    tip.classList.add("map__tooltip--show");
  };
  const hideTip = () => tip.classList.remove("map__tooltip--show");

  // Node click behavior
  const onNodeClick = (locId) => {
    if (locId === curId) return;

    const ex = neighborMap.get(locId);
    const isNeighbor = !!ex;
    const lockedFromHere = !!(ex && ex.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId));

    if (isNeighbor){
      if (lockedFromHere){
        api.say("system", ex.lockedText || "Der Weg ist gesperrt.");
        return;
      }
      api.moveTo(locId);
      describeLocation();
      maybeTriggerLocationEvent(locId);
      return;
    }

    const path = shortestRoute(curId, locId);
    if (!path || path.length < 2){
      api.say("system", "Dorthin kommst du gerade nicht (noch gesperrt oder kein Weg).");
      return;
    }

    const cmds = [];
    for (let i=0; i<path.length-1; i++){
      const c = exitCommand(path[i], path[i+1]);
      if (c) cmds.push(c);
    }

    api.say("system", `Du kommst da nicht direkt hin.\nKürzeste Route:\n• ${cmds.join("\n• ")}`);
    if (cmds[0]) { els.input.value = cmds[0]; els.input.focus(); }
  };

  // Draw nodes
  for (const [locId, n] of Object.entries(nodes)){
    if (!show.has(locId)) continue;

    const isHere = locId === curId;
    const ex = neighborMap.get(locId);
    const isNeighbor = !!ex;
    const lockedFromHere = !!(ex && ex.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId));
    const isFaint = faint.has(locId) && !isNeighbor && !isHere;

    const g = document.createElementNS(NS, "g");
    g.setAttribute("cursor", "pointer");

    const r = isHere ? 16 : (isNeighbor ? 13 : (isFaint ? 9 : 11));

    // halo
    const halo = document.createElementNS(NS, "circle");
    halo.setAttribute("cx", n.x); halo.setAttribute("cy", n.y);
    halo.setAttribute("r", r + 10);
    halo.setAttribute("fill", "rgba(255,255,255,0)");
    halo.setAttribute("stroke", isHere ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.06)");
    halo.setAttribute("stroke-width", "6");
    halo.setAttribute("opacity", isFaint ? "0.35" : "0.85");
    g.appendChild(halo);

    const dot = document.createElementNS(NS, "circle");
    dot.setAttribute("cx", n.x); dot.setAttribute("cy", n.y);
    dot.setAttribute("r", r);

    let fill = "rgba(255,255,255,0.12)";
    let stroke = "rgba(255,255,255,0.22)";
    let opacity = isFaint ? "0.55" : "1";

    if (isHere){
      fill = "rgba(59,130,246,0.55)";
      stroke = "rgba(59,130,246,0.85)";
    } else if (lockedFromHere){
      fill = "rgba(245,158,11,0.34)";
      stroke = "rgba(245,158,11,0.75)";
    } else if (isNeighbor){
      fill = "rgba(34,197,94,0.36)";
      stroke = "rgba(34,197,94,0.72)";
    }

    dot.setAttribute("fill", fill);
    dot.setAttribute("stroke", stroke);
    dot.setAttribute("stroke-width", "2");
    dot.setAttribute("opacity", opacity);
    g.appendChild(dot);

    // Labels: only show for current + neighbors (and in "all" mode: show also for non-faint)
    const showLabel = isHere || isNeighbor || (mode === "all" && !isFaint);
    if (showLabel){
      const mapWidth = Number((viewBox.split(/\s+/)[2])) || 1000;
      const labelText = n.label || locId;
      const placeLeft = n.x > mapWidth - 170;

      const label = document.createElementNS(NS, "text");
      label.setAttribute("x", placeLeft ? n.x - 18 : n.x + 18);
      label.setAttribute("y", n.y + 6);
      label.setAttribute("text-anchor", placeLeft ? "end" : "start");
      label.setAttribute("fill", isFaint ? "rgba(229,231,235,0.50)" : "rgba(229,231,235,0.82)");
      label.setAttribute("stroke", "rgba(2,6,23,0.92)");
      label.setAttribute("stroke-width", isHere ? "4" : "3");
      label.setAttribute("paint-order", "stroke");
      label.setAttribute("font-size", isHere ? "18" : "16");
      label.setAttribute("font-weight", isHere ? "700" : "600");
      label.setAttribute("font-family", "system-ui");
      label.textContent = labelText;
      g.appendChild(label);
    }

    // Hover tooltip: always
    g.addEventListener("mousemove", (ev) => {
      const rect = els.mapBox.getBoundingClientRect();
      const title = n.label || locId;
      let meta = "";
      if (locId === curId) meta = "Du bist hier";
      else if (isNeighbor) meta = lockedFromHere ? "Nachbar (gesperrt)" : "Nachbar (klick zum Gehen)";
      else meta = "Klick: Route anzeigen";
      showTip(ev.clientX - rect.left, ev.clientY - rect.top, title, meta);
    });
    g.addEventListener("mouseleave", hideTip);
    g.addEventListener("click", () => onNodeClick(locId));

    svg.appendChild(g);
  }

  // Replace svg (keep tooltip div)
  const oldSvg = els.mapBox.querySelector("svg");
  if (oldSvg) oldSvg.remove();
  els.mapBox.insertBefore(svg, tip);

  // Hide tooltip when leaving the map area
  els.mapBox.addEventListener("mouseleave", hideTip, { once: true });
}
function syncMapTabs(){
  const mode = state.mapMode || "near";
  if (!els.mapModeNear || !els.mapModeAll) return;
  const near = mode !== "all";
  els.mapModeNear.classList.toggle("tab--active", near);
  els.mapModeNear.setAttribute("aria-selected", near ? "true" : "false");
  els.mapModeAll.classList.toggle("tab--active", !near);
  els.mapModeAll.setAttribute("aria-selected", !near ? "true" : "false");
}

// ---------- Rendering ----------
  function renderScene(){
    const loc = currentLoc();
    els.sceneTitle.textContent = loc?.name || "—";
    els.locationLine.textContent = `${WORLD.meta.setting} — ${loc?.name || "—"}`;
    els.sceneMeta.textContent = sceneMetaLine(loc);

    const img = loc?.image || "";
    els.sceneImg.src = img;
    els.sceneImg.alt = loc?.name || "Szene";
  }

  function renderLog(scrollToBottom){
    els.log.innerHTML = "";
    for (const msg of state.log){
      const row = document.createElement("div");
      row.className = `msg ${msg.role === "user" ? "msg--user" : "msg--system"}`;

      const bubble = document.createElement("div");
      bubble.className = "bubble";

      const safe = (msg.text || "")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br/>");

      bubble.innerHTML = safe;

      if (msg.t){
        const meta = document.createElement("div");
        meta.className = "bubble__meta";
        meta.textContent = msg.t;
        bubble.appendChild(meta);
      }

      row.appendChild(bubble);
      els.log.appendChild(row);
    }
    if (scrollToBottom){
      els.log.scrollTop = els.log.scrollHeight;
    }
  }

  function contextPills(cmds){
    const wrap = document.createElement("div");
    wrap.className = "suggest";
    for (const c of cmds){
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.textContent = c;
      btn.addEventListener("click", () => {
        els.input.value = c;
        els.input.focus();
      });
      wrap.appendChild(btn);
    }
    return wrap;
  }

  function buildNextStepCommands(loc){
    const quests = WORLD.quests || [];

    for (const q of quests){
      const steps = q.steps || [];
      const doneSteps = steps.filter(step => step.done(state)).length;
      if (doneSteps === 0 || doneSteps >= steps.length) continue;

      const cmds = [];
      const stepText = norm(steps[doneSteps]?.text || "");

      if (stepText.includes("rede") && (loc?.npcs || []).length){
        const npcId = (loc.npcs || []).find(id => {
          const npc = WORLD.npcs[id];
          return npc && stepText.includes(norm(npc.name));
        }) || loc.npcs[0];
        const npc = WORLD.npcs[npcId];
        if (npc) cmds.push(`rede ${npc.aliases?.[0] || norm(npc.name).split(" ").slice(-1)[0]}`);
      }

      if (stepText.includes("untersuche") && Object.keys(loc?.objects || {}).length){
        const objectName = Object.keys(loc.objects).find(key => stepText.includes(norm(key)));
        const obj = objectName ? loc.objects[objectName] : Object.values(loc.objects)[0];
        if (obj) cmds.push(`untersuche ${obj.aliases?.[0] || norm(obj.name)}`);
      }

      if (stepText.includes("gib") && state.inventory.length){
        const invItem = state.inventory[0];
        const item = WORLD.items[invItem];
        if (item && (loc?.npcs || []).length){
          const npc = WORLD.npcs[loc.npcs[0]];
          if (npc) cmds.push(`gib ${item.aliases?.[0] || norm(item.name)} ${npc.aliases?.[0] || norm(npc.name).split(" ").slice(-1)[0]}`);
        }
      }

      if ((stepText.includes("geh") || stepText.includes("in die") || stepText.includes("im ")) && (loc?.exits || []).length){
        const unlockedExit = loc.exits.find(ex => !(ex.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId)));
        if (unlockedExit) cmds.push(`gehen ${unlockedExit.aliases?.[0] || unlockedExit.label}`);
      }

      if (cmds.length){
        return [...new Set(cmds)].slice(0, 2);
      }
    }

    const fallback = [];
    if ((loc?.npcs || []).length){
      const npc = WORLD.npcs[loc.npcs[0]];
      if (npc) fallback.push(`rede ${npc.aliases?.[0] || norm(npc.name).split(" ").slice(-1)[0]}`);
    }
    if ((loc?.exits || []).length){
      const ex = loc.exits.find(x => !(x.locked && x.lock?.type === "item" && !api.hasItem(x.lock.itemId))) || loc.exits[0];
      fallback.push(`gehen ${ex.aliases?.[0] || ex.label}`);
    }
    fallback.push("quests");
    return [...new Set(fallback)].slice(0, 2);
  }

  function renderHelp(){
    const loc = currentLoc();
    els.nextStepBox.innerHTML = "";
    els.contextBox.innerHTML = "";

    const exits = (loc?.exits || []).map(ex => {
      const locked = ex.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId);
      return locked ? `${ex.label} (gesperrt)` : ex.label;
    });

    const npcNames = (loc?.npcs || []).map(id => WORLD.npcs[id]?.name).filter(Boolean);
    const objNames = Object.values(loc?.objects || {}).map(o => o.name).filter(Boolean);
    const locItems = availableLocationItems(loc).map(id => WORLD.items[id]?.name).filter(Boolean);

    const nextStepCmds = buildNextStepCommands(loc);
    const nextTitle = document.createElement("div");
    nextTitle.className = "help__muted";
    nextTitle.textContent = "Empfohlen jetzt:";
    els.nextStepBox.appendChild(nextTitle);
    els.nextStepBox.appendChild(contextPills(nextStepCmds));

    const cmds = [];
    cmds.push("hilfe", "wo", "quests", "inventar");

    const priorityHint = getPriorityHintText();
    if (priorityHint){
      const prio = document.createElement("div");
      prio.className = "help__priority";
      prio.innerHTML = `<strong>Priorität</strong><div style="margin-top:6px">${priorityHint.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`;
      els.contextBox.appendChild(prio);
    }

    for (const e of (loc?.exits || [])){
      cmds.push(`gehen ${e.aliases?.[0] || e.label}`);
    }
    for (const n of npcNames){
      const nn = norm(n);
      const token = nn.split(" ").slice(-1)[0] || nn;
      cmds.push(`rede ${token}`);
    }
    for (const o of Object.values(loc?.objects || {})){
      cmds.push(`untersuche ${o.aliases?.[0] || norm(o.name)}`);
    }
    for (const name of locItems){
      cmds.push(`nimm ${norm(name)}`);
    }

    const contextDetails = document.createElement("details");

    const contextSummary = document.createElement("summary");
    contextSummary.className = "help__muted";
    contextSummary.textContent = "Optionale Kontext-Hinweise";
    contextDetails.appendChild(contextSummary);

    const title = document.createElement("div");
    title.className = "help__muted";
    title.style.marginTop = "8px";
    title.textContent = "Klickbare Vorschläge:";
    contextDetails.appendChild(title);
    contextDetails.appendChild(contextPills([...new Set(cmds)].slice(0, 16)));

    const info = document.createElement("div");
    info.className = "help__muted";
    info.style.marginTop = "10px";
    info.innerHTML =
      `<div><strong>Ausgänge:</strong> ${exits.length ? exits.join(", ") : "—"}</div>
       <div style="margin-top:6px"><strong>Personen:</strong> ${npcNames.length ? npcNames.join(", ") : "—"}</div>
       <div style="margin-top:6px"><strong>Items:</strong> ${locItems.length ? locItems.join(", ") : "—"}</div>
       <div style="margin-top:6px"><strong>Interaktionen:</strong> ${objNames.length ? objNames.join(", ") : "—"}</div>`;
    contextDetails.appendChild(info);
    els.contextBox.appendChild(contextDetails);

    renderRelationshipBox();
    renderQuestBox(nextStepCmds);
  }

  function relationshipLabel(value){
    if (value >= 3) return "sehr gut";
    if (value >= 1) return "gut";
    if (value <= -3) return "kritisch";
    if (value <= -1) return "kühl";
    return "neutral";
  }

  function renderRelationshipBox(){
    if (!els.relationshipBox) return;
    els.relationshipBox.innerHTML = "";

    const important = Array.isArray(WORLD.relationshipHighlights) ? WORLD.relationshipHighlights : [];
    const known = important
      .filter((npcId) => state.knownRelationships[npcId])
      .map((npcId) => ({ npcId, npc: WORLD.npcs[npcId], value: api.getReputation(npcId) }))
      .filter((entry) => entry.npc && entry.npc.name)
      .sort((a, b) => b.value - a.value || a.npc.name.localeCompare(b.npc.name, "de"));

    if (!known.length){
      const empty = document.createElement("div");
      empty.className = "help__muted";
      empty.textContent = "Sprich mit zentralen NPCs, um Beziehungen sichtbar zu machen.";
      els.relationshipBox.appendChild(empty);
      return;
    }

    const wrap = document.createElement("div");
    wrap.className = "rel";

    for (const entry of known){
      const row = document.createElement("div");
      row.className = "rel__row";

      const name = document.createElement("div");
      name.className = "rel__name";
      name.textContent = entry.npc.name;

      const meter = document.createElement("div");
      meter.className = "rel__meter";

      const bar = document.createElement("div");
      bar.className = "rel__bar";
      const fill = document.createElement("div");
      fill.className = "rel__fill";
      fill.style.width = `${Math.max(0, Math.min(100, (entry.value + 5) * 10))}%`;
      bar.appendChild(fill);

      const label = document.createElement("span");
      label.className = "rel__value";
      label.textContent = `${entry.value > 0 ? "+" : ""}${entry.value} ${relationshipLabel(entry.value)}`;

      meter.appendChild(bar);
      meter.appendChild(label);

      row.appendChild(name);
      row.appendChild(meter);
      wrap.appendChild(row);
    }

    els.relationshipBox.appendChild(wrap);
  }

  function renderQuestBox(nextStepCmds){
    els.questBox.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "q";

    const sections = {
      active: [],
      inactive: [],
      done: []
    };

    function getQuestStatus(doneSteps, total){
      if (total > 0 && doneSteps >= total) return "done";
      if (doneSteps > 0) return "active";
      return "inactive";
    }

    function buildQuestBlock(q, doneSteps, total, status){
      const block = document.createElement("div");
      block.className = `q__quest q__quest--${status}`;

      const t = document.createElement("div");
      t.className = "q__title";
      t.textContent = `${q.title} (${doneSteps}/${total})`;
      block.appendChild(t);

      for (const step of q.steps){
        const row = document.createElement("div");
        row.className = "q__step";

        const dot = document.createElement("div");
        const done = step.done(state);
        dot.className = `q__dot ${done ? "q__dot--done" : ""}`;

        const txt = document.createElement("div");
        txt.textContent = step.text;

        row.appendChild(dot);
        row.appendChild(txt);
        block.appendChild(row);
      }

      return block;
    }

    function sectionTitle(text){
      const title = document.createElement("div");
      title.className = "q__sectionTitle";
      title.textContent = text;
      return title;
    }

    for (const q of (WORLD.quests || [])){
      const doneSteps = q.steps.filter(step => step.done(state)).length;
      const total = q.steps.length;
      const status = getQuestStatus(doneSteps, total);
      sections[status].push(buildQuestBlock(q, doneSteps, total, status));
    }

    if (nextStepCmds && nextStepCmds.length){
      const hint = document.createElement("div");
      hint.className = "help__muted";
      hint.textContent = `Priorität: ${nextStepCmds.join(" • ")}`;
      wrap.appendChild(hint);
    }

    const activeSection = document.createElement("div");
    activeSection.className = "q__section";
    activeSection.appendChild(sectionTitle("Aktiv"));
    if (sections.active.length){
      for (const quest of sections.active) activeSection.appendChild(quest);
    } else {
      const empty = document.createElement("div");
      empty.className = "help__muted";
      empty.textContent = "Derzeit keine aktiven Quests.";
      activeSection.appendChild(empty);
    }
    wrap.appendChild(activeSection);

    const optionalDetails = document.createElement("details");
    optionalDetails.className = "q__section q__section--optional";

    const optionalSummary = document.createElement("summary");
    optionalSummary.className = "q__sectionTitle q__sectionTitle--summary";
    optionalSummary.textContent = "Weitere Quest-Details";
    optionalDetails.appendChild(optionalSummary);

    const inactiveSection = document.createElement("div");
    inactiveSection.className = "q__section";
    inactiveSection.appendChild(sectionTitle("Optional / Noch nicht gestartet"));
    if (sections.inactive.length){
      for (const quest of sections.inactive) inactiveSection.appendChild(quest);
    } else {
      const empty = document.createElement("div");
      empty.className = "help__muted";
      empty.textContent = "Alle optionalen Quests wurden gestartet.";
      inactiveSection.appendChild(empty);
    }
    optionalDetails.appendChild(inactiveSection);

    const doneSection = document.createElement("div");
    doneSection.className = "q__section";
    doneSection.appendChild(sectionTitle("Abgeschlossen"));
    if (sections.done.length){
      for (const quest of sections.done) doneSection.appendChild(quest);
    } else {
      const empty = document.createElement("div");
      empty.className = "help__muted";
      empty.textContent = "Noch keine abgeschlossenen Quests.";
      doneSection.appendChild(empty);
    }
    optionalDetails.appendChild(doneSection);

    wrap.appendChild(optionalDetails);
    els.questBox.appendChild(wrap);
  }

  function renderAll(){
    syncMapTabs();
    renderScene();
    renderMap();
    renderHelp();
    renderLog(true);
  }

  // ---------- Persistence ----------
  function saveAuto(){
    try {
      const data = JSON.stringify({
        locationId: state.locationId,
        
        mapMode: state.mapMode,inventory: state.inventory,
        relationships: state.relationships,
        knownRelationships: state.knownRelationships,
        priorityHint: state.priorityHint,
        eventMemory: state.eventMemory,
        groupSceneMemory: state.groupSceneMemory,
        spawnedItems: state.spawnedItems,
        moveCount: state.moveCount,
        actionCount: state.actionCount,
        flags: state.flags,
        log: state.log,
        taken: state.taken
      });
      localStorage.setItem(STORAGE_KEY, data);
    } catch {}
  }

  function saveManual(){
    saveAuto();
    api.say("system", "💾 Gespeichert.");
  }

  function load(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);

      state.locationId = data.locationId || state.locationId;
      
      state.mapMode = (data.mapMode === "all" ? "all" : "near");state.inventory = Array.isArray(data.inventory) ? data.inventory : state.inventory;
      state.relationships = data.relationships || state.relationships;
      state.knownRelationships = data.knownRelationships || state.knownRelationships;
      state.priorityHint = typeof data.priorityHint === "string" ? data.priorityHint : "";
      state.eventMemory = data.eventMemory || {};
      state.groupSceneMemory = data.groupSceneMemory || {};
      state.spawnedItems = data.spawnedItems || {};
      state.moveCount = Number.isFinite(data.moveCount) ? data.moveCount : 0;
      state.actionCount = Number.isFinite(data.actionCount) ? data.actionCount : 0;
      state.flags = data.flags || state.flags;
      state.log = Array.isArray(data.log) ? data.log : [];
      state.taken = data.taken || {};
      return true;
    } catch {
      return false;
    }
  }

  function reset(){
    localStorage.removeItem(STORAGE_KEY);
    state.locationId = WORLD.start.locationId;
    state.inventory = [...WORLD.start.inventory];
    state.relationships = { ...(WORLD.start.relationships || {}) };
    state.knownRelationships = { ...(WORLD.start.knownRelationships || {}) };
    state.flags = { ...(WORLD.start.flags || {}) };
    state.log = [];
    state.taken = {};
    state.priorityHint = "";
    state.eventMemory = {};
    state.groupSceneMemory = {};
    state.spawnedItems = {};
    state.moveCount = 0;
    state.actionCount = 0;
    renderAll();

    api.say("system",
`Willkommen! Du hast mehrere Quests:
1) **Mensa‑Ready**: Sekretariat → Pietsch → Mediothek → Baustellenpass → Hausmeister → Mensa
2) **iPad‑Rettung**: Mediothek → Sauer → Sekretariat 2 → Lehrerzimmer → gib Kabel an Sauer
3) **Presse‑AG**: Aula → Engel → Trakt 3 → gib Notiz an Engel
4) **Stundenplan‑Chaos**: Schulleitung → Seiberlich → IT‑Labor drucken → gib an Stünkel`);
    describeLocation();
  }

  // ---------- Input handling ----------
  function handleInput(input){
    const cmd = splitCommand(input);
    if (!cmd) return;

    // Always echo user input
    api.say("user", cmd.raw);
    state.actionCount += 1;

    switch (cmd.verb){
      case "hilfe": help(); break;
      case "wo": describeLocation(); break;
      case "gehen": moveTo(cmd.rest); break;
      case "untersuche": examine(cmd.rest); break;
      case "rede": talkTo(cmd.rest); break;
      case "nimm": takeItem(cmd.rest); break;
      case "gib": giveItem(cmd.rest); break;
      case "inventar": describeInventory(); break;
      case "quests": showQuests(); break;
      case "klar": clearChat(); break;
      case "antworte": answerLegacy(cmd.rest); break; // compatibility
      default:
        api.say("system", "Das habe ich nicht verstanden. Tipp: `hilfe`");
    }
  }

  // ---------- Boot ----------
  function init(){
    if (!WORLD || !WORLD.locations){
      els.log.innerHTML = `<div style="padding:14px;color:#fff">
        <strong>Fehler:</strong> WORLD konnte nicht geladen werden.<br/>
        Prüfe, ob <code>data/world.js</code> im gleichen Ordner liegt und im HTML eingebunden ist.
      </div>`;
      return;
    }

    // Submit handler
    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = els.input.value;
      els.input.value = "";
      handleInput(v);
    });

    els.btnSave.addEventListener("click", saveManual);
    els.btnReset.addEventListener("click", reset);


// Map tabs (Umgebung/Gesamt)
if (els.mapModeNear && els.mapModeAll){
  els.mapModeNear.addEventListener("click", () => {
    state.mapMode = "near";
    saveAuto();
    syncMapTabs();
    renderMap();
  });
  els.mapModeAll.addEventListener("click", () => {
    state.mapMode = "all";
    saveAuto();
    syncMapTabs();
    renderMap();
  });
}

    const hadSave = load();
    renderAll();

    if (!hadSave){
      api.say("system",
`Willkommen! Du spielst in der ${WORLD.meta.setting}.
Dein Ziel: löse ein paar Mini‑Quests. Starte z.B. mit \`gehen sekretariat\` und \`rede pietsch\`.`);
      describeLocation();
    } else {
      api.say("system", "🔁 Spielstand geladen.");
      describeLocation();
    }
  }

  window.addEventListener("DOMContentLoaded", init);
})();
