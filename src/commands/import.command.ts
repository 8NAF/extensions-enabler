import { window } from 'vscode'

import { getSaveManyToGlobalStorageMaterials } from '@actions'
import { Command } from '@commands'
import { GlobalStorage, loadJson } from '@data-sources'
import { validate } from '@utils/validator'
import { Stage, StagesQueue } from './.stage'

function getCommand(globalStorage: GlobalStorage) {
	const command = new Command('import')

	async function onImport() {
		const saveManyToGlobalStorage =
			getSaveManyToGlobalStorageMaterials.call(command)

		const stages = new StagesQueue(globalStorage, [
			selectFile,
			loadData,
			saveManyToGlobalStorage,
		])
		await stages.exec()
	}

	async function selectFile(this: Stage) {
		const { exitCode, nextCode, manager } = this

		const uri = await window.showOpenDialog({
			title: 'Select a file',
			openLabel: 'Import',
			canSelectMany: false,
			filters: {
				JSON: ['json'],
			},
		})

		if (!uri) return exitCode

		manager.setStorages({
			selectedFile: uri[0].fsPath,
		})
		return nextCode
	}

	async function loadData(this: Stage) {
		const { exitCode, nextCode, manager } = this

		const selectedFile = manager.getStorage<string>('selectedFile', '')
		if (selectedFile === '') {
			window.showErrorMessage(`⚠ Please select a file to import.`)
			return exitCode
		}

		const data = await loadJson(selectedFile).catch((e: Error) => e)
		if (data instanceof Error) {
			window.showErrorMessage('⛔ Malformed data.')
			return exitCode
		}

		const isValid = validate(data)
		if (!isValid) {
			console.error(validate.errors)
			window.showErrorMessage('⛔ Malformed data.')

			return exitCode
		}

		manager.setStorages({ ...data })
		return nextCode
	}

	command.onExecute = onImport
	return command
}

export { getCommand }
