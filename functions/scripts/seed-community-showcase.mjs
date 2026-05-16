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
  { id: "free", name: "자유", description: "영어 단어 학습 경험과 생각을 자유롭게 나누는 공간" },
  { id: "question", name: "질문", description: "단어 암기, 문장 퀴즈, 복습 루틴을 질문하는 공간" },
  { id: "review", name: "후기", description: "학습 루틴을 실천한 후기를 공유하는 공간" },
];

const posts = [
  {
    id: "showcase-review-wrong-words",
    categoryId: "review",
    categoryName: "후기",
    authorName: "모바일캡스톤",
    title: "오답 복습을 3일 해보니 헷갈리던 단어가 줄었어요",
    body:
      "처음에는 attitude, consider 같은 단어를 문장 안에서 자주 틀렸습니다. 그런데 오답으로 저장된 단어만 다시 풀어보니 복습 시간이 짧아지고 집중도도 올라갔어요.\n\n특히 틀린 단어가 복습 목록에 바로 쌓이는 흐름이 좋아서, 매일 확인하는 습관을 만들기 쉬웠습니다.",
    likeCount: 8,
    viewCount: 42,
    daysAgo: 1,
    comments: [
      {
        id: "comment-01",
        authorName: "한재민",
        content: "오답 단어만 모아서 보는 흐름은 시연 때도 설명하기 좋을 것 같아요.",
      },
      {
        id: "comment-02",
        authorName: "장원준",
        content: "복습 예정일이 같이 보이니까 언제 다시 풀어야 하는지 이해하기 쉽네요.",
      },
    ],
  },
  {
    id: "showcase-sentence-quiz-tip",
    categoryId: "free",
    categoryName: "자유",
    authorName: "영단어러버",
    title: "문장 빈칸 퀴즈가 단어만 외우는 것보다 오래 기억납니다",
    body:
      "단어 뜻을 그냥 보는 것보다 문장 안에서 빈칸을 채우는 방식이 더 오래 기억에 남았습니다.\n\n예를 들어 benefit을 외울 때 'Exercise has many health benefits.'처럼 문장 전체를 같이 보니까 실제 사용 맥락까지 떠올리기 좋았습니다.",
    likeCount: 12,
    viewCount: 67,
    daysAgo: 2,
    comments: [
      {
        id: "comment-01",
        authorName: "학습메이트",
        content: "저도 예문이 같이 나오니까 단어 뜻이 더 빨리 떠올랐어요.",
      },
      {
        id: "comment-02",
        authorName: "모바일캡스톤",
        content: "이미지 힌트까지 같이 쓰면 기억 단서가 더 많아지는 느낌입니다.",
      },
    ],
  },
  {
    id: "showcase-routine-question",
    categoryId: "question",
    categoryName: "질문",
    authorName: "중급탈출",
    title: "중급에서 고급 단어로 넘어갈 때 어떤 루틴이 좋을까요?",
    body:
      "초급 단어는 빠르게 넘어가는데, 고급 단어는 뜻이 비슷한 단어가 많아서 자주 헷갈립니다.\n\n즐겨찾기와 복습하기를 같이 쓰는 추천 루틴이 있을까요?",
    likeCount: 6,
    viewCount: 35,
    daysAgo: 3,
    comments: [
      {
        id: "comment-01",
        authorName: "단어코치",
        content: "먼저 틀린 단어를 복습에 남기고, 계속 헷갈리는 단어만 즐겨찾기로 따로 모으는 방식이 좋아요.",
      },
      {
        id: "comment-02",
        authorName: "영단어러버",
        content: "고급 단어는 예문을 같이 소리 내서 읽는 것도 꽤 도움이 됐습니다.",
      },
    ],
  },
  {
    id: "showcase-confusing-verbs",
    categoryId: "free",
    categoryName: "자유",
    authorName: "이해완료",
    title: "accomplish, achieve, complete 차이가 아직 헷갈리네요",
    body:
      "세 단어 모두 '완료하다'나 '성취하다' 느낌이 있는데 문장마다 자연스러운 쓰임이 조금씩 다른 것 같습니다.\n\n이런 단어들은 하나씩 외우기보다 예문으로 비교하면서 보는 게 더 좋은 것 같아요.",
    likeCount: 9,
    viewCount: 51,
    daysAgo: 4,
    comments: [
      {
        id: "comment-01",
        authorName: "학습메이트",
        content: "비슷한 단어끼리 묶어서 커뮤니티에 질문하면 예문 답변 받기 좋겠어요.",
      },
    ],
  },
  {
    id: "showcase-daily-goal",
    categoryId: "review",
    categoryName: "후기",
    authorName: "매일20개",
    title: "하루 20개 목표를 작게 잡으니 꾸준히 하게 됩니다",
    body:
      "처음부터 많은 단어를 외우려고 하면 금방 지치는데, 하루 목표를 20개로 잡고 홈에서 진행률을 보니까 부담이 줄었습니다.\n\n최근 학습 단어와 과거 기록이 같이 보이는 것도 동기부여가 됐습니다.",
    likeCount: 15,
    viewCount: 88,
    daysAgo: 5,
    comments: [
      {
        id: "comment-01",
        authorName: "모바일캡스톤",
        content: "대시보드가 실제 학습 데이터와 연결되면 포트폴리오 설명이 더 쉬워질 것 같습니다.",
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
    categories.map((category) => ({
      update: {
        name: `${databasePath}/documents/boardCategories/${category.id}`,
        fields: toFields(category),
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
          body: post.body,
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
