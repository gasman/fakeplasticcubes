var ap;
synth = Synth(44100);

initialAudioChunkSize = 44100; /* one second */
audioChunkSize = 22050;
minBufferSize = 1000; /* refill audio buffer if it falls below this many ms */

var WIDTH = 800, HEIGHT = 600;

var scrollerDivOuter = document.createElement('div');
var scrollerDivInner = document.createElement('div');

function Demo() {
	var self = {duration: 30000};
	var playStartPosition;
	var playStartTimestamp;
	var playing = false;
	var currentPosition = 0;
	var screenCanvas, screenCtx, canvas, ctx;
	
	self.init = function() {
		document.body.style.backgroundColor = 'black';
		screenCanvas = document.createElement('canvas');
		screenCanvas.width = WIDTH; screenCanvas.height = HEIGHT;
		screenCanvas.style.border = '1px solid #ccc';
		screenCanvas.style.display = 'block';
		screenCanvas.style.margin = 'auto';
		screenCtx = screenCanvas.getContext('2d');
		//document.body.appendChild(screenCanvas);
		scrollerDivOuter.appendChild(screenCanvas);
		canvas = document.createElement('canvas');
		canvas.width = WIDTH; canvas.height = HEIGHT;
		ctx = canvas.getContext('2d');
		
		scrollerDivInner.innerHTML = (
			'<p>ohai, gasman here.</p>' +
			'<p>you have been watching</p>' +
			'<p><em>fake plastic cubes</em></p>' +
			'<p>a 9K intro in Javascript</p>' +
			"<p>...which was supposed to be a 64K intro in Javascript, but I spent three days building the world's most brilliant audio framework and suddenly discovered that I had about 24 hours left to write an actual demo with it.</p>" +
			"<p>Demoscene project management for teh win.</p>" +
			"<p>What the hell, it's a proof of concept at least. All visuals are built on the 2D Canvas API, and audio is softsynthified in realtime (using the Mozilla audio API, or a tiny bit of Flash if that's unavailable). The whole thing is packed by arsing around PNG files in a particularly evil way.</p>" +
			"<p>Greetings to:</p>" +
			"<p>Approximate</p>" +
			"<p>The Taj Mahal Indian Takeaway, Budleigh</p>" +
			"<p>Approximate</p>" +
			"<p>oh, and everyone at Sundown.</p>" +
			"<p>Message to Javascript coders everywhere: Quit it with all those 256b/1K things, and start doing some proper demos instead.</p>" +
			"<p>Not like this one.</p>" +
			"<p>bye for now</p>" +
			"<p>- gasman (4 minutes before the deadline)</p>"
		);
		document.body.appendChild(scrollerDivOuter);
		scrollerDivOuter.appendChild(scrollerDivInner);
		
		scrollerDivOuter.style.margin = 'auto';
		scrollerDivOuter.style.width = WIDTH+2 + 'px';
		scrollerDivOuter.style.height = HEIGHT+2 + 'px';
		scrollerDivOuter.style.position = 'relative';
		scrollerDivInner.style.position = 'absolute';
		scrollerDivOuter.style.overflow = 'hidden';
		scrollerDivInner.style.top = HEIGHT + 'px';
		scrollerDivInner.style.width = WIDTH + 'px';
		scrollerDivInner.style.textAlign = 'center';
		scrollerDivInner.style.fontSize = '32px';
		scrollerDivInner.style.fontFamily = 'Helvetica, Arial, sans-serif';

		stage = new Stage(canvas);
	}
	
	self.playFrom = function(t) {
		playStartPosition = t;
		synth.seek(t);
		ap.ready(function() {
			/* audioStartOffset = number of ms from now until the audio starts playing */
			var audioStartOffset = ap.write(synth.generate(initialAudioChunkSize));
			playing = true;
			playStartTimestamp = (new Date()).getTime() + audioStartOffset;
			
			function tick() {
				if (!playing) return;
				currentPosition = (new Date()).getTime() - playStartTimestamp + playStartPosition;
				/* NOTE: currentPosition may be negative, if the initial audio is still finding its way
				through the buffer... */
				
				/* render the frame at time currentPosition */
				ctx.fillStyle = 'black';
				ctx.fillRect(0, 0, WIDTH, HEIGHT);
				
				if (currentPosition < 16000) {
					renderTunnelScene(currentPosition, stage);
				} else {
					renderRibbonScene(currentPosition - 16000, stage);
				}
				
				screenCtx.drawImage(canvas, 0, 0);
				
				if (ap.bufferedDuration() < minBufferSize) ap.write(synth.generate(audioChunkSize));
				
				if (self.onTick) self.onTick(currentPosition);
				
				setTimeout(tick, 1);
			}
			tick();
		})
	}
	
	self.stop = function() {
		playing = false;
		ap.stop();
	}
	
	self.resume = function() {
		if (!playing) self.playFrom(currentPosition);
	}
	
	return self;
}
var demo = Demo();
window.onload = function() {
	ap = AudioPlayer();
	demo.init();
	demo.playFrom(0);
}
