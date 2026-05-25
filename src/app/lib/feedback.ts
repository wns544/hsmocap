import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface CreateFeedbackInput {
  userId: string;
  authorName: string;
  authorEmail?: string;
  categoryId: string;
  categoryName: string;
  title: string;
  body: string;
  isImportant: boolean;
}

export async function createFeedback(input: CreateFeedbackInput): Promise<string> {
  const snapshot = await addDoc(collection(db, "feedbacks"), {
    userId: input.userId,
    authorSnapshot: {
      name: input.authorName,
      email: input.authorEmail ?? "",
    },
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    title: input.title,
    body: input.body,
    isImportant: input.isImportant,
    status: "open",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return snapshot.id;
}
