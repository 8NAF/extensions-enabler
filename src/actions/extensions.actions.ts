import { commands, Disposable, window } from 'vscode'

import { createQuickPick, getQuickPickItems } from '@actions'
import { Command, Stage } from '@commands'
import { GlobalStorage } from '@data-sources'
import { Buttons } from '@paths'
import { TemplateId } from '@types'
import { toExtension } from '@utils/converter'

/**
 *
 * @param required - require select at least one item.
 */
function getSelectExtensionsMaterials(this: Command, required = true) {
	const quickPick = createQuickPick({
		title: 'Select all the extensions you want to enable',
		canSelectMany: true,
		ignoreFocusOut: true,
		required,
		onDidTriggerItemButton: async ({ item, button }) => {
			if (button.tooltip === Buttons.Information.tooltip) {
				const { id } = toExtension(item)

				// open in a tab
				//commands.executeCommand('extension.open', id)
				//env.openExternal(Uri.parse(`vscode:extension/${id}`))

				// NOTE: this command is used instead of the above two commands
				// because QuickPick will cover the tab of the opened extension
				await commands.executeCommand(
					// open in the extensions activity bar
					'workbench.extensions.action.showExtensionsWithIds',
					[id],
				)
			}
		},
	})

	const command = this
	async function selectExtensions(this: Stage) {
		const { exitCode, prevCode, nextCode, currentCode, manager } = this
		const { globalStorage } = manager

		if (manager.isInFirstStage) {
			quickPick.buttons = [Buttons.Close]
		} else {
			quickPick.buttons = [Buttons.Back, Buttons.Close]
		}

		const templateId = manager.getStorage<TemplateId>('templateId', '')
		if (templateId === '') {
			window.showErrorMessage(`⛔ Template id must be not empty.`)
			return exitCode
		}

		if (manager.hasChangeStage) {
			const applyGlobalTemplate = manager.getStorage<boolean>(
				'applyGlobalTemplate',
				false,
			)

			const extensionItems = await getQuickPickItems({
				enabledExtensionIds: globalStorage.getExtensionIds(templateId),
				globalExtensionIds: globalStorage.getExtensionIds(
					GlobalStorage.globalTemplateId,
				),
				applyGlobalTemplate,
			})

			const enabledExtensionItems = extensionItems.filter(e => e.picked)

			quickPick.items = extensionItems
			quickPick.selectedItems = enabledExtensionItems
		}

		if (quickPick.items.length === 0) {
			window.showInformationMessage(
				`⭕ No extensions to ${command.actionName}.`,
			)
			return exitCode
		}

		quickPick.show()

		const disposables = [] as Disposable[]
		const nextStageCode = await new Promise<number>(resolve => {
			disposables.push(
				quickPick.onDidHide(() => {
					resolve(exitCode)
				}),

				quickPick.onDidTriggerButton(({ tooltip }) => {
					const isBackButton = tooltip === Buttons.Back.tooltip
					resolve(isBackButton ? prevCode : exitCode)
				}),

				quickPick.onDidAccept(() => {
					if (quickPick.isValid()) {
						this.manager.setStorages({
							templateExtensions:
								quickPick.selectedItems.map(toExtension),
						})
						return resolve(nextCode)
					}
					resolve(currentCode)
				}),
			)
		})

		// unsubscribe all events to avoid duplicate callback
		disposables.forEach(disposable => disposable.dispose())

		return nextStageCode
	}

	return {
		cleanup: () => quickPick.dispose(),
		selectExtensions,
	}
}

export { getSelectExtensionsMaterials }
