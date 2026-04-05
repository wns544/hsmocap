import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBZAR77YE6tv7_QzqOE-21Syn9MRO7l2jk",
  authDomain: "hsmocap-d907e.firebaseapp.com",
  projectId: "hsmocap-d907e",
  storageBucket: "hsmocap-d907e.firebasestorage.app",
  messagingSenderId: "657235758107",
  appId: "1:657235758107:web:bd56d8edc801a011b17cbe",
  measurementId: "G-V0LTZ2MSBN",
};

const seedWords = [
  { word: "you", meaning: "너, 당신", level: "초급", frequency: 28787591, frequencyRank: 1 },
  { word: "i", meaning: "나", level: "초급", frequency: 27086011, frequencyRank: 2 },
  { word: "the", meaning: "그, 정관사", level: "초급", frequency: 22761659, frequencyRank: 3 },
  { word: "to", meaning: "~로, ~하기 위해", level: "초급", frequency: 17099834, frequencyRank: 4 },
  { word: "a", meaning: "하나의, 어떤", level: "초급", frequency: 14484562, frequencyRank: 5 },
  { word: "it", meaning: "그것", level: "초급", frequency: 13631703, frequencyRank: 6 },
  { word: "and", meaning: "그리고", level: "초급", frequency: 10572938, frequencyRank: 7 },
  { word: "that", meaning: "그것, 저것, ~라는 것", level: "초급", frequency: 10203742, frequencyRank: 8 },
  { word: "of", meaning: "~의", level: "초급", frequency: 8915110, frequencyRank: 9 },
  { word: "is", meaning: "~이다", level: "초급", frequency: 7400675, frequencyRank: 10 },
  { word: "in", meaning: "~안에, ~에서", level: "초급", frequency: 7337058, frequencyRank: 11 },
  { word: "what", meaning: "무엇", level: "초급", frequency: 6900164, frequencyRank: 12 },
  { word: "we", meaning: "우리", level: "초급", frequency: 6755687, frequencyRank: 13 },
  { word: "me", meaning: "나를, 나에게", level: "초급", frequency: 6444985, frequencyRank: 14 },
  { word: "this", meaning: "이것, 이", level: "초급", frequency: 5739788, frequencyRank: 15 },
  { word: "he", meaning: "그는", level: "초급", frequency: 5516364, frequencyRank: 16 },
  { word: "for", meaning: "~을 위해", level: "초급", frequency: 5174060, frequencyRank: 17 },
  { word: "my", meaning: "나의", level: "초급", frequency: 4938948, frequencyRank: 18 },
  { word: "on", meaning: "~위에, ~에", level: "초급", frequency: 4821861, frequencyRank: 19 },
  { word: "have", meaning: "가지다", level: "초급", frequency: 4764010, frequencyRank: 20 },
  { word: "your", meaning: "너의, 당신의", level: "초급", frequency: 4610945, frequencyRank: 21 },
  { word: "do", meaning: "하다", level: "초급", frequency: 4419883, frequencyRank: 22 },
  { word: "was", meaning: "~였다", level: "초급", frequency: 4401531, frequencyRank: 23 },
  { word: "no", meaning: "아니, 없다", level: "초급", frequency: 4374975, frequencyRank: 24 },
  { word: "not", meaning: "아니다, ~않다", level: "초급", frequency: 4262273, frequencyRank: 25 },
  { word: "be", meaning: "~이다, 존재하다", level: "초급", frequency: 4210868, frequencyRank: 26 },
  { word: "are", meaning: "~이다, 있다", level: "초급", frequency: 4203821, frequencyRank: 27 },
  { word: "know", meaning: "알다", level: "초급", frequency: 3892394, frequencyRank: 28 },
  { word: "can", meaning: "~할 수 있다", level: "초급", frequency: 3826118, frequencyRank: 29 },
  { word: "with", meaning: "~와 함께", level: "초급", frequency: 3806977, frequencyRank: 30 },
  { word: "but", meaning: "하지만", level: "초급", frequency: 3631462, frequencyRank: 31 },
  { word: "all", meaning: "모든, 전부", level: "초급", frequency: 3544700, frequencyRank: 32 },
  { word: "so", meaning: "그래서, 매우", level: "초급", frequency: 3434152, frequencyRank: 33 },
  { word: "just", meaning: "단지, 방금", level: "초급", frequency: 3334392, frequencyRank: 34 },
  { word: "there", meaning: "거기, ~가 있다", level: "초급", frequency: 3148528, frequencyRank: 35 },
  { word: "here", meaning: "여기", level: "초급", frequency: 3138591, frequencyRank: 36 },
  { word: "they", meaning: "그들", level: "초급", frequency: 3060204, frequencyRank: 37 },
  { word: "like", meaning: "좋아하다, ~처럼", level: "초급", frequency: 2983027, frequencyRank: 38 },
  { word: "get", meaning: "얻다, 받다", level: "초급", frequency: 2883193, frequencyRank: 39 },
  { word: "she", meaning: "그녀는", level: "초급", frequency: 2778359, frequencyRank: 40 },
  { word: "go", meaning: "가다", level: "중급", frequency: 2738504, frequencyRank: 41 },
  { word: "if", meaning: "만약 ~라면", level: "중급", frequency: 2630800, frequencyRank: 42 },
  { word: "right", meaning: "오른쪽, 맞는", level: "중급", frequency: 2576821, frequencyRank: 43 },
  { word: "out", meaning: "밖으로", level: "중급", frequency: 2510010, frequencyRank: 44 },
  { word: "about", meaning: "~에 대하여", level: "중급", frequency: 2487348, frequencyRank: 45 },
  { word: "up", meaning: "위로", level: "중급", frequency: 2459855, frequencyRank: 46 },
  { word: "at", meaning: "~에서, ~에", level: "중급", frequency: 2431398, frequencyRank: 47 },
  { word: "him", meaning: "그를, 그에게", level: "중급", frequency: 2431059, frequencyRank: 48 },
  { word: "now", meaning: "지금", level: "중급", frequency: 2298830, frequencyRank: 49 },
  { word: "one", meaning: "하나", level: "중급", frequency: 2263956, frequencyRank: 50 },
  { word: "come", meaning: "오다", level: "중급", frequency: 2203919, frequencyRank: 51 },
  { word: "well", meaning: "잘, 좋은", level: "중급", frequency: 2159909, frequencyRank: 52 },
  { word: "her", meaning: "그녀를, 그녀의", level: "중급", frequency: 2154982, frequencyRank: 53 },
  { word: "how", meaning: "어떻게", level: "중급", frequency: 2140365, frequencyRank: 54 },
  { word: "yeah", meaning: "응, 그래", level: "중급", frequency: 2000641, frequencyRank: 55 },
  { word: "will", meaning: "~할 것이다", level: "중급", frequency: 1969807, frequencyRank: 56 },
  { word: "got", meaning: "얻었다, 가지게 되었다", level: "중급", frequency: 1968389, frequencyRank: 57 },
  { word: "want", meaning: "원하다", level: "중급", frequency: 1950845, frequencyRank: 58 },
  { word: "think", meaning: "생각하다", level: "중급", frequency: 1839473, frequencyRank: 59 },
  { word: "as", meaning: "~로서, ~처럼", level: "중급", frequency: 1792220, frequencyRank: 60 },
  { word: "see", meaning: "보다", level: "중급", frequency: 1781493, frequencyRank: 61 },
  { word: "did", meaning: "했다", level: "중급", frequency: 1742764, frequencyRank: 62 },
  { word: "good", meaning: "좋은", level: "중급", frequency: 1741730, frequencyRank: 63 },
  { word: "who", meaning: "누구", level: "중급", frequency: 1734491, frequencyRank: 64 },
  { word: "why", meaning: "왜", level: "중급", frequency: 1722797, frequencyRank: 65 },
  { word: "from", meaning: "~에서, ~로부터", level: "중급", frequency: 1709582, frequencyRank: 66 },
  { word: "let", meaning: "허락하다", level: "중급", frequency: 1705262, frequencyRank: 67 },
  { word: "his", meaning: "그의", level: "중급", frequency: 1666361, frequencyRank: 68 },
  { word: "yes", meaning: "네, 맞아", level: "중급", frequency: 1634050, frequencyRank: 69 },
  { word: "when", meaning: "언제", level: "중급", frequency: 1531731, frequencyRank: 70 },
  { word: "going", meaning: "가고 있는", level: "중급", frequency: 1520767, frequencyRank: 71 },
  { word: "time", meaning: "시간", level: "중급", frequency: 1453708, frequencyRank: 72 },
  { word: "an", meaning: "하나의", level: "중급", frequency: 1449181, frequencyRank: 73 },
  { word: "okay", meaning: "좋아, 괜찮아", level: "중급", frequency: 1428884, frequencyRank: 74 },
  { word: "back", meaning: "뒤로, 돌아와", level: "중급", frequency: 1405024, frequencyRank: 75 },
  { word: "look", meaning: "보다, 바라보다", level: "중급", frequency: 1348467, frequencyRank: 76 },
  { word: "us", meaning: "우리를, 우리에게", level: "중급", frequency: 1346903, frequencyRank: 77 },
  { word: "would", meaning: "~할 것이다, ~하곤 했다", level: "중급", frequency: 1340070, frequencyRank: 78 },
  { word: "them", meaning: "그들을, 그들에게", level: "중급", frequency: 1327509, frequencyRank: 79 },
  { word: "where", meaning: "어디", level: "중급", frequency: 1322226, frequencyRank: 80 },
  { word: "were", meaning: "~였다, 있었다", level: "고급", frequency: 1315964, frequencyRank: 81 },
  { word: "take", meaning: "가지다, 데려가다", level: "고급", frequency: 1312232, frequencyRank: 82 },
  { word: "then", meaning: "그때, 그러면", level: "고급", frequency: 1275502, frequencyRank: 83 },
  { word: "had", meaning: "가졌다, 있었다", level: "고급", frequency: 1274537, frequencyRank: 84 },
  { word: "or", meaning: "또는", level: "고급", frequency: 1267646, frequencyRank: 85 },
  { word: "been", meaning: "~이었다, 가본 적이 있다", level: "고급", frequency: 1265150, frequencyRank: 86 },
  { word: "our", meaning: "우리의", level: "고급", frequency: 1191941, frequencyRank: 87 },
  { word: "gonna", meaning: "~할 거야", level: "고급", frequency: 1188190, frequencyRank: 88 },
  { word: "tell", meaning: "말하다, 알려주다", level: "고급", frequency: 1176290, frequencyRank: 89 },
  { word: "really", meaning: "정말로", level: "고급", frequency: 1174710, frequencyRank: 90 },
  { word: "man", meaning: "남자, 사람", level: "고급", frequency: 1173588, frequencyRank: 91 },
  { word: "some", meaning: "몇몇의, 어떤", level: "고급", frequency: 1166914, frequencyRank: 92 },
  { word: "say", meaning: "말하다", level: "고급", frequency: 1153915, frequencyRank: 93 },
  { word: "hey", meaning: "이봐, 야", level: "고급", frequency: 1149292, frequencyRank: 94 },
  { word: "could", meaning: "~할 수 있었다", level: "고급", frequency: 1111837, frequencyRank: 95 },
  { word: "by", meaning: "~에 의해, 곁에", level: "고급", frequency: 1090424, frequencyRank: 96 },
  { word: "need", meaning: "필요하다", level: "고급", frequency: 1040131, frequencyRank: 97 },
  { word: "something", meaning: "무언가", level: "고급", frequency: 1038638, frequencyRank: 98 },
  { word: "has", meaning: "가지고 있다", level: "고급", frequency: 1035310, frequencyRank: 99 },
  { word: "too", meaning: "너무, 또한", level: "고급", frequency: 1022558, frequencyRank: 100 },
];

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
