define(function() {

	Number.prototype.clamp = function(min, max) {
		return Math.min(Math.max(this, min), max);
	};

	var mod = function(x, m) {
		return (x%m + m)%m;
	};

	// via: http://stackoverflow.com/a/7356528/796832
	function isFunction(functionToCheck) {
		var getType = {};
		return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
	}

	// via: http://stackoverflow.com/a/13542669/796832
	function shadeColor(color, percent) {
		var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
		return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
	}

	function distanceBetween(pt1, pt2) {
		return Math.sqrt(Math.pow(pt2.x-pt1.x, 2) + Math.pow(pt2.y-pt1.y, 2));
	}

	function toDegrees(radians) {
		return radians * (180/Math.PI);
	}

	function toRadians(degrees) {
		return degrees * (Math.PI/180);
	}


	function Vector2(x, y)
	{
		this.x = x;
		this.X = x;
		this.y = y;
		this.Y = y;
	}
	Vector2.prototype.add = function(other) {
		return new Vector2(this.x + other.x, this.y + other.y);
	};
	Vector2.prototype.subtract = function(other) {
		return new Vector2(this.x - other.x, this.y - other.y);
	};
	Vector2.prototype.scale = function(scalar) {
		return new Vector2(this.x*scalar, this.y*scalar);
	};
	Vector2.prototype.normalized = function() {
		var magnitude = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
		return new Vector2(this.x/magnitude, this.y/magnitude);
	};
	Vector2.prototype.dot = function(other) {
		return this.x*other.x + this.y*other.y;
	};
	Vector2.prototype.closestPointOnLine = function(pt1, pt2) {
		function dist2(pt1, pt2) {
			return Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2);
		}

		var l2 = dist2(pt1, pt2);
		if (l2 === 0)
			return dist2(this, v);

		var t = ((this.x - pt1.x) * (pt2.x - pt1.x) + (this.y - pt1.y) * (pt2.y - pt1.y)) / l2;

		if (t < 0)
			return pt1;
		if (t > 1)
			return pt2;

		return new Vector2(pt1.x + t * (pt2.x - pt1.x), pt1.y + t * (pt2.y - pt1.y));
	};
	Vector2.prototype.vector2Args = function(x, y) {
		x = x || 0;
		y = y || 0;
		return [this.x + x, this.y + y];
	};

	function Shape(shapePointList, holePointList)
	{
		// Array of Vector2
		this.pointList = shapePointList;
		this.holePointList = holePointList;
	}
	Shape.prototype.bounds = function() {
		var topLeft = new Vector2(null, null);
		var bottomRight = new Vector2(null, null);
		this.pointList.forEach(function(point, index, array) {
			if(topLeft.x == null || point.x < topLeft.x)
				topLeft = new Vector2(point.x, topLeft.y);
			else if(bottomRight.x == null || point.x > bottomRight.x)
				bottomRight = new Vector2(point.x, bottomRight.y);

			if(topLeft.y == null || point.y < topLeft.y)
				topLeft = new Vector2(topLeft.x, point.y);
			else if(bottomRight.y == null || point.y > bottomRight.y)
				bottomRight = new Vector2(bottomRight.x, point.y);
		});

		return {
			min: topLeft,
			max: bottomRight
		};
	};
	Shape.prototype._drawInternal = function(context, position, pointList)
	{
		context.moveTo.apply(context, pointList[0].add(position).vector2Args());
		pointList.forEach(function(point, index, array) {
			context.lineTo.apply(context, point.add(position).vector2Args());
		});
	};
	Shape.prototype.draw = function(context, position, drawReverse) {
		// You will probably put a `context.beginPath();` before this call to `draw`
		this.drawShape(context, position, drawReverse);
		if(this.holePointList && this.holePointList.length > 0)
		{
			context.closePath();
			this.drawHole(context, position, drawReverse);
		}
		// You will probably put a `context.closePath();` after this call to `draw`
	};
	Shape.prototype.drawShape = function(context, position, drawReverse) {
		var pointList = drawReverse ? this.pointList.reverse() : this.pointList;
		this._drawInternal(context, position, pointList);
	};
	// Since holes are always drawn in reverse (ccw), specify if we should draw it normally
	// Note: this is opposite of `drawShape`
	Shape.prototype.drawHole = function(context, position, drawNormal) {
		var pointList = drawNormal ?  this.holePointList : this.holePointList.reverse();
		this._drawInternal(context, position, pointList);
	};



	return {
		mod: mod,
		isFunction: isFunction,
		shadeColor: shadeColor,
		distanceBetween: distanceBetween,
		toDegrees: toDegrees,
		toRadians: toRadians,
		Vector2: Vector2,
		Shape: Shape
	};

});