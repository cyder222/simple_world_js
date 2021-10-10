#pragma once
#include <iostream>
#include <emscripten.h>
#include "memoryUtil.h"
#include "emscripten/bind.h"

class FeatureConverter
{
public:
    //EMSCRIPTEN_KEEPALIVE emscripten::val mgc2spJS(uintptr_t ptr, float alpha=0.0, float gamma=0.0, float fftlen = 256);

    /**
    * filterMel for input_ptr spectrum to mel-spectrum
    * using immitate librosa function
    *
    * @param wav_ptr pointer to audio wav array
    *
    * @return javascript object float32array
    * */
    EMSCRIPTEN_KEEPALIVE emscripten::val filterMelJS(uintptr_t wav_ptr, int buffer_length, float sr, int n_fft, int n_mels, float win_length, float hop_length, bool as_db=true);

    /**
     * mc2sp
     * @param ceps mel generaized cepstral for many frame Float32Array (flatten Array<Float32Array> ) 
     *             eg. when "ceps_length = 3, frame_length = 2"  [[1,2,3],[1,2,3]]->[1,2,3,1,2,3] )
     * @param ceps_length feature length of ceps. !!you cannot change this parameter from first time of calling this function
     * @param frame_length frame length of ceps
     * @param fftlen fft length  . !!you cannot change this parameter from first time of calling this function
     * @return ret.sp Array<Float32Array>
     * */
    EMSCRIPTEN_KEEPALIVE emscripten::val mcArray2spArrayJS(uintptr_t ceps, int ceps_length, int frame_length, float alpha = 0.0, int fftlen = 256);
};