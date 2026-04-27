/**
 * 3D Print Cost - PWA offline
 * - Recalcula automaticamente ao digitar
 * - Salva valores no localStorage
 * - Histórico de consultas (salvar, listar, detalhes, excluir, limpar)
 */

const $ = (id) => document.getElementById(id);

const el = {
  // Inputs
  partName: $("partName"),
  filamentKg: $("filamentKg"),
  grams: $("grams"),
  hours: $("hours"),
  watts: $("watts"),
  kwh: $("kwh"),
  depr: $("depr"),
  other: $("other"),
  profit: $("profit"),

  // Results
  rFilament: $("rFilament"),
  rEnergy: $("rEnergy"),
  rDepr: $("rDepr"),
  rOther: $("rOther"),
  rTotal: $("rTotal"),
  rSale: $("rSale"),
  rProfitBRL: $("rProfitBRL"),
  hint: $("hint"),

  // Buttons
  btnClear: $("btnClear"),
  btnSaveHistory: $("btnSaveHistory"),

  // Views
  viewCalc: $("view-calc"),
  viewHistory: $("view-history"),
  pageTitle: $("pageTitle"),
  pageSubtitle: $("pageSubtitle"),

  // Bottom nav
  navCalc: $("navCalc"),
  navHistory: $("navHistory"),

  // History UI
  historyList: $("historyList"),
  historyDetail: $("historyDetail"),
  btnBackCalc: $("btnBackCalc"),
  btnClearHistory: $("btnClearHistory"),

  // A2HS modal
  btnA2HS: $("btnA2HS"),
  modal: $("modal"),
  btnCloseModal: $("btnCloseModal"),
};

const STORAGE_INPUTS = "pwa3d_cost_inputs_v2";
const STORAGE_HISTORY = "pwa3d_cost_history_v1";

const defaults = {
  partName: "",
  filamentKg: "99",
  grams: "",
  hours: "",
  watts: "65",
  kwh: "0,72",
  depr: "0,50",
  other: "0",
  profit: "200",
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function moneyBR(value) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Aceita "0,72" ou "0.72" ou "99"
 */
function parseBRNumber(text) {
  if (text == null) return 0;
  const s = String(text).trim();
  if (!s) return 0;
  const normalized = s.replace(/\s+/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadInputs() {
  const saved = loadJSON(STORAGE_INPUTS, null);
  return saved ? { ...defaults, ...saved } : { ...defaults };
}

function saveInputs() {
  const payload = {
    partName: el.partName.value,
    filamentKg: el.filamentKg.value,
    grams: el.grams.value,
    hours: el.hours.value,
    watts: el.watts.value,
    kwh: el.kwh.value,
    depr: el.depr.value,
    other: el.other.value,
    profit: el.profit.value,
  };
  saveJSON(STORAGE_INPUTS, payload);
}

function setInputs(values) {
  el.partName.value = values.partName ?? defaults.partName;
  el.filamentKg.value = values.filamentKg ?? defaults.filamentKg;
  el.grams.value = values.grams ?? defaults.grams;
  el.hours.value = values.hours ?? defaults.hours;
  el.watts.value = values.watts ?? defaults.watts;
  el.kwh.value = values.kwh ?? defaults.kwh;
  el.depr.value = values.depr ?? defaults.depr;
  el.other.value = values.other ?? defaults.other;
  el.profit.value = values.profit ?? defaults.profit;
}

// --------------------
// Views / Navigation
// --------------------
function setActiveNav(which) {
  el.navCalc.classList.toggle("navbtn--active", which === "calc");
  el.navHistory.classList.toggle("navbtn--active", which === "history");
}

function showCalcView() {
  el.viewCalc.classList.add("view--active");
  el.viewHistory.classList.remove("view--active");
  el.pageTitle.textContent = "3D Print Cost";
  el.pageSubtitle.textContent = "Calculadora de custo • Offline";
  setActiveNav("calc");
}

function showHistoryView() {
  el.viewCalc.classList.remove("view--active");
  el.viewHistory.classList.add("view--active");
  el.pageTitle.textContent = "Histórico";
  el.pageSubtitle.textContent = "Consultas salvas neste iPhone";
  setActiveNav("history");
  renderHistory();
}

// --------------------
