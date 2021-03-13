#pragma once
#include <iostream>
#include <emscripten.h>
#include "emscripten/bind.h"
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

class WorldWrapper
{
public:
    WorldWrapper(unsigned kernel_buffer_size) : kernel_buffer_size_(kernel_buffer_size), bytes_per_channel_(kernel_buffer_size * sizeof(double)) {}

    /** 
     * get f0 using dio and stonemask
     * 
     * @param input_ptr audio buffer from javascript Module.malloc pointer
     * @param fs sample rate
     * @param frame_period frame size
     * @return javascript object {"f0"=> , "time_axis"=>}
     **/
    EMSCRIPTEN_KEEPALIVE emscripten::val DioAndStonemask(uintptr_t input_ptr, int fs, double frame_period);

private:
    unsigned kernel_buffer_size_ = 0;
    unsigned bytes_per_channel_ = 0;
};