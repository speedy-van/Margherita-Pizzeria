package uk.margheritapizzeria.admin.alerts

import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uk.margheritapizzeria.admin.MainActivity
import uk.margheritapizzeria.admin.R
import uk.margheritapizzeria.admin.core.ui.theme.MargheritaAdminTheme

/**
 * Full-screen activity used to surface a new-order / new-booking alert.
 *
 * Shows over the lockscreen, turns the screen on, plays the bundled alarm
 * tone in an UNLIMITED loop until the admin taps Dismiss or Open. Also
 * vibrates in a repeating pattern. Designed to be launched either via
 * `Notification.setFullScreenIntent` (preferred) or directly from in-app
 * test buttons during development.
 */
class AdminAlertActivity : ComponentActivity() {

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Show over lockscreen + turn the screen on.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            val km = getSystemService(Context.KEYGUARD_SERVICE) as? KeyguardManager
            km?.requestDismissKeyguard(this, null)
        }
        @Suppress("DEPRECATION")
        window.addFlags(
            android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                android.view.WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                android.view.WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                android.view.WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD,
        )

        acquireWakeLock()
        startLoopingSound()
        startVibration()

        val title = intent.getStringExtra(EXTRA_TITLE) ?: "New order"
        val body = intent.getStringExtra(EXTRA_BODY)
            ?: "Tap to open the admin app."

        setContent {
            MargheritaAdminTheme {
                AlertScreen(
                    title = title,
                    body = body,
                    onOpen = {
                        val openIntent = Intent(this, MainActivity::class.java).apply {
                            addFlags(
                                Intent.FLAG_ACTIVITY_NEW_TASK or
                                    Intent.FLAG_ACTIVITY_CLEAR_TOP,
                            )
                        }
                        startActivity(openIntent)
                        finishAlert()
                    },
                    onDismiss = { finishAlert() },
                )
            }
        }
    }

    private fun startLoopingSound() {
        try {
            val uri: Uri = Uri.parse(
                "android.resource://" + packageName + "/" + R.raw.new_order_alert,
            )
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build(),
                )
                setDataSource(this@AdminAlertActivity, uri)
                isLooping = true
                setVolume(1.0f, 1.0f)
                prepare()
                start()
            }
        } catch (t: Throwable) {
            // Audio is best-effort — never crash the alert UI.
            mediaPlayer = null
        }
    }

    private fun startVibration() {
        val vib: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)
                ?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
        vibrator = vib
        if (vib == null || !vib.hasVibrator()) return
        try {
            val pattern = longArrayOf(0, 600, 400, 600, 400, 600, 1500)
            val effect = VibrationEffect.createWaveform(pattern, 0) // repeat from index 0
            vib.vibrate(effect)
        } catch (_: Throwable) {
            // ignore
        }
    }

    private fun acquireWakeLock() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager ?: return
            @Suppress("DEPRECATION")
            wakeLock = pm.newWakeLock(
                PowerManager.FULL_WAKE_LOCK or
                    PowerManager.ACQUIRE_CAUSES_WAKEUP or
                    PowerManager.ON_AFTER_RELEASE,
                "margherita:adminAlert",
            ).apply { acquire(10 * 60 * 1000L) }
        } catch (_: Throwable) {
            wakeLock = null
        }
    }

    private fun finishAlert() {
        stopAudioAndVibration()
        releaseWakeLock()
        finishAndRemoveTask()
    }

    private fun stopAudioAndVibration() {
        try {
            mediaPlayer?.let { mp ->
                if (mp.isPlaying) mp.stop()
                mp.reset()
                mp.release()
            }
        } catch (_: Throwable) {
            // ignore
        }
        mediaPlayer = null
        try {
            vibrator?.cancel()
        } catch (_: Throwable) {
            // ignore
        }
        vibrator = null
    }

    private fun releaseWakeLock() {
        try {
            wakeLock?.let { if (it.isHeld) it.release() }
        } catch (_: Throwable) {
            // ignore
        }
        wakeLock = null
    }

    override fun onDestroy() {
        stopAudioAndVibration()
        releaseWakeLock()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_BODY = "extra_body"

        /** Build an Intent that launches the alert as a brand-new task. */
        fun newIntent(context: Context, title: String, body: String): Intent {
            return Intent(context, AdminAlertActivity::class.java).apply {
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_NO_HISTORY,
                )
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_BODY, body)
            }
        }
    }
}

@Composable
private fun AlertScreen(
    title: String,
    body: String,
    onOpen: () -> Unit,
    onDismiss: () -> Unit,
) {
    Scaffold(
        containerColor = MaterialTheme.colorScheme.errorContainer,
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "🔔 MARGHERITA ADMIN",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onErrorContainer,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onErrorContainer,
            )
            Spacer(Modifier.height(12.dp))
            Text(
                text = body,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onErrorContainer,
            )
            Spacer(Modifier.height(36.dp))
            Button(
                onClick = onOpen,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error,
                    contentColor = MaterialTheme.colorScheme.onError,
                ),
            ) { Text("Open admin app") }
            Spacer(Modifier.height(8.dp))
            OutlinedButton(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Dismiss") }
        }
    }
}
