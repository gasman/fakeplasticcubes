var http = require('http');
var fs = require("fs");
var path = require("path");

var contentTypes = {
	'html': 'text/html',
	'png': 'image/png',
	'swf': 'application/x-shockwave-flash',
	'js': 'text/javascript'
}

function serveFile(webroot, filename, response) {
	expandedPath = path.normalize(path.join(webroot, filename));
	if (expandedPath.substr(0, webroot.length + 1) != webroot + '/') {
		response.writeHead(403, {"Content-Type": "text/plain"});
		response.end("no you can't snoop around on my hard disk, kthxbye");
		return;
	}
	serveCheckedFile(expandedPath, response);
}

function serveCheckedFile(expandedPath, response) {
	fs.stat(expandedPath, function(err, stats) {
		if (err) {
			response.writeHead(err.errno == 2 ? 404 : 500, {"Content-Type": "text/plain"});
			response.end(err.message);
			return;
		}
		if (stats.isDirectory()) {
			serveCheckedFile(path.join(expandedPath, 'index.html'), response);
		} else {
			fs.readFile(expandedPath, "binary", function(err, file) {
				if(err) {
					response.writeHead(500, {"Content-Type": "text/plain"});
					response.end(err.message);
					return;
				}
				
				extension = expandedPath.split('.').slice(-1),
				contentType = contentTypes[extension] || 'application/octet-stream',
				response.writeHead(200, {"Content-Type": contentType});
				response.end(file, "binary");
			});
		}
	});
}

var distWebroot = process.cwd() + '/dist'
var srcWebroot = process.cwd() + '/src'

httpServer = http.createServer(function (request, response) {
	var match;
	if (match = request.url.match(/\/test\/(.*)$/)) {
		serveFile(srcWebroot, match[1], response);
	} else {
		serveFile(distWebroot, request.url, response);
	}
})
httpServer.listen(8124);

console.log('Server running at http://127.0.0.1:8124/');
