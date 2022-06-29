import { GlobalStorage } from '@data-sources'

namespace helper {
	type Tuple<T, N extends number> = N extends N // support Tuple<T, 1|2> => [T] | [T, T]
		? number extends N // support Tuple<T, number> => T[]
			? T[]
			: TupleOf<T, N, []>
		: never

	type TupleOf<
		T,
		N extends number,
		R extends unknown[],
	> = R['length'] extends N ? R : TupleOf<T, N, [T, ...R]>

	type Increment<N extends number> = [
		number,
		...Tuple<number, N>,
	]['length'] extends number
		? [number, ...Tuple<number, N>]['length']
		: never

	type O<
		Key extends readonly any[],
		Value extends readonly any[] & { length: Key['length'] },
		Index extends number = 0,
	> = Index extends Key['length']
		? {}
		: { [key in Key[Index]]: Value[Index] } & O<
				Key,
				Value,
				Increment<Index>
		  >

	export type MappedToObject<
		Keys extends readonly any[],
		Values extends readonly any[] & { length: Keys['length'] },
		Index extends number = 0,
	> = { [key in keyof O<Keys, Values, Index>]: O<Keys, Values, Index>[key] }
}

type Executer = (this: Stage) => Promise<number | undefined | null>

const EXIT_CODE = -1

class Stage {
	public static readonly SkippedStage = new Stage(null, EXIT_CODE, null)

	public readonly manager: StagesQueue
	private readonly code: number
	public readonly executer: (
		this: Stage,
	) => Promise<number | undefined | null>

	public constructor(
		manager: StagesQueue | null,
		code: number,
		executer: Executer | null,
	) {
		this.manager = manager!
		this.code = code
		this.executer =
			executer?.bind(this) ?? (() => Promise.resolve(EXIT_CODE))
	}

	public get exitCode() {
		return EXIT_CODE
	}
	public get currentCode() {
		return this.code
	}
	public get nextCode() {
		return this.code + 1
	}
	public get prevCode() {
		return this.code - 1
	}
}

// NOTE: use this class to avoid recursion
class StagesQueue {
	public readonly globalStorage: GlobalStorage
	private readonly storage = {} as { [key: string]: any }

	private readonly stagesQueue = [] as Stage[]

	private _prevStageCode = -1
	private _currStageCode = 0

	public constructor(
		globalStorage: GlobalStorage,
		executersOrSkippedStage: (Executer | Stage)[],
	) {
		this.globalStorage = globalStorage

		const executers = executersOrSkippedStage.filter(
			executer => !(executer instanceof Stage),
		) as Executer[]
		executers.forEach((executer, index) => {
			this.stagesQueue[index] = new Stage(this, index, executer)
		})
	}

	public setStorages(o: { [key: string]: any }) {
		Object.keys(o).forEach(key => {
			this.storage[key] = o[key]
		})
	}

	public getStorage<T>(key: string, defaultValue: T) {
		return (this.storage[key] as T) ?? defaultValue
	}

	public getStorages<
		Keys extends readonly string[],
		Values extends readonly any[] & { length: Keys['length'] },
	>(keys: Keys) {
		return keys.reduce(
			(obj, key) => ({
				...obj,
				[key]: this.storage[key],
			}),
			{} as Pick<string, any>,
		) as helper.MappedToObject<Keys, Values>
	}

	public get firstStage() {
		return this.stagesQueue[this._currStageCode]
	}
	public get isInFirstStage() {
		return this.firstStage.currentCode === 0
	}

	public get hasChangeStage() {
		return this._currStageCode !== this._prevStageCode
	}

	public async exec() {
		this._prevStageCode = -1
		this._currStageCode = 0

		while (
			this._currStageCode > EXIT_CODE &&
			this._currStageCode < this.stagesQueue.length
		) {
			const currStageCode = this._currStageCode
			const stage = this.stagesQueue[this._currStageCode]

			this._currStageCode = (await stage.executer()) ?? EXIT_CODE
			this._prevStageCode = currStageCode
		}
	}
}

export { Stage, StagesQueue }
