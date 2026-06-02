package com.hsmocap.app.data

data class CommunityPost(
    val id: String,
    val authorId: String,
    val authorName: String,
    val authorAvatar: String,
    val authorLevel: String,
    val title: String,
    val content: String,
    val categoryId: String,
    val categoryName: String,
    val category: String,
    val likes: Int,
    val comments: Int,
    val views: Int,
    val bookmarks: Int,
    val isHot: Boolean,
    val timestampLabel: String,
    val imageUrl: String?,
    val imageUrls: List<String> = imageUrl?.let { listOf(it) } ?: emptyList(),
)

data class CommunityComment(
    val id: String,
    val authorId: String,
    val authorName: String,
    val authorAvatar: String,
    val authorLevel: String,
    val content: String,
    val likes: Int,
    val timestampLabel: String,
)

data class CommunityAuthor(
    val id: String,
    val name: String,
    val avatar: String,
    val level: String,
)

data class CommunityReaction(
    val liked: Boolean,
    val bookmarked: Boolean,
)
