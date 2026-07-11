const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
const LOCAL_TEST_TABLE_ID = "t-ee50a5e17cf4680c";
const LOCAL_TEST_OWNER_TOKEN = "751820bf0f42c78b62c9c5d2";
const isLocalHost = LOCAL_HOSTS.includes(location.hostname);
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxz_tY861ksGpPkgVvv4A4UMh1OdaIgfGIYmbMZu1EKbiWWK1A9IptPZOYcgUatRKuosw/exec";

const CONFIG = {
  appsScriptUrl: APPS_SCRIPT_URL,
  publicBaseUrl: isLocalHost ? `${location.origin}${location.pathname}` : "https://meoyaho.github.io/goggu/",
};

const TABLES_KEY = "pig_head_tables";
const MESSAGES_KEY = "pig_head_messages";
const TABLE_ID_PATTERN = /^t-[a-z0-9]{16}$/;
const LEGACY_TABLE_ID_PATTERN = /^[a-z0-9]{16}$/;
const OWNER_TOKEN_PATTERN = /^[a-z0-9]{24}$/;
const FIXED_OWNER_MODE = "owner";
const FIXED_OWNER_TOKEN_SUFFIX = "gogguown";
const FIXED_OWNER_TABLE_IDS = new Set([
  "t-e8ac3cf260842b30",
  "t-ab9fcafa34cc3eef",
  "t-4ab040e4e1f339bf",
  "t-dc5348cd924d9126",
  "t-2f2d99123f71fc0f",
  "t-e78b25caa0584d01",
  "t-c95a294065b6609b",
  "t-394ceab838b8087e",
  "t-8c2880642a92be43",
  "t-c536df93e2ce34f3",
  "t-abe1a2e9cb0195f3",
  "t-45d8b799fab2ae2a",
  "t-e03e548dad63ac6a",
  "t-be2e02e85ef21593",
  "t-0834d68147684b80",
  "t-c872a3465e6bbb24",
  "t-ffffdfda524fd72b",
  "t-2c62df856ff4c390",
  "t-0ed6fd8ec723da23",
  "t-64ee4f6069b3c1df",
]);
const DEFAULT_BLESSING = "사고 없이 대박 기원";
const DEFAULT_BG = "#f4d88b";
const PLATE_COUNT = 6;
const DEFAULT_DECORATION = {
  bg: DEFAULT_BG,
  plates: new Array(PLATE_COUNT).fill(null),
  wish: "",
};

const PIG_ASSET = "assets/asset-pig-head.png";
const PIG_ASSET_OPEN = PIG_ASSET;
const PIG_BOX_ASSET = "assets/asset-pig-head-box.png";
const RICECAKE_PLAIN_ASSET = "assets/asset-ricecake-plain.png";
const GULBI_ASSET = "assets/asset-gulbi.png";
const GUEST_MESSAGE_ROLL_MS = 2200;
const GUEST_MESSAGE_THEMES = [
  {
    id: "mouth-1",
    panelStart: "rgba(241, 250, 232, 0.96)",
    panelEnd: "rgba(198, 231, 167, 0.92)",
    panelAccent: "rgba(92, 173, 56, 0.34)",
    rollImage: "assets/money-mouth-1.png",
    rollRatio: 74 / 574,
  },
  {
    id: "mouth-2",
    panelStart: "rgba(255, 248, 204, 0.96)",
    panelEnd: "rgba(245, 214, 72, 0.72)",
    panelAccent: "rgba(180, 139, 24, 0.28)",
    rollImage: "assets/money-mouth-2.png",
    rollRatio: 126 / 578,
  },
];
const PIG_MONEY_DECORATIONS = [
  { src: "assets/money-mouth-1.png", className: "pig-money-mouth pig-money-mouth-1" },
  { src: "assets/money-mouth-2.png", className: "pig-money-mouth pig-money-mouth-2" },
  { src: "assets/money-mouth-3.png", className: "pig-money-mouth pig-money-mouth-3" },
  { src: "assets/money-left-ear-1.png", className: "pig-money-ear pig-money-left-ear-1" },
  { src: "assets/money-right-ear-1.png", className: "pig-money-ear pig-money-right-ear-1" },
  { src: "assets/money-left-ear-2.png", className: "pig-money-ear pig-money-left-ear-2" },
  { src: "assets/money-right-ear-2.png", className: "pig-money-ear pig-money-right-ear-2" },
  { src: "assets/money-left-ear-3.png", className: "pig-money-ear pig-money-left-ear-3" },
  { src: "assets/money-right-ear-3.png", className: "pig-money-ear pig-money-right-ear-3" },
];
const PIG_MONEY_MOUTH_2_PLACEMENT = {
  top: 0.745,
  width: 0.54,
  ratio: 126 / 578,
};
const LOADING_CANDY_ASSETS = {
  red: "assets/asset-candy-red.png",
  yellow: "assets/asset-candy-yellow.png",
};
const BG_COLOR_CHOICES = [
  { value: "#fff8e8", label: "미색" },
  { value: "#ece4d2", label: "상아" },
  { value: "#f4d88b", label: "황금" },
  { value: "#e3ab52", label: "황토" },
  { value: "#b88745", label: "황동" },
  { value: "#9f2f25", label: "홍색" },
  { value: "#6f1f1a", label: "적갈" },
  { value: "#315d4f", label: "청록" },
  { value: "#1f3a5f", label: "남색" },
  { value: "#2b1713", label: "흑칠" },
  { value: "#c97a6d", label: "분홍" },
  { value: "#e2b47c", label: "살구" },
  { value: "#8a9b5c", label: "연두" },
  { value: "#5c3a6b", label: "보라" },
  { value: "#8b8478", label: "은회" },
];
const DECORATION_ASSETS = [
  { value: "apple", label: "사과", image: "assets/asset-apple.png" },
  { value: "pear", label: "배", image: "assets/asset-pear.png" },
  { value: "orange", label: "오렌지", image: "assets/asset-orange.png" },
  { value: "snack", label: "약과", image: "assets/asset-snack.png" },
  { value: "candy-red", label: "빨간 사탕", image: "assets/asset-candy-red.png" },
  { value: "candy-yellow", label: "노란 사탕", image: "assets/asset-candy-yellow.png" },
  { value: "pizza", label: "피자", image: "assets/pizza.png" },
  { value: "chicken", label: "치킨", image: "assets/chicken.png" },
];
const STACKED_PLATE_ASSET_VALUES = new Set(["apple", "pear", "orange", "snack", "candy-red", "candy-yellow"]);
const DECORATION_ASSET_ALIASES = {
  apples: "apple",
};

const $app = document.querySelector("#app");
const params = new URLSearchParams(window.location.search);
if (isLocalHost) {
  const localTableParam = params.get("table");
  const normalizedLocalTableId = normalizeLocalTableId(localTableParam);

  if (!localTableParam || localTableParam !== normalizedLocalTableId) {
    params.set("table", normalizedLocalTableId);
    if (!params.get("owner")) params.set("owner", LOCAL_TEST_OWNER_TOKEN);
  }
}

if (isLocalHost && window.location.search !== `?${params.toString()}`) {
  history.replaceState(null, "", `${location.pathname}?${params.toString()}${location.hash}`);
}

const tableParam = params.get("table");
const ownerTokenParam = params.get("owner");
const modeParam = params.get("mode");
const tableId = isValidTableId(tableParam) ? tableParam : null;
const hasFixedOwnerMode = Boolean(
  tableId && modeParam === FIXED_OWNER_MODE && FIXED_OWNER_TABLE_IDS.has(tableId)
);
const ownerToken = getOwnerToken(tableId, ownerTokenParam, hasFixedOwnerMode);
const hasOwnerAccessLink = Boolean(tableId && ownerToken && (isValidOwnerToken(ownerTokenParam) || hasFixedOwnerMode));

const state = {
  table: null,
  messages: [],
  setupDecoration: null,
  canEdit: false,
  guestSubmissionComplete: false,
  guestViewingMessages: false,
};

init();

async function init() {
  if (!tableId) {
    renderNfcStart();
    return;
  }

  renderLoading({
    caption: hasOwnerAccessLink ? "상을 차리는 중입니다" : "귀한 클릭 감사드립니다",
  });
  await loadData();

  if (hasOwnerAccessLink && !state.table) {
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
  const payload = ownerToken ? { table_id: tableId, owner_token: ownerToken } : { table_id: tableId };
  const result = await api("get", payload);
  state.table = normalizeTable(result.table);
  state.messages = (result.messages || []).map(normalizeMessage);
  state.canEdit = result.can_edit == null ? hasOwnerAccessLink : Boolean(result.can_edit);
}

function renderLoading({ caption = "상을 차리는 중입니다" } = {}) {
  $app.innerHTML = `
    <section class="screen loading-screen" data-loading-screen>
      <div class="loading-candy-stack" data-loading-candy-stack aria-hidden="true"></div>
      <p class="loading-caption">${caption}</p>
    </section>
  `;
  startLoadingCandyStack();
}

function startLoadingCandyStack() {
  const stack = document.querySelector("[data-loading-candy-stack]");
  if (!stack) return;

  const layerPatterns = [
    ["red", "yellow", "yellow"],
    ["yellow", "yellow", "red"],
    ["yellow", "red", "yellow"],
  ];
  const maxLayers = 13;
  let layerIndex = 0;

  const spawn = () => {
    if (!document.body.contains(stack)) return;

    if (layerIndex >= maxLayers) {
      layerIndex = 0;
      stack.replaceChildren();
    }

    const layer = document.createElement("div");
    layer.className = "loading-candy-layer";
    layer.style.setProperty("--layer-bottom", `${layerIndex * 15}px`);

    layerPatterns[layerIndex % layerPatterns.length].forEach((color, index) => {
      const candy = document.createElement("img");
      candy.className = `loading-candy loading-candy-${index}`;
      candy.src = LOADING_CANDY_ASSETS[color];
      candy.alt = "";
      layer.append(candy);
    });

    stack.append(layer);
    layerIndex += 1;
    setTimeout(spawn, 260);
  };

  spawn();
}

function renderNfcStart() {
  $app.innerHTML = `
    <section class="screen nfc-screen">
      <div class="hanging-scroll nfc-scroll">
        <p class="nfc-title">아직 차려지지 않은 상입니다</p>
        <p>이 페이지는 지정된 제주(祭主) 링크로만 시작합니다.</p>
      </div>
    </section>
  `;
}

function renderEmpty() {
  $app.innerHTML = `
    <section class="screen">
      <div class="empty-state">
        <strong>아직 차려지지 않은 상입니다</strong>
        <span>제주(祭主)가 먼저 상을 차리면 응원을 남길 수 있습니다.</span>
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
  renderBgPalette();
  renderDecorationPreview(state.setupDecoration);
  wireSetupDrag();
  wireDecorTabs();
  wireWishInputs();
  showDecorTab("bg");

  document.querySelector("[data-reset-decoration]").addEventListener("click", () => {
    state.setupDecoration = cloneDecorationForSetup(null, false);
    renderDecorationPreview(state.setupDecoration);
    syncBgPaletteSelection();
    syncWishInputs();
  });

  document.querySelector("[data-next-setup]").addEventListener("click", () => {
    if (!isWishComplete(state.setupDecoration.wish)) {
      showDecorTab("wish");
      showToast("축원 네 글자를 모두 입력해주세요");
      return;
    }
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
      owner_token: ownerToken,
      date: table.date || getRitualDateValue(),
      owner_name: ownerName,
      blessing: state.setupDecoration.wish || table.blessing || DEFAULT_BLESSING,
      decoration_json: JSON.stringify(state.setupDecoration),
    });

    await loadData();
    renderMain();
  });
}

function isWishComplete(wish) {
  const chars = getTextChars(wish);
  return chars.length === 4 && !chars.some((ch) => !ch.trim());
}

function showSetupStep(stepName) {
  document.querySelectorAll("[data-setup-step]").forEach((step) => {
    step.classList.toggle("is-active", step.dataset.setupStep === stepName);
  });
}

function renderMain() {
  document.querySelectorAll(".guest-message-roll-bar").forEach((item) => item.remove());
  $app.replaceChildren(clone("main-template"));
  fillRitualDates(state.table.date);
  const ownerMode = isOwnerMode();
  const showGuestMessages = !ownerMode && state.guestViewingMessages;

  document.querySelector("[data-main-title]").textContent = `${state.table.owner_name} 대박 기원`;
  document.querySelector("[data-main-subtitle]").textContent =
    ownerMode || showGuestMessages
      ? `총 ${state.messages.length}개의 축원이 올라갔습니다`
      : "친구를 응원하고 좋은 기운을 가져가세요";
  document.querySelector("[data-owner-only]").hidden = !ownerMode;
  document.querySelector("[data-guest-only]").hidden = ownerMode;
  document.querySelector("[data-message-feed]").closest(".message-feed-panel").hidden = !ownerMode && !showGuestMessages;
  document.querySelector("[data-guest-message-form]").hidden = ownerMode || showGuestMessages;

  renderDecorationPreview(state.table.decoration, {
    pigMoneyCount: ownerMode || showGuestMessages ? state.messages.length : 0,
  });
  renderMessageFeed();
  applyGuestMessageTheme();

  document.querySelector("[data-guest-message-form]").addEventListener("submit", submitMessageForm);
  document.querySelector("[data-invite]").addEventListener("click", inviteGuests);
  configureGuestActionButton();
}

function renderAssetPalette() {
  const root = document.querySelector("[data-asset-palette]");
  root.innerHTML = "";

  DECORATION_ASSETS.forEach((asset) => {
    const button = document.createElement("button");
    button.className = "asset-token";
    button.type = "button";
    button.draggable = true;
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

function renderBgPalette() {
  const root = document.querySelector("[data-bg-palette]");
  root.innerHTML = "";

  BG_COLOR_CHOICES.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "bg-swatch";
    button.style.setProperty("--swatch-color", choice.value);
    button.dataset.bgValue = choice.value;
    button.setAttribute("aria-label", choice.label);
    button.addEventListener("click", () => {
      state.setupDecoration.bg = choice.value;
      renderDecorationPreview(state.setupDecoration);
      syncBgPaletteSelection();
    });
    root.append(button);
  });

  syncBgPaletteSelection();
}

function syncBgPaletteSelection() {
  document.querySelectorAll("[data-bg-value]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.bgValue === state.setupDecoration.bg);
  });
}

function wireDecorTabs() {
  document.querySelectorAll("[data-decor-tab]").forEach((tab) => {
    tab.addEventListener("click", () => showDecorTab(tab.dataset.decorTab));
  });
}

function showDecorTab(name) {
  document.querySelectorAll("[data-decor-tab]").forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.decorTab === name);
  });
  document.querySelectorAll("[data-decor-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.decorPanel === name);
  });
}

function wireWishInputs() {
  const root = document.querySelector("[data-wish-inputs]");
  const input = root?.querySelector(".wish-text-input");
  if (!root || !input) return;

  const commitValue = () => {
    const chars = getTextChars(input.value).slice(0, 4);
    state.setupDecoration.wish = chars.join("");
    input.value = state.setupDecoration.wish;
    syncWishInputs();
    renderDecorationPreview(state.setupDecoration);
  };

  input.addEventListener("input", (event) => {
    if (event.isComposing || input.dataset.composing === "true") {
      syncWishInputs(getTextChars(input.value).slice(0, 4));
      return;
    }
    commitValue();
  });

  input.addEventListener("compositionstart", () => {
    input.dataset.composing = "true";
  });

  input.addEventListener("compositionupdate", () => {
    syncWishInputs(getTextChars(input.value).slice(0, 4));
  });

  input.addEventListener("compositionend", () => {
    input.dataset.composing = "false";
    commitValue();
  });

  syncWishInputs();
}

function syncWishInputs(chars = getTextChars(state.setupDecoration.wish || "")) {
  const root = document.querySelector("[data-wish-inputs]");
  if (!root) return;

  const input = root.querySelector(".wish-text-input");
  if (input && input.dataset.composing !== "true") input.value = chars.slice(0, 4).join("");

  root.querySelectorAll(".wish-char-input").forEach((slot, index) => {
    slot.textContent = chars[index] || "";
  });
}

function getTextChars(value) {
  return Array.from(String(value || ""));
}

function wireSetupDrag() {
  const dropZone = document.querySelector("[data-drop-zone]");
  const palette = document.querySelector("[data-asset-palette]");

  palette.addEventListener("dragstart", (event) => {
    const token = event.target.closest("[data-asset-value]");
    if (!token) return;
    event.dataTransfer.setData("application/json", JSON.stringify({ value: token.dataset.assetValue }));
    event.dataTransfer.effectAllowed = "copy";

    const image = token.querySelector(".asset-token-image");
    if (image) event.dataTransfer.setDragImage(image, image.clientWidth / 2, image.clientHeight / 2);
  });

  palette.addEventListener("click", (event) => {
    const token = event.target.closest("[data-asset-value]");
    if (!token) return;
    addToFirstEmptyPlate(token.dataset.assetValue);
  });

  palette.addEventListener("pointerdown", startPalettePointerDrag);
  dropZone.addEventListener("dragover", (event) => event.preventDefault());
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    const asset = JSON.parse(event.dataTransfer.getData("application/json") || "{}");
    if (asset.value) addPlacementFromPoint(asset.value, event.clientX, event.clientY);
  });
  dropZone.addEventListener("pointerdown", startPlacementPointerDrag);
}

function addToFirstEmptyPlate(value) {
  const emptyIndex = state.setupDecoration.plates.findIndex((plate) => !plate);
  if (emptyIndex === -1) {
    showToast("접시가 모두 찼어요");
    return;
  }
  state.setupDecoration.plates[emptyIndex] = { value };
  renderDecorationPreview(state.setupDecoration, { animateSlotIndex: emptyIndex });
}

function startPalettePointerDrag(event) {
  if (event.pointerType === "mouse") return;
  const token = event.target.closest("[data-asset-value]");
  if (!token) return;

  event.preventDefault();
  const value = token.dataset.assetValue;
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
      addPlacementFromPoint(value, endEvent.clientX, endEvent.clientY);
    }
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function startPlacementPointerDrag(event) {
  const source = event.target.closest("[data-slot-index]");
  if (!source || !source.classList.contains("is-filled") || !state.setupDecoration) return;

  const sourceIndex = Number(source.dataset.slotIndex);
  const asset = state.setupDecoration.plates[sourceIndex];
  if (!asset) return;

  event.preventDefault();
  const dropZone = document.querySelector("[data-drop-zone]");
  const palette = document.querySelector("[data-asset-palette]");
  const decorationAsset = findDecorationAsset(asset.value);
  const ghost = makePlateDragGhost(decorationAsset, event.clientX, event.clientY);

  function move(moveEvent) {
    moveGhost(ghost, moveEvent.clientX, moveEvent.clientY);
  }

  function end(endEvent) {
    ghost.remove();
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", end);

    const paletteRect = palette.getBoundingClientRect();
    if (isPointInsideRect(endEvent.clientX, endEvent.clientY, paletteRect)) {
      state.setupDecoration.plates[sourceIndex] = null;
      renderDecorationPreview(state.setupDecoration);
      return;
    }

    const dropZoneRect = dropZone.getBoundingClientRect();
    if (!isPointInsideRect(endEvent.clientX, endEvent.clientY, dropZoneRect)) {
      renderDecorationPreview(state.setupDecoration);
      return;
    }

    const targetIndex = findNearestSlotIndex(dropZone, endEvent.clientX, endEvent.clientY);
    if (targetIndex != null && targetIndex !== sourceIndex) {
      const swapped = state.setupDecoration.plates[targetIndex];
      state.setupDecoration.plates[targetIndex] = asset;
      state.setupDecoration.plates[sourceIndex] = swapped;
    }
    renderDecorationPreview(state.setupDecoration);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", end, { once: true });
}

function makeDragGhost(source, x, y) {
  const sourceImage = source.querySelector(".asset-token-image");
  return makeDragGhostFromImage(sourceImage, x, y);
}

function makeDragGhostFromImage(sourceImage, x, y) {
  const ghost = document.createElement("img");
  ghost.className = "asset-token-ghost";
  ghost.src = sourceImage?.src || "";
  ghost.alt = "";
  document.body.append(ghost);
  moveGhost(ghost, x, y);
  return ghost;
}

function makePlateDragGhost(asset, x, y) {
  const ghost = document.createElement("span");
  ghost.className = "asset-token-ghost plate-content-ghost";
  if (asset) ghost.append(makePlateContent(asset, { animated: false }));
  document.body.append(ghost);
  moveGhost(ghost, x, y);
  return ghost;
}

function moveGhost(ghost, x, y) {
  ghost.style.left = `${x}px`;
  ghost.style.top = `${y}px`;
}

function addPlacementFromPoint(value, clientX, clientY) {
  const dropZone = document.querySelector("[data-drop-zone]");
  const rect = dropZone.getBoundingClientRect();
  if (!isPointInsideRect(clientX, clientY, rect)) return;

  const targetIndex = findNearestSlotIndex(dropZone, clientX, clientY);
  if (targetIndex == null) return;

  state.setupDecoration.plates[targetIndex] = { value };
  renderDecorationPreview(state.setupDecoration, { animateSlotIndex: targetIndex });
}

function findNearestSlotIndex(dropZone, clientX, clientY) {
  let bestIndex = null;
  let bestDistance = Infinity;

  dropZone.querySelectorAll(".plate-slot").forEach((slot) => {
    const rect = slot.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = (centerX - clientX) ** 2 + (centerY - clientY) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = Number(slot.dataset.slotIndex);
    }
  });

  return bestIndex;
}

function renderDecorationPreview(decoration, { openMouth = false, animateSlotIndex = null, pigMoneyCount = 0 } = {}) {
  document.querySelectorAll("[data-table-stage]").forEach((stage) => {
    const layer = stage.querySelector("[data-decor-layer]");
    const interactive = stage.hasAttribute("data-drop-zone");
    layer.innerHTML = "";
    stage.style.setProperty("--stage-bg", decoration.bg || DEFAULT_BG);

    const pigBox = document.createElement("span");
    pigBox.className = "decor-item decor-pig-box";
    pigBox.setAttribute("aria-hidden", "true");
    pigBox.append(makeDecorImage(PIG_BOX_ASSET));
    layer.append(pigBox);

    const pig = document.createElement("span");
    pig.className = "decor-item decor-pig";
    pig.setAttribute("aria-hidden", "true");
    pig.append(makeDecorImage(openMouth ? PIG_ASSET_OPEN : PIG_ASSET));
    appendPigMoneyDecorations(pig, pigMoneyCount);

    layer.append(pig);

    const ricecake = document.createElement("span");
    ricecake.className = "decor-item decor-ricecake";
    ricecake.setAttribute("aria-hidden", "true");
    ricecake.append(makeDecorImage(RICECAKE_PLAIN_ASSET));

    const gulbi = document.createElement("span");
    gulbi.className = "decor-gulbi";
    gulbi.append(makeDecorImage(GULBI_ASSET));
    ricecake.append(gulbi);

    const wishRow = document.createElement("span");
    wishRow.className = "wish-char-row";
    const wishChars = (decoration.wish || "").padEnd(4, " ").slice(0, 4).split("");
    wishChars.forEach((char) => {
      const charSpan = document.createElement("span");
      charSpan.className = "wish-char";
      charSpan.textContent = char.trim();
      wishRow.append(charSpan);
    });
    ricecake.append(wishRow);
    layer.append(ricecake);

    getPlates(decoration).forEach((plate, index) => {
      const slot = document.createElement("span");
      slot.className = `decor-item plate-slot plate-slot-${index}`;
      slot.dataset.slotIndex = String(index);
      slot.setAttribute("aria-hidden", "true");

      const asset = plate ? findDecorationAsset(plate.value) : null;
      if (asset) {
        slot.classList.add("is-filled");
        slot.append(makePlateContent(asset, { animated: interactive && index === animateSlotIndex }));
        if (interactive) slot.title = "드래그해서 다른 접시로 옮기거나 밖으로 빼서 치울 수 있습니다";
      }

      layer.append(slot);
    });
  });
}

function appendPigMoneyDecorations(pig, count) {
  const visibleCount = Math.min(Math.max(0, count), PIG_MONEY_DECORATIONS.length);
  PIG_MONEY_DECORATIONS.slice(0, visibleCount).forEach((decoration, index) => {
    const image = document.createElement("img");
    image.className = `pig-money-decor ${decoration.className}`;
    image.src = decoration.src;
    image.alt = "";
    image.draggable = false;
    image.style.zIndex = String(index + 1);
    pig.append(image);
  });
}

function makePlateContent(asset, { animated = false } = {}) {
  if (!STACKED_PLATE_ASSET_VALUES.has(asset.value)) {
    const image = makeDecorImage(asset.image);
    image.classList.add(`plate-asset-${asset.value}`);
    return image;
  }

  const stack = document.createElement("span");
  stack.className = "plate-stack";
  if (animated) stack.classList.add("is-stacking");

  for (let index = 0; index < 5; index += 1) {
    const image = makeDecorImage(asset.image);
    image.classList.add("plate-stack-item", `plate-stack-item-${index}`);
    stack.append(image);
  }

  return stack;
}

function makeDecorImage(src) {
  const image = document.createElement("img");
  image.className = "decor-image";
  image.src = src;
  image.alt = "";
  image.draggable = false;
  return image;
}

function findDecorationAsset(value) {
  const normalizedValue = normalizeDecorationAssetValue(value);
  return DECORATION_ASSETS.find((asset) => asset.value === normalizedValue);
}

function normalizeDecorationAssetValue(value) {
  if (!value) return null;
  const normalizedValue = DECORATION_ASSET_ALIASES[value] || value;
  return DECORATION_ASSETS.some((asset) => asset.value === normalizedValue) ? normalizedValue : null;
}

function getPlates(decoration) {
  const plates = Array.isArray(decoration?.plates) ? decoration.plates.slice(0, PLATE_COUNT) : [];
  while (plates.length < PLATE_COUNT) plates.push(null);
  return plates.map((plate) => {
    const value = normalizeDecorationAssetValue(plate?.value);
    return value ? { value } : null;
  });
}

function cloneDecorationForSetup(decoration, hasSavedTable) {
  if (!hasSavedTable || !decoration) {
    return { bg: DEFAULT_BG, plates: new Array(PLATE_COUNT).fill(null), wish: "" };
  }

  return {
    bg: decoration.bg || DEFAULT_BG,
    plates: getPlates(decoration),
    wish: decoration.wish || "",
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

function renderMessageFeed() {
  const list = document.querySelector("[data-message-feed]");
  if (!list) return;

  list.innerHTML = "";
  if (!state.messages.length) {
    const empty = document.createElement("li");
    empty.className = "message-empty";
    empty.textContent = "아직 도착한 응원이 없습니다.";
    list.append(empty);
    return;
  }

  [...state.messages].reverse().forEach((message) => {
    list.append(makeMessageItem(message));
  });
}

async function submitMessageForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const userName = clean(formData.get("user_name"));
  const message = clean(formData.get("message"));
  if (!userName || !message) return;

  const action = document.querySelector("[data-guest-only]");
  if (action) {
    action.disabled = true;
    action.textContent = "올리는 중";
  }

  form.classList.add("is-offering");
  const rollBar = playGuestMessageRoll(form);
  form.setAttribute("aria-hidden", "true");
  state.guestSubmissionComplete = true;
  state.guestViewingMessages = false;
  configureGuestActionButton();
  renderDecorationPreview(state.table.decoration, { openMouth: false });

  const completionToastTimer = window.setTimeout(() => {
    renderMessageFeed();
    showToast("축원이 올라갔어요");
  }, GUEST_MESSAGE_ROLL_MS);

  try {
    await api("addMessage", {
      table_id: tableId,
      user_name: userName,
      message,
      created_at: new Date().toISOString(),
      theme: form.dataset.messageTheme || "",
    });
    await loadData();
  } catch (error) {
    window.clearTimeout(completionToastTimer);
    rollBar?.remove();
    form.classList.remove("is-offering");
    form.removeAttribute("aria-hidden");
    state.guestSubmissionComplete = false;
    configureGuestActionButton();
    renderDecorationPreview(state.table.decoration, { openMouth: false });
    showToast(error.message || "축원을 올리지 못했습니다");
  }
}

function playGuestMessageRoll(form) {
  const rect = form.getBoundingClientRect();
  const rollRatio = Number(form.dataset.rollRatio) || 0.13;
  const rollHeight = Math.max(24, Math.round(rect.width * rollRatio));
  const pigRect = document.querySelector(".table-display .decor-pig")?.getBoundingClientRect();
  const targetWidth = pigRect ? pigRect.width * PIG_MONEY_MOUTH_2_PLACEMENT.width : rect.width * 0.18;
  const targetHeight = targetWidth * PIG_MONEY_MOUTH_2_PLACEMENT.ratio;
  const targetLeft = pigRect
    ? pigRect.left + pigRect.width * 0.5 - targetWidth / 2
    : rect.left + rect.width * 0.5 - targetWidth / 2;
  const targetTop = pigRect
    ? pigRect.top + pigRect.height * PIG_MONEY_MOUTH_2_PLACEMENT.top
    : rect.top + rect.height * 0.12 - targetHeight / 2;
  const rollBar = document.createElement("span");
  rollBar.className = "guest-message-roll-bar";
  rollBar.setAttribute("aria-hidden", "true");
  rollBar.style.left = `${rect.left.toFixed(1)}px`;
  rollBar.style.top = `${(rect.bottom - rollHeight).toFixed(1)}px`;
  rollBar.style.width = `${rect.width.toFixed(1)}px`;
  rollBar.style.height = `${rollHeight}px`;
  rollBar.style.setProperty("--roll-start-left", `${rect.left.toFixed(1)}px`);
  rollBar.style.setProperty("--roll-start-top", `${(rect.bottom - rollHeight).toFixed(1)}px`);
  rollBar.style.setProperty("--roll-start-width", `${rect.width.toFixed(1)}px`);
  rollBar.style.setProperty("--roll-start-height", `${rollHeight}px`);
  rollBar.style.setProperty("--roll-end-y", `${(rect.top + rect.height * 0.12 - rollHeight / 2).toFixed(1)}px`);
  rollBar.style.setProperty("--roll-target-left", `${targetLeft.toFixed(1)}px`);
  rollBar.style.setProperty("--roll-target-top", `${targetTop.toFixed(1)}px`);
  rollBar.style.setProperty("--roll-target-width", `${targetWidth.toFixed(1)}px`);
  rollBar.style.setProperty("--roll-target-height", `${targetHeight.toFixed(1)}px`);
  if (form.dataset.rollImage) {
    rollBar.style.setProperty("--guest-roll-image", `url("${form.dataset.rollImage}")`);
  }
  document.body.append(rollBar);
  rollBar.addEventListener("animationend", () => rollBar.classList.add("is-landed"), { once: true });
  return rollBar;
}

function openMessageModal() {
  document.body.append(clone("message-modal-template"));
  const modal = document.querySelector("[data-message-modal]");
  const form = modal.querySelector("[data-message-form]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const sent = await sendMessageFromForm(form);
    if (!sent) return;
    modal.close();
    modal.remove();
  });

  modal.querySelector("[data-close-message]").addEventListener("click", () => modal.close());
  modal.addEventListener("close", () => modal.remove(), { once: true });
  modal.showModal();
}

async function sendMessageFromForm(form, options = {}) {
  const formData = new FormData(form);
  const userName = clean(formData.get("user_name"));
  const message = clean(formData.get("message"));
  if (!userName || !message) return false;

  await api("addMessage", {
    table_id: tableId,
    user_name: userName,
    message,
    created_at: new Date().toISOString(),
    theme: form.dataset.messageTheme || "",
  });

  await loadData();
  if (options.renderAfter !== false) {
    renderMain();
    showToast("응원이 도착했습니다");
  }
  return true;
}

function configureGuestActionButton() {
  const ownerMode = isOwnerMode();
  const button = document.querySelector("[data-guest-only]");
  if (!button || ownerMode) return;

  button.disabled = false;

  if (state.guestViewingMessages) {
    button.type = "button";
    button.removeAttribute("form");
    button.textContent = "축원 남기기";
    button.onclick = () => {
      state.guestViewingMessages = false;
      state.guestSubmissionComplete = false;
      renderMain();
    };
    return;
  }

  if (state.guestSubmissionComplete) {
    button.type = "button";
    button.removeAttribute("form");
    button.textContent = "다른 축원 보기";
    button.onclick = () => {
      state.guestViewingMessages = true;
      renderMain();
    };
    return;
  }

  button.type = "submit";
  button.setAttribute("form", "guest-message-form");
  button.textContent = "고사상에 올리기";
  button.onclick = null;
}

function applyGuestMessageTheme() {
  const form = document.querySelector("[data-guest-message-form]");
  if (!form || form.hidden) return;

  const theme = GUEST_MESSAGE_THEMES[Math.floor(Math.random() * GUEST_MESSAGE_THEMES.length)];
  form.dataset.messageTheme = theme.id;
  form.dataset.rollImage = theme.rollImage;
  form.dataset.rollRatio = String(theme.rollRatio);
  form.style.setProperty("--guest-message-panel-start", theme.panelStart);
  form.style.setProperty("--guest-message-panel-end", theme.panelEnd);
  form.style.setProperty("--guest-message-panel-accent", theme.panelAccent);
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
      list.append(makeMessageItem(message));
    });
  }

  modal.querySelector("[data-close-message-list]").addEventListener("click", () => modal.close());
  modal.addEventListener("close", () => modal.remove(), { once: true });
  modal.showModal();
}

function makeMessageItem(message) {
  const item = document.createElement("li");
  item.className = "message-item";
  applyMessageThemeToElement(item, message.theme || getFallbackMessageThemeId(message));

  const body = document.createElement("p");
  body.textContent = message.message;

  const footer = document.createElement("div");
  footer.className = "message-item-footer";

  const name = document.createElement("strong");
  name.textContent = `- ${message.user_name}`;

  footer.append(name);
  item.append(body, footer);
  return item;
}

function applyMessageThemeToElement(element, themeId) {
  const theme = GUEST_MESSAGE_THEMES.find((item) => item.id === themeId) || GUEST_MESSAGE_THEMES[0];
  element.dataset.messageTheme = theme.id;
  element.style.setProperty("--message-item-start", theme.panelStart);
  element.style.setProperty("--message-item-end", theme.panelEnd);
  element.style.setProperty("--message-item-accent", theme.panelAccent);
}

function getFallbackMessageThemeId(message) {
  const key = `${message.created_at || ""}${message.user_name || ""}${message.message || ""}`;
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash + key.charCodeAt(index)) % GUEST_MESSAGE_THEMES.length;
  }
  return GUEST_MESSAGE_THEMES[hash]?.id || GUEST_MESSAGE_THEMES[0].id;
}

async function inviteGuests() {
  const text = makeTableUrl(false);
  const copied = await copyText(text);

  if (copied) {
    showToast("초대 링크를 복사했습니다");
    return;
  }

  window.prompt("초대 링크를 복사해주세요", text);
}

async function copyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    if (document.execCommand("copy")) return true;
  } catch {
    // Fall through to the async Clipboard API.
  } finally {
    textarea.remove();
  }

  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

function makeTableUrl(owner) {
  const url = new URL(CONFIG.publicBaseUrl || location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("table", tableId);
  if (owner && ownerToken) {
    if (hasFixedOwnerMode) {
      url.searchParams.set("mode", FIXED_OWNER_MODE);
    } else {
      url.searchParams.set("owner", ownerToken);
    }
  }
  return url.toString();
}

async function api(action, payload) {
  if (!CONFIG.appsScriptUrl) {
    const result = await localApi(action, payload);
    if (result?.ok === false) throw new Error(result.error || "Request failed");
    return result;
  }

  const query = new URLSearchParams({ action, ...payload });
  const result = await jsonp(`${CONFIG.appsScriptUrl}?${query.toString()}`);
  if (result?.ok === false) throw new Error(result.error || "Request failed");
  return result;
}

function localApi(action, payload) {
  const tables = readJson(TABLES_KEY, {});
  const messages = readJson(MESSAGES_KEY, []);

  if (action === "get") {
    const table = tables[payload.table_id] || null;
    return Promise.resolve({
      table,
      messages: messages.filter((message) => message.table_id === payload.table_id),
      can_edit: Boolean(table && payload.owner_token && (!table.owner_token || table.owner_token === payload.owner_token)),
    });
  }

  if (action === "createOrUpdateTable") {
    const existing = tables[payload.table_id];
    if (existing?.owner_token && existing.owner_token !== payload.owner_token) {
      return Promise.resolve({ ok: false, error: "owner_token does not match" });
    }

    tables[payload.table_id] = {
      table_id: payload.table_id,
      owner_token: existing?.owner_token || payload.owner_token,
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
      theme: payload.theme || "",
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
    theme: message.theme || "",
  };
}

function parseDecoration(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return {
      bg: typeof parsed.bg === "string" && parsed.bg ? parsed.bg : DEFAULT_BG,
      plates: getPlates(parsed),
      wish: typeof parsed.wish === "string" ? parsed.wish.slice(0, 4) : "",
    };
  } catch {
    return { bg: DEFAULT_BG, plates: new Array(PLATE_COUNT).fill(null), wish: "" };
  }
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

function isValidTableId(value) {
  return TABLE_ID_PATTERN.test(String(value || ""));
}

function normalizeLocalTableId(value) {
  const tableValue = String(value || "");
  if (isValidTableId(tableValue)) return tableValue;
  if (LEGACY_TABLE_ID_PATTERN.test(tableValue)) return `t-${tableValue}`;
  return LOCAL_TEST_TABLE_ID;
}

function getOwnerToken(currentTableId, tokenParam, fixedOwnerMode) {
  if (isValidOwnerToken(tokenParam)) return tokenParam;
  if (fixedOwnerMode && currentTableId) return `${currentTableId.slice(2)}${FIXED_OWNER_TOKEN_SUFFIX}`;
  return null;
}

function isValidOwnerToken(value) {
  return OWNER_TOKEN_PATTERN.test(String(value || ""));
}

function isOwnerMode() {
  return hasOwnerAccessLink && state.canEdit;
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
