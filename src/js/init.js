require(['jquery', 'general.utilities', 'game', 'scenes', 'components'], function($, utlity, Game, _scenes, _components) {
	"use strict";

	//console.log('init');
	//console.log("game: ", Game);

	jQuery.fn.filterFind = function(selector) {
		return this.find('*')			// Take the current selection and find all descendants,
			.addBack()					// add the original selection back to the set 
			.filter(selector);			// and filter by the selector.
	};

	$(document).ready(function() {
		console.log('Game Started');
		Game.start();

		// Toggle Controls
		$(document).on('keypress', function(evt) {
			// If we push the `/`or`?` key
			if(evt.charCode == 47 || evt.charCode == 63)
				$('.game-ui').find('.control-key-box').fadeToggle(200);
		});
	});
});
