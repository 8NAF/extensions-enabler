import { QuickPickItem } from 'vscode'

import { Extension, PackageJSON, Template, TemplateId } from '@types'

function toExtensionsId(packageJSON: PackageJSON) {
	const { publisher, name } = packageJSON
	return `${publisher.toLowerCase()}.${name.toLowerCase()}`
}

const _isPackageJson = (o: object): o is PackageJSON =>
	typeof Reflect.get(o, '__metadata') === 'object'

function toExtension(quickPickItem: QuickPickItem): Extension
function toExtension(packageJSON: PackageJSON): Extension
function toExtension(data: QuickPickItem | PackageJSON): Extension {
	if (_isPackageJson(data)) {
		return {
			id: toExtensionsId(data),
			uuid: data.__metadata?.id,
		}
	}

	try {
		return JSON.parse(data.detail ?? '{ id:"", uuid: ""}')
	} catch (e) {
		console.error(e)
		return {
			id: '',
			uuid: '',
		}
	}
}

type ToQuickPickItemOptions = {
	buttons?: QuickPickItem['buttons']
	picked?: boolean
}

function toQuickPickItem(
	template: Template,
	options?: ToQuickPickItemOptions,
): QuickPickItem
function toQuickPickItem(
	packageJSON: PackageJSON,
	options?: ToQuickPickItemOptions,
): QuickPickItem
function toQuickPickItem(
	data: PackageJSON | Template,
	{ buttons, picked }: ToQuickPickItemOptions = {},
): QuickPickItem {
	if (_isPackageJson(data)) {
		const { displayName, name, description } = data
		const str = JSON.stringify(toExtension(data), undefined, ' ')
		return {
			label: `$(diff-added) ${displayName ?? name}`,
			description,
			[propertyStoresTemplateExtensions]: str,
			buttons,
			picked,
		}
	}

	return {
		[propertyStoresTemplateName]: data.name,
		[propertyStoresTemplateId]: data.id,
		buttons,
		picked,
	}
}

function toTemplateId(quickPickItem: QuickPickItem) {
	return quickPickItem[propertyStoresTemplateId] as TemplateId
}

const propertyStoresTemplateExtensions = 'detail'
const propertyStoresTemplateId = 'detail'
const propertyStoresTemplateName = 'label'

export { toExtensionsId, toExtension, toQuickPickItem, toTemplateId }
