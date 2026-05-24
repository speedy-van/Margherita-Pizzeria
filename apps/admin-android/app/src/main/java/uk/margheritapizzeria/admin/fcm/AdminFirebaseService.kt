package uk.margheritapizzeria.admin.fcm

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import uk.margheritapizzeria.admin.MargheritaAdminApp

class AdminFirebaseService : FirebaseMessagingService() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onNewToken(token: String) {
        val container = (applicationContext as? MargheritaAdminApp)?.container ?: return
        scope.launch {
            runCatching {
                container.devicesRepository.register(token)
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val type = data["type"].orEmpty()
        val reference = data["reference"]
        val (title, body) = when (type) {
            "new_order" -> {
                val ref = reference?.let { "#$it" } ?: ""
                "New order $ref".trim() to "A new order has been placed. Tap to open."
            }
            "new_booking" -> {
                val ref = reference?.let { "#$it" } ?: ""
                "New booking $ref".trim() to "A new booking request was received."
            }
            else -> {
                val n = message.notification
                (n?.title ?: data["title"] ?: "Margherita admin") to
                    (n?.body ?: data["body"] ?: "You have a new admin alert.")
            }
        }
        AdminNotifier.showAlert(applicationContext, title, body)
    }
}
