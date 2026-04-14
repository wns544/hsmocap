import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import { doc, getFirestore, serverTimestamp, writeBatch } from "firebase/firestore";

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
const auth = getAuth(app);
const db = getFirestore(app);

const categories = [
  { id: "study-tip", name: "학습팁", sortOrder: 1 },
  { id: "exam-prep", name: "시험대비", sortOrder: 2 },
  { id: "vocabulary", name: "단어", sortOrder: 3 },
  { id: "review", name: "후기", sortOrder: 4 },
  { id: "question", name: "질문", sortOrder: 5 },
  { id: "free", name: "자유", sortOrder: 6 },
];

async function main() {
  await signInAnonymously(auth);

  const batch = writeBatch(db);

  for (const category of categories) {
    batch.set(doc(db, "communityCategories", category.id), {
      slug: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  await signOut(auth);

  console.log(JSON.stringify({
    projectId: firebaseConfig.projectId,
    insertedCount: categories.length,
    categoryIds: categories.map((category) => category.id),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
