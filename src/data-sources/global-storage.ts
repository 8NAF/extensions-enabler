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

class GlobalStorage {
	public constructor(
		private readonly globalState: ExtensionContext['globalState'],
	) {}

	//#region single value

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
		await this.globalState.update(templateId, templateValue)
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
			this.globalState.update(id, templates[id]),
		)

		await Promise.all(promises)
		this.globalState.setKeysForSync(this.globalState.keys())
	}

	//#endregion
	//#region getter

	public getAllTemplates() {
		const templateIds = this.globalState.keys()
		return templateIds.map(
			id =>
				({
					id,
					...this.getTemplateValue(id),
				} as Template),
		)
	}

	public getAllTemplateIds() {
		return new Set(this.globalState.keys()) as TemplateIds
	}

	public getAllTemplateNames() {
		return this.globalState
			.keys()
			.map(key => this.getTemplateValue(key).name)
			.reduce((set, name) => set.add(name), new Set() as TemplateNames)
	}

	public getTemplateValue(templateId: TemplateId) {
		return this.globalState.get(templateId, {
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
