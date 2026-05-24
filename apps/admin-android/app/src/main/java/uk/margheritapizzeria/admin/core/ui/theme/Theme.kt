package uk.margheritapizzeria.admin.core.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val LightScheme = lightColorScheme(
    primary = Crimson700,
    onPrimary = OffWhite,
    primaryContainer = Crimson900,
    onPrimaryContainer = OffWhite,
    secondary = Amber700,
    onSecondary = Charcoal900,
    secondaryContainer = Amber200,
    onSecondaryContainer = Charcoal900,
    tertiary = Amber500,
    onTertiary = Charcoal900,
    background = OffWhite,
    onBackground = Charcoal900,
    surface = OffWhite,
    onSurface = Charcoal900,
    surfaceVariant = Cream,
    onSurfaceVariant = Charcoal700,
    error = ErrorRed,
    onError = OffWhite,
    outline = Charcoal500,
)

private val DarkScheme = darkColorScheme(
    primary = Crimson500,
    onPrimary = OffWhite,
    primaryContainer = Crimson900,
    onPrimaryContainer = OffWhite,
    secondary = Amber500,
    onSecondary = Charcoal900,
    secondaryContainer = Amber700,
    onSecondaryContainer = OffWhite,
    tertiary = Amber200,
    onTertiary = Charcoal900,
    background = Charcoal900,
    onBackground = OffWhite,
    surface = Charcoal800,
    onSurface = OffWhite,
    surfaceVariant = Charcoal700,
    onSurfaceVariant = Cream,
    error = ErrorRed,
    onError = OffWhite,
    outline = Charcoal500,
)

private val AppTypography = Typography(
    headlineMedium = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 26.sp),
    headlineSmall = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 22.sp),
    titleLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 20.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.Medium, fontSize = 17.sp),
    bodyLarge = TextStyle(fontSize = 16.sp),
    bodyMedium = TextStyle(fontSize = 14.sp),
    labelLarge = TextStyle(fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
)

@Composable
fun MargheritaAdminTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val scheme = if (darkTheme) DarkScheme else LightScheme
    MaterialTheme(
        colorScheme = scheme,
        typography = AppTypography,
        content = content,
    )
}
