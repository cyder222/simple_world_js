
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
    int f0_length = GetSamplesForDIO(fs, input_buffer_length, frame_period);
    auto f0 = new double[f0_length];
    auto time_axis = new double[f0_length];
    auto refined_f0 = new double[f0_length];

    // run dio
    Dio(input_buffer, input_buffer_length, fs, &option, time_axis, f0);
    StoneMask(input_buffer, input_buffer_length, fs, time_axis, f0, f0_length, refined_f0);
    /*for (unsigned i = 0; i < f0_length; i++)
    {
        std::cout << "array[" << i << "] = " << f0[i] << std::endl; //個々の配列の値を出力
    }*/
    emscripten::val ret = emscripten::val::object();
    ret.set("f0", emscripten::val(emscripten::typed_memory_view(f0_length, refined_f0)));
    ret.set("time_axis", emscripten::val(emscripten::typed_memory_view(f0_length, time_axis)));

    delete[] f0;
    delete[] time_axis;
    return ret;
}
