#include <iostream>
#include <emscripten.h>

class Hello
{
public:
    // print hello world
    static EMSCRIPTEN_KEEPALIVE void hello();
    static EMSCRIPTEN_KEEPALIVE void helloAudio(std::uintptr_t input_ptr, uintptr_t output_ptr, unsigned channel_count);
};