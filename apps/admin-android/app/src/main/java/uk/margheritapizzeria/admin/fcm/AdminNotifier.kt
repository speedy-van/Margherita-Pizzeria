package uk.margheritapizzeria.admin.fcm

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import uk.margheritapizzeria.admin.R
import uk.margheritapizzeria.admin.alerts.AdminAlertActivity

object AdminNotifier {
    const val CHANNEL_ID = "admin_alerts"
    private const val NOTIFICATION_ID = 4242

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return
        val soundUri: Uri = Uri.parse(
            "android.resource://" + context.packageName + "/" + R.raw.new_order_alert,
        )
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Admin alerts",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Lock-screen alerts for new orders and bookings."
            enableLights(true)
            enableVibration(true)
            setBypassDnd(true)
            setSound(
                soundUri,
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build(),
            )
        }
        nm.createNotificationChannel(channel)
    }

    fun showAlert(context: Context, title: String, body: String) {
        ensureChannel(context)
        val alertIntent = AdminAlertActivity.newIntent(context, title, body)
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or
            (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        val fullScreen = PendingIntent.getActivity(context, 0, alertIntent, flags)
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setContentIntent(fullScreen)
            .setFullScreenIntent(fullScreen, true)
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        nm?.notify(NOTIFICATION_ID, builder.build())

        // Best-effort: also try to launch the alert activity directly so the
        // pop-up is shown when the app is in the foreground (Android skips
        // setFullScreenIntent in that case).
        try {
            context.startActivity(alertIntent)
        } catch (_: Throwable) {
            // ignore — the notification is the fallback.
        }
    }
}
