package com.hsmocap.app.data

import androidx.room.Dao
import androidx.room.Query
import androidx.room.Upsert

@Dao
interface SyncMetadataDao {
    @Query("SELECT * FROM sync_metadata WHERE `key` = :key")
    fun get(key: String): SyncMetadataEntity?

    @Upsert
    fun upsert(entity: SyncMetadataEntity)
}
