package com.hsmocap.app.data

import android.content.Context
import com.google.android.gms.tasks.Tasks
import com.google.firebase.firestore.AggregateSource
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.firestore.AggregateQuerySnapshot
import com.hsmocap.app.firebase.FirebaseBackend
import java.util.Date
import java.util.concurrent.TimeUnit

interface CommunityRepository {
    fun loadPosts(limit: Long, callback: (Result<List<CommunityPost>>) -> Unit)
    fun loadPost(postId: String, callback: (Result<CommunityPost>) -> Unit)
    fun loadReaction(postId: String, userId: String, callback: (Result<CommunityReaction>) -> Unit)
    fun loadBookmarkedPosts(userId: String, callback: (Result<List<CommunityPost>>) -> Unit)
    fun loadComments(postId: String, callback: (Result<List<CommunityComment>>) -> Unit)
    fun addPost(author: CommunityAuthor, title: String, content: String, category: String, imageUrl: String?, callback: (Result<String>) -> Unit)
    fun addComment(postId: String, author: CommunityAuthor, content: String, callback: (Result<Unit>) -> Unit)
    fun recordView(postId: String, userId: String, callback: (Result<Unit>) -> Unit)
    fun toggleLike(postId: String, userId: String, callback: (Result<Unit>) -> Unit)
    fun toggleBookmark(postId: String, userId: String, callback: (Result<Unit>) -> Unit)
}

class FirebaseCommunityRepository(context: Context) : CommunityRepository {
    private val db = FirebaseFirestore.getInstance()
    private val posts = db.collection("posts")

    init {
        require(FirebaseBackend.isAvailable(context)) { "Firebase 설정을 찾을 수 없습니다." }
    }

    override fun loadPosts(limit: Long, callback: (Result<List<CommunityPost>>) -> Unit) {
        posts.orderBy("createdAt", Query.Direction.DESCENDING)
            .limit(limit.coerceAtLeast(1))
            .get()
            .addOnSuccessListener { snapshot ->
                loadCounts(snapshot.documents.map { it.toPost() }, callback)
            }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    override fun loadPost(postId: String, callback: (Result<CommunityPost>) -> Unit) {
        posts.document(postId)
            .get()
            .addOnSuccessListener { snapshot ->
                if (snapshot.exists()) {
                    loadCounts(listOf(snapshot.toPost())) { result ->
                        callback(result.map { posts -> posts.first() })
                    }
                } else {
                    callback(Result.failure(NoSuchElementException("게시글을 찾을 수 없습니다.")))
                }
            }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    override fun loadReaction(postId: String, userId: String, callback: (Result<CommunityReaction>) -> Unit) {
        val post = posts.document(postId)
        val likeTask = post.collection("likes").document(userId).get()
        val userBookmarkTask = db.collection("users").document(userId).collection("postBookmarks").document(postId).get()
        val legacyBookmarkTask = post.collection("bookmarks").document(userId).get()
        Tasks.whenAllComplete(likeTask, userBookmarkTask, legacyBookmarkTask)
            .addOnCompleteListener {
                if (!likeTask.isSuccessful && !userBookmarkTask.isSuccessful && !legacyBookmarkTask.isSuccessful) {
                    callback(Result.failure(likeTask.exception ?: userBookmarkTask.exception ?: legacyBookmarkTask.exception ?: IllegalStateException("반응 상태를 불러오지 못했습니다.")))
                    return@addOnCompleteListener
                }
                callback(
                    Result.success(
                        CommunityReaction(
                            liked = likeTask.isSuccessful && likeTask.result.exists(),
                            bookmarked = (userBookmarkTask.isSuccessful && userBookmarkTask.result.exists()) ||
                                (legacyBookmarkTask.isSuccessful && legacyBookmarkTask.result.exists()),
                        ),
                    ),
                )
            }
    }

    override fun loadBookmarkedPosts(userId: String, callback: (Result<List<CommunityPost>>) -> Unit) {
        db.collection("users").document(userId).collection("postBookmarks")
            .limit(100)
            .get()
            .addOnSuccessListener { snapshot ->
                val postIds = snapshot.documents
                    .map { it.getString("postId").orEmpty().ifBlank { it.id } }
                    .filter { it.isNotBlank() }
                    .distinct()
                    .take(10)
                if (postIds.isEmpty()) {
                    callback(Result.success(emptyList()))
                    return@addOnSuccessListener
                }

                val tasks = postIds.map { posts.document(it).get() }
                Tasks.whenAllComplete(tasks)
                    .addOnCompleteListener {
                        val bookmarkedPosts = tasks
                            .filter { task -> task.isSuccessful && task.result.exists() }
                            .map { task -> task.result.toPost() }
                        loadCounts(bookmarkedPosts, callback)
                    }
            }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    override fun loadComments(postId: String, callback: (Result<List<CommunityComment>>) -> Unit) {
        posts.document(postId)
            .collection("comments")
            .orderBy("createdAt", Query.Direction.ASCENDING)
            .limit(100)
            .get()
            .addOnSuccessListener { snapshot ->
                callback(Result.success(snapshot.documents.map { it.toComment() }))
            }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    override fun addPost(author: CommunityAuthor, title: String, content: String, category: String, imageUrl: String?, callback: (Result<String>) -> Unit) {
        val trimmedTitle = title.trim()
        val trimmedContent = content.trim()
        val trimmedImageUrl = imageUrl?.trim().orEmpty()
        require(trimmedTitle.isNotBlank()) { "제목을 입력하세요." }
        require(trimmedContent.isNotBlank()) { "내용을 입력하세요." }

        val payload = mutableMapOf<String, Any>(
            "categoryId" to categoryIdFor(category),
            "categoryName" to categoryNameFor(category),
            "authorId" to author.id,
            "authorName" to author.name,
            "authorAvatar" to author.avatar,
            "authorLevel" to author.level,
            "title" to trimmedTitle,
            "content" to trimmedContent,
            "category" to categoryNameFor(category),
            "likes" to 0,
            "comments" to 0,
            "views" to 0,
            "isHot" to false,
            "createdAt" to Timestamp.now(),
        )
        if (trimmedImageUrl.isNotBlank()) {
            payload["imageUrl"] = trimmedImageUrl
        }

        posts.add(payload)
            .addOnSuccessListener { ref -> callback(Result.success(ref.id)) }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    override fun addComment(postId: String, author: CommunityAuthor, content: String, callback: (Result<Unit>) -> Unit) {
        val trimmedContent = content.trim()
        require(trimmedContent.isNotBlank()) { "댓글을 입력하세요." }
        val post = posts.document(postId)
        post.collection("comments")
            .add(
                mapOf(
                    "authorId" to author.id,
                    "authorName" to author.name,
                    "authorAvatar" to author.avatar,
                    "authorLevel" to author.level,
                    "content" to trimmedContent,
                    "likes" to 0,
                    "createdAt" to Timestamp.now(),
                ),
            )
            .addOnSuccessListener { callback(Result.success(Unit)) }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    override fun recordView(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        posts.document(postId)
            .collection("views")
            .document(userId)
            .set(mapOf("userId" to userId, "createdAt" to Timestamp.now()))
            .addOnSuccessListener { callback(Result.success(Unit)) }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    override fun toggleLike(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        toggleUserDocument(
            postId = postId,
            userId = userId,
            collection = "likes",
            callback = callback,
        )
    }

    override fun toggleBookmark(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        val ref = db.collection("users").document(userId).collection("postBookmarks").document(postId)
        db.runTransaction { transaction ->
            val snapshot = transaction.get(ref)
            if (snapshot.exists()) {
                transaction.delete(ref)
            } else {
                transaction.set(ref, mapOf("postId" to postId, "savedAt" to Timestamp.now()))
            }
        }
            .addOnSuccessListener { callback(Result.success(Unit)) }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    private fun toggleUserDocument(
        postId: String,
        userId: String,
        collection: String,
        callback: (Result<Unit>) -> Unit,
    ) {
        val ref = posts.document(postId).collection(collection).document(userId)
        db.runTransaction { transaction ->
            val snapshot = transaction.get(ref)
            if (snapshot.exists()) {
                transaction.delete(ref)
            } else {
                transaction.set(ref, mapOf("userId" to userId, "createdAt" to Timestamp.now()))
            }
        }
            .addOnSuccessListener { callback(Result.success(Unit)) }
            .addOnFailureListener { error -> callback(Result.failure(error)) }
    }

    private fun DocumentSnapshot.toPost(): CommunityPost {
        val rawCategory = getString("categoryName").orEmpty().ifBlank { getString("category").orEmpty() }
        val normalizedCategoryId = getString("categoryId").orEmpty().ifBlank { categoryIdFor(rawCategory) }
        val normalizedCategoryName = categoryNameFor(normalizedCategoryId).ifBlank { categoryNameFor(rawCategory) }
        return CommunityPost(
            id = id,
            authorId = getString("authorId").orEmpty(),
            authorName = getString("authorName").orEmpty().ifBlank { "워디 사용자" },
            authorAvatar = getString("authorAvatar").orEmpty().ifBlank { "👤" },
            authorLevel = getString("authorLevel").orEmpty().ifBlank { "레벨 1" },
            title = getString("title").orEmpty(),
            content = getString("content").orEmpty(),
            categoryId = normalizedCategoryId,
            categoryName = normalizedCategoryName,
            category = normalizedCategoryName,
            likes = getLong("likes").toIntOrZero(),
            comments = getLong("comments").toIntOrZero(),
            views = getLong("views").toIntOrZero(),
            bookmarks = getLong("bookmarks").toIntOrZero(),
            isHot = getBoolean("isHot") ?: false,
            timestampLabel = timestampLabel(getTimestamp("createdAt")?.toDate()),
            imageUrl = firstImageUrl(),
        )
    }

    private fun loadCounts(postsToEnrich: List<CommunityPost>, callback: (Result<List<CommunityPost>>) -> Unit) {
        if (postsToEnrich.isEmpty()) {
            callback(Result.success(emptyList()))
            return
        }

        val enriched = MutableList<CommunityPost?>(postsToEnrich.size) { null }
        var remaining = postsToEnrich.size
        var completed = false

        postsToEnrich.forEachIndexed { index, post ->
            loadCounts(post) { countedPost ->
                if (completed) return@loadCounts
                enriched[index] = countedPost
                remaining -= 1
                if (remaining == 0) {
                    completed = true
                    callback(Result.success(enriched.mapIndexed { fallbackIndex, value -> value ?: postsToEnrich[fallbackIndex] }))
                }
            }
        }
    }

    private fun loadCounts(post: CommunityPost, callback: (CommunityPost) -> Unit) {
        val postRef = posts.document(post.id)
        val likesTask = postRef.collection("likes").count().get(AggregateSource.SERVER)
        val commentsTask = postRef.collection("comments").count().get(AggregateSource.SERVER)
        val viewsTask = postRef.collection("views").count().get(AggregateSource.SERVER)
        val bookmarksTask = postRef.collection("bookmarks").count().get(AggregateSource.SERVER)

        Tasks.whenAllComplete(likesTask, commentsTask, viewsTask, bookmarksTask)
            .addOnCompleteListener {
                callback(
                    post.copy(
                        likes = likesTask.resultOrNull()?.count?.toInt() ?: post.likes,
                        comments = commentsTask.resultOrNull()?.count?.toInt() ?: post.comments,
                        views = viewsTask.resultOrNull()?.count?.toInt() ?: post.views,
                        bookmarks = bookmarksTask.resultOrNull()?.count?.toInt() ?: post.bookmarks,
                    ),
                )
            }
    }

    private fun DocumentSnapshot.firstImageUrl(): String? {
        val stringFields = listOf(
            "imageUrl",
            "image",
            "thumbnailUrl",
            "photoUrl",
            "downloadUrl",
            "imageData",
            "imageBase64",
        )
        stringFields.firstNotNullOfOrNull { field ->
            getString(field)?.trim()?.takeIf { it.isNotBlank() }
        }?.let { return it }

        val listFields = listOf(
            "imageUrls",
            "images",
            "selectedImages",
            "photos",
            "photoUrls",
            "mediaUrls",
            "attachments",
        )
        return listFields.firstNotNullOfOrNull { field ->
            firstImageFromValue(get(field))
        }
    }

    private fun firstImageFromValue(value: Any?): String? {
        return when (value) {
            is String -> value.trim().takeIf { it.isNotBlank() }
            is List<*> -> value.firstNotNullOfOrNull { firstImageFromValue(it) }
            is Map<*, *> -> {
                val keys = listOf("imageUrl", "url", "src", "downloadUrl", "data", "base64")
                keys.firstNotNullOfOrNull { key ->
                    firstImageFromValue(value[key])
                }
            }
            else -> null
        }
    }

    private fun DocumentSnapshot.toComment(): CommunityComment {
        return CommunityComment(
            id = id,
            authorId = getString("authorId").orEmpty(),
            authorName = getString("authorName").orEmpty().ifBlank { "워디 사용자" },
            authorAvatar = getString("authorAvatar").orEmpty().ifBlank { "👤" },
            authorLevel = getString("authorLevel").orEmpty().ifBlank { "레벨 1" },
            content = getString("content").orEmpty(),
            likes = getLong("likes").toIntOrZero(),
            timestampLabel = timestampLabel(getTimestamp("createdAt")?.toDate()),
        )
    }

    private fun timestampLabel(date: Date?): String {
        if (date == null) return "방금 전"
        val diff = (Date().time - date.time).coerceAtLeast(0L)
        val minutes = TimeUnit.MILLISECONDS.toMinutes(diff)
        val hours = TimeUnit.MILLISECONDS.toHours(diff)
        val days = TimeUnit.MILLISECONDS.toDays(diff)
        return when {
            minutes < 1 -> "방금 전"
            minutes < 60 -> "${minutes}분 전"
            hours < 24 -> "${hours}시간 전"
            days < 7 -> "${days}일 전"
            else -> "${days / 7}주 전"
        }
    }

    private fun Long?.toIntOrZero(): Int = this?.toInt() ?: 0

    private fun categoryIdFor(value: String): String {
        return when (value.trim()) {
            "학습팁", "study-tip" -> "study-tip"
            "단어비교", "word-compare" -> "word-compare"
            "문장학습", "sentence-practice" -> "sentence-practice"
            "시험준비", "exam-prep" -> "exam-prep"
            "자료공유", "resources" -> "resources"
            "질문", "question" -> "question"
            "후기", "review" -> "review"
            else -> value.trim().lowercase().replace(Regex("\\s+"), "-").ifBlank { "study-tip" }
        }
    }

    private fun categoryNameFor(value: String): String {
        return when (value.trim()) {
            "study-tip" -> "학습팁"
            "word-compare" -> "단어비교"
            "sentence-practice" -> "문장학습"
            "exam-prep" -> "시험준비"
            "resources" -> "자료공유"
            "question" -> "질문"
            "review" -> "후기"
            else -> value.trim().ifBlank { "학습팁" }
        }
    }

    private fun com.google.android.gms.tasks.Task<AggregateQuerySnapshot>.resultOrNull(): AggregateQuerySnapshot? {
        return if (isSuccessful) result else null
    }
}

class CachedCommunityRepository(
    private val remote: CommunityRepository,
    private val postCache: CommunityPostDao,
    private val commentCache: CommunityCommentDao,
) : CommunityRepository {
    override fun loadPosts(limit: Long, callback: (Result<List<CommunityPost>>) -> Unit) {
        remote.loadPosts(limit) { result ->
            result
                .onSuccess { posts ->
                    postCache.upsertAll(posts.map { CommunityPostEntity.from(it) })
                    callback(Result.success(posts))
                }
                .onFailure { error ->
                    val cached = postCache.recent(limit.coerceAtLeast(1).toInt()).map { it.toPost() }
                    if (cached.isNotEmpty()) {
                        callback(Result.success(cached))
                    } else {
                        callback(Result.failure(error))
                    }
                }
        }
    }

    override fun loadPost(postId: String, callback: (Result<CommunityPost>) -> Unit) {
        remote.loadPost(postId) { result ->
            result
                .onSuccess { post ->
                    postCache.upsert(CommunityPostEntity.from(post))
                    callback(Result.success(post))
                }
                .onFailure { error ->
                    val cached = postCache.get(postId)?.toPost()
                    if (cached != null) {
                        callback(Result.success(cached))
                    } else {
                        callback(Result.failure(error))
                    }
                }
        }
    }

    override fun loadReaction(postId: String, userId: String, callback: (Result<CommunityReaction>) -> Unit) {
        remote.loadReaction(postId, userId, callback)
    }

    override fun loadBookmarkedPosts(userId: String, callback: (Result<List<CommunityPost>>) -> Unit) {
        remote.loadBookmarkedPosts(userId) { result ->
            result
                .onSuccess { posts ->
                    postCache.upsertAll(posts.map { CommunityPostEntity.from(it) })
                    callback(Result.success(posts))
                }
                .onFailure { callback(Result.failure(it)) }
        }
    }

    override fun loadComments(postId: String, callback: (Result<List<CommunityComment>>) -> Unit) {
        remote.loadComments(postId) { result ->
            result
                .onSuccess { comments ->
                    commentCache.clearPost(postId)
                    commentCache.upsertAll(comments.map { CommunityCommentEntity.from(postId, it) })
                    callback(Result.success(comments))
                }
                .onFailure { error ->
                    val cached = commentCache.forPost(postId).map { it.toComment() }
                    if (cached.isNotEmpty()) {
                        callback(Result.success(cached))
                    } else {
                        callback(Result.failure(error))
                    }
                }
        }
    }

    override fun addPost(author: CommunityAuthor, title: String, content: String, category: String, imageUrl: String?, callback: (Result<String>) -> Unit) {
        remote.addPost(author, title, content, category, imageUrl, callback)
    }

    override fun addComment(postId: String, author: CommunityAuthor, content: String, callback: (Result<Unit>) -> Unit) {
        remote.addComment(postId, author, content, callback)
    }

    override fun recordView(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        remote.recordView(postId, userId, callback)
    }

    override fun toggleLike(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        remote.toggleLike(postId, userId, callback)
    }

    override fun toggleBookmark(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        remote.toggleBookmark(postId, userId, callback)
    }
}

class CachedReadOnlyCommunityRepository(
    private val postCache: CommunityPostDao,
    private val commentCache: CommunityCommentDao,
) : CommunityRepository {
    private val writeError = IllegalStateException("커뮤니티 쓰기는 Firebase 연결이 필요합니다.")

    override fun loadPosts(limit: Long, callback: (Result<List<CommunityPost>>) -> Unit) {
        val cached = postCache.recent(limit.coerceAtLeast(1).toInt()).map { it.toPost() }
        if (cached.isNotEmpty()) {
            callback(Result.success(cached))
        } else {
            callback(Result.failure(IllegalStateException("저장된 커뮤니티 캐시가 없습니다.")))
        }
    }

    override fun loadPost(postId: String, callback: (Result<CommunityPost>) -> Unit) {
        val cached = postCache.get(postId)?.toPost()
        if (cached != null) {
            callback(Result.success(cached))
        } else {
            callback(Result.failure(IllegalStateException("저장된 게시글 캐시가 없습니다.")))
        }
    }

    override fun loadReaction(postId: String, userId: String, callback: (Result<CommunityReaction>) -> Unit) {
        callback(Result.success(CommunityReaction(liked = false, bookmarked = false)))
    }

    override fun loadBookmarkedPosts(userId: String, callback: (Result<List<CommunityPost>>) -> Unit) {
        callback(Result.success(emptyList()))
    }

    override fun loadComments(postId: String, callback: (Result<List<CommunityComment>>) -> Unit) {
        callback(Result.success(commentCache.forPost(postId).map { it.toComment() }))
    }

    override fun addPost(author: CommunityAuthor, title: String, content: String, category: String, imageUrl: String?, callback: (Result<String>) -> Unit) {
        callback(Result.failure(writeError))
    }

    override fun addComment(postId: String, author: CommunityAuthor, content: String, callback: (Result<Unit>) -> Unit) {
        callback(Result.failure(writeError))
    }

    override fun recordView(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        callback(Result.success(Unit))
    }

    override fun toggleLike(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        callback(Result.failure(writeError))
    }

    override fun toggleBookmark(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        callback(Result.failure(writeError))
    }
}

class UnavailableCommunityRepository : CommunityRepository {
    private val error = IllegalStateException("Firebase 연결이 필요합니다.")

    override fun loadPosts(limit: Long, callback: (Result<List<CommunityPost>>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun loadPost(postId: String, callback: (Result<CommunityPost>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun loadReaction(postId: String, userId: String, callback: (Result<CommunityReaction>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun loadBookmarkedPosts(userId: String, callback: (Result<List<CommunityPost>>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun loadComments(postId: String, callback: (Result<List<CommunityComment>>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun addPost(author: CommunityAuthor, title: String, content: String, category: String, imageUrl: String?, callback: (Result<String>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun addComment(postId: String, author: CommunityAuthor, content: String, callback: (Result<Unit>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun recordView(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun toggleLike(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        callback(Result.failure(error))
    }

    override fun toggleBookmark(postId: String, userId: String, callback: (Result<Unit>) -> Unit) {
        callback(Result.failure(error))
    }
}
