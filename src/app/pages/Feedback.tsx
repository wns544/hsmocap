import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import ComposerForm from "../components/ComposerForm";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../lib/firebase";

const decode = (value: string) => JSON.parse(`"${value}"`) as string;

const feedbackCategories = [
  decode("\\ubc84\\uadf8 \\uc81c\\ubcf4"),
  decode("\\uae30\\ub2a5 \\uc81c\\uc548"),
  decode("\\uc0ac\\uc6a9\\uc131"),
  decode("\\ub514\\uc790\\uc778"),
  decode("\\uae30\\ud0c0"),
];

export default function Feedback() {
  const { user } = useAuth();

  const handleSubmit = async (payload: {
    title: string;
    content: string;
    category: string;
    imageUrls: string[];
  }) => {
    if (!user) {
      throw new Error("User is not authenticated.");
    }

    await addDoc(collection(db, "users", user.uid, "feedback"), {
      category: payload.category,
      title: payload.title,
      content: payload.content,
      imageUrls: payload.imageUrls,
      status: "submitted",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    toast.success(decode("\\ud53c\\ub4dc\\ubc31\\uc774 \\uc804\\uc1a1\\ub418\\uc5c8\\uc2b5\\ub2c8\\ub2e4."));
  };

  return (
    <ComposerForm
      headerTitle={decode("\\ud53c\\ub4dc\\ubc31 \\ubcf4\\ub0b4\\uae30")}
      successPath="/app/settings"
      categories={feedbackCategories}
      onSubmit={handleSubmit}
    />
  );
}
