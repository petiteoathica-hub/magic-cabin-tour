// 部屋の名前と、画面上の要素をまとめて取得します
const roomNames = ["客間", "書斎", "工房"];
const stage = document.querySelector("#room-stage");
const carousel = document.querySelector("#room-carousel");
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
 * 各部屋の位置と角度を更新します。
 * dragX がある間は、指やマウスの移動量に合わせて途中の角度も表示します。
 */
function renderRooms(animate = true) {
  const dragProgress = dragX / Math.max(stage.clientWidth, 1);

  rooms.forEach((room, index) => {
    const position = index - currentIndex + dragProgress;
    const x = position * 78;
    const angle = position * -62;
    const depth = Math.abs(position) * -170;

    room.style.transition = animate
      ? "transform 520ms cubic-bezier(.2,.75,.2,1), opacity 360ms ease"
      : "none";
    room.style.transform =
      `translateX(${x}%) translateZ(${depth}px) rotateY(${angle}deg)`;
    room.style.opacity = Math.abs(position) > 1.25 ? "0" : "1";
    room.style.zIndex = String(10 - Math.round(Math.abs(position)));
  });
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
  renderRooms(false);
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
  renderRooms(true);

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
  renderRooms(true);
});

// 画面サイズが変わった場合も、正しい位置に描き直します
window.addEventListener("resize", () => renderRooms(false));

// 最初の部屋を表示します
updateRoomInformation();
renderRooms(false);
