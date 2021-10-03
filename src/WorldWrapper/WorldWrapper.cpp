
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
    {
        input_buffer[i] = static_cast<double>(float_input_buffer[i]);
    }

    for (int i = 0; i < f0_length; i++)
    {
        f0[i] = 0.0;
        refined_f0[i] = 0.0;
        time_axis[i] = 0.0;
        for (int j = 0; j< specl; j++){
            spectrogram[i][j] = 0.0;
            aperiodicity[i][j] = 0.0;
        }
    }

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

    delete[] input_buffer;
    return ret;
}

emscripten::val WorldWrapper::Synthesis_JS(emscripten::val f0_val, const emscripten::val &spectral_val, const emscripten::val &aperiodicity_val, int fft_size, int fs, const emscripten::val &frame_period)
{
    int f0_length;
    double framePeriodVal;
    framePeriodVal = frame_period.as<double>();
    auto f0 = GetPtrFrom1XArray<double>(std::move(f0_val), &f0_length);
    int spectrogram_length = spectral_val["length"].as<int>();
    int aperiodicity_length = aperiodicity_val["length"].as<int>();
    double **spectrogram = GetPtrFrom2XArray<double>(spectral_val);
    double **aperiodicity = GetPtrFrom2XArray<double>(aperiodicity_val);
    int y_length = static_cast<int>((f0_length - 1) * framePeriodVal / 1000.0 * fs) + 1;
    auto y = new double[y_length];
    Synthesis(f0, f0_length, spectrogram, aperiodicity, fft_size, framePeriodVal, fs, y_length, y);
    emscripten::val ret = Get1XArray<double>(y, y_length);

    delete[] f0;
    for (int i = 0; i < spectrogram_length; i++)
    {
        delete[] spectrogram[i];
    }
    for (int i = 0; i < aperiodicity_length; i++)
    {
        delete[] aperiodicity[i];
    }
    delete[] y;
    return ret;
}