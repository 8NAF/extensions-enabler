import { window } from 'vscode'

import { getSelectTemplatesMaterials } from '@actions'
import { Command, Stage, StagesQueue } from '@core'
import { GlobalStorage, WorkspaceStorage } from '@data-sources'
import { TemplateIds } from '@types'

function getCommand(
	globalStorage: GlobalStorage,
	workspaceStorage: WorkspaceStorage,
) {
	const command = new Command('apply')

	// TODO: apply template to a specified workspace
	// TODO: install missing extensions
	// TODO: restart vscode to refresh extensions
	async function onApply(
		templateIds: TemplateIds | undefined = undefined,
		restartMessage = '✅ Apply template successfully. 🔄 Please restart VSCode.',
	) {
		const { cleanup: cleanupSelectTemplates, selectTemplates } =
			getSelectTemplatesMaterials.call(command, {
				canSelectMany: true,
			})

		async function applyTemplate(this: Stage) {
			const { exitCode, manager, nextCode } = this
			const { globalStorage } = manager

			const templateIds = manager.getStorage<TemplateIds>(
				'templateIds',
				new Set(),
			)
			if (templateIds.size === 0) {
				window.showErrorMessage(`⛔ No template is selected`)
				return exitCode
			}

			const { enabledExtensions, disabledExtensions } =
				await globalStorage.splitExtensions(templateIds)

			const result = await workspaceStorage
				.applyTemplates({
					templateIds,
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
			templateIds ? Stage.SkippedStage : selectTemplates,
			applyTemplate,
		])

		stages.setStorages({ templateIds })
		await stages.exec()

		cleanupSelectTemplates()
	}

	command.onExecute = onApply
	return command
}

export { getCommand }
