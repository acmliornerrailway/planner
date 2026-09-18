package com.studyplanning.engine.engine

import com.studyplanning.engine.model.*

/**
 * Deterministic Planning Engine for Android
 * Implements: Previous Plan + Completed Work + Incomplete Work + Due Reviews + Time Constraints = Updated Plan
 */
object PlanningEngine {

    val SRS_OFFSETS = listOf(0, 1, 3, 7, 14, 30)

    fun computeStudyBlocks(
        studyStartTime: String,
        lunchStartTime: String,
        lunchDurationMinutes: Int,
        studyEndTime: String
    ): List<Pair<String, Int>> {
        val startMin = toMinutes(studyStartTime)
        val endMin = toMinutes(studyEndTime)
        val lunchStart = toMinutes(lunchStartTime)
        val lunchEnd = lunchStart + lunchDurationMinutes

        val slots = mutableListOf<Pair<String, Int>>()
        var cursor = startMin

        while (cursor < endMin) {
            // Jump over lunch
            if (cursor in lunchStart until lunchEnd) {
                cursor = lunchEnd
                continue
            }

            val isBefore1500 = cursor < 15 * 60
            val targetDuration = if (isBefore1500) 120 else 90
            val breakDuration = 20

            val available = if (cursor < lunchStart && cursor + targetDuration > lunchStart) {
                lunchStart - cursor
            } else {
                Math.min(targetDuration, endMin - cursor)
            }

            if (available >= 45) {
                slots.add(Pair(toTime(cursor), available))
                cursor += available + breakDuration
            } else {
                cursor += breakDuration
            }
        }
        return slots
    }

    fun createSpacedReviews(task: StudyTask): List<SpacedReview> {
        val reviews = mutableListOf<SpacedReview>()
        for (stage in 1 until SRS_OFFSETS.size) {
            val offset = SRS_OFFSETS[stage]
            reviews.add(
                SpacedReview(
                    id = "rev_${task.id}_stage_$stage",
                    sourceTaskId = task.id,
                    sourceTitle = task.title,
                    subject = task.subject,
                    book = task.book,
                    lesson = task.lesson,
                    category = task.category,
                    reviewStage = stage,
                    dueDate = task.date // calculated offset in actual date library
                )
            )
        }
        return reviews
    }

    private fun toMinutes(time: String): Int {
        val parts = time.split(":").map { it.toInt() }
        return parts[0] * 60 + parts[1]
    }

    private fun toTime(min: Int): String {
        val h = min / 60
        val m = min % 60
        return "%02d:%02d".format(h, m)
    }
}
