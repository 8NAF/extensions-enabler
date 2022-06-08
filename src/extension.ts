import * as vscode from 'vscode'

import { PackageJSON } from '@types'
import { getCommands, Command } from '@commands'

export async function activate(context: vscode.ExtensionContext) {
	Command.prefixCommand = (context.extension.packageJSON as PackageJSON).name

	const myCommands = getCommands(context)

	Object.keys(myCommands).forEach(key => {
		const { name, onExecute } = myCommands[key as keyof typeof myCommands]

		const disposable = vscode.commands.registerCommand(name, onExecute)
		context.subscriptions.push(disposable)
	})
}

export function deactivate() {}
