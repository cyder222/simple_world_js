# Audio Feature Extractor of World + some functions using emscripten
This is wrapper of World and some function(sp2melspectram, mcep2sp) using emscripten.
This library assume to use from AudioWorklet.
You can extract audio features from audio input comming from web audio api.

## How to build
```
emcmake cmake
make
```


## how to use

You can use like ollowing code.
Attension, if you want use for realtime usage, you should use web worker to process audio featrue extraction (and audio synthesys)
```sample.worklet.js
import { default as Module } from "./WorldJS.js";
import { HeapAudioBuffer, RingBuffer }
    from "./lib/wasm-audio-helper.js";

const framePeriod = 5.0;

const bufferSize = 128;
const channelCount = 2;

class ConverterProcessor extends AudioWorkletProcessor {

  constructor() {
    super();

    this._kernelBufferSize = bufferSize;
    this._channelCount = 1 // now only avaiable or 1 channnel

    this._inputRingBuffer =
        new RingBuffer(this._kernelBufferSize, this._channelCount);
    this._outputRingBuffer =
        new RingBuffer(this._kernelBufferSize, this._channelCount);

    this._heapInputBuffer =
        new HeapAudioBuffer(Module, this._kernelBufferSize, this._channelCount);
    this._heapOutputBuffer =
        new HeapAudioBuffer(Module, this._kernelBufferSize, this._channelCount);

    this._wrapper = new Module.WorldWrapper(1024*6, 48000, 5.0);
  }

  /**
   * @param {Float32Array[][]} inputs
   * @param {Float32Array[][]} outputs
   * @param {[name: string]: Float32Array} parameters
   * @returns {boolean|void}
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    this._inputRingBuffer.push(input);

    if (this._inputRingBuffer.framesAvailable >= this._kernelBufferSize) {
      this._inputRingBuffer.pull(this._heapInputBuffer.getChannelData());
      const { f0, fft_size, spectral, aperiodicity } = worldWrapper.FeatureExtract(buffer!.getHeapAddress());
      const convF0 = f0.map((value: number) => {
                return value * f0mul;
            });
      const val = worldWrapper.Synthesis( convF0, spectral, aperiodicity,fft_size,48000, 5.0);
      this._outputRingBuffer.push(new Float32Array([...val]));
    }
    
    this._outputRingBuffer.pull(output);
    return true;
  }
}

registerProcessor("my-worklet-processor", ConverterProcessor);
```



## reffer
WorldJS
World
