var minorRadius = 1;
var majorRadius = 4;

function tunnelModel() {
	var majorRadiusSubdivisions = 32;
	var minorRadiusSubdivisions = 16;
	
	var majorRadiusStep = Math.PI * 2 / majorRadiusSubdivisions;
	var minorRadiusStep = Math.PI * 2 / minorRadiusSubdivisions;
	
	var vertices = [];
	var normals = [];
	var faces = [];
	
	function uvToTorusPosition(u, v) {
		return Vectors.rotateY(
			[majorRadius + minorRadius * Math.cos(v), minorRadius * Math.sin(v), 0], u);
	}
	function uvToTorusNormal(u, v) {
		return Vectors.rotateY(
			[-Math.cos(v), -Math.sin(v), 0], u
		)
	}
	
	var vindex = 0;
	var nindex = 0;
	
	var shader = flatLambertianPolygon(0,255,32);
	
	for (u = 0; u < Math.PI * 2; u += majorRadiusStep) {
		for (v = 0; v < Math.PI * 2; v += minorRadiusStep) {
			normals[nindex] = uvToTorusNormal(u, v);
			vertices[vindex] = uvToTorusPosition(u - 0.4*majorRadiusStep, v - 0.4*minorRadiusStep);
			vertices[vindex+1] = uvToTorusPosition(u + 0.4*majorRadiusStep, v - 0.4*minorRadiusStep);
			vertices[vindex+2] = uvToTorusPosition(u + 0.4*majorRadiusStep, v + 0.4*minorRadiusStep);
			vertices[vindex+3] = uvToTorusPosition(u - 0.4*majorRadiusStep, v + 0.4*minorRadiusStep);
			faces.push([ [vindex, vindex+1, vindex+2, vindex+3], shader, [nindex] ]);
			nindex++;
			vindex += 4;
		}
	}
	
	return {
		v: vertices,
		n: normals,
		f: faces,
	}
}

var tunnel = tunnelModel();

function oldRenderTunnelScene(t, stage) {
	stage.startFrame();
	var angle = t / 4000;
	var cameraPosition = [majorRadius * Math.cos(angle), 0, majorRadius * Math.sin(angle)];
	var lookahead = 0.1;
	var cameraAt = [majorRadius * Math.cos(angle + lookahead), 0, majorRadius * Math.sin(angle + lookahead)];
	var twist = 20 * Math.sin(t/1000);
	stage.setCamera(cameraPosition, cameraAt, [0, 1, 0]);
	stage.addLight([3 * Math.cos(angle) + 0.1,3.1 * Math.sin(angle),0]);
	stage.renderModel(tunnel);
	stage.paint();
}

function renderTunnelScene(t, stage) {
	stage.startFrame();

	var lookahead = 0.4;
	var cameraAt = [majorRadius * Math.cos(lookahead), 0, majorRadius * Math.sin(lookahead)];
	
	var twist = t/6000;
	var cameraUp = [Math.sin(twist), Math.cos(twist), 0];

	stage.setCamera([majorRadius, 0, 0], cameraAt, cameraUp);
	
	//stage.addLight([majorRadius + 0.1, 0.1 ,0]);
	stage.addLight(cameraUp);
	
	var angle = t / 4000;
	stage.rotateY(angle);
	
	stage.renderModel(tunnel, true);
	stage.paint();
}
