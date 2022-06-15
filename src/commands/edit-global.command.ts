import {
	getEditGlobalTemplateToGlobalStorageMaterials,
	getSelectExtensionsMaterials,
} from '@actions'
import { Command } from '@commands'
import { GlobalStorage } from '@data-sources'
import { StagesQueue } from './.stage'

function getCommand(globalStorage: GlobalStorage) {
	const command = new Command('editGlobal')

	async function onAddGlobal() {
		const { cleanup, selectExtensions } = getSelectExtensionsMaterials.call(
			command,
			false,
		)

		const editGlobalTemplate =
			getEditGlobalTemplateToGlobalStorageMaterials()

		const stages = new StagesQueue(globalStorage, [
			selectExtensions,
			editGlobalTemplate,
		])
		stages.setStorages({ templateId: GlobalStorage.globalTemplateId })
		await stages.exec()

		cleanup()
	}

	command.onExecute = onAddGlobal
	return command
}

export { getCommand }
