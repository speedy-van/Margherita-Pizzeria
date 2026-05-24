package uk.margheritapizzeria.admin

import android.app.Application
import uk.margheritapizzeria.admin.core.AppContainer
import uk.margheritapizzeria.admin.fcm.AdminNotifier

class MargheritaAdminApp : Application() {

    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
        AdminNotifier.ensureChannel(this)
    }
}
