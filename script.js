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

let recentStrokes = [];
const TIME_WINDOW_SEC = 3.0; // 최근 3초 기준 감쇄

let totalAttemptedChars = 0;
let totalCorrectChars = 0;

let isTransitioning = false; // IME 조합 잔여 글자 차단 플래그

/* =====================================================================
   4. DOM 요소
   ===================================================================== */
const modeBtns = document.querySelectorAll(".mode-btn");
const subMenuBar = document.getElementById("sub-menu-bar");
const subBtns = document.querySelectorAll(".sub-btn");

const cpmDisplay = document.getElementById("cpm-display");
const accuracyDisplay = document.getElementById("accuracy-display");
const progressPercent = document.getElementById("progress-percent");
const progressBar = document.getElementById("progress-bar");

const targetDisplay = document.getElementById("target-display");
const typingInput = document.getElementById("typing-input");

const resultModal = document.getElementById("result-modal");
const finalAcc = document.getElementById("final-acc");
const finalCount = document.getElementById("final-count");
const restartBtn = document.getElementById("restart-btn");

/* =====================================================================
   5. 게임 제어 및 화면 렌더링
   ===================================================================== */
function initPractice() {
  isTransitioning = false;

  if (currentMode === "key") {
    subMenuBar.style.display = "flex";
    activeList = shuffle([...PRACTICE_DATA.key[currentSubPos]]);
  } else {
    subMenuBar.style.display = "none";
    activeList = [...PRACTICE_DATA[currentMode]];
  }

  currentIndex = 0;
  totalAttemptedChars = 0;
  totalCorrectChars = 0;
  recentStrokes = [];
  lastInputLength = 0;
  typingInput.value = "";
  typingInput.classList.remove("input-error");
  typingInput.disabled = false;
  resultModal.classList.add("hidden");

  renderTarget();
  updateStats();
  typingInput.focus();
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// 대상 글자 렌더링 (일치 시 초록색, 불일치 시 빨간색 밑줄)
function renderTarget() {
  if (currentIndex >= activeList.length) {
    finishPractice();
    return;
  }

  const targetText = activeList[currentIndex];
  const currentInput = typingInput.value;
  targetDisplay.innerHTML = "";

  for (let i = 0; i < targetText.length; i++) {
    const span = document.createElement("span");
    span.textContent = targetText[i];

    if (i < currentInput.length) {
      if (currentInput[i] === targetText[i]) {
        span.className = "char-correct";
      } else {
        span.className = "char-wrong";
      }
    } else if (i === currentInput.length) {
      span.className = "char-pending char-current";
    } else {
      span.className = "char-pending";
    }

    targetDisplay.appendChild(span);
  }
}

// 다음 단계로 넘어가기 (채점 후 초기화)
function handleNext() {
  if (isTransitioning) return;
  isTransitioning = true;

  const targetText = activeList[currentIndex];
  const currentInput = typingInput.value;

  // 글자별 정확도 집계
  const maxLen = Math.max(targetText.length, currentInput.length);
  for (let i = 0; i < maxLen; i++) {
    totalAttemptedChars++;
    if (i < targetText.length && i < currentInput.length && targetText[i] === currentInput[i]) {
      totalCorrectChars++;
    }
  }

  currentIndex++;

  // IME 버퍼 제거를 위한 일시적 포커스 해제 및 초기화
  typingInput.value = "";
  lastInputLength = 0;
  typingInput.classList.remove("input-error");
  typingInput.blur();

  if (currentIndex >= activeList.length) {
    finishPractice();
    isTransitioning = false;
  } else {
    renderTarget();
    updateStats();

    // 잔여 키 이벤트 루프 처리 후 재포커스
    setTimeout(() => {
      typingInput.value = "";
      lastInputLength = 0;
      typingInput.focus();
      isTransitioning = false;
    }, 25);
  }
}

function finishPractice() {
  typingInput.disabled = true;
  targetDisplay.textContent = "연습이 완료되었습니다!";
  
  const acc = totalAttemptedChars > 0 ? Math.round((totalCorrectChars / totalAttemptedChars) * 100) : 100;
  finalAcc.textContent = acc;
  finalCount.textContent = activeList.length;
  resultModal.classList.remove("hidden");
}

function triggerInputError() {
  typingInput.classList.remove("input-error");
  void typingInput.offsetWidth;
  typingInput.classList.add("input-error");
}

/* =====================================================================
   6. 입력 감지 및 글자 수(자릿수) 기반 엔터 검증
   ===================================================================== */
let lastInputLength = 0;

typingInput.addEventListener("compositionend", () => {
  if (isTransitioning) {
    typingInput.value = "";
    lastInputLength = 0;
  }
});

typingInput.addEventListener("input", () => {
  if (isTransitioning) {
    typingInput.value = "";
    lastInputLength = 0;
    return;
  }

  typingInput.classList.remove("input-error");

  const targetText = activeList[currentIndex];
  if (!targetText) return;

  const currentInput = typingInput.value;

  // 타수 카운팅
  if (currentInput.length > lastInputLength) {
    const addedChars = currentInput.slice(lastInputLength);
    const strokes = getStringStrokes(addedChars);
    recentStrokes.push({ time: Date.now(), strokes: strokes });
  }
  lastInputLength = currentInput.length;

  // 1. 자리연습: 1글자 입력 시 즉시 이동
  if (currentMode === "key") {
    if (currentInput.length >= 1) {
      handleNext();
      return;
    }
  }

  // 2. 낱말/단문/장문: 자릿수 초과 입력 시 즉시 채점 후 이동
  if (currentInput.length > targetText.length) {
    handleNext();
    return;
  }

  renderTarget();
});

// 엔터 키 처리
typingInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.keyCode === 13) {
    e.preventDefault();

    if (isTransitioning) return;

    if (currentMode !== "key") {
      const targetText = activeList[currentIndex];
      const currentInput = typingInput.value;

      // 글자 수(자릿수)가 일치하면 오답(예: 구름 -> ㅇㅇ)이어도 채점 후 통과
      if (currentInput.length === targetText.length) {
        handleNext();
      } else {
        // 목표 글자 수를 아직 다 채우지 못한 경우 빨간색 경고
        triggerInputError();
      }
    }
  }
});

/* =====================================================================
   7. 실시간 타수 감쇄 및 대시보드
   ===================================================================== */
function updateStats() {
  const acc = totalAttemptedChars > 0 ? Math.round((totalCorrectChars / totalAttemptedChars) * 100) : 100;
  accuracyDisplay.textContent = acc;

  const progress = activeList.length > 0 ? Math.round((currentIndex / activeList.length) * 100) : 0;
  progressPercent.textContent = `${progress}%`;
  progressBar.style.width = `${progress}%`;
}

// 100ms 간격으로 최근 3초 내 타수 계산 (미입력 시 자연스럽게 0으로 감쇄)
setInterval(() => {
  const now = Date.now();
  const threshold = now - TIME_WINDOW_SEC * 1000;

  recentStrokes = recentStrokes.filter((item) => item.time >= threshold);
  const totalRecentStrokes = recentStrokes.reduce((sum, item) => sum + item.strokes, 0);

  const currentCPM = Math.round((totalRecentStrokes / TIME_WINDOW_SEC) * 60);
  cpmDisplay.textContent = currentCPM;
}, 100);

/* =====================================================================
   8. 메뉴 이벤트 연결
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

initPractice();
