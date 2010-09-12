# Replace this with the path to the mxmlc executable in the Flex SDK.
MXMLC = '/Developer/SDKs/flex_sdk_4.0.0.14159/bin/mxmlc'

# Replace this with the path to the yuicompressor .jar file
YUICOMPRESSOR = '/Developer/SDKs/yuicompressor-2.4.2.jar'

# Replace this with the path to the java executable
JAVA = '/usr/bin/java'

# Replace this with the path to the pngout executable
PNGOUT = '/usr/local/bin/pngout'

PNG_WIDTH = 200 # tweaking this might squeeze out a few more bytes

INCLUDE_FILES = ["da.swf"] # files which should be copied from /src to /dist which aren't referenced by index.html
SUPPORT_FILES = ["fake_plastic_cubes.txt"] # files which should be copied to /dist but not counted in the byte total

require 'open3'
require 'RMagick'
include Magick

def minify( string = '', type = 'js' )
	cmd = %[ #{JAVA} -jar #{YUICOMPRESSOR} --type js ]
	stdin, stdout, stderr = Open3.popen3( cmd )
	stdin.write string
	stdin.close
	stdout.read
end

def merge( files = [] )
	merged_file = ""
	files.each do |file|
		File.open( file, "r") { |f| 
			merged_file += f.read + "\n" 
		}
	end
	merged_file
end

def string2png( string, output )
	height = (string.length.to_f / PNG_WIDTH).ceil
	image = Magick::Image.new(PNG_WIDTH, height) {
		self.background_color = 'black'
	}
	for i in 0 .. string.length
		color = '#%02X%02X%02X' % [string[i], string[i], string[i]]
		pixel = Magick::Pixel.from_color color
		image.pixel_color i % PNG_WIDTH, i / PNG_WIDTH, pixel
	end
	image.compression = ZipCompression
	image.write("png8:"+ output)
	
	image = nil
end

def dir_total_filesize(dir)
	total_size = 0
	Dir.new(dir).each do |f|
		filename = File.join(dir, f)
		if File.file?(filename) and not SUPPORT_FILES.include?(f)
			total_size += File.size(filename)
		end
	end
	return total_size
end

task :default => :build

desc "build the dynamicaudio SWF"
file "src/da.swf" => "src/dynamicaudio.as" do
	sh %[ #{MXMLC} -use-network=false -o src/da.swf -file-specs "src/dynamicaudio.as" ]
end

directory "tmp"
directory "dist"

desc "Build the intro"
task :build => ["src/da.swf", "tmp", "dist"] do
	# get a list of all JS files referenced in <script> tags in src/index.html
	files = []
	File.open('src/index.html') do |f|
		f.each do |line|
			if line =~ /<script .*src="(.*)">/
				files << "src/#{$1}"
			end
		end
	end
	src = minify(merge(files))
	string2png(src, "tmp/data.png")
	sh %[ #{PNGOUT} tmp/data.png dist/d.png -c0 -y ]
	cp "src/dist-index.html", "dist/index.html"
	for file in INCLUDE_FILES + SUPPORT_FILES
		cp File.join('src', file), File.join('dist', file)
	end
	rm_f "dist/.DS_Store" # screw you, Apple.
	file_size = dir_total_filesize('dist')
	puts "\n=== Final file size: #{file_size} bytes ==="
end

desc "Clear away all generated files"
task :clean do
	rm "src/da.swf"
	rm_rf "tmp"
	rm_rf "dist"
end
