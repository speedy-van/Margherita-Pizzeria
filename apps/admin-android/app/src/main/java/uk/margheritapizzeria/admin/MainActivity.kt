package uk.margheritapizzeria.admin

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.lifecycleScope
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import uk.margheritapizzeria.admin.core.session.AuthState
import uk.margheritapizzeria.admin.core.ui.theme.MargheritaAdminTheme
import uk.margheritapizzeria.admin.navigation.AppNavGraph

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val container = (application as MargheritaAdminApp).container

        ensureFullScreenIntentPermission()

        lifecycleScope.launch(Dispatchers.IO) {
            // Wait until the user is signed in before registering this device.
            val state = container.sessionManager.state.first { it !is AuthState.Unknown }
            if (state is AuthState.SignedIn) {
                runCatching {
                    val token = FirebaseMessaging.getInstance().token.await()
                    container.devicesRepository.register(token)
                }
            }
        }

        setContent {
            MargheritaAdminTheme {
                AppNavGraph(container = container)
            }
        }
    }

    private fun ensureFullScreenIntentPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) return
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        if (nm.canUseFullScreenIntent()) return
        runCatching {
            val intent = Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT).apply {
                data = android.net.Uri.parse("package:$packageName")
            }
            startActivity(intent)
        }
    }
}
