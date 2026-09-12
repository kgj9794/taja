/* =====================================================================
   1. 한글 음소 분해 및 실시간 타수(Stroke) 계산 모듈
   ===================================================================== */
const CHO_STROKES = [1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1];
const JUNG_STROKES = [1, 2, 2, 3, 1, 2, 2, 3, 1, 2, 3, 2, 2, 1, 2, 3, 2, 2, 1, 2, 1];
const JONG_STROKES = [
  0, 1, 2, 2, 1, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1
];

function getCharStrokes(char) {
  if (!char) return 0;
  const code = char.charCodeAt(0);

  if (code >= 0xAC00 && code <= 0xD7A3) {
    const syllableIndex = code - 0xAC00;
    const jong = syllableIndex % 28;
    const jung = Math.floor((syllableIndex - jong) / 28) % 21;
    const cho = Math.floor(Math.floor((syllableIndex - jong) / 28) / 21);
    return CHO_STROKES[cho] + JUNG_STROKES[jung] + JONG_STROKES[jong];
  }

  if (code >= 0x3131 && code <= 0x3163) {
    const doubleConsonants = ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ", "ㄳ", "ㄵ", "ㄶ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅄ", "ㅒ", "ㅖ", "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"];
    if (doubleConsonants.includes(char)) return 2;
    return 1;
  }

  if (/[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(char)) return 2;
  return 1;
}

function getStringStrokes(str) {
  let strokes = 0;
  for (let i = 0; i < str.length; i++) {
    strokes += getCharStrokes(str[i]);
  }
  return strokes;
}

/* =====================================================================
   2. 연습 데이터 세트
   ===================================================================== */
const PRACTICE_DATA = {
  key: {
    "base": ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅓ", "ㅏ", "ㅣ"],
    "left-top": ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ"],
    "left-bottom": ["ㅋ", "ㅌ", "ㅊ", "ㅍ"],
    "center": ["ㅎ", "ㅗ"],
    "right-top": ["ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
    "right-bottom": ["ㅠ", "ㅜ", "ㅡ"],
    "all": ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ", "ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅗ", "ㅛ", "ㅜ", "ㅠ", "ㅡ", "ㅣ"],
    "number": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]
  },
  word: [
    "하늘", "바람", "구름", "나무", "바다", "태양", "달빛", "별빛", "마음", "사랑",
    "컴퓨터", "키보드", "모니터", "인터넷", "소프트웨어", "프로그래밍", "자바스크립트", "알고리즘", "데이터", "네트워크"
  ],
  short: [
    "동해 물과 백두산이 마르고 닳도록",
    "남산 위에 저 소나무 철갑을 두른 듯",
    "가을 하늘 공활한데 높고 구름 없이",
    "이 기상과 이 맘으로 충성을 다하여",
    "가는 말이 고와야 오는 말이 곱다",
    "말 한마디로 천 냥 빚을 갚는다",
    "시작이 반이다",
    "티끌 모아 태산이다"
  ],
  long: [
    "별 하나에 추억과 별 하나에 사랑과 별 하나에 쓸쓸함과",
    "별 하나에 동경과 별 하나에 시와 별 하나에 어머니 어머니",
    "어머님 나는 별 하나에 아름다운 말 한마디씩 불러 봅니다",
    "소학교 때 책상을 같이 했던 아이들의 이름과",
    "패 경 옥 이런 이국 소녀들의 이름과",
    "비둘기 강아지 토끼 노새 노루 프랑시스 잼 도경환 이런 시인의 이름을 불러 봅니다",
    "이네들은 너무나 멀리 있습니다 별이 아스라이 멀 듯이"
  ]
};

/* =====================================================================
   3. 상태 관리
   ===================================================================== */
let currentMode = "key";
let currentSubPos = "base";
let activeList = [];
let currentIndex = 0;

let sentenceStartTime = null;
let currentSentenceStrokes = 0;
let lastFinishedCPM = 0;
let totalCompletedStrokes = 0;
let totalCompletedTime = 0;

let lastAccuracy = 100;
let pastAttemptedChars = 0;
let pastCorrectChars = 0;

let timerInterval = null;
let startTime = null;
let elapsedSeconds = 0;
let isTimerRunning = false;

let isKeyboardVisible = true;

// 한글 IME 2중 엔터 및 잔여 음절 누출 차단 가드
let isSubmittingSentence = false;
let isComposingLocked = false;

/* =====================================================================
   4. DOM 요소
   ===================================================================== */
const loadingScreen = document.getElementById("loading-screen");
const typingContainer = document.getElementById("typing-container");

const modeBtns = document.querySelectorAll(".mode-btn");
const subMenuBar = document.getElementById("sub-menu-bar");
const subBtns = document.querySelectorAll(".sub-btn");

// 오도미터 4개 슬롯
const slotM1 = document.getElementById("slot-m1");
const slotM2 = document.getElementById("slot-m2");
const slotS1 = document.getElementById("slot-s1");
const slotS2 = document.getElementById("slot-s2");

const cpmDisplay = document.getElementById("cpm-display");
const accuracyDisplay = document.getElementById("accuracy-display");
const progressPercent = document.getElementById("progress-percent");
const progressBar = document.getElementById("progress-bar");

const practiceBoard = document.getElementById("practice-board");
const slotCurrent = document.getElementById("slot-current");
const slotNext = document.getElementById("slot-next");
const slotAfter = document.getElementById("slot-after");

const targetDisplay = document.getElementById("target-display");
const userDisplay = document.getElementById("user-display");
const nextDisplay = document.getElementById("next-display");
const afterDisplay = document.getElementById("after-display");
const typingInput = document.getElementById("typing-input");

const keyboardWrapper = document.getElementById("keyboard-wrapper");
const toggleKeyboardBtn = document.getElementById("toggle-keyboard-btn");

const resultModal = document.getElementById("result-modal");
const finalCpm = document.getElementById("final-cpm");
const finalAcc = document.getElementById("final-acc");
const finalTime = document.getElementById("final-time");
const restartBtn = document.getElementById("restart-btn");

/* =====================================================================
   5. 시간 제어 및 dayoffdev 스타일 듀얼 롤링 넘버 (WAAPI 기반)
   - 이전 숫자는 위로 쑥 퇴장 (0% -> -100%)
   - 새 숫자는 아래에서 위로 쑥 진입 (100% -> 0%)
   ===================================================================== */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateDigitRoll(boxEl, nextChar) {
  const currentEl = boxEl.querySelector(".digit-val:not(.leaving)");
  if (!currentEl) {
    boxEl.innerHTML = `<span class="digit-val">${nextChar}</span>`;
    return;
  }
  if (currentEl.textContent === nextChar) return;

  currentEl.classList.add("leaving");

  const nextEl = document.createElement("span");
  nextEl.className = "digit-val";
  nextEl.textContent = nextChar;
  boxEl.appendChild(nextEl);

  // 이전 숫자는 위로 슬라이드 아웃
  currentEl.animate([
    { transform: "translateY(0%)" },
    { transform: "translateY(-100%)" }
  ], {
    duration: 320,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    fill: "forwards"
  });

  // 새 숫자는 아래에서 위로 슬라이드 인
  const enterAnim = nextEl.animate([
    { transform: "translateY(100%)" },
    { transform: "translateY(0%)" }
  ], {
    duration: 320,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    fill: "forwards"
  });

  enterAnim.onfinish = () => {
    if (currentEl.parentNode === boxEl) {
      boxEl.removeChild(currentEl);
    }
  };
}

function startTimer() {
  if (isTimerRunning) return;
  isTimerRunning = true;
  startTime = Date.now() - elapsedSeconds * 1000;

  timerInterval = setInterval(() => {
    elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

    const curM = Math.floor(elapsedSeconds / 60);
    const curS = elapsedSeconds % 60;

    const m1 = Math.floor(curM / 10).toString();
    const m2 = (curM % 10).toString();
    const s1 = Math.floor(curS / 10).toString();
    const s2 = (curS % 10).toString();

    updateDigitRoll(slotM1, m1);
    updateDigitRoll(slotM2, m2);
    updateDigitRoll(slotS1, s1);
    updateDigitRoll(slotS2, s2);
  }, 200);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerRunning = false;
}

function resetTimer() {
  stopTimer();
  elapsedSeconds = 0;
  [slotM1, slotM2, slotS1, slotS2].forEach((slot) => {
    slot.innerHTML = '<span class="digit-val">0</span>';
  });
}

/* =====================================================================
   6. 정확도 실시간 계산 및 변동 애니메이션
   ===================================================================== */
function getCurrentAccuracy() {
  const targetText = activeList[currentIndex] || "";
  const currentInput = typingInput ? typingInput.value : "";

  let currentAttempted = currentInput.length;
  let currentCorrect = 0;

  for (let i = 0; i < currentInput.length; i++) {
    if (i < targetText.length && currentInput[i] === targetText[i]) {
      currentCorrect++;
    }
  }

  const totalAttempted = pastAttemptedChars + currentAttempted;
  const totalCorrect = pastCorrectChars + currentCorrect;

  return totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 100;
}

function updateStats() {
  const currentAcc = getCurrentAccuracy();

  if (currentAcc !== lastAccuracy) {
    accuracyDisplay.textContent = currentAcc;
    accuracyDisplay.classList.remove("acc-drop", "acc-bounce-up");
    void accuracyDisplay.offsetWidth;

    if (currentAcc < lastAccuracy) {
      accuracyDisplay.classList.add("acc-drop");
    } else if (currentAcc > lastAccuracy) {
      accuracyDisplay.classList.add("acc-bounce-up");
    }
    lastAccuracy = currentAcc;
  } else {
    accuracyDisplay.textContent = currentAcc;
  }

  const progress = activeList.length > 0 ? Math.round((currentIndex / activeList.length) * 100) : 0;
  progressPercent.textContent = `${progress}%`;
  progressBar.style.width = `${progress}%`;
}

/* =====================================================================
   7. 게임 제어 및 상하 3단 컨베이어 렌더링
   ===================================================================== */
function initPractice() {
  resetTimer();

  if (currentMode === "key") {
    subMenuBar.style.display = "flex";
    activeList = shuffle([...PRACTICE_DATA.key[currentSubPos]]);
  } else {
    subMenuBar.style.display = "none";
    activeList = [...PRACTICE_DATA[currentMode]];
  }

  currentIndex = 0;
  pastAttemptedChars = 0;
  pastCorrectChars = 0;

  lastAccuracy = 100;
  accuracyDisplay.classList.remove("acc-drop", "acc-bounce-up");

  sentenceStartTime = null;
  currentSentenceStrokes = 0;
  lastFinishedCPM = 0;
  totalCompletedStrokes = 0;
  totalCompletedTime = 0;
  cpmDisplay.textContent = "0";

  isSubmittingSentence = false;
  isComposingLocked = false;

  typingInput.value = "";
  practiceBoard.classList.remove("input-error");
  typingInput.disabled = false;
  resultModal.classList.add("hidden");

  clearAllActiveKeys();
  renderBoard();
  updateStats();
  typingInput.focus();
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function renderBoard() {
  if (currentIndex >= activeList.length) {
    finishPractice();
    return;
  }

  const target = activeList[currentIndex] || "";
  const currentInput = typingInput.value;

  // 1단: 당장 입력할 문장
  targetDisplay.innerHTML = "";
  for (let i = 0; i < target.length; i++) {
    const span = document.createElement("span");
    span.textContent = target[i];
    span.className = i < currentInput.length ? "target-char-done" : "target-char-pending";
    targetDisplay.appendChild(span);
  }

  // 1단: 바로 밑 1:1 수직 일치 입력창
  userDisplay.innerHTML = "";
  for (let i = 0; i < currentInput.length; i++) {
    const span = document.createElement("span");
    span.textContent = currentInput[i];

    if (i < target.length && currentInput[i] === target[i]) {
      span.className = "user-char-correct";
    } else {
      span.className = "user-char-wrong";
    }
    userDisplay.appendChild(span);
  }

  const cursor = document.createElement("span");
  cursor.className = "blinking-cursor";
  cursor.textContent = "|";
  userDisplay.appendChild(cursor);

  // 2단: 그 다음 입력할 문장
  if (currentIndex + 1 < activeList.length) {
    nextDisplay.textContent = activeList[currentIndex + 1];
    slotNext.style.display = "block";
  } else {
    nextDisplay.textContent = "마지막 문장입니다.";
    slotNext.style.display = "block";
  }

  // 3단: 그 다음다음 입력할 문장 (더 쪼그맣게)
  if (currentIndex + 2 < activeList.length) {
    afterDisplay.textContent = activeList[currentIndex + 2];
    slotAfter.style.display = "block";
  } else {
    afterDisplay.textContent = "";
    slotAfter.style.display = "none";
  }
}

// 아래에서 위로만 직진하며 글자 크기까지 자연스럽게 모핑되는 무지연 트랜지션
function handleNext() {
  isSubmittingSentence = true;
  isComposingLocked = true;

  const targetText = activeList[currentIndex] || "";
  const currentInput = typingInput.value || "";

  // 타수 통계 집계
  if (sentenceStartTime) {
    const sentenceDuration = (Date.now() - sentenceStartTime) / 1000;
    totalCompletedTime += sentenceDuration;
    totalCompletedStrokes += currentSentenceStrokes;

    const effectiveDuration = Math.max(sentenceDuration, 0.4);
    lastFinishedCPM = Math.round((currentSentenceStrokes / effectiveDuration) * 60);
    cpmDisplay.textContent = lastFinishedCPM;
  }

  const maxLen = Math.max(targetText.length, currentInput.length);
  for (let i = 0; i < maxLen; i++) {
    pastAttemptedChars++;
    if (i < targetText.length && i < currentInput.length && targetText[i] === currentInput[i]) {
      pastCorrectChars++;
    }
  }

  // 1. 완료된 이전 문장을 복제하여 위로 부드럽게 퇴장시킴 (Ghost Track)
  const ghost = slotCurrent.cloneNode(true);
  ghost.style.position = "absolute";
  ghost.style.top = slotCurrent.offsetTop + "px";
  ghost.style.left = slotCurrent.offsetLeft + "px";
  ghost.style.width = slotCurrent.offsetWidth + "px";
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = "10";
  practiceBoard.appendChild(ghost);

  ghost.animate([
    { transform: "translateY(0px)", opacity: 1 },
    { transform: "translateY(-32px)", opacity: 0 }
  ], {
    duration: 260,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)"
  }).onfinish = () => {
    if (ghost.parentNode) ghost.remove();
  };

  // 2. 실제 요소 간 Y 거리 측정
  const dist1 = slotNext.offsetTop - slotCurrent.offsetTop;
  const dist2 = slotAfter.style.display !== "none" ? (slotAfter.offsetTop - slotNext.offsetTop) : 28;

  // 3. 지연 없이 인덱스 전진 및 인풋 초기화
  currentIndex++;
  sentenceStartTime = null;
  currentSentenceStrokes = 0;
  typingInput.value = "";
  userDisplay.innerHTML = '<span class="blinking-cursor">|</span>';

  // 한글 IME 잔여 음절 누출 차단 플러시
  requestAnimationFrame(() => {
    typingInput.value = "";
  });
  setTimeout(() => {
    isComposingLocked = false;
    isSubmittingSentence = false;
  }, 50);

  if (currentIndex >= activeList.length) {
    finishPractice();
    return;
  }

  // 4. 새로운 문장으로 즉시 렌더링
  renderBoard();
  updateStats();

  // 5. 다음 문장들이 이전 자리에서 정확히 시작하여 위로 부드럽게 상승 (모핑 효과)
  slotCurrent.animate([
    { transform: `translateY(${dist1}px) scale(0.8)`, transformOrigin: "left top", opacity: 0.7 },
    { transform: "translateY(0px) scale(1)", transformOrigin: "left top", opacity: 1 }
  ], {
    duration: 260,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)"
  });

  slotNext.animate([
    { transform: `translateY(${dist2}px) scale(0.8)`, transformOrigin: "left top", opacity: 0.4 },
    { transform: "translateY(0px) scale(1)", transformOrigin: "left top", opacity: 0.7 }
  ], {
    duration: 260,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)"
  });

  if (slotAfter.style.display !== "none") {
    slotAfter.animate([
      { transform: "translateY(20px)", opacity: 0 },
      { transform: "translateY(0px)", opacity: 0.4 }
    ], {
      duration: 260,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)"
    });
  }
}

function finishPractice() {
  stopTimer();
  typingInput.disabled = true;
  targetDisplay.textContent = "연습 완료!";
  userDisplay.innerHTML = "";
  nextDisplay.textContent = "";
  afterDisplay.textContent = "";

  const acc = pastAttemptedChars > 0 ? Math.round((pastCorrectChars / pastAttemptedChars) * 100) : 100;
  const totalDuration = Math.max(totalCompletedTime, 1);
  const avgCpm = Math.round((totalCompletedStrokes / totalDuration) * 60);

  finalCpm.textContent = avgCpm;
  finalAcc.textContent = acc;
  finalTime.textContent = formatTime(elapsedSeconds);
  resultModal.classList.remove("hidden");
  clearAllActiveKeys();
}

function triggerInputError() {
  practiceBoard.classList.remove("input-error");
  void practiceBoard.offsetWidth;
  practiceBoard.classList.add("input-error");
}

/* =====================================================================
   8. 입력 감지 및 키 제어 (무중단 0ms 반응 & 한글 IME 누출 방지)
   ===================================================================== */
practiceBoard.addEventListener("click", () => {
  typingInput.focus();
});

typingInput.addEventListener("compositionend", () => {
  if (isComposingLocked) {
    typingInput.value = "";
    userDisplay.innerHTML = '<span class="blinking-cursor">|</span>';
  }
});

typingInput.addEventListener("input", () => {
  // 전환 시 이전 문장의 마지막 조합 음절이 새 입력창으로 튀어나오는 것 차단
  if (isComposingLocked) {
    typingInput.value = "";
    return;
  }

  const currentInput = typingInput.value;

  if (currentInput.length > 0) {
    if (!isTimerRunning) {
      startTimer();
    }
    if (!sentenceStartTime) {
      sentenceStartTime = Date.now();
    }
  }

  practiceBoard.classList.remove("input-error");

  const targetText = activeList[currentIndex];
  if (!targetText) return;

  currentSentenceStrokes = getStringStrokes(currentInput);

  if (currentMode === "key") {
    if (currentInput.length >= 1) {
      handleNext();
      return;
    }
  }

  if (currentInput.length > targetText.length) {
    handleNext();
    return;
  }

  renderBoard();
  updateStats();
});

typingInput.addEventListener("keydown", (e) => {
  const BLOCKED_NAV_KEYS = [
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
    "Home", "End", "PageUp", "PageDown"
  ];
  if (BLOCKED_NAV_KEYS.includes(e.key)) {
    e.preventDefault();
    return;
  }

  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();

    // IME가 엔터로 조합을 끝낼 때 브라우저가 엔터 이벤트를 2번 연속 날리는 현상 차단
    if (isSubmittingSentence) return;

    if (currentMode !== "key") {
      const targetText = activeList[currentIndex] || "";
      const currentInput = typingInput.value || "";

      // 글자 수 일치 또는 문장 일치 검증
      if (currentInput.length === targetText.length || currentInput.trim() === targetText.trim()) {
        handleNext();
      } else {
        if (currentInput.length > 0) {
          triggerInputError();
        }
      }
    }
  }
});

/* =====================================================================
   9. 가상 키보드 반응 및 토글
   ===================================================================== */
function clearAllActiveKeys() {
  document.querySelectorAll(".key.key-active").forEach((el) => {
    el.classList.remove("key-active");
  });
}

window.addEventListener("keydown", (e) => {
  if (!isKeyboardVisible) return;
  const keyEl = document.querySelector(`.key[data-code="${e.code}"]`);
  if (keyEl) {
    keyEl.classList.add("key-active");
  }
});

window.addEventListener("keyup", (e) => {
  const keyEl = document.querySelector(`.key[data-code="${e.code}"]`);
  if (keyEl) {
    keyEl.classList.remove("key-active");
  }
});

window.addEventListener("blur", clearAllActiveKeys);

toggleKeyboardBtn.addEventListener("click", () => {
  isKeyboardVisible = !isKeyboardVisible;
  if (isKeyboardVisible) {
    keyboardWrapper.classList.remove("hidden");
    toggleKeyboardBtn.textContent = "⌨️ 키보드 숨기기";
    toggleKeyboardBtn.classList.remove("off");
  } else {
    keyboardWrapper.classList.add("hidden");
    toggleKeyboardBtn.textContent = "⌨️ 키보드 켜기";
    toggleKeyboardBtn.classList.add("off");
    clearAllActiveKeys();
  }
});

/* =====================================================================
   10. 실시간 타수 계산 및 감쇄 (50ms 주기)
   ===================================================================== */
setInterval(() => {
  if (!sentenceStartTime) {
    if (currentIndex > 0) {
      cpmDisplay.textContent = lastFinishedCPM;
    } else {
      cpmDisplay.textContent = "0";
    }
    return;
  }

  const elapsed = (Date.now() - sentenceStartTime) / 1000;
  if (elapsed <= 0) return;

  const effectiveElapsed = Math.max(elapsed, 0.4);
  const currentCPM = Math.round((currentSentenceStrokes / effectiveElapsed) * 60);

  cpmDisplay.textContent = currentCPM;
}, 50);

/* =====================================================================
   11. 메뉴 전환 및 재시작
   ===================================================================== */
modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    modeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    initPractice();
  });
});

subBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    subBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentSubPos = btn.dataset.pos;
    initPractice();
  });
});

restartBtn.addEventListener("click", initPractice);

/* =====================================================================
   12. 접속 로딩 제어
   ===================================================================== */
window.addEventListener("DOMContentLoaded", () => {
  initPractice();

  setTimeout(() => {
    loadingScreen.classList.add("fade-out");
    typingContainer.classList.add("fade-in");
    typingInput.focus();
  }, 700);
});
