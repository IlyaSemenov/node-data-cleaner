type SyncOrAsync<T> = T | Promise<T>

export type Cleaner<T, V = any> = (
	value: V,
	context?: Record<string, any>,
) => SyncOrAsync<T>
