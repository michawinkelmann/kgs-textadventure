// game.js
import { WORLD } from "./data/world.js";

const els = {
  locationLine: document.querySelector("#locationLine"),
  sceneImg: document.querySelector("#sceneImg"),
  sceneTitle: document.querySelector("#sceneTitle"),
  sceneMeta: document.querySelector("#sceneMeta"),
  log: document.querySelector("#log"),
  form: document.querySelector("#inputForm"),
  input: document.querySelector("#commandInput"),
  contextBox: document.querySelector("#contextBox"),
  btnSave: document.querySelector("#btnSave"),
  btnReset: document.querySelector("#btnReset"),
};

const STORAGE_KEY = "kgs_textadventure_save_v1";

const state = {
  locationId: WORLD.start.locationId,
  inventory: [...WORLD.start.inventory],
  flags: { ...(WORLD.start.flags || {}) },
  log: []
};

const api = {
  say(role, text, meta) {
    state.log.push({ role, text, meta: meta || "" });
    renderLog(true);
    saveAuto();
  },
  setFlag(key, val) { state.flags[key] = val; saveAuto(); },
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
    state.locationId = locationId;
    renderAll();
    saveAuto();
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
  const raw = input.trim();
  const cleaned = norm(raw);
  if (!cleaned) return null;

  const parts = cleaned.split(" ");
  const verbRaw = parts[0];
  const rest = parts.slice(1).join(" ").trim();

  // Synonyme
  const verbMap = new Map([
    ["h", "hilfe"], ["help", "hilfe"], ["hilfe", "hilfe"],

    ["wo", "wo"], ["ort", "wo"],

    ["geh", "gehen"], ["gehe", "gehen"], ["gehen", "gehen"],

    ["untersuche", "untersuche"], ["schau", "untersuche"], ["sieh", "untersuche"], ["check", "untersuche"],

    ["rede", "rede"], ["sprich", "rede"], ["talk", "rede"],

    ["nimm", "nimm"], ["nehm", "nimm"], ["nehme", "nimm"], ["take", "nimm"],

    ["inventar", "inventar"], ["inv", "inventar"],

    ["antworte", "antworte"], ["antwort", "antworte"],

    ["klar", "klar"], ["clear", "klar"],
  ]);

  const verb = verbMap.get(verbRaw) || verbRaw;
  return { verb, rest, raw };
}

function currentLoc(){ return WORLD.locations[state.locationId]; }

function getNpcByQuery(q){
  const qn = norm(q);
  const loc = currentLoc();
  const npcIds = loc.npcs || [];
  for (const id of npcIds){
    const npc = WORLD.npcs[id];
    const all = [npc.name, ...(npc.aliases || [])].map(norm);
    if (all.includes(qn)) return npc;
  }
  return null;
}

function getInvItemByQuery(q){
  const qn = norm(q);
  for (const id of state.inventory){
    const item = WORLD.items[id];
    const all = [item.name, ...(item.aliases || [])].map(norm);
    if (all.includes(qn)) return { item, id };
  }
  return null;
}

function isTaken(itemId){
  return !!state.flags[`taken_${itemId}`];
}

function getLocationItemByQuery(q){
  const qn = norm(q);
  const loc = currentLoc();
  const locItems = loc.items || [];
  for (const itemId of locItems){
    if (isTaken(itemId)) continue;
    const item = WORLD.items[itemId];
    if (!item) continue;
    const all = [item.name, ...(item.aliases || [])].map(norm);
    if (all.includes(qn)) return { itemId, item };
  }
  return null;
}

function getObjectByQuery(q){
  const qn = norm(q);
  const loc = currentLoc();
  const objs = loc.objects || {};
  for (const key of Object.keys(objs)){
    const obj = objs[key];
    const all = [obj.name, ...(obj.aliases || [])].map(norm);
    if (all.includes(qn)) return obj;
  }
  return null;
}

function findExitByQuery(q){
  const qn = norm(q);
  const loc = currentLoc();
  for (const ex of (loc.exits || [])){
    const all = [ex.label, ...(ex.aliases || [])].map(norm);
    if (all.includes(qn)) return ex;
  }
  return null;
}

function describeLocation(){
  const loc = currentLoc();
  api.say("system", `**${loc.name}**\n${loc.description}`);
}

function describeInventory(){
  if (!state.inventory.length){
    api.say("system", "Dein Inventar ist leer.");
    return;
  }
  const lines = state.inventory.map(id => `- ${WORLD.items[id]?.name || id}`);
  api.say("system", `**Inventar:**\n${lines.join("\n")}`);
}

function talkTo(q){
  const npc = getNpcByQuery(q);
  if (!npc){
    api.say("system", "Hier ist niemand mit diesem Namen.");
    return;
  }
  const idxKey = `talk_${norm(npc.name)}`;
  const idx = (state.flags[idxKey] || 0);
  const line = npc.dialogue?.[idx] ?? npc.dialogue?.[npc.dialogue.length - 1] ?? "…";
  state.flags[idxKey] = Math.min(idx + 1, (npc.dialogue?.length || 1) - 1);
  api.say("system", `**${npc.name}** (${npc.role})\n${line}`);
  renderHelp();
}

function examine(q){
  if (!q){
    api.say("system", "Was soll ich untersuchen? Beispiel: `untersuche schild`");
    return;
  }

  const obj = getObjectByQuery(q);
  if (obj){
    api.say("system", `**${obj.name}**\n${obj.description}`);
    if (typeof obj.onExamine === "function") obj.onExamine(state, api);
    return;
  }

  const npc = getNpcByQuery(q);
  if (npc){
    api.say("system", `**${npc.name}**\n${npc.description}`);
    return;
  }

  const inv = getInvItemByQuery(q);
  if (inv){
    api.say("system", `**${inv.item.name}**\n${inv.item.description}`);
    return;
  }

  const locItem = getLocationItemByQuery(q);
  if (locItem){
    api.say("system", `**${locItem.item.name}**\n${locItem.item.description}`);
    return;
  }

  api.say("system", "Dazu finde ich hier nichts Passendes.");
}

function takeItem(q){
  if (!q){
    api.say("system", "Was möchtest du nehmen? Beispiel: `nimm notiz`");
    return;
  }

  const locItem = getLocationItemByQuery(q);
  if (!locItem){
    api.say("system", "Hier liegt kein passendes Item.");
    return;
  }

  if (!locItem.item.takeable){
    api.say("system", "Das kannst du nicht einfach mitnehmen.");
    return;
  }

  api.giveItem(locItem.itemId);
  api.setFlag(`taken_${locItem.itemId}`, true);
  api.say("system", `Du nimmst **${locItem.item.name}**.`);
}

function moveTo(q){
  if (!q){
    api.say("system", "Wohin? Beispiel: `gehen mensa`");
    return;
  }

  const exit = findExitByQuery(q);
  if (!exit){
    api.say("system", "Dahin kommst du von hier aus nicht direkt.");
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
}

function answer(rest){
  const loc = currentLoc();
  const a = norm(rest);

  if (loc && loc.name.includes("Sekretariat")){
    if (!api.getFlag("saw_codeword_mediothek")){
      api.say("system", "Du hast noch kein Codewort. Tipp: Geh in die Mediothek und untersuche das Schild.");
      return;
    }

    if (a === "mediothek"){
      if (!api.hasItem("baustellenpass")){
        api.giveItem("baustellenpass");
        api.say("system", "✅ Frau Pietsch nickt: „Stimmt.“ Du bekommst einen **Baustellenpass**.");
      } else {
        api.say("system", "Du hast den Baustellenpass schon.");
      }
      return;
    }

    if (a === "solaris"){
      if (!api.getFlag("chapter1_complete")){
        api.say("system", "Das zweite Codewort gilt erst nach Kapitel 1. Prüfe zuerst die Essensausgabe in der Mensa.");
        return;
      }
      if (!api.getFlag("saw_codeword_solaris")){
        api.say("system", "Fast. Das Codewort findest du am Schwarzen Brett in der Mensa.");
        return;
      }
      if (!api.hasItem("laborzugang")){
        api.giveItem("laborzugang");
        api.say("system", "🔓 Neues Kapitel: Du bekommst die **Laborzugangskarte** fürs Innovationslabor.");
      } else {
        api.say("system", "Die Laborzugangskarte hast du bereits.");
      }
      return;
    }

    api.say("system", "Das klingt nicht richtig. Tipp: Mögliche Codewörter sind in Mediothek oder Mensa versteckt.");
    return;
  }

  api.say("system", "Hier erwartet gerade niemand eine Antwort.");
}

function clearChat(){
  state.log = [];
  renderLog(false);
  api.say("system", "Chat geleert.");
}

function help(){
  api.say("system",
`**Hilfe**
- \`wo\` / \`hilfe\`
- \`gehen <ziel>\`
- \`untersuche <ding>\`
- \`rede <name>\`
- \`inventar\`
- \`nimm <ding>\`
- \`antworte <text>\`

Tipp: Nutze die Vorschläge im Kontext‑Kasten rechts.`);
}

function handleInput(input){
  const cmd = splitCommand(input);
  if (!cmd) return;

  api.say("user", cmd.raw);

  switch (cmd.verb){
    case "hilfe": help(); break;
    case "wo": describeLocation(); break;
    case "gehen": moveTo(cmd.rest); break;
    case "untersuche": examine(cmd.rest); break;
    case "rede": talkTo(cmd.rest); break;
    case "nimm": takeItem(cmd.rest); break;
    case "inventar": describeInventory(); break;
    case "antworte": answer(cmd.rest); break;
    case "klar": clearChat(); break;
    default:
      api.say("system", "Das habe ich nicht verstanden. Tipp: `hilfe`");
  }
}

function renderScene(){
  const loc = currentLoc();
  els.sceneTitle.textContent = loc.name;
  els.locationLine.textContent = `${WORLD.meta.setting} — ${loc.name}`;
  els.sceneMeta.textContent = "Tipps rechts im Kontext.";

  els.sceneImg.src = loc.image || "";
  els.sceneImg.alt = loc.name;
}

function renderLog(scrollToBottom){
  els.log.innerHTML = "";
  for (const msg of state.log){
    const row = document.createElement("div");
    row.className = `msg ${msg.role === "user" ? "msg--user" : "msg--system"}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    // mini-markdown: **bold** + Zeilenumbrüche
    const safe = (msg.text || "")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");

    bubble.innerHTML = safe;

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

function renderHelp(){
  const loc = currentLoc();
  els.contextBox.innerHTML = "";

  // Exits
  const exits = (loc.exits || []).map(ex => {
    const locked = ex.locked && ex.lock?.type === "item" && !api.hasItem(ex.lock.itemId);
    return locked ? `${ex.label} (gesperrt)` : ex.label;
  });

  // NPCs
  const npcNames = (loc.npcs || []).map(id => WORLD.npcs[id]?.name).filter(Boolean);

  // Objects
  const objNames = Object.values(loc.objects || {}).map(o => o.name);
  const itemNames = (loc.items || [])
    .filter(itemId => !isTaken(itemId))
    .map(itemId => WORLD.items[itemId]?.name)
    .filter(Boolean);

  const cmds = [];

  // Suggestions (clickable)
  cmds.push("hilfe", "wo");
  for (const e of (loc.exits || [])){
    cmds.push(`gehen ${e.aliases?.[0] || e.label}`);
  }
  for (const n of npcNames){
    const nn = norm(n);
    // prefer last name token
    const token = nn.split(" ").slice(-1)[0] || nn;
    cmds.push(`rede ${token}`);
  }
  for (const o of Object.values(loc.objects || {})){
    cmds.push(`untersuche ${o.aliases?.[0] || norm(o.name)}`);
  }
  for (const itemId of (loc.items || [])){
    if (isTaken(itemId)) continue;
    const item = WORLD.items[itemId];
    if (!item) continue;
    cmds.push(`nimm ${item.aliases?.[0] || norm(item.name)}`);
  }
  cmds.push("inventar");

  const title = document.createElement("div");
  title.className = "help__muted";
  title.textContent = "Klickbare Vorschläge:";
  els.contextBox.appendChild(title);
  els.contextBox.appendChild(contextPills([...new Set(cmds)].slice(0, 14)));

  const info = document.createElement("div");
  info.className = "help__muted";
  info.style.marginTop = "10px";
  info.innerHTML =
    `<div><strong>Ausgänge:</strong> ${exits.length ? exits.join(", ") : "—"}</div>
     <div style="margin-top:6px"><strong>Personen:</strong> ${npcNames.length ? npcNames.join(", ") : "—"}</div>
     <div style="margin-top:6px"><strong>Interaktionen:</strong> ${objNames.length ? objNames.join(", ") : "—"}</div>
     <div style="margin-top:6px"><strong>Items vor Ort:</strong> ${itemNames.length ? itemNames.join(", ") : "—"}</div>`;
  els.contextBox.appendChild(info);
}

function renderAll(){
  renderScene();
  renderHelp();
  renderLog(true);
}

function saveAuto(){
  try {
    const data = JSON.stringify({
      locationId: state.locationId,
      inventory: state.inventory,
      flags: state.flags,
      log: state.log
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

    state.locationId = data.locationId || WORLD.start.locationId;
    state.inventory = Array.isArray(data.inventory) ? data.inventory : [...WORLD.start.inventory];
    state.flags = data.flags || {};
    state.log = Array.isArray(data.log) ? data.log : [];
    return true;
  } catch {
    return false;
  }
}

function reset(){
  localStorage.removeItem(STORAGE_KEY);
  state.locationId = WORLD.start.locationId;
  state.inventory = [...WORLD.start.inventory];
  state.flags = { ...(WORLD.start.flags || {}) };
  state.log = [];
  renderAll();
  api.say("system",
`Willkommen! Mini‑Quest:
1) Geh ins **Sekretariat** und rede mit **Pietsch**
2) Hol dir das Codewort in der **Mediothek** (untersuche das Schild)
3) Antworte im Sekretariat → Baustellenpass
4) Über Trakt 3 & Brücke zum Hausmeister‑Stützpunkt → Fundkiste
5) Mit Chip in die Mensa: untersuche „Ausgabe"
6) Kapitel 2+3: Codewort SOLARIS, Laborzugang, Energiezelle & Dachgarten`);
}

// UI wiring
els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = els.input.value;
  els.input.value = "";
  handleInput(v);
});

els.btnSave.addEventListener("click", saveManual);
els.btnReset.addEventListener("click", reset);

// Boot
const hadSave = load();
renderAll();

if (!hadSave){
  api.say("system",
`Willkommen! Du spielst in der ${WORLD.meta.setting}.
Dein Ziel: **3 Kapitel** abschließen (Mensa, Labor, Dachgarten).
Tipp: Starte mit \`gehen sekretariat\` und \`rede pietsch\`.`);
  describeLocation();
} else {
  api.say("system", "🔁 Spielstand geladen.");
  describeLocation();
}
