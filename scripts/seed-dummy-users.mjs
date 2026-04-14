import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import {
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const dummyUsers = [
  { nickname: "mina", preferredStudyLevel: "beginner", totalXp: 120, currentLevel: 2, totalCorrectAnswers: 14, totalWrongAnswers: 3, completedSessions: 3, perfectSessions: 1 },
  { nickname: "jisu", preferredStudyLevel: "intermediate", totalXp: 360, currentLevel: 4, totalCorrectAnswers: 33, totalWrongAnswers: 8, completedSessions: 6, perfectSessions: 2 },
  { nickname: "yuna", preferredStudyLevel: "advanced", totalXp: 540, currentLevel: 5, totalCorrectAnswers: 46, totalWrongAnswers: 11, completedSessions: 9, perfectSessions: 3 },
  { nickname: "seojun", preferredStudyLevel: "all", totalXp: 75, currentLevel: 1, totalCorrectAnswers: 9, totalWrongAnswers: 4, completedSessions: 2, perfectSessions: 0 },
  { nickname: "jiho", preferredStudyLevel: "beginner", totalXp: 220, currentLevel: 3, totalCorrectAnswers: 24, totalWrongAnswers: 7, completedSessions: 5, perfectSessions: 1 },
  { nickname: "arin", preferredStudyLevel: "intermediate", totalXp: 640, currentLevel: 6, totalCorrectAnswers: 57, totalWrongAnswers: 13, completedSessions: 10, perfectSessions: 4 },
  { nickname: "haeun", preferredStudyLevel: "advanced", totalXp: 890, currentLevel: 7, totalCorrectAnswers: 71, totalWrongAnswers: 15, completedSessions: 13, perfectSessions: 5 },
  { nickname: "doyun", preferredStudyLevel: "all", totalXp: 310, currentLevel: 4, totalCorrectAnswers: 29, totalWrongAnswers: 9, completedSessions: 6, perfectSessions: 2 },
  { nickname: "sua", preferredStudyLevel: "beginner", totalXp: 160, currentLevel: 2, totalCorrectAnswers: 18, totalWrongAnswers: 5, completedSessions: 4, perfectSessions: 1 },
  { nickname: "taemin", preferredStudyLevel: "advanced", totalXp: 1020, currentLevel: 8, totalCorrectAnswers: 84, totalWrongAnswers: 19, completedSessions: 15, perfectSessions: 6 },
];

const wordProgressTemplates = [
  { wordId: "accomplish", word: "accomplish", meaning: "to achieve something", level: "advanced", mastery: 82, earnedXp: 42, correctCount: 4, wrongCount: 1 },
  { wordId: "believe", word: "believe", meaning: "to think something is true", level: "beginner", mastery: 66, earnedXp: 24, correctCount: 3, wrongCount: 2 },
  { wordId: "quickly", word: "quickly", meaning: "fast", level: "beginner", mastery: 58, earnedXp: 18, correctCount: 2, wrongCount: 1 },
];

const favoriteWordsTemplates = [
  { wordId: "accomplish", word: "accomplish", meaning: "to achieve something", level: "advanced" },
  { wordId: "believe", word: "believe", meaning: "to think something is true", level: "beginner" },
];

function buildReviewSchedule(template, index) {
  const day = String(14 + index).padStart(2, "0");
  return {
    wordId: template.wordId,
    word: template.word,
    meaning: template.meaning,
    level: template.level,
    reviewCount: index + 1,
    nextReviewAt: `2026-04-${day}T09:00:00.000Z`,
    dueDate: `2026-04-${day}`,
    isUrgent: index === 0,
    status: "pending",
    updatedAt: serverTimestamp(),
  };
}

function buildSession(sessionType, totalQuestions, correctCount, wrongCount, earnedXp) {
  return {
    sessionType,
    studyLevel: "all",
    totalQuestions,
    correctCount,
    wrongCount,
    earnedXp,
    startedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
  };
}

function buildAnswer(template, isCorrect) {
  return {
    wordId: template.wordId,
    word: template.word,
    promptType: "sentence_quiz",
    promptText: `${template.word} sample sentence`,
    expectedAnswer: template.meaning,
    submittedAnswer: isCorrect ? template.meaning : "wrong answer",
    isCorrect,
    responseTimeMs: isCorrect ? 2100 : 3400,
    createdAt: serverTimestamp(),
  };
}

async function seedCurrentSignedInUser(userTemplate, index) {
  const userCredential = await signInAnonymously(auth);
  const { uid } = userCredential.user;

  await setDoc(doc(db, "users", uid), {
    authProvider: "anonymous",
    nickname: `${userTemplate.nickname}-${index + 1}`,
    email: null,
    avatarUrl: "",
    joinedAt: serverTimestamp(),
    preferences: {
      preferredStudyLevel: userTemplate.preferredStudyLevel,
      dailyGoalCount: 20,
      notificationsEnabled: true,
    },
    stats: {
      totalXp: userTemplate.totalXp,
      currentLevel: userTemplate.currentLevel,
      totalCorrectAnswers: userTemplate.totalCorrectAnswers,
      totalWrongAnswers: userTemplate.totalWrongAnswers,
      completedSessions: userTemplate.completedSessions,
      perfectSessions: userTemplate.perfectSessions,
      accuracyRate: Math.round(
        (userTemplate.totalCorrectAnswers /
          (userTemplate.totalCorrectAnswers + userTemplate.totalWrongAnswers)) *
          100,
      ),
    },
    updatedAt: serverTimestamp(),
  });

  let batch = writeBatch(db);

  for (const [progressIndex, template] of wordProgressTemplates.entries()) {
    batch.set(doc(db, "users", uid, "word_progress", template.wordId), {
      ...template,
      mastery: Math.max(20, Math.min(100, template.mastery - index * 2 + progressIndex * 4)),
      earnedXp: template.earnedXp + index * 3,
      correctCount: template.correctCount + index,
      wrongCount: template.wrongCount + (index % 2),
      lastStudiedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  for (const template of favoriteWordsTemplates) {
    batch.set(doc(db, "users", uid, "favorites_words", template.wordId), {
      ...template,
      mastery: 50 + index * 3,
      addedAt: serverTimestamp(),
    });
  }

  for (const [reviewIndex, template] of wordProgressTemplates.entries()) {
    batch.set(
      doc(db, "users", uid, "review_schedules", template.wordId),
      buildReviewSchedule(template, reviewIndex),
    );
  }

  const sessionRef = doc(db, "users", uid, "study_sessions", `session-${index + 1}`);
  batch.set(
    sessionRef,
    buildSession("sentence_quiz", 10, Math.max(5, 8 - (index % 3)), 2 + (index % 3), 30 + index * 4),
  );

  batch.set(
    doc(db, "users", uid, "study_sessions", `session-${index + 1}`, "answers", "answer-1"),
    buildAnswer(wordProgressTemplates[0], true),
  );
  batch.set(
    doc(db, "users", uid, "study_sessions", `session-${index + 1}`, "answers", "answer-2"),
    buildAnswer(wordProgressTemplates[1], false),
  );

  batch.set(doc(db, "users", uid, "feedback", `feedback-${index + 1}`), {
    category: "기능 제안",
    title: `더미 피드백 ${index + 1}`,
    content: "복습 화면 필터링 기능이 있으면 좋겠습니다.",
    status: "submitted",
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  await signOut(auth);

  return {
    uid,
    nickname: `${userTemplate.nickname}-${index + 1}`,
  };
}

async function main() {
  const created = [];

  for (const [index, userTemplate] of dummyUsers.entries()) {
    const result = await seedCurrentSignedInUser(userTemplate, index);
    created.push(result);
  }

  console.log(JSON.stringify({
    projectId: firebaseConfig.projectId,
    createdCount: created.length,
    created,
    note: "Anonymous users can write only under their own /users/{uid} paths with the current Firestore rules.",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
