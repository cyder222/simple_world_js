#include <emscripten/bind.h>
#include "hello.h"

EMSCRIPTEN_BINDINGS(WorldJS)
{
    emscripten::function("HelloWorld", &Hello::hello);
    emscripten::function("helloAudio", &Hello::helloAudio, emscripten::allow_raw_pointers());
}