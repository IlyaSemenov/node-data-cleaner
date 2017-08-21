for (const n of ["SchemaError", "ValidationError"]) {
	exports[n] = require("./" + n).default
}
