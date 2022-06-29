import {
	getNameTemplateMaterials,
	getRenameOneToGlobalStorageMaterials,
	getSelectTemplatesMaterials,
} from '@actions'
import { Command, StagesQueue } from '@core'
import { GlobalStorage } from '@data-sources'

function getCommand(globalStorage: GlobalStorage) {
	const command = new Command('rename')

	async function onRename() {
		const { cleanup: cleanupSelectTemplates, selectTemplates } =
			getSelectTemplatesMaterials.call(command, {
				canSelectMany: false,
			})

		const { cleanup: cleanupNameTemplate, nameTemplate } =
			getNameTemplateMaterials({
				title: 'Rename your template',
				placeholder: 'new name',
				getAllTemplateNames: () => globalStorage.getAllTemplateNames(),
			})

		const renameOneToGlobalStorage =
			getRenameOneToGlobalStorageMaterials.call(command)

		const stages = new StagesQueue(globalStorage, [
			selectTemplates,
			nameTemplate,
			renameOneToGlobalStorage,
		])
		await stages.exec()

		cleanupSelectTemplates()
		cleanupNameTemplate()
	}

	command.onExecute = onRename
	return command
}

export { getCommand }
