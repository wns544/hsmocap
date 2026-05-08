const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

admin.initializeApp();
setGlobalOptions({ region: "asia-northeast3" });

exports.incrementPostView = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const postId = typeof request.data?.postId === "string" ? request.data.postId.trim() : "";
  if (!postId) {
    throw new HttpsError("invalid-argument", "postId is required.");
  }

  const postRef = admin.firestore().collection("posts").doc(postId);
  const postSnapshot = await postRef.get();

  if (!postSnapshot.exists) {
    throw new HttpsError("not-found", "Post not found.");
  }

  await postRef.update({
    viewCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});
