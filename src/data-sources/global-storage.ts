import { ExtensionContext } from 'vscode'

import {
	ExtensionIds,
	Template,
	TemplateId,
	TemplateIds,
	TemplateNames,
	Templates,
	TemplateValue,
} from '@types'
import { getInstalledExtensions } from '@utils/extension'

const prefix = 'template'

class GlobalStorage {
	public constructor(
		private readonly globalState: ExtensionContext['globalState'],
	) {}

	public static readonly globalTemplateId = 'global'

	//#region single value

	public async updateGlobalTemplate(extensions: TemplateValue['extensions']) {
		const key = `${prefix}/${GlobalStorage.globalTemplateId}`
		await this.globalState.update(key, {
			name: 'global',
			extensions,
		} as TemplateValue)
		this.globalState.setKeysForSync(this.globalState.keys())
	}

	public async saveOne(templateId: TemplateId, templateValue: TemplateValue) {
		return this._updateOne(templateId, templateValue)
	}

	public async deleteOne(templateId: TemplateId) {
		return this._updateOne(templateId, undefined)
	}

	/** Update the extensions of a template. */
	public async editOne(
		templateId: Template['id'],
		newExtensions: TemplateValue['extensions'],
	) {
		const templateValue = this.getTemplateValue(templateId)
		if (templateValue.name === '') return
		templateValue.extensions = newExtensions

		await this._updateOne(templateId, templateValue)
	}

	/** Update the name of a template. */
	public async renameOne(
		templateId: Template['id'],
		newName: TemplateValue['name'],
	) {
		const templateValue = this.getTemplateValue(templateId)
		if (templateValue.name === '') return
		templateValue.name = newName

		await this._updateOne(templateId, templateValue)
	}

	private async _updateOne(
		templateId: TemplateId,
		templateValue: TemplateValue | undefined,
	) {
		await this.globalState.update(`${prefix}/${templateId}`, templateValue)
		this.globalState.setKeysForSync(this.globalState.keys())
	}

	//#endregion
	//#region multiple values

	// overwrite if same name
	public async saveMany(templates: Templates) {
		return this._updateMany(templates)
	}

	public async deleteAll() {
		return this.deleteMany(this.getAllTemplateIds())
	}

	public async deleteMany(templateIds: TemplateIds) {
		const templateValues = {} as { [key: string]: undefined }
		templateIds.forEach(name => (templateValues[name] = undefined))
		return this._updateMany(templateValues)
	}

	private async _updateMany(templates: {
		[key in keyof Templates]: Templates[key] | undefined
	}) {
		const templateIds = Object.keys(templates)
		const promises = templateIds.map(id =>
			this.globalState.update(`${prefix}/${id}`, templates[id]),
		)

		await Promise.all(promises)
		this.globalState.setKeysForSync(this.globalState.keys())
	}

	//#endregion
	//#region getter

	public getAllTemplates(includeGlobalTemplate = false) {
		const globalKey = `${prefix}/${GlobalStorage.globalTemplateId}`
		const filter = includeGlobalTemplate
			? () => true
			: (key: string) => key !== globalKey
		const keys = this.globalState.keys().filter(filter)

		return keys.map(key => {
			const id = key.replace(`${prefix}/`, '')
			return {
				id,
				...this.getTemplateValue(id),
			} as Template
		})
	}

	public getAllTemplateIds(includeGlobalTemplate = false) {
		return new Set(
			this.getAllTemplates(includeGlobalTemplate).map(({ id }) => id),
		) as TemplateIds
	}

	public getAllTemplateNames(includeGlobalTemplate = false) {
		return new Set(
			this.getAllTemplates(includeGlobalTemplate).map(({ name }) => name),
		) as TemplateNames
	}

	public getTemplateValue(templateId: TemplateId) {
		return this.globalState.get(`${prefix}/${templateId}`, {
			name: '',
			extensions: [],
		}) as TemplateValue
	}

	public getExtensionIds(templateId: TemplateId) {
		const templateValue = this.getTemplateValue(templateId)
		return GlobalStorage.getExtensionIds(templateValue.extensions)
	}

	public static getExtensionIds(extensions: TemplateValue['extensions']) {
		return extensions.reduce((extensionIds, extension) => {
			return extensionIds.add(extension.id)
		}, new Set() as ExtensionIds)
	}

	public async splitExtensions(templateId: TemplateId) {
		const templateValue = this.getTemplateValue(templateId)
		if (templateValue.name === '') {
			return {
				enabledExtensions: [],
				disabledExtensions: [],
			}
		}
		const enabledExtensions = templateValue.extensions

		const installedExtensions = await getInstalledExtensions()
		const enabledExtensionIds =
			GlobalStorage.getExtensionIds(enabledExtensions)
		const disabledExtensions = installedExtensions.filter(
			e => !enabledExtensionIds.has(e.id),
		) as TemplateValue['extensions']

		return {
			enabledExtensions,
			disabledExtensions,
		}
	}

	//#endregion
}

export { GlobalStorage }
