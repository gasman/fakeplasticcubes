/* 3D drawing API */

Vectors = {
	add: function(v1, v2) {
		return [v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2]];
	},
	scale: function(v, s) {
		return [v[0]*s, v[1]*s, v[2]*s];
	},
	normalise: function(v) {
		var mod = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
		return Vectors.scale(v, 1/mod);
	},
	dotProduct: function(a, b) {
		return (a[0]*b[0] + a[1]*b[1] + a[2]*b[2]);
	},
	crossProduct: function(a, b) {
		return [a[1]*b[2] - a[2]*b[1], a[2]*b[0] - a[0]*b[2], a[0]*b[1] - a[1]*b[0]];
	},
	isFrontFacing: function(sv0, sv1, sv2) {
		/* takes three sets of screen coordinates. Must be in anticlockwise order to return true */
		return ((sv1[0] - sv0[0]) * (sv2[1] - sv0[1]) - (sv2[0] - sv0[0]) * (sv1[1] - sv0[1]) < 0);
	},
	transformVector: function(v, m) {
		return [
			v[0]*m[0] + v[1]*m[1] + v[2]*m[2] + m[3],
			v[0]*m[4] + v[1]*m[5] + v[2]*m[6] + m[7],
			v[0]*m[8] + v[1]*m[9] + v[2]*m[10] + m[11]
		];
	},
	transformNormal: function(v, m) {
		return [
			v[0]*m[0] + v[1]*m[1] + v[2]*m[2],
			v[0]*m[4] + v[1]*m[5] + v[2]*m[6],
			v[0]*m[8] + v[1]*m[9] + v[2]*m[10]
		];
	},
	rotateX: function(v,r) {
		return Vectors.transformVector(
			v,
			[
				1, 0, 0, 0,
				0, Math.cos(r), -Math.sin(r), 0,
				0, Math.sin(r), Math.cos(r), 0
			]
		)
	},
	rotateY: function(v,r) {
		return Vectors.transformVector(
			v,
			[
				Math.cos(r), 0, Math.sin(r), 0,
				0, 1, 0, 0,
				-Math.sin(r), 0, Math.cos(r), 0
			]
		)
	},
	rotateZ: function(v,r) {
		return Vectors.transformVector(
			v,
			[
				Math.cos(r), -Math.sin(r), 0, 0,
				Math.sin(r), Math.cos(r), 0, 0,
				0, 0, 1, 0
			]
		)
	}
};

function Stage(canvas) {
	this.ctx = canvas.getContext('2d');
	this.width = canvas.width;
	this.height = canvas.height;
	this.nearClipZ = 0.1;

	this.centreX = this.width / 2;
	this.centreY = this.height / 2;
	this.viewAngle = 1.5;
	this.verticalViewAngle = this.viewAngle * (this.height / this.width);
	this.projectionMultiplierX = (this.width / 2) / this.viewAngle;
	this.projectionMultiplierY = (this.height / 2) / this.verticalViewAngle;
}
Stage.prototype.startFrame = function() {
	this.matrix = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0
	];
	this.matrixStack = [];
	this.renderQueue = [];
	this.lights = [];
}
Stage.prototype.popMatrix = function() {
	this.matrix = this.matrixStack.pop();
}
Stage.prototype.translate = function(p) {
	this.matrixStack.push(this.matrix);
	var m = this.matrix;
	this.matrix = [
		m[0], m[1], m[2], m[0]*p[0] + m[1]*p[1] + m[2]*p[2] + m[3],
		m[4], m[5], m[6], m[4]*p[0] + m[5]*p[1] + m[6]*p[2] + m[7],
		m[8], m[9], m[10], m[8]*p[0] + m[9]*p[1] + m[10]*p[2] + m[11]
	];
}
Stage.prototype.rotateX = function(r) {
	this.matrixStack.push(this.matrix);
	var m = this.matrix;
	var cos_a = Math.cos(r);
	var sin_a = Math.sin(r);
	this.matrix = [
		m[0], m[1]*cos_a+m[2]*sin_a, m[2]*cos_a-m[1]*sin_a, m[3],
		m[4], m[5]*cos_a+m[6]*sin_a, m[6]*cos_a-m[5]*sin_a, m[7],
		m[8], m[9]*cos_a+m[10]*sin_a, m[10]*cos_a-m[9]*sin_a, m[11]
	];
}
Stage.prototype.rotateY = function(r) {
	this.matrixStack.push(this.matrix);
	var m = this.matrix;
	var cos_a = Math.cos(r);
	var sin_a = Math.sin(r);
	this.matrix = [
		m[0]*cos_a-m[2]*sin_a, m[1], m[0]*sin_a+m[2]*cos_a, m[3],
		m[4]*cos_a-m[6]*sin_a, m[5], m[4]*sin_a+m[6]*cos_a, m[7],
		m[8]*cos_a-m[10]*sin_a, m[9], m[8]*sin_a+m[10]*cos_a, m[11]
	];
}
Stage.prototype.rotateZ = function(r) {
	this.matrixStack.push(this.matrix);
	var m = this.matrix;
	var cos_a = Math.cos(r);
	var sin_a = Math.sin(r);
	this.matrix = [
		m[0]*cos_a+m[1]*sin_a, m[1]*cos_a-m[0]*sin_a, m[2], m[3],
		m[4]*cos_a+m[5]*sin_a, m[5]*cos_a-m[4]*sin_a, m[6], m[7],
		m[8]*cos_a+m[9]*sin_a, m[9]*cos_a-m[8]*sin_a, m[10], m[11]
	];
}
Stage.prototype.enqueue = function(z, fn) {
	this.renderQueue.push({z: z, fn: fn});
}

Stage.prototype.paint = function() {
	/* invoke every paint function in the render queue */
	this.renderQueue.sort(function(a,b) {return (b.z - a.z)});
	for (var i = 0; i < this.renderQueue.length; i++) {
		this.renderQueue[i].fn.call(this);
	}
}
Stage.prototype.project = function(vt) {
	return [
		this.centreX + vt[0] * this.projectionMultiplierX / vt[2],
		this.centreY - vt[1] * this.projectionMultiplierY / vt[2],
		vt[2]
	];
}
Stage.prototype.setCamera = function(pos, target, up) {
	if (!up) up = [0, 1, 0];
	var z = Vectors.normalise([target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]]);
	var x = Vectors.normalise(Vectors.crossProduct(up, z));
	var y = Vectors.crossProduct(z, x);
	this.matrix = [
		x[0], x[1], x[2], -Vectors.dotProduct(x, pos),
		y[0], y[1], y[2], -Vectors.dotProduct(y, pos),
		z[0], z[1], z[2], -Vectors.dotProduct(z, pos)
	];
}
Stage.prototype.putSprite3d = function(img, v, width, height) {
	var vt = Vectors.transformVector(v, this.matrix);
	if (vt[2] >= this.nearClipZ) {
		var vp = this.project(vt);
		var screenWidth = width * this.projectionMultiplierX / vt[2];
		var screenHeight = height * this.projectionMultiplierY / vt[2];
		this.enqueueDrawImage(vt[2], img, vp[0] - screenWidth/2, vp[1] - screenHeight/2, screenWidth, screenHeight);
	}
}
Stage.prototype.enqueueDrawImage = function(z, img, x, y, w, h) {
	if (w == null) {
		this.enqueue(z, function() {this.ctx.drawImage(img, x, y)});
	} else {
		this.enqueue(z, function() {this.ctx.drawImage(img, x, y, w, h)});
	}
}

Stage.prototype.putMarker = function(v) {
	var vt = Vectors.transformVector(v, this.matrix);
	if (vt[2] >= this.nearClipZ) {
		var vp = this.project(vt);
		var ctx = this.ctx;
		this.renderQueue.push({z: vt[2], fn: function() {
			ctx.fillStyle = 'white';
			ctx.fillRect(vp[0], vp[1], 3, 3);
		}});
	}
}

Stage.prototype.renderModel = function(model, doubleSided) {
	var vt = []; /* transformed vertices */
	var vp = []; /* projected vertices */
	for (var i = 0; i < model.v.length; i++) {
		var v = model.v[i];
		
		vt[i] = Vectors.transformVector(v, this.matrix);
		vp[i] = this.project(vt[i]);
	}
	
	var nt = []; /* transformed normals */
	if (model.n) {
		for (var i = 0; i < model.n.length; i++) {
			nt[i] = Vectors.transformNormal(model.n[i], this.matrix);
		}
	}
	
	for (var i = 0; i < model.f.length; i++) {
		var face = model.f[i][0];
		var finalPoly = []; /* projected coordinates of face */
		var maxZ = 0;
		/* each vertex/edge of the face: */
		for (var i0 = 0; i0 < face.length; i0++) {
			var i1 = (i0+1) % face.length; /* i0 and i1 are indices of the two consecutive entries in face */
			var vt0 = vt[face[i0]];
			var vt1 = vt[face[i1]];
			
			if (vt0[2] < this.nearClipZ && vt1[2] < this.nearClipZ) {
				/* both vertices clipped; draw nothing */
			} else if (vt0[2] < this.nearClipZ) {
				/* vt0 clipped */
				var clipRatio = (vt1[2] - this.nearClipZ) / (vt1[2] - vt0[2]);
				vt0 = [
					vt0[0] * clipRatio + vt1[0] * (1 - clipRatio),
					vt0[1] * clipRatio + vt1[1] * (1 - clipRatio),
					this.nearClipZ
				];
				var vp0 = this.project(vt0);
				var vp1 = vp[face[i1]];
				
				finalPoly.push(vp0);
				finalPoly.push(vp1);
			} else if (vt1[2] < this.nearClipZ) {			
				/* vt1 clipped */
				var clipRatio = (vt0[2] - this.nearClipZ) / (vt0[2] - vt1[2]);
				vt1 = [
					vt1[0] * clipRatio + vt0[0] * (1 - clipRatio),
					vt1[1] * clipRatio + vt0[1] * (1 - clipRatio),
					this.nearClipZ
				];
				var vp1 = this.project(vt1);
				if (finalPoly.length) {
					/* will have already plotted v0 in this case, so just move to (clipped) v1 */
					finalPoly.push(vp1);
				} else {
					var vp0 = vp[face[i0]];
					finalPoly.push(vp0);
					finalPoly.push(vp1);
				}
			} else {
				/* neither clipped; draw normally */
				if (finalPoly.length) {
					/* will have already plotted v0 in this case, so just move to v1 */
					var vp1 = vp[face[i1]];
					finalPoly.push(vp1);
				} else {
					var vp0 = vp[face[i0]];
					var vp1 = vp[face[i1]];
					finalPoly.push(vp0);
					finalPoly.push(vp1);
				}
			}
			if (vt0[2] > maxZ) maxZ = vt0[2];
			if (vt1[2] > maxZ) maxZ = vt1[2];
		}
		finalPoly = this.clipPolygon2d(finalPoly);
		
		var polyNormals = [];
		var normalIndices = model.f[i][2];
		if (normalIndices) {
			for (var j = 0; j < normalIndices.length; j++) {
				polyNormals[j] = nt[normalIndices[j]];
			}
		}
		
		if (finalPoly.length) {
			/* add faces to the render queue if they're front-facing */
			if (Vectors.isFrontFacing(finalPoly[0], finalPoly[1], finalPoly[2])) {
				this.renderQueue.push({z: maxZ, fn: model.f[i][1](finalPoly, vt, polyNormals, this.ctx, this.lights)});
			} else if (doubleSided) {
				/* also add, but reverse the normal first */
				var reversedNormal = [ [-polyNormals[0][0], -polyNormals[0][1], -polyNormals[0][2]] ];/* we only care about the first one right now */
				this.renderQueue.push({z: maxZ, fn: model.f[i][1](finalPoly, vt, reversedNormal, this.ctx, this.lights)});
			}
		}
	}
}

Stage.prototype.clipPolygon2d = function(poly) {
	/* clip against y=0 */
	var newPoly = [];
	for (var i = 0; i < poly.length; i++) {
		v0 = poly[i];
		v1 = poly[(i+1) % poly.length];
		if (v0[1] < 0 && v1[1] < 0) {
			/* entire line is clipped */
		} else if (v0[1] < 0) {
			/* v0 to boundary is clipped */
			var diff = [
				v1[0] - v0[0],
				v1[1] - v0[1]
			];
			var proportion = v1[1] / diff[1];
			var newX = v1[0] - proportion * diff[0];
			newPoly.push([newX, 0]);
		} else if (v1[1] < 0) {
			/* boundary to v1 is clipped */
			var diff = [
				v1[0] - v0[0],
				v1[1] - v0[1]
			];
			var proportion = -v0[1] / diff[1];
			var newX = v0[0] + proportion * diff[0];
			newPoly.push(v0);
			newPoly.push([newX, 0]);
		} else {
			/* no clipping */
			newPoly.push(v0);
		}
	}
	/* clip against x=0 */
	poly = newPoly;
	newPoly = [];
	for (var i = 0; i < poly.length; i++) {
		v0 = poly[i];
		v1 = poly[(i+1) % poly.length];
		if (v0[0] < 0 && v1[0] < 0) {
			/* entire line is clipped */
		} else if (v0[0] < 0) {
			/* v0 to boundary is clipped */
			var diff = [
				v1[0] - v0[0],
				v1[1] - v0[1]
			];
			var proportion = v1[0] / diff[0];
			var newY = v1[1] - proportion * diff[1];
			newPoly.push([0, newY]);
		} else if (v1[0] < 0) {
			/* boundary to v1 is clipped */
			var diff = [
				v1[0] - v0[0],
				v1[1] - v0[1]
			];
			var proportion = -v0[0] / diff[0];
			var newY = v0[1] + proportion * diff[1];
			newPoly.push(v0);
			newPoly.push([0, newY]);
		} else {
			/* no clipping */
			newPoly.push(v0);
		}
	}
	/* clip against y=height */
	var h = this.height;
	poly = newPoly;
	newPoly = [];
	for (var i = 0; i < poly.length; i++) {
		v0 = poly[i];
		v1 = poly[(i+1) % poly.length];
		if (v0[1] > h && v1[1] > h) {
			/* entire line is clipped */
		} else if (v0[1] > h) {
			/* v0 to boundary is clipped */
			var diff = [
				v1[0] - v0[0],
				v1[1] - v0[1]
			];
			var proportion = (v1[1] - h) / diff[1];
			var newX = v1[0] - proportion * diff[0];
			newPoly.push([newX, h]);
		} else if (v1[1] > h) {
			/* boundary to v1 is clipped */
			var diff = [
				v1[0] - v0[0],
				v1[1] - v0[1]
			];
			var proportion = (h-v0[1]) / diff[1];
			var newX = v0[0] + proportion * diff[0];
			newPoly.push(v0);
			newPoly.push([newX, h]);
		} else {
			/* no clipping */
			newPoly.push(v0);
		}
	}
	/* clip against x=width */
	var w = this.width;
	poly = newPoly;
	newPoly = [];
	for (var i = 0; i < poly.length; i++) {
		v0 = poly[i];
		v1 = poly[(i+1) % poly.length];
		if (v0[0] > w && v1[0] > w) {
			/* entire line is clipped */
		} else if (v0[0] > w) {
			/* v0 to boundary is clipped */
			var diff = [
				v1[0] - v0[0],
				v1[1] - v0[1]
			];
			var proportion = (v1[0] - w) / diff[0];
			var newY = v1[1] - proportion * diff[1];
			newPoly.push([w, newY]);
		} else if (v1[0] > w) {
			/* boundary to v1 is clipped */
			var diff = [
				v1[0] - v0[0],
				v1[1] - v0[1]
			];
			var proportion = (w-v0[0]) / diff[0];
			var newY = v0[1] + proportion * diff[1];
			newPoly.push(v0);
			newPoly.push([w, newY]);
		} else {
			/* no clipping */
			newPoly.push(v0);
		}
	}
	
	return newPoly;
}

Stage.prototype.addLight = function(v) {
	var vt = Vectors.transformVector(v, this.matrix);
	this.lights.push(vt);
}
