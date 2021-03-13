#include <emscripten/bind.h>
#include "hello.h"
#include "WorldWrapper.h"

EMSCRIPTEN_BINDINGS(WorldJS)
{
    emscripten::function("HelloWorld", &Hello::hello);
    emscripten::function("helloAudio", &Hello::helloAudio, emscripten::allow_raw_pointers());
    emscripten::class_<WorldWrapper>("WorldWrapper")
        .constructor<int>()
        .function("DioAndStonemask", &WorldWrapper::DioAndStonemask, emscripten::allow_raw_pointers());
}