import * as vscode from 'vscode'

import { Command, getCommands } from '@commands'
import { PackageJSON } from '@types'

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
