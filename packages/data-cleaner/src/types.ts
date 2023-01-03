export type Cleaner<T, V = any> = (
	value: V,
	context?: Record<string, any>
) => T | PromiseLike<T>
