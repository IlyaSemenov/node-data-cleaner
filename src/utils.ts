import { CleanerOptions } from './types'

export function getMessage(
	opts: CleanerOptions | undefined,
	name: string,
	defaultText: string,
) {
	return (opts && opts.messages && opts.messages[name]) || defaultText
}
