import { nanoid } from 'nanoid'
import { commands, window } from 'vscode'

import {
	getNameTemplateMaterials,
	getSaveOneToGlobalStorageMaterials,
	getSelectExtensionsMaterials,
} from '@actions'
import { myCommands } from '@commands'
import { Command, Stage, StagesQueue } from '@core'
import { GlobalStorage } from '@data-sources'

function getCommand(globalStorage: GlobalStorage) {
	const command = new Command('create')

	async function onCreate() {
		const templateId = nanoid()

		const { cleanup: cleanupNameTemplate, nameTemplate } =
			getNameTemplateMaterials({
				title: 'Name your template',
				placeholder: 'your template name',
				getAllTemplateNames: () => globalStorage.getAllTemplateNames(),
			})

		const { cleanup: cleanupSelectExtensions, selectExtensions } =
			getSelectExtensionsMaterials.call(command)

		const saveOneToGlobalStorage =
			getSaveOneToGlobalStorageMaterials.call(command)

		async function askUserApplyTemplate(this: Stage) {
			const { exitCode, nextCode } = this

			const action = await window.showInformationMessage(
				'✅ Create template successfully. 🧬 Do you want to apply this template ?',
				'Apply',
				'Dismiss',
			)

			if (action !== 'Apply') return exitCode

			await commands.executeCommand(myCommands.apply.name, templateId)
			return nextCode
		}

		const stages = new StagesQueue(globalStorage, [
			nameTemplate,
			selectExtensions,
			saveOneToGlobalStorage,
			askUserApplyTemplate,
		])

		stages.setStorages({ templateId, applyGlobalTemplate: true })
		await stages.exec()

		cleanupNameTemplate()
		cleanupSelectExtensions()
	}

	command.onExecute = onCreate
	return command
}

export { getCommand }
