cmake_minimum_required(VERSION 3.8)
project(WorldJS)

set(CMAKE_CXX_STANDARD 17)

if (CMAKE_BUILD_TYPE STREQUAL Debug)
    set(flag "\
        -s SAFE_HEAP=1 \
        -s WASM=1 \
        -s FORCE_FILESYSTEM=1 \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s LLD_REPORT_UNDEFINED \
        -s STRICT=1 \
        -s ASSERTIONS=1 \
        -s SINGLE_FILE \
        -s EXTRA_EXPORTED_RUNTIME_METHODS=['FS'] \
        --no-entry \
        --bind \
        -std=c++11 \
        ")
else ()
    set(flag "\
        -s WASM=1 \
        -s LLD_REPORT_UNDEFINED \
        -s STRICT=1 \
        -s TEXTDECODER=1 \
        -s SINGLE_FILE \
        -s ALLOW_MEMORY_GROWTH=1 \
        -s INITIAL_MEMORY=256MB \
        -s MAXIMUM_MEMORY=512MB \
        --post-js options/post.js \
        -s EXTRA_EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
        -s ENVIRONMENT='web' \
        -s MODULARIZE=1 \
        --no-entry \
        -O3 \
        --bind \
        --llvm-opts 3\
        -std=c++11 \
        ")
endif ()

include_directories(
        lib/World/src/
        lib/ooura-fft
        lib/mgc2sp
        lib/LibrosaCpp/librosa
        src/hello
        src/WorldWrapper
        src/FeatureConverter
        src/
)

file(GLOB sources src/*.cpp)
file(GLOB OOURAFFT lib/ooura-fft/src/*.c)
file(GLOB Hello src/hello/*.cpp)
file(GLOB MGC2SP lib/mgc2sp/*.c)
file(GLOB WorldWrapper src/WorldWrapper/*.cpp)
file(GLOB FeatureConverter src/FeatureConverter/*.cpp)
file(GLOB World lib/World/src/*.cpp)

add_library(Hello ${Hello})
add_library(Wrapper ${WorldWrapper})
add_library(FeatureConverter ${FeatureConverter})
add_library(MGC2SP ${MGC2SP})
add_library(World ${World})
add_library(OOURAFFT ${OOURAFFT})

# World.JS
add_executable(WorldJS ${sources} ${Hello} ${WorldWrapper} ${FeatureConverter} )
set_target_properties(WorldJS PROPERTIES LINK_FLAGS ${flag} DEBUG_POSTFIX "d")
target_link_libraries(WorldJS World OOURAFFT MGC2SP)