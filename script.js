// 表示候補となる仮の部屋です。
// 正面と上下左右で重複しないよう、5種類より多く用意しています。
const roomCatalog = [
  {
    id: "guest",
    name: "客間",
    description: "旅人を迎える、灯りのやわらかな部屋",
  },
  {
    id: "study",
    name: "書斎",
    description: "古い魔導書が静かに眠る部屋",
  },
  {
    id: "workshop",
    name: "工房",
    description: "不思議な道具が作られる部屋",
  },
  {
    id: "greenhouse",
    name: "温室",
    description: "月明かりを浴びた植物が育つ部屋",
  },
  {
    id: "observatory",
    name: "星見の間",
    description: "遠い星の声に耳を澄ませる部屋",
  },
  {
    id: "pantry",
    name: "魔法の食料庫",
    description: "季節外れの香りが瓶に詰まった部屋",
  },
  {
    id: "attic",
    name: "屋根裏",
    description: "忘れられた旅支度が積まれた部屋",
  },
  {
    id: "herbarium",
    name: "薬草室",
    description: "乾いた葉と古い処方箋が並ぶ部屋",
  },
];

const stage = document.querySelector("#room-stage");
const roomCube = document.querySelector("#room-cube");
const roomName = document.querySelector("#room-name");
const faces = Object.fromEntries(
  [...document.querySelectorAll(".room")].map((face) => [face.dataset.face, face]),
);

let currentRoom = roomCatalog[0];
let previousRoomId = null;
let faceRooms = {};

let isDragging = false;
let dragAxis = null;
let startX = 0;
let startY = 0;
let dragX = 0;
let dragY = 0;
let movementSamples = [];
let isSettling = false;

const distanceThreshold = 55;
const velocityThreshold = 0.45; // 1ミリ秒あたりの移動ピクセル数
const axisLockThreshold = 8;

// 配列をランダムな順番に並べ替えます
function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  return result;
}

// 部屋の情報を1枚の面へ描画します
function fillFace(face, room) {
  const roomNumber = String(roomCatalog.indexOf(room) + 1).padStart(2, "0");

  face.dataset.room = room.id;
  face.setAttribute("aria-label", room.name);
  face.innerHTML = `
    <span class="room__number">${roomNumber}</span>
    <h2>${room.name}</h2>
    <p>${room.description}</p>
  `;
}

/**
 * 現在の正面を除外して、上下左右の4部屋を再抽選します。
 * 直前の正面も除外するため、すぐ戻っても同じ部屋にはなりません。
 */
function generateSurroundingRooms() {
  const candidates = roomCatalog.filter(
    (room) => room.id !== currentRoom.id && room.id !== previousRoomId,
  );
  const selectedRooms = shuffle(candidates).slice(0, 4);
  const directions = ["top", "bottom", "left", "right"];

  faceRooms = { front: currentRoom };
  directions.forEach((direction, index) => {
    faceRooms[direction] = selectedRooms[index];
  });

  Object.entries(faceRooms).forEach(([direction, room]) => {
    fillFace(faces[direction], room);
  });

  roomName.textContent = currentRoom.name;
}

// ドラッグ量を立方体の回転角度へ変換します
function renderCube(animate = false, targetX = null, targetY = null) {
  let angleX = 0;
  let angleY = 0;

  if (targetX !== null || targetY !== null) {
    angleX = targetX ?? 0;
    angleY = targetY ?? 0;
  } else if (dragAxis === "horizontal") {
    angleY = (dragX / Math.max(stage.clientWidth * 0.5, 1)) * 90;
  } else if (dragAxis === "vertical") {
    angleX = (dragY / Math.max(stage.clientHeight * 0.5, 1)) * -90;
  }

  // 1回のドラッグで90度を超えて回らないようにします
  angleX = Math.max(-90, Math.min(90, angleX));
  angleY = Math.max(-90, Math.min(90, angleY));

  roomCube.style.transition = animate
    ? "transform 560ms cubic-bezier(.2,.75,.2,1)"
    : "none";
  roomCube.style.transform =
    `translateZ(calc(var(--cube-size) * -0.5)) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
}

function startDrag(event) {
  if (isSettling) return;

  isDragging = true;
  dragAxis = null;
  startX = event.clientX;
  startY = event.clientY;
  dragX = 0;
  dragY = 0;
  movementSamples = [{ x: startX, y: startY, time: performance.now() }];
  stage.setPointerCapture(event.pointerId);
}

function moveDrag(event) {
  if (!isDragging) return;

  dragX = event.clientX - startX;
  dragY = event.clientY - startY;

  // 少し動かしてから、移動量の大きい軸へ操作方向を固定します
  if (!dragAxis && Math.max(Math.abs(dragX), Math.abs(dragY)) >= axisLockThreshold) {
    dragAxis = Math.abs(dragX) >= Math.abs(dragY) ? "horizontal" : "vertical";
  }

  const now = performance.now();
  movementSamples.push({ x: event.clientX, y: event.clientY, time: now });
  movementSamples = movementSamples.filter((sample) => now - sample.time <= 100);

  renderCube(false);
}

// 直近100ミリ秒の動きから、選ばれた軸の速度を求めます
function getReleaseVelocity() {
  if (movementSamples.length < 2 || !dragAxis) return 0;

  const first = movementSamples[0];
  const last = movementSamples[movementSamples.length - 1];
  const elapsed = Math.max(last.time - first.time, 1);
  const distance =
    dragAxis === "horizontal" ? last.x - first.x : last.y - first.y;

  return distance / elapsed;
}

function settleToDirection(direction) {
  const targetAngles = {
    right: [0, -90],
    left: [0, 90],
    top: [-90, 0],
    bottom: [90, 0],
  };
  const [targetX, targetY] = targetAngles[direction];

  isSettling = true;
  renderCube(true, targetX, targetY);

  // 吸着アニメーション完了後、選ばれた面を新しい正面にします
  let hasFinished = false;
  let fallbackTimer;
  const finishSettling = () => {
    if (hasFinished) return;
    hasFinished = true;
    window.clearTimeout(fallbackTimer);
    roomCube.removeEventListener("transitionend", finishSettling);

    const oldRoomId = currentRoom.id;
    currentRoom = faceRooms[direction];
    previousRoomId = oldRoomId;

    // 回転値を0へ正規化してから、周囲4面を魔法のように組み替えます
    renderCube(false, 0, 0);
    generateSurroundingRooms();
    isSettling = false;
  };

  roomCube.addEventListener("transitionend", finishSettling, { once: true });
  // すでに90度までドラッグ済みでも、確実に次の正面へ更新します
  fallbackTimer = window.setTimeout(finishSettling, 650);
}

function endDrag(event) {
  if (!isDragging) return;

  isDragging = false;
  const velocity = getReleaseVelocity();
  const distance = dragAxis === "horizontal" ? dragX : dragY;
  const shouldMove =
    dragAxis &&
    (Math.abs(distance) >= distanceThreshold ||
      (Math.abs(distance) >= axisLockThreshold &&
        Math.abs(velocity) >= velocityThreshold));

  if (shouldMove) {
    let direction;

    if (dragAxis === "horizontal") {
      direction = distance < 0 ? "right" : "left";
    } else {
      direction = distance < 0 ? "bottom" : "top";
    }

    settleToDirection(direction);
  } else {
    // 条件に届かなければ、元の正面へ滑らかに戻します
    renderCube(true, 0, 0);
  }

  dragX = 0;
  dragY = 0;
  dragAxis = null;

  if (stage.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId);
  }
}

stage.addEventListener("pointerdown", startDrag);
stage.addEventListener("pointermove", moveDrag);
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

// PCでは上下左右の矢印キーでも90度回転できます
stage.addEventListener("keydown", (event) => {
  const directions = {
    ArrowRight: "right",
    ArrowLeft: "left",
    ArrowUp: "top",
    ArrowDown: "bottom",
  };
  const direction = directions[event.key];

  if (!direction || isSettling) return;

  event.preventDefault();
  settleToDirection(direction);
});

window.addEventListener("resize", () => renderCube(false, 0, 0));

generateSurroundingRooms();
renderCube(false, 0, 0);
