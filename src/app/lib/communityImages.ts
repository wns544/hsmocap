import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

const MAX_COMMUNITY_IMAGE_COUNT = 5;
const MAX_COMMUNITY_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function buildImagePath(folder: string, userId: string, file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const uniqueId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${folder}/${userId}/${uniqueId}.${extension}`;
}

export function validateCommunityPostImages(files: File[]): string | null {
  if (files.length > MAX_COMMUNITY_IMAGE_COUNT) {
    return `이미지는 최대 ${MAX_COMMUNITY_IMAGE_COUNT}장까지 첨부할 수 있습니다.`;
  }

  const invalidTypeFile = files.find((file) => !file.type.startsWith("image/"));
  if (invalidTypeFile) {
    return "이미지 파일만 첨부할 수 있습니다.";
  }

  const oversizedFile = files.find((file) => file.size >= MAX_COMMUNITY_IMAGE_SIZE_BYTES);
  if (oversizedFile) {
    return "이미지는 파일당 최대 5MB까지만 첨부할 수 있습니다.";
  }

  return null;
}

export async function uploadCommunityPostImages(userId: string, files: File[]): Promise<string[]> {
  const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, MAX_COMMUNITY_IMAGE_COUNT);

  const uploadedUrls = await Promise.all(
    imageFiles.map(async (file) => {
      const imageRef = ref(storage, buildImagePath("communityPosts", userId, file));
      await uploadBytes(imageRef, file, {
        contentType: file.type || "image/jpeg",
      });
      return getDownloadURL(imageRef);
    }),
  );

  return uploadedUrls;
}

export async function uploadFeedbackImages(userId: string, files: File[]): Promise<string[]> {
  const imageFiles = files.filter((file) => file.type.startsWith("image/")).slice(0, MAX_COMMUNITY_IMAGE_COUNT);

  const uploadedUrls = await Promise.all(
    imageFiles.map(async (file) => {
      const imageRef = ref(storage, buildImagePath("feedbacks", userId, file));
      await uploadBytes(imageRef, file, {
        contentType: file.type || "image/jpeg",
      });
      return getDownloadURL(imageRef);
    }),
  );

  return uploadedUrls;
}
