import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import { doc, getFirestore, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZAR77YE6tv7_QzqOE-21Syn9MRO7l2jk",
  authDomain: "hsmocap-d907e.firebaseapp.com",
  projectId: "hsmocap-d907e",
  storageBucket: "hsmocap-d907e.firebasestorage.app",
  messagingSenderId: "657235758107",
  appId: "1:657235758107:web:bd56d8edc801a011b17cbe",
  measurementId: "G-V0LTZ2MSBN",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const dummyUsers = [
  { uid: "tzXSTKNDo0cnulmQ1tuLxNK3HA52", nickname: "mina-1", level: 2 },
  { uid: "zKsZbgyIpdai0xFecEyObWIHM4A2", nickname: "jisu-2", level: 4 },
  { uid: "JXVfpgw7MDfzbWD7AhUUt1Nw3Ev2", nickname: "yuna-3", level: 5 },
  { uid: "TztaGZsOp8UzKoLqeZXwuT9OjKQ2", nickname: "seojun-4", level: 1 },
  { uid: "VHbUoMb45cgcyk1nxS2KBNijt5k1", nickname: "jiho-5", level: 3 },
  { uid: "KKAA5Aqp7Hh1WPZJTIFzCmLukgt2", nickname: "arin-6", level: 6 },
  { uid: "4KYpXGCLmBc4KKboDLCGLEmRUCt1", nickname: "haeun-7", level: 7 },
  { uid: "Yql4JVLZdHMFkI3eBTm5SKBqUb03", nickname: "doyun-8", level: 4 },
  { uid: "elZcyj4BxtWHCgGfhJ9NUHmdTkj1", nickname: "sua-9", level: 2 },
  { uid: "QvtCuBJyZwWPJ2a5IfMevuLtmmj2", nickname: "taemin-10", level: 8 },
];

const dummyPosts = [
  {
    id: "dummy-post-01",
    author: dummyUsers[0],
    categoryId: "study-tip",
    categoryName: "학습팁",
    title: "단어를 예문으로 외우는 방식이 가장 오래 갑니다",
    content: "단어만 반복해서 보기보다 예문과 같이 묶어서 보면 기억 유지가 훨씬 좋았습니다. 저는 복습할 때 예문 한 줄을 같이 읽는 편입니다.",
    isHot: true,
  },
  {
    id: "dummy-post-02",
    author: dummyUsers[1],
    categoryId: "exam-prep",
    categoryName: "시험대비",
    title: "시험 직전에는 새로운 단어보다 오답 복습이 더 효율적이었습니다",
    content: "마지막 이틀은 새로운 단어를 늘리지 않고 틀렸던 단어와 즐겨찾기만 다시 봤습니다. 점수 방어에는 이쪽이 더 안정적이었습니다.",
    isHot: true,
  },
  {
    id: "dummy-post-03",
    author: dummyUsers[2],
    categoryId: "question",
    categoryName: "질문",
    title: "중급에서 고급으로 넘어갈 때 추천하는 학습 루틴 있나요",
    content: "단어 수는 늘고 있는데 실제 문장에 적용하는 속도가 느립니다. 문장 퀴즈와 플래시카드 비율을 어떻게 가져가면 좋을지 궁금합니다.",
    isHot: false,
  },
  {
    id: "dummy-post-04",
    author: dummyUsers[4],
    categoryId: "review",
    categoryName: "후기",
    title: "3주 동안 매일 20개씩 학습해 본 후기",
    content: "초반에는 암기량이 많아서 벅찼는데, 복습 일정이 잡히기 시작하니 체계가 생겼습니다. 특히 즐겨찾기와 복습 목록을 같이 쓰는 게 좋았습니다.",
    isHot: false,
  },
  {
    id: "dummy-post-05",
    author: dummyUsers[6],
    categoryId: "free",
    categoryName: "자유",
    title: "오늘은 accomplish 같은 동사들이 특히 헷갈리네요",
    content: "뜻은 알겠는데 문장 안에서 쓰려면 갑자기 막힙니다. 비슷한 고급 동사 묶어서 학습하는 팁 있으면 공유 부탁드립니다.",
    isHot: true,
  },
];

const dummyComments = [
  { author: dummyUsers[3], content: "예문을 같이 보는 방식 공감합니다. 저도 단어만 보면 금방 잊어버리더라고요." },
  { author: dummyUsers[5], content: "오답 위주 복습은 정말 효과가 큽니다. 마지막에는 범위를 줄이는 게 낫더군요." },
  { author: dummyUsers[7], content: "중급 이후에는 문장 퀴즈 비중을 조금 더 높이는 쪽을 추천합니다." },
  { author: dummyUsers[8], content: "저는 즐겨찾기 단어만 따로 문장으로 다시 적어보는 방식도 괜찮았습니다." },
  { author: dummyUsers[9], content: "accomplish 같은 단어는 비슷한 동사와 차이를 같이 보면 오래 남습니다." },
];

function buildPost(post, index) {
  return {
    authorId: post.author.uid,
    authorSnapshot: {
      nickname: post.author.nickname,
      avatarUrl: "",
      level: post.author.level,
    },
    categoryId: post.categoryId,
    categoryName: post.categoryName,
    title: post.title,
    content: post.content,
    imageUrls: [],
    isPublic: true,
    isHot: post.isHot,
    viewCount: 80 + index * 37,
    likeCount: 3 + index,
    commentCount: 2,
    bookmarkCount: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildComment(comment) {
  return {
    authorId: comment.author.uid,
    authorSnapshot: {
      nickname: comment.author.nickname,
      avatarUrl: "",
      level: comment.author.level,
    },
    content: comment.content,
    parentCommentId: null,
    likeCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function main() {
  const authResult = await signInAnonymously(auth);
  const currentUid = authResult.user.uid;

  const batch = writeBatch(db);

  for (const [index, post] of dummyPosts.entries()) {
    const postRef = doc(db, "posts", post.id);
    batch.set(postRef, buildPost(post, index));

    const commentA = dummyComments[index % dummyComments.length];
    const commentB = dummyComments[(index + 1) % dummyComments.length];
    batch.set(doc(db, "posts", post.id, "comments", "comment-1"), buildComment(commentA));
    batch.set(doc(db, "posts", post.id, "comments", "comment-2"), buildComment(commentB));

    batch.set(doc(db, "posts", post.id, "likes", currentUid), {
      userId: currentUid,
      createdAt: serverTimestamp(),
    });

    batch.set(doc(db, "posts", post.id, "bookmarks", currentUid), {
      userId: currentUid,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
  await signOut(auth);

  console.log(JSON.stringify({
    projectId: firebaseConfig.projectId,
    postCount: dummyPosts.length,
    actingUid: currentUid,
    postIds: dummyPosts.map((post) => post.id),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
