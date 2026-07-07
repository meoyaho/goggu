const CONFIG = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbyuT9FO9q8YTY3GnYbydcfdQ4LeB9STttCT7njLJ0ptyHSlPEQu939sA3c7zXjwBUUMLA/exec",
};

const TABLES_KEY = "pig_head_tables";
const MESSAGES_KEY = "pig_head_messages";
const $app = document.querySelector("#app");

const params = new URLSearchParams(window.location.search);
const hasTableParam = params.has("table");
const tableId = params.get("table") || makeTableId();
const mode = params.get("mode") === "owner" || !hasTableParam ? "owner" : "guest";

const state = {
  table: null,
  messages: [],
  currentCharm: null,
};

if (!params.get("table")) {
  params.set("table", tableId);
  params.set("mode", "owner");
  history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
}

init();

async function init() {
  renderLoading();
  await loadData();

  if (mode === "owner" && !state.table) {
    renderSetup();
    return;
  }

  if (!state.table) {
    renderEmpty();
    return;
  }

  renderMain();
}

async function loadData() {
  const result = await api("get", { table_id: tableId });
  state.table = result.table || null;
  state.messages = result.messages || [];
}

function renderLoading() {
  $app.innerHTML = `
    <section class="screen loading-screen">
      <div class="hanging-scroll loading-scroll">상을 차리는 중입니다</div>
    </section>
  `;
}

function renderEmpty() {
  $app.innerHTML = `<section class="screen"><div class="empty-state">아직 차려지지 않은 상입니다</div></section>`;
}

function renderSetup() {
  $app.replaceChildren(clone("setup-template"));
  const form = document.querySelector("[data-setup-form]");
  fillRitualDates();
  syncGroupInputs();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const groupName = clean(formData.get("owner_name"));
    if (!groupName) return;

    await api("createOrUpdateTable", {
      table_id: tableId,
      date: getRitualDateValue(),
      owner_name: groupName,
    });

    await loadData();
    renderMain();
  });
}

function renderMain() {
  $app.replaceChildren(clone("main-template"));
  fillRitualDates(state.table.date);
  document.querySelectorAll("[data-group]").forEach((element) => {
    element.textContent = state.table.owner_name;
  });
  document.querySelector("[data-owner-only]").hidden = mode !== "owner";
  document.querySelector("[data-guest-only]").hidden = mode === "owner";

  renderPaperStack();

  document.querySelectorAll("[data-random-message]").forEach((button) => {
    button.addEventListener("click", openRandomCharm);
  });

  const inviteButton = document.querySelector("[data-invite]");
  if (inviteButton) inviteButton.addEventListener("click", inviteGuests);

  const messageButton = document.querySelector("[data-open-message]");
  if (messageButton) messageButton.addEventListener("click", openMessageModal);
}

function fillRitualDates(dateValue) {
  const dateText = dateValue ? getRitualDateTextFromValue(dateValue) : getRitualDateText();
  document.querySelectorAll("[data-ritual-date]").forEach((element) => {
    element.textContent = dateText;
  });
}

function getRitualDateText(date = new Date()) {
  const { year, month, day } = getKoreanDateParts(date);
  return `維歲次(유세차) ${year}년 ${month}월 ${day}일`;
}

function getRitualDateValue(date = new Date()) {
  const { year, month, day } = getKoreanDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getRitualDateTextFromValue(value) {
  const match = String(value).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return getRitualDateText();
  const [, year, month, day] = match;
  return `維歲次(유세차) ${Number(year)}년 ${Number(month)}월 ${Number(day)}일`;
}

function getKoreanDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year").value);
  const month = Number(parts.find((part) => part.type === "month").value);
  const day = Number(parts.find((part) => part.type === "day").value);
  return { year, month, day };
}

function syncGroupInputs() {
  const inputs = [...document.querySelectorAll("[data-group-input]")];
  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      inputs.forEach((target) => {
        if (target !== input) target.value = input.value;
      });
    });
  });
}

function renderPaperStack() {
  const stack = document.querySelector("[data-paper-stack]");
  stack.innerHTML = "";
  const visible = state.messages.slice(-14);

  visible.forEach((_, index) => {
    const slip = document.createElement("span");
    slip.className = "paper-slip";
    const offset = index - (visible.length - 1) / 2;
    const rotate = ((index * 19) % 34) - 17;
    slip.style.transform = `translate(${offset * 10 - 50}%, ${Math.abs(offset) * -3 - 50}%) rotate(${rotate}deg)`;
    slip.style.zIndex = String(index + 1);
    stack.append(slip);
  });
}

function openMessageModal() {
  document.body.append(clone("message-modal-template"));
  const modal = document.querySelector("[data-message-modal]");
  const form = modal.querySelector("[data-message-form]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const userName = clean(formData.get("user_name"));
    const message = clean(formData.get("message"));
    if (!userName || !message) return;

    await api("addMessage", {
      table_id: tableId,
      user_name: userName,
      message,
    });

    modal.close();
    modal.remove();
    await loadData();
    renderMain();
    showToast("응원이 도착했습니다");
  });

  modal.querySelector("[data-close-message]").addEventListener("click", () => modal.close());
  modal.addEventListener("close", () => modal.remove(), { once: true });
  modal.showModal();
}

function openRandomCharm() {
  if (!state.messages.length) {
    showToast("아직 도착한 응원이 없습니다");
    return;
  }

  state.currentCharm = state.messages[Math.floor(Math.random() * state.messages.length)];
  document.body.append(clone("charm-modal-template"));
  const modal = document.querySelector("[data-charm-modal]");
  modal.querySelector("[data-charm-message]").textContent = state.currentCharm.message;
  modal.querySelector("[data-charm-author]").textContent = `- ${state.currentCharm.user_name}`;
  modal.querySelector("[data-close-charm]").addEventListener("click", () => modal.close());
  modal.querySelector("[data-save-charm]").addEventListener("click", saveCharm);
  modal.addEventListener("close", () => modal.remove(), { once: true });
  modal.showModal();
}

async function inviteGuests() {
  const guestUrl = new URL(location.href);
  guestUrl.searchParams.set("table", tableId);
  guestUrl.searchParams.delete("mode");

  const text = guestUrl.toString();
  try {
    await navigator.clipboard.writeText(text);
    showToast("초대 링크를 복사했습니다");
  } catch {
    window.prompt("초대 링크", text);
  }
}

function saveCharm() {
  if (!state.currentCharm) return;
  const width = 720;
  const height = 1080;
  const message = state.currentCharm.message;
  const author = escapeXml(`- ${state.currentCharm.user_name}`);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="posterBg" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#ffe238"/>
      <stop offset=".55" stop-color="#ffe88f"/>
      <stop offset="1" stop-color="#ffd326"/>
    </linearGradient>
    <linearGradient id="pigWood" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#dfd0aa"/>
      <stop offset="1" stop-color="#bba77f"/>
    </linearGradient>
  </defs>
  <rect width="720" height="1080" fill="url(#posterBg)"/>
  <rect x="14" y="14" width="692" height="1052" fill="none" stroke="#2b1b14" stroke-width="8"/>
  <rect x="32" y="32" width="656" height="1016" fill="none" stroke="#2b1b14" stroke-width="3"/>
  <path d="M14 14h96L14 110M706 14h-96l96 96M14 1066h96l-96-96M706 1066h-96l96-96" fill="none" stroke="#2b1b14" stroke-width="5"/>
  <g transform="translate(360 116)">
    <rect x="-48" y="-58" width="96" height="120" fill="#ffd827" stroke="#2b1b14" stroke-width="8"/>
    <rect x="-36" y="-46" width="72" height="96" fill="none" stroke="#a21f15" stroke-width="5"/>
    <text x="0" y="-8" text-anchor="middle" writing-mode="tb" glyph-orientation-vertical="0" font-size="40" font-family="serif" font-weight="900" fill="#a21f15">대박</text>
  </g>
  <g fill="#4db5e8" stroke="#1f1712" stroke-width="5">
    <rect x="110" y="108" width="16" height="28" rx="4" transform="rotate(58 118 122)"/>
    <rect x="580" y="84" width="16" height="28" rx="4" fill="#f35c5c" transform="rotate(22 588 98)"/>
    <rect x="88" y="226" width="16" height="16" rx="3" fill="#fff7e5" transform="rotate(30 96 234)"/>
    <rect x="610" y="248" width="16" height="16" rx="3" fill="#fff7e5" transform="rotate(-20 618 256)"/>
  </g>
  <path d="M70 186c36-80 76-92 118-36M62 250c54-58 108-62 158-14M650 184c-36-80-76-92-118-36M658 250c-54-58-108-62-158-14" fill="none" stroke="#1f1712" stroke-width="7" stroke-linecap="round"/>
  <text x="360" y="286" text-anchor="middle" font-size="58" font-family="serif" font-weight="900" fill="#1f1712">황금 웃는 돼지머리</text>

  <g transform="translate(360 574)">
    <ellipse cx="-98" cy="-62" rx="48" ry="104" fill="url(#pigWood)" transform="rotate(-14)"/>
    <ellipse cx="98" cy="-62" rx="48" ry="104" fill="url(#pigWood)" transform="rotate(14)"/>
    <ellipse cx="0" cy="0" rx="156" ry="145" fill="url(#pigWood)"/>
    <path d="M-72-30q18-26 38 0M34-30q18-26 38 0" fill="none" stroke="#1f1712" stroke-width="7" stroke-linecap="round"/>
    <path d="M-118 20h-64M-112 44h-70M118 20h64M112 44h70" stroke="#ffe629" stroke-width="10" stroke-linecap="round"/>
    <ellipse cx="0" cy="44" rx="74" ry="48" fill="#865315"/>
    <ellipse cx="-24" cy="36" rx="13" ry="9" fill="#fffdf2"/>
    <ellipse cx="24" cy="36" rx="13" ry="9" fill="#fffdf2"/>
    <path d="M-48 74q48 30 96 0" fill="none" stroke="#fffdf2" stroke-width="7" stroke-linecap="round"/>
  </g>

  <g>
    <path d="M92 854h536l18 28-18 28H92l-18-28z" fill="#ffd817" stroke="#1f1712" stroke-width="7"/>
    <text x="360" y="884" text-anchor="middle" font-size="34" font-family="serif" font-weight="900" fill="#1f1712">
      ${wrapSvgText(message, 360, 0, 42)}
    </text>
    <text x="360" y="974" text-anchor="middle" font-size="28" font-family="serif" font-weight="900" fill="#6f1f1a">${author}</text>
  </g>
</svg>`.trim();

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cheer-${tableId}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

function wrapSvgText(text, x, y, lineHeight) {
  const chars = [...text];
  const lines = [];
  let line = "";
  chars.forEach((char) => {
    line += char;
    if (line.length >= 9 || /[.!?。？！]$/.test(line)) {
      lines.push(line);
      line = "";
    }
  });
  if (line) lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  return lines
    .slice(0, 5)
    .map((part, index) => `<tspan x="${x}" dy="${index === 0 ? startY : lineHeight}">${escapeXml(part)}</tspan>`)
    .join("");
}

async function api(action, payload) {
  if (!CONFIG.appsScriptUrl) return localApi(action, payload);

  const query = new URLSearchParams({ action, ...payload });
  return jsonp(`${CONFIG.appsScriptUrl}?${query.toString()}`);
}

function localApi(action, payload) {
  const tables = readJson(TABLES_KEY, {});
  const messages = readJson(MESSAGES_KEY, []);

  if (action === "get") {
    return Promise.resolve({
      table: tables[payload.table_id] || null,
      messages: messages.filter((message) => message.table_id === payload.table_id),
    });
  }

  if (action === "createOrUpdateTable") {
    tables[payload.table_id] = {
      table_id: payload.table_id,
      date: payload.date,
      owner_name: payload.owner_name,
    };
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
    return Promise.resolve({ ok: true });
  }

  if (action === "addMessage") {
    messages.push({
      table_id: payload.table_id,
      user_name: payload.user_name,
      message: payload.message,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    return Promise.resolve({ ok: true });
  }

  return Promise.resolve({ ok: false });
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callback = `pigHeadCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";

    window[callback] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Apps Script request failed"));
    };

    function cleanup() {
      delete window[callback];
      script.remove();
    }

    script.src = `${url}${separator}callback=${callback}`;
    document.body.append(script);
  });
}

function clone(templateId) {
  return document.getElementById(templateId).content.cloneNode(true);
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function makeTableId() {
  return `table_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function clean(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.append(toast);
  setTimeout(() => toast.remove(), 2200);
}
