import { window } from 'vscode'

import {
	getDeleteManyFromGlobalStorageMaterials,
	getSelectTemplatesMaterials,
} from '@actions'
import { Command } from '@commands'
import { GlobalStorage } from '@data-sources'
import { Stage, StagesQueue } from './.stage'

function getCommand(globalStorage: GlobalStorage) {
	const command = new Command('delete')

	async function onDelete() {
		const { cleanup: cleanupSelectTemplates, selectTemplates } =
			getSelectTemplatesMaterials.call(command, {
				canSelectMany: true,
			})

		async function confirmDelete(this: Stage) {
			const result = await window.showInformationMessage(
				'❌ Do you really want to delete ?',
				'Yes',
				'No',
				'Back to select templates',
			)

			const { exitCode, nextCode, prevCode } = this

			switch (result) {
				case 'Yes':
					return nextCode
				case 'Back to select templates':
					return prevCode
				default:
					return exitCode
			}
		}

		const deleteManyFromGlobalStorage =
			getDeleteManyFromGlobalStorageMaterials.call(command)

		const stages = new StagesQueue(globalStorage, [
			selectTemplates,
			confirmDelete,
			deleteManyFromGlobalStorage,
		])

		stages.setStorages({
			needReassign: (hasChangeStage: boolean) => !hasChangeStage,
		})
		await stages.exec()

		cleanupSelectTemplates()
	}

	command.onExecute = onDelete
	return command
}

export { getCommand }
