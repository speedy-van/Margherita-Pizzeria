package uk.margheritapizzeria.admin.core.ui.format

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private val GBP: NumberFormat = NumberFormat.getCurrencyInstance(Locale.UK)

fun formatPence(pence: Int?): String {
    val value = (pence ?: 0) / 100.0
    return GBP.format(value)
}

private val ISO_INPUT = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.UK).apply {
    timeZone = TimeZone.getTimeZone("UTC")
}
private val SHORT_OUTPUT = SimpleDateFormat("d MMM, HH:mm", Locale.UK)

fun formatShortDateTime(isoUtc: String?): String {
    if (isoUtc.isNullOrBlank()) return "—"
    return runCatching {
        val trimmed = isoUtc.substringBefore('.').removeSuffix("Z")
        val date: Date = ISO_INPUT.parse(trimmed) ?: return@runCatching isoUtc
        SHORT_OUTPUT.format(date)
    }.getOrDefault(isoUtc)
}
