(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(factory);
	} else if (typeof exports === 'object') {
		// Node. Does not work with strict CommonJS, but
		// only CommonJS-like environments that support module.exports,
		// like Node.
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.returnExports = factory();
	}
}(this, function () {

	"use strict";

	var config = {
		baseUrl: './src/js', // The base directory from the builder which the modules are relative to
		name: './init', // which module to optimize
		out: 'main.js', // Where to save the compiled file

		paths: {
			'jquery': './lib/jquery-1.11.1',

			'crafty': './lib/crafty-0-6-2'
		}
	};

	// If in amd environment
	if (typeof define === 'function' && define.amd) {
		require.config(config);
	}

	return config;

}));