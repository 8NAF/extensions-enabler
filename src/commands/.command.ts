import { commands } from 'vscode'

export class Command {
	public static prefixCommand: string | null

	private _onExecute: Parameters<typeof commands.registerCommand>[1] | null =
		null
	private readonly _actionName: string

	public constructor(_name: string) {
		this._actionName = _name
	}

	public get name() {
		return `${Command.prefixCommand ?? '8naf-extension-enabler'}.${
			this._actionName
		}`
	}
	public get actionName() {
		return this._actionName
	}

	public get capitalizedActionName() {
		const { _actionName } = this
		return _actionName.charAt(0).toUpperCase() + _actionName.slice(1)
	}

	public get onExecute() {
		return this._onExecute ?? (() => {})
	}
	public set onExecute(onExecute: NonNullable<typeof this._onExecute>) {
		this._onExecute = onExecute
	}
}
