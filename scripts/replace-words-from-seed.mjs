import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import seedWords from "../src/app/data/seedWords.json" with { type: "json" };

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

async function deleteExistingWords() {
  const snapshot = await getDocs(collection(db, "words"));
  if (snapshot.empty) {
    return 0;
  }

  let deleted = 0;
  let batch = writeBatch(db);
  let operationCount = 0;

  for (const wordDoc of snapshot.docs) {
    batch.delete(wordDoc.ref);
    deleted += 1;
    operationCount += 1;

    if (operationCount === 450) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return deleted;
}

async function insertSeedWords() {
  let inserted = 0;
  let batch = writeBatch(db);
  let operationCount = 0;

  for (const item of seedWords) {
    const ref = doc(db, "words", item.word);
    batch.set(ref, {
      ...item,
      mastery: 0,
      isFavorite: false,
      source: "hermitdave/FrequencyWords (OpenSubtitles 2018, CC BY-SA 4.0)",
      createdAt: serverTimestamp(),
    });
    inserted += 1;
    operationCount += 1;

    if (operationCount === 450) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return inserted;
}

async function main() {
  const deleted = await deleteExistingWords();
  const inserted = await insertSeedWords();
  const snapshot = await getDocs(collection(db, "words"));

  console.log(JSON.stringify({
    deleted,
    inserted,
    finalCount: snapshot.size,
    firstWords: snapshot.docs.slice(0, 5).map((item) => item.id),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
