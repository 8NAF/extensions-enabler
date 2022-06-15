import { nanoid } from 'nanoid'
import { commands, window } from 'vscode'

import {
	getNameTemplateMaterials,
	getSaveOneToGlobalStorageMaterials,
	getSelectTemplatesMaterials,
} from '@actions'
import { Command, myCommands } from '@commands'
import { GlobalStorage } from '@data-sources'
import { TemplateId } from '@types'
import { Stage, StagesQueue } from './.stage'

function getCommand(globalStorage: GlobalStorage) {
	const command = new Command('clone')

	async function onClone() {
		const templateId = nanoid()

		const { cleanup: cleanupSelectTemplates, selectTemplates } =
			getSelectTemplatesMaterials.call(command, {
				canSelectMany: false,
			})

		async function selectTemplate(
			this: ThisParameterType<typeof selectTemplates>,
		) {
			const nextStageCode = await selectTemplates.call(this)
			const { manager } = this
			const { globalStorage } = manager

			if (nextStageCode === this.nextCode) {
				const srcTemplateId = manager.getStorage<TemplateId>(
					'templateId',
					'',
				)
				const templateValue =
					globalStorage.getTemplateValue(srcTemplateId)

				manager.setStorages({
					templateName: `${templateValue.name} - copy`,
					templateExtensions: templateValue.extensions,
					templateId,
				})
			}

			return nextStageCode
		}

		const { cleanup: cleanupNameTemplate, nameTemplate } =
			getNameTemplateMaterials({
				title: 'Name your template',
				placeholder: 'your template name',
				getAllTemplateNames: () => globalStorage.getAllTemplateNames(),
			})

		const saveOneToGlobalStorage =
			getSaveOneToGlobalStorageMaterials.call(command)

		async function askUserEditTemplate(this: Stage) {
			const action = await window.showInformationMessage(
				'✅ Clone template successfully. 📝 Do you want to edit this template ?',
				'Edit',
				'Dismiss',
			)

			const { exitCode, nextCode } = this
			if (action !== 'Edit') return nextCode
			return commands
				.executeCommand(myCommands.edit.name, templateId)
				.then(
					() => nextCode,
					() => exitCode,
				)
		}

		const stages = new StagesQueue(globalStorage, [
			selectTemplate,
			nameTemplate,
			saveOneToGlobalStorage,
			askUserEditTemplate,
		])
		await stages.exec()

		cleanupSelectTemplates()
		cleanupNameTemplate()
	}

	command.onExecute = onClone
	return command
}

export { getCommand }
