package com.hsmocap.app.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface PendingActionDao {
    @Insert
    fun insert(action: PendingActionEntity)

    @Query("SELECT COUNT(*) FROM pending_actions WHERE userId = :userId")
    fun count(userId: String): Int

    @Query("DELETE FROM pending_actions WHERE userId = :userId")
    fun clear(userId: String)
}
