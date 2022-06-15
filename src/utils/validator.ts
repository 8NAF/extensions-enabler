import Ajv from 'ajv'

const publisher = '(?:@[a-z0-9-*~][a-z0-9-*._~]*/)?[a-z0-9-~][a-z0-9-._~]*'
const name = '(?:@[a-z0-9-*~][a-z0-9-*._~]*/)?[a-z0-9-~][a-z0-9-._~]*'
const vscodeExtensionId = new RegExp(`^${publisher}\\.${name}$`)

const ajv = new Ajv({
	formats: {
		uuid4: /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		'non-only-whitespace': /.*\S.*/,
		'vscode-extension-id': vscodeExtensionId,
	},
	removeAdditional: 'all',
	allErrors: true,
})

const templateNameSchema = {
	type: 'string',
	format: 'non-only-whitespace',
	minLength: 1,
}
const templateExtensionsSchema = {
	type: 'array',
	minItems: 1,
	items: {
		type: 'object',
		properties: {
			id: {
				type: 'string',
				format: 'vscode-extension-id',
			},
			uuid: {
				type: 'string',
				format: 'uuid4',
			},
		},
		required: ['id'],
		additionalProperties: true,
	},
}
const templatesSchema = {
	type: 'object',
	minProperties: 1,
	patternProperties: {
		'\\S+': {
			type: 'object',
			properties: {
				name: templateNameSchema,
				extensions: templateExtensionsSchema,
			},
			required: ['name', 'extensions'],
		},
	},
	propertyNames: {
		pattern: '\\S+',
	},
}

const schema = {
	type: 'object',
	properties: {
		templates: templatesSchema,
	},
	required: ['templates'],
	additionalProperties: true,
}

const validate = ajv.compile(schema)

export { validate }
