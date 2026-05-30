package com.hsmocap.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface WordDao {
    @Query("SELECT * FROM words ORDER BY frequencyRank ASC, id ASC")
    fun all(): List<WordEntity>

    @Query("SELECT COUNT(*) FROM words")
    fun count(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsertAll(words: List<WordEntity>)
}
