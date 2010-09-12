function Octahedron(x,y,z,r) {
	return function(s) {
		function tr(v) {
			var v = rotateXyz(v, r);
			return [(s*v[0])+x, (s*v[1])+y, (s*v[2])+z]
		}
		return {
			v: [
				tr([0, -1, 0]),
				tr([-1, 0, 0]),
				tr([0, 0, 1]),
				tr([1, 0, 0]),
				tr([0, 0, -1]),
				tr([0, 1, 0])
			],
			f: [
				[[0, 1, 2], colouredPolygon('#ff0000')],
				[[0, 2, 3], colouredPolygon('#00ff00')],
				[[0, 3, 4], colouredPolygon('#ffff00')],
				[[0, 4, 1], colouredPolygon('#0000ff')],
				[[2, 1, 5], colouredPolygon('#ff00ff')],
				[[3, 2, 5], colouredPolygon('#00ffff')],
				[[4, 3, 5], colouredPolygon('#ffffff')],
				[[1, 4, 5], colouredPolygon('#888888')]
			]
		};
	}
}

var cube = BoxModel(-0.5,0,-0.5, 0.5,1,0.5,flatLambertianPolygon(200,200,200));

var walls = {
	v: [
		/* bottom */
		[-100, 0, -100], /* back left */
		[100, 0, -100], /* back right */
		[100, 0, 100], /* front right */
		[-100, 0, 100], /* front left */
		
		/* top */
		[-100, 1000, -100], /* back left */
		[100, 1000, -100], /* back right */
		[100, 1000, 100], /* front right */
		[-100, 1000, 100], /* front left */
	],
	f: [
		[[0,1,2,3], colouredPolygon('#ffbb88')], /* ground */
		[[0,3,7,4], colouredPolygon('#88ffff')], /* left sky */
		[[3,2,6,7], colouredPolygon('#88ffff')], /* front sky */
		[[2,1,5,6], colouredPolygon('#88ffff')], /* right sky */
		[[1,0,4,5], colouredPolygon('#88ffff')] /* front sky */
	]
}

var floorGrid = {
	v: [],
	f: []
}
var i = 0;
for (x = -45; x < 50; x += 5) {
	floorGrid.v[i] = [x-0.05,0.01,-100];
	floorGrid.v[i+1] = [x+0.05,0.01,-100];
	floorGrid.v[i+2] = [x+0.05,0.01,100];
	floorGrid.v[i+3] = [x-0.05,0.01,100];
	floorGrid.f.push([[i, i+1, i+2, i+3], colouredPolygon('#654')]);
	i += 4;
}
for (z = -45; z < 50; z += 5) {
	floorGrid.v[i] = [-100,0.01,z-0.05];
	floorGrid.v[i+1] = [100,0.01,z-0.05];
	floorGrid.v[i+2] = [100,0.01,z+0.05];
	floorGrid.v[i+3] = [-100,0.01,z+0.05];
	floorGrid.f.push([[i, i+1, i+2, i+3], colouredPolygon('#654')]);
	i += 4;
}

treeShader = flatLambertianPolygon(255, 32, 32);

function rotateXyz(v, r) {
	v = Vectors.rotateX(v, r[0]);
	v = Vectors.rotateY(v, r[1]);
	v = Vectors.rotateZ(v, r[2]);
	return v
}

// http://station.woj.com/2010/02/javascript-random-seed.html
var seed = 100;
function random() {
	seed = (seed*9301+49297) % 233280;
	return seed/(233280.0);
}

var maxTreeSlices = 50;

function generateTreeSlices() {
	var endpoints = [
		{
			position: [0,1,0],
			displacement: [0, 0.2, 0],
			normal: [0, 0, -1],
			extent: [0.1, 0, 0], /* how far left/right to sweep to build the polygon */
			rotation: [0.1, 0.05, 0.01], /* XYZ amounts to rotate disp / norm / ext by on this tile */
			/* coil, twist, bend */
			lastVIndex: 0
		}
	];
	
	var e = endpoints[0];
	var treeSlices = [
		{
			v: [
				Vectors.add(e.position, Vectors.scale(e.extent, -1)),
				Vectors.add(e.position, e.extent)
			],
			n: [],
			f: []
		}
	];
	
	var vindex = 2;
	var nindex = 0;
	
	for (var i = 1; i < maxTreeSlices; i++) {
		var nextEndpoints = [];
		
		treeSlices[i] = {
			v:[], n:[], f:[]
		}
		
		for (var endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex++) {
			var e = endpoints[endpointIndex];
			e.position = Vectors.add(e.position, e.displacement);
			treeSlices[i].v.push(Vectors.add(e.position, Vectors.scale(e.extent, -1)));
			treeSlices[i].v.push(Vectors.add(e.position, e.extent));
			treeSlices[i].n.push(e.normal);
			
			treeSlices[i].f.push([
				[e.lastVIndex, e.lastVIndex + 1, vindex+1, vindex],
				treeShader,
				[nindex]
			]);
			
			e.lastVIndex = vindex;
			
			if (random() < 1/15) {
				/* split */
				
				branchiness = 0.1 + random() * 0.03;
				
				// create new endpoint
				e2 = {
					position: e.position,
					displacement: e.displacement,
					normal: e.normal,
					extent: e.extent,
					rotation: [-e.rotation[0] - branchiness, e.rotation[1], e.rotation[2]],
					lastVIndex: vindex
				}
				e.rotation[0] += branchiness;
				nextEndpoints.push(e);
				nextEndpoints.push(e2);
				
			} else {
				e.displacement = rotateXyz(e.displacement, e.rotation);
				e.normal = rotateXyz(e.normal, e.rotation);
				e.extent = rotateXyz(e.extent, e.rotation);
				
				nextEndpoints.push(e);
			}
			
			vindex += 2;
			nindex++;
		}
		
		endpoints = nextEndpoints;
	}
	fruit = [];
	for (var ei = 0; ei < endpoints.length; ei++) {
		e = endpoints[ei];
		fruit.push(Octahedron(e.position[0], e.position[1], e.position[2], e.normal));
		/*     ^^-- push pineapple, shake a tree? */
	}
	
	return [treeSlices, fruit];
}
var out = generateTreeSlices();
var treeSlices = out[0];
var fruit = out[1];


function renderRibbonScene(t, stage) {
	stage.startFrame();
	
	var camRadius = 5;
	var camY = 3;
	if (t > 10000) {
		var camD = -0.5* Math.cos( Math.PI * Math.min(t-10000, 3000) / 3000 ) + 0.5;
		camRadius += camD*4;
		camY += camD*2;
	}
	stage.setCamera([camRadius*Math.sin(t/10000 + 1), 2, -camRadius * Math.cos(t / 10000 + 1)], [0, camY, 0], [0, 1, 0]);
	
	var lightPos = [2*Math.cos(t/1000), 2 + Math.sin(t/1500), -2 * Math.sin(t / 1000)]
	stage.addLight(lightPos);
	stage.putMarker(lightPos);
	
	var lightPos = [2*Math.cos(t/800), 2 + Math.sin(t/2000), -2 * Math.sin(t / 1200)]
	stage.addLight(lightPos);
	stage.putMarker(lightPos);
	
	stage.renderModel(walls);
	stage.renderModel(floorGrid);
	stage.renderModel(cube);
	
	var treeDepth = 0;
	if (t > 5000 && t < 10000) {
		treeDepth += 25 * Math.sin(Math.PI * (t-5000)/5000);
	}
	if (t > 8000) {
		treeDepth += 50 * Math.pow((t-8000)/3000, 2);
	}
	
	tree = {
		v: [],
		n: [],
		f: []
	}
	
	boundedTreeDepth = Math.min(treeDepth, maxTreeSlices);
	for (i = 0; i < boundedTreeDepth; i++) {
		tree.v = tree.v.concat(treeSlices[i].v);
		tree.n = tree.n.concat(treeSlices[i].n);
		tree.f = tree.f.concat(treeSlices[i].f);
	}
	
	stage.renderModel(tree, true);
	
	if (treeDepth >= maxTreeSlices) {
		for (var f = 0; f < fruit.length; f++) {
			var size = Math.min(treeDepth - 45, 10);
			var scale = size * 0.2 / 10;
			stage.renderModel(fruit[f](scale));
		}
	}
	
	stage.paint();
	
	if (t > 16000) {
		scrollerDivInner.style.top = HEIGHT-(t-15000)/40 + 'px';//(HEIGHT - (t-16000)/100) + 'px';
	} else {
		scrollerDivInner.style.top = HEIGHT + 'px';
	}
}
