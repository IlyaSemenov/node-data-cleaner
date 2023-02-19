export type Context = Record<string, any>

export type Cleaner<T = any, V = any> = (
	value: V,
	context?: Context
) => T | Promise<T>

export type AsyncCleaner<T = any, V = any> = (
	value: V,
	context?: Context
) => Promise<T>
