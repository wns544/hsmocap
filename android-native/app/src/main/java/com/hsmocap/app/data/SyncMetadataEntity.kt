package com.hsmocap.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sync_metadata")
data class SyncMetadataEntity(
    @PrimaryKey val key: String,
    val lastSyncedAt: Long,
    val detail: String,
)
