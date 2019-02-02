export type Cleaner<T = any, V = T> = (
	value: V,
	context?: Record<string, any>,
) => T | Promise<T>
