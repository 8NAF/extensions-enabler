import { window } from 'vscode'

import { getSelectTemplatesMaterials } from '@actions'
import { Command } from '@commands'
import { GlobalStorage, WorkspaceStorage } from '@data-sources'
import { TemplateId } from '@types'
import { Stage, StagesQueue } from './.stage'

function getCommand(
	globalStorage: GlobalStorage,
	workspaceStorage: WorkspaceStorage,
) {
	const command = new Command('apply')

	// TODO: apply template to a specified workspace
	// TODO: apply multiple templates
	// TODO: install missing extensions
	// TODO: reload to refresh extensions
	async function onApply(
		templateId: TemplateId | undefined = undefined,
		restartMessage = '✅ Apply template successfully. 🔄 Please restart VSCode.',
	) {
		const { cleanup: cleanupSelectTemplates, selectTemplates } =
			getSelectTemplatesMaterials.call(command, {
				canSelectMany: false,
			})

		async function applyTemplate(this: Stage) {
			const { exitCode, manager, nextCode } = this
			const { globalStorage } = manager

			const templateId = manager.getStorage<TemplateId>('templateId', '')
			if (templateId === '') {
				window.showErrorMessage(`⛔ Template id must be not empty.`)
				return exitCode
			}

			const { enabledExtensions, disabledExtensions } =
				await globalStorage.splitExtensions(templateId)

			const result = await workspaceStorage
				.applyTemplate({
					templateId,
					enabledExtensions,
					disabledExtensions,
				})
				.catch((e: Error) => e)

			if (result instanceof Error) {
				console.error(result)
				window.showErrorMessage(
					`🚫 Can not apply template.\nReason: ${result.message}`,
				)
				return exitCode
			}

			// NOTE: workbench.action.reloadWindow command
			// can not make VSCode reload extensions,
			// so need user close and open VSCode
			window.showInformationMessage(restartMessage)
			return nextCode
		}

		const stages = new StagesQueue(globalStorage, [
			templateId ? undefined : selectTemplates,
			applyTemplate,
		])

		stages.setStorages({ templateId })
		await stages.exec()

		cleanupSelectTemplates()
	}

	command.onExecute = onApply
	return command
}

export { getCommand }
