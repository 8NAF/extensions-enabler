import { Disposable, window } from 'vscode'

import {
	createQuickPick,
	createInputBox,
	CreateInputBoxOptions,
} from '@actions'
import { Command, Stage } from '@commands'
import { Buttons } from '@paths'
import { TemplateId, TemplateIds, TemplateName } from '@types'
import { toQuickPickItem, toTemplateId } from '@utils/converter'

function getNameTemplateMaterials(
	createInputBoxOptions: CreateInputBoxOptions,
) {
	const inputBox = createInputBox(createInputBoxOptions)

	async function nameTemplate(this: Stage) {
		const { exitCode, nextCode, currentCode, prevCode, manager } = this
		const { globalStorage } = manager

		if (manager.isInFirstStage) {
			inputBox.buttons = [Buttons.Close]
		} else {
			inputBox.buttons = [Buttons.Back, Buttons.Close]
		}

		const templateId = manager.getStorage<TemplateId>('templateId', '')
		const templateName = manager.getStorage<TemplateName>(
			'templateName',
			globalStorage.getTemplateValue(templateId).name,
		)

		inputBox.value = templateName
		inputBox.show()

		const disposables = [] as Disposable[]
		const nextStageCode = await new Promise<number>(resolve => {
			disposables.push(
				inputBox.onDidHide(() => {
					resolve(exitCode)
				}),

				inputBox.onDidTriggerButton(({ tooltip }) => {
					const isBackButton = tooltip === Buttons.Back.tooltip
					resolve(isBackButton ? prevCode : exitCode)
				}),

				inputBox.onDidAccept(() => {
					if (inputBox.isValid()) {
						manager.setStorages({ templateName: inputBox.value })
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
		cleanup: () => inputBox.dispose(),
		nameTemplate,
	}
}

function getSelectTemplatesMaterials(this: Command, canSelectMany: boolean) {
	const quickPick = createQuickPick({
		title: `Select template you want to ${this.actionName}`,
		canSelectMany,
		ignoreFocusOut: false,
	})

	const command = this
	let isFirstExecution = true

	async function selectTemplates(this: Stage) {
		const { exitCode, nextCode, currentCode, prevCode, manager } = this
		const { globalStorage } = manager

		if (manager.isInFirstStage) {
			quickPick.buttons = [Buttons.Close]
		} else {
			quickPick.buttons = [Buttons.Close, Buttons.Back]
		}

		if (isFirstExecution) {
			quickPick.items = globalStorage
				.getAllTemplates()
				.map(template => toQuickPickItem(template))
			isFirstExecution = false
		} else {
			const needReassign = manager.getStorage<
				(hasChangeStage: boolean) => boolean
			>('needReassign', () => true)

			if (needReassign(manager.hasChangeStage)) {
				quickPick.items = globalStorage
					.getAllTemplates()
					.map(template => toQuickPickItem(template))
			} else {
				// QuickPick does not render items when reshowing,
				// so it need to be reassigned items
				quickPick.items = quickPick.items
			}
		}
		quickPick.selectedItems = quickPick.selectedItems

		if (quickPick.items.length === 0) {
			window.showInformationMessage(
				`⭕ No templates to ${command.actionName}.`,
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
					if (!quickPick.isValid()) {
						return resolve(currentCode)
					}

					const data = canSelectMany
						? {
								templateIds: quickPick.selectedItems.reduce(
									(set, item) => set.add(toTemplateId(item)),
									new Set() as TemplateIds,
								),
						  }
						: {
								templateId: toTemplateId(
									quickPick.selectedItems[0],
								),
						  }
					manager.setStorages(data)

					resolve(nextCode)
				}),
			)
		})

		// unsubscribe all events to avoid duplicate callback
		disposables.forEach(disposable => disposable.dispose())

		return nextStageCode
	}

	return {
		cleanup: () => quickPick.dispose(),
		selectTemplates,
	}
}

export { getNameTemplateMaterials, getSelectTemplatesMaterials }
