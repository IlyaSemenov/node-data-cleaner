import cleanNumber from './number'

export default function cleanFloat(schema = {}) {
	return cleanNumber({ ...schema, parseNumber: parseFloat })
}
