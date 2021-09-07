#include "librosa.h"
#include <emscripten.h>
#include "FeatureConverter.h"
#include "memoryUtil.h"
#include "eigen3/Eigen/Core"
#include "eigen3/unsupported/Eigen/FFT"
#include "SPTK.h"
#include "include/fftsg/rfft_engine.hpp"

#include <vector>
#include <complex>
#include <iostream>

emscripten::val FeatureConverter::filterMelJS(uintptr_t wav_ptr, int buffer_length, float sr, int n_fft, int n_mels, float win_length, float hop_length)
{

    const float *float_input_buffer = reinterpret_cast<float *>(wav_ptr);
    std::vector<float> wav_vector(float_input_buffer, float_input_buffer + buffer_length);
    std::vector<std::vector<float>> mel = librosa::Feature::melspectrogram(wav_vector, sr, n_fft, hop_length, "hann", true, "reflect", 2.0, n_mels, 0, sr / 2);
    emscripten::val ret = emscripten::val::object();
    ret.set("mel", Get2XArrayFromVector<float>(mel));
    delete float_input_buffer;
    return ret;
}

emscripten::val FeatureConverter::mcArray2spArrayJS(uintptr_t ceps, int ceps_length, int frame_length, float alpha, int fftlen)
{
    const float *float_input_buffer = reinterpret_cast<float *>(ceps);
    int order = fftlen / 2;
    emscripten::val ret = emscripten::val::object();

    std::vector<std::vector<float>> ret_outputs;
    for(int i=0; i< frame_length; i++){
        // おそらくfreqtやrfftの中でメモリ周りで何か行われていて
        // staticをつけないとメモリ周りで落ちるのでstaticにしている。
        // これだと、最初に関数を使った時のfftlen, order, ceps_length以外だと落ちるので
        // 問題だらけではある
        static double* output_buffer = new double[order];
        static double* output = new double[fftlen];
        static double* input_buffer = new double[ceps_length];
        static fftsg::RFFTEngine<double> rfftEngine(fftlen);

        for(int j=0; j< order; j++){
            output_buffer[j] = 0;
        }

        for(int j=0; j< fftlen; j++){
            output[j] = 0.0;
        }

        for(int j=0; j < ceps_length; j++){
            input_buffer[j] = static_cast<double>(float_input_buffer[ceps_length * i + j]);
        }
        freqt(input_buffer, ceps_length, output_buffer, order, -1.0 * static_cast<double>(alpha));
        output_buffer[0] *= 2.0;
        output[0] = static_cast<float>(output_buffer[0]);
        for (int j = 1; j < order; j++)
        {
            double buffer = output_buffer[j];
            output[j] = buffer;
            output[fftlen - j] = buffer;
        }
        rfftEngine.rfft(output);
        std::vector<float> ret_output(order + 1) ;
        ret_output[0] = static_cast<float>(std::exp(output[0]));
        for (int k = 1; k < order; k++)
        {
            ret_output[k] = static_cast<float>(std::exp(output[k*2]));
        }
        ret_output[order] = static_cast<float>(std::exp(output[1]));
        ret_outputs.push_back(ret_output);
    }
    ret.set("sp", Get2XArrayFromVector(ret_outputs));

    delete float_input_buffer;

    return ret;
}

emscripten::val FeatureConverter::mc2spJS(uintptr_t ceps, int ceps_length, float alpha, int fftlen)
{
    const float *float_input_buffer = reinterpret_cast<float *>(ceps);
    double *input_buffer = new double[ceps_length];
    int order = fftlen / 2;
    double *output_buffer = new double[order];
    for (unsigned i = 0; i < ceps_length; ++i)
        input_buffer[i] = static_cast<double>(float_input_buffer[i]);

    freqt(input_buffer, ceps_length, output_buffer, order, -1.0 * static_cast<double>(alpha));
    output_buffer[0] *= 2.0;

    double* output = new double[fftlen];
    output[0] = output_buffer[0];
    for (int i = 1; i < order; i++)
    {
        output[i] = output_buffer[i];
        output[fftlen - i] = output_buffer[i];
    }

    fftsg::RFFTEngine<double> rfftEngine(fftlen);
    rfftEngine.rfft(output);
    float* ret_output = new float[order + 1];
    ret_output[0] = std::exp(output[0]);
    for (int i = 0; i < order; i++)
    {
        ret_output[i] = static_cast<float>(std::exp(output[i*2]));
    }
    ret_output[order] = static_cast<float>(std::exp(output[1]));
    emscripten::val ret = emscripten::val::object();
    ret.set("sp", Get1XArray<float>(ret_output, order + 1));

    delete float_input_buffer;
    delete[] input_buffer;
    delete[] output_buffer;
    delete[] output;
    delete[] ret_output;

    return ret;
}