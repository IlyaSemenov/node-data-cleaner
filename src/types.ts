export interface CleanerOptions {
	messages?: {
		[key: string]: string,
	}
}

export type Cleaner<T = any> = (value, opts?: CleanerOptions) => Promise<T>
