#pragma once
#include <iostream>
#include <emscripten.h>
#include "memoryUtil.h"
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
    WorldWrapper(unsigned kernel_buffer_size, unsigned fs, double frame_period)
    {
        this->kernel_buffer_size_ = kernel_buffer_size;
        this->bytes_per_channel_ = kernel_buffer_size * sizeof(double);
        this->fs = fs;
        this->f0_length = GetSamplesForDIO(fs, kernel_buffer_size, frame_period);
        std::cout << f0_length << std::endl;
        // set options
        InitializeDioOption(&dio_option);
        dio_option.frame_period = frame_period;
        dio_option.speed = 1;
        dio_option.f0_floor = 71.0;
        dio_option.allowed_range = 0.2;
        InitializeHarvestOption(&harve_option);
        // Get harvest settings
        harve_option.frame_period = frame_period;
        harve_option.f0_floor = 71.0;
        InitializeCheapTrickOption(fs, &ct_option);
        ct_option.f0_floor = 71.0;
        ct_option.fft_size = GetFFTSizeForCheapTrick(fs, &ct_option);
        InitializeD4COption(&d4c_option);
        d4c_option.threshold = 0.85;
        specl = ct_option.fft_size / 2 + 1;

        // pre allocate
        f0 = new double[f0_length];
        time_axis = new double[f0_length];
        refined_f0 = new double[f0_length];
        spectrogram = new double *[f0_length];
        for (int i = 0; i < f0_length; i++)
        {
            spectrogram[i] = new double[specl];
        }
        aperiodicity = new double *[f0_length];
        for (int i = 0; i < f0_length; ++i)
        {
            aperiodicity[i] = new double[specl];
        }
    }
    ~WorldWrapper()
    {
        delete[] f0;
        delete[] refined_f0;
        delete[] time_axis;
        for (int i = 0; i < f0_length; i++)
        {
            delete[] spectrogram[i];
            delete[] aperiodicity[i];
        }
        delete[] spectrogram;
        delete[] aperiodicity;
    }

    /**
     * FeatureExtraction for input_ptr using dio , stonemask, cheap_trick, and d4c
     * 
     * @param input_ptr audio buffer from javascript Module.malloc pointer(float32)
     * @param fs sample rate
     * @param frame_period frame size
     * 
     * @return javascript object{"f0" =>, "time_axis"=>, "spectral"=>, "aperiodicity"=>, }
     * */
    EMSCRIPTEN_KEEPALIVE emscripten::val FeatureExtract(uintptr_t input_ptr);

    /** 
     * get f0 using dio and stonemask
     * 
     * @param input_ptr audio buffer from javascript Module.malloc pointer
     * @param fs sample rate
     * @param frame_period frame size
     * 
     * @return javascript object {"f0"=> , "time_axis"=>}
     **/
    EMSCRIPTEN_KEEPALIVE emscripten::val DioAndStonemask(uintptr_t input_ptr, int fs, double frame_period);

    // CheapTrick
    EMSCRIPTEN_KEEPALIVE emscripten::val CheapTricks(uintptr_t input_ptr, emscripten::val f0_val, emscripten::val time_axis_val, int fs);

    // D4C
    //EMSCRIPTEN_KEEPALIVE emscripten::val D4C(uintptr_t input_ptr, emscripten::val f0_val, emscripten::val time_axis_val, int fft_size, int fs);

    // Synthesis
    //EMSCRIPTEN_KEEPALIVE emscripten::val Synthesis(uintptr_t input_ptr, const emscripten::val &spectral_val, const emscripten::val &aperiodicity_val, int fft_size, int fs, const emscripten::val &frame_period);

private:
    unsigned kernel_buffer_size_ = 0;
    unsigned bytes_per_channel_ = 0;
    unsigned fs;
    int f0_length;
    int specl;
    double *f0;
    double *refined_f0;
    double *time_axis;
    double **spectrogram;
    double **aperiodicity;
    CheapTrickOption ct_option = {0};
    DioOption dio_option = {0};
    D4COption d4c_option = {0};
    HarvestOption harve_option = {0};
};