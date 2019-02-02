export interface MessageContext {
	messages?: Record<string, string>
}

export function getMessage(
	context: MessageContext | undefined,
	name: string,
	defaultText: string,
) {
	return (context && context.messages && context.messages[name]) || defaultText
}
