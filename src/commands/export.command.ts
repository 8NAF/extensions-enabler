import { writeFile } from 'fs/promises'

import { Uri, window } from 'vscode'

import { getSelectTemplatesMaterials } from '@actions'
import { Command } from '@commands'
import { GlobalStorage } from '@data-sources'
import { ExportedData, TemplateIds } from '@types'
import { Stage, StagesQueue } from './.stage'

function getCommand(globalStorage: GlobalStorage) {
	const command = new Command('export')

	async function onExport() {
		const { cleanup: cleanupSelectTemplates, selectTemplates } =
			getSelectTemplatesMaterials.call(command, true)

		const stages = new StagesQueue(globalStorage, [
			selectTemplates,
			selectPath,
			saveFile,
		])
		await stages.exec()

		cleanupSelectTemplates()
	}

	async function selectPath(this: Stage) {
		const { nextCode, prevCode, manager } = this

		const result = await window.showSaveDialog({
			title: 'Export template(s)',
			defaultUri: Uri.file('exported-data.json'),
			saveLabel: 'Export',
			filters: {
				JSON: ['json'],
			},
		})
		if (result === undefined) return prevCode

		manager.setStorages({
			selectedPath: result.fsPath,
		})
		return nextCode
	}

	async function saveFile(this: Stage) {
		const { manager, exitCode } = this

		const exportedData = {
			templates: {},
		} as ExportedData

		const templateIds = manager.getStorage<TemplateIds>(
			'templateIds',
			new Set(),
		)
		const selectedPath = manager.getStorage<string>('selectedPath', '')

		if (templateIds.size === 0) {
			window.showErrorMessage(`✏ Please select at least one item.`)
			return exitCode
		}
		if (selectedPath === '') {
			window.showErrorMessage(`✏ Please select a path to export.`)
			return exitCode
		}

		templateIds.forEach(id => {
			exportedData.templates[id] = globalStorage.getTemplateValue(id)
		})

		// TODO: add option format JSON
		await writeFile(
			selectedPath,
			JSON.stringify(exportedData, undefined, '  '),
		)
			.then(() =>
				window.showInformationMessage(
					'✅ Export templates successfully.',
				),
			)
			.catch(e => {
				console.error(e)
				window.showInformationMessage('🚫 Export templates failed.')
			})

		return exitCode
	}

	command.onExecute = onExport
	return command
}

export { getCommand }
