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
        ")
else ()
    set(flag "\
        -s WASM=1 \
        -s LLD_REPORT_UNDEFINED \
        -s STRICT=1 \
        -s TEXTDECODER=1 \
        -s SINGLE_FILE \
        -s ALLOW_MEMORY_GROWTH=1 \
        --post-js options/post.js \
        --no-entry \
        -O3 \
        --bind \
        --llvm-opts 3 \
        ")
endif ()

include_directories(
        lib/World/src/
        src/hello
        src/WorldWrapper
        src/
)

file(GLOB sources src/*.cpp)
file(GLOB Hello src/hello/*.cpp)
file(GLOB WorldWrapper src/WorldWrapper/*.cpp)
file(GLOB World lib/World/src/*.cpp)

add_library(Hello ${Hello})
add_library(Wrapper ${WorldWrapper})
add_library(World ${World})
target_link_libraries(Hello WorldWrapper World)

# World.JS
add_executable(WorldJS ${sources} ${Hello} ${WorldWrapper})
set_target_properties(WorldJS PROPERTIES LINK_FLAGS ${flag} DEBUG_POSTFIX "d")
target_link_libraries(WorldJS World)