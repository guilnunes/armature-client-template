// Client Name :: main (Main family). Built with Armature engine 1.0.0. Generated, do not edit.
package com.client.theme.main

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Roles that Material 3 has no slot for. Read with ArmatureTheme.extra */
@Immutable
data class ArmatureExtraColors(
    val background: Color,
    val foreground: Color,
    val card: Color,
    val cardForeground: Color,
    val popover: Color,
    val popoverForeground: Color,
    val primary: Color,
    val primaryForeground: Color,
    val secondary: Color,
    val secondaryForeground: Color,
    val muted: Color,
    val mutedForeground: Color,
    val accent: Color,
    val accentForeground: Color,
    val destructive: Color,
    val destructiveForeground: Color,
    val border: Color,
    val input: Color,
    val ring: Color,
    val highlight: Color,
)

val ArmatureLightExtra = ArmatureExtraColors(
    background = Color(0xFFF8F9FA),
    foreground = Color(0xFF16191C),
    card = Color(0xFFFFFFFF),
    cardForeground = Color(0xFF16191C),
    popover = Color(0xFFFFFFFF),
    popoverForeground = Color(0xFF16191C),
    primary = Color(0xFF1D4ED8),
    primaryForeground = Color(0xFFFFFFFF),
    secondary = Color(0xFFEEF0F2),
    secondaryForeground = Color(0xFF212529),
    muted = Color(0xFFEEF0F2),
    mutedForeground = Color(0xFF4F575E),
    accent = Color(0xFFDCE8FB),
    accentForeground = Color(0xFF16191C),
    destructive = Color(0xFFB42318),
    destructiveForeground = Color(0xFFFFFFFF),
    border = Color(0xFFCED3D8),
    input = Color(0xFF6A737C),
    ring = Color(0xFF1D4ED8),
    highlight = Color(0xFF1D4ED8),
)
val ArmatureDarkExtra = ArmatureExtraColors(
    background = Color(0xFF0D0F11),
    foreground = Color(0xFFEEF0F2),
    card = Color(0xFF16191C),
    cardForeground = Color(0xFFEEF0F2),
    popover = Color(0xFF212529),
    popoverForeground = Color(0xFFEEF0F2),
    primary = Color(0xFF8FB5F2),
    primaryForeground = Color(0xFF0D0F11),
    secondary = Color(0xFF212529),
    secondaryForeground = Color(0xFFEEF0F2),
    muted = Color(0xFF16191C),
    mutedForeground = Color(0xFFCED3D8),
    accent = Color(0xFF212529),
    accentForeground = Color(0xFF8FB5F2),
    destructive = Color(0xFFF49A9A),
    destructiveForeground = Color(0xFF0D0F11),
    border = Color(0xFF212529),
    input = Color(0xFF6A737C),
    ring = Color(0xFF8FB5F2),
    highlight = Color(0xFF8FB5F2),
)

val ArmatureLightScheme = lightColorScheme(
    background = Color(0xFFF8F9FA),
    onBackground = Color(0xFF16191C),
    surfaceContainerLow = Color(0xFFFFFFFF),
    onSurface = Color(0xFF16191C),
    surfaceContainerHigh = Color(0xFFFFFFFF),
    primary = Color(0xFF1D4ED8),
    onPrimary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFEEF0F2),
    onSecondaryContainer = Color(0xFF212529),
    surfaceVariant = Color(0xFFEEF0F2),
    onSurfaceVariant = Color(0xFF4F575E),
    tertiaryContainer = Color(0xFFDCE8FB),
    onTertiaryContainer = Color(0xFF16191C),
    error = Color(0xFFB42318),
    onError = Color(0xFFFFFFFF),
    outlineVariant = Color(0xFFCED3D8),
    outline = Color(0xFF6A737C),
    secondary = Color(0xFF1D4ED8),
    tertiary = Color(0xFF1D4ED8),
    surface = Color(0xFFF8F9FA),
    surfaceBright = Color(0xFFFFFFFF),
    surfaceDim = Color(0xFFEEF0F2),
    surfaceContainerLowest = Color(0xFFFFFFFF),
    surfaceContainer = Color(0xFFFFFFFF),
    surfaceContainerHighest = Color(0xFFEEF0F2),
    primaryContainer = Color(0xFFDCE8FB),
    onPrimaryContainer = Color(0xFF16191C),
    onSecondary = Color(0xFFFFFFFF),
    onTertiary = Color(0xFFF8F9FA),
    inverseSurface = Color(0xFF16191C),
    inverseOnSurface = Color(0xFFF8F9FA),
)
val ArmatureDarkScheme = darkColorScheme(
    background = Color(0xFF0D0F11),
    onBackground = Color(0xFFEEF0F2),
    surfaceContainerLow = Color(0xFF16191C),
    onSurface = Color(0xFFEEF0F2),
    surfaceContainerHigh = Color(0xFF212529),
    primary = Color(0xFF8FB5F2),
    onPrimary = Color(0xFF0D0F11),
    secondaryContainer = Color(0xFF212529),
    onSecondaryContainer = Color(0xFFEEF0F2),
    surfaceVariant = Color(0xFF16191C),
    onSurfaceVariant = Color(0xFFCED3D8),
    tertiaryContainer = Color(0xFF212529),
    onTertiaryContainer = Color(0xFF8FB5F2),
    error = Color(0xFFF49A9A),
    onError = Color(0xFF0D0F11),
    outlineVariant = Color(0xFF212529),
    outline = Color(0xFF6A737C),
    secondary = Color(0xFF8FB5F2),
    tertiary = Color(0xFF8FB5F2),
    surface = Color(0xFF0D0F11),
    surfaceBright = Color(0xFF16191C),
    surfaceDim = Color(0xFF16191C),
    surfaceContainerLowest = Color(0xFF16191C),
    surfaceContainer = Color(0xFF16191C),
    surfaceContainerHighest = Color(0xFF16191C),
    primaryContainer = Color(0xFF212529),
    onPrimaryContainer = Color(0xFF8FB5F2),
    onSecondary = Color(0xFF0D0F11),
    onTertiary = Color(0xFF0D0F11),
    inverseSurface = Color(0xFFEEF0F2),
    inverseOnSurface = Color(0xFF0D0F11),
)

object ArmatureDimens {
    val space0 = 0.dp
    val space1 = 4.dp
    val space2 = 8.dp
    val space3 = 12.dp
    val space4 = 16.dp
    val space5 = 20.dp
    val space6 = 24.dp
    val space8 = 32.dp
    val space10 = 40.dp
    val space12 = 48.dp
    val space16 = 64.dp
    val space20 = 80.dp
    val touchMin = 48.dp
    val touch = 56.dp
    val focusWidth = 2.dp
    val radiusComponent = 8.dp
    val radiusContainer = 12.dp
}

/** Sizes in sp so they follow the user's system font scale. Font families are wired in the app module (res/font). */
object ArmatureTypeScale {
    val caption = 14.sp
    val label = 16.sp
    val body = 18.sp
    val bodyLg = 20.sp
    val titleSm = 22.sp
    val title = 28.sp
    val headline = 35.sp
    val display = 44.sp
    val displayLg = 55.sp
}

val ArmatureShapes = Shapes(
    extraSmall = RoundedCornerShape(ArmatureDimens.radiusComponent),
    small = RoundedCornerShape(ArmatureDimens.radiusComponent),
    medium = RoundedCornerShape(ArmatureDimens.radiusContainer),
    large = RoundedCornerShape(ArmatureDimens.radiusContainer),
)

val LocalArmatureExtra = staticCompositionLocalOf { ArmatureLightExtra }

object ArmatureTheme {
    /** Family policy: "opt-in". Default for a new client; decide per brand. */
    const val DYNAMIC_COLOR_POLICY = "opt-in"
    val extra: ArmatureExtraColors @Composable get() = LocalArmatureExtra.current
}

@Composable
fun ArmatureTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    /** User setting. Ignored when the family policy is "never". */
    useWallpaperColors: Boolean = false,
    typography: Typography = Typography(),
    content: @Composable () -> Unit,
) {
    val allowDynamic = useWallpaperColors && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
    val scheme = when {
        allowDynamic && darkTheme -> dynamicDarkColorScheme(LocalContext.current)
        allowDynamic -> dynamicLightColorScheme(LocalContext.current)
        darkTheme -> ArmatureDarkScheme
        else -> ArmatureLightScheme
    }
    CompositionLocalProvider(LocalArmatureExtra provides if (darkTheme) ArmatureDarkExtra else ArmatureLightExtra) {
        MaterialTheme(colorScheme = scheme, typography = typography, shapes = ArmatureShapes, content = content)
    }
}
