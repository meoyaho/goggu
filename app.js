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
const DEFAULT_DECORATION = {
  pig: "gold",
  placements: [],
};

const TABLE_ASSET = "assets/asset-ritual-table.png";
const PIG_ASSET = "assets/asset-pig-head.png";
const PIG_ASSET_OPEN = "assets/asset-pig-head-open.png";
const MONEY_BILL_PORTRAIT_ASSET = "assets/asset-money-portrait.png";
const WISH_OFFERING_LOTTIE = "public/projects/gosa-offering/scene-1/lottie.json";
const TABLE_STAGE_ASPECT_RATIO = 761 / 1254;
const DECORATION_ASSETS = [
  { group: "food", value: "apples", label: "사과상", image: "assets/asset-apples.png", width: 22, height: 16 },
  { group: "food", value: "pears", label: "배상", image: "assets/asset-pear-bowl.png", width: 18, height: 15 },
  { group: "ritual", value: "meat", label: "고기", image: "assets/asset-meat-bowl.png", width: 11, height: 13 },
  { group: "food", value: "rice", label: "쌀밥", image: "assets/asset-rice-bowl.png", width: 17, height: 15 },
  { group: "food", value: "ricecake", label: "떡상", image: "assets/asset-ricecake-bowl.png", width: 22, height: 15 },
  { group: "extra", value: "flowers", label: "꽃병", image: "assets/asset-flower-vase.png", width: 15, height: 22 },
  { group: "extra", value: "pouch", label: "복주머니", image: "assets/asset-lucky-pouch.png", width: 17, height: 20 },
  { group: "ritual", value: "incense", label: "향로", image: "assets/asset-incense-burner.png", width: 15, height: 27 },
  { group: "ritual", value: "candle", label: "촛대", image: "assets/asset-candle.png", width: 9, height: 31 },
];
const PLACED_ASSET_SCALE = 1.5;
const PLACEMENT_AREA = {
  minX: -18,
  maxX: 118,
  minY: -24,
  maxY: 102,
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

let wishOfferingAnimationDataPromise = null;

function loadWishOfferingAnimationData() {
  if (!wishOfferingAnimationDataPromise) {
    wishOfferingAnimationDataPromise = fetch(WISH_OFFERING_LOTTIE).then((res) => res.json());
  }
  return wishOfferingAnimationDataPromise;
}

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
      owner_token: ownerToken,
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
  const ownerMode = isOwnerMode();
  const showGuestMessages = !ownerMode && state.guestViewingMessages;

  document.querySelector("[data-main-title]").textContent = `${state.table.owner_name} 대박 기원`;
  document.querySelector("[data-main-subtitle]").textContent = ownerMode
    ? `총 ${state.messages.length}개의 축원이 올라갔습니다`
    : showGuestMessages
      ? "다른 사람들이 올린 축원을 둘러보세요"
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
  if (!ownerMode && state.guestSubmissionComplete && !showGuestMessages) renderWishOffering(false);
  if (!ownerMode && !state.guestSubmissionComplete) loadWishOfferingAnimationData().catch(() => {});
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
  const width = (asset?.width || 16) * PLACED_ASSET_SCALE;

  return {
    width,
    height: ((asset?.height || 16) * PLACED_ASSET_SCALE) / TABLE_STAGE_ASPECT_RATIO,
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

function renderDecorationPreview(decoration, { openMouth = false } = {}) {
  document.querySelectorAll("[data-table-stage]").forEach((stage) => {
    const layer = stage.querySelector("[data-decor-layer]");
    const interactive = stage.hasAttribute("data-drop-zone");
    layer.innerHTML = "";

    const pig = document.createElement("span");
    pig.className = "decor-item decor-pig";
    pig.setAttribute("aria-hidden", "true");
    pig.append(makeDecorImage(openMouth ? PIG_ASSET_OPEN : PIG_ASSET));
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

async function playWishOfferingAnimation(onLanded) {
  const content = document.querySelector(".main-content");
  if (!content || !window.lottie) {
    renderWishOffering(true);
    onLanded?.();
    return;
  }

  content.querySelectorAll(".wish-lottie-flight").forEach((item) => item.remove());

  const overlay = document.createElement("div");
  overlay.className = "wish-lottie-flight";
  overlay.setAttribute("aria-hidden", "true");
  content.append(overlay);

  let animationData;
  try {
    animationData = await loadWishOfferingAnimationData();
  } catch (error) {
    overlay.remove();
    renderWishOffering(true);
    onLanded?.();
    return;
  }

  const animation = window.lottie.loadAnimation({
    container: overlay,
    renderer: "svg",
    loop: false,
    autoplay: true,
    animationData,
  });

  animation.addEventListener("complete", () => {
    animation.destroy();
    overlay.remove();
    renderWishOffering(false, { fadeIn: true });
    onLanded?.();
  });

  animation.addEventListener("data_failed", () => {
    animation.destroy();
    overlay.remove();
    renderWishOffering(true);
    onLanded?.();
  });
}

function renderWishOffering(animate, { fadeIn = false } = {}) {
  const stage = document.querySelector("[data-table-stage]");
  if (!stage) return;

  stage.querySelectorAll(".wish-offering").forEach((item) => item.remove());

  const offering = document.createElement("div");
  offering.className = animate ? "wish-offering is-flying" : "wish-offering is-placed";
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

  if (!animate) return;

  offering.addEventListener(
    "animationend",
    () => {
      offering.classList.remove("is-flying");
      offering.classList.add("is-placed");
    },
    { once: true },
  );
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
    "extra:coins": ["ritual", "meat"],
    "extra:flags": ["extra", "pouch"],
  };

  const mapped = legacy[key];
  return mapped ? { group: mapped[0], value: mapped[1] } : { group, value };
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
