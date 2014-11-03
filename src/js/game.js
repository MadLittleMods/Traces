define(['crafty', 'jquery', 'general.utilities', 'scenes', 'components'], function(Crafty, $, utility, _scenes, _components) {
	"use strict";

	window.Game = {

		stage: $('.game-stage')[0],

		// The total width of the game screen. Since our grid takes up the entire screen
		// this is just the width of a tile times the width of the grid
		width: function() {
			return $(this.stage).parent().width();
			//return this.map_grid.width * this.map_grid.tile.width;
		},

		// The total height of the game screen. Since our grid takes up the entire screen
		// this is just the height of a tile times the height of the grid
		height: function() {
			return $(this.stage).parent().height();
			//return this.map_grid.height * this.map_grid.tile.height;
		},

		zIndex: {
			worldLayerGround: 100,
			worldLayerBelowCharacter: 200,
			worldLayerCharacter: 300,
			worldLayerAboveCharacter: 400,
			worldLayerTop: 800
		},

		statusEnum: {
			'not-started': 0,
			'started': 1,
			'complete': 2
		},

		status: (function() {
			return this.statusEnum['not-started'];
		}),


		popRestartGameDialogue: function(message, showPlayAgain) {
			// Make the default true if they don't provide it explicitly
			showPlayAgain = showPlayAgain == null ? true : showPlayAgain;

			var $statusBox = $('.game-ui').find('.game-status-box');
			
			var content = '<h1 class="game-status-box-message">' + message + '</h1>';
			if(showPlayAgain) {
				content += '<button class="play-again">Play Again?</button>';

				content += '<div class="credits-box">';
					content += '<div>Developed by <a href="http://ericeastwood.com/">Eric Eastwood</a></div>';
					content += '<hr />';
					content += '<div><strong>Assets:</strong></div>';
					content += '<ul class="credits-box-attribution">';
						content += '<li><strong><a href="http://opengameart.org/users/remaxim">remaxim:</strong> <a href="http://opengameart.org/content/win-sound-2">Sound Effects</a></li>';
						content += '<li><strong><a href="http://opengameart.org/users/prinsu-kun">Prinsu-Kun:</strong> <a href="http://opengameart.org/content/retro-deaddestroyeddamaged-sound">Sound Effects</a></li>';
						content += '<li><strong><a href="http://opengameart.org/users/caeles">caeles:</strong> <a href="http://opengameart.org/content/shadowless-lpc-food">Sprites</a></li>';
					content += '</ul>';
				content += '</div>';
			}

			var $statusContents = $(content).appendTo($statusBox);
			$statusContents.filterFind('.play-again').on('click', function() {
				// Restart the game
				Crafty.scene('Game');

				// Get these out of the way since they restarted the game
				$statusContents.remove();
			});
		},

		clearGameDialogue: function() {
			var $statusBox = $('.game-ui').find('.game-status-box');

			// Clear it out
			$statusBox.html('');
		},


		// Initialize and start our game
		start: function() {
			var self = this;

			// Start crafty and set a background color so that we can see it's working
			// Passing `null, null` as the first paramaters causes fullscreen (see crafty source)
			// Instead of passing in a stage element as the last parameter of `init`,
			// you can add a element with the id of `cr-stage ` or even leave it out to have it auto-generated
			Crafty.init(null, null, this.stage);
			Crafty.background('#fff7b5');

			// Add the right click context menu back
			Crafty.settings.modify("stageContextMenu", true);

			// Simply start the "Loading" scene to get things going
			Crafty.scene('Loading');
		}
	};

	return Game;
});