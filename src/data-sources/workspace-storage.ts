import { join } from 'path'

import { Database } from '@vscode/sqlite3'
import { ExtensionContext } from 'vscode'
import { open } from 'sqlite'

import { VS_CODE_WORKSPACE_STORAGE_PATH } from '@paths'
import { Extension, TemplateId } from '@types'

function getDatabasePath(
	workspaceUri: ExtensionContext['storageUri'] | undefined,
) {
	if (workspaceUri === undefined) return null

	const { path } = workspaceUri
	const searchString = 'workspaceStorage'
	const startIndex = path.indexOf(searchString) + searchString.length + 1
	const endIndex = path.lastIndexOf('/')

	const id = path.substring(startIndex, endIndex)
	return join(VS_CODE_WORKSPACE_STORAGE_PATH, id, 'state.vscdb')
}

class WorkspaceStorage {
	private database: Awaited<ReturnType<typeof open>> | null = null
	private readonly databasePath: string | null

	public constructor(
		private readonly workspaceState: ExtensionContext['workspaceState'],
		workspaceUri: ExtensionContext['storageUri'],
	) {
		this.databasePath = getDatabasePath(workspaceUri)
	}

	public getTemplateId() {
		return this.workspaceState.get('templateId', '')
	}

	public async applyTemplate({
		templateId,
		enabledExtensions,
		disabledExtensions,
	}: {
		templateId: TemplateId
		enabledExtensions: Extension[]
		disabledExtensions: Extension[]
	}) {
		await Promise.all([
			this._upsert('enabled', enabledExtensions),
			this._upsert('disabled', disabledExtensions),
			this.workspaceState.update(
				WorkspaceStorage.templateIdKey,
				templateId,
			),
		])
	}

	private static readonly templateIdKey = 'templateId'

	private static readonly itemTable = 'ItemTable'
	//private static readonly keyColumn = 'key'
	//private static readonly valueColumn = 'value'

	private async _upsert(
		state: 'enabled' | 'disabled',
		template: Parameters<typeof this.applyTemplate>[0]['enabledExtensions'],
	) {
		if (this.databasePath === null) {
			throw new Error('No folder is opened')
		}

		this.database ??= await open({
			filename: this.databasePath,
			driver: Database,
		})

		const { itemTable } = WorkspaceStorage

		return this.database.run(
			`INSERT OR REPLACE INTO ${itemTable} VALUES (?, ?)`,
			`extensionsIdentifiers/${state}`,
			JSON.stringify(template),
		)
	}
}

export { WorkspaceStorage }
