require(['crafty', 'general.utilities'], function(Crafty, utility) {

	Crafty.scene('Game', function() {
		// Spawn Player character
		console.log('Spawning player');
		this.player = Crafty.e('PlayerCharacter');


		// Make the camera follow the player
		Crafty.viewport.clampToEntities = false;
		//Crafty.viewport.follow(this.player, 0, 0);
		Crafty.e('LerpCamera').lerpCamera(this.player, 5);

		// Spawn Building
		var rectPointList = [
			new utility.Vector2(0, 0),
			new utility.Vector2(75, 0),
			new utility.Vector2(75, 50),
			new utility.Vector2(0, 50)
		];
		var rectBuildingShape = new utility.Shape(rectPointList);

		function viewportCenter() {
			return new utility.Vector2(-Crafty.viewport.x + (Crafty.viewport.width/2), -Crafty.viewport.y + (Crafty.viewport.height/2));
		}
		
		var buildingList = [];

		var building1 = Crafty.e('ObjectiveBuilding').building({
			shape: rectBuildingShape,
			position: new utility.Vector2(300, 100),
			numFloors: 1,
			focalEntity: viewportCenter,
			topColor: '#ffa9d4',
			sideColor: '#b2658b'
		});
		buildingList.push(building1);

		/* * /
		Crafty.addEvent(this, $('.game-wrapper')[0], 'mousedown', function(e) {
			building1.rotation += 10;
		});
		/* */

		var building2 = Crafty.e('ObjectiveBuilding').building({
			shape: rectBuildingShape,
			position: new utility.Vector2(1000, 100),
			numFloors: 1,
			focalEntity: viewportCenter,
			topColor: '#ffa9d4',
			sideColor: '#b2658b'
		});
		buildingList.push(building2);

		var building3 = Crafty.e('ObjectiveBuilding').building({
			shape: rectBuildingShape,
			position: new utility.Vector2(800, 1400),
			numFloors: 2,
			focalEntity: viewportCenter,
			topColor: '#ffa9d4',
			sideColor: '#b2658b'
		});
		buildingList.push(building3);

		var building4 = Crafty.e('ObjectiveBuilding').building({
			shape: rectBuildingShape,
			position: new utility.Vector2(1800, 2300),
			numFloors: 3,
			focalEntity: viewportCenter,
			topColor: '#ffa9d4',
			sideColor: '#b2658b'
		});
		buildingList.push(building4);

		var building5 = Crafty.e('ObjectiveBuilding').building({
			shape: rectBuildingShape,
			position: new utility.Vector2(2600, 1000),
			numFloors: 3,
			focalEntity: viewportCenter,
			topColor: '#ffa9d4',
			sideColor: '#b2658b'
		});
		buildingList.push(building5);


		// Handles buildings being activated in succession
		function activateInSuccession(index, buildingList)
		{
			
			var building = buildingList[index];
			building.addComponent('Activatable');
			building.one('Activated', onActivated);

			function onActivated() {
				// do stuff with activated building

				// If there is another building after the current
				if(index+1 < buildingList.length)
				{
					// Add a connecting laser between the one we activated and the next
					var nextBuilding = buildingList[index+1];

					var buildingCenter = building.getActualPositionCenter();
					var nextBuildingCenter = nextBuilding.getActualPositionCenter();
					Crafty.e('ConnectingLaser')
						.connectingLaser(new utility.Vector2(buildingCenter.x, buildingCenter.y), new utility.Vector2(nextBuildingCenter.x, nextBuildingCenter.y));

					// Play sound
					Crafty.audio.play('laser-activated');

					// Bind the next building, since we just activated the previous one
					activateInSuccession(index+1, buildingList);
				}
				else
				{
					console.log('activated all buildings');
					Crafty.audio.play('win-sound');

					// Give them a chance to play again
					Game.popRestartGameDialogue("You Won!");
				}
			}

			
		}

		// Start on the first building
		activateInSuccession(0, buildingList);
		


		// Add enemies along the way
		buildingList.forEach(function(building, index, buildingList) {
			// If there is another building after the current
			if(index+1 < buildingList.length)
			{
				var nextBuilding = buildingList[index+1];

				var buildingCenter = building.getActualPositionCenter();
				var nextBuildingCenter = nextBuilding.getActualPositionCenter();

				for(var i = 0; i < (index+1)*8; i++)
				{
					var randX = Math.floor(Math.random() * (Math.abs(nextBuildingCenter.x-buildingCenter.x))) + Math.floor(Math.min(buildingCenter.x, nextBuildingCenter.x));
					var randY = Math.floor(Math.random() * (Math.abs(nextBuildingCenter.y-buildingCenter.y))) + Math.floor(Math.min(buildingCenter.y, nextBuildingCenter.y));

					var pointOnLine = new utility.Vector2(randX, randY).closestPointOnLine(buildingCenter, nextBuildingCenter);


					var variationX = Math.floor(Math.random() * (300)) - 150;
					var variationY = Math.floor(Math.random() * (300)) - 150;

					var enemy = Crafty.e('EnemyBlob')
						.attr({
							x: pointOnLine.x + variationX,
							y: pointOnLine.y + variationY
						});
				}
			}
		});


		/* * /
		var enemy = Crafty.e('EnemyBlob')
			.attr({
				x: -350,
				y: 50
			});
		/* * /
		/* * /
		Crafty.addEvent(this, $('.game-wrapper')[0], 'mousedown', function(e) {
			console.log('rotating');
			enemy.rotation += 8;
		});
		/* */



		/* * /
		for(var i = 0; i < 4; i++)
		{
			Crafty.e('DebugMarker').attr({
				x: i*100,
				y: i*100,
				w: 10,
				h: 10
			});
		}
		/* */

	});



	Crafty.scene('Loading', function() {
		Game.popRestartGameDialogue("Loading...", false);

		// Load our sprite map image
		Crafty.load([
			// Sprites
			'images/player-character2.svg',
			'images/enemy.svg',
			'images/meat-sprite1.png',

			// Audio
			'audio/win-sound.mp3',
			'audio/win-sound.ogg',
			'audio/win-sound.aac',

			'audio/player-death.mp3',
			'audio/player-death.ogg',
			'audio/player-death.aac',

			'audio/player-grunt2.mp3',
			'audio/player-grunt2.ogg',
			'audio/player-grunt2.aac',

			'audio/eating-chomping.mp3',
			'audio/eating-chomping.ogg',
			'audio/eating-chomping.aac',

			'audio/pickup-meat.mp3',
			'audio/pickup-meat.ogg',
			'audio/pickup-meat.aac',

			'audio/gun-shot1.mp3',
			'audio/gun-shot1.ogg',
			'audio/gun-shot1.aac',

			'audio/laser-activated.mp3',
			'audio/laser-activated.ogg',
			'audio/laser-activated.aac',

			'audio/enemy-death.mp3',
			'audio/enemy-death.ogg',
			'audio/enemy-death.aac',

			'audio/enemy-hurt2.mp3',
			'audio/enemy-hurt2.ogg',
			'audio/enemy-hurt2.aac'
		], function() {
			// Once files are loaded....

			Crafty.sprite(32, 'images/meat-sprite1.png', {
				spr_beef: [0, 0],
				spr_meat: [0, 1],
				spr_drumstick: [0, 2],
				spr_turkey:  [0, 3],
				spr_ham:  [0, 4]
			});

			Crafty.audio.add({
				'win-sound': [
					'audio/win-sound.mp3',
					'audio/win-sound.ogg',
					'audio/win-sound.aac'
				],
				'player-death': [
					'audio/player-death.mp3',
					'audio/player-death.ogg',
					'audio/player-death.aac'
				],
				'player-grunt': [
					'audio/player-grunt2.mp3',
					'audio/player-grunt2.ogg',
					'audio/player-grunt2.aac'
				],
				'eating-chomping': [
					'audio/eating-chomping.mp3',
					'audio/eating-chomping.ogg',
					'audio/eating-chomping.aac'
				],
				'pickup-meat': [
					'audio/pickup-meat.mp3',
					'audio/pickup-meat.ogg',
					'audio/pickup-meat.aac'
				],
				'gun-shot': [
					'audio/gun-shot1.mp3',
					'audio/gun-shot1.ogg',
					'audio/gun-shot1.aac'
				],
				'laser-activated': [
					'audio/laser-activated.mp3',
					'audio/laser-activated.ogg',
					'audio/laser-activated.aac'
				],
				'enemy-death': [
					'audio/enemy-death.mp3',
					'audio/enemy-death.ogg',
					'audio/enemy-death.aac'
				],
				'enemy-hurt': [
					'audio/enemy-hurt2.mp3',
					'audio/enemy-hurt2.ogg',
					'audio/enemy-hurt2.aac'
				]
			});

			Game.clearGameDialogue();

			// Now that our sprites are ready to draw, start the game
			Crafty.scene('Game');
		});
	});

});