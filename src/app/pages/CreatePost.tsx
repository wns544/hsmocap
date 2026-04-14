import { addDoc, collection, getDocs, limit, query, serverTimestamp, where } from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { toast } from "sonner";
import ComposerForm from "../components/ComposerForm";
import { useAuth } from "../contexts/AuthContext";
import { db, storage } from "../lib/firebase";

export default function CreatePost() {
  const { user } = useAuth();

  const uploadImages = async (imageUrls: string[]) => {
    if (!user || imageUrls.length === 0) {
      return [];
    }

    const uploadedUrls = await Promise.all(
      imageUrls.map(async (imageUrl, index) => {
        const fileRef = ref(
          storage,
          `posts/${user.uid}/${Date.now()}-${index}.png`,
        );
        await uploadString(fileRef, imageUrl, "data_url");
        return getDownloadURL(fileRef);
      }),
    );

    return uploadedUrls;
  };

  const handleSubmit = async (payload: {
    title: string;
    content: string;
    category: string;
    imageUrls: string[];
  }) => {
    if (!user) {
      throw new Error("User is not authenticated.");
    }

    let categoryId = payload.category;
    const uploadedImageUrls = await uploadImages(payload.imageUrls);

    try {
      const categoryQuery = query(
        collection(db, "communityCategories"),
        where("name", "==", payload.category),
        limit(1),
      );
      const snapshot = await getDocs(categoryQuery);
      if (!snapshot.empty) {
        categoryId = snapshot.docs[0].id;
      }
    } catch (error) {
      console.error("Failed to resolve category id:", error);
    }

    await addDoc(collection(db, "posts"), {
      authorId: user.uid,
      authorSnapshot: {
        nickname: user.displayName || user.email?.split("@")[0] || "User",
        avatarUrl: user.photoURL || "",
        level: 1,
      },
      categoryId,
      categoryName: payload.category,
      title: payload.title,
      content: payload.content,
      imageUrls: uploadedImageUrls,
      isPublic: true,
      isHot: false,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    toast.success("\uac8c\uc2dc\uae00\uc774 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
  };

  return (
    <ComposerForm
      headerTitle="\uae00\uc4f0\uae30"
      successPath="/app/community"
      onSubmit={handleSubmit}
    />
  );
}
