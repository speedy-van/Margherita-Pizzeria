package uk.margheritapizzeria.admin.menu.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import uk.margheritapizzeria.admin.menu.model.AdminMenuCategory
import uk.margheritapizzeria.admin.menu.model.AdminMenuItem
import uk.margheritapizzeria.admin.menu.model.MenuItemInput

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuItemEditorDialog(
    initial: AdminMenuItem?,
    categories: List<AdminMenuCategory>,
    onDismiss: () -> Unit,
    onSave: (MenuItemInput) -> Unit,
) {
    var name by remember { mutableStateOf(initial?.name.orEmpty()) }
    var description by remember { mutableStateOf(initial?.description.orEmpty()) }
    var priceText by remember {
        mutableStateOf(initial?.let { "%.2f".format(it.pricePence / 100.0) } ?: "")
    }
    var imageUrl by remember { mutableStateOf(initial?.imageUrl.orEmpty()) }
    var available by remember { mutableStateOf(initial?.available ?: true) }
    var allergensText by remember {
        mutableStateOf(initial?.allergens?.joinToString(", ").orEmpty())
    }
    var categoryId by remember { mutableStateOf(initial?.categoryId) }
    var categoryMenuOpen by remember { mutableStateOf(false) }

    val pricePence = priceText.replace(",", ".").toDoubleOrNull()?.let { (it * 100).toInt() }
    val canSave = name.isNotBlank() && pricePence != null && pricePence >= 0

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (initial == null) "New menu item" else "Edit menu item") },
        text = {
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .heightIn(max = 480.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2,
                )
                OutlinedTextField(
                    value = priceText,
                    onValueChange = { priceText = it.filter { ch -> ch.isDigit() || ch == '.' || ch == ',' } },
                    label = { Text("Price (£)") },
                    singleLine = true,
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                        keyboardType = KeyboardType.Decimal,
                    ),
                    modifier = Modifier.fillMaxWidth(),
                )
                ExposedDropdownMenuBox(
                    expanded = categoryMenuOpen,
                    onExpandedChange = { categoryMenuOpen = it },
                ) {
                    OutlinedTextField(
                        value = categories.firstOrNull { it.id == categoryId }?.name
                            ?: "Uncategorised",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Category") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryMenuOpen)
                        },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                    )
                    ExposedDropdownMenu(
                        expanded = categoryMenuOpen,
                        onDismissRequest = { categoryMenuOpen = false },
                    ) {
                        DropdownMenuItem(
                            text = { Text("Uncategorised") },
                            onClick = { categoryId = null; categoryMenuOpen = false },
                        )
                        categories.forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat.name) },
                                onClick = { categoryId = cat.id; categoryMenuOpen = false },
                            )
                        }
                    }
                }
                OutlinedTextField(
                    value = imageUrl,
                    onValueChange = { imageUrl = it },
                    label = { Text("Image URL (optional)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                OutlinedTextField(
                    value = allergensText,
                    onValueChange = { allergensText = it },
                    label = { Text("Allergens (comma separated)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                androidx.compose.foundation.layout.Row(
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
                ) {
                    Text("Available", modifier = Modifier.weight(1f))
                    Switch(checked = available, onCheckedChange = { available = it })
                }
                if (pricePence == null && priceText.isNotBlank()) {
                    Text(
                        "Enter a valid price.",
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Spacer(Modifier.height(4.dp))
                AssistChip(onClick = {}, label = { Text("Tap a chip to dismiss errors") }, enabled = false)
            }
        },
        confirmButton = {
            Button(
                enabled = canSave,
                onClick = {
                    if (pricePence == null) return@Button
                    val allergens = allergensText.split(",")
                        .map { it.trim() }
                        .filter { it.isNotEmpty() }
                    onSave(
                        MenuItemInput(
                            name = name.trim(),
                            description = description.trim().ifBlank { null },
                            pricePence = pricePence,
                            categoryId = categoryId,
                            imageUrl = imageUrl.trim().ifBlank { null },
                            available = available,
                            allergens = allergens,
                        ),
                    )
                },
            ) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}
