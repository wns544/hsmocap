import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

function buildImagePath(userId: string, file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `communityPosts/${userId}/${uniqueId}.${extension}`;
}

export async function uploadCommunityPostImages(userId: string, files: File[]): Promise<string[]> {
  const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, 5);

  const uploadedUrls = await Promise.all(
    imageFiles.map(async (file) => {
      const imageRef = ref(storage, buildImagePath(userId, file));
      await uploadBytes(imageRef, file, {
        contentType: file.type || "image/jpeg",
      });
      return getDownloadURL(imageRef);
    }),
  );

  return uploadedUrls;
}
