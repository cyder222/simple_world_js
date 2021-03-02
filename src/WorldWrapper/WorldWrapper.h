#include <iostream>
#include <emscripten.h>

class WorldWrapper
{
public:
    // print hello world
    static EMSCRIPTEN_KEEPALIVE void Dio();
    static EMSCRIPTEN_KEEPALIVE void StoneMask();
    static EMSCRIPTEN_KEEPALIVE void Harvest();
    static EMSCRIPTEN_KEEPALIVE void CheapTrick();
    static EMSCRIPTEN_KEEPALIVE void D4C();
    static EMSCRIPTEN_KEEPALIVE void Synthesis();
};