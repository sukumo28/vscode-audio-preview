decoder.wasm.js:
	em++ -Wall \
	-L/opt/ffmpeg/lib -L/opt/ffmpeg/lib/opus \
	-I/opt/ffmpeg/include/ -I/opt/ffmpeg/include/opus \
	-lavcodec -lavformat -lavutil -lopus \
	-O3 \
	--closure 1 \
	--no-entry \
	-fno-exceptions \
	-s WASM=1 \
	-s STRICT=1 \
	-s MALLOC=emmalloc \
	-s ALLOW_MEMORY_GROWTH=1 \
	-s EXPORT_ES6 \
	-s MODULARIZE=1 \
	-s FORCE_FILESYSTEM=1 \
	-s SINGLE_FILE=1 \
	-s EXPORTED_RUNTIME_METHODS=['FS'] \
	-lembind \
	-o ./wasm/decoder.js \
	decoder.cpp
