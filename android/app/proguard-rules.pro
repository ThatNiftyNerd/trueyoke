# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# --- Capacitor (added for F-08 pentest remediation: enable R8 without
#     breaking the JS<->native bridge) ---
# Capacitor core + any plugin classes must survive minification: the bridge
# invokes @PluginMethod-annotated methods via reflection, so obfuscating or
# stripping them silently breaks native calls at runtime with no build error.
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin
-keepclassmembers class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod <methods>;
}
-keep class com.getcapacitor.plugin.** { *; }
-dontwarn com.getcapacitor.**

# WebView JS interface bridge (Capacitor's own JS-interface class already
# covered above via com.getcapacitor.**, this is the general-case safety net).
-keepclassmembers class * extends android.webkit.WebViewClient {
    public *;
}
