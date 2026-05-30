package com.hsmocap.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface StudyStateDao {
    @Query("SELECT * FROM study_states WHERE userId = :userId LIMIT 1")
    fun get(userId: String): StudyStateEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun upsert(state: StudyStateEntity)
}
