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

// export { SchemaError } from './errors/SchemaError'
// export { ValidationError } from './errors/ValidationError'

// export { CleanerOptions, Cleaner } from './types'

// --------------------------------------

//  So for the time being I ended up with this:

import cleanAny from './cleaners/any'
import cleanString from './cleaners/string'
import cleanDate from './cleaners/date'
import cleanInteger from './cleaners/integer'
import cleanFloat from './cleaners/float'
import cleanBoolean from './cleaners/boolean'
import cleanArray from './cleaners/array'
import cleanObject from './cleaners/object'
import { SchemaError } from './errors/SchemaError'
import { ValidationError } from './errors/ValidationError'

export default {
	any: cleanAny,
	string: cleanString,
	date: cleanDate,
	integer: cleanInteger,
	float: cleanFloat,
	boolean: cleanBoolean,
	array: cleanArray,
	object: cleanObject,
	// TODO: convert the below to named exports??
	SchemaError,
	ValidationError,
}

// Export types as named exports.
// Unlike exporting of values, this does not break CJS/ES6 default export.

export { CleanerOptions, Cleaner } from './types'
export { AnySchema } from './cleaners/any'
export { StringSchema } from './cleaners/string'
export { DateSchema } from './cleaners/date'
export { IntegerSchema } from './cleaners/integer'
export { FloatSchema } from './cleaners/float'
export { BooleanSchema } from './cleaners/boolean'
export { ArraySchema } from './cleaners/array'
export { ObjectSchema } from './cleaners/object'
export { ErrorMessage, ErrorMessages, FieldErrorMessages } from './errors/ValidationError'
