package com.hsmocap.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface CommunityPostDao {
    @Query("SELECT * FROM community_posts_cache ORDER BY cachedAt DESC LIMIT :limit")
    fun recent(limit: Int): List<CommunityPostEntity>

    @Query("SELECT * FROM community_posts_cache WHERE id = :postId LIMIT 1")
    fun get(postId: String): CommunityPostEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsertAll(posts: List<CommunityPostEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsert(post: CommunityPostEntity)
}
