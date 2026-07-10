const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
const LOCAL_TEST_TABLE_ID = "t-ee50a5e17cf4680c";
const LOCAL_TEST_OWNER_TOKEN = "751820bf0f42c78b62c9c5d2";
const isLocalHost = LOCAL_HOSTS.includes(location.hostname);
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxKOU8xw9sMljb9GJaNAU8DMz7Ak61TWMVGZ8egR25Vors-zIXMS2Xft5E7EfMT45MKdA/exec";

const CONFIG = {
  appsScriptUrl: APPS_SCRIPT_URL,
  publicBaseUrl: isLocalHost ? `${location.origin}${location.pathname}` : "https://meoyaho.github.io/goggu/",
};

const TABLES_KEY = "pig_head_tables";
const MESSAGES_KEY = "pig_head_messages";
const TABLE_ID_PATTERN = /^t-[a-z0-9]{16}$/;
const LEGACY_TABLE_ID_PATTERN = /^[a-z0-9]{16}$/;
const OWNER_TOKEN_PATTERN = /^[a-z0-9]{24}$/;
const DEFAULT_BLESSING = "사고 없이 대박 기원";
const DEFAULT_BG = "#f4d88b";
const PLATE_COUNT = 6;
const DEFAULT_ACCESSORY = "none";
const DEFAULT_DECORATION = {
  bg: DEFAULT_BG,
  plates: new Array(PLATE_COUNT).fill(null),
  wish: "",
  accessory: DEFAULT_ACCESSORY,
};

const PIG_ASSET = "assets/asset-pig-head.png";
const PIG_ASSET_OPEN = "assets/asset-pig-head-open.png";
const PIG_RIBBON_ASSET = "assets/asset-pig-ribbon.png";
const PIG_FLOWER_ASSET = "assets/asset-pig-flower.png";
const RICECAKE_PLAIN_ASSET = "assets/asset-ricecake-plain.png";
const MONEY_BILL_PORTRAIT_ASSET = "assets/asset-money-portrait.png";
const MONEY_BILL_ASSET = "assets/asset-money.png";
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
const PIG_ACCESSORY_CHOICES = [
  { value: "none", label: "없음" },
  { value: "ribbon", label: "리본" },
  { value: "flower", label: "꽃" },
];
const DECORATION_ASSETS = [
  { value: "apples", label: "사과", image: "assets/asset-apples.png" },
  { value: "pear", label: "배", image: "assets/asset-pear.png" },
  { value: "ricecake", label: "떡", image: "assets/asset-ricecake.png" },
  { value: "watermelon", label: "수박", image: "assets/asset-watermelon.png" },
  { value: "pineapple", label: "파인애플", image: "assets/asset-pineapple.png" },
  { value: "pouch", label: "복주머니", image: "assets/asset-lucky-pouch.png" },
  { value: "meat", label: "고기", image: "assets/asset-meat.png" },
  { value: "gulbi", label: "굴비", image: "assets/asset-gulbi.png" },
];

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
const tableId = isValidTableId(tableParam) ? tableParam : null;
const ownerToken = isValidOwnerToken(ownerTokenParam) ? ownerTokenParam : null;
const hasOwnerAccessLink = Boolean(tableId && ownerToken);

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

  renderLoading();
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

function renderLoading() {
  $app.innerHTML = `
    <section class="screen loading-screen" data-loading-screen>
      <p class="loading-caption">상을 차리는 중입니다</p>
      <div class="loading-pig-wrap" data-loading-pig-wrap aria-hidden="true">
        <img class="loading-pig-image" src="${PIG_ASSET_OPEN}" alt="">
      </div>
    </section>
  `;
  startLoadingBillDrop();
}

function startLoadingBillDrop() {
  const screen = document.querySelector("[data-loading-screen]");
  const pigWrap = document.querySelector("[data-loading-pig-wrap]");
  if (!screen || !pigWrap) return;

  const spawn = () => {
    if (!document.body.contains(screen)) return;

    const screenRect = screen.getBoundingClientRect();
    const pigRect = pigWrap.getBoundingClientRect();
    const mouthY = pigRect.top - screenRect.top + pigRect.height * 0.718;
    const floorY = screenRect.height * 0.8;

    const bill = document.createElement("img");
    bill.className = "loading-bill";
    bill.src = MONEY_BILL_PORTRAIT_ASSET;
    bill.alt = "";
    const spin = Math.random() < 0.5 ? -1 : 1;
    bill.style.top = `${mouthY.toFixed(1)}px`;
    bill.style.setProperty("--drop-x", `${((Math.random() - 0.5) * 100).toFixed(1)}px`);
    bill.style.setProperty("--drop-y", `${(floorY - mouthY - Math.random() * 24).toFixed(1)}px`);
    bill.style.setProperty("--drop-rotate", `${(spin * (78 + Math.random() * 24)).toFixed(1)}deg`);
    bill.style.setProperty("--land-scale-y", `${(0.52 + Math.random() * 0.16).toFixed(2)}`);
    bill.style.setProperty("--land-scale", `${(1.25 + Math.random() * 0.3).toFixed(2)}`);
    screen.append(bill);

    const bills = screen.querySelectorAll(".loading-bill");
    if (bills.length > 22) bills[0].remove();

    setTimeout(spawn, 220);
  };

  spawn();
}

function renderNfcStart() {
  $app.innerHTML = `
    <section class="screen nfc-screen">
      <div class="hanging-scroll nfc-scroll">
        <p class="nfc-title">NFC 태그로 시작해주세요</p>
        <p>이 페이지는 지정된 랜덤 고사상 링크로만 시작합니다.</p>
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
  renderBgPalette();
  renderAccessoryPalette();
  renderDecorationPreview(state.setupDecoration);
  wireSetupDrag();
  wireDecorTabs();
  wireWishInputs();
  showDecorTab("bg");

  document.querySelector("[data-reset-decoration]").addEventListener("click", () => {
    state.setupDecoration = cloneDecorationForSetup(null, false);
    renderDecorationPreview(state.setupDecoration);
    syncBgPaletteSelection();
    syncAccessoryPaletteSelection();
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
  return typeof wish === "string" && wish.length === 4 && ![...wish].some((ch) => !ch.trim());
}

function showSetupStep(stepName) {
  document.querySelectorAll("[data-setup-step]").forEach((step) => {
    step.classList.toggle("is-active", step.dataset.setupStep === stepName);
  });
}

function renderMain() {
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

  const showingMoney =
    ownerMode || showGuestMessages
      ? state.messages.length > 0
      : !showGuestMessages && state.guestSubmissionComplete;
  renderDecorationPreview(state.table.decoration, { openMouth: showingMoney });
  if (ownerMode || showGuestMessages) renderPaperStack();
  if (!ownerMode && state.guestSubmissionComplete && !showGuestMessages) renderWishOffering();
  renderMessageFeed();

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

function renderAccessoryPalette() {
  const root = document.querySelector("[data-accessory-palette]");
  if (!root) return;
  root.innerHTML = "";

  PIG_ACCESSORY_CHOICES.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "accessory-swatch";
    button.dataset.accessoryValue = choice.value;
    button.setAttribute("aria-label", choice.label);
    button.innerHTML = getAccessoryIconMarkup(choice.value);
    button.addEventListener("click", () => {
      state.setupDecoration.accessory = choice.value;
      renderDecorationPreview(state.setupDecoration);
      syncAccessoryPaletteSelection();
    });
    root.append(button);
  });

  syncAccessoryPaletteSelection();
}

function syncAccessoryPaletteSelection() {
  document.querySelectorAll("[data-accessory-value]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.accessoryValue === state.setupDecoration.accessory);
  });
}

function getAccessoryIconMarkup(value) {
  if (value === "ribbon") {
    return `<img src="${PIG_RIBBON_ASSET}" alt="" draggable="false">`;
  }

  if (value === "flower") {
    return `<img src="${PIG_FLOWER_ASSET}" alt="" draggable="false">`;
  }

  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="6" opacity="0.4"/>
    <line x1="26" y1="26" x2="74" y2="74" stroke="currentColor" stroke-width="6" opacity="0.4"/>
  </svg>`;
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
  const inputs = [...document.querySelectorAll("[data-wish-inputs] .wish-char-input")];

  inputs.forEach((input, index) => {
    const commitValue = () => {
      input.value = input.value.slice(-1);
      state.setupDecoration.wish = inputs.map((item) => item.value).join("");
      renderDecorationPreview(state.setupDecoration);
      if (input.value && inputs[index + 1]) inputs[index + 1].focus();
    };

    input.addEventListener("input", (event) => {
      if (event.isComposing) return;
      commitValue();
    });

    input.addEventListener("compositionend", commitValue);

    input.addEventListener("focus", () => input.select());

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && inputs[index - 1]) inputs[index - 1].focus();
    });
  });

  syncWishInputs();
}

function syncWishInputs() {
  const inputs = [...document.querySelectorAll("[data-wish-inputs] .wish-char-input")];
  const chars = (state.setupDecoration.wish || "").split("");
  inputs.forEach((input, index) => {
    input.value = chars[index] || "";
  });
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
  renderDecorationPreview(state.setupDecoration);
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
  const ghost = makeDragGhostFromImage(source.querySelector(".decor-image"), event.clientX, event.clientY);

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
  renderDecorationPreview(state.setupDecoration);
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

function renderDecorationPreview(decoration, { openMouth = false } = {}) {
  document.querySelectorAll("[data-table-stage]").forEach((stage) => {
    const layer = stage.querySelector("[data-decor-layer]");
    const interactive = stage.hasAttribute("data-drop-zone");
    layer.innerHTML = "";
    stage.style.setProperty("--stage-bg", decoration.bg || DEFAULT_BG);

    const pig = document.createElement("span");
    pig.className = "decor-item decor-pig";
    pig.setAttribute("aria-hidden", "true");
    pig.append(makeDecorImage(openMouth ? PIG_ASSET_OPEN : PIG_ASSET));

    if (decoration.accessory && decoration.accessory !== "none") {
      const accessory = document.createElement("span");
      accessory.className = `decor-accessory decor-accessory-${decoration.accessory}`;
      accessory.innerHTML = getAccessoryIconMarkup(decoration.accessory);
      pig.append(accessory);
    }

    layer.append(pig);

    const ricecake = document.createElement("span");
    ricecake.className = "decor-item decor-ricecake";
    ricecake.setAttribute("aria-hidden", "true");
    ricecake.append(makeDecorImage(RICECAKE_PLAIN_ASSET));

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
        slot.append(makeDecorImage(asset.image));
        if (interactive) slot.title = "드래그해서 다른 접시로 옮기거나 밖으로 빼서 치울 수 있습니다";
      }

      layer.append(slot);
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

function findDecorationAsset(value) {
  return DECORATION_ASSETS.find((asset) => asset.value === value);
}

function getPlates(decoration) {
  const plates = Array.isArray(decoration?.plates) ? decoration.plates.slice(0, PLATE_COUNT) : [];
  while (plates.length < PLATE_COUNT) plates.push(null);
  return plates.map((plate) => (plate && plate.value ? { value: plate.value } : null));
}

function cloneDecorationForSetup(decoration, hasSavedTable) {
  if (!hasSavedTable || !decoration) {
    return { bg: DEFAULT_BG, plates: new Array(PLATE_COUNT).fill(null), wish: "", accessory: DEFAULT_ACCESSORY };
  }

  return {
    bg: decoration.bg || DEFAULT_BG,
    plates: getPlates(decoration),
    wish: decoration.wish || "",
    accessory: isValidAccessory(decoration.accessory) ? decoration.accessory : DEFAULT_ACCESSORY,
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

function renderPaperStack() {
  const stack = document.querySelector("[data-paper-stack]");
  stack.innerHTML = "";
  const visible = state.messages.slice(-9);
  const count = visible.length;
  if (!count) return;

  const spread = Math.min(72, 22 + count * 6);

  visible.forEach((_, index) => {
    const slip = document.createElement("img");
    slip.className = "paper-slip";
    slip.src = MONEY_BILL_PORTRAIT_ASSET;
    slip.alt = "";
    const t = count === 1 ? 0.5 : index / (count - 1);
    const angle = -spread / 2 + spread * t;
    const jitter = ((index * 13) % 7) - 3;
    slip.style.transform = `translateX(-50%) rotate(${(angle + jitter).toFixed(1)}deg)`;
    slip.style.zIndex = String(index + 1);
    stack.append(slip);
  });
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
  form.setAttribute("aria-hidden", "true");
  state.guestSubmissionComplete = true;
  state.guestViewingMessages = false;
  configureGuestActionButton();
  renderDecorationPreview(state.table.decoration, { openMouth: true });

  playWishOfferingAnimation(() => {
    renderMessageFeed();
    showToast("축원이 올라갔어요");
  });

  try {
    await api("addMessage", {
      table_id: tableId,
      user_name: userName,
      message,
      created_at: new Date().toISOString(),
    });
    await loadData();
  } catch (error) {
    form.classList.remove("is-offering");
    form.removeAttribute("aria-hidden");
    state.guestSubmissionComplete = false;
    configureGuestActionButton();
    renderDecorationPreview(state.table.decoration, { openMouth: false });
    showToast(error.message || "축원을 올리지 못했습니다");
  }
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

function playWishOfferingAnimation(onLanded) {
  const stage = document.querySelector("[data-table-stage]");
  const pigImage = stage?.querySelector(".decor-pig .decor-image");
  if (!stage || !pigImage) {
    renderWishOffering();
    onLanded?.();
    return;
  }

  document.querySelectorAll(".offering-dim-overlay, .offering-flight-bill").forEach((item) => item.remove());

  const pigRect = pigImage.getBoundingClientRect();
  const mouthX = pigRect.left + pigRect.width * 0.5;
  const mouthY = pigRect.top + pigRect.height * 0.718;
  const flyDistance = window.innerHeight - mouthY + 90;

  const overlay = document.createElement("div");
  overlay.className = "offering-dim-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.append(overlay);

  const bill = document.createElement("img");
  bill.className = "offering-flight-bill";
  bill.src = MONEY_BILL_ASSET;
  bill.alt = "";
  bill.style.left = `${mouthX.toFixed(1)}px`;
  bill.style.top = `${mouthY.toFixed(1)}px`;
  bill.style.setProperty("--fly-distance", `${flyDistance.toFixed(1)}px`);
  document.body.append(bill);

  requestAnimationFrame(() => overlay.classList.add("is-visible"));

  bill.addEventListener(
    "animationend",
    () => {
      bill.remove();
      overlay.classList.remove("is-visible");
      overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
      renderWishOffering({ fadeIn: true });
      onLanded?.();
    },
    { once: true },
  );
}

function renderWishOffering({ fadeIn = false } = {}) {
  const stage = document.querySelector("[data-table-stage]");
  if (!stage) return;

  stage.querySelectorAll(".wish-offering").forEach((item) => item.remove());

  const offering = document.createElement("div");
  offering.className = "wish-offering is-placed";
  if (fadeIn) offering.classList.add("is-landing");
  offering.setAttribute("aria-hidden", "true");

  const bill = document.createElement("img");
  bill.className = "wish-offering-bill";
  bill.src = MONEY_BILL_PORTRAIT_ASSET;
  bill.alt = "";

  offering.append(bill);
  stage.append(offering);

  if (fadeIn) {
    requestAnimationFrame(() => requestAnimationFrame(() => offering.classList.remove("is-landing")));
  }
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
  if (owner && ownerToken) url.searchParams.set("owner", ownerToken);
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
    const parsed = JSON.parse(value || "{}");
    return {
      bg: typeof parsed.bg === "string" && parsed.bg ? parsed.bg : DEFAULT_BG,
      plates: getPlates(parsed),
      wish: typeof parsed.wish === "string" ? parsed.wish.slice(0, 4) : "",
      accessory: isValidAccessory(parsed.accessory) ? parsed.accessory : DEFAULT_ACCESSORY,
    };
  } catch {
    return { bg: DEFAULT_BG, plates: new Array(PLATE_COUNT).fill(null), wish: "", accessory: DEFAULT_ACCESSORY };
  }
}

function isValidAccessory(value) {
  return PIG_ACCESSORY_CHOICES.some((choice) => choice.value === value);
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
