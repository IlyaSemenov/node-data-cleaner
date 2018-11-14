// My original intent was to export default cleaners to be universally and easily used in CJS, ES6 and TS

// However, with simple exports (commented below) this will not work in TS:
//   import clean from 'data-cleaner'
// insead, one will need to write:
//   import * as clean from 'data-cleaner'
// which is not what I want.

// --------------------------------------

// export { default as any, AnySchema } from './cleaners/any'
// export { default as string, StringSchema } from './cleaners/string'
// export { default as date, DateSchema } from './cleaners/date'
// export { default as integer, IntegerSchema } from './cleaners/integer'
// export { default as float, FloatSchema } from './cleaners/float'
// export { default as boolean, BooleanSchema } from './cleaners/boolean'
// export { default as array, ArraySchema } from './cleaners/array'
// export { default as object, ObjectSchema } from './cleaners/object'

// export { default as SchemaError } from './exceptions/SchemaError'
// export { default as ValidationError } from './exceptions/ValidationError'

// export { CleanerOptions, Cleaner } from './types'

// --------------------------------------

//  So for the time being I ended up with this:

import cleanAny, { AnySchema } from './cleaners/any'
import cleanString, { StringSchema } from './cleaners/string'
import cleanDate, { DateSchema } from './cleaners/date'
import cleanInteger, { IntegerSchema } from './cleaners/integer'
import cleanFloat, { FloatSchema } from './cleaners/float'
import cleanBoolean, { BooleanSchema } from './cleaners/boolean'
import cleanArray, { ArraySchema } from './cleaners/array'
import cleanObject, { ObjectSchema } from './cleaners/object'

import SchemaError from './exceptions/SchemaError'
import ValidationError from './exceptions/ValidationError'

export default {
	any: cleanAny,
	string: cleanString,
	date: cleanDate,
	integer: cleanInteger,
	float: cleanFloat,
	boolean: cleanBoolean,
	array: cleanArray,
	object: cleanObject,
	// TODO: convert the below to named imports??
	SchemaError,
	ValidationError,
}

export { CleanerOptions, Cleaner } from './types'
export {
	AnySchema,
	StringSchema,
	DateSchema,
	IntegerSchema,
	FloatSchema,
	BooleanSchema,
	ArraySchema,
	ObjectSchema,
}
