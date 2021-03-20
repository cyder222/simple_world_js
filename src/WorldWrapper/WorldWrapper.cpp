
#include <iostream>
#include <emscripten.h>
#include "WorldWrapper.h"

//-----------------------------------------------------------------------------
// WORLD core functions.
//-----------------------------------------------------------------------------
#include "world/d4c.h"
#include "world/dio.h"
#include "world/harvest.h"
#include "world/matlabfunctions.h"
#include "world/cheaptrick.h"
#include "world/stonemask.h"
#include "world/synthesis.h"
#include "world/synthesisrealtime.h"

emscripten::val WorldWrapper::FeatureExtract(uintptr_t input_ptr)
{
    const float *float_input_buffer = reinterpret_cast<float *>(input_ptr);
    unsigned input_buffer_length = this->kernel_buffer_size_;
    double *input_buffer = new double[input_buffer_length];
    for (unsigned i = 0; i < input_buffer_length; ++i)
        input_buffer[i] = static_cast<double>(float_input_buffer[i]);

    // run
    Dio(input_buffer, input_buffer_length, fs, &dio_option, time_axis, f0);
    StoneMask(input_buffer, input_buffer_length, fs, time_axis, f0, f0_length, refined_f0);
    CheapTrick(input_buffer, input_buffer_length, fs, time_axis, f0, f0_length, &ct_option, spectrogram);
    D4C(input_buffer, input_buffer_length, fs, time_axis, f0, f0_length, ct_option.fft_size, &d4c_option, aperiodicity);

    emscripten::val ret = emscripten::val::object();
    ret.set("f0", emscripten::val(emscripten::typed_memory_view(f0_length, refined_f0)));
    ret.set("time_axis", emscripten::val(emscripten::typed_memory_view(f0_length, time_axis)));
    ret.set("spectral", Get2XArray<double>(spectrogram, f0_length, specl));
    ret.set("aperiodicity", Get2XArray<double>(aperiodicity, f0_length, specl));
    ret.set("fft_size", ct_option.fft_size);

    return ret;
}

emscripten::val WorldWrapper::DioAndStonemask(uintptr_t input_ptr, int fs, double frame_period)
{
    const float *float_input_buffer = reinterpret_cast<float *>(input_ptr);
    unsigned input_buffer_length = this->kernel_buffer_size_;
    double *input_buffer = new double[input_buffer_length];
    for (unsigned i = 0; i < input_buffer_length; ++i)
        input_buffer[i] = static_cast<double>(float_input_buffer[i]);
    // init dio
    DioOption option = {0};
    InitializeDioOption(&option);

    // Get Samples For DIO
    int f0_length = GetSamplesForDIO(48000, input_buffer_length, frame_period);
    auto f0 = new double[f0_length];
    auto time_axis = new double[f0_length];
    auto refined_f0 = new double[f0_length];

    // run dio
    Dio(input_buffer, input_buffer_length, 48000, &option, time_axis, f0);
    StoneMask(input_buffer, input_buffer_length, 48000, time_axis, f0, f0_length, refined_f0);

    for (unsigned i = 0; i < f0_length; i++)
    {
        std::cout << "array[" << i << "] = " << refined_f0[i] << std::endl; //個々の配列の値を出力
    }
    emscripten::val ret = emscripten::val::object();
    ret.set("f0", emscripten::val(emscripten::typed_memory_view(f0_length, refined_f0)));
    ret.set("time_axis", emscripten::val(emscripten::typed_memory_view(f0_length, time_axis)));

    delete[] f0;
    delete[] refined_f0;
    delete[] time_axis;
    delete[] input_buffer;
    return ret;
}

emscripten::val WorldWrapper::CheapTricks(uintptr_t input_ptr, emscripten::val f0_val, emscripten::val time_axis_val, int fs)
{
    const float *float_input_buffer = reinterpret_cast<float *>(input_ptr);
    unsigned input_buffer_length = this->kernel_buffer_size_;
    double *input_buffer = new double[input_buffer_length];
    for (unsigned i = 0; i < input_buffer_length; ++i)
        input_buffer[i] = static_cast<double>(float_input_buffer[i]);

    int f0_length;
    auto f0 = GetPtrFrom1XArray<double>(std::move(f0_val), &f0_length);
    auto time_axis = GetPtrFrom1XArray<double>(std::move(time_axis_val));
    // Run CheapTrick
    CheapTrickOption option = {0};
    InitializeCheapTrickOption(fs, &option);
    option.f0_floor = 71.0;
    option.fft_size = GetFFTSizeForCheapTrick(fs, &option);
    auto spectrogram = new double *[f0_length];
    int specl = option.fft_size / 2 + 1;
    for (int i = 0; i < f0_length; i++)
    {
        spectrogram[i] = new double[specl];
    }
    CheapTrick(input_buffer, input_buffer_length, fs, time_axis, f0, f0_length, &option, spectrogram);

    emscripten::val ret = emscripten::val::object();
    ret.set("spectral", Get2XArray<double>(spectrogram, f0_length, specl));
    ret.set("fft_size", option.fft_size);

    delete[] input_buffer;
    delete[] f0;
    delete[] time_axis;
    delete[] spectrogram;
    return ret;
}