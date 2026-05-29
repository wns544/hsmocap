export type GradeWordAnswerRequest = {
  english: string;
  korean: string;
  targetWord: string;
  wordMeaning: string;
  acceptableAnswers: string[];
  correctAnswer: string;
  userAnswer: string;
};

export type GradeWordAnswerResponse = {
  isCorrect: boolean;
  verdict: "correct" | "correct_but_unnatural" | "close" | "incorrect" | "empty";
  message: string;
  hint?: string;
  matchedAnswer?: string;
};

export const SYSTEM_PROMPT = [
  "You are a Korean vocabulary grading assistant.",
  "Grade the user's Korean answer for the highlighted English target word or phrase in context.",
  "Core principle: be strict about the target's sentence meaning, but generous about Korean wording.",
  "Do not grade by exact string match. Do not accept a response merely because it is topically related.",
  "Step 1: Identify the sentence sense. Use the full English sentence, Korean sentence, object, surrounding words, target word or phrase, dictionary/context meaning, canonical answer, and reference acceptable answers.",
  "If the target has multiple senses, choose the sense required by this sentence. Reject Korean answers for a different sense even when they are valid dictionary translations of the English word.",
  "Many English verbs are polysemous. Use the full event frame, especially the subject, object, and prepositional phrase, to determine the sentence sense before comparing the Korean answer.",
  "Do not use the isolated dictionary meaning or the most common meaning when the object or prepositional phrase clearly selects another sense.",
  "For example, move to a new apartment means change residence, move the chair means physically relocate an object, the chair moved means changed position, the movie moved me means emotionally affected, and moved to approve the plan means proposed a motion.",
  "When the sentence sense is change residence, Korean answers such as 이사했다, 이사갔다, 이사 갔다, 옮겨갔다, 거주지를 옮겼다, or 새 아파트로 옮겼다 are correct. Do not treat every move/moved as 이사하다; the sentence context decides.",
  "If the target is a phrasal verb or multi-word expression, grade the whole expression as one semantic unit.",
  "Step 2: Compare the user's Korean answer with that sentence sense. Check whether the core meaning, role, direction, object, and sentence-level effect are preserved.",
  "Step 3: Ignore surface differences when meaning is preserved. Do not penalize Korean particles, spacing, minor typos, verb endings, tense expression, honorifics, casual/polite register, declarative/imperative form, or natural paraphrase.",
  "For Korean answers, tolerate question-form, spoken/written register, politeness, and ending differences such as 반응했다/반응했어/반응했나/반응했나요/반응했습니까 when the lexical meaning is the same.",
  "In vocabulary learning, prioritize whether the learner understood the target's lexical meaning. A small tense or aspect mismatch is usually correct or correct_but_unnatural unless the target itself is a tense, time, completion, or future marker.",
  "For phrasal verbs and multi-word expressions, check semantic components such as direction, removal/completion, gradualness, focus/targeting, encounter/discovery, start/stop, repetition, and emphasis.",
  "For gradual removal or discontinuation meanings such as phase out, answers that preserve gradualness plus removal/discontinuation are correct: 점차/점진적으로/단계적으로/서서히/차차 plus 없애다/줄이다/폐지하다/중단하다/단종시키다/사용을 멈추다/퇴출하다.",
  "For react/respond meanings, accept Korean forms of 반응하다, 대응하다, 응답하다, or 답하다 when they fit the sentence. Do not accept subject words like 관객 or surrounding adverbs like 어떻게 as answers for the target.",
  "Step 4: Reject wrong sense or loose association. Answers should be close or incorrect when they use another sense, translate a surrounding word instead of the target, change the object or direction, change the target's part of speech or sentence role, give a mere topic word, or omit a core meaning element.",
  "Verdict rules:",
  "correct: the target's sentence meaning and role are preserved, and the Korean answer is natural or clearly understandable in the blank. It may differ from the canonical answer.",
  "correct_but_unnatural: the core meaning is right, but the Korean wording is clearly awkward or less natural. The learner still understood the target.",
  "close: part of the target meaning is present, but a core element is missing, the sense is slightly off, or the sentence meaning changes enough that it should not count as correct.",
  "incorrect: different sense, opposite meaning, loose association, surrounding-word translation, the English target itself, or a response that substantially changes the sentence meaning.",
  "empty: the user answer is blank.",
  "Return exactly one verdict token: correct, correct_but_unnatural, close, incorrect, or empty.",
].join(" ");

export const normalize = (value: string) => value.trim().replace(/\s+/g, " ");

export const containsHangul = (value: string) => /[가-힣]/.test(value);

const normalizeAnswerForComparison = (value: string) =>
  normalize(value)
    .replace(/[.,!?'"`~]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

const buildCommonKoreanVerbFormVariants = (value: string) => {
  const normalized = normalizeAnswerForComparison(value);
  const variants = new Set([normalized]);

  const replacements: Array<[RegExp, string]> = [
    [/(했습니까|했나요|했어요|했어|했나|했니|했냐|했다|했습니다|하였다|하였습니다)$/g, "하다"],
    [/(해요|합니다|하십시오|하세요|해라|한다|해)$/g, "하다"],
    [/(되고있습니까|되고있나요|되고있어요|되고있어|되고있다|되는중이다)$/g, "되다"],
    [/(됐다|되었다|됐어|되었어|됐나요|되었나요|됩니다|돼요|돼)$/g, "되다"],
    [/(시키고있습니까|시키고있나요|시키고있어요|시키고있어|시키고있다|시키는중이다)$/g, "시키다"],
    [/(시켰습니까|시켰나요|시켰어요|시켰어|시켰다|시킵니다|시켜요|시켜)$/g, "시키다"],
    [/(하고있습니까|하고있나요|하고있어요|하고있어|하고있다|하는중이다)$/g, "하다"],
    [/(고있습니까|고있나요|고있어요|고있어|고있다|는중이다)$/g, "다"],
    [/(주세요|주십시오|줘요|줘)$/g, "주다"],
  ];

  for (const [pattern, replacement] of replacements) {
    const next = normalized.replace(pattern, replacement);
    if (next !== normalized) {
      variants.add(next);
    }
  }

  return Array.from(variants);
};

const GRADUAL_TOKENS = ["점차", "점진적", "점진적으로", "단계적", "단계적으로", "서서히", "차차"] as const;
const REMOVAL_TOKENS = ["없애", "폐지", "중단", "단종", "제거", "줄이", "퇴출", "사용을멈추"] as const;
const OPPOSITE_REMOVAL_TOKENS = ["도입", "출시", "늘리", "증가", "추가", "시작"] as const;

const includesAny = (value: string, tokens: readonly string[]) =>
  tokens.some((token) => value.includes(token));

const hasGradualRemovalComponents = (value: string) => {
  const normalized = normalizeAnswerForComparison(value);
  return includesAny(normalized, GRADUAL_TOKENS) && includesAny(normalized, REMOVAL_TOKENS);
};

const hasOppositeRemovalMeaning = (value: string) =>
  includesAny(normalizeAnswerForComparison(value), OPPOSITE_REMOVAL_TOKENS);

const hasGradualRemovalFallbackMatch = (
  userAnswer: string,
  candidates: string[],
  wordMeaning: string,
) => {
  const referenceText = [...candidates, wordMeaning].join(" ");
  return (
    hasGradualRemovalComponents(userAnswer) &&
    hasGradualRemovalComponents(referenceText) &&
    !hasOppositeRemovalMeaning(userAnswer)
  );
};

// Legacy safety net for fallback-only grading when the LLM is unavailable.
// Do not expand this list to cover the full vocabulary set; the primary grader
// should use the sentence-aware LLM prompt instead of hard-coded synonym groups.
const fallbackSemanticEquivalenceGroups = [
  ["줄여야한다", "줄이다", "줄여", "줄이고", "감소시켜야한다", "감소해야한다", "감소시키다", "감소시켜", "감소하고"],
  ["장점", "이점", "이로운점", "메리트", "좋은점", "강점"],
  ["감정", "마음", "심경", "기분"],
  ["씻어", "씻어라", "씻으세요", "씻다", "닦아", "닦아라", "깨끗하게해", "깨끗이해"],
  ["나타났다", "나타나", "왔다", "와", "도착했다", "도착해", "출현했다", "모습을드러냈다"],
  ["우연히찾았다", "우연히찾아냈다", "우연히발견했다", "우연히발견하였다", "우연히마주쳤다", "우연히보게됐다", "찾았다", "찾아냈다", "발견했다", "발견하였다"],
  ["그만두었다", "그만뒀다", "그만두다", "사임했다", "사임하였다", "사임하다", "물러났다", "물러나다", "퇴임했다", "퇴임하였다", "퇴임하다", "자리에서물러났다", "직을내려놓았다"],
  ["손에들었다", "손에들고있었다", "손에쥐었다", "들고있었다", "들고있다", "잡았다", "잡고있었다", "잡고있다", "쥐었다", "쥐고있었다", "쥐고있다"],
  ["고르세요", "골라라", "골라", "고르다", "고른다", "선택하세요", "선택해", "선택하다", "선택한다", "택하세요", "택해", "택하다"],
  ["돌려주다", "돌려준다", "돌려줘", "돌려주세요", "돌려주십시오", "되돌려주다", "되돌려줘", "되돌려주세요", "반납하다", "반납한다", "반납해", "반납해주세요", "반납하십시오", "반환하다", "반환한다", "반환해", "반환해주세요"],
  ["예상한다", "예상된다", "전망한다", "전망된다", "기대한다", "본다", "보인다", "내다본다"],
  ["계획하고있다", "계획중이다", "계획중", "계획하고있어", "준비하고있다", "준비하고있어", "준비중이다", "준비중"],
  ["일어났니", "일어났나", "일어났어", "일어났다", "발생했니", "발생했나", "발생했어", "발생했다", "있었니", "있었나", "있었어", "있었다"],
  ["버리지마", "버리지말아라", "버리면안돼", "버리면안된다", "버려서는안돼", "버려서는안된다", "폐기하지마", "폐기하면안돼"],
  ["인수한다", "인수한", "인수하다", "인수해", "맡는다", "맡다", "맡아", "이어받는다", "이어받다", "이어받아", "넘겨받는다", "넘겨받다"],
  ["분명하게해줘요", "분명하게해주시오", "분명하게하다", "분명히하다", "명확하게해줘요", "명확하게해주시오", "명확하게하다", "명확히하다", "확실하게하다", "확실히하다"],
  ["성장했다", "성장하였다", "성장한다", "성장하다", "자랐다", "자라났다", "자라다", "자람", "컸다", "크다"],
  ["예약", "예약한것", "예약한것이", "예약된것", "예약된것이", "예약했다", "예약하였다", "예약되어있다", "예약이있다", "진료예약", "병원예약"],
  ["제약", "제약조건", "제약사항", "제약으로작용한다", "제약이된다", "제약이다", "제한", "제한사항", "제한조건", "한계", "걸림돌"],
  ["마감", "마감기한", "마감일", "기한", "마감시한", "마감날짜", "마지막기한"],
  ["초대했다", "초대하였다", "초대한다", "초대하다", "초대해", "초청했다", "초청하였다", "초청하다", "불렀다", "부르다"],
  ["열어라", "열어요", "여세요", "열어주세요", "열다", "열어", "열고", "개봉해", "개봉하다", "개봉하세요"],
  ["참았다", "참아냈다", "참는다", "참다", "참아", "억눌렀다", "억누르다", "억제했다", "억제하다", "자제했다", "자제하다"],
  ["확인해", "확인해주세요", "확인부탁해", "확인부탁해요", "확인바랍니다", "확인하기바랍니다", "확인하다", "확실히하다"],
  ["듣다", "들어라", "들어요", "들으세요", "듣기바랍니다", "들어주세요", "청취하다", "청취하세요", "귀기울이다"],
  ["나눠줬다", "나누어줬다", "나눠주었다", "나누어주었다", "나눠준다", "나눠주다", "나누어주다", "배포했다", "배포하다", "제공했다", "제공하다", "공짜로나눠줬다", "무료로나눠줬다"],
  ["요청했다", "요청하였다", "요청한다", "요청하다", "요청해", "부탁했다", "부탁하였다", "부탁하다", "신청했다", "신청하다", "요구했다", "요구하다"],
  ["기틀", "틀", "체계", "구조", "프레임워크", "기반", "골격"],
  ["부응했다", "부응하였다", "부응하다", "기대에부응했다", "기대에부응하였다", "기대에맞았다", "기대에맞게부응했다", "기대에미쳤다", "기대를충족했다", "기대를충족하였다"],
  ["저축하고있어", "저축하고있다", "저축하다", "저축해", "돈을모으고있어", "돈을모으고있다", "돈을모으다", "돈을모아", "돈모아", "자금을모으고있어", "자금을모으고있다", "자금을모으다", "자금을모아", "모으고있어", "모으고있다", "모아"],
  ["지원했다", "지원하였다", "지원한다", "지원하다", "지원해", "지원해볼", "지원해보다", "지원할", "신청했다", "신청하였다", "신청한다", "신청하다", "신청해", "신청해볼", "응모했다", "응모하다"],
  ["유지했다", "유지하였다", "유지한다", "유지하다", "유지하기", "지속했다", "지속하였다", "지속한다", "지속하다", "지속하기", "계속하다", "계속하기", "이어가다", "이어가기"],
  ["달려있다", "달려있어", "달렸다", "의존한다", "의존하다", "좌우된다", "좌우되다", "영향을받는다", "영향받는다", "영향을받다", "영향받다"],
  ["걱정마", "걱정하지마", "걱정하지말아라", "걱정하지마세요", "걱정하지않다", "걱정안하다", "걱정하다", "염려하다", "염려하지마"],
  ["치워", "치워라", "치우다", "치운다", "치웠다", "정리해", "정리해라", "정리하다", "정돈해", "정돈하다", "제자리에두다", "제자리에놓다"],
  ["묻다", "물어봐", "물어보다", "물어봐라", "여쭤봐", "여쭤보다", "여쭈어봐", "여쭈어보다", "질문하다", "질문해"],
  ["상기시켜줄래", "상기시켜줘", "상기시키다", "상기시켜", "알려줄래", "알려줘", "알려주다", "기억나게해줘", "기억나게하다", "리마인드해줘"],
] as const;

const buildSemanticVariants = (value: string) => {
  const variants = new Set([value]);

  for (const group of fallbackSemanticEquivalenceGroups) {
    const sources = [...group].sort((left, right) => right.length - left.length);
    for (const source of sources) {
      if (!value.includes(source)) {
        continue;
      }

      for (const replacement of group) {
        variants.add(value.replaceAll(source, replacement));
      }
      break;
    }
  }

  return Array.from(variants);
};

const stripKoreanSuffixes = (value: string) => {
  const suffixes = [
    "할것이다",
    "할예정이다",
    "하려고한다",
    "할거야",
    "할거다",
    "할게",
    "것이다",
    "예정이다",
    "해라",
    "하라",
    "어라",
    "아라",
    "라",
    "습니다",
    "는다",
    "입니다",
    "이에요",
    "예요",
    "이야",
    "야",
    "니다",
    "다",
    "요",
    "죠",
    "네",
    "까",
    "니",
    "냐",
    "은",
    "는",
    "이",
    "가",
    "을",
    "를",
    "에",
    "에서",
    "와",
    "과",
    "도",
    "만",
    "로",
    "으로",
  ];

  let result = normalizeAnswerForComparison(value);
  let changed = true;
  while (changed && result.length > 1) {
    changed = false;
    for (const suffix of suffixes) {
      if (result.endsWith(suffix) && result.length > suffix.length + 1) {
        result = result.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
  }
  return result;
};

const buildComparisonVariants = (value: string) => {
  const normalized = normalizeAnswerForComparison(value);
  const stripped = stripKoreanSuffixes(value);
  return Array.from(
    new Set(
      [normalized, stripped, ...buildCommonKoreanVerbFormVariants(value)]
        .filter(Boolean)
        .flatMap((variant) => buildSemanticVariants(variant)),
    ),
  );
};

export const findAcceptableMatch = (userAnswer: string, acceptableAnswers: string[]) => {
  const userVariants = buildComparisonVariants(userAnswer);
  return acceptableAnswers.find((answer) => {
    const answerVariants = buildComparisonVariants(answer);
    return userVariants.some((userVariant) => answerVariants.includes(userVariant));
  });
};

const extractMeaningAnswerCandidates = (wordMeaning: string) =>
  wordMeaning
    .replace(/[()]/g, ",")
    .split(/[,;/]+/g)
    .map(normalize)
    .filter((answer) => answer.length >= 2 && containsHangul(answer));

export const buildAnswerCandidates = (
  correctAnswer: string,
  acceptableAnswers: string[],
  wordMeaning: string,
) =>
  Array.from(
    new Set(
      [correctAnswer, ...acceptableAnswers, ...extractMeaningAnswerCandidates(wordMeaning)]
        .map(normalize)
        .filter(Boolean),
    ),
  );

export const buildUserPrompt = (request: GradeWordAnswerRequest) =>
  [
    "Grade this answer.",
    `English sentence: ${request.english}`,
    `Korean sentence with blank target meaning: ${request.korean}`,
    `Highlighted English target word or phrase: ${request.targetWord}`,
    `Dictionary/context meaning of the target: ${request.wordMeaning}`,
    `Reference acceptable answers: ${request.acceptableAnswers.join(", ")}`,
    `Canonical answer: ${request.correctAnswer}`,
    `Expanded Korean reference anchors: ${buildAnswerCandidates(request.correctAnswer, request.acceptableAnswers, request.wordMeaning).join(", ")}`,
    `User answer: ${request.userAnswer}`,
    "",
    "Follow this grading process:",
    "1. Identify the target's sentence sense from the full sentence, object, and surrounding context.",
    "2. Compare the user's Korean answer against that sentence sense, not against the English word in isolation.",
    "3. Ignore surface differences if the core meaning, role, direction, and object are preserved.",
    "4. Use close or incorrect when the answer is merely related, uses another sense, translates a surrounding word, changes the object/direction, or omits a core meaning element.",
    "5. Return exactly one verdict token.",
    "",
    "General Korean tolerance rules:",
    "- Use the full event frame, especially object and prepositional phrase, to disambiguate polysemous verbs before grading the Korean answer.",
    "- Do not grade from the isolated English target alone. The same target can require different Korean answers in different sentence frames.",
    "- Treat ending/register/question-form variants as equivalent when lexical meaning is preserved, e.g. 반응했다/반응했어/반응했나/반응했나요/반응했습니까.",
    "- Treat 진행형 or sentence tense differences leniently when the target lexical meaning remains clear, e.g. 없앴다/없애고 있다/없애고 있어.",
    "- For phrasal verbs, preserve the whole expression's semantic components rather than translating each English word separately.",
    "- For gradual removal/discontinuation, 점차/점진적으로/단계적으로/서서히/차차 plus 없애다/줄이다/폐지하다/중단하다/단종시키다/사용을 멈추다/퇴출하다 is correct when the sentence sense supports it.",
    "- For react/respond, 반응하다/대응하다/응답하다/답하다 forms are correct when they fit the sentence; subject words or surrounding adverbs alone are incorrect.",
    "",
    "Verdict boundaries:",
    "- correct: same sentence meaning and role; natural or clearly understandable Korean.",
    "- correct_but_unnatural: same core meaning, but the Korean is clearly awkward or less natural.",
    "- close: partly right, but a core element is missing or the sentence meaning shifts enough that it should not count as correct.",
    "- incorrect: wrong sense, opposite meaning, loose association, surrounding-word translation, English target itself, or substantial meaning change.",
    "- empty: blank answer.",
    "",
    "Calibration examples:",
    "- Sentence: Please return the book by Friday. Target: return. Sentence sense: give the book back / return a borrowed item. correct: 돌려주세요, 반납해주세요, 반환해주세요, 돌려줘. incorrect: 돌아오다, 귀국하다.",
    "- Sentence: I went to school yesterday. Target: went. correct: 갔다, 갔어, 다녀왔다. incorrect: 가다 예정, 보내다.",
    "- Sentence: We need to zero in on the cause. Target: zero in on. correct: 집중하다, 초점을 맞추다, 집중해야 한다. incorrect: 0, 영, 없애다.",
    "- Sentence: The director stepped down. Target: stepped down. correct: 사임했다, 물러났다, 그만두었다. incorrect: 아래로 걸어갔다, 내려섰다.",
    "- Sentence: He held the cup. Target: held. correct: 들었다, 잡았다, 쥐었다. close: 가지고 있었다. incorrect: 개최했다, 유지했다.",
    "- Sentence: She has a beautiful voice. Target: beautiful. correct: 아름다운, 예쁜, 고운. close: 좋은. incorrect: 큰, 시끄러운.",
    "- Sentence: I came across an old photo album. Target: came across. correct: 우연히 발견했다, 우연히 찾았다, 마주쳤다. incorrect: 건너왔다, 화가 났다.",
    "- Sentence: How did the audience react? Target: react. correct: 반응했나, 반응했어, 반응했나요, 어떻게 반응했어. incorrect: 관객, 어떻게.",
    "- Sentence: The company phased out old models. Target: phased out. correct: 점차 없앴다, 점차 없애고 있어, 단계적으로 폐지했다, 점차 단종시켰다, 점차 단종 시키고 있어. incorrect: 도입했다, 출시했다, 구형 모델.",
    "- Sentence: They moved to a new apartment. Target: moved. Sentence sense: changed residence / moved house. correct: 이사했다, 이사갔다, 이사 갔다, 옮겨갔다, 거주지를 옮겼다. close: 이동했다, 움직였다, 새 아파트로 갔다. incorrect: 감동했다, 제안했다, 새 아파트.",
    "- Sentence: The chair moved slightly. Target: moved. Sentence sense: physically changed position. correct: 움직였다, 살짝 움직였다. incorrect: 이사했다, 감동했다.",
    "- Sentence: She moved the box to the corner. Target: moved. Sentence sense: moved or relocated an object. correct: 옮겼다, 이동시켰다. incorrect: 이사했다, 감동시켰다.",
    "- Sentence: The movie moved me. Target: moved. Sentence sense: emotionally affected. correct: 감동시켰다, 마음을 움직였다. incorrect: 이사했다, 이동했다.",
    "- Sentence: He moved to approve the plan. Target: moved. Sentence sense: proposed a motion. correct: 제안했다, 발의했다. incorrect: 이사했다, 움직였다.",
    "",
    "Return only one verdict token from this list:",
    "correct",
    "correct_but_unnatural",
    "close",
    "incorrect",
    "empty",
  ].join("\n");

const calculateSimilarity = (source: string, target: string): number => {
  if (!source && !target) {
    return 1;
  }

  const matrix = Array.from({ length: target.length + 1 }, () => Array(source.length + 1).fill(0));
  for (let index = 0; index <= source.length; index += 1) {
    matrix[0][index] = index;
  }
  for (let index = 0; index <= target.length; index += 1) {
    matrix[index][0] = index;
  }

  for (let row = 1; row <= target.length; row += 1) {
    for (let column = 1; column <= source.length; column += 1) {
      const cost = source[column - 1] === target[row - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row][column - 1] + 1,
        matrix[row - 1][column] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  const distance = matrix[target.length][source.length];
  return 1 - distance / Math.max(source.length, target.length, 1);
};

export const buildFallbackFeedback = (
  userAnswer: string,
  correctAnswer: string,
  targetWord: string,
  wordMeaning: string,
  acceptableAnswers: string[] = [],
): GradeWordAnswerResponse => {
  if (!userAnswer) {
    return {
      isCorrect: false,
      verdict: "empty",
      message: "답을 입력해주세요.",
      hint: `'${targetWord}'는 '${wordMeaning}'라는 뜻입니다.`,
    };
  }

  if (!containsHangul(userAnswer)) {
    return {
      isCorrect: false,
      verdict: "incorrect",
      message: "한국어 뜻을 입력해 주세요.",
      hint: `'${targetWord}'는 '${wordMeaning}'를 의미합니다. 정답은 '${correctAnswer}'입니다.`,
    };
  }

  const candidates = buildAnswerCandidates(correctAnswer, acceptableAnswers, wordMeaning);
  const normalizedUserAnswer = normalizeAnswerForComparison(userAnswer);
  const normalizedExactMatch = candidates.find(
    (candidate) => normalizeAnswerForComparison(candidate) === normalizedUserAnswer,
  );

  if (normalizedExactMatch) {
    return {
      isCorrect: true,
      verdict: "correct",
      message: "정답입니다!",
      matchedAnswer: normalizedExactMatch,
    };
  }

  // This legacy synonym pass is intentionally fallback-only. It is a safety net
  // for known wording variants when the LLM cannot make the contextual judgment.
  const exactMatch = findAcceptableMatch(userAnswer, candidates);
  if (exactMatch) {
    return {
      isCorrect: true,
      verdict: "correct",
      message: "정답입니다!",
      matchedAnswer: exactMatch,
    };
  }

  if (hasGradualRemovalFallbackMatch(userAnswer, candidates, wordMeaning)) {
    return {
      isCorrect: true,
      verdict: "correct",
      message: "정답입니다!",
      matchedAnswer: correctAnswer,
    };
  }

  const similarity = Math.max(
    ...buildComparisonVariants(userAnswer).flatMap((userVariant) =>
      candidates.flatMap((candidate) =>
        buildComparisonVariants(candidate).map((candidateVariant) =>
          calculateSimilarity(userVariant, candidateVariant),
        ),
      ),
    ),
  );

  if (similarity >= 0.88) {
    return {
      isCorrect: true,
      verdict: "correct",
      message: "정답입니다!",
      matchedAnswer: correctAnswer,
    };
  }

  if (similarity >= 0.78) {
    return {
      isCorrect: true,
      verdict: "correct_but_unnatural",
      message: "의미는 맞습니다.",
      hint: `더 자연스러운 표현은 '${correctAnswer}'입니다.`,
      matchedAnswer: correctAnswer,
    };
  }

  return {
    isCorrect: false,
    verdict: "incorrect",
    message: "틀렸습니다. 다시 생각해보세요.",
    hint: `'${targetWord}'는 '${wordMeaning}'를 의미합니다. 정답은 '${correctAnswer}'입니다.`,
  };
};

export const buildFeedbackFromVerdict = (
  verdict: GradeWordAnswerResponse["verdict"],
  targetWord: string,
  wordMeaning: string,
  correctAnswer: string,
): GradeWordAnswerResponse => {
  switch (verdict) {
    case "correct":
      return {
        isCorrect: true,
        verdict,
        message: "정답입니다!",
        matchedAnswer: correctAnswer,
      };
    case "correct_but_unnatural":
      return {
        isCorrect: true,
        verdict,
        message: "의미는 맞습니다.",
        hint: `더 자연스러운 표현은 '${correctAnswer}'입니다.`,
        matchedAnswer: correctAnswer,
      };
    case "close":
      return {
        isCorrect: false,
        verdict,
        message: "거의 맞았어요.",
        hint: `'${targetWord}'는 '${wordMeaning}'라는 뜻입니다. 문장에 더 자연스럽게 맞춰보세요.`,
      };
    case "empty":
      return {
        isCorrect: false,
        verdict,
        message: "답을 입력해주세요.",
        hint: `'${targetWord}'는 '${wordMeaning}'라는 뜻입니다.`,
      };
    default:
      return {
        isCorrect: false,
        verdict: "incorrect",
        message: "틀렸습니다. 다시 생각해보세요.",
        hint: `'${targetWord}'는 '${wordMeaning}'를 의미합니다. 정답은 '${correctAnswer}'입니다.`,
      };
  }
};

export const extractVerdict = (value: string): GradeWordAnswerResponse["verdict"] => {
  const lowered = value.trim().toLowerCase();
  const exactVerdicts: GradeWordAnswerResponse["verdict"][] = [
    "correct",
    "correct_but_unnatural",
    "close",
    "incorrect",
    "empty",
  ];

  if (exactVerdicts.includes(lowered as GradeWordAnswerResponse["verdict"])) {
    return lowered as GradeWordAnswerResponse["verdict"];
  }

  const verdictMatch = lowered.match(/\b(correct_but_unnatural|incorrect|correct|close|empty)\b/);
  return verdictMatch ? (verdictMatch[1] as GradeWordAnswerResponse["verdict"]) : "incorrect";
};

export const normalizeRequest = (data: Partial<GradeWordAnswerRequest>) => {
  const english = typeof data.english === "string" ? normalize(data.english) : "";
  const korean = typeof data.korean === "string" ? normalize(data.korean) : "";
  const targetWord = typeof data.targetWord === "string" ? normalize(data.targetWord) : "";
  const wordMeaning = typeof data.wordMeaning === "string" ? normalize(data.wordMeaning) : "";
  const correctAnswer = typeof data.correctAnswer === "string" ? normalize(data.correctAnswer) : "";
  const userAnswer = typeof data.userAnswer === "string" ? normalize(data.userAnswer) : "";
  const acceptableAnswers = Array.isArray(data.acceptableAnswers)
    ? data.acceptableAnswers
        .filter((answer): answer is string => typeof answer === "string")
        .map(normalize)
        .filter(Boolean)
    : [];

  return {
    english,
    korean,
    targetWord,
    wordMeaning,
    correctAnswer,
    userAnswer,
    acceptableAnswers,
  };
};
