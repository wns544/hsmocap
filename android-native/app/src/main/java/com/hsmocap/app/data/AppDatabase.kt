package com.hsmocap.app.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [
        WordEntity::class,
        StudyStateEntity::class,
        PendingActionEntity::class,
        CommunityPostEntity::class,
        CommunityCommentEntity::class,
        SyncMetadataEntity::class,
    ],
    version = 9,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun wordDao(): WordDao
    abstract fun studyStateDao(): StudyStateDao
    abstract fun pendingActionDao(): PendingActionDao
    abstract fun communityPostDao(): CommunityPostDao
    abstract fun communityCommentDao(): CommunityCommentDao
    abstract fun syncMetadataDao(): SyncMetadataDao

    companion object {
        @Volatile
        private var instance: AppDatabase? = null

        fun get(context: Context): AppDatabase {
            return instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "wordy_native.db",
                )
                    .allowMainThreadQueries()
                    .fallbackToDestructiveMigration(true)
                    .build()
                    .also { instance = it }
            }
        }
    }
}
