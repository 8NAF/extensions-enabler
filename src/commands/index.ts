import { ExtensionContext } from 'vscode'

import { GlobalStorage, WorkspaceStorage } from '@data-sources'
import { Command } from './.command'
import { getCommand as getApplyCommand } from './apply.command'
import { getCommand as getCloneCommand } from './clone.command'
import { getCommand as getCreateCommand } from './create.command'
import { getCommand as getDeleteCommand } from './delete.command'
import { getCommand as getEditGlobalCommand } from './edit-global.command'
import { getCommand as getEditCommand } from './edit.command'
import { getCommand as getExportCommand } from './export.command'
import { getCommand as getImportCommand } from './import.command'
import { getCommand as getRenameCommand } from './rename.command'

const myCommands = {
	apply: new Command('apply'),
	create: new Command('create'),
	clone: new Command('clone'),
	edit: new Command('edit'),
	rename: new Command('rename'),
	delete: new Command('delete'),
	export: new Command('export'),
	import: new Command('import'),
	editGlobal: new Command('editGlobal'),
}

function getCommands(context: ExtensionContext) {
	const globalStorage = new GlobalStorage(context.globalState)
	const workspaceStorage = new WorkspaceStorage(
		context.workspaceState,
		context.storageUri,
	)

	myCommands['apply'] = getApplyCommand(globalStorage, workspaceStorage)
	myCommands['create'] = getCreateCommand(globalStorage)
	myCommands['clone'] = getCloneCommand(globalStorage)
	myCommands['edit'] = getEditCommand(globalStorage, workspaceStorage)
	myCommands['rename'] = getRenameCommand(globalStorage)
	myCommands['delete'] = getDeleteCommand(globalStorage)
	myCommands['export'] = getExportCommand(globalStorage)
	myCommands['import'] = getImportCommand(globalStorage)
	myCommands['editGlobal'] = getEditGlobalCommand(globalStorage)

	return myCommands
}

export * from './.command'
export * from './.stage'
export { getCommands, myCommands }
