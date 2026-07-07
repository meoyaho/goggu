const CONFIG = {
  appsScriptUrl: ["localhost", "127.0.0.1"].includes(location.hostname)
    ? ""
    : "https://script.google.com/macros/s/AKfycbyKbriB7Mks47IKfizo5viOQDTDk42GWCfoF9yRnsn3865Li-QPwz6WkliztLLw3v_FUA/exec",
  publicBaseUrl: "https://meoyaho.github.io/goggu/",
};

const TABLES_KEY = "pig_head_tables";
const MESSAGES_KEY = "pig_head_messages";
const PRESET_TABLE_IDS = Array.from({ length: 20 }, (_, index) => `gosa-${String(index + 1).padStart(2, "0")}`);
const DEFAULT_BLESSING = "사고 없이 대박 기원";
const DEFAULT_DECORATION = {
  pig: "gold",
  placements: [],
};

const TABLE_ASSET = "assets/asset-ritual-table.png";
const PIG_ASSET = "assets/asset-pig-head.png";
const DECORATION_ASSETS = [
  { group: "food", value: "apples", label: "사과상", image: "assets/asset-apples.png", width: 22, height: 16 },
  { group: "food", value: "rice", label: "쌀밥", image: "assets/asset-rice-bowl.png", width: 17, height: 15 },
  { group: "food", value: "ricecake", label: "떡상", image: "assets/asset-ricecake-bowl.png", width: 22, height: 15 },
  { group: "food", value: "pears", label: "배상", image: "assets/asset-pear-bowl.png", width: 18, height: 15 },
  { group: "ritual", value: "candle", label: "촛대", image: "assets/asset-candle.png", width: 9, height: 31 },
  { group: "ritual", value: "incense", label: "향로", image: "assets/asset-incense-burner.png", width: 15, height: 27 },
  { group: "ritual", value: "cup", label: "잔", image: "assets/asset-wood-cup.png", width: 11, height: 13 },
  { group: "extra", value: "flowers", label: "꽃병", image: "assets/asset-flower-vase.png", width: 15, height: 22 },
  { group: "extra", value: "pouch", label: "복주머니", image: "assets/asset-lucky-pouch.png", width: 17, height: 20 },
];
const PLACED_ASSET_SCALE = 3;
const PLACEMENT_AREA = {
  minX: -18,
  maxX: 118,
  minY: -24,
  maxY: 102,
};

const $app = document.querySelector("#app");
const params = new URLSearchParams(window.location.search);
const tableParam = params.get("table");
const tableId = PRESET_TABLE_IDS.includes(tableParam) ? tableParam : null;
const mode = tableId && params.get("mode") === "owner" ? "owner" : "guest";

const state = {
  table: null,
  messages: [],
  setupDecoration: null,
};

init();

async function init() {
  if (!tableId) {
    renderNfcStart();
    return;
  }

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
  state.table = normalizeTable(result.table);
  state.messages = (result.messages || []).map(normalizeMessage);
}

function renderLoading() {
  $app.innerHTML = `
    <section class="screen loading-screen">
      <div class="loading-pig" data-lottie-loader aria-hidden="true">
        <div class="loading-pig-fallback">
          <span class="loader-ear loader-ear-left"></span>
          <span class="loader-ear loader-ear-right"></span>
          <span class="loader-face">
            <span class="loader-eye loader-eye-left"></span>
            <span class="loader-eye loader-eye-right"></span>
            <span class="loader-snout"></span>
            <span class="loader-smile"></span>
          </span>
        </div>
      </div>
      <p class="loading-caption">상을 차리는 중입니다</p>
    </section>
  `;
  mountLottieLoaders();
}

function mountLottieLoaders() {
  document.querySelectorAll("[data-lottie-loader]").forEach((container) => {
    if (!window.lottie || container.dataset.lottieMounted) return;

    container.dataset.lottieMounted = "true";
    container.textContent = "";
    window.lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: true,
      autoplay: true,
      path: "assets/loading-pig-head.json",
    });
  });
}

function renderNfcStart() {
  $app.innerHTML = `
    <section class="screen nfc-screen">
      <div class="hanging-scroll nfc-scroll">
        <p class="nfc-title">NFC 태그로 시작해주세요</p>
        <p>이 페이지는 20개의 지정된 고사상 링크로만 시작합니다.</p>
      </div>
    </section>
  `;
}

function renderEmpty() {
  $app.innerHTML = `
    <section class="screen">
      <div class="empty-state">
        <strong>아직 차려지지 않은 상입니다</strong>
        <span>주인장이 NFC 태그로 먼저 접속해 상을 차리면 응원을 남길 수 있습니다.</span>
      </div>
    </section>
  `;
}

function renderSetup() {
  $app.replaceChildren(clone("setup-template"));
  const form = document.querySelector("[data-setup-form]");
  const table = state.table || {
    owner_name: "",
    blessing: DEFAULT_BLESSING,
    decoration: { ...DEFAULT_DECORATION },
  };

  state.setupDecoration = cloneDecorationForSetup(table.decoration, Boolean(state.table));
  fillRitualDates(table.date);
  form.elements.owner_name.value = table.owner_name || "";
  syncGroupInputs(table.owner_name || "");
  renderAssetPalette();
  renderDecorationPreview(state.setupDecoration);
  wireSetupDrag();

  document.querySelector("[data-reset-decoration]").addEventListener("click", () => {
    state.setupDecoration = { pig: "gold", placements: [] };
    renderDecorationPreview(state.setupDecoration);
  });

  document.querySelector("[data-next-setup]").addEventListener("click", () => {
    showSetupStep("blessing");
    renderDecorationPreview(state.setupDecoration);
  });

  document.querySelector("[data-back-setup]").addEventListener("click", () => {
    showSetupStep("decorate");
    renderDecorationPreview(state.setupDecoration);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const ownerName = clean(formData.get("owner_name"));
    if (!ownerName) return;

    renderLoading();
    await api("createOrUpdateTable", {
      table_id: tableId,
      date: table.date || getRitualDateValue(),
      owner_name: ownerName,
      blessing: table.blessing || DEFAULT_BLESSING,
      decoration_json: JSON.stringify(state.setupDecoration),
    });

    await loadData();
    renderMain();
  });
}

function showSetupStep(stepName) {
  document.querySelectorAll("[data-setup-step]").forEach((step) => {
    step.classList.toggle("is-active", step.dataset.setupStep === stepName);
  });
}

function renderMain() {
  $app.replaceChildren(clone("main-template"));
  fillRitualDates(state.table.date);

  document.querySelector("[data-table-id]").textContent = tableId.toUpperCase();
  document.querySelector("[data-group]").textContent = state.table.owner_name;
  document.querySelector("[data-blessing]").textContent = state.table.blessing;
  document.querySelector("[data-message-count]").textContent = String(state.messages.length);
  document.querySelector("[data-owner-only]").hidden = mode !== "owner";
  document.querySelector("[data-owner-edit]").hidden = mode !== "owner";
  document.querySelector("[data-guest-only]").hidden = mode === "owner";

  renderDecorationPreview(state.table.decoration);
  renderPaperStack();

  const pigHotspot = document.querySelector("[data-pig-hotspot]");
  pigHotspot.setAttribute("aria-label", mode === "owner" ? "응원 메시지 목록 보기" : "응원 메시지 작성하기");
  pigHotspot.addEventListener("click", () => {
    if (mode === "owner") {
      openMessageList();
    } else {
      openMessageModal();
    }
  });

  document.querySelector("[data-invite]").addEventListener("click", inviteGuests);
  document.querySelector("[data-owner-edit]").addEventListener("click", renderSetup);
  document.querySelector("[data-open-message]").addEventListener("click", openMessageModal);
}

function renderAssetPalette() {
  const root = document.querySelector("[data-asset-palette]");
  root.innerHTML = "";

  DECORATION_ASSETS.forEach((asset) => {
    const button = document.createElement("button");
    button.className = "asset-token";
    button.type = "button";
    button.draggable = true;
    button.dataset.assetGroup = asset.group;
    button.dataset.assetValue = asset.value;
    button.setAttribute("aria-label", `${asset.label} 올리기`);

    const icon = document.createElement("img");
    icon.className = "asset-token-image";
    icon.src = asset.image;
    icon.alt = "";
    icon.draggable = false;

    button.append(icon);
    root.append(button);
  });
}

function wireSetupDrag() {
  const dropZone = document.querySelector("[data-drop-zone]");
  const palette = document.querySelector("[data-asset-palette]");

  palette.addEventListener("dragstart", (event) => {
    const token = event.target.closest("[data-asset-group]");
    if (!token) return;
    event.dataTransfer.setData("application/json", JSON.stringify(getAssetFromElement(token)));
    event.dataTransfer.effectAllowed = "copy";

    const image = token.querySelector(".asset-token-image");
    if (image) event.dataTransfer.setDragImage(image, image.clientWidth / 2, image.clientHeight / 2);
  });

  palette.addEventListener("click", (event) => {
    const token = event.target.closest("[data-asset-group]");
    if (!token) return;
    addPlacement(getAssetFromElement(token), 50, 54);
  });

  palette.addEventListener("pointerdown", startPalettePointerDrag);
  dropZone.addEventListener("dragover", (event) => event.preventDefault());
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    const asset = JSON.parse(event.dataTransfer.getData("application/json") || "{}");
    addPlacementFromPoint(asset, event.clientX, event.clientY);
  });
  dropZone.addEventListener("pointerdown", startPlacementPointerDrag);
}

function startPalettePointerDrag(event) {
  if (event.pointerType === "mouse") return;
  const token = event.target.closest("[data-asset-group]");
  if (!token) return;

  event.preventDefault();
  const asset = getAssetFromElement(token);
  const ghost = makeDragGhost(token, event.clientX, event.clientY);

  function move(moveEvent) {
    moveGhost(ghost, moveEvent.clientX, moveEvent.clientY);
  }

  function end(endEvent) {
    ghost.remove();
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);

    const dropZone = document.querySelector("[data-drop-zone]");
    const rect = dropZone.getBoundingClientRect();
    if (isPointInsideRect(endEvent.clientX, endEvent.clientY, rect)) {
      addPlacementFromPoint(asset, endEvent.clientX, endEvent.clientY);
    }
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function startPlacementPointerDrag(event) {
  const target = event.target.closest("[data-placement-id]");
  if (!target || !state.setupDecoration) return;

  event.preventDefault();
  const id = target.dataset.placementId;
  const dropZone = document.querySelector("[data-drop-zone]");
  const palette = document.querySelector("[data-asset-palette]");

  function move(moveEvent) {
    movePlacementToPoint(id, moveEvent.clientX, moveEvent.clientY, dropZone);
  }

  function end(endEvent) {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);

    const paletteRect = palette.getBoundingClientRect();
    if (isPointInsideRect(endEvent.clientX, endEvent.clientY, paletteRect)) {
      removePlacement(id);
    }
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function removePlacement(id) {
  state.setupDecoration.placements = state.setupDecoration.placements.filter((item) => item.id !== id);
  renderDecorationPreview(state.setupDecoration);
}

function makeDragGhost(source, x, y) {
  const sourceImage = source.querySelector(".asset-token-image");
  const ghost = document.createElement("img");
  ghost.className = "asset-token-ghost";
  ghost.src = sourceImage?.src || "";
  ghost.alt = "";
  document.body.append(ghost);
  moveGhost(ghost, x, y);
  return ghost;
}

function moveGhost(ghost, x, y) {
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function addPlacementFromPoint(asset, clientX, clientY) {
  const dropZone = document.querySelector("[data-drop-zone]");
  const rect = dropZone.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  addPlacement(asset, x, y);
}

function addPlacement(asset, x, y) {
  if (!asset.group || !asset.value || !state.setupDecoration) return;

  const size = getAssetSize(asset);
  const bounds = getPlacementBounds(size);
  state.setupDecoration.placements.push({
    id: `asset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    group: asset.group,
    value: asset.value,
    x: clamp(x - size.width / 2, bounds.minX, bounds.maxX),
    y: clamp(y - size.height / 2, bounds.minY, bounds.maxY),
  });
  renderDecorationPreview(state.setupDecoration);
}

function movePlacementToPoint(id, clientX, clientY, dropZone) {
  const placement = state.setupDecoration.placements.find((item) => item.id === id);
  if (!placement) return;

  const rect = dropZone.getBoundingClientRect();
  const size = getAssetSize(placement);
  const bounds = getPlacementBounds(size);
  placement.x = clamp(((clientX - rect.left) / rect.width) * 100 - size.width / 2, bounds.minX, bounds.maxX);
  placement.y = clamp(((clientY - rect.top) / rect.height) * 100 - size.height / 2, bounds.minY, bounds.maxY);
  renderDecorationPreview(state.setupDecoration);
}

function getAssetFromElement(element) {
  return {
    group: element.dataset.assetGroup,
    value: element.dataset.assetValue,
  };
}

function getAssetSize(assetLike) {
  const asset = findDecorationAsset(assetLike.group, assetLike.value);
  return {
    width: (asset?.width || 16) * PLACED_ASSET_SCALE,
    height: (asset?.height || 16) * PLACED_ASSET_SCALE,
  };
}

function getPlacementBounds(size) {
  return {
    minX: PLACEMENT_AREA.minX,
    maxX: PLACEMENT_AREA.maxX - size.width,
    minY: PLACEMENT_AREA.minY,
    maxY: PLACEMENT_AREA.maxY - size.height,
  };
}

function renderDecorationPreview(decoration) {
  document.querySelectorAll("[data-table-stage]").forEach((stage) => {
    const layer = stage.querySelector("[data-decor-layer]");
    const interactive = stage.hasAttribute("data-drop-zone");
    layer.innerHTML = "";

    const pig = document.createElement("span");
    pig.className = "decor-item decor-pig";
    pig.setAttribute("aria-hidden", "true");
    pig.append(makeDecorImage(PIG_ASSET));
    layer.append(pig);

    getPlacements(decoration).forEach((placement) => {
      const asset = findDecorationAsset(placement.group, placement.value);
      if (!asset) return;

      const item = document.createElement("span");
      item.className = `decor-item decor-${placement.group}`;
      const size = getAssetSize(placement);
      item.style.left = `${placement.x}%`;
      item.style.top = `${placement.y}%`;
      item.style.width = `${size.width}%`;
      item.style.height = `${size.height}%`;
      item.setAttribute("aria-hidden", "true");
      item.append(makeDecorImage(asset.image));

      if (interactive) {
        item.dataset.placementId = placement.id;
        item.title = "드래그해서 위치를 바꿀 수 있습니다";
      }

      layer.append(item);
    });
  });
}

function makeDecorImage(src) {
  const image = document.createElement("img");
  image.className = "decor-image";
  image.src = src;
  image.alt = "";
  image.draggable = false;
  return image;
}

function findDecorationAsset(group, value) {
  return DECORATION_ASSETS.find((asset) => asset.group === group && asset.value === value);
}

function getPlacements(decoration) {
  return Array.isArray(decoration.placements) ? decoration.placements : [];
}

function cloneDecorationForSetup(decoration, hasSavedTable) {
  if (!hasSavedTable) return { pig: "gold", placements: [] };

  return {
    pig: decoration.pig || "gold",
    placements: getPlacements(decoration).map((placement) => ({ ...placement })),
  };
}

function syncGroupInputs(initialValue = "") {
  const inputs = [...document.querySelectorAll("[data-group-input]")];
  inputs.forEach((input) => {
    input.value = initialValue;
    input.addEventListener("input", () => {
      inputs.forEach((target) => {
        if (target !== input) target.value = input.value;
      });
    });
  });
}

function isPointInsideRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
      created_at: new Date().toISOString(),
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

function openMessageList() {
  document.body.append(clone("message-list-modal-template"));
  const modal = document.querySelector("[data-message-list-modal]");
  const list = modal.querySelector("[data-message-list]");
  list.innerHTML = "";

  if (!state.messages.length) {
    const empty = document.createElement("li");
    empty.className = "message-empty";
    empty.textContent = "아직 도착한 응원이 없습니다.";
    list.append(empty);
  } else {
    [...state.messages].reverse().forEach((message) => {
      const item = document.createElement("li");
      item.className = "message-item";

      const header = document.createElement("div");
      header.className = "message-item-header";

      const name = document.createElement("strong");
      name.textContent = message.user_name;

      const date = document.createElement("time");
      date.textContent = formatMessageDate(message.created_at);

      const body = document.createElement("p");
      body.textContent = message.message;

      header.append(name, date);
      item.append(header, body);
      list.append(item);
    });
  }

  modal.querySelector("[data-close-message-list]").addEventListener("click", () => modal.close());
  modal.addEventListener("close", () => modal.remove(), { once: true });
  modal.showModal();
}

async function inviteGuests() {
  const text = makeTableUrl(false);
  try {
    await navigator.clipboard.writeText(text);
    showToast("초대 링크를 복사했습니다");
  } catch {
    window.prompt("초대 링크", text);
  }
}

function makeTableUrl(owner) {
  const url = new URL(CONFIG.publicBaseUrl || location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("table", tableId);
  if (owner) url.searchParams.set("mode", "owner");
  return url.toString();
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
      blessing: payload.blessing,
      decoration_json: payload.decoration_json,
    };
    localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
    return Promise.resolve({ ok: true });
  }

  if (action === "addMessage") {
    messages.push({
      table_id: payload.table_id,
      user_name: payload.user_name,
      message: payload.message,
      created_at: payload.created_at || new Date().toISOString(),
    });
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    return Promise.resolve({ ok: true });
  }

  return Promise.resolve({ ok: false });
}

function normalizeTable(table) {
  if (!table) return null;

  return {
    table_id: table.table_id,
    date: table.date,
    owner_name: table.owner_name,
    blessing: table.blessing || DEFAULT_BLESSING,
    decoration: parseDecoration(table.decoration_json),
  };
}

function normalizeMessage(message) {
  return {
    table_id: message.table_id,
    user_name: message.user_name || "익명",
    message: message.message || "",
    created_at: message.created_at || "",
  };
}

function parseDecoration(value) {
  try {
    const parsed = { ...DEFAULT_DECORATION, ...JSON.parse(value || "{}") };
    if (Array.isArray(parsed.placements)) {
      return {
        pig: parsed.pig || "gold",
        placements: parsed.placements.map(normalizePlacement).filter(Boolean),
      };
    }

    return {
      pig: parsed.pig || "gold",
      placements: [
        parsed.food && normalizePlacement({ id: "legacy_food", group: "food", value: parsed.food, x: 31, y: 54 }),
        parsed.incense && normalizePlacement({ id: "legacy_incense", group: "ritual", value: parsed.incense, x: 68, y: 32 }),
        parsed.extra && normalizePlacement({ id: "legacy_extra", group: "extra", value: parsed.extra, x: 15, y: 34 }),
      ].filter(Boolean),
    };
  } catch {
    return { ...DEFAULT_DECORATION };
  }
}

function normalizePlacement(placement) {
  if (!placement || !placement.group || !placement.value) return null;
  const normalized = normalizeAssetKey(placement.group, placement.value);

  return {
    id: placement.id || `asset_${Math.random().toString(36).slice(2, 8)}`,
    group: normalized.group,
    value: normalized.value,
    x: Number.isFinite(Number(placement.x)) ? Number(placement.x) : 40,
    y: Number.isFinite(Number(placement.y)) ? Number(placement.y) : 48,
  };
}

function normalizeAssetKey(group, value) {
  const key = `${group}:${value}`;
  const legacy = {
    "food:fruit": ["food", "apples"],
    "food:feast": ["food", "ricecake"],
    "incense:single": ["ritual", "candle"],
    "incense:triple": ["ritual", "incense"],
    "incense:blue": ["ritual", "incense"],
    "extra:coins": ["ritual", "cup"],
    "extra:flags": ["extra", "pouch"],
  };

  const mapped = legacy[key];
  return mapped ? { group: mapped[0], value: mapped[1] } : { group, value };
}

function formatMessageDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function clean(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
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
