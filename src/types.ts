export interface CleanerOptions {
	messages?: {
		[key: string]: string
	}
}

export type Cleaner<T = any> = (
	value: any,
	opts?: CleanerOptions,
) => T | Promise<T>
