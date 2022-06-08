import { QuickPickItem, window, QuickPick, InputBox } from 'vscode'

import { GlobalStorage } from '@data-sources'
import { Buttons } from '@paths'
import { TemplateId, TemplateNames } from '@types'
import { getInstalledExtensionPackageJSONs } from '@utils/extension'
import { toQuickPickItem } from '@utils/converter'

type CreateQuickPickOptions = Partial<
	Pick<
		QuickPick<QuickPickItem>,
		| 'title'
		| 'canSelectMany'
		| 'ignoreFocusOut'
		| 'items'
		| 'selectedItems'
		| 'buttons'
	>
> & {
	onDidTriggerItemButton?: Parameters<
		QuickPick<QuickPickItem>['onDidTriggerItemButton']
	>[0]
}

/**
 * Create an {@link QuickPick} that must select at least one item.
 *
 * The QuickPick will automatically hide on did accept
 * if at least one item is selected.
 */
function createQuickPick({
	title = '',
	canSelectMany = false,
	ignoreFocusOut = false,
	items = [],
	selectedItems = [],
	onDidTriggerItemButton = undefined,
	buttons = [],
}: CreateQuickPickOptions) {
	const quickPick = window.createQuickPick() as ReturnType<
		typeof window.createQuickPick
	> & { isValid: () => boolean }

	quickPick.title = title
	quickPick.canSelectMany = canSelectMany
	quickPick.ignoreFocusOut = ignoreFocusOut
	quickPick.items = items
	quickPick.selectedItems = selectedItems
	quickPick.buttons = buttons
	if (onDidTriggerItemButton) {
		quickPick.onDidTriggerItemButton(onDidTriggerItemButton)
	}

	quickPick.onDidAccept(() => {
		if (quickPick.isValid()) {
			return quickPick.hide()
		}
		if (quickPick.canSelectMany) {
			window.showInformationMessage('✏ Please select at least one item.')
		}
	})

	Object.defineProperty(quickPick, 'isValid', {
		value: () => quickPick.selectedItems.length !== 0,
		writable: false,
		configurable: false,
	})

	return quickPick
}

type CreateInputBoxOptions = Partial<
	Pick<InputBox, 'title' | 'placeholder' | 'value' | 'buttons'> & {
		getAllTemplateNames: () => TemplateNames
	}
>

/**
 * Create an {@link InputBox} whose value is valid if
 * it is not empty and does not have the same name as any existing template.
 *
 * The InputBox will automatically hide on did accept if the value is valid.
 */
function createInputBox({
	title = '',
	placeholder = '',
	value = '',
	buttons = [],
	getAllTemplateNames = () => new Set(),
}: CreateInputBoxOptions) {
	const templateNames = getAllTemplateNames()
	function getValidationMessage(value: string) {
		return value === ''
			? 'Name must be not empty.'
			: templateNames.has(value)
			? 'Name already exists.'
			: ''
	}

	const inputBox = window.createInputBox() as ReturnType<
		typeof window.createInputBox
	> & { isValid: () => boolean }

	inputBox.title = title
	inputBox.placeholder = placeholder
	inputBox.value = value
	inputBox.buttons = buttons
	inputBox.onDidChangeValue(value => {
		inputBox.validationMessage = getValidationMessage(value)
	})

	inputBox.onDidAccept(() => {
		if (inputBox.isValid()) {
			return inputBox.hide()
		}
		inputBox.validationMessage = getValidationMessage(inputBox.value)
	})

	Object.defineProperty(inputBox, 'isValid', {
		writable: false,
		configurable: false,
		value: () =>
			inputBox.value !== '' && !templateNames.has(inputBox.value),
	})

	return inputBox
}

async function getQuickPickItems(
	globalStorage: GlobalStorage,
	templateId: TemplateId,
) {
	const enabledExtensionIds = globalStorage.getExtensionIds(templateId)
	const packageJSONs = await getInstalledExtensionPackageJSONs()

	return packageJSONs.map(packageJSON => {
		const { publisher, name } = packageJSON
		const id = `${publisher.toLowerCase()}.${name.toLowerCase()}`

		return toQuickPickItem(packageJSON, {
			picked: enabledExtensionIds.has(id),
			buttons: [Buttons.Information],
		})
	})
}

export {
	createQuickPick,
	createInputBox,
	getQuickPickItems,
	CreateInputBoxOptions,
}
