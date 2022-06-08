import { constants } from 'fs'
import { access } from 'fs/promises'
import { join } from 'path'

import { FileType, Uri, window, workspace } from 'vscode'

import { loadJson } from '@data-sources'
import { VS_CODE_EXTENSION_PATH } from '@paths'
import { ExtensionIds, PackageJSON, TemplateValue } from '@types'
import { toExtension } from '@utils/converter'

async function getInstalledExtensions(): Promise<TemplateValue['extensions']> {
	return getInstalledExtensionPackageJSONs(false).then(packageJSONs =>
		packageJSONs.map(toExtension),
	)
}

async function getInstalledExtensionPackageJSONs(needLocalize: boolean = true) {
	const obsoleteExFNs = await _getObsoleteExtensionFolderNames()
	if (obsoleteExFNs === undefined) return []

	const installedExFNs = await _getInstalledExtensionFolderNames(
		obsoleteExFNs,
	)
	if (installedExFNs === undefined) return []

	const packageJSONs = [] as PackageJSON[]
	const promises = installedExFNs.map(
		folderName =>
			new Promise<void>(async resolve => {
				const packageJSON = await _getInstalledExtensionPackageJSON(
					join(VS_CODE_EXTENSION_PATH, folderName),
					needLocalize,
				)
				if (packageJSON) {
					packageJSONs.push(packageJSON)
				}
				resolve()
			}),
	)

	await Promise.all(promises)
	return packageJSONs
}

async function _getObsoleteExtensionFolderNames() {
	const obsoletePath = join(VS_CODE_EXTENSION_PATH, '.obsolete')
	if (!(await _isExists(obsoletePath))) return new Set<string>()

	const json = await loadJson<{
		[key: string]: unknown
	}>(obsoletePath).catch((e: Error) => e)

	if (json instanceof Error) {
		console.error(json)
		window.showErrorMessage(
			`⛔ Can not parse to JSON. File: ${obsoletePath}`,
		)
		return
	}

	return Object.keys(json).reduce(
		(set, key) => (json[key] === true ? set.add(key) : set),
		new Set<string>(),
	)
}

async function _isExists(path: string) {
	return access(path, constants.F_OK)
		.then(() => true)
		.catch(() => false)
}

async function _getInstalledExtensionFolderNames(
	obsoleteExtensionIds: ExtensionIds,
) {
	try {
		const nodes = await workspace.fs.readDirectory(
			Uri.parse('file:///' + VS_CODE_EXTENSION_PATH),
		)

		const dirs = nodes.filter(
			([name, type]) =>
				type === FileType.Directory && !obsoleteExtensionIds.has(name),
		)

		return dirs.map(dir => dir[0])
	} catch (e) {
		console.error(e)
		window.showErrorMessage(
			`⛔ Can not read the directory: ${VS_CODE_EXTENSION_PATH}`,
		)
	}
}

async function _getInstalledExtensionPackageJSON(
	dir: string,
	needLocalize: boolean = true,
) {
	const packageJSONPath = join(dir, 'package.json')
	const packageJSON = await loadJson<PackageJSON>(packageJSONPath).catch(
		(e: Error) => e,
	)

	if (packageJSON instanceof Error) {
		console.warn(packageJSON)
		window.showWarningMessage(
			`⛔ Can not parse JSON from path: ${packageJSONPath}`,
		)
		return
	}

	if (needLocalize) {
		return _localizePackageJSON(packageJSON, dir)
	}

	return packageJSON
}

async function _localizePackageJSON(packageJSON: PackageJSON, dir: string) {
	const nslKeys = _getNslKeys(packageJSON, ['displayName', 'description'])
	if (nslKeys.length === 0) {
		return packageJSON
	}

	// TODO: load from package.nls.${lang}.json
	// if package.nls.json does not exists
	const packageNslJSONPath = join(dir, 'package.nls.json')
	const packageNslJSON = await loadJson<{
		[key: string]: string | undefined
	}>(packageNslJSONPath).catch((e: Error) => e)

	if (packageNslJSON instanceof Error) {
		console.warn(packageJSON)
		window.showWarningMessage(
			`⛔ Can not parse JSON from path: ${packageNslJSONPath}`,
		)
		return packageJSON
	}

	// TODO: load from package.nls.${lang}.json
	// if key does not exists
	nslKeys.forEach(key => {
		const nlsValue = packageNslJSON[
			packageJSON[key]!.replaceAll('%', '')
		] as string

		if (nlsValue) {
			packageJSON[key] = nlsValue
		}
	})

	return packageJSON
}

function _getNslKeys(
	packageJSON: PackageJSON,
	keys: Exclude<keyof PackageJSON, '__metadata'>[],
) {
	const isNslValue = /^%.*%$/
	return keys.filter(key => isNslValue.test(packageJSON[key] ?? ''))
}

export { getInstalledExtensions, getInstalledExtensionPackageJSONs }
