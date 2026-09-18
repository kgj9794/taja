/* =====================================================================
   1. 한글 음소 분해 및 유효 순타수(Net Strokes) 정밀 계산 모듈
   ===================================================================== */
const CHO_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG_LIST = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
const JONG_LIST = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

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

  if (/[A-Z!@#$%^&*()_+{}|:"<>?~.]/.test(char)) return 2;
  return 1;
}

function decomposeChar(char) {
  if (!char) return [];
  const code = char.charCodeAt(0);

  if (code >= 0xAC00 && code <= 0xD7A3) {
    const syllableIndex = code - 0xAC00;
    const jong = syllableIndex % 28;
    const jung = Math.floor((syllableIndex - jong) / 28) % 21;
    const cho = Math.floor(Math.floor((syllableIndex - jong) / 28) / 21);

    const parts = [
      { type: 'cho', idx: cho, stroke: CHO_STROKES[cho] },
      { type: 'jung', idx: jung, stroke: JUNG_STROKES[jung] }
    ];
    if (jong > 0) {
      parts.push({ type: 'jong', idx: jong, stroke: JONG_STROKES[jong] });
    }
    return parts;
  }

  const choIdx = CHO_LIST.indexOf(char);
  if (choIdx !== -1) {
    return [{ type: 'cho', idx: choIdx, stroke: CHO_STROKES[choIdx] }];
  }
  const jungIdx = JUNG_LIST.indexOf(char);
  if (jungIdx !== -1) {
    return [{ type: 'jung', idx: jungIdx, stroke: JUNG_STROKES[jungIdx] }];
  }

  return [{ type: 'other', char: char, stroke: getCharStrokes(char) }];
}

function getValidStrokeCount(targetText, input) {
  if (!targetText || !input) return 0;
  let validStrokes = 0;
  const compareLen = Math.min(targetText.length, input.length);

  for (let i = 0; i < compareLen; i++) {
    const tChar = targetText[i];
    const iChar = input[i];

    if (tChar === iChar) {
      validStrokes += getCharStrokes(tChar);
    } else if (i === input.length - 1) {
      const tParts = decomposeChar(tChar);
      const iParts = decomposeChar(iChar);

      for (let j = 0; j < iParts.length; j++) {
        if (j < tParts.length && tParts[j].type === iParts[j].type && tParts[j].idx === iParts[j].idx) {
          validStrokes += iParts[j].stroke;
        } else {
          break;
        }
      }
    }
  }
  return validStrokes;
}

function parseMultiline(text) {
  return text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/* =====================================================================
   2. 두벌식 가상 키보드 매핑 및 다음 타깃 키 판별 모듈
   ===================================================================== */
const CHO_KEY_MAP = {
  'ㄱ': [{ code: 'KeyR', shift: false }],
  'ㄲ': [{ code: 'KeyR', shift: true }],
  'ㄴ': [{ code: 'KeyS', shift: false }],
  'ㄷ': [{ code: 'KeyE', shift: false }],
  'ㄸ': [{ code: 'KeyE', shift: true }],
  'ㄹ': [{ code: 'KeyF', shift: false }],
  'ㅁ': [{ code: 'KeyA', shift: false }],
  'ㅂ': [{ code: 'KeyQ', shift: false }],
  'ㅃ': [{ code: 'KeyQ', shift: true }],
  'ㅅ': [{ code: 'KeyT', shift: false }],
  'ㅆ': [{ code: 'KeyT', shift: true }],
  'ㅇ': [{ code: 'KeyD', shift: false }],
  'ㅈ': [{ code: 'KeyW', shift: false }],
  'ㅉ': [{ code: 'KeyW', shift: true }],
  'ㅊ': [{ code: 'KeyC', shift: false }],
  'ㅋ': [{ code: 'KeyZ', shift: false }],
  'ㅌ': [{ code: 'KeyX', shift: false }],
  'ㅍ': [{ code: 'KeyV', shift: false }],
  'ㅎ': [{ code: 'KeyG', shift: false }]
};

const JUNG_KEY_MAP = {
  'ㅏ': [{ code: 'KeyK', shift: false }],
  'ㅐ': [{ code: 'KeyO', shift: false }],
  'ㅑ': [{ code: 'KeyI', shift: false }],
  'ㅒ': [{ code: 'KeyO', shift: true }],
  'ㅓ': [{ code: 'KeyJ', shift: false }],
  'ㅔ': [{ code: 'KeyP', shift: false }],
  'ㅕ': [{ code: 'KeyU', shift: false }],
  'ㅖ': [{ code: 'KeyP', shift: true }],
  'ㅗ': [{ code: 'KeyH', shift: false }],
  'ㅘ': [{ code: 'KeyH', shift: false }, { code: 'KeyK', shift: false }],
  'ㅙ': [{ code: 'KeyH', shift: false }, { code: 'KeyO', shift: false }],
  'ㅚ': [{ code: 'KeyH', shift: false }, { code: 'KeyL', shift: false }],
  'ㅛ': [{ code: 'KeyY', shift: false }],
  'ㅜ': [{ code: 'KeyN', shift: false }],
  'ㅝ': [{ code: 'KeyN', shift: false }, { code: 'KeyJ', shift: false }],
  'ㅞ': [{ code: 'KeyN', shift: false }, { code: 'KeyP', shift: false }],
  'ㅟ': [{ code: 'KeyN', shift: false }, { code: 'KeyL', shift: false }],
  'ㅠ': [{ code: 'KeyB', shift: false }],
  'ㅡ': [{ code: 'KeyM', shift: false }],
  'ㅢ': [{ code: 'KeyM', shift: false }, { code: 'KeyL', shift: false }],
  'ㅣ': [{ code: 'KeyL', shift: false }]
};

const JONG_KEY_MAP = [
  [],
  [{ code: 'KeyR', shift: false }],
  [{ code: 'KeyR', shift: true }],
  [{ code: 'KeyR', shift: false }, { code: 'KeyT', shift: false }],
  [{ code: 'KeyS', shift: false }],
  [{ code: 'KeyS', shift: false }, { code: 'KeyW', shift: false }],
  [{ code: 'KeyS', shift: false }, { code: 'KeyG', shift: false }],
  [{ code: 'KeyE', shift: false }],
  [{ code: 'KeyF', shift: false }],
  [{ code: 'KeyF', shift: false }, { code: 'KeyR', shift: false }],
  [{ code: 'KeyF', shift: false }, { code: 'KeyA', shift: false }],
  [{ code: 'KeyF', shift: false }, { code: 'KeyQ', shift: false }],
  [{ code: 'KeyF', shift: false }, { code: 'KeyT', shift: false }],
  [{ code: 'KeyF', shift: false }, { code: 'KeyX', shift: false }],
  [{ code: 'KeyF', shift: false }, { code: 'KeyV', shift: false }],
  [{ code: 'KeyF', shift: false }, { code: 'KeyG', shift: false }],
  [{ code: 'KeyA', shift: false }],
  [{ code: 'KeyQ', shift: false }],
  [{ code: 'KeyQ', shift: false }, { code: 'KeyT', shift: false }],
  [{ code: 'KeyT', shift: false }],
  [{ code: 'KeyT', shift: true }],
  [{ code: 'KeyD', shift: false }],
  [{ code: 'KeyW', shift: false }],
  [{ code: 'KeyC', shift: false }],
  [{ code: 'KeyZ', shift: false }],
  [{ code: 'KeyX', shift: false }],
  [{ code: 'KeyV', shift: false }],
  [{ code: 'KeyG', shift: false }]
];

const STANDALONE_JAMO_MAP = {
  ...CHO_KEY_MAP,
  ...JUNG_KEY_MAP,
  'ㄳ': [{ code: 'KeyR', shift: false }, { code: 'KeyT', shift: false }],
  'ㄵ': [{ code: 'KeyS', shift: false }, { code: 'KeyW', shift: false }],
  'ㄶ': [{ code: 'KeyS', shift: false }, { code: 'KeyG', shift: false }],
  'ㄺ': [{ code: 'KeyF', shift: false }, { code: 'KeyR', shift: false }],
  'ㄻ': [{ code: 'KeyF', shift: false }, { code: 'KeyA', shift: false }],
  'ㄼ': [{ code: 'KeyF', shift: false }, { code: 'KeyQ', shift: false }],
  'ㄽ': [{ code: 'KeyF', shift: false }, { code: 'KeyT', shift: false }],
  'ㄾ': [{ code: 'KeyF', shift: false }, { code: 'KeyX', shift: false }],
  'ㄿ': [{ code: 'KeyF', shift: false }, { code: 'KeyV', shift: false }],
  'ㅀ': [{ code: 'KeyF', shift: false }, { code: 'KeyG', shift: false }],
  'ㅄ': [{ code: 'KeyQ', shift: false }, { code: 'KeyT', shift: false }]
};

const SPECIAL_CHAR_MAP = {
  ' ': { code: 'Space', shift: false },
  '.': { code: 'Period', shift: false },
  ',': { code: 'Comma', shift: false },
  '!': { code: 'Digit1', shift: true },
  '@': { code: 'Digit2', shift: true },
  '#': { code: 'Digit3', shift: true },
  '$': { code: 'Digit4', shift: true },
  '%': { code: 'Digit5', shift: true },
  '^': { code: 'Digit6', shift: true },
  '&': { code: 'Digit7', shift: true },
  '*': { code: 'Digit8', shift: true },
  '(': { code: 'Digit9', shift: true },
  ')': { code: 'Digit0', shift: true },
  '-': { code: 'Minus', shift: false },
  '_': { code: 'Minus', shift: true },
  '=': { code: 'Equal', shift: false },
  '+': { code: 'Equal', shift: true },
  '~': { code: 'Backquote', shift: true },
  '`': { code: 'Backquote', shift: false },
  '?': { code: 'Slash', shift: true },
  '/': { code: 'Slash', shift: false }
};
for (let i = 0; i <= 9; i++) {
  SPECIAL_CHAR_MAP[i.toString()] = { code: `Digit${i}`, shift: false };
}

function getKeystrokes(text) {
  if (!text) return [];
  const keys = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);

    if (code >= 0xAC00 && code <= 0xD7A3) {
      const syllableIndex = code - 0xAC00;
      const jong = syllableIndex % 28;
      const jung = Math.floor((syllableIndex - jong) / 28) % 21;
      const cho = Math.floor(Math.floor((syllableIndex - jong) / 28) / 21);

      const choChar = CHO_LIST[cho];
      const jungChar = JUNG_LIST[jung];

      if (CHO_KEY_MAP[choChar]) keys.push(...CHO_KEY_MAP[choChar]);
      if (JUNG_KEY_MAP[jungChar]) keys.push(...JUNG_KEY_MAP[jungChar]);
      if (jong > 0 && JONG_KEY_MAP[jong]) keys.push(...JONG_KEY_MAP[jong]);
    } else if (STANDALONE_JAMO_MAP[char]) {
      keys.push(...STANDALONE_JAMO_MAP[char]);
    } else if (SPECIAL_CHAR_MAP[char]) {
      keys.push(SPECIAL_CHAR_MAP[char]);
    } else if (/[a-zA-Z]/.test(char)) {
      const isUpper = char >= 'A' && char <= 'Z';
      keys.push({ code: `Key${char.toUpperCase()}`, shift: isUpper });
    }
  }
  return keys;
}

function updateTargetKeyHighlight() {
  document.querySelectorAll(".key.key-target").forEach((el) => {
    el.classList.remove("key-target");
  });

  if (!isKeyboardVisible || isCountingDown || currentIndex >= activeList.length || !resultModal.classList.contains("hidden") || !lobbyScreen.classList.contains("hidden")) {
    return;
  }

  const targetText = activeList[currentIndex] || "";
  const currentInput = typingInput ? typingInput.value : "";

  const targetKeys = getKeystrokes(targetText);
  const inputKeys = getKeystrokes(currentInput);

  let nextKey = null;

  let isPrefix = true;
  for (let i = 0; i < inputKeys.length; i++) {
    if (!targetKeys[i] || inputKeys[i].code !== targetKeys[i].code || inputKeys[i].shift !== targetKeys[i].shift) {
      isPrefix = false;
      break;
    }
  }

  if (isPrefix) {
    if (inputKeys.length < targetKeys.length) {
      nextKey = targetKeys[inputKeys.length];
    } else if (currentMode === "word" && currentInput.length === targetText.length) {
      nextKey = { code: "Space", shift: false };
    } else if (currentMode !== "key" && currentInput.length >= targetText.length) {
      nextKey = { code: "Enter", shift: false };
    }
  } else {
    nextKey = { code: "Backspace", shift: false };
  }

  if (nextKey) {
    const keyEl = document.querySelector(`.key[data-code="${nextKey.code}"]`);
    if (keyEl) keyEl.classList.add("key-target");
    if (nextKey.shift) {
      const shiftEl = document.querySelector('.key[data-code="ShiftLeft"]');
      if (shiftEl) shiftEl.classList.add("key-target");
    }
  }
}

/* =====================================================================
   3. 연습 데이터 세트
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
    "사과", "하늘", "바다", "구름", "나무", "햇살", "바람", "가을", "겨울", "행복",
    "친구", "가족", "소풍", "우산", "기차", "버스", "커피", "우유", "산책", "음악",
    "영화", "사진", "편지", "선물", "미소", "마음", "사랑", "시계", "안경", "지갑",
    "신발", "가방", "의자", "책상", "거울", "수건", "비누", "치약", "접시", "보리",
    "감자", "양파", "당근", "포도", "딸기", "수박", "자전거", "비행기", "도서관", "정류장",
    "운동장", "놀이터", "신호등", "지하철", "이어폰", "텀블러", "그림책", "초콜릿", "손거울", "머그컵",
    "메모지", "세탁기", "청소기", "선풍기", "주전자", "손수건", "목도리", "털모자", "운동화", "슬리퍼",
    "우체국", "소방서", "경찰서", "미술관", "박물관", "수목원", "동물원", "백화점", "편의점", "세탁소",
    "미용실", "수영장", "스마트폰", "다이어리", "손목시계", "블루투스", "여행가방", "배낭여행", "모래놀이", "회전목마",
    "미끄럼틀", "그네타기", "횡단보도", "시내버스", "마을버스", "자전거길", "스케치북", "색연필통", "형광펜촉", "동화책장",
    "종이접기", "비눗방울", "따뜻한밥", "아침햇살", "저녁노을", "새벽공기", "초록식물", "보름달빛", "가을하늘", "시원한물",
    "녹차한잔", "카페라떼", "치즈피자", "김치볶음", "된장찌개", "순두부찌", "소금빵버", "단팥빵향", "군만두바", "토스트구"
  ],
  short: [
    "중요한 것은 꺾이지 않는 마음.",
    "중요한 건 꺾였는데도 그냥 하는 마음.",
    "오히려 좋아 가보자고.",
    "폼 미쳤다 진짜 레전드네.",
    "알아서 잘 딱 깔끔하고 센스있게.",
    "어쩔티비 저쩔티비 안물티비 안궁티비.",
    "내 뼈 그만 때려 순살 되겠어.",
    "이게 무슨 일이야 이렇게 좋은 날에.",
    "당황하지 않고 자연스럽게 넘어가기.",
    "내 안에 잠든 흑염룡이 깨어난다.",
    "맑은 눈의 광인 그 자체.",
    "멈춰 학교폭력 멈춰.",
    "가보자고 인생 뭐 있어 직진이야.",
    "돈 많은 백수가 되고 싶다.",
    "월급은 통장을 스쳐 지나갈 뿐.",
    "퇴근하고 싶다 격렬하게 퇴근하고 싶다.",
    "네가 왜 거기서 나와.",
    "호의가 계속되면 권리인 줄 안다.",
    "피할 수 없으면 즐겨라.",
    "인생은 실전이야 종만아.",
    "묻고 더블로 가.",
    "내가 왕이 될 상인가.",
    "어디서 타는 냄새 안 나요 내 심장이 불타고 있잖아요.",
    "소년이여 야망을 품어라.",
    "오늘 걷지 않으면 내일은 뛰어야 한다.",
    "늦었다고 생각할 때가 진짜 너무 늦었다.",
    "티끌 모아 태산이 아니라 티끌 모아 티끌이다.",
    "포기하면 편해 하지만 다시 일어나야지.",
    "너 자신을 알라.",
    "이 또한 지나가리라.",
    "내일은 내일의 태양이 뜬다.",
    "아무것도 안 했는데 벌써 이 시간이야.",
    "오늘 먹을 치킨을 내일로 미루지 말라.",
    "맛있게 먹으면 0칼로리.",
    "인생은 타이밍과 추진력이다.",
    "완전 럭키비키잖아.",
    "이게 바로 원영적 사고.",
    "중꺾마 정신으로 버티는 거야.",
    "기출변형에 당황하지 마라.",
    "사람은 서울로 가고 말은 제주도로 가야 한다.",
    "침대는 과학입니다.",
    "인생은 짧고 예술은 길다.",
    "아는 것이 힘이다.",
    "천 리 길도 한 걸음부터.",
    "고생 끝에 낙이 온다.",
    "시작이 반이다.",
    "백지장도 맞들면 낫다.",
    "콩 심은 데 콩 나고 팥 심은 데 팥 난다.",
    "발 없는 말이 천 리 간다.",
    "낮말은 새가 듣고 밤말은 쥐가 듣는다.",
    "가는 말이 고와야 오는 말이 곱다.",
    "웃는 얼굴에 침 못 뱉는다.",
    "세 살 버릇 여든까지 간다.",
    "티끌 모아 로또 산다.",
    "아침 일찍 일어나는 새가 피곤하다.",
    "일찍 일어나는 벌레는 새한테 잡힌다.",
    "남의 떡이 더 커 보인다.",
    "벼는 익을수록 고개를 숙인다.",
    "호랑이도 제 말 하면 온다.",
    "쇠뿔도 단김에 빼라.",
    "얌전한 고양이가 부뚜막에 먼저 올라간다.",
    "등잔 밑이 어둡다.",
    "뱁새가 황새 따라가다 가랑이 찢어진다.",
    "원숭이도 나무에서 떨어진다.",
    "금강산도 식후경.",
    "우물 안 개구리.",
    "하늘이 무너져도 솟아날 구멍은 있다.",
    "구슬이 서 말이라도 꿰어야 보배.",
    "길고 짧은 것은 대봐야 안다.",
    "닭 쫓던 개 지붕 쳐다본다.",
    "똥 묻은 개가 겨 묻은 개 나무란다.",
    "보기 좋은 떡이 먹기도 좋다.",
    "수박 겉핥기.",
    "십 년이면 강산도 변한다.",
    "아니 땐 굴뚝에 연기 날까.",
    "옥에 티.",
    "작심삼일도 열 번이면 한 달이다.",
    "재주가 많은 사람은 배가 고프다.",
    "쥐구멍에도 볕 들 날 있다.",
    "짚신도 짝이 있다.",
    "칼로 물 베기.",
    "하룻강아지 범 무서운 줄 모른다.",
    "간에 기별도 안 간다.",
    "개천에서 용 난다.",
    "걱정도 팔자다.",
    "고래 싸움에 새우 등 터진다.",
    "공든 탑이 무너지랴.",
    "꿩 대신 닭.",
    "누워서 침 뱉기.",
    "달면 삼키고 쓰면 뱉는다.",
    "도토리 키 재기.",
    "땅 짚고 헤엄치기.",
    "말 한마디로 천 냥 빚을 갚는다.",
    "매도 먼저 맞는 게 낫다.",
    "바늘 도둑이 소 도둑 된다.",
    "배보다 배꼽이 더 크다.",
    "빈 수레가 더 요란하다.",
    "사공이 많으면 배가 산으로 간다.",
    "소 잃고 외양간 고친다.",
    "열 번 찍어 안 넘어가는 나무 없다."
  ],
  long: {
    stars: parseMultiline(`
      계절이 지나가는 하늘에는 가을로 가득 차 있습니다
      나는 아무 걱정도 없이 가을 속의 별들을 다 헤일 듯합니다
      가슴 속에 하나 둘 새겨지는 별을 이제 다 못 헤는 것은
      쉬이 아침이 오는 까닭이요 내일 밤이 남은 까닭이요
      아직 나의 청춘이 다하지 않은 까닭입니다
      별 하나에 추억과 별 하나에 사랑과
      별 하나에 쓸쓸함과 별 하나에 동경과
      별 하나에 시와 별 하나에 어머니 어머니
      어머님 나는 별 하나에 아름다운 말 한마디씩 불러 봅니다
      소학교 때 책상을 같이 했던 아이들의 이름과
      패 경 옥 이런 이국 소녀들의 이름과
      비둘기 강아지 토끼 노새 노루 프랑시스 잼 도경환
      이런 시인의 이름을 불러 봅니다
      이네들은 너무나 멀리 있습니다 별이 아스라이 멀 듯이
      어머님 그리고 당신은 멀리 북간도에 계십니다
      나는 무엇인지 그리워 이 많은 별빛이 내린 언덕 위에
      내 이름자를 써 보고 흙으로 덮어 버리었습니다
      딴은 밤을 새워 우는 벌레는 부끄러운 이름을 슬퍼하는 까닭입니다
      그러나 겨울이 지나고 나의 별에도 봄이 오면
      무덤 위에 파란 풀이 피어나듯이
      내 이름자 묻힌 언덕 위에도 자랑처럼 풀이 무성할 거외다
    `),
    silence: parseMultiline(`
      님은 갔습니다 아아 사랑하는 나의 님은 갔습니다
      푸른 산빛을 깨치고 단풍나무 숲을 향하여 난 작은 길을 걸어서 차마 떨치고 갔습니다
      황금의 꽃같이 굳고 빛나던 옛 맹세는 차디찬 티끌이 되어서 한숨의 미풍에 날아갔습니다
      날카로운 첫 키스의 추억은 나의 운명의 지침을 돌려놓고 뒷걸음쳐서 사라졌습니다
      나는 향기로운 님의 말소리에 귀먹고 꽃다운 님의 얼굴에 눈멀었습니다
      사랑도 사람의 일이라 만날 때에 미리 떠날 것을 염려하고 경계하지 아니한 것은 아니지만
      이별은 뜻밖의 일이 되고 놀란 가슴은 새로운 슬픔에 터집니다
      그러나 이별을 쓸데없는 눈물의 원천을 만들고 마는 것은 스스로 사랑을 깨치는 것인 줄 아는 까닭에
      걷잡을 수 없는 슬픔의 힘을 옮겨서 새 희망의 정수박이에 들어부었습니다
      우리는 만날 때에 떠날 것을 염려하는 것과 같이 떠날 때에 다시 만날 것을 믿습니다
      아아 님은 갔지마는 나는 님을 보내지 아니하였습니다
      제 곡조를 못 이기는 사랑의 노래는 님의 침묵을 휩싸고 돕니다
    `),
    azalea: parseMultiline(`
      나 보기가 역겨워 가실 때에는
      말없이 고이 보내 드리우리다
      영변에 약산 진달래꽃
      아름 따다 가실 길에 뿌리우리다
      가시는 걸음 걸음 놓인 그 꽃을
      사뿐히 즈려밟고 가시옵소서
      나 보기가 역겨워 가실 때에는
      죽어도 아니 눈물 흘리우리다
    `),
    nostalgia: parseMultiline(`
      넓은 벌 동쪽 끝으로 옛이야기 지줄대는 실개천이 휘돌아 나가고
      얼룩백이 황소가 해설피 금빛 게으른 울음을 우는 곳
      그곳이 차마 꿈엔들 잊힐 리야
      질화로에 재가 식어지면 뷔인 밭에 밤바람 소리 말을 달리고
      엷은 졸음에 겨운 늙으신 아버지가 짚베개를 돋아 고이시는 곳
      그곳이 차마 꿈엔들 잊힐 리야
      흙에서 자란 내 마음 파아란 하늘빛이 그리워
      함부로 쏜 화살을 찾으려 풀섶 이슬에 함초롬 휘적시던 곳
      그곳이 차마 꿈엔들 잊힐 리야
      전설 바다에 춤추는 밤물결 같은 검은 귀밑머리 날리는 어린 누이와
      아무렇지도 않고 예쁠 것도 없는 사철 발 벗은 아내가
      따가운 햇살을 등에 지고 이삭 줍던 곳
      그곳이 차마 꿈엔들 잊힐 리야
      하늘에는 성근 별 알 수도 없는 모래성으로 발을 옮기고
      서리 까마귀 우지짖고 지나가는 초라한 지붕
      흐릿한 불빛에 돌아앉아 도란도란거리는 곳
      그곳이 차마 꿈엔들 잊힐 리야
    `),
    wings: parseMultiline(`
      박제가 되어버린 천재를 아시오 나는 유쾌하오
      이런 때 연애까지가 유쾌하오
      육신이 흐느적흐느적하도록 피로했을 때만 정신이 은화처럼 맑소
      니코틴이 내 횟배 앓는 뱃속으로 스며들면
      머릿속에 으레 백지가 한 장 펼쳐지오
      그 위에다 나는 위트와 패러독스를 바둑 포석처럼 늘어놓소
      가증할 상식의 병이오
      나는 또 여인과 생활을 설계하오
      연애기법에마저 서먹서먹하게 입술을 대어보는
      극도로 세련된 예절을 닦아놓소
      오직 내 기억의 도서관에서 발췌된 문맥만을 사랑하오
      날개야 다시 돋아라
      날자 날자 한 번만 더 날자꾸나
      한 번만 더 날아보자꾸나
    `)
  }
};

/* =====================================================================
   4. 상태 관리
   ===================================================================== */
const MODE_ORDER = ["key", "word", "short", "long"];
let currentMode = "key";
let currentSubPos = "base";
let currentLongKey = "stars";
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

const KEYBOARD_STORAGE_KEY = "typing_practice_keyboard_visible";
let isKeyboardVisible = localStorage.getItem(KEYBOARD_STORAGE_KEY) !== "false";

let isSubmittingSentence = false;
let isComposingLocked = false;

let countdownTimer = null;
let isCountingDown = false;
let isTransitioning = false;
let isModeSwitching = false;
let lastSelectedCard = null;

/* =====================================================================
   5. DOM 요소
   ===================================================================== */
const loadingScreen = document.getElementById("loading-screen");
const lobbyScreen = document.getElementById("lobby-screen");
const typingContainer = document.getElementById("typing-container");
const homeLogo = document.getElementById("home-logo");
const lobbyBackBtn = document.getElementById("lobby-back-btn");
const modalLobbyBtn = document.getElementById("modal-lobby-btn");

const modeCards = document.querySelectorAll(".mode-card");
const modeBtns = document.querySelectorAll(".mode-btn");

const practiceBody = document.getElementById("practice-body");
const dashboard = document.getElementById("dashboard");

const subMenuBar = document.getElementById("sub-menu-bar");
const subBtns = document.querySelectorAll(".sub-btn");
const songSelectBar = document.getElementById("song-select-bar");
const songSelect = document.getElementById("song-select");

const countdownOverlay = document.getElementById("countdown-overlay");
const countdownNumber = document.getElementById("countdown-number");
const countdownSub = document.getElementById("countdown-sub");

const slotM1 = document.getElementById("slot-m1");
const slotM2 = document.getElementById("slot-m2");
const slotS1 = document.getElementById("slot-s1");
const slotS2 = document.getElementById("slot-s2");

const cpmDisplay = document.getElementById("cpm-display");
const accuracyDisplay = document.getElementById("accuracy-display");
const progressPercent = document.getElementById("progress-percent");
const progressBar = document.getElementById("progress-bar");

const practiceBoard = document.getElementById("practice-board");

// 1. 수평 컨베이어 뷰
const horizontalView = document.getElementById("horizontal-view");
const hPrevItem = document.getElementById("h-prev-item");
const hSlotCurrent = document.getElementById("h-slot-current");
const hTargetDisplay = document.getElementById("h-target-display");
const hUserDisplay = document.getElementById("h-user-display");
const hQueueList = document.getElementById("h-queue-list");

// 2. 수직 3단 피드 뷰
const verticalView = document.getElementById("vertical-view");
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
   6. 시간 제어 및 듀얼 롤링 넘버
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

  currentEl.animate([
    { transform: "translateY(0%)" },
    { transform: "translateY(-100%)" }
  ], {
    duration: 320,
    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    fill: "forwards"
  });

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
   7. 정확도 실시간 계산 모듈
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
   8. 3초 카운트다운 제어
   ===================================================================== */
function triggerCountdown(onFinish) {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  isCountingDown = true;
  typingInput.disabled = true;

  countdownOverlay.classList.remove("hidden");
  countdownOverlay.style.opacity = "1";

  let count = 3;
  countdownNumber.textContent = count;
  countdownSub.textContent = "잠시 후 연습이 시작됩니다";

  countdownNumber.classList.remove("pop");
  void countdownNumber.offsetWidth;
  countdownNumber.classList.add("pop");

  countdownTimer = setInterval(() => {
    count--;

    if (count > 0) {
      countdownNumber.textContent = count;
      countdownNumber.classList.remove("pop");
      void countdownNumber.offsetWidth;
      countdownNumber.classList.add("pop");
    } else if (count === 0) {
      countdownNumber.textContent = "시작!";
      countdownNumber.classList.remove("pop");
      void countdownNumber.offsetWidth;
      countdownNumber.classList.add("pop");
    } else {
      clearInterval(countdownTimer);
      countdownTimer = null;

      countdownOverlay.style.opacity = "0";
      setTimeout(() => {
        countdownOverlay.classList.add("hidden");
        isCountingDown = false;
        typingInput.disabled = false;
        ensureInputFocus();
        startTimer();
        updateTargetKeyHighlight();
        if (onFinish) onFinish();
      }, 200);
    }
  }, 900);
}

/* =====================================================================
   9. 정밀 좌표 기반 iOS 모핑 트랜지션
   ===================================================================== */
function animateAppOpen(card) {
  if (isTransitioning) return;
  isTransitioning = true;
  document.body.classList.add("animating");

  lastSelectedCard = card;
  const mode = card.dataset.mode;

  currentMode = mode;
  modeBtns.forEach((b) => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });

  card.classList.remove("card-rebound");
  card.style.transform = "none";
  card.style.transition = "none";
  void card.offsetWidth;
  const cardRect = card.getBoundingClientRect();
  card.style.transition = "";

  lobbyScreen.classList.add("hidden");
  typingContainer.classList.remove("hidden");
  typingContainer.style.visibility = "hidden";
  typingContainer.style.transform = "none";
  const containerRect = typingContainer.getBoundingClientRect();
  typingContainer.classList.add("hidden");
  typingContainer.style.visibility = "";
  lobbyScreen.classList.remove("hidden");

  const proxy = document.createElement("div");
  proxy.style.cssText = `
    position: fixed;
    top: ${cardRect.top}px;
    left: ${cardRect.left}px;
    width: ${cardRect.width}px;
    height: ${cardRect.height}px;
    background: #ffffff;
    border-radius: 14px;
    border: 1.8px solid #2563eb;
    box-shadow: 0 10px 24px rgba(37, 99, 235, 0.15);
    z-index: 9999;
    pointer-events: none;
    box-sizing: border-box;
    will-change: top, left, width, height, border-radius, opacity;
  `;
  document.body.appendChild(proxy);

  const IOS_SPRING = "cubic-bezier(0.16, 1, 0.3, 1)";
  const DURATION = 320;

  lobbyScreen.animate([
    { opacity: 1, transform: "scale(1)" },
    { opacity: 0, transform: "scale(0.97)" }
  ], {
    duration: DURATION,
    easing: IOS_SPRING,
    fill: "forwards"
  });

  const proxyAnim = proxy.animate([
    {
      top: `${cardRect.top}px`,
      left: `${cardRect.left}px`,
      width: `${cardRect.width}px`,
      height: `${cardRect.height}px`,
      borderRadius: "14px",
      borderColor: "#2563eb"
    },
    {
      top: `${containerRect.top}px`,
      left: `${containerRect.left}px`,
      width: `${containerRect.width}px`,
      height: `${containerRect.height}px`,
      borderRadius: "18px",
      borderColor: "#e2e8f0"
    }
  ], {
    duration: DURATION,
    easing: IOS_SPRING,
    fill: "forwards"
  });

  proxyAnim.onfinish = () => {
    proxy.remove();
    lobbyScreen.classList.add("hidden");
    lobbyScreen.style.opacity = "";
    lobbyScreen.style.transform = "";

    typingContainer.classList.remove("hidden");
    typingContainer.animate([
      { opacity: 0, transform: "scale(0.985)" },
      { opacity: 1, transform: "scale(1)" }
    ], {
      duration: 160,
      easing: "ease-out",
      fill: "forwards"
    }).onfinish = () => {
      document.body.classList.remove("animating");
      isTransitioning = false;
    };

    initPractice();
  };
}

function animateAppClose() {
  if (isTransitioning) return;
  isTransitioning = true;
  document.body.classList.add("animating");

  stopTimer();
  if (countdownTimer) clearInterval(countdownTimer);
  typingInput.disabled = true;
  resultModal.classList.add("hidden");

  const targetCard = document.querySelector(`.mode-card[data-mode="${currentMode}"]`) ||
    lastSelectedCard ||
    modeCards[0];

  const containerRect = typingContainer.getBoundingClientRect();

  typingContainer.classList.add("hidden");
  lobbyScreen.classList.remove("hidden");
  lobbyScreen.style.opacity = "0";
  lobbyScreen.style.transform = "none";

  targetCard.classList.remove("card-rebound");
  targetCard.style.transform = "none";
  targetCard.style.transition = "none";
  void targetCard.offsetWidth;
  const cardRect = targetCard.getBoundingClientRect();
  targetCard.style.transition = "";

  const proxy = document.createElement("div");
  proxy.style.cssText = `
    position: fixed;
    top: ${containerRect.top}px;
    left: ${containerRect.left}px;
    width: ${containerRect.width}px;
    height: ${containerRect.height}px;
    background: #ffffff;
    border-radius: 18px;
    border: 1.5px solid #cbd5e1;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
    z-index: 9999;
    pointer-events: none;
    box-sizing: border-box;
    will-change: top, left, width, height, border-radius, opacity;
  `;
  document.body.appendChild(proxy);

  const IOS_SPRING = "cubic-bezier(0.16, 1, 0.3, 1)";
  const DURATION = 290;

  lobbyScreen.animate([
    { opacity: 0, transform: "scale(0.97)" },
    { opacity: 1, transform: "scale(1)" }
  ], {
    duration: DURATION,
    easing: IOS_SPRING,
    fill: "forwards"
  });

  const proxyAnim = proxy.animate([
    {
      top: `${containerRect.top}px`,
      left: `${containerRect.left}px`,
      width: `${containerRect.width}px`,
      height: `${containerRect.height}px`,
      borderRadius: "18px",
      borderColor: "#cbd5e1"
    },
    {
      top: `${cardRect.top}px`,
      left: `${cardRect.left}px`,
      width: `${cardRect.width}px`,
      height: `${cardRect.height}px`,
      borderRadius: "14px",
      borderColor: "#2563eb"
    }
  ], {
    duration: DURATION,
    easing: IOS_SPRING,
    fill: "forwards"
  });

  proxyAnim.onfinish = () => {
    proxy.remove();
    lobbyScreen.style.opacity = "";
    lobbyScreen.style.transform = "";
    document.body.classList.remove("animating");
    isTransitioning = false;

    targetCard.classList.remove("card-rebound");
    void targetCard.offsetWidth;
    targetCard.classList.add("card-rebound");

    setTimeout(() => {
      targetCard.classList.remove("card-rebound");
    }, 450);
  };
}

function initPractice() {
  resetTimer();

  // 1. 모드별 뷰 토글
  if (currentMode === "key" || currentMode === "word") {
    horizontalView.classList.remove("hidden");
    verticalView.classList.add("hidden");
    hPrevItem.textContent = "";
    hPrevItem.style.visibility = "hidden";
  } else {
    horizontalView.classList.add("hidden");
    verticalView.classList.remove("hidden");
  }

  // 2. 자리연습 시 현재 타수 숨김 및 2열 대시보드 전환
  if (currentMode === "key") {
    if (dashboard) dashboard.classList.add("hide-cpm");
  } else {
    if (dashboard) dashboard.classList.remove("hide-cpm");
  }

  // 3. 데이터 세트 구성
  if (currentMode === "key") {
    subMenuBar.style.display = "flex";
    songSelectBar.style.display = "none";
    const pool = PRACTICE_DATA.key[currentSubPos] || PRACTICE_DATA.key["base"];
    activeList = Array.from({ length: 30 }, () => pool[Math.floor(Math.random() * pool.length)]);
  } else if (currentMode === "word") {
    subMenuBar.style.display = "none";
    songSelectBar.style.display = "none";
    const filteredWords = PRACTICE_DATA.word.filter(w => w.length >= 2 && w.length <= 4);
    activeList = shuffle([...filteredWords]).slice(0, 40);
  } else if (currentMode === "short") {
    subMenuBar.style.display = "none";
    songSelectBar.style.display = "none";
    activeList = shuffle([...PRACTICE_DATA.short])
      .slice(0, 7)
      .map(sentence => sentence.endsWith('.') ? sentence : `${sentence}.`);
  } else if (currentMode === "long") {
    subMenuBar.style.display = "none";
    songSelectBar.style.display = "flex";
    songSelect.value = currentLongKey;
    activeList = [...PRACTICE_DATA.long[currentLongKey]];
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
  resultModal.classList.add("hidden");

  clearAllActiveKeys();
  renderBoard();
  updateStats();
  updateTargetKeyHighlight();

  // 4. 자리연습은 3초 카운트다운 없이 즉시 시작
  if (currentMode === "key") {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    countdownOverlay.classList.add("hidden");
    isCountingDown = false;
    typingInput.disabled = false;
    ensureInputFocus();
    startTimer();
    updateTargetKeyHighlight();
  } else {
    triggerCountdown();
  }
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

  if (currentMode === "key" || currentMode === "word") {
    // 1. 좌측 레일: 직전 완료 단어 표시
    if (currentIndex > 0) {
      hPrevItem.textContent = activeList[currentIndex - 1];
      hPrevItem.style.visibility = "visible";
    } else {
      hPrevItem.textContent = "";
      hPrevItem.style.visibility = "hidden";
    }

    // 2. 중앙 슬롯: 단어 및 입력 내용
    hTargetDisplay.innerHTML = "";
    for (let i = 0; i < target.length; i++) {
      const span = document.createElement("span");
      span.textContent = target[i];
      span.className = i < currentInput.length ? "target-char-done" : "target-char-pending";
      hTargetDisplay.appendChild(span);
    }

    hUserDisplay.innerHTML = "";
    for (let i = 0; i < currentInput.length; i++) {
      const span = document.createElement("span");
      span.textContent = currentInput[i];
      span.className = (i < target.length && currentInput[i] === target[i])
        ? "user-char-correct"
        : "user-char-wrong";
      hUserDisplay.appendChild(span);
    }

    const cursor = document.createElement("span");
    cursor.className = "blinking-cursor";
    cursor.textContent = "|";
    hUserDisplay.appendChild(cursor);

    // 3. 우측 레일: 대기열 큐 렌더링
    hQueueList.innerHTML = "";
    const upcoming = activeList.slice(currentIndex + 1, currentIndex + 6);
    upcoming.forEach((item) => {
      const div = document.createElement("div");
      div.className = "h-queue-item";
      div.textContent = item;
      hQueueList.appendChild(div);
    });

  } else {
    // 4. 수직 3단 피드 뷰 렌더링
    targetDisplay.innerHTML = "";
    for (let i = 0; i < target.length; i++) {
      const span = document.createElement("span");
      span.textContent = target[i];
      span.className = i < currentInput.length ? "target-char-done" : "target-char-pending";
      targetDisplay.appendChild(span);
    }

    userDisplay.innerHTML = "";
    for (let i = 0; i < currentInput.length; i++) {
      const span = document.createElement("span");
      span.textContent = currentInput[i];
      span.className = (i < target.length && currentInput[i] === target[i])
        ? "user-char-correct"
        : "user-char-wrong";
      userDisplay.appendChild(span);
    }

    const cursor = document.createElement("span");
    cursor.className = "blinking-cursor";
    cursor.textContent = "|";
    userDisplay.appendChild(cursor);

    if (currentIndex + 1 < activeList.length) {
      nextDisplay.textContent = activeList[currentIndex + 1];
      slotNext.style.display = "block";
    } else {
      nextDisplay.textContent = "";
      slotNext.style.display = "none";
    }

    if (currentIndex + 2 < activeList.length) {
      afterDisplay.textContent = activeList[currentIndex + 2];
      slotAfter.style.display = "block";
    } else {
      afterDisplay.textContent = "";
      slotAfter.style.display = "none";
    }
  }

  updateTargetKeyHighlight();
}

function handleNext() {
  isSubmittingSentence = true;
  isComposingLocked = true;

  const targetText = activeList[currentIndex] || "";
  let currentInput = typingInput.value || "";

  if (currentMode === "key") {
    currentInput = targetText;
  }

  currentSentenceStrokes = getValidStrokeCount(targetText, currentInput);

  if (sentenceStartTime) {
    const sentenceDuration = (Date.now() - sentenceStartTime) / 1000;
    totalCompletedTime += sentenceDuration;
    totalCompletedStrokes += currentSentenceStrokes;

    const effectiveDuration = Math.max(sentenceDuration, 0.4);
    lastFinishedCPM = Math.round((currentSentenceStrokes / effectiveDuration) * 60);
    if (currentMode !== "key") {
      cpmDisplay.textContent = lastFinishedCPM;
    }
  }

  const maxLen = Math.max(targetText.length, currentInput.length);
  for (let i = 0; i < maxLen; i++) {
    pastAttemptedChars++;
    if (i < targetText.length && i < currentInput.length && targetText[i] === currentInput[i]) {
      pastCorrectChars++;
    }
  }

  const isHorizontal = (currentMode === "key" || currentMode === "word");

  if (!isHorizontal) {
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
  }

  currentIndex++;
  sentenceStartTime = null;
  currentSentenceStrokes = 0;
  typingInput.value = "";

  if (isHorizontal) {
    hUserDisplay.innerHTML = '<span class="blinking-cursor">|</span>';
  } else {
    userDisplay.innerHTML = '<span class="blinking-cursor">|</span>';
  }

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

  renderBoard();
  updateStats();

  if (isHorizontal) {
    // 박스 틀은 고정하고 내부 글자(hTargetDisplay)와 양옆 레일만 우->좌 슬라이드
    hTargetDisplay.classList.remove("h-slide-left");
    void hTargetDisplay.offsetWidth;
    hTargetDisplay.classList.add("h-slide-left");

    hPrevItem.classList.remove("h-slide-left");
    void hPrevItem.offsetWidth;
    hPrevItem.classList.add("h-slide-left");

    hQueueList.classList.remove("h-slide-left");
    void hQueueList.offsetWidth;
    hQueueList.classList.add("h-slide-left");
  } else {
    // 수직 피드 3단 상승 애니메이션
    const dist1 = slotNext.style.display !== "none" ? (slotNext.offsetTop - slotCurrent.offsetTop) : 48;
    const dist2 = slotAfter.style.display !== "none" ? (slotAfter.offsetTop - slotNext.offsetTop) : 28;

    slotCurrent.animate([
      { transform: `translateY(${dist1}px) scale(0.8)`, transformOrigin: "left top", opacity: 0.7 },
      { transform: "translateY(0px) scale(1)", transformOrigin: "left top", opacity: 1 }
    ], {
      duration: 260,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)"
    });

    if (slotNext.style.display !== "none") {
      slotNext.animate([
        { transform: `translateY(${dist2}px) scale(0.8)`, transformOrigin: "left top", opacity: 0.4 },
        { transform: "translateY(0px) scale(1)", transformOrigin: "left top", opacity: 0.7 }
      ], {
        duration: 260,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)"
      });
    }

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
}

function finishPractice() {
  stopTimer();
  typingInput.disabled = true;

  if (currentMode === "key" || currentMode === "word") {
    hTargetDisplay.textContent = "연습 완료!";
    hUserDisplay.innerHTML = "";
    hQueueList.innerHTML = "";
    hPrevItem.textContent = "";
  } else {
    targetDisplay.textContent = "연습 완료!";
    userDisplay.innerHTML = "";
    nextDisplay.textContent = "";
    afterDisplay.textContent = "";
  }

  const acc = pastAttemptedChars > 0 ? Math.round((pastCorrectChars / pastAttemptedChars) * 100) : 100;
  const totalDuration = Math.max(totalCompletedTime, 1);
  const avgCpm = Math.round((totalCompletedStrokes / totalDuration) * 60);

  finalCpm.textContent = avgCpm;
  finalAcc.textContent = acc;
  finalTime.textContent = formatTime(elapsedSeconds);
  resultModal.classList.remove("hidden");
  clearAllActiveKeys();
  updateTargetKeyHighlight();
}

function triggerInputError() {
  practiceBoard.classList.remove("input-error");
  void practiceBoard.offsetWidth;
  practiceBoard.classList.add("input-error");
}

/* =====================================================================
   10. 자동 포커스 유지 & 입력 제어
   ===================================================================== */
function ensureInputFocus() {
  if (!typingInput.disabled && !isCountingDown && resultModal.classList.contains("hidden") && !typingContainer.classList.contains("hidden")) {
    typingInput.focus();
  }
}

document.addEventListener("click", (e) => {
  if (e.target.closest("button") || e.target.closest("select") || e.target.closest(".modal-content") || !lobbyScreen.classList.contains("hidden")) return;
  ensureInputFocus();
});

window.addEventListener("keydown", (e) => {
  if (isCountingDown || !resultModal.classList.contains("hidden") || !lobbyScreen.classList.contains("hidden")) return;
  if (e.target !== typingInput && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
    ensureInputFocus();
  }
});

typingInput.addEventListener("compositionend", () => {
  if (isComposingLocked) {
    typingInput.value = "";
    if (currentMode === "key" || currentMode === "word") {
      hUserDisplay.innerHTML = '<span class="blinking-cursor">|</span>';
    } else {
      userDisplay.innerHTML = '<span class="blinking-cursor">|</span>';
    }
  }
  updateTargetKeyHighlight();
});

typingInput.addEventListener("input", () => {
  if (isComposingLocked || isCountingDown) {
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

  currentSentenceStrokes = getValidStrokeCount(targetText, currentInput);

  // 자리연습 판정: 오타 시 진행 차단
  if (currentMode === "key") {
    if (currentInput.length >= 1) {
      const inputChar = currentInput[currentInput.length - 1];

      if (inputChar === targetText) {
        handleNext();
        return;
      } else {
        pastAttemptedChars++;
        triggerInputError();
        typingInput.value = "";
        hUserDisplay.innerHTML = `<span class="user-char-wrong">${inputChar}</span><span class="blinking-cursor">|</span>`;
        updateStats();
        updateTargetKeyHighlight();
        return;
      }
    }
  }

  if (currentInput.length > targetText.length) {
    handleNext();
    return;
  }

  renderBoard();
  updateStats();
  updateTargetKeyHighlight();
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

  const isSubmitKey = (e.key === "Enter" || e.keyCode === 13) || (e.key === " " && currentMode === "word");

  if (isSubmitKey) {
    e.preventDefault();

    if (isSubmittingSentence || isCountingDown) return;

    if (currentMode !== "key") {
      const targetText = activeList[currentIndex] || "";
      const currentInput = typingInput.value || "";

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
   11. 가상 키보드 제어 및 상태 동기화 (localStorage 연동)
   ===================================================================== */
function clearAllActiveKeys() {
  document.querySelectorAll(".key.key-active").forEach((el) => {
    el.classList.remove("key-active");
  });
}

function updateKeyboardVisibilityUI() {
  if (isKeyboardVisible) {
    keyboardWrapper.classList.remove("collapsed");
    toggleKeyboardBtn.textContent = "⌨️ 키보드 숨기기";
    toggleKeyboardBtn.classList.remove("off");
    updateTargetKeyHighlight();
  } else {
    keyboardWrapper.classList.add("collapsed");
    toggleKeyboardBtn.textContent = "⌨️ 키보드 켜기";
    toggleKeyboardBtn.classList.add("off");
    clearAllActiveKeys();
    document.querySelectorAll(".key.key-target").forEach((el) => el.classList.remove("key-target"));
  }
}

window.addEventListener("keydown", (e) => {
  if (!isKeyboardVisible || !lobbyScreen.classList.contains("hidden")) return;
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
  localStorage.setItem(KEYBOARD_STORAGE_KEY, isKeyboardVisible);
  updateKeyboardVisibilityUI();
  ensureInputFocus();
});

/* =====================================================================
   12. 실시간 타수 계산 (50ms 주기, 자리연습 모드는 계산 배제)
   ===================================================================== */
setInterval(() => {
  if (currentMode === "key") return;

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
   13. 메뉴 전환 및 하단 전체(#practice-body) 좌우 스와이프 트랜지션
   ===================================================================== */
function switchModeWithSlide(newMode) {
  if (isModeSwitching || newMode === currentMode) return;
  isModeSwitching = true;

  const prevIdx = MODE_ORDER.indexOf(currentMode);
  const nextIdx = MODE_ORDER.indexOf(newMode);
  const isForward = nextIdx > prevIdx;

  const outClass = isForward ? "slide-out-to-left" : "slide-out-to-right";
  const inClass = isForward ? "slide-in-from-right" : "slide-in-from-left";

  modeBtns.forEach((b) => b.classList.toggle("active", b.dataset.mode === newMode));
  currentMode = newMode;

  practiceBody.classList.remove(
    "slide-out-to-left",
    "slide-in-from-right",
    "slide-out-to-right",
    "slide-in-from-left"
  );
  practiceBody.classList.add(outClass);

  setTimeout(() => {
    initPractice();
    practiceBody.classList.remove(outClass);
    practiceBody.classList.add(inClass);

    setTimeout(() => {
      practiceBody.classList.remove(inClass);
      isModeSwitching = false;
    }, 240);
  }, 180);
}

modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    animateAppOpen(card);
  });
});

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchModeWithSlide(btn.dataset.mode);
  });
});

homeLogo.addEventListener("click", animateAppClose);
lobbyBackBtn.addEventListener("click", animateAppClose);
modalLobbyBtn.addEventListener("click", animateAppClose);

subBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    subBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentSubPos = btn.dataset.pos;
    initPractice();
  });
});

songSelect.addEventListener("change", (e) => {
  currentLongKey = e.target.value;
  initPractice();
});

restartBtn.addEventListener("click", initPractice);

/* =====================================================================
   14. 로딩 화면 해제 및 초기화
   ===================================================================== */
window.addEventListener("DOMContentLoaded", () => {
  updateKeyboardVisibilityUI();

  setTimeout(() => {
    loadingScreen.classList.add("fade-out");
    lobbyScreen.classList.add("fade-in");
  }, 700);
});
