import { dirname, join } from 'path'

import { QuickInputButton, Uri } from 'vscode'

// REF: https://code.visualstudio.com/docs/setup/setup-overview#_how-can-i-do-a-clean-uninstall-of-vs-code
const VS_CODE_APP_DATA_PATH = (() => {
	// TODO: for wsl
	switch (process.platform) {
		case 'win32':
			return `${process.env.APPDATA}\\Code`
		case 'darwin':
			return `${process.env.HOME}/Library/Application Support/Code`
		default:
			return `${process.env.HOME}/.config/Code}`
	}
})()

const VS_CODE_WORKSPACE_STORAGE_PATH = join(
	VS_CODE_APP_DATA_PATH,
	'User',
	'workspaceStorage',
)

const VS_CODE_GLOBAL_STORAGE_PATH = join(
	VS_CODE_APP_DATA_PATH,
	'User',
	'globalStorage',
)

// REF: https://code.visualstudio.com/docs/setup/setup-overview#_how-can-i-do-a-clean-uninstall-of-vs-code
const VS_CODE_EXTENSION_PATH = (() => {
	// TODO: for wsl
	switch (process.platform) {
		case 'win32':
			return `${process.env.USERPROFILE}\\.vscode\\extensions`
		default:
			return `${process.env.HOME}/.vscode/extensions`
	}
})()

const ASSETS_URI = Uri.parse(
	`${dirname(dirname(import.meta.url))}/assets`,
	true,
)
const Buttons = {
	Back: {
		iconPath: Uri.joinPath(ASSETS_URI, 'ic_back.svg'),
		tooltip: 'back',
	} as QuickInputButton,
	Information: {
		iconPath: Uri.joinPath(ASSETS_URI, 'ic_information.svg'),
		tooltip: 'go to this extension',
	} as QuickInputButton,
	Close: {
		iconPath: Uri.joinPath(ASSETS_URI, 'ic_close.svg'),
		tooltip: 'close',
	} as QuickInputButton,
}

export {
	Buttons,
	VS_CODE_EXTENSION_PATH,
	VS_CODE_WORKSPACE_STORAGE_PATH,
	VS_CODE_GLOBAL_STORAGE_PATH,
}
