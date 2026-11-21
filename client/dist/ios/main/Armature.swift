// Client Name :: main (Main family). Built with Armature engine 1.0.0. Generated, do not edit.
import SwiftUI

extension Color {
    init(light: (Double, Double, Double), dark: (Double, Double, Double)) {
        self.init(uiColor: UIColor { $0.userInterfaceStyle == .dark
            ? UIColor(red: dark.0, green: dark.1, blue: dark.2, alpha: 1)
            : UIColor(red: light.0, green: light.1, blue: light.2, alpha: 1) })
    }
}

public enum Armature {
    public static let background = Color(light: (0.9725, 0.9765, 0.9804), dark: (0.0510, 0.0588, 0.0667))
    public static let foreground = Color(light: (0.0863, 0.0980, 0.1098), dark: (0.9333, 0.9412, 0.9490))
    public static let card = Color(light: (1.0000, 1.0000, 1.0000), dark: (0.0863, 0.0980, 0.1098))
    public static let cardForeground = Color(light: (0.0863, 0.0980, 0.1098), dark: (0.9333, 0.9412, 0.9490))
    public static let popover = Color(light: (1.0000, 1.0000, 1.0000), dark: (0.1294, 0.1451, 0.1608))
    public static let popoverForeground = Color(light: (0.0863, 0.0980, 0.1098), dark: (0.9333, 0.9412, 0.9490))
    public static let primary = Color(light: (0.1137, 0.3059, 0.8471), dark: (0.5608, 0.7098, 0.9490))
    public static let primaryForeground = Color(light: (1.0000, 1.0000, 1.0000), dark: (0.0510, 0.0588, 0.0667))
    public static let secondary = Color(light: (0.9333, 0.9412, 0.9490), dark: (0.1294, 0.1451, 0.1608))
    public static let secondaryForeground = Color(light: (0.1294, 0.1451, 0.1608), dark: (0.9333, 0.9412, 0.9490))
    public static let muted = Color(light: (0.9333, 0.9412, 0.9490), dark: (0.0863, 0.0980, 0.1098))
    public static let mutedForeground = Color(light: (0.3098, 0.3412, 0.3686), dark: (0.8078, 0.8275, 0.8471))
    public static let accent = Color(light: (0.8627, 0.9098, 0.9843), dark: (0.1294, 0.1451, 0.1608))
    public static let accentForeground = Color(light: (0.0863, 0.0980, 0.1098), dark: (0.5608, 0.7098, 0.9490))
    public static let destructive = Color(light: (0.7059, 0.1373, 0.0941), dark: (0.9569, 0.6039, 0.6039))
    public static let destructiveForeground = Color(light: (1.0000, 1.0000, 1.0000), dark: (0.0510, 0.0588, 0.0667))
    public static let border = Color(light: (0.8078, 0.8275, 0.8471), dark: (0.1294, 0.1451, 0.1608))
    public static let input = Color(light: (0.4157, 0.4510, 0.4863), dark: (0.4157, 0.4510, 0.4863))
    public static let ring = Color(light: (0.1137, 0.3059, 0.8471), dark: (0.5608, 0.7098, 0.9490))
    public static let highlight = Color(light: (0.1137, 0.3059, 0.8471), dark: (0.5608, 0.7098, 0.9490))

    public enum Space {
        public static let s0: CGFloat = 0
        public static let s1: CGFloat = 4
        public static let s2: CGFloat = 8
        public static let s3: CGFloat = 12
        public static let s4: CGFloat = 16
        public static let s5: CGFloat = 20
        public static let s6: CGFloat = 24
        public static let s8: CGFloat = 32
        public static let s10: CGFloat = 40
        public static let s12: CGFloat = 48
        public static let s16: CGFloat = 64
        public static let s20: CGFloat = 80
    }
    public static let touchMin: CGFloat = 48
    public static let radius: CGFloat = 8
    public static let radiusContainer: CGFloat = 12
    /// Base point sizes. Use with .font(.custom(name, size:, relativeTo:)) so Dynamic Type scales them.
    public enum TypeScale {
        public static let caption: CGFloat = 14
        public static let label: CGFloat = 16
        public static let body: CGFloat = 18
        public static let bodyLg: CGFloat = 20
        public static let titleSm: CGFloat = 22
        public static let title: CGFloat = 28
        public static let headline: CGFloat = 35
        public static let display: CGFloat = 44
        public static let displayLg: CGFloat = 55
    }
}
