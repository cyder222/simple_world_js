#pragma once
#include <iostream>
#include <emscripten.h>
#include "memoryUtil.h"
#include "emscripten/bind.h"

class FeatureConverter
{
public:
    /**
        * mgc2sp mel generaized coefficeint to spctrum
        * 
        * @param input_ptr mel cepstrum from javascript Module.malloc pointer(float32array)
        * 
        * @return javascript object float32array
        * */
    //EMSCRIPTEN_KEEPALIVE emscripten::val mgc2spJS(uintptr_t ptr, float alpha=0.0, float gamma=0.0, float fftlen = 256);

    /**
        * filterMel for input_ptr spectrum to mel-spectrum
        * using immitate librosa function
        * 
        * @param wav_ptr pointer to audio wav array
        * 
        * @return javascript object float32array
        * */
    EMSCRIPTEN_KEEPALIVE emscripten::val filterMelJS(uintptr_t wav_ptr, int buffer_length, float sr, int n_fft, int n_mels, float win_length, float hop_length);
};