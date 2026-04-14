import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadString } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZAR77YE6tv7_QzqOE-21Syn9MRO7l2jk",
  authDomain: "hsmocap-d907e.firebaseapp.com",
  projectId: "hsmocap-d907e",
  storageBucket: "hsmocap-d907e.firebasestorage.app",
  messagingSenderId: "657235758107",
  appId: "1:657235758107:web:bd56d8edc801a011b17cbe",
  measurementId: "G-V0LTZ2MSBN",
};

const TEST_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnSUs8AAAAASUVORK5CYII=";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

async function main() {
  const authResult = await signInAnonymously(auth);
  const uid = authResult.user.uid;
  const timestamp = Date.now();

  const fileRef = ref(storage, `posts/${uid}/verify-${timestamp}.png`);
  await uploadString(fileRef, TEST_PNG_DATA_URL, "data_url");
  const downloadUrl = await getDownloadURL(fileRef);

  const postRef = await addDoc(collection(db, "posts"), {
    authorId: uid,
    authorSnapshot: {
      nickname: "image-upload-check",
      avatarUrl: "",
      level: 1,
    },
    categoryId: "free",
    categoryName: "자유",
    title: `이미지 업로드 확인 ${timestamp}`,
    content: "Storage 업로드와 Firestore 저장 검증용 게시글입니다.",
    imageUrls: [downloadUrl],
    isPublic: true,
    isHot: false,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    bookmarkCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  console.log(JSON.stringify({
    uid,
    storagePath: fileRef.fullPath,
    downloadUrl,
    postId: postRef.id,
    postPath: `posts/${postRef.id}`,
  }, null, 2));

  await signOut(auth);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
