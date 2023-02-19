import { AsyncCleaner, Cleaner } from "./cleaner"

/** A cleaner that can be chained with an another cleaner. */
export interface ChainableCleaner<T, V> extends AsyncCleaner<T, V> {
	clean<T2>(next: Cleaner<T2, T>): ChainableCleaner<T2, V>
}

/** Create ChainableCleaner from abstract cleaner. */
export function cleaner<T, V>(fn: Cleaner<T, V>): ChainableCleaner<T, V> {
	// Create a new cleaner function/object. Make it async for consistency and simplified typings.
	const chainable_cleaner: AsyncCleaner<T, V> = async (value, context) =>
		await fn(value, context)
	return Object.assign(chainable_cleaner, {
		clean<T2>(next: Cleaner<T2, T>) {
			return cleaner<T2, V>(async (value, context) => {
				const res = await fn(value)
				return next(res, context)
			})
		},
	})
}
