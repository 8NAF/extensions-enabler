import { ExtensionContext } from 'vscode'

type PackageJSON = {
	name: string
	publisher: string
	displayName?: string
	description?: string
	__metadata?: {
		id: string
	}
}

type Extension = { id: string; uuid?: string }
type ExtensionIds = Set<Extension['id']>

type TemplateId = string
type TemplateIds = Set<TemplateId>

type TemplateName = string
type TemplateNames = Set<TemplateName>

type TemplateValue = {
	name: TemplateName
	extensions: Extension[]
}

type Template = {
	id: TemplateId
	name: TemplateValue['name']
	extensions: TemplateValue['extensions']
}

type Templates = {
	[key: string]: TemplateValue
}

type ExportedData = {
	templates: Templates
}

type ExtraExtension = Extension & {
	[key: string | number | symbol]: unknown
}
type ExtraTemplate = {
	id: TemplateId
	name: Parameters<ExtensionContext['globalState']['update']>[0]
	extensions: ExtraExtension[]
}

export {
	PackageJSON,
	ExtensionIds,
	Extension,
	TemplateId,
	TemplateIds,
	TemplateName,
	TemplateNames,
	TemplateValue,
	Template,
	Templates,
	ExtraExtension,
	ExportedData,
}
