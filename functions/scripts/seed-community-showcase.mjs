import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectId = "hsmocap-d907e";
const databasePath = `projects/${projectId}/databases/(default)`;
const firebaseToolsPathCandidates = [
  resolve(process.env.HOME ?? "", ".config/configstore/firebase-tools.json"),
  resolve(process.env.USERPROFILE ?? "", ".config/configstore/firebase-tools.json"),
  resolve("/mnt/c/Users/wns54/.config/configstore/firebase-tools.json"),
];

const categories = [
  {
    id: "study-tip",
    name: "학습팁",
    description: "암기법, 복습 루틴, 앱 활용법을 공유하는 공간",
  },
  {
    id: "word-compare",
    name: "단어비교",
    description: "비슷한 뜻의 단어를 예문과 함께 비교하는 공간",
  },
  {
    id: "sentence-practice",
    name: "문장학습",
    description: "문장 빈칸, 예문, 실제 사용 맥락을 다루는 공간",
  },
  {
    id: "exam-prep",
    name: "시험준비",
    description: "TOEIC, 내신, 수능, 회화 시험 준비 전략을 나누는 공간",
  },
  {
    id: "resources",
    name: "자료공유",
    description: "단어 묶음, 추천 리스트, 복습 세트를 공유하는 공간",
  },
  {
    id: "question",
    name: "질문",
    description: "단어 뜻, 예문 해석, 학습 루틴을 질문하는 공간",
  },
  {
    id: "review",
    name: "후기",
    description: "실제 학습 경험과 앱 사용 후기를 공유하는 공간",
  },
];

const posts = [
  {
    id: "showcase-study-tip-spaced-review",
    categoryId: "study-tip",
    categoryName: "학습팁",
    authorName: "단어코치",
    title: "오답 단어는 1일, 3일, 7일 간격으로 다시 보면 오래 갑니다",
    summary: "오답 단어를 짧은 간격으로 다시 노출하는 복습 루틴",
    body:
      "단어를 한 번 틀렸다고 바로 오래 외워지는 것은 아닙니다. 저는 오답으로 저장된 단어를 오늘, 3일 뒤, 7일 뒤에 다시 보는 방식으로 정리했습니다.\n\n첫날에는 뜻을 빠르게 확인하고, 3일 뒤에는 예문을 읽고, 7일 뒤에는 문장 퀴즈로 확인하면 기억이 훨씬 안정적으로 남았습니다.",
    tags: ["오답노트", "반복학습", "복습루틴"],
    level: "beginner",
    contentType: "tip",
    difficulty: "초급",
    estimatedMinutes: 3,
    relatedWordIds: ["attitude", "consider", "benefit"],
    featured: true,
    likeCount: 42,
    viewCount: 318,
    daysAgo: 1,
    comments: [
      {
        id: "comment-01",
        authorName: "매일20개",
        content: "복습 주기가 구체적이라 바로 따라 하기 좋네요. 오답 단어에 먼저 적용해보겠습니다.",
      },
      {
        id: "comment-02",
        authorName: "문장러버",
        content: "7일 차에 문장 퀴즈로 확인하는 방식이 특히 좋은 것 같아요.",
      },
    ],
  },
  {
    id: "showcase-word-compare-achieve-accomplish-complete",
    categoryId: "word-compare",
    categoryName: "단어비교",
    authorName: "이해완료",
    title: "achieve, accomplish, complete는 이렇게 구분하면 쉽습니다",
    summary: "성취와 완료를 나타내는 동사의 뉘앙스 차이",
    body:
      "achieve는 목표나 성과를 얻는 느낌이 강하고, accomplish는 계획한 일을 해냈다는 느낌이 있습니다. complete는 어떤 작업이나 과정을 끝냈다는 뜻에 더 가깝습니다.\n\n예를 들어 'achieve a goal', 'accomplish a mission', 'complete the form'처럼 같이 쓰이는 명사를 함께 외우면 헷갈림이 줄어듭니다.",
    tags: ["동사", "유의어", "예문"],
    level: "intermediate",
    contentType: "word-comparison",
    difficulty: "중급",
    estimatedMinutes: 4,
    relatedWordIds: ["achieve", "accomplish", "complete"],
    featured: true,
    likeCount: 57,
    viewCount: 441,
    daysAgo: 2,
    comments: [
      {
        id: "comment-01",
        authorName: "토익집중",
        content: "collocation으로 묶어서 보니까 차이가 훨씬 선명해지네요.",
      },
      {
        id: "comment-02",
        authorName: "단어메이트",
        content: "complete the form 예문은 시험 지문에서도 자주 보이는 표현이라 유용합니다.",
      },
    ],
  },
  {
    id: "showcase-sentence-practice-context",
    categoryId: "sentence-practice",
    categoryName: "문장학습",
    authorName: "문장러버",
    title: "단어 뜻만 외우기보다 문장 빈칸으로 확인하면 실수가 줄어요",
    summary: "문장 빈칸 퀴즈를 이용한 맥락 기억법",
    body:
      "benefit을 '이익'이라고만 외우면 실제 문장에서 바로 떠올리기 어렵습니다. 'Exercise has many health benefits.'처럼 문장 전체를 같이 보면 단어가 쓰이는 위치와 의미가 함께 기억됩니다.\n\n즐겨찾기한 단어는 문장 학습으로 한 번 더 확인하면 단순 암기에서 실제 사용으로 넘어가기 좋습니다.",
    tags: ["문장퀴즈", "예문", "맥락학습"],
    level: "beginner",
    contentType: "practice",
    difficulty: "초급",
    estimatedMinutes: 3,
    relatedWordIds: ["benefit", "exercise", "health"],
    featured: true,
    likeCount: 49,
    viewCount: 390,
    daysAgo: 3,
    comments: [
      {
        id: "comment-01",
        authorName: "학습메이트",
        content: "저도 문장 안에서 보면 뜻이 더 빨리 떠오릅니다.",
      },
      {
        id: "comment-02",
        authorName: "오답정리러",
        content: "이미지 힌트와 같이 쓰면 기억 단서가 더 많아지는 느낌입니다.",
      },
    ],
  },
  {
    id: "showcase-exam-prep-toeic-priority",
    categoryId: "exam-prep",
    categoryName: "시험준비",
    authorName: "토익집중",
    title: "TOEIC 직전에는 빈출 동사와 명사 조합부터 다시 보세요",
    summary: "시험 직전 복습 우선순위를 잡는 방법",
    body:
      "시험 전날에는 새로운 단어를 많이 넣기보다 이미 본 단어 중 자주 나오는 조합을 확인하는 것이 효율적입니다.\n\n예를 들어 submit an application, attend a seminar, extend a deadline처럼 동사와 명사를 묶어서 보면 Part 5와 Part 7에서 읽는 속도가 빨라집니다.",
    tags: ["TOEIC", "빈출표현", "시험전략"],
    level: "intermediate",
    contentType: "exam-guide",
    difficulty: "중급",
    estimatedMinutes: 5,
    relatedWordIds: ["submit", "attend", "extend"],
    featured: false,
    likeCount: 36,
    viewCount: 276,
    daysAgo: 4,
    comments: [
      {
        id: "comment-01",
        authorName: "파트5연습",
        content: "단어 하나보다 묶음 표현으로 보니까 문제 풀이가 훨씬 빠릅니다.",
      },
    ],
  },
  {
    id: "showcase-resources-confusing-adjectives",
    categoryId: "resources",
    categoryName: "자료공유",
    authorName: "자료정리러",
    title: "감정 형용사 12개는 원인과 감정으로 나눠서 외우면 편합니다",
    summary: "bored/boring류 형용사를 묶어 외우는 자료",
    body:
      "bored와 boring처럼 -ed, -ing가 붙은 형용사는 기준을 잡으면 훨씬 쉽습니다. -ed는 사람이 느끼는 감정, -ing는 그 감정을 일으키는 원인에 가깝습니다.\n\ninterested/interesting, excited/exciting, confused/confusing을 한 묶음으로 저장해두고 예문을 비교해보세요.",
    tags: ["형용사", "자료공유", "헷갈리는단어"],
    level: "beginner",
    contentType: "resource",
    difficulty: "초급",
    estimatedMinutes: 4,
    relatedWordIds: ["bored", "boring", "interested", "interesting"],
    featured: false,
    likeCount: 31,
    viewCount: 254,
    daysAgo: 5,
    comments: [
      {
        id: "comment-01",
        authorName: "초급탈출",
        content: "-ed와 -ing 기준이 딱 잡혀서 좋네요. 즐겨찾기에 넣어두겠습니다.",
      },
    ],
  },
  {
    id: "showcase-question-advanced-routine",
    categoryId: "question",
    categoryName: "질문",
    authorName: "중급탈출",
    title: "중급에서 고급 단어로 넘어갈 때 어떤 루틴이 좋을까요?",
    summary: "고급 단어 전환기에 적합한 학습 루틴 질문",
    body:
      "초급 단어는 빠르게 넘어가는데, 고급 단어는 뜻이 비슷한 단어가 많아서 자주 헷갈립니다.\n\n즐겨찾기와 복습하기를 같이 쓰는 추천 루틴이 있을까요? 특히 유의어가 많은 단어를 오래 기억하는 방법이 궁금합니다.",
    tags: ["고급단어", "루틴", "질문"],
    level: "intermediate",
    contentType: "question",
    difficulty: "중급",
    estimatedMinutes: 2,
    relatedWordIds: ["subtle", "elaborate", "precise"],
    featured: false,
    likeCount: 18,
    viewCount: 167,
    daysAgo: 6,
    comments: [
      {
        id: "comment-01",
        authorName: "단어코치",
        content: "틀린 단어는 복습에 남기고, 계속 헷갈리는 단어만 즐겨찾기로 따로 모으는 방식이 좋아요.",
      },
      {
        id: "comment-02",
        authorName: "문장러버",
        content: "고급 단어는 예문을 소리 내서 읽는 것도 꽤 도움이 됐습니다.",
      },
    ],
  },
  {
    id: "showcase-review-daily-goal",
    categoryId: "review",
    categoryName: "후기",
    authorName: "매일20개",
    title: "하루 20개 목표를 작게 잡으니 꾸준히 하게 됩니다",
    summary: "작은 목표와 진행률 확인으로 만든 학습 습관",
    body:
      "처음부터 많은 단어를 외우려고 하면 금방 지치는데, 하루 목표를 20개로 잡고 홈에서 진행률을 보니까 부담이 줄었습니다.\n\n최근 학습 단어와 과거 기록이 같이 보이는 것도 동기부여가 됐습니다. 목표를 작게 잡는 편이 오히려 오래 가네요.",
    tags: ["학습후기", "목표관리", "습관"],
    level: "beginner",
    contentType: "review",
    difficulty: "초급",
    estimatedMinutes: 2,
    relatedWordIds: ["daily", "goal", "progress"],
    featured: false,
    likeCount: 27,
    viewCount: 205,
    daysAgo: 7,
    comments: [
      {
        id: "comment-01",
        authorName: "모바일캡스톤",
        content: "대시보드가 실제 학습 데이터와 연결되면 포트폴리오 설명이 더 쉬워질 것 같습니다.",
      },
    ],
  },
  {
    id: "showcase-word-compare-effect-affect",
    categoryId: "word-compare",
    categoryName: "단어비교",
    authorName: "문법정리러",
    title: "affect와 effect는 품사부터 나눠서 보면 덜 헷갈립니다",
    summary: "시험에서 자주 틀리는 affect/effect 구분법",
    body:
      "affect는 주로 동사로 '영향을 미치다'라는 뜻이고, effect는 주로 명사로 '영향, 결과'라는 뜻입니다.\n\nThe weather affects sales. / The effect was immediate.처럼 문장 안 역할을 먼저 보면 뜻보다 빠르게 구분할 수 있습니다.",
    tags: ["품사", "시험빈출", "유의어"],
    level: "intermediate",
    contentType: "word-comparison",
    difficulty: "중급",
    estimatedMinutes: 3,
    relatedWordIds: ["affect", "effect"],
    featured: false,
    likeCount: 44,
    viewCount: 332,
    daysAgo: 8,
    comments: [
      {
        id: "comment-01",
        authorName: "내신준비",
        content: "품사부터 보는 방식이 내신 문법 문제에도 잘 맞을 것 같아요.",
      },
    ],
  },
  {
    id: "showcase-study-tip-favorites",
    categoryId: "study-tip",
    categoryName: "학습팁",
    authorName: "즐겨찾기매니저",
    title: "즐겨찾기는 모든 단어가 아니라 다시 볼 단어만 넣는 게 좋습니다",
    summary: "즐겨찾기 목록을 복습 도구로 쓰는 기준",
    body:
      "즐겨찾기에 단어를 너무 많이 넣으면 다시 보기 어려워집니다. 저는 아래 세 가지 기준 중 하나에 해당할 때만 저장합니다.\n\n1. 뜻을 봐도 바로 떠오르지 않는 단어\n2. 비슷한 단어와 자주 헷갈리는 단어\n3. 실제 문장에서 써보고 싶은 단어\n\n이 기준을 쓰면 즐겨찾기가 단순 보관함이 아니라 개인 복습 리스트가 됩니다.",
    tags: ["즐겨찾기", "복습전략", "개인화"],
    level: "beginner",
    contentType: "tip",
    difficulty: "초급",
    estimatedMinutes: 3,
    relatedWordIds: ["review", "favorite", "routine"],
    featured: true,
    likeCount: 53,
    viewCount: 421,
    daysAgo: 9,
    comments: [
      {
        id: "comment-01",
        authorName: "복습우선",
        content: "저장 기준을 정하니까 즐겨찾기가 훨씬 깔끔해질 것 같아요.",
      },
    ],
  },
  {
    id: "showcase-exam-prep-speaking",
    categoryId: "exam-prep",
    categoryName: "시험준비",
    authorName: "회화준비",
    title: "말하기 시험 준비는 쉬운 단어를 빠르게 꺼내는 연습이 먼저입니다",
    summary: "회화 시험에서 단어 인출 속도를 높이는 방법",
    body:
      "말하기 시험에서는 어려운 단어를 많이 아는 것보다 쉬운 단어를 빠르게 꺼내는 능력이 더 중요할 때가 많습니다.\n\nimportant, useful, convenient 같은 기본 단어를 예문으로 여러 번 말해보면 답변이 끊기는 시간이 줄어듭니다. 즐겨찾기 단어를 문장 학습으로 돌려보는 방식도 효과적입니다.",
    tags: ["회화", "말하기", "시험전략"],
    level: "beginner",
    contentType: "exam-guide",
    difficulty: "초급",
    estimatedMinutes: 4,
    relatedWordIds: ["important", "useful", "convenient"],
    featured: false,
    likeCount: 29,
    viewCount: 214,
    daysAgo: 10,
    comments: [
      {
        id: "comment-01",
        authorName: "스피킹연습",
        content: "어려운 단어보다 바로 나오는 단어가 중요하다는 말에 공감합니다.",
      },
    ],
  },
];

function readFirebaseToolsConfig() {
  for (const candidate of firebaseToolsPathCandidates) {
    try {
      const data = JSON.parse(readFileSync(candidate, "utf8"));
      if (data.tokens?.refresh_token) {
        return data;
      }
    } catch {
      continue;
    }
  }

  throw new Error("Firebase CLI login cache with refresh token was not found.");
}

async function getAccessToken() {
  const config = readFirebaseToolsConfig();
  const body = new URLSearchParams({
    client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
    client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
    refresh_token: config.tokens.refresh_token,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed with status ${response.status}`);
  }

  const data = await response.json();
  if (typeof data.access_token !== "string" || !data.access_token) {
    throw new Error("Token refresh response did not contain an access token.");
  }

  return data.access_token;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }

  switch (typeof value) {
    case "string":
      return { stringValue: value };
    case "boolean":
      return { booleanValue: value };
    case "number":
      return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
    case "object":
      return {
        mapValue: {
          fields: Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [key, toFirestoreValue(nestedValue)]),
          ),
        },
      };
    default:
      return { stringValue: String(value) };
  }
}

function toFields(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value instanceof Date ? { timestampValue: value.toISOString() } : toFirestoreValue(value),
    ]),
  );
}

async function firestoreRequest(path, accessToken, init = {}) {
  const response = await fetch(`https://firestore.googleapis.com/v1/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firestore request failed (${response.status}): ${text}`);
  }

  return response;
}

async function listDocuments(collectionPath, accessToken) {
  const documents = [];
  let pageToken = "";

  while (true) {
    const search = new URLSearchParams({ pageSize: "300" });
    if (pageToken) search.set("pageToken", pageToken);

    const response = await firestoreRequest(
      `${databasePath}/documents/${collectionPath}?${search.toString()}`,
      accessToken,
      { method: "GET" },
    );
    const data = await response.json();
    documents.push(...(Array.isArray(data.documents) ? data.documents : []));

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return documents;
}

async function commitWrites(writes, accessToken) {
  if (writes.length === 0) return;

  for (let index = 0; index < writes.length; index += 400) {
    await firestoreRequest(`${databasePath}/documents:commit`, accessToken, {
      method: "POST",
      body: JSON.stringify({ writes: writes.slice(index, index + 400) }),
    });
  }
}

async function deleteExistingCommunityPosts(accessToken) {
  const existingPosts = await listDocuments("posts", accessToken);
  const deletes = [];

  for (const post of existingPosts) {
    const postId = post.name.split("/").pop();
    const [comments, likes] = await Promise.all([
      listDocuments(`posts/${encodeURIComponent(postId)}/comments`, accessToken),
      listDocuments(`posts/${encodeURIComponent(postId)}/likes`, accessToken),
    ]);

    deletes.push(...comments.map((comment) => ({ delete: comment.name })));
    deletes.push(...likes.map((like) => ({ delete: like.name })));
    deletes.push({ delete: post.name });
  }

  await commitWrites(deletes, accessToken);
  return existingPosts.length;
}

async function upsertCategories(accessToken) {
  await commitWrites(
    categories.map((category, index) => ({
      update: {
        name: `${databasePath}/documents/boardCategories/${category.id}`,
        fields: toFields({
          ...category,
          sortOrder: index + 1,
        }),
      },
    })),
    accessToken,
  );
}

async function insertShowcasePosts(accessToken) {
  const now = Date.now();
  const writes = [];

  for (const post of posts) {
    const createdAt = new Date(now - post.daysAgo * 24 * 60 * 60 * 1000);
    writes.push({
      update: {
        name: `${databasePath}/documents/posts/${post.id}`,
        fields: toFields({
          categoryId: post.categoryId,
          categoryName: post.categoryName,
          userId: "showcase-system",
          authorSnapshot: { name: post.authorName },
          title: post.title,
          summary: post.summary,
          body: post.body,
          tags: post.tags,
          level: post.level,
          contentType: post.contentType,
          difficulty: post.difficulty,
          estimatedMinutes: post.estimatedMinutes,
          relatedWordIds: post.relatedWordIds,
          featured: post.featured,
          likeCount: post.likeCount,
          commentCount: post.comments.length,
          viewCount: post.viewCount,
          imageUrls: [],
          createdAt,
          updatedAt: createdAt,
        }),
      },
    });

    for (let index = 0; index < post.comments.length; index += 1) {
      const comment = post.comments[index];
      const commentCreatedAt = new Date(createdAt.getTime() + (index + 1) * 60 * 60 * 1000);
      writes.push({
        update: {
          name: `${databasePath}/documents/posts/${post.id}/comments/${comment.id}`,
          fields: toFields({
            userId: `showcase-commenter-${index + 1}`,
            authorSnapshot: { name: comment.authorName },
            content: comment.content,
            createdAt: commentCreatedAt,
            updatedAt: commentCreatedAt,
          }),
        },
      });
    }
  }

  await commitWrites(writes, accessToken);
  return posts.length;
}

async function main() {
  const accessToken = await getAccessToken();
  const deletedPosts = await deleteExistingCommunityPosts(accessToken);
  await upsertCategories(accessToken);
  const insertedPosts = await insertShowcasePosts(accessToken);

  console.log(
    JSON.stringify(
      {
        projectId,
        deletedPosts,
        insertedPosts,
        categories: categories.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
