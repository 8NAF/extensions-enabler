import { ProgressLocation, window } from 'vscode'

import { Command, Stage } from '@commands'
import {
	TemplateId,
	TemplateIds,
	TemplateName,
	Extension,
	Templates,
} from '@types'

function getSaveOneToGlobalStorageMaterials(this: Command) {
	const command = this
	return async function (this: Stage) {
		return window.withProgress(
			{
				location: ProgressLocation.Window,
				title: 'Saving template',
			},
			async progress => {
				progress.report({ increment: 0 })

				const { manager, exitCode, nextCode } = this
				const { globalStorage } = manager

				const templateId = manager.getStorage<TemplateId>(
					'templateId',
					'',
				)
				if (templateId === '') {
					progress.report({ increment: 100 })
					window.showErrorMessage(`⛔ Template id must be not empty.`)
					return exitCode
				}

				const keys = ['templateName', 'templateExtensions'] as const
				const defaultValues = globalStorage.getTemplateValue(templateId)

				const {
					templateName: name = defaultValues.name,
					templateExtensions: extensions = defaultValues.extensions,
				} = manager.getStorages<
					typeof keys,
					[TemplateName, Extension[]]
				>(keys)

				if (name === '' || extensions.length === 0) {
					progress.report({ increment: 100 })
					window.showErrorMessage(
						`⛔ Template name and extensions must be not empty.`,
					)
					return exitCode
				}

				return globalStorage
					.saveOne(templateId, { name, extensions })
					.then(() => {
						progress.report({ increment: 100 })
						return nextCode
					})
					.catch(async e => {
						progress.report({ increment: 100 })
						console.error(e)
						await window.showErrorMessage(
							`🚫 ${command.capitalizedActionName} template (${name}) failed.`,
						)
						return exitCode
					})
			},
		)
	}
}

function getEditOneToGlobalStorageMaterials(this: Command) {
	const command = this
	return async function (this: Stage) {
		return window.withProgress(
			{
				location: ProgressLocation.Window,
				title: 'Saving template',
			},
			async progress => {
				progress.report({ increment: 0 })

				const { manager, exitCode, nextCode } = this
				const { globalStorage } = manager

				const templateId = manager.getStorage<TemplateId>(
					'templateId',
					'',
				)
				if (templateId === '') {
					progress.report({ increment: 100 })
					window.showErrorMessage(`⛔ Template id must be not empty.`)
					return exitCode
				}

				const keys = ['templateName', 'templateExtensions'] as const
				const defaultValues = globalStorage.getTemplateValue(templateId)

				const {
					templateName: name = defaultValues.name,
					templateExtensions: extensions = defaultValues.extensions,
				} = manager.getStorages<
					typeof keys,
					[TemplateName, Extension[]]
				>(keys)

				if (name === '' || extensions.length === 0) {
					progress.report({ increment: 100 })
					window.showErrorMessage(
						`⛔ Template name and extensions must be not empty.`,
					)
					return exitCode
				}

				return globalStorage
					.editOne(templateId, extensions)
					.then(() => {
						progress.report({ increment: 100 })
						return nextCode
					})
					.catch(async e => {
						progress.report({ increment: 100 })
						console.error(e)
						await window.showErrorMessage(
							`🚫 ${command.capitalizedActionName} template (${name}) failed.`,
						)
						return exitCode
					})
			},
		)
	}
}

function getDeleteManyFromGlobalStorageMaterials(this: Command) {
	const command = this
	return async function (this: Stage) {
		return window.withProgress(
			{
				location: ProgressLocation.Window,
				title: 'Saving template',
			},
			async progress => {
				progress.report({ increment: 0 })

				const { manager, exitCode, nextCode } = this
				const { globalStorage } = manager

				const templateIds = manager.getStorage<TemplateIds>(
					'templateIds',
					new Set(),
				)

				if (templateIds.size === 0) {
					progress.report({ increment: 100 })
					window.showWarningMessage(`⭕ No templates to delete`)
					return exitCode
				}

				return globalStorage
					.deleteMany(templateIds)
					.then(async () => {
						progress.report({ increment: 100 })
						await window.showInformationMessage(
							`✅ ${command.capitalizedActionName} templates successfully.`,
						)
						return nextCode
					})
					.catch(async e => {
						progress.report({ increment: 100 })
						console.error(e)
						await window.showErrorMessage(
							`🚫 ${command.capitalizedActionName} templates failed.`,
						)
						return exitCode
					})
			},
		)
	}
}

function getRenameOneToGlobalStorageMaterials(this: Command) {
	const command = this
	return async function (this: Stage) {
		return window.withProgress(
			{
				location: ProgressLocation.Window,
				title: 'Saving template',
			},
			async progress => {
				progress.report({ increment: 0 })

				const { exitCode, manager, nextCode } = this
				const { globalStorage } = manager

				const keys = ['templateName', 'templateId'] as const
				const { templateName: newName = '', templateId = '' } =
					manager.getStorages<
						typeof keys,
						[TemplateName, TemplateId]
					>(keys)

				if (newName === '' || templateId === '') {
					progress.report({ increment: 100 })
					window.showErrorMessage(
						`⛔ Template name and id must be not empty.`,
					)
					return exitCode
				}

				const oldName = globalStorage.getTemplateValue(templateId).name

				return globalStorage
					.renameOne(templateId, newName)
					.then(async () => {
						progress.report({ increment: 100 })
						await window.showInformationMessage(
							`✅ ${command.capitalizedActionName} (${oldName}) to (${newName}) successfully.`,
						)
						return nextCode
					})
					.catch(async e => {
						progress.report({ increment: 100 })
						console.error(e)
						await window.showErrorMessage(
							`🚫 ${command.capitalizedActionName} (${oldName}) to (${newName}) failed.`,
						)
						return exitCode
					})
			},
		)
	}
}

function getSaveManyToGlobalStorageMaterials(this: Command) {
	const command = this
	return async function (this: Stage) {
		return window.withProgress(
			{
				location: ProgressLocation.Window,
				title: 'Saving template',
			},
			async progress => {
				progress.report({ increment: 0 })

				const { exitCode, manager, nextCode } = this
				const { globalStorage } = manager

				const templates = manager.getStorage<Templates>('templates', {})
				if (Object.keys(templates).length === 0) {
					progress.report({ increment: 100 })
					window.showWarningMessage(`⭕ No templates to import.`)
					return exitCode
				}

				try {
					await globalStorage.deleteAll()
					await globalStorage.saveMany(templates)

					progress.report({ increment: 100 })
					await window.showInformationMessage(
						`✅ ${command.capitalizedActionName} successfully.`,
					)
					return nextCode
				} catch (e) {
					progress.report({ increment: 100 })
					console.error(e)
					await window.showErrorMessage(
						`🚫 ${command.capitalizedActionName} failed.`,
					)
					return exitCode
				}
			},
		)
	}
}

export {
	getSaveOneToGlobalStorageMaterials,
	getEditOneToGlobalStorageMaterials,
	getDeleteManyFromGlobalStorageMaterials,
	getRenameOneToGlobalStorageMaterials,
	getSaveManyToGlobalStorageMaterials,
}
