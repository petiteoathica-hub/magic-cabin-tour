// 部屋の名前と、画面上の要素をまとめて取得します
const roomNames = ["客間", "書斎", "工房"];
const stage = document.querySelector("#room-stage");
const roomCube = document.querySelector("#room-cube");
const rooms = [...document.querySelectorAll(".room")];
const roomName = document.querySelector("#room-name");
const dots = [...document.querySelectorAll(".dot")];

let currentIndex = 0;
let startX = 0;
let dragX = 0;
let isDragging = false;

// 1回の操作で部屋を切り替えるために必要な移動距離です
const changeThreshold = 55;

/**
 * キューブ全体の向きを更新します。
 * 各部屋は立方体の面に固定され、ここでは視点の角度だけを変えます。
 */
function renderCube(animate = true) {
  // ステージ幅の半分をドラッグすると、およそ90度回転します
  const dragAngle = (dragX / Math.max(stage.clientWidth * 0.5, 1)) * 90;
  const angle = currentIndex * -90 + dragAngle;

  roomCube.style.transition = animate
    ? "transform 560ms cubic-bezier(.2,.75,.2,1)"
    : "none";
  roomCube.style.transform =
    `translateZ(calc(var(--cube-size) * -0.5)) rotateY(${angle}deg)`;
}

// 部屋名と下部の目印を、現在の部屋に合わせます
function updateRoomInformation() {
  roomName.textContent = roomNames[currentIndex];

  dots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === currentIndex);
  });
}

// 指またはマウスが押された位置を記録します
function startDrag(event) {
  isDragging = true;
  startX = event.clientX;
  dragX = 0;
  stage.setPointerCapture(event.pointerId);
}

// 移動中は、指やマウスに部屋が追従するようにします
function moveDrag(event) {
  if (!isDragging) return;

  dragX = event.clientX - startX;
  renderCube(false);
}

// 指またはマウスを離したとき、移動量に応じて部屋を決めます
function endDrag(event) {
  if (!isDragging) return;

  isDragging = false;

  if (dragX < -changeThreshold && currentIndex < rooms.length - 1) {
    currentIndex += 1;
  } else if (dragX > changeThreshold && currentIndex > 0) {
    currentIndex -= 1;
  }

  dragX = 0;
  updateRoomInformation();
  renderCube(true);

  if (stage.hasPointerCapture(event.pointerId)) {
    stage.releasePointerCapture(event.pointerId);
  }
}

// Pointer Events はタッチ操作とマウス操作の両方を扱えます
stage.addEventListener("pointerdown", startDrag);
stage.addEventListener("pointermove", moveDrag);
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

// PCで確認しやすいよう、左右の矢印キーにも対応します
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" && currentIndex < rooms.length - 1) {
    currentIndex += 1;
  } else if (event.key === "ArrowLeft" && currentIndex > 0) {
    currentIndex -= 1;
  } else {
    return;
  }

  event.preventDefault();
  updateRoomInformation();
  renderCube(true);
});

// 画面サイズが変わった場合も、正しい位置に描き直します
window.addEventListener("resize", () => renderCube(false));

// 最初の部屋を表示します
updateRoomInformation();
renderCube(false);
