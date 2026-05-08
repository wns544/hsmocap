const admin = require("firebase-admin");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");

admin.initializeApp();
setGlobalOptions({ region: "asia-northeast3" });

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  return request.auth.uid;
}

function getPostId(request) {
  const postId = typeof request.data?.postId === "string" ? request.data.postId.trim() : "";
  if (!postId) {
    throw new HttpsError("invalid-argument", "postId is required.");
  }

  return postId;
}

async function getPostSnapshotOrThrow(postRef) {
  const postSnapshot = await postRef.get();
  if (!postSnapshot.exists) {
    throw new HttpsError("not-found", "Post not found.");
  }

  return postSnapshot;
}

exports.incrementPostView = onCall(async (request) => {
  requireAuth(request);
  const postId = getPostId(request);

  const postRef = admin.firestore().collection("posts").doc(postId);
  await getPostSnapshotOrThrow(postRef);

  await postRef.update({
    viewCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

exports.togglePostLike = onCall(async (request) => {
  const uid = requireAuth(request);
  const postId = getPostId(request);

  const db = admin.firestore();
  const postRef = db.collection("posts").doc(postId);
  const likeRef = postRef.collection("likes").doc(uid);

  const result = await db.runTransaction(async (transaction) => {
    const [postSnapshot, likeSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(likeRef),
    ]);

    if (!postSnapshot.exists) {
      throw new HttpsError("not-found", "Post not found.");
    }

    const currentlyLiked = likeSnapshot.exists;
    const nextLiked = !currentlyLiked;
    const countDelta = nextLiked ? 1 : -1;
    const currentLikeCount = typeof postSnapshot.data().likeCount === "number" ? postSnapshot.data().likeCount : 0;
    const nextLikeCount = Math.max(0, currentLikeCount + countDelta);

    if (nextLiked) {
      transaction.set(likeRef, {
        userId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      transaction.delete(likeRef);
    }

    transaction.update(postRef, {
      likeCount: nextLikeCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      liked: nextLiked,
      likeCount: nextLikeCount,
    };
  });

  return result;
});

exports.addPostComment = onCall(async (request) => {
  const uid = requireAuth(request);
  const postId = getPostId(request);
  const content = typeof request.data?.content === "string" ? request.data.content.trim() : "";

  if (!content) {
    throw new HttpsError("invalid-argument", "content is required.");
  }

  const nickname =
    typeof request.data?.authorName === "string" && request.data.authorName.trim().length > 0
      ? request.data.authorName.trim()
      : "User";
  const avatarUrl = typeof request.data?.authorAvatar === "string" ? request.data.authorAvatar : "";
  const level = typeof request.data?.authorLevel === "number" ? request.data.authorLevel : 1;

  const db = admin.firestore();
  const postRef = db.collection("posts").doc(postId);
  const commentRef = postRef.collection("comments").doc();
  const now = admin.firestore.Timestamp.now();

  const result = await db.runTransaction(async (transaction) => {
    const postSnapshot = await transaction.get(postRef);

    if (!postSnapshot.exists) {
      throw new HttpsError("not-found", "Post not found.");
    }

    const currentCommentCount =
      typeof postSnapshot.data().commentCount === "number" ? postSnapshot.data().commentCount : 0;
    const nextCommentCount = currentCommentCount + 1;

    transaction.set(commentRef, {
      authorId: uid,
      authorSnapshot: {
        nickname,
        avatarUrl,
        level,
      },
      content,
      parentCommentId: null,
      likeCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    transaction.update(postRef, {
      commentCount: nextCommentCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      commentId: commentRef.id,
      commentCount: nextCommentCount,
      comment: {
        content,
        authorName: nickname,
        authorAvatar: avatarUrl,
        authorLevel: level,
        createdAtMillis: now.toMillis(),
      },
    };
  });

  return result;
});

exports.togglePostBookmark = onCall(async (request) => {
  const uid = requireAuth(request);
  const postId = getPostId(request);

  const db = admin.firestore();
  const postRef = db.collection("posts").doc(postId);
  const bookmarkRef = postRef.collection("bookmarks").doc(uid);
  const favoritePostRef = db.collection("users").doc(uid).collection("favorite_posts").doc(postId);

  const result = await db.runTransaction(async (transaction) => {
    const [postSnapshot, bookmarkSnapshot] = await Promise.all([
      transaction.get(postRef),
      transaction.get(bookmarkRef),
    ]);

    if (!postSnapshot.exists) {
      throw new HttpsError("not-found", "Post not found.");
    }

    const postData = postSnapshot.data();
    const isSaved = bookmarkSnapshot.exists;
    const nextSaved = !isSaved;
    const imageUrls = Array.isArray(postData.imageUrls) ? postData.imageUrls : [];
    const authorSnapshot =
      typeof postData.authorSnapshot === "object" && postData.authorSnapshot ? postData.authorSnapshot : {};

    if (nextSaved) {
      transaction.set(bookmarkRef, {
        userId: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      transaction.set(favoritePostRef, {
        postId,
        title: typeof postData.title === "string" ? postData.title : "제목 없음",
        content: typeof postData.content === "string" ? postData.content : "",
        categoryId: typeof postData.categoryId === "string" ? postData.categoryId : "unknown",
        categoryName: typeof postData.categoryName === "string" ? postData.categoryName : "미분류",
        authorNickname:
          typeof authorSnapshot.nickname === "string" && authorSnapshot.nickname.trim().length > 0
            ? authorSnapshot.nickname
            : "Unknown",
        likeCount: typeof postData.likeCount === "number" ? postData.likeCount : 0,
        commentCount: typeof postData.commentCount === "number" ? postData.commentCount : 0,
        isHot: Boolean(postData.isHot),
        imageUrl: typeof imageUrls[0] === "string" ? imageUrls[0] : "",
        postCreatedAt: postData.createdAt || null,
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      transaction.delete(bookmarkRef);
      transaction.delete(favoritePostRef);
    }

    return { saved: nextSaved };
  });

  return result;
});
