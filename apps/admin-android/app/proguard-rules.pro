# Keep Kotlinx Serialization metadata.
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

# Keep serializers and @Serializable classes.
-keepclasseswithmembers class **$$serializer { *; }
-keepclassmembers class ** {
    *** Companion;
}
-keepclasseswithmembers class ** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Retrofit & OkHttp standard rules (they ship their own consumer rules; this
# block is intentionally minimal — adjust if you add reflection later).
-dontwarn org.codehaus.mojo.animal_sniffer.IgnoreJRERequirement
