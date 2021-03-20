#pragma once
#include "emscripten/bind.h"

template <class Type>
emscripten::val Get1XArray(Type *arr, int len)
{
    return emscripten::val(emscripten::typed_memory_view(len, arr));
}

template <class Type>
Type *GetPtrFrom1XArray(emscripten::val arr, int *len = nullptr)
{
    if (len == nullptr)
    {
        len = new int[1];
    }
    *len = arr["length"].as<int>();
    Type *ret = new Type[*len];
    emscripten::val module = emscripten::val::global("Module");
    int ptr = (int)ret / sizeof(Type);
    module["HEAPF64"].call<emscripten::val>("set", arr, emscripten::val(ptr));
    return ret;
}

template <class Type>
emscripten::val Get2XArray(Type **arr, int y_len, int x_len)
{
    emscripten::val arr2x = emscripten::val::array();
    for (int i = 0; i < y_len; i++)
    {
        arr2x.set(i, Get1XArray<Type>(arr[i], x_len));
    }
    return arr2x;
}
