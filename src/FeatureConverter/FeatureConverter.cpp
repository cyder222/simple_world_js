#include "librosa.h"
#include <emscripten.h>
#include "FeatureConverter.h"
#include "memoryUtil.h"
#include "eigen3/Eigen/Core"
#include "eigen3/unsupported/Eigen/FFT"

#include <vector>
#include <complex>
#include <iostream>

emscripten::val FeatureConverter::filterMelJS(uintptr_t wav_ptr, int buffer_length, float sr, int n_fft, int n_mels, float win_length, float hop_length)
{

    const float *float_input_buffer = reinterpret_cast<float *>(wav_ptr);
    std::vector<float> wav_vector(float_input_buffer, float_input_buffer + buffer_length);
    std::vector<std::vector<float>> mel = librosa::Feature::melspectrogram(wav_vector, sr, n_fft, hop_length, "hann", true, "reflect", 2, n_mels, 0.0, NULL);

    emscripten::val ret = emscripten::val::object();
    ret.set("mel", Get2XArrayFromVector<float>(mel));
    delete float_input_buffer;
    return ret;
}