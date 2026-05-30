package com.hsmocap.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "pending_actions")
data class PendingActionEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val userId: String,
    val type: String,
    val targetId: String,
    val createdAt: Long = System.currentTimeMillis(),
)
