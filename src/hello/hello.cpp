#include "hello.h"
#include "stdio.h"
#include <iostream>

const unsigned kRenderQuantumFrames = 1024;
const unsigned kBytesPerChannel = kRenderQuantumFrames * sizeof(float);

void Hello::hello()
{
    std::cout << "hello world" << std::endl;
    printf("hello pirntf\n");
}

void Hello::helloAudio(uintptr_t input_ptr, uintptr_t output_ptr, unsigned channel_count, unsigned kRenderQuantumFrames)
{
    float *input_buffer = reinterpret_cast<float *>(input_ptr);
    float *output_buffer = reinterpret_cast<float *>(output_ptr);

    // Bypasses the data. By design, the channel count will always be the same
    // for |input_buffer| and |output_buffer|.
    for (unsigned channel = 0; channel < channel_count; ++channel)
    {
        float *destination = output_buffer + channel * kRenderQuantumFrames;
        float *source = input_buffer + channel * kRenderQuantumFrames;
        memcpy(destination, source, kRenderQuantumFrames * sizeof(float));
    }
}