exports.getMessage = function(opts, name, defaultText) {
	return (opts && opts.messages && opts.messages[name]) || defaultText
}
