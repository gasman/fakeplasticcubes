# Fake Plastic Cubes

A 9K Javascript intro by Gasman, presented at the Sundown 2010 demo party
(...which might possibly serve as a framework for future 4-64K intros)

Online version: http://fakeplasticcubes.demozoo.org/

This intro features the following things which can usefully be repurposed:

 * PNG compression; the bulk of the JS code is stored as a PNG image to take advantage of DEFLATE
   compression, and unpacked via canvas getImageData
 * A framework for playing dynamically-generated audio, using Mozilla's audio API (implemented in
   Firefox 4) with a Flash fallback
 * An audio softsynth with open-ended support for custom generators and effects
 * A development view with a simple seekable timeline
 * A 3D engine (using canvas 2D as the backend) supporting moveable camera and Lambertian lighting
 * A handy build script for all of the above

## Build requirements

 * Ruby and rake - http://www.ruby-lang.org/
 * Imagemagick and rmagick - http://www.imagemagick.org/ , 'gem install rmagick'
 * YUI Javascript compressor - http://yuilibrary.com/downloads/#yuicompressor (JAR file - requires Java)
 * PNGOUT PNG optimiser - http://advsys.net/ken/utils.htm (Windows) / http://www.jonof.id.au/kenutils (Linux / OS X)

Optional:

 * Adobe Flex SDK, for building the DynamicAudio SWF - http://opensource.adobe.com/wiki/display/flexsdk/
   (if you don't intend to tinker with the Actionscript side of things and don't want to download
   a 100Mb SDK just to build one thing, just download the SWF from
   http://fakeplasticcubes.demozoo.org/da.swf and place it in the /src directory)
 * node.js, to provide a handy pocket-sized web server for developing under - http://nodejs.org/

## Build / development instructions

Edit the file paths at the start of Rakefile to point to your program locations. Then, to build:

    rake

This will place the build output in /dist. To fire up the web server:

    node server.js

You can then visit http://localhost:8124/ to view the compiled version in /dist, or http://localhost:8124/test/
for the development copy in /src, complete with seekable timeline. Any changes you make in /src will take effect
immediately, with no need to rebuild.

Alternatively, you can open the relevant index.html file directly in your browser, but that may
entail fiddling with local Flash security settings to make it work.

All Javascript files linked in &lt;script&gt; tags from /src/index.html will be packed into the PNG file.

## Roadmap

    |- dist - contains the build output (i.e. the stuff you'll zip up and release as your final intro)
    |- Rakefile - the build script
    |- server.js - web server app to run under node.js
    |- src - source files
    |   |- audio.js - audio playback support code
    |   |- da.swf - Flash fallback for the audio player
    |   |- demo.js - top-level demo startup code / main timer loop
    |   |- dist-index.html - minimal HTML wrapper to be copied to dist/index.html. Contains the bootstrap
    |   |                    PNG decompression code
    |   |- dynamicaudio.as - source code for da.swf
    |   |- index.html - HTML wrapper for development view - contains the seekable timeline code
    |   |- models.js - functions for building primitive 3D models for use with stage.js
    |   |- ribbon_scene.js - rendering code for the second scene of the intro
    |   |- shaders.js - lighting and 2D plotting functions for use with stage.js
    |   |- stage.js - 3D engine
    |   |- synth.js - softsynth (including instrument definitions and music data)
    |   |- tunnel_scene.js - rendering code for the first scene of the intro
    |
    |- tmp - temporary gunk produced during build

## Acknowledgements

Ben Firshman - original version of dynamicaudio.js
http://github.com/bfirsh/dynamicaudio.js/

Jacob Seidelin - original PNG compression hack
http://blog.nihilogic.dk/2008/05/compression-using-canvas-and-png.html

Alex Le - Ruby version of the PNG compressor, and most of the build script
http://alexle.net/archives/306

Cal Henderson - benchmarking effectiveness of different PNG parameters / optimisers
http://www.iamcal.com/png-store/

Felix Geisendörfer - various bits of server.js code I snarfed from node-paperboy
http://github.com/felixge/node-paperboy/
