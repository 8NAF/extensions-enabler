import { join } from 'path'

import { Database } from '@vscode/sqlite3'
import { open } from 'sqlite'
import { ExtensionContext } from 'vscode'

import { VS_CODE_WORKSPACE_STORAGE_PATH } from '@paths'
import { Extension, TemplateIds } from '@types'

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

	public getTemplateIds() {
		return this.workspaceState.get('templateIds', []) as string[]
	}

	public async applyTemplates({
		templateIds,
		enabledExtensions,
		disabledExtensions,
	}: {
		templateIds: TemplateIds
		enabledExtensions: Extension[]
		disabledExtensions: Extension[]
	}) {
		await Promise.all([
			this._upsert('enabled', enabledExtensions),
			this._upsert('disabled', disabledExtensions),
			// prettier-ignore
			this.workspaceState.update(
				WorkspaceStorage.templateIdsKey,
				[...templateIds]
			),
		])
	}

	private static readonly templateIdsKey = 'templateIds'

	private static readonly itemTable = 'ItemTable'
	//private static readonly keyColumn = 'key'
	//private static readonly valueColumn = 'value'

	private async _upsert(
		state: 'enabled' | 'disabled',
		template: Parameters<
			typeof this.applyTemplates
		>[0]['enabledExtensions'],
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
