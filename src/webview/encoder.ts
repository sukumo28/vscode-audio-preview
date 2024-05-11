export function encodeToWav(
  samples: Float32Array[],
  sampleRate: number,
  numChannels: number,
): Uint8Array {
  const dataBytes = samples[0].length * numChannels * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  // file size
  view.setUint32(4, 32 + dataBytes, true);
  // WAVE header
  writeString(view, 8, "WAVE");
  // fmt chunk
  writeString(view, 12, "fmt ");
  // byte of fmt chunk
  view.setUint32(16, 16, true);
  // fmt id
  view.setUint16(20, 1, true);
  // number of channels
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate
  view.setUint32(28, sampleRate * 2, true);
  // block size
  view.setUint16(32, 2, true);
  // bit depth
  view.setUint16(34, 16, true);
  // data chunk
  writeString(view, 36, "data");
  // byte of data chunk
  view.setUint32(40, dataBytes, true);
  // audio data
  floatTo16BitPCM(view, 44, samples);

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function floatTo16BitPCM(
  output: DataView,
  offset: number,
  input: Float32Array[],
) {
  const length = input[0].length;
  const numChannels = input.length;
  for (let i = 0; i < length; i++, offset += 2 * numChannels) {
    for (let ch = 0; ch < numChannels; ch++) {
      const s = Math.max(-1, Math.min(1, input[ch][i]));
      output.setInt16(offset + 2 * ch, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }
}
