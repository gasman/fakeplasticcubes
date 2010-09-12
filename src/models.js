BoxModel = function(px0, py0, pz0, px1, py1, pz1, shader) {
	if (!px1) px1 = 0; if (!py1) py1 = 0; if (!pz1) pz1 = 0;
	var x0 = Math.min(px0, px1); var x1 = Math.max(px0, px1);
	var y0 = Math.min(py0, py1); var y1 = Math.max(py0, py1);
	var z0 = Math.min(pz0, pz1); var z1 = Math.max(pz0, pz1);
	
	return {
		v: [ /* vertices */
			[x0,y0,z0], [x1,y0,z0], [x1,y0,z1], [x0,y0,z1], 
			[x0,y1,z0], [x1,y1,z0], [x1,y1,z1], [x0,y1,z1]
		],
		n: [ /* normals */
			[0,-1,0], [0,0,-1], [1,0,0], [0,0,1], [-1,0,0], [0,1,0]
		],
		f: [ /* faces */
			/* TODO: un-triangulate these, since we can work with arbitrary polygons */
			[[0,2,1],shader,[0,0,0]],
			[[0,3,2],shader,[0,0,0]],
			[[0,1,4],shader,[1,1,1]],
			[[1,5,4],shader,[1,1,1]],
			[[1,2,5],shader,[2,2,2]],
			[[2,6,5],shader,[2,2,2]],
			[[2,3,6],shader,[3,3,3]],
			[[3,7,6],shader,[3,3,3]],
			[[3,0,7],shader,[4,4,4]],
			[[0,4,7],shader,[4,4,4]],
			[[4,5,6],shader,[5,5,5]],
			[[4,6,7],shader,[5,5,5]]
		]
	};
}
