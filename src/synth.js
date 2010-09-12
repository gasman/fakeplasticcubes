function Synth(sampleRate) {

	var noteToFrequencyRatios = {
		/* Yes, I'm going to redefine the note names of the entire Western world's musical scale
		to their positions on a QWERTY keyboard. So sue me. */
		z:1, s:16/15, x:9/8, d:6/5, c:5/4, v:4/3, g:45/32, b:3/2, h:8/5, n:5/3, j:9/5, m:15/8
	};
	/* oh yes, and in order for the above table to be a valid tuning in just intonation,
	all tunes have to be written in the key of C which is then retuned accordingly.
	That's OK isn't it? */
	var baseFrequency = 261.625565
	function noteToFrequency(note, octave) {
		return baseFrequency * noteToFrequencyRatios[note] * Math.pow(2, octave - 4);
	}

	function SineGenerator(freq) {
		var self = {'alive': true};
		var period = sampleRate / freq;
		var t = 0;
		
		self.read = function() {
			var phase = t / period;
			var result = Math.sin(phase * 2 * Math.PI);
			t++;
			return [result, result];
		}
		return self;
	}
	
	function DescendingSineGenerator(freq, halflifeS) {
		var self = {'alive': true};
		var halflife = sampleRate * halflifeS;
		var t = 0;
		
		self.read = function() {
			var period = sampleRate / (freq * Math.pow(2, -(t / halflife)));
			var phase = t / period;
			var result = Math.sin(phase * 2 * Math.PI);
			t++;
			return [result, result];
		}
		return self;
	}
	
	function NoiseGenerator() {
		var self = {'alive': true};
		
		self.read = function() {
			return [Math.random(), Math.random()];
		}
		return self;
	}
	
	function AttackDecayGenerator(child, attackTimeS, decayTimeS, amplitude) {
		var self = {'alive': true}
		var attackTime = sampleRate * attackTimeS;
		var decayTime = sampleRate * decayTimeS;
		var t = 0;
		
		self.read = function() {
			if (!self.alive) return [0,0];
			var input = child.read();
			self.alive = child.alive;
			
			if (t < attackTime) {
				var localAmplitude = amplitude * (t / attackTime);
			} else {
				var localAmplitude = amplitude * (1 - (t - attackTime) / decayTime);
				if (localAmplitude <= 0) {
					self.alive = false;
					return [0,0];
				}
			}
			
			t++;
			return [localAmplitude * input[0], localAmplitude * input[1]];
		}
		return self;
	}
	
	var tempo = 480;
	var msPerBeat = 60000/tempo;
	var ticksPerBeat = sampleRate * 60/tempo;
	var ticksToNextBeat = 0;
	
	var presets = {
		'x': function(note, octave) { /* xylophone */
			return AttackDecayGenerator(
				SineGenerator(noteToFrequency(note, octave)),
				0.001, 0.75, 0.1
			);
		},
		'g': function(note, octave) { /* guitary thing */
			return AttackDecayGenerator(
				SineGenerator(noteToFrequency(note, octave)),
				0.001, 1, 0.1
			)
		},
		'h': function() { /* hihat */
			return AttackDecayGenerator(
				NoiseGenerator(),
				0.001, 0.1, 0.2
			);
		},
		'b': function() { /* bass drum */
			return AttackDecayGenerator(
				DescendingSineGenerator(100, 0.2),
				0.001, 0.1, 0.8
			);
		}
	}
	
	var patterns = {
		'1': [
			"x..x..x.x.x.x.x.x..x..x.x.x.x.x.",
			"z..b..x.d.x.j.d.h..d..z.j.j.v.b.",
			"5..5..6.6.6.5.5.4..5..6.4.5.5.5."
		],
		'2': [
			"x.....x.....x.....x...x.....x...",
			"z.....x.....d.....j...d.....v...",
			"5.....5.....5.....5...5.....5..."
		],
		'3': [
			"x.x...x.....x.....x...x.....x...",
			"b.z...x.....d.....j...h.....v...",
			"5.5...5.....5.....5...5.....5..."
		],
		'b': [
			"g.......g...g...g.......g...g...",
			"z.......c...j...h.......j...b...",
			"3.......3...2...2.......2...2..."
		],
		'c': [
			"g.......g...g...x...............",
			"z.......c...j...h...............",
			"3.......3...2...2..............."
		],
		'.': [
			"................................"
		],
		'p': [
			"b..bh.b..hb.h.b.b..bh.b..hb.h.b."
		],
		'q': [
			"b..bh.b..hb.h.b.h..............."
		]
	}
	
	var sequences = [
		"1111232111112321",
		".bbbbbbbbbbbbbbb",
		"..pppppqpppppppp"
	]
	
	function Channel(sequence) {
		var self = {};
		var sequencePosition, pattern, patternPosition;
		
		function init() {
			sequencePosition = 0;
			pattern = patterns[sequence[sequencePosition]];
			patternPosition = 0;
		}
		init();
		
		self.getNote = function() {
			var preset = presets[pattern[0][patternPosition]];
			var generator = null;
			if (preset) { /* sensible behaviour if presets['.'] is not defined */
				var params = [];
				for (var i=1; i < pattern.length; i++) {
					params[i-1] = pattern[i][patternPosition];
				}
				generator = preset.apply(null, params);
			}
			advanceNote();
			return generator;
		}
		
		function advanceNote() {
			patternPosition++;
			if (patternPosition >= pattern[0].length) {
				sequencePosition++;
				if (sequencePosition >= sequence.length) sequencePosition = 0;
				pattern = patterns[sequence[sequencePosition]];
				patternPosition = 0;
			}
		}
		
		self.seek = function(n) {
			init();
			while (n--) advanceNote();
		}
		
		return self;
	}
	
	var channels = [];
	for (var i = 0; i < sequences.length; i++) {
		channels[i] = Channel(sequences[i]);
	}
	
	var generators = [];
	function getNextNote() {
		var newGenerators = [];
		for (var i = 0; i < generators.length; i++) {
			if (generators[i].alive) newGenerators.push(generators[i]);
		}
		for (var i = 0; i < channels.length; i++) {
			var generator = channels[i].getNote();
			if (generator) newGenerators.push(generator);
		}
		generators = newGenerators;
	}
	
	return {
		'generate': function(samples) {
			var data = new Array(samples*2);
			for (var i = 0; i < samples*2; i += 2) {
				if (ticksToNextBeat <= 0) {
					getNextNote();
					ticksToNextBeat += ticksPerBeat;
				}
				ticksToNextBeat--;
				var v = [0,0];
				for (var j = 0; j < generators.length; j++) {
					var r = generators[j].read();
					v[0] += r[0]; v[1] += r[1];
				}
				data[i] = v[0];
				data[i+1] = v[1];
			}
			return data;
		},
		'seek': function(ms) {
			var tick = ms * sampleRate / 1000;
			ticksToNextBeat = tick % ticksPerBeat || ticksPerBeat;
				/* ticksToNextBeat=0 is an edge case; we'll be seeking to that beat below,
					so ticksToNextBeat should point to the next one instead (so advance by ticksPerBeat) */
			beatNumber = Math.floor(tick / ticksPerBeat);
			for (var i = 0; i < channels.length; i++) {
				channels[i].seek(beatNumber);
			}
		}
	}
}
