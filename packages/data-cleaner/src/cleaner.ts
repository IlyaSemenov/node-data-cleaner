export type Context = Record<string, any>

export type Cleaner<T, V = any> = (
	value: V,
	context?: Context
) => T | PromiseLike<T>
