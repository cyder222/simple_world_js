#include <iostream>
#include <emscripten.h>
#include "emscripten/bind.h"

class Hello
{
public:
    // print hello world
    static EMSCRIPTEN_KEEPALIVE void hello();
    static EMSCRIPTEN_KEEPALIVE void helloAudio(uintptr_t input_ptr, uintptr_t output_ptr, unsigned channel_count, unsigned kRenderQuantumFrames);
};