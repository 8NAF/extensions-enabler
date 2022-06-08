import { readFile } from 'fs/promises'

async function loadJson<T extends unknown>(path: string) {
	const text = await readFile(path, { encoding: 'utf-8' })
	return JSON.parse(text) as T
}

export { loadJson }
