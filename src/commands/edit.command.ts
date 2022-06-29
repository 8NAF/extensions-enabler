import { commands, window } from 'vscode'

import {
	getEditOneToGlobalStorageMaterials,
	getSelectExtensionsMaterials,
	getSelectTemplatesMaterials,
} from '@actions'
import { Command, myCommands } from '@commands'
import { GlobalStorage, WorkspaceStorage } from '@data-sources'
import { TemplateId } from '@types'
import { Stage, StagesQueue } from './.stage'

function getCommand(
	globalStorage: GlobalStorage,
	workspaceStorage: WorkspaceStorage,
) {
	const command = new Command('edit')

	async function onEdit(templateId: TemplateId | undefined = undefined) {
		const { cleanup: cleanupSelectTemplates, selectTemplates } =
			getSelectTemplatesMaterials.call(command, {
				canSelectMany: false,
			})

		const { cleanup: cleanupSelectExtensions, selectExtensions } =
			getSelectExtensionsMaterials.call(command)

		const editOneToGlobalStorage =
			getEditOneToGlobalStorageMaterials.call(command)

		async function restartIfApply(this: Stage) {
			const { nextCode, manager, exitCode } = this

			const editedTemplateId = manager.getStorage('templateId', '')
			const appliedTemplateIds = workspaceStorage.getTemplateIds()

			if (!appliedTemplateIds.includes(editedTemplateId)) {
				window.showInformationMessage(`✅ Edit template successfully.`)
				return nextCode
			}

			return commands
				.executeCommand(
					myCommands.apply.name,
					appliedTemplateIds,
					'✅ Edit template successfully. ' +
						'🔄 This workspace is applying this template, ' +
						'please restart VSCode to take effects.',
				)
				.then(
					() => nextCode,
					() => exitCode,
				)
		}

		const stages = new StagesQueue(globalStorage, [
			templateId ? undefined : selectTemplates,
			selectExtensions,
			editOneToGlobalStorage,
			restartIfApply,
		])

		stages.setStorages({ templateId })
		await stages.exec()

		cleanupSelectTemplates()
		cleanupSelectExtensions()
	}

	command.onExecute = onEdit
	return command
}

export { getCommand }
