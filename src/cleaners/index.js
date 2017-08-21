for (const n of ["any", "string", "object"]) {
	exports[n] = require("./" + n).default
}
