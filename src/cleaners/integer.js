import cleanNumber from './number'

export default function cleanInteger(schema = {}) {
	return cleanNumber({ ...schema, parseNumber: parseInt })
}
