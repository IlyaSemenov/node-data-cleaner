export function getMessage(opts, name, defaultText) {
	return (opts && opts.messages && opts.messages[name]) || defaultText
}
