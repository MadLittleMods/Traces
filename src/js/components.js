require(['crafty', 'jquery', 'general.utilities', 'BoxOverlays.component'], function(Crafty, $, utility, craftyBoxOverlaysComponent) {
	"use strict";


	Crafty.c('Base', {
		init: function() {
			this.requires('EventManager');
		}
	});


	// Usage: `this.cleanBind('damaged', this._onDamaged, 'PlayerCharacter');`
	Crafty.c('EventManager', {
		init: function() {

		},

		// This will remove the bind when the component or entity gets removed
		cleanBind: function(eventName, callback, currentComponentName) {
			var binding = this.bind(eventName, callback);

			if(currentComponentName != null)
			{
				binding.one('RemoveComponent', function(componentName) {
					// Make sure it is the component
					if(componentName == currentComponentName)
					{
						//console.log('removing bind (component)');
						this.unbind(eventName, callback);
					}
				});
			}

			binding.one('Remove', function() {
				//console.log('removing bind (entity)');
				this.unbind(eventName, callback);
			});
		}
	});


	Crafty.c('2DExtended', {
		init: function() {
			this.requires('2D');
		},

		getActualPosition: function(deltaPosition) {
			deltaPosition = deltaPosition || new utility.Vector2(0, 0);

			var a = deltaPosition;
			var b = this._origin;
			var c = utility.toRadians(this.rotation);
			// The formulas to rotate a point (A) around a point (B) by angle (C) are as follows:
			var relX = (a.x-b.x) * Math.cos(c) - (a.y-b.y) * Math.sin(c) + b.x;
			var relY = (a.y-b.y) * Math.cos(c) + (a.x-b.x) * Math.sin(c) + b.y;

			var x = this.x + relX;
			var y = this.y + relY;

			return new utility.Vector2(x, y);
		},

		getActualPositionCenter: function(deltaPosition) {
			deltaPosition = deltaPosition || new utility.Vector2(0, 0);

			return this.getActualPosition(new utility.Vector2((this.w/2) + deltaPosition.x, (this.h/2) + deltaPosition.y));
		}
	});


	Crafty.c('DefferredPiece', {
		ready: true, // Allows the `Draw` event to be called... idk

		// Will be called when the component is added to an entity
		init: function() {
			this.requires('Actor, Solid');
		},
		defferredPiece: function(mainEntity, zIndex, drawCallback) {

			this._mainEntity = mainEntity;
			this._zIndex = zIndex;
			
			this.attr({
				x: this._mainEntity.x,
				y: this._mainEntity.y,
				z: zIndex,
				rotation: this._mainEntity.rotation
			});

			var moveBindedWithThis  = this._onMainEntityMove.bind(this);
			mainEntity.bind('Move', moveBindedWithThis);
			this.one('RemoveComponent', function() {
				mainEntity.unbind('Move', moveBindedWithThis);
			});

			var rotateBindedWithThis  = this._onMainEntityRotate.bind(this);
			mainEntity.bind('Rotate', rotateBindedWithThis);
			this.one('RemoveComponent', function() {
				mainEntity.unbind('Move', rotateBindedWithThis);
			});


			if(drawCallback)
			{
				// Hook into the draw loop, don't forget the `ready: true` property at the top
				this.cleanBind('Draw', drawCallback, 'DefferredPiece');
			}

			return this;
		},

		_onMainEntityMove: function() {
			this.attr({
				x: this._mainEntity.x,
				y: this._mainEntity.y
			});
		},
		_onMainEntityRotate: function() {
			this.attr({
				rotation: this._mainEntity.rotation
			});
		},

	});


	Crafty.c('LerpCamera', {
		init: function() {
			this.requires('Base');
		},

		lerpCamera: function(focalEntity, tScalar) {
			// Make this a function no matter what
			this._focalEntity = utility.isFunction(focalEntity) ? focalEntity : function() { return focalEntity; };
			this._tScalar = tScalar || 0.5;

			// Start the camera position at the focal entity
			this._centerCameraTo(this._focalEntity());
			this._previousPosition = this._focalEntity();

			this.cleanBind('EnterFrame', this._update, 'LerpCamera');

			return this;
		},

		_update: function(e) {
			//console.log(e);
			var dt = e.dt*0.001;

			var targetFocalPosition = this._focalEntity();

			var position = new utility.Vector2(
				this._lerp(this._previousPosition.x, targetFocalPosition.x, this._tScalar*dt),
				this._lerp(this._previousPosition.y, targetFocalPosition.y, this._tScalar*dt)
			);

			// Add on the `w` and `h` parameters
			// Use the target as the default because we want to override the x and y
			position = $.extend({}, targetFocalPosition, position);

			this._centerCameraTo(position);

			this._previousPosition = position;

		},

		_lerp: function(start, end, fracJourney)
		{
			fracJourney = fracJourney.clamp(0, 1);

			return start + ((end-start)*fracJourney);
		},

		_centerCameraTo:  function(position) {
			var newCameraPosition = new utility.Vector2(-(position.x + (position.w / 2) - (Crafty.viewport.width / 2)), -(position.y + (position.h / 2) - (Crafty.viewport.height / 2)));
			this._moveCameraTo(newCameraPosition);
		},

		_moveCameraTo: function(position) {
			Crafty.viewport.scroll('_x', position.x);
			Crafty.viewport.scroll('_y', position.y);
			Crafty.viewport._clamp();
		}
	});

	Crafty.c('Actor', {
		init: function() {
			this.requires('Base, 2DExtended, Canvas');
		}
	});

	Crafty.c('DebugMarker', {
		// Will be called when the component is added to an entity
		init: function() {
			this.requires('Actor, Color')
				.color('rgb(255, 0, 0)');
		},
		debugMarker: function(color)
		{
			this.color(color);

			return this;
		}
	});



	Crafty.c('Alive', {
		// Events:
		//	`damaged`
		//	`healed`
		//	`death`

		init: function() {
			this.requires('Base');

			this.health = 100;
			this._sendHealthChangeEvent(this.health);
		},
		alive: function(startingHealth) {
			this.health = startingHealth || 100;
			this._sendHealthChangeEvent(this.health);

			return this;
		},

		damage: function(amount) {
			var beforeDamageHealth = this.health;
			this.health = beforeDamageHealth - amount;

			if(this.health < 0)
			{
				this.trigger('death', {
					previousHealth: beforeDamageHealth,
					currentHealth: this.health,
					damage: amount
				});
			}

			this.trigger('damaged', {
				previousHealth: beforeDamageHealth,
				currentHealth: this.health,
				damage: amount
			});

			this._sendHealthChangeEvent(beforeDamageHealth);
		},

		heal: function(amount) {
			var beforeHealHealth = this.health;
			this.health += amount;

			this.trigger('healed', {
				previousHealth: beforeHealHealth,
				currentHealth: this.health,
				heal: amount
			});

			this._sendHealthChangeEvent(beforeHealHealth);
		},

		_sendHealthChangeEvent: function(beforeHealth)
		{
			this.trigger('healthChanged', {
				previousHealth: beforeHealth,
				currentHealth: this.health
			});
			
		}
	});


	// This is the player-controlled character
	Crafty.c('PlayerCharacter', {
		ready: true, // Allows the `Draw` event to be called... idk

		init: function() {
			var self = this;

			this.requires('Actor, Alive, Fourway, Collision')
				//.color('rgb(117, 127, 255)') // `Color` component
				//.image('images/player-character1.svg') // `Image` component
				.fourway(4);

			this.attr({
				x: 10,
				y: 10,
				z: Game.zIndex.worldLayerCharacter
			});

			this._meatCount = 0;
			$('.meat-counter').html('x' + this._meatCount);

			this.cleanBind('damaged', this._onDamaged, 'PlayerCharacter');
			this.cleanBind('healthChanged', this._onHealthChanged, 'PlayerCharacter');
			// Reset the UI
			this._onHealthChanged({
				previousHealth: 100,
				currentHealth: 100
			});
			this.cleanBind('death', this._onDeath, 'PlayerCharacter');


			this._characterImage = new Image();
			this._characterImageLoaded = false;
			this._characterImage.onload = function() {
				self._characterImageLoaded = true;

				// `this` in this context is the image
				self.attr({
					w: this.width/5,
					h: this.height/5
				});

				// Create a cache element to draw the hole shadow on
				self._characterScratchCanvas = document.createElement('canvas');
				self._characterScratchCanvas.width = self.w;
				self._characterScratchCanvas.height = self.h;
				var characterScratchCanvasContext = self._characterScratchCanvas.getContext('2d');

				characterScratchCanvasContext.drawImage(self._characterImage, 0, 0, self.w, self.h);

				// Debug the cache canvas
				//var new_image_url = self._characterScratchCanvas.toDataURL(); var img = document.createElement('img'); img.src = new_image_url;
				//document.body.appendChild(img);
			};
			this._characterImage.src = 'images/player-character2.svg';


			Crafty.addEvent(this, $('.game-wrapper')[0], 'mousemove', this._onMouseMove);
			this.one('Remove', function() {
				Crafty.removeEvent(this, $('.game-wrapper')[0], 'mousemove', this._onMouseMove);
			});

			Crafty.addEvent(this, $('.game-wrapper')[0], 'mousedown', this._onMouseDown);
			this.one('Remove', function() {
				Crafty.removeEvent(this, $('.game-wrapper')[0], 'mousedown', this._onMouseDown);
			});

			Crafty.addEvent(this, window, 'mousewheel', this._onMouseScroll);
			this.one('Remove', function() {
				Crafty.removeEvent(this,window, 'mousewheel', this._onMouseScroll);
			});
			Crafty.addEvent(this,window, 'DOMMouseScroll', this._onMouseScroll);
			this.one('Remove', function() {
				Crafty.removeEvent(this, window, 'scroll DOMMouseScroll', this._onMouseScroll);
			});


			this.cleanBind('KeyDown', this._onKeyDown, 'PlayerCharacter');


			// Hook into the draw loop, don't forget the `ready: true` property at the top
			this.cleanBind('Draw', this._draw, 'PlayerCharacter');

			// Hook into the update loop
			this.cleanBind('EnterFrame', this._update, 'PlayerCharacter');
		},

		_update: function(e) {
			var dt = e.dt*0.001;

			var self = this;

			// If the character runs into a solid, stop
			var solidHitData = this.hit('Solid');
			if (solidHitData)
			{
				this.stopMovement();
			}

			// If the character runs into a solid, stop
			var meatHitData = this.hit('Meat');
			if (meatHitData)
			{
				meatHitData.forEach(function(meat, index, array) {
					self._meatCount++;

					// Update the UI
					$('.meat-counter').html('x' + self._meatCount);

					// Remove the meat off of the floor
					meat.obj.destroy();

					// Play sound
					Crafty.audio.play('pickup-meat');
				});
			}
		},

		_draw: function(e) {
			var context = e.ctx;
			context.save();
			context.translate(e.pos._x, e.pos._y);

			if(this._characterImageLoaded)
			{
				//console.log('drawing image');
				//context.drawImage(this._characterImage, 0, 0, this.w, this.h);
				//context.drawImage(this._characterImage, this.x, this.y, this.w, this.h);
				context.drawImage(this._characterScratchCanvas, 0, 0);
			}

			context.restore();
		},

		_screenSpaceToGameSpace: function(position) {
			// The viewport coordinates are opposite the normal positioning
			return new utility.Vector2(position.x - Crafty.viewport.x, position.y - Crafty.viewport.y);
		},

		// Stops the movement
		stopMovement: function(e) {
			// TODO: Fix the stickiness when scraping against a building
			this._speed = 0;
			if(this._movement) {
				this.x -= this._movement.x;
				this.y -= this._movement.y;
			}
		},

		_consumeMeat: function() {
			var maxHealth = 100;

			// If we have some meat
			if(this._meatCount > 0 && this.health < maxHealth)
			{
				// Subtact the meat, add the health
				this._meatCount--;
				this.heal(10);

				// Play sound
				Crafty.audio.play('eating-chomping');

				$('.meat-counter').html('x' + this._meatCount);
			}
		},

		_onHealthChanged: function(e) {
			var maxHealth = 100;
			$('.health-bar-liquid').css('width', (e.currentHealth/maxHealth)*100 + '%');
		},

		_onDamaged: function(e) {
			Crafty.audio.play('player-grunt');
		},

		_onDeath: function(e) {
			Crafty.audio.play('player-death');

			// Make sure the game started and not completed
			// Because we allow people to play behind the "Play Again?" popup
			if(Game.status == Game.statusEnum['started'])
			{
				// Give them a chance to play again
				Game.popRestartGameDialogue("You Lost.");
			}

			this.destroy();
		},

		_onMouseMove: function(e) {
			var rawMousePos =  new utility.Vector2(e.x || e.clientX, e.y || e.clientY);
			var mousePosition = this._screenSpaceToGameSpace(rawMousePos);
			
			var characterPositionOffset = new utility.Vector2(this.w/2, this.h-(this.h/3));

			var angle = Math.atan2(mousePosition.y - (this.y+characterPositionOffset.y), mousePosition.x - (this.x+characterPositionOffset.x));

			this.origin(characterPositionOffset.x, characterPositionOffset.y);
			this.rotation = utility.toDegrees(angle);
		},

		_onMouseDown: function(e) {
			var actualPosition = this.getActualPosition(new utility.Vector2(this.w*0.94, this.h*0.72));
			//console.log(actualPosition);

			/* * /
			Crafty.e('DebugMarker').attr({
				x: actualPosition.x,
				y: actualPosition.y,
				w: 2,
				h: 2
			});
			/* */


			// Spawn a bullet on click
			Crafty.e('Bullet').bullet(new utility.Vector2(actualPosition.x, actualPosition.y), this.rotation, 800);

			// Play sound
			Crafty.audio.play('gun-shot');
		},

		_onMouseScroll: function(e) {
			this._consumeMeat();
		},

		_onKeyDown: function(e) {
			if(e.key == Crafty.keys.E) {
				this._triggerAcivateBuilding();
			}

			if(e.key == Crafty.keys.M || e.key == Crafty.keys.SPACE) {
				this._consumeMeat();
			}
		},

		_triggerAcivateBuilding: function() {
			// Fire an event asking for the buildings in range to activate
			var actualPosition = this.getActualPosition();
			Crafty.trigger('ActivateRequest', {
				x: actualPosition.x,
				y: actualPosition.y
			});
		}
	});

	Crafty.c('Bullet', {
		init: function() {
			this.requires('Actor, Color, Collision')
				.color('rgb(172, 164, 32)');

			this.attr({
				z: Game.zIndex.worldLayerBelowCharacter
			});
		},

		bullet: function(position, rotation, speed, maxDistance) {
			this.attr({
				x: position.x,
				y: position.y,
				w: 6,
				h: 2,
				rotation: rotation
			});

			this._originalPosition = position;
			this._speed = speed;
			this._maxDistance = maxDistance || 1000;

			// Hook into the update loop
			this.cleanBind('EnterFrame', this._update, 'Bullet');
		},

		_update: function(e) {
			var dt = e.dt*0.001;

			//console.log("bullet: " + this._entityName);

			// Get the forward vector
			// It is already normalized since we use cos and sin but we are just being careful by normalizing at the end
			var currentForward = new utility.Vector2(Math.cos(utility.toRadians(this.rotation)), Math.sin(utility.toRadians(this.rotation))).normalized();

			this.shift(currentForward.x*this._speed*dt, currentForward.y*this._speed*dt);

			// Delete the bullet after it has traveled the max distance
			if(utility.distanceBetween(this._originalPosition, new utility.Vector2(this.x, this.y)) > this._maxDistance)
			{
				this.destroy();
			}
		},
	});

	Crafty.c('Meat', {
		ready: true, // Allows the `Draw` event to be called... idk

		init: function() {
			this.requires('Actor');

			var self = this;

			this._meatImageSprite = new Image();
			this._meatImageSpriteLoaded = false;
			this._meatImageSprite.onload = function() {
				self._meatImageSpriteLoaded = true;

				var spriteDimension = 32;
				var numSprites = this.height/spriteDimension;

				var spriteIndex = Math.floor(Math.random() * (numSprites));

				// `this` in this context is the image
				self.attr({
					w: spriteDimension/2,
					h: spriteDimension/2
				});

				// Create a cache element to draw the hole shadow on
				self._meatImageCanvas = document.createElement('canvas');
				self._meatImageCanvas.width = self.w;
				self._meatImageCanvas.height = self.h;
				var meatImageCanvasCanvasContext = self._meatImageCanvas.getContext('2d');

				meatImageCanvasCanvasContext.drawImage(self._meatImageSprite, 0, spriteIndex*spriteDimension, spriteDimension, spriteDimension, 0, 0, self.w, self.h);

				// Debug the cache canvas
				//var new_image_url = self._characterScratchCanvas.toDataURL(); var img = document.createElement('img'); img.src = new_image_url;
				//document.body.appendChild(img);
			};
			this._meatImageSprite.src = 'images/meat-sprite1.png';

			// Hook into the draw loop, don't forget the `ready: true` property at the top
			this.cleanBind('Draw', this._draw, 'Meat');
		},

		_draw: function(e) {
			var context = e.ctx;
			context.save();
			context.translate(e.pos._x, e.pos._y);

			if(this._meatImageSpriteLoaded)
			{
				//console.log('drawing image');
				//context.drawImage(this._characterImage, 0, 0, this.w, this.h);
				//context.drawImage(this._characterImage, this.x, this.y, this.w, this.h);
				context.drawImage(this._meatImageCanvas, 0, 0);
			}

			context.restore();
		}
	});



	// This is the player-controlled character
	Crafty.c('EnemyBlob', {
		ready: true, // Allows the `Draw` event to be called... idk

		init: function() {
			this.requires('Actor, Alive, Collision');

			var self = this;

			this._speed = 75;
			this._aggroDistance = 400;

			this._damageCooldown = 1; // in seconds
			this._damageCooldownTimer = 0; // current cooldown before they can attack again

			this.cleanBind('damaged', this._onDamaged, 'EnemyBlob');
			this.cleanBind('death', this._onDeath, 'EnemyBlob');



			this._characterImage = new Image();
			this._characterImageLoaded = false;
			this._characterImage.onload = function() {
				self._characterImageLoaded = true;

				// `this` in this context is the image
				self.attr({
					w: this.width/7,
					h: this.height/7
				});

				// Create a cache element to draw the hole shadow on
				self._characterScratchCanvas = document.createElement('canvas');
				self._characterScratchCanvas.width = self.w;
				self._characterScratchCanvas.height = self.h;
				var characterScratchCanvasContext = self._characterScratchCanvas.getContext('2d');

				characterScratchCanvasContext.drawImage(self._characterImage, 0, 0, self.w, self.h);

				// Debug the cache canvas
				//var new_image_url = self._characterScratchCanvas.toDataURL(); var img = document.createElement('img'); img.src = new_image_url;
				//document.body.appendChild(img);
			};
			this._characterImage.src = 'images/enemy.svg';


			// Hook into the draw loop, don't forget the `ready: true` property at the top
			this.cleanBind('Draw', this._draw, 'EnemyBlob');

			// Hook into the update loop
			this.cleanBind('EnterFrame', this._update, 'EnemyBlob');
		},
		enemyBlob: function(speed, aggroDistance) {
			this._speed = speed || 75;
			this._aggroDistance = aggroDistance || 400;
		},

		_draw: function(e) {
			var context = e.ctx;
			context.save();
			context.translate(e.pos._x, e.pos._y);

			if(this._characterImageLoaded)
			{
				//console.log('drawing image');
				//context.drawImage(this._characterImage, 0, 0, this.w, this.h);
				//context.drawImage(this._characterImage, this.x, this.y, this.w, this.h);
				context.drawImage(this._characterScratchCanvas, 0, 0);
			}

			context.restore();
		},

		_update: function(e) {
			var dt = e.dt*0.001;
			var self = this;

			// Increase the counter timer of the time elapsed
			this._damageCooldownTimer += dt;


			/* */
			// If the bullet runs into a enemy, destroy it
			var hitdata = this.hit('Bullet');
			if (hitdata && hitdata.length > 0)
			{
				hitdata[0].obj.destroy();

				this.damage(40);
			}



			if(this._damageCooldownTimer >= this._damageCooldown)
			{
				// If a enemy hits the player, damage him
				var playerHitData = this.hit('PlayerCharacter');
				if (playerHitData && playerHitData.length > 0)
				{
					//console.log(playerHitData);

					playerHitData[0].obj.damage(10);
					//console.log(playerHitData[0].obj);

					this._damageCooldownTimer = 0;
				}
			}
			/* */


			// Check if the current player is close enough otherwise, check for another player
			var enemyCenter = this.getActualPositionCenter();
			var distanceBetween = this._currentTargetPlayer ? utility.distanceBetween(enemyCenter, this._currentTargetPlayer.getActualPositionCenter()) : false;
			if(!this._currentTargetPlayer || distanceBetween > this._aggroDistance)
			{
				this._currentTargetPlayer = this._findClosestPlayer();
			}

			// If there is a target and it is close enough, go get it
			if(this._currentTargetPlayer && distanceBetween <= this._aggroDistance)
			{
				// Check if the blob enemy is running into anything
				// The blog can't move in the direction of a collision
				var solidHitData = this.hit('Solid');
				
				var normalDirectionVector = null;
				if (solidHitData && solidHitData.length > 0)
				{
					normalDirectionVector = new utility.Vector2(solidHitData[0].normal.x, solidHitData[0].normal.y).normalized();
				}

				var playerPos = new utility.Vector2(this._currentTargetPlayer.x, this._currentTargetPlayer.y);
				var thisPos = new utility.Vector2(this.x, this.y);

				var directionVector = playerPos.subtract(thisPos).normalized();

				var xSpeed = !normalDirectionVector || normalDirectionVector.x === 0 ? directionVector.x*this._speed*dt : 0;
				var ySpeed = !normalDirectionVector || normalDirectionVector.y === 0 ? directionVector.y*this._speed*dt : 0;

				this.shift(xSpeed, ySpeed);
			}
		},

		_findClosestPlayer: function() {
			var self = this;

			// Follow the closest player in aggro range
			var enemyCenter = this.getActualPositionCenter();
			var closestPlayer;
			var currentClosestDistance;
			var playerList = Crafty('PlayerCharacter');
			if(playerList && playerList.length > 0)
			{
				playerList.each(function(playerIndex) {
					var player = playerList.get(playerIndex);
					var distanceBetween = utility.distanceBetween(enemyCenter, player.getActualPositionCenter());

					// If in aggro range
					// and is the closest so far
					//console.log(distanceBetween, self._aggroDistance, currentClosestDistance, distanceBetween);
					if(distanceBetween <= self._aggroDistance && (currentClosestDistance == null || distanceBetween < currentClosestDistance))
					{
						closestPlayer = player;
						currentClosestDistance = distanceBetween;
					}
				});
			}

			return closestPlayer;
		},

		_onDamaged: function(e) {
			Crafty.audio.play('enemy-hurt');
		},

		_onDeath: function(e) {
			Crafty.audio.play('enemy-death');

			// Spawn some meat loot when the blob dies
			var blobPosition = this.getActualPosition();
			Crafty.e('Meat').attr({
				x: blobPosition.x,
				y: blobPosition.y
			});

			this.destroy();
		}
	});



	Crafty.c('Building', {
		ready: true, // Allows the `Draw` event to be called... idk

		// Will be called when the component is added to an entity
		init: function() {
			this.requires('Actor, Collision, Solid');

			this.attr({
				z: Game.zIndex.worldLayerAboveCharacter
			});

			this.enableBlinkLight = false;
			this._blinkLightStatus = false;
			this._blinkCooldown = 0.5;
			this._blinkCooldownTimer = 0;
		},

		building: function(options) {

			var defaults = {
				shape: null,
				position: new utility.Vector2(0, 0),
				numFloors: 1,
				focalEntity: new utility.Vector2(0, 0), // Function or object with x, y properites to use as the focus (probably camera)
				topColor: '#eeeeee',
				sideColor: '#888888'
			};

			var opts = $.extend({}, defaults, options);


			this._buildingShape = opts.shape;
			var bounds = this._buildingShape.bounds();
			//console.log(bounds);

			this.attr({
				x: opts.position.x,
				y: opts.position.y,
				w: bounds.max.x-bounds.min.x,
				h: bounds.max.y-bounds.min.y
			});

			//console.log(this.x, this.y, this.w, this.h);

			this._numFloors = opts.numFloors;
			// Make this a function no matter what
			this._focalEntity = utility.isFunction(opts.focalEntity) ? opts.focalEntity : function() { return opts.focalEntity; };
			this._topColor = opts.topColor;
			this._sideColor = opts.sideColor;


			// We add another shadow piece so we can draw this below the character
			// And the building above
			var shadowPiece = Crafty.e('DefferredPiece')
				.defferredPiece(this, Game.zIndex.worldLayerBelowCharacter, this._drawShadowPiece.bind(this));




			this.cleanBind('Draw', this._draw, 'Building');

			this.cleanBind('EnterFrame', this._update, 'Building');


			return this;
		},

		_update: function(e) {
			var dt = e.dt*0.001;

			// Increase the counter timer of the time elapsed
			this._blinkCooldownTimer += dt;

			// If the bullet runs into a building, destroy it
			var hitdata = this.hit('Bullet');
			if (hitdata && hitdata.length > 0)
			{
				hitdata[0].obj.destroy();
			}


			// Toggle the blinking light
			if(this._blinkCooldownTimer >= this._blinkCooldown)
			{
				this._blinkLightStatus = this.enableBlinkLight && !this._blinkLightStatus;
				//console.log(this._blinkLightStatus, "enable", this.enableBlinkLight);

				this._blinkCooldownTimer = 0;
			}
		},

		_draw: function(e) {
			var context = e.ctx;
			context.save();
			context.translate(e.pos._x, e.pos._y);

			if(this._buildingShape)
			{
				var self = this;

				// TODO: Fix rendered when building is rotated

				//console.log(e);
				//console.log("e.pos:", e.pos.x, e.pos.y);
				//console.log("this", this.x, this.y);

				var focalPoint = this._focalEntity();

				// zero since we translate above
				var buildingDrawPosition = new utility.Vector2(0, 0);
				var buildingPosition = this;

				// Find the closest point on the building
				var closestPointOnBuilding = new utility.Vector2(0, 0);
				var currentClosestDistance;
				this._buildingShape.pointList.forEach(function(point, index, array) {

					//var currentPoint = point.add(buildingPosition);
					var currentPoint = buildingPosition.getActualPosition(point);
					//var nextPoint = array[utility.mod(index+1, array.length)].add(buildingPosition);
					var nextPoint = buildingPosition.getActualPosition(array[utility.mod(index+1, array.length)]);
					//console.log("point", currentPoint, "next", nextPoint);

					var closestPointOnLine = new utility.Vector2(focalPoint.x, focalPoint.y).closestPointOnLine(currentPoint, nextPoint);
					//console.log("closestPointOnLine", closestPointOnLine);


					var distance = utility.distanceBetween(closestPointOnLine, focalPoint);
					if(currentClosestDistance == null || distance < currentClosestDistance)
					{
						currentClosestDistance = distance;
						closestPointOnBuilding = closestPointOnLine;
						//console.log("set new lowest", closestPointOnBuilding);
					}
				});

				//console.log('---------------------');
				//console.log(closestPointOnBuilding);


				var growth = 0.99; // lower is stiffer
				var clamp = 15;
				var distorion_from_distance = (-1) * Math.pow(growth, currentClosestDistance + (Math.log(clamp)/Math.log(growth))) + clamp;
				
				var angle = Math.atan2(focalPoint.y-closestPointOnBuilding.y, focalPoint.x-closestPointOnBuilding.x);
				//console.log(toDegrees(angle));
				
				var total_distortion = this._numFloors * distorion_from_distance;

				// Sides of the building
				for(var i = 0; i < total_distortion; i++)
				{
					context.save();

					context.beginPath();
					this._buildingShape.draw(context, buildingDrawPosition.subtract(new utility.Vector2(i*Math.cos(angle), i*Math.sin(angle))));
					context.closePath();

					/* * /
					if(i === 0)
					{
						context.shadowColor = '#000000';
						context.shadowBlur = 20;
						context.shadowOffsetX = 0;
						context.shadowOffsetY = 0;
					}
					/* */

					// Tint a layer between each floor
					var tolerance = 0.1; // Percent of each floor dedicated to a strip separating them
					var buildingDrawProgress = i/total_distortion;
					var layersPerFloor = total_distortion/this._numFloors;
					var floorDrawProgress = (i%layersPerFloor)/layersPerFloor;

					// Make sure in strip territory to darken and not on the first floor
					if(floorDrawProgress < tolerance && buildingDrawProgress > 1/this._numFloors)
						context.fillStyle = utility.shadeColor(this._sideColor, 0.05);
					else
						context.fillStyle = this._sideColor;

					context.fill();

					context.restore();
				}

				// Top of the building
				context.beginPath();
				var ceilingPosition = buildingDrawPosition.subtract(new utility.Vector2(total_distortion*Math.cos(angle), total_distortion*Math.sin(angle)));
				this._buildingShape.draw(context, ceilingPosition);
				context.fillStyle = this._topColor;
				context.fill();


				context.beginPath();
				context.arc(ceilingPosition.x + 20, ceilingPosition.y + 20, 2, 0, 2*Math.PI, false);

				//console.log(this._blinkLightStatus, this.enableBlinkLight);
				if(this._blinkLightStatus)
				{
					context.shadowColor = '#000000';
					context.shadowBlur = 10;
					context.shadowOffsetX = 0;
					context.shadowOffsetY = 0;
					context.fillStyle = 'rgba(240, 17, 69, 1)';
				}
				else
				{
					context.fillStyle = 'rgba(255, 204, 228, 0.8)';
				}
				
				context.fill();


			}
			else
			{
				console.warn('No Building Shape to draw! at pos:', this.x, this.y);
			}

			context.restore();
		},

		_drawShadowPiece: function(e) {
			var context = e.ctx;
			context.save();
			context.translate(e.pos._x, e.pos._y);


			if(this._buildingShape)
			{
				// Draw a shadow piece
				context.beginPath();
				this._buildingShape.draw(context, new utility.Vector2(0, 0));
				
				context.shadowColor = '#000000';
				context.shadowBlur = 20;
				context.shadowOffsetX = 0;
				context.shadowOffsetY = 0;
				context.fillStyle = this._topColor;
				context.fill();
			}

			context.restore();
		}

	});

	Crafty.c('Activatable', {
		init: function() {
			this.isActivated = false;
			this.activatableRange = 100;

			var ar_cb = this._processRequest.bind(this);
			Crafty.bind('ActivateRequest', ar_cb);
			// When this component is removed, remove the binding
			this.one('RemoveComponent', function(componentName) {
				if(componentName == 'Activatable')
				{
					Crafty.unbind('ActivateRequest', ar_cb);
				}
			});
		},
		activatable: function(range) {
			this.isActivated = false;

			range = range || 100;

			this.activatableRange = range;

			return this;
		},

		_processRequest: function(e) {
			var distance = utility.distanceBetween(new utility.Vector2(e.x, e.y), new utility.Vector2(this.x + (this.w/2), this.y + (this.h/2)));
			//console.log(distance, this.activatableRange);
			if(distance < this.activatableRange)
			{
				console.log('firing activated event');
				this.isActivated = true;
				// Fire an event the entity can listen to
				this.trigger('Activated');
			}
		}
	});

	Crafty.c('ConnectingLaser', {
		ready: true, // Allows the `Draw` event to be called... idk

		init: function() {
			this.requires('Actor');

			this.attr({
				z: Game.zIndex.worldLayerBelowCharacter
			});
		},
		connectingLaser: function(startingPoint, endingPoint) {
			// A big bounding box to make the renderer happy with clearing and such
			this.attr({
				x: Math.min(startingPoint.x, endingPoint.x),
				y: Math.min(startingPoint.y, endingPoint.y),
				w: Math.abs(endingPoint.x-startingPoint.x),
				h: Math.abs(endingPoint.y-startingPoint.y)
			});

			this._startingPoint = startingPoint;
			this._endingPoint = endingPoint;

			// Hook into the draw loop, don't forget the `ready: true` property at the top
			this.cleanBind('Draw', this._draw, 'ConnectingLaser');

			return this;
		},

		_draw: function(e) {
			var context = e.ctx;
			context.save();
			//context.translate(e.pos._x, e.pos._y);

			context.beginPath();
			context.moveTo(this._startingPoint.x, this._startingPoint.y);
			context.lineTo(this._endingPoint.x, this._endingPoint.y);

			context.lineWidth = 5;
			context.strokeStyle = '#ff6666';
			context.stroke();

			context.lineWidth = 3;
			context.strokeStyle = '#aa2222';
			context.stroke();

			context.lineWidth = 1;
			context.strokeStyle = '#ffaaaa';
			context.stroke();


			context.restore();
		}
	});

	Crafty.c('ObjectiveBuilding', {
		init: function() {
			this.requires('Actor, Building');


			this.cleanBind('Activated', this._onActivated, 'ObjectiveBuilding');
		},

		_onActivated: function() {
			this.enableBlinkLight = true;
		}
	});
	

});