package com.hsmocap.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface CommunityCommentDao {
    @Query("SELECT * FROM community_comments_cache WHERE postId = :postId ORDER BY cachedAt ASC")
    fun forPost(postId: String): List<CommunityCommentEntity>

    @Query("DELETE FROM community_comments_cache WHERE postId = :postId")
    fun clearPost(postId: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsertAll(comments: List<CommunityCommentEntity>)
}
