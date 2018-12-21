export interface CleanerOptions {
	context?: any
	messages?: {
		[key: string]: string
	}
}

export type Cleaner<T = any> = (
	value: any,
	opts?: CleanerOptions,
) => T | Promise<T>
