package com.hsmocap.app.data

import androidx.room.Entity

@Entity(tableName = "community_comments_cache", primaryKeys = ["postId", "id"])
data class CommunityCommentEntity(
    val postId: String,
    val id: String,
    val authorId: String,
    val authorName: String,
    val authorAvatar: String,
    val authorLevel: String,
    val content: String,
    val likes: Int,
    val timestampLabel: String,
    val cachedAt: Long,
) {
    fun toComment(): CommunityComment {
        return CommunityComment(
            id = id,
            authorId = authorId,
            authorName = authorName,
            authorAvatar = authorAvatar,
            authorLevel = authorLevel,
            content = content,
            likes = likes,
            timestampLabel = timestampLabel,
        )
    }

    companion object {
        fun from(postId: String, comment: CommunityComment, cachedAt: Long = System.currentTimeMillis()): CommunityCommentEntity {
            return CommunityCommentEntity(
                postId = postId,
                id = comment.id,
                authorId = comment.authorId,
                authorName = comment.authorName,
                authorAvatar = comment.authorAvatar,
                authorLevel = comment.authorLevel,
                content = comment.content,
                likes = comment.likes,
                timestampLabel = comment.timestampLabel,
                cachedAt = cachedAt,
            )
        }
    }
}
