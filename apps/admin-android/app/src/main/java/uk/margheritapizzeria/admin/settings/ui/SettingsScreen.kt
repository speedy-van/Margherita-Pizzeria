package uk.margheritapizzeria.admin.settings.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import uk.margheritapizzeria.admin.alerts.AdminAlertActivity
import uk.margheritapizzeria.admin.core.ui.components.ErrorState
import uk.margheritapizzeria.admin.core.ui.components.LoadingState
import uk.margheritapizzeria.admin.core.ui.components.SectionCard
import uk.margheritapizzeria.admin.settings.model.AdminDaySchedule
import uk.margheritapizzeria.admin.settings.model.AdminOpeningHours
import uk.margheritapizzeria.admin.settings.model.AdminSettings
import uk.margheritapizzeria.admin.settings.model.AdminSettingsInput
import uk.margheritapizzeria.admin.settings.model.AdminTableUpdate
import uk.margheritapizzeria.admin.settings.model.AdminTimeSlotInput

@Composable
fun SettingsScreen(viewModel: SettingsViewModel) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    var showAddSlot by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.messages.collect { msg ->
            val text = when (msg) {
                is SettingsMessage.Info -> msg.text
                is SettingsMessage.Error -> msg.text
            }
            snackbarHostState.showSnackbar(text)
        }
    }

    Scaffold(snackbarHost = { SnackbarHost(snackbarHostState) }) { padding ->
        when {
            state.loading -> LoadingState(Modifier.padding(padding))
            state.error != null -> ErrorState(
                message = state.error?.message ?: "",
                onRetry = viewModel::refresh,
                modifier = Modifier.padding(padding),
            )
            else -> LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item { GeneralSettingsCard(state.settings, state.saving, viewModel::saveSettings) }
                item { TimeSlotsCard(state, viewModel, onAdd = { showAddSlot = true }) }
                item { TablesCard(state, viewModel) }
                item { AlertTestCard() }
            }
        }
    }

    if (showAddSlot) {
        AddTimeSlotDialog(
            onDismiss = { showAddSlot = false },
            onAdd = { type, time ->
                viewModel.addSlot(AdminTimeSlotInput(type = type, time = time))
                showAddSlot = false
            },
        )
    }
}

@Composable
private fun GeneralSettingsCard(
    settings: AdminSettings,
    saving: Boolean,
    onSave: (AdminSettingsInput) -> Unit,
) {
    var minDelivery by remember(settings) { mutableStateOf((settings.minDeliveryOrderPence / 100.0).toString()) }
    var deliveryFee by remember(settings) { mutableStateOf((settings.deliveryFeePence / 100.0).toString()) }
    var prepTime by remember(settings) { mutableStateOf(settings.prepTimeMinutes.toString()) }
    var deliveryTime by remember(settings) { mutableStateOf(settings.deliveryTimeMinutes.toString()) }
    var depositEnabled by remember(settings) { mutableStateOf(settings.depositEnabled) }
    var depositAmount by remember(settings) { mutableStateOf((settings.depositAmountPence / 100.0).toString()) }
    val hours = remember(settings) { mutableStateMapOf<String, AdminDaySchedule>().apply {
        put("mon", settings.openingHours.monday)
        put("tue", settings.openingHours.tuesday)
        put("wed", settings.openingHours.wednesday)
        put("thu", settings.openingHours.thursday)
        put("fri", settings.openingHours.friday)
        put("sat", settings.openingHours.saturday)
        put("sun", settings.openingHours.sunday)
    } }

    SectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("General", style = MaterialTheme.typography.titleMedium)
            DecimalField("Min delivery order (£)", minDelivery) { minDelivery = it }
            DecimalField("Delivery fee (£)", deliveryFee) { deliveryFee = it }
            IntField("Prep time (min)", prepTime) { prepTime = it }
            IntField("Delivery time (min)", deliveryTime) { deliveryTime = it }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Deposit enabled", modifier = Modifier.weight(1f))
                Switch(checked = depositEnabled, onCheckedChange = { depositEnabled = it })
            }
            if (depositEnabled) {
                DecimalField("Deposit amount (£)", depositAmount) { depositAmount = it }
            }
            Spacer(Modifier.height(4.dp))
            Text("Opening hours", style = MaterialTheme.typography.titleSmall)
            listOf(
                "mon" to "Mon", "tue" to "Tue", "wed" to "Wed", "thu" to "Thu",
                "fri" to "Fri", "sat" to "Sat", "sun" to "Sun",
            ).forEach { (key, label) ->
                val day = hours[key] ?: AdminDaySchedule()
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(label, modifier = Modifier.width(48.dp))
                        OutlinedTextField(
                            value = day.open,
                            onValueChange = { hours[key] = day.copy(open = it) },
                            label = { Text("Open") },
                            singleLine = true,
                            enabled = day.closed != true,
                            modifier = Modifier.weight(1f),
                        )
                        Spacer(Modifier.width(8.dp))
                        OutlinedTextField(
                            value = day.close,
                            onValueChange = { hours[key] = day.copy(close = it) },
                            label = { Text("Close") },
                            singleLine = true,
                            enabled = day.closed != true,
                            modifier = Modifier.weight(1f),
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Spacer(Modifier.width(48.dp))
                        Text("Closed", modifier = Modifier.weight(1f))
                        Switch(
                            checked = day.closed == true,
                            onCheckedChange = { hours[key] = day.copy(closed = it) },
                        )
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Button(
                enabled = !saving,
                onClick = {
                    onSave(
                        AdminSettingsInput(
                            minDeliveryOrderPence = poundsToPence(minDelivery),
                            deliveryFeePence = poundsToPence(deliveryFee),
                            prepTimeMinutes = prepTime.toIntOrNull() ?: 0,
                            deliveryTimeMinutes = deliveryTime.toIntOrNull() ?: 0,
                            depositEnabled = depositEnabled,
                            depositAmountPence = poundsToPence(depositAmount),
                            openingHours = AdminOpeningHours(
                                monday = hours["mon"] ?: AdminDaySchedule(),
                                tuesday = hours["tue"] ?: AdminDaySchedule(),
                                wednesday = hours["wed"] ?: AdminDaySchedule(),
                                thursday = hours["thu"] ?: AdminDaySchedule(),
                                friday = hours["fri"] ?: AdminDaySchedule(),
                                saturday = hours["sat"] ?: AdminDaySchedule(),
                                sunday = hours["sun"] ?: AdminDaySchedule(),
                            ),
                        ),
                    )
                },
            ) { Text(if (saving) "Saving…" else "Save settings") }
        }
    }
}

@Composable
private fun TimeSlotsCard(
    state: SettingsUiState,
    viewModel: SettingsViewModel,
    onAdd: () -> Unit,
) {
    SectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Time slots", style = MaterialTheme.typography.titleMedium, modifier = Modifier.weight(1f))
                TextButton(onClick = onAdd) { Text("Add") }
            }
            if (state.timeSlots.isEmpty()) {
                Text("No time slots yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                state.timeSlots.sortedWith(compareBy({ it.type }, { it.time })).forEach { slot ->
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text(slot.time, style = MaterialTheme.typography.bodyLarge)
                            Text(slot.type, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Switch(checked = slot.active, onCheckedChange = { viewModel.toggleSlot(slot) })
                    }
                }
            }
        }
    }
}

@Composable
private fun TablesCard(state: SettingsUiState, viewModel: SettingsViewModel) {
    SectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Tables", style = MaterialTheme.typography.titleMedium)
            if (state.tables.isEmpty()) {
                Text("No tables configured.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                state.tables.sortedBy { it.number }.forEach { table ->
                    var coversText by remember(table.id, table.maxCovers) {
                        mutableStateOf(table.maxCovers.toString())
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Table ${table.number}", modifier = Modifier.weight(1f))
                        OutlinedTextField(
                            value = coversText,
                            onValueChange = { coversText = it.filter { ch -> ch.isDigit() } },
                            label = { Text("Covers") },
                            singleLine = true,
                            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                keyboardType = KeyboardType.Number,
                            ),
                            modifier = Modifier.width(110.dp),
                        )
                        Spacer(Modifier.width(8.dp))
                        Switch(
                            checked = table.active,
                            onCheckedChange = {
                                viewModel.updateTable(AdminTableUpdate(id = table.id, active = it))
                            },
                        )
                    }
                    TextButton(
                        onClick = {
                            val parsed = coversText.toIntOrNull()
                            if (parsed != null && parsed != table.maxCovers) {
                                viewModel.updateTable(AdminTableUpdate(id = table.id, maxCovers = parsed))
                            }
                        },
                    ) { Text("Save covers") }
                }
            }
        }
    }
}

@Composable
private fun AlertTestCard() {
    val context = LocalContext.current
    SectionCard {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Alarm sound test", style = MaterialTheme.typography.titleMedium)
            Text(
                "Triggers the full-screen \"new order\" alert popup with looping " +
                    "sound until you dismiss it. Use this to verify the alarm " +
                    "works on this device before relying on it for real orders.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Spacer(Modifier.height(4.dp))
            Button(
                onClick = {
                    val intent = AdminAlertActivity.newIntent(
                        context = context,
                        title = "TEST: New order received",
                        body = "This is a test of the alarm pop-up. Tap " +
                            "Dismiss or Open to silence it.",
                    )
                    context.startActivity(intent)
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Trigger test alert") }
        }
    }
}

@Composable
private fun AddTimeSlotDialog(onDismiss: () -> Unit, onAdd: (String, String) -> Unit) {
    var type by remember { mutableStateOf("collection") }
    var time by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add time slot") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    listOf("collection", "booking").forEach { option ->
                        androidx.compose.material3.FilterChip(
                            selected = type == option,
                            onClick = { type = option },
                            label = { Text(option) },
                        )
                        Spacer(Modifier.width(6.dp))
                    }
                }
                OutlinedTextField(
                    value = time,
                    onValueChange = { time = it },
                    label = { Text("Time (HH:MM)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        },
        confirmButton = {
            Button(
                enabled = time.matches(Regex("""\d{2}:\d{2}""")),
                onClick = { onAdd(type, time) },
            ) { Text("Add") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
private fun DecimalField(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = { onChange(it.filter { ch -> ch.isDigit() || ch == '.' || ch == ',' }) },
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
            keyboardType = KeyboardType.Decimal,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}

@Composable
private fun IntField(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = { onChange(it.filter { ch -> ch.isDigit() }) },
        label = { Text(label) },
        singleLine = true,
        keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
            keyboardType = KeyboardType.Number,
        ),
        modifier = Modifier.fillMaxWidth(),
    )
}

private fun poundsToPence(text: String): Int =
    text.replace(",", ".").toDoubleOrNull()?.let { (it * 100).toInt() } ?: 0
