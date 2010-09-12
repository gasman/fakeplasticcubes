/* A factory function for generating a render-polygon function in the given colour */
function colouredPolygon(colour) {
	return function(vp, vt, nt, ctx, lights) {
		return function() {
			ctx.fillStyle = ctx.strokeStyle = colour;
			ctx.beginPath();
			ctx.moveTo(vp[0][0], vp[0][1]);
			for (var i = 1; i < vp.length; i++) {
				ctx.lineTo(vp[i][0], vp[i][1]);
			}
			ctx.fill();
			ctx.stroke();
		}
	}
}

function flatLambertianPolygon(r,g,b) {
	function getColour(i) {
		/* takes a value in range [0..1] and returns a colour identifier
		for the colour given by r/g/b at that intensity */
		return "rgb(" + Math.floor(i*r) + ", " + Math.floor(i*g) + ", " + Math.floor(i*b) + ")";
	}
	
	return function(vp, vt, nt, ctx, lights) {
		return function() {
			var intensity = 0.2; /* ambient term */
			var norm = nt[0]; /* only consider the first vertex's normal */
			
			/* calculate center (mean) of vertices */
			var centreX = 0;
			var centreY = 0;
			var centreZ = 0;
			for (var i = 0; i < vt.length; i++) {
				centreX += vt[i][0];
				centreY += vt[i][1];
				centreZ += vt[i][2];
			}
			centreX = centreX / vt.length;
			centreY = centreY / vt.length;
			centreZ = centreZ / vt.length;
			
			for (var i = 0; i < lights.length; i++) {
				var light = lights[i];
				var lv = Vectors.normalise([light[0] - centreX, light[1] - centreY, light[2] - centreZ]);
				var ndotl = Vectors.dotProduct(norm, lv);
				intensity += 0.8 * Math.max(0, ndotl); /* diffuse term */
			}
			if (intensity > 1) { intensity = 1; }
			ctx.fillStyle = ctx.strokeStyle = getColour(intensity);
			ctx.beginPath();
			ctx.moveTo(vp[0][0], vp[0][1]);
			for (var i = 1; i < vp.length; i++) {
				ctx.lineTo(vp[i][0], vp[i][1]);
			}
			ctx.fill();
			ctx.stroke();
		}
	}
}
