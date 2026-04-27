/**
 * 3D Print Cost - PWA offline
 * - Recalcula automaticamente ao digitar
 * - Salva valores no localStorage
 * - Formata moeda em pt-BR
 */

const $ = (id) => document.getElementById(id);

const el = {
  filamentKg: $("filamentKg"),
  grams: $("grams"),
  hours: $("hours"),
  watts: $("watts"),
  kwh: $("kwh"),
  depr: $("depr"),
  other: $("other"),
  profit: $("profit"),

  rFilament: $("rFilament"),
  rEnergy: $("rEnergy"),
  rDepr: $("rDepr"),
  rOther: $("rOther"),
  rTotal: $("rTotal"),
  rSale: $("rSale"),
  rProfitBRL: $("rProfitBRL"),

  hint: $("hint"),

  btnClear: $("btnClear"),
  btnA2HS: $("btnA2HS"),
  modal: $("modal"),
  btnCloseModal: $("btnCloseModal"),
};

const STORAGE_KEY = "pwa3d_cost_inputs_v1";

const defaults = {
  filamentKg: "99",
  grams: "",
  hours: "",
  watts: "65",
  kwh: "0,72",
  depr: "0,50",
  other: "0",
  profit: "200",
};

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

  // Remove espaços; troca vírgula por ponto; mantém dígitos e ponto e sinal
  const normalized = s.replace(/\s+/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return { ...defaults };
  }
}

function saveInputs() {
  const payload = {
    filamentKg: el.filamentKg.value,
    grams: el.grams.value,
    hours: el.hours.value,
    watts: el.watts.value,
    kwh: el.kwh.value,
    depr: el.depr.value,
    other: el.other.value,
    profit: el.profit.value,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function setInputs(values) {
  el.filamentKg.value = values.filamentKg ?? defaults.filamentKg;
  el.grams.value = values.grams ?? defaults.grams;
  el.hours.value = values.hours ?? defaults.hours;
  el.watts.value = values.watts ?? defaults.watts;
  el.kwh.value = values.kwh ?? defaults.kwh;
  el.depr.value = values.depr ?? defaults.depr;
  el.other.value = values.other ?? defaults.other;
  el.profit.value = values.profit ?? defaults.profit;
}

function compute() {
  // Inputs
  const filamentKg = parseBRNumber(el.filamentKg.value); // R$/kg
  const grams = parseBRNumber(el.grams.value);           // g
  const hours = parseBRNumber(el.hours.value);           // h
  const watts = parseBRNumber(el.watts.value);           // W
  const kwhPrice = parseBRNumber(el.kwh.value);          // R$/kWh
  const deprHour = parseBRNumber(el.depr.value);         // R$/h
  const other = parseBRNumber(el.other.value);           // R$
  const profitPct = parseBRNumber(el.profit.value);      // %

  // Validations for hint text
  const hasCore = grams > 0 && hours > 0;

  // Formulas (as you specified)
  const costFilament = (filamentKg / 1000) * grams;
  const costEnergy = (watts / 1000) * hours * kwhPrice;
  const costDepr = hours * deprHour;
  const costOther = other;

  const total = costFilament + costEnergy + costDepr + costOther;
  const sale = total + (total * profitPct / 100);
  const profitBRL = sale - total;

  // Render
  el.rFilament.textContent = moneyBR(costFilament);
  el.rEnergy.textContent = moneyBR(costEnergy);
  el.rDepr.textContent = moneyBR(costDepr);
  el.rOther.textContent = moneyBR(costOther);
  el.rTotal.textContent = moneyBR(total);
  el.rSale.textContent = moneyBR(sale);
  el.rProfitBRL.textContent = moneyBR(profitBRL);

  if (!hasCore) {
    el.hint.innerHTML = `Preencha <strong>Gramas</strong> e <strong>Horas</strong> para calcular. Os demais campos já têm valores padrão.`;
  } else {
    el.hint.textContent = "Atualizado automaticamente conforme você digita. Valores ficam salvos neste iPhone.";
  }
}

function onAnyInput() {
  saveInputs();
  compute();
}

function clear() {
  setInputs({ ...defaults });
  saveInputs();
  compute();
}

function openModal() {
  el.modal.classList.add("is-open");
  el.modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  el.modal.classList.remove("is-open");
  el.modal.setAttribute("aria-hidden", "true");
}

// Init
(function init() {
  // Load saved values
  const saved = loadInputs();
  setInputs(saved);

  // Recalculate on typing
  const inputs = [
    el.filamentKg, el.grams, el.hours, el.watts,
    el.kwh, el.depr, el.other, el.profit
  ];

  inputs.forEach((inp) => {
    inp.addEventListener("input", onAnyInput, { passive: true });
    inp.addEventListener("change", onAnyInput, { passive: true });
  });

  // Clear button
  el.btnClear.addEventListener("click", clear);

  // A2HS helper modal
  el.btnA2HS.addEventListener("click", openModal);
  el.btnCloseModal.addEventListener("click", closeModal);
  el.modal.querySelector(".modal__backdrop").addEventListener("click", closeModal);

  // First compute
  compute();
})();