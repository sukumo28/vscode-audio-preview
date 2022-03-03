#https://hub.docker.com/r/emscripten/emsdk/tags
FROM emscripten/emsdk:latest as build 

ARG FFMPEG_VERSION=4.3.2
ARG PREFIX=/opt/ffmpeg
ARG LIBOPUS_VER=1.3.1
ARG LIBMP3LAME_VER=3.100

# Build dependencies.
RUN apt-get update && apt-get install -y autoconf libtool build-essential

# Download libopus.
RUN cd /tmp/ && \
  git clone --depth 1 --branch v${LIBOPUS_VER} https://github.com/xiph/opus.git

# Configure and build libopus with emscripten.
RUN cd /tmp/opus && \
  ./autogen.sh && \
  emconfigure ./configure \
	CFLAGS="-O3" \
	--prefix=${PREFIX} \
	--disable-shared \
	--disable-rtcd \
	--disable-asm \
	--disable-intrinsics \
	--disable-doc \
	--disable-extra-programs \
	--disable-hardening \
	--disable-stack-protector \
	&& \
	emmake make -j && \
	emmake make install

# Download ffmpeg release source.
RUN cd /tmp/ && \
  wget http://ffmpeg.org/releases/ffmpeg-${FFMPEG_VERSION}.tar.gz && \
  tar zxf ffmpeg-${FFMPEG_VERSION}.tar.gz && rm ffmpeg-${FFMPEG_VERSION}.tar.gz

ARG CFLAGS="-O3 -I${PREFIX}/include -I${PREFIX}/include/opus"
ARG LDFLAGS="$CFLAGS -L${PREFIX}/lib -lopus"

# Configure and build FFmpeg with emscripten.
# Disable all programs and only enable features we will use.
# https://github.com/FFmpeg/FFmpeg/blob/master/configure
RUN cd /tmp/ffmpeg-${FFMPEG_VERSION} && \
  emconfigure ./configure \
  --prefix=${PREFIX} \
  --pkg-config=true \
  --cc=emcc --ranlib=emranlib --target-os=none --arch=x86 \
  --disable-everything --disable-all \
  --enable-avcodec --enable-avformat --enable-avutil \
  --enable-decoder="aac*,mp3*,pcm*,flac,libopus,opus,vorbis" \
  --enable-demuxer="aac*,mov,pcm*,mp3,ogg,flac,wav" \
  --enable-libopus \
  --enable-protocol="file" \
  --disable-programs  \
  --disable-asm --disable-runtime-cpudetect --disable-fast-unaligned --disable-pthreads --disable-w32threads --disable-os2threads \
  --disable-network --disable-debug --disable-stripping --disable-safe-bitstream-reader \
  --disable-d3d11va --disable-dxva2 --disable-vaapi --disable-vdpau --disable-bzlib \
  --disable-iconv --disable-libxcb --disable-lzma --disable-securetransport --disable-xlib \
  --extra-cflags="$CFLAGS" \
  --extra-cxxflags="$CFLAGS" \
  --extra-ldflags="$LDFLAGS" \
  && \
  emmake make -j && \
  emmake make install

COPY ./decoder.cpp /build/src/decoder.cpp
COPY ./Makefile /build/Makefile

WORKDIR /build