package com.studyplanning.engine.model

import androidx.room.Entity
import androidx.room.PrimaryKey

enum class StudyMode {
    PLANNED, // طبق برنامه
    FREE     // آزاد
}

enum class SubjectType {
    ENGLISH,
    DENTISTRY,
    AI,
    GENERAL
}

val DENTISTRY_CATEGORIES = listOf(
    "ترمیم",
    "اندو",
    "بایومیمتیک",
    "ایمپلنت",
    "پروتز و روکش",
    "بلیچینگ",
    "کشیدن دندان",
    "تشخیص و طرح درمان",
    "دندانپزشکی کودکان"
)

val ENGLISH_BOOKS = listOf(
    "Interchange",
    "Interchange 1",
    "Interchange 2",
    "Interchange 3"
)

@Entity(tableName = "study_tasks")
data class StudyTask(
    @PrimaryKey val id: String,
    val date: String, // YYYY-MM-DD
    val startTime: String, // HH:mm
    val endTime: String, // HH:mm
    val durationMinutes: Int,
    val subject: SubjectType,
    val category: String? = null,
    val book: String? = null,
    val lesson: Int? = null,
    val title: String,
    val taskType: String,
    val completed: Boolean = false,
    val createdDate: String,
    val completedDate: String? = null,
    val reviewStage: Int? = null,
    val sourceTaskId: String? = null
)

@Entity(tableName = "spaced_reviews")
data class SpacedReview(
    @PrimaryKey val id: String,
    val sourceTaskId: String,
    val sourceTitle: String,
    val subject: SubjectType,
    val book: String? = null,
    val lesson: Int? = null,
    val category: String? = null,
    val reviewStage: Int, // 0: D0, 1: D+1, 2: D+3, 3: D+7, 4: D+14, 5: D+30
    val dueDate: String, // YYYY-MM-DD
    val completed: Boolean = false,
    val completedDate: String? = null
)

data class UserSettings(
    val studyStartTime: String = "08:00",
    val lunchStartTime: String = "13:00",
    val lunchDurationMinutes: Int = 60,
    val studyEndTime: String = "20:00",
    val defaultStudyMode: StudyMode = StudyMode.PLANNED,
    val tuesdayRestPreference: Boolean = true,
    val isConfigured: Boolean = false
)

data class StudyProgress(
    val currentChain: Int = 0,
    val longestChain: Int = 0,
    val totalStudyMinutes: Int = 0,
    val englishLessonsCompleted: Int = 0,
    val currentEnglishLessonIndex: Int = 0,
    val completedReviewsCount: Int = 0,
    val overdueReviewsCount: Int = 0
)
