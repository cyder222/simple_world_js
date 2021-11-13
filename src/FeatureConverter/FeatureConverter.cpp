#include "librosa.h"
#include <emscripten.h>
#include "FeatureConverter.h"
#include "memoryUtil.h"
#include "eigen3/Eigen/Core"
#include "eigen3/unsupported/Eigen/FFT"
#include "SPTK.h"
#include "include/fftsg/rfft_engine.hpp"
#include "include/fftsg/fftsg_c.h"

#include <vector>
#include <complex>
#include <iostream>

emscripten::val FeatureConverter::filterMelJS(uintptr_t wav_ptr, int buffer_length, float sr, int n_fft, int n_mels, float win_length, float hop_length, bool as_db)
{

    const float *float_input_buffer = reinterpret_cast<float *>(wav_ptr);
    std::vector<float> wav_vector(float_input_buffer, float_input_buffer + buffer_length);
    librosa::Vectorf map_x = Eigen::Map<librosa::Vectorf>(wav_vector.data(), wav_vector.size());
    librosa::Matrixf mel = librosa::internal::melspectrogram(map_x, sr, n_fft, hop_length, "hann", true, "reflect", 2.0, n_mels, 0, sr / 2).transpose();
    if(as_db){
      mel = librosa::internal::power2db(mel);
    }
    std::vector<std::vector<float>> mel_vector(mel.rows(), std::vector<float>(mel.cols(), 0.f));
    for (int i = 0; i < mel.rows(); ++i){
      auto &row = mel_vector[i];
      Eigen::Map<librosa::Vectorf>(row.data(), row.size()) = mel.row(i);
    }
    emscripten::val ret = emscripten::val::object();
    ret.set("mel", Get2XArrayFromVector<float>(mel_vector));
    return ret;
}

emscripten::val FeatureConverter::mcArray2spArrayJS(uintptr_t ceps, int ceps_length, int frame_length, float alpha, int fftlen)
{
    const float *float_input_buffer = reinterpret_cast<float *>(ceps);
    int order = fftlen / 2;
    emscripten::val ret = emscripten::val::object();
    static float* ret_outputs = new float[(order + 1) * frame_length];
    for(int i = 0; i < (order + 1) * frame_length; i++){
        ret_outputs[i] = 0.0;
    }

    for (int i = 0; i < frame_length; i++)
    {
        // おそらくfreqtやrfftの中でメモリ周りで何か行われていて
        // staticをつけないとメモリ周りで落ちるのでstaticにしている。
        // これだと、最初に関数を使った時のfftlen, order, ceps_length以外だと落ちるので
        // 問題だらけではある
        static double *output_buffer = new double[order];
        static double *output = new double[fftlen];
        static double *input_buffer = new double[ceps_length];
        static int *m_ip = new int[2 + static_cast<int>(sqrt(fftlen/4))];
        static double *m_w = new double[fftlen / 2];

        for (int j = 0; j < 2 + static_cast<int>(sqrt(fftlen/4)); j++){
            m_ip[j] = 0;
        }
        for (int j=0; j< fftlen / 2; j++){
            m_w[j]= 0.0;
        }
        for (int j = 0; j < order; j++)
        {
            output_buffer[j] = 0;
        }

        for (int j = 0; j < fftlen; j++)
        {
            output[j] = 0.0;
        }

        for (int j = 0; j < ceps_length; j++)
        {
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
        fftsg::rdft(fftlen, 1, output, m_ip, m_w);
        ret_outputs[0 + i * (order + 1)] = static_cast<float>(std::exp(output[0]));
        for (int k = 1; k < order; k++)
        {
            ret_outputs[k + i * (order+1)] = static_cast<float>(std::exp(output[k * 2]));
            if(ret_outputs[k + i * (order+1)] < 0) {
                std::cout << ret_outputs[k + i * (order+1)] << std::endl;
            }
        }
        ret_outputs[order + i*(order+1)] = static_cast<float>(std::exp(output[1]));
        
    }

    ret.set("sp", Get2XArrayFrom1Array(ret_outputs, frame_length, order + 1));

    return ret;
}