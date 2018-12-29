export interface CleanerOptions {
	context?: any
	messages?: {
		[key: string]: string
	}
}

export type Cleaner<T = any, V = T, O = CleanerOptions> = (
	value: V,
	opts?: O,
) => T | Promise<T>
