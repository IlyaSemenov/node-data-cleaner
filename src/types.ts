export interface CleanerOptions {
	messages?: {
		[key: string]: string,
	}
}

export type Cleaner<T> = (value, opts?: CleanerOptions) => Promise<T>
