#include <emscripten/bind.h>
#include "hello.h"
#include "WorldWrapper.h"

EMSCRIPTEN_BINDINGS(WorldJS)
{
    emscripten::function("HelloWorld", &Hello::hello);
    emscripten::function("helloAudio", &Hello::helloAudio, emscripten::allow_raw_pointers());
    emscripten::class_<WorldWrapper>("WorldWrapper")
        .constructor<unsigned, unsigned, unsigned>()
        .function("FeatureExtract", &WorldWrapper::FeatureExtract, emscripten::allow_raw_pointers())
        .function("Synthesis", &WorldWrapper::Synthesis_JS);
}