package com.hsmocap.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "community_posts_cache")
data class CommunityPostEntity(
    @PrimaryKey val id: String,
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
    val imageUrlsText: String = imageUrl.orEmpty(),
    val cachedAt: Long,
) {
    fun toPost(): CommunityPost {
        val imageUrls = imageUrlsText
            .lines()
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .ifEmpty { imageUrl?.let { listOf(it) } ?: emptyList() }
        return CommunityPost(
            id = id,
            authorId = authorId,
            authorName = authorName,
            authorAvatar = authorAvatar,
            authorLevel = authorLevel,
            title = title,
            content = content,
            categoryId = categoryId,
            categoryName = categoryName,
            category = category,
            likes = likes,
            comments = comments,
            views = views,
            bookmarks = bookmarks,
            isHot = isHot,
            timestampLabel = timestampLabel,
            imageUrl = imageUrl,
            imageUrls = imageUrls,
        )
    }

    companion object {
        fun from(post: CommunityPost, cachedAt: Long = System.currentTimeMillis()): CommunityPostEntity {
            return CommunityPostEntity(
                id = post.id,
                authorId = post.authorId,
                authorName = post.authorName,
                authorAvatar = post.authorAvatar,
                authorLevel = post.authorLevel,
                title = post.title,
                content = post.content,
                categoryId = post.categoryId,
                categoryName = post.categoryName,
                category = post.category,
                likes = post.likes,
                comments = post.comments,
                views = post.views,
                bookmarks = post.bookmarks,
                isHot = post.isHot,
                timestampLabel = post.timestampLabel,
                imageUrl = post.imageUrl,
                imageUrlsText = post.imageUrls.joinToString("\n"),
                cachedAt = cachedAt,
            )
        }
    }
}
