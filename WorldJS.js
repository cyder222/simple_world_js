"use strict";

var Module = typeof Module !== "undefined" ? Module : {};

var moduleOverrides = {};

var key;

for (key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = function(status, toThrow) {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = false;

var ENVIRONMENT_IS_WORKER = false;

var ENVIRONMENT_IS_NODE = false;

var ENVIRONMENT_IS_SHELL = false;

ENVIRONMENT_IS_WEB = typeof window === "object";

ENVIRONMENT_IS_WORKER = typeof importScripts === "function";

ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";

ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
 throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)");
}

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

var nodeFS;

var nodePath;

if (ENVIRONMENT_IS_NODE) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = require("path").dirname(scriptDirectory) + "/";
 } else {
  scriptDirectory = __dirname + "/";
 }
 read_ = function shell_read(filename, binary) {
  var ret = tryParseAsDataURI(filename);
  if (ret) {
   return binary ? ret : ret.toString();
  }
  if (!nodeFS) nodeFS = require("fs");
  if (!nodePath) nodePath = require("path");
  filename = nodePath["normalize"](filename);
  return nodeFS["readFileSync"](filename, binary ? null : "utf8");
 };
 readBinary = function readBinary(filename) {
  var ret = read_(filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 if (process["argv"].length > 1) {
  thisProgram = process["argv"][1].replace(/\\/g, "/");
 }
 arguments_ = process["argv"].slice(2);
 if (typeof module !== "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 });
 process["on"]("unhandledRejection", abort);
 quit_ = function(status) {
  process["exit"](status);
 };
 Module["inspect"] = function() {
  return "[Emscripten Module object]";
 };
} else if (ENVIRONMENT_IS_SHELL) {
 if (typeof read != "undefined") {
  read_ = function shell_read(f) {
   var data = tryParseAsDataURI(f);
   if (data) {
    return intArrayToString(data);
   }
   return read(f);
  };
 }
 readBinary = function readBinary(f) {
  var data;
  data = tryParseAsDataURI(f);
  if (data) {
   return data;
  }
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  arguments_ = scriptArgs;
 } else if (typeof arguments != "undefined") {
  arguments_ = arguments;
 }
 if (typeof quit === "function") {
  quit_ = function(status) {
   quit(status);
  };
 }
 if (typeof print !== "undefined") {
  if (typeof console === "undefined") console = {};
  console.log = print;
  console.warn = console.error = typeof printErr !== "undefined" ? printErr : print;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document !== "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 {
  read_ = function(url) {
   try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText;
   } catch (err) {
    var data = tryParseAsDataURI(url);
    if (data) {
     return intArrayToString(data);
    }
    throw err;
   }
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = function(url) {
    try {
     var xhr = new XMLHttpRequest();
     xhr.open("GET", url, false);
     xhr.responseType = "arraybuffer";
     xhr.send(null);
     return new Uint8Array(xhr.response);
    } catch (err) {
     var data = tryParseAsDataURI(url);
     if (data) {
      return data;
     }
     throw err;
    }
   };
  }
  readAsync = function(url, onload, onerror) {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = function() {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    var data = tryParseAsDataURI(url);
    if (data) {
     onload(data.buffer);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = function(title) {
  document.title = title;
 };
} else {
 throw new Error("environment detection error");
}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.warn.bind(console);

for (key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (!Object.getOwnPropertyDescriptor(Module, "arguments")) {
 Object.defineProperty(Module, "arguments", {
  configurable: true,
  get: function() {
   abort("Module.arguments has been replaced with plain arguments_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (!Object.getOwnPropertyDescriptor(Module, "thisProgram")) {
 Object.defineProperty(Module, "thisProgram", {
  configurable: true,
  get: function() {
   abort("Module.thisProgram has been replaced with plain thisProgram (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

if (Module["quit"]) quit_ = Module["quit"];

if (!Object.getOwnPropertyDescriptor(Module, "quit")) {
 Object.defineProperty(Module, "quit", {
  configurable: true,
  get: function() {
   abort("Module.quit has been replaced with plain quit_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

assert(typeof Module["memoryInitializerPrefixURL"] === "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["pthreadMainPrefixURL"] === "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["cdInitializerPrefixURL"] === "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["filePackagePrefixURL"] === "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["read"] === "undefined", "Module.read option was removed (modify read_ in JS)");

assert(typeof Module["readAsync"] === "undefined", "Module.readAsync option was removed (modify readAsync in JS)");

assert(typeof Module["readBinary"] === "undefined", "Module.readBinary option was removed (modify readBinary in JS)");

assert(typeof Module["setWindowTitle"] === "undefined", "Module.setWindowTitle option was removed (modify setWindowTitle in JS)");

assert(typeof Module["TOTAL_MEMORY"] === "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");

if (!Object.getOwnPropertyDescriptor(Module, "read")) {
 Object.defineProperty(Module, "read", {
  configurable: true,
  get: function() {
   abort("Module.read has been replaced with plain read_ (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

if (!Object.getOwnPropertyDescriptor(Module, "readAsync")) {
 Object.defineProperty(Module, "readAsync", {
  configurable: true,
  get: function() {
   abort("Module.readAsync has been replaced with plain readAsync (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

if (!Object.getOwnPropertyDescriptor(Module, "readBinary")) {
 Object.defineProperty(Module, "readBinary", {
  configurable: true,
  get: function() {
   abort("Module.readBinary has been replaced with plain readBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

if (!Object.getOwnPropertyDescriptor(Module, "setWindowTitle")) {
 Object.defineProperty(Module, "setWindowTitle", {
  configurable: true,
  get: function() {
   abort("Module.setWindowTitle has been replaced with plain setWindowTitle (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

var STACK_ALIGN = 16;

function alignMemory(size, factor) {
 if (!factor) factor = STACK_ALIGN;
 return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
 switch (type) {
 case "i1":
 case "i8":
  return 1;

 case "i16":
  return 2;

 case "i32":
  return 4;

 case "i64":
  return 8;

 case "float":
  return 4;

 case "double":
  return 8;

 default:
  {
   if (type[type.length - 1] === "*") {
    return 4;
   } else if (type[0] === "i") {
    var bits = Number(type.substr(1));
    assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
    return bits / 8;
   } else {
    return 0;
   }
  }
 }
}

function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  err(text);
 }
}

function convertJsFunctionToWasm(func, sig) {
 if (typeof WebAssembly.Function === "function") {
  var typeNames = {
   "i": "i32",
   "j": "i64",
   "f": "f32",
   "d": "f64"
  };
  var type = {
   parameters: [],
   results: sig[0] == "v" ? [] : [ typeNames[sig[0]] ]
  };
  for (var i = 1; i < sig.length; ++i) {
   type.parameters.push(typeNames[sig[i]]);
  }
  return new WebAssembly.Function(type, func);
 }
 var typeSection = [ 1, 0, 1, 96 ];
 var sigRet = sig.slice(0, 1);
 var sigParam = sig.slice(1);
 var typeCodes = {
  "i": 127,
  "j": 126,
  "f": 125,
  "d": 124
 };
 typeSection.push(sigParam.length);
 for (var i = 0; i < sigParam.length; ++i) {
  typeSection.push(typeCodes[sigParam[i]]);
 }
 if (sigRet == "v") {
  typeSection.push(0);
 } else {
  typeSection = typeSection.concat([ 1, typeCodes[sigRet] ]);
 }
 typeSection[1] = typeSection.length - 2;
 var bytes = new Uint8Array([ 0, 97, 115, 109, 1, 0, 0, 0 ].concat(typeSection, [ 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0 ]));
 var module = new WebAssembly.Module(bytes);
 var instance = new WebAssembly.Instance(module, {
  "e": {
   "f": func
  }
 });
 var wrappedFunc = instance.exports["f"];
 return wrappedFunc;
}

var freeTableIndexes = [];

var functionsInTableMap;

function getEmptyTableSlot() {
 if (freeTableIndexes.length) {
  return freeTableIndexes.pop();
 }
 try {
  wasmTable.grow(1);
 } catch (err) {
  if (!(err instanceof RangeError)) {
   throw err;
  }
  throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.";
 }
 return wasmTable.length - 1;
}

function addFunctionWasm(func, sig) {
 if (!functionsInTableMap) {
  functionsInTableMap = new WeakMap();
  for (var i = 0; i < wasmTable.length; i++) {
   var item = wasmTable.get(i);
   if (item) {
    functionsInTableMap.set(item, i);
   }
  }
 }
 if (functionsInTableMap.has(func)) {
  return functionsInTableMap.get(func);
 }
 var ret = getEmptyTableSlot();
 try {
  wasmTable.set(ret, func);
 } catch (err) {
  if (!(err instanceof TypeError)) {
   throw err;
  }
  assert(typeof sig !== "undefined", "Missing signature argument to addFunction: " + func);
  var wrapped = convertJsFunctionToWasm(func, sig);
  wasmTable.set(ret, wrapped);
 }
 functionsInTableMap.set(func, ret);
 return ret;
}

function removeFunction(index) {
 functionsInTableMap.delete(wasmTable.get(index));
 freeTableIndexes.push(index);
}

function addFunction(func, sig) {
 assert(typeof func !== "undefined");
 return addFunctionWasm(func, sig);
}

function makeBigInt(low, high, unsigned) {
 return unsigned ? +(low >>> 0) + +(high >>> 0) * 4294967296 : +(low >>> 0) + +(high | 0) * 4294967296;
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
 tempRet0 = value;
};

var getTempRet0 = function() {
 return tempRet0;
};

function getCompilerSetting(name) {
 throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work";
}

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

if (!Object.getOwnPropertyDescriptor(Module, "wasmBinary")) {
 Object.defineProperty(Module, "wasmBinary", {
  configurable: true,
  get: function() {
   abort("Module.wasmBinary has been replaced with plain wasmBinary (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

var noExitRuntime = Module["noExitRuntime"] || true;

if (!Object.getOwnPropertyDescriptor(Module, "noExitRuntime")) {
 Object.defineProperty(Module, "noExitRuntime", {
  configurable: true,
  get: function() {
   abort("Module.noExitRuntime has been replaced with plain noExitRuntime (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

if (typeof WebAssembly !== "object") {
 abort("no native wasm support detected");
}

function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 if (noSafe) {
  switch (type) {
  case "i1":
   HEAP8[ptr >> 0] = value;
   break;

  case "i8":
   HEAP8[ptr >> 0] = value;
   break;

  case "i16":
   HEAP16[ptr >> 1] = value;
   break;

  case "i32":
   HEAP32[ptr >> 2] = value;
   break;

  case "i64":
   tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
   HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
   break;

  case "float":
   HEAPF32[ptr >> 2] = value;
   break;

  case "double":
   HEAPF64[ptr >> 3] = value;
   break;

  default:
   abort("invalid type for setValue: " + type);
  }
 } else {
  switch (type) {
  case "i1":
   SAFE_HEAP_STORE(ptr | 0, value | 0, 1);
   break;

  case "i8":
   SAFE_HEAP_STORE(ptr | 0, value | 0, 1);
   break;

  case "i16":
   SAFE_HEAP_STORE(ptr | 0, value | 0, 2);
   break;

  case "i32":
   SAFE_HEAP_STORE(ptr | 0, value | 0, 4);
   break;

  case "i64":
   tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
   SAFE_HEAP_STORE(ptr | 0, tempI64[0] | 0, 4), SAFE_HEAP_STORE(ptr + 4 | 0, tempI64[1] | 0, 4);
   break;

  case "float":
   SAFE_HEAP_STORE_D(ptr | 0, Math.fround(value), 4);
   break;

  case "double":
   SAFE_HEAP_STORE_D(ptr | 0, +value, 8);
   break;

  default:
   abort("invalid type for setValue: " + type);
  }
 }
}

function getValue(ptr, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 if (noSafe) {
  switch (type) {
  case "i1":
   return HEAP8[ptr >> 0];

  case "i8":
   return HEAP8[ptr >> 0];

  case "i16":
   return HEAP16[ptr >> 1];

  case "i32":
   return HEAP32[ptr >> 2];

  case "i64":
   return HEAP32[ptr >> 2];

  case "float":
   return HEAPF32[ptr >> 2];

  case "double":
   return HEAPF64[ptr >> 3];

  default:
   abort("invalid type for getValue: " + type);
  }
 } else {
  switch (type) {
  case "i1":
   return SAFE_HEAP_LOAD(ptr | 0, 1, 0) | 0;

  case "i8":
   return SAFE_HEAP_LOAD(ptr | 0, 1, 0) | 0;

  case "i16":
   return SAFE_HEAP_LOAD(ptr | 0, 2, 0) | 0;

  case "i32":
   return SAFE_HEAP_LOAD(ptr | 0, 4, 0) | 0;

  case "i64":
   return SAFE_HEAP_LOAD(ptr | 0, 8, 0) | 0;

  case "float":
   return Math.fround(SAFE_HEAP_LOAD_D(ptr | 0, 4, 0));

  case "double":
   return +SAFE_HEAP_LOAD_D(ptr | 0, 8, 0);

  default:
   abort("invalid type for getValue: " + type);
  }
 }
 return null;
}

function getSafeHeapType(bytes, isFloat) {
 switch (bytes) {
 case 1:
  return "i8";

 case 2:
  return "i16";

 case 4:
  return isFloat ? "float" : "i32";

 case 8:
  return "double";

 default:
  assert(0);
 }
}

function SAFE_HEAP_STORE(dest, value, bytes, isFloat) {
 if (dest <= 0) abort("segmentation fault storing " + bytes + " bytes to address " + dest);
 if (dest % bytes !== 0) abort("alignment error storing to address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
 if (runtimeInitialized) {
  var brk = _sbrk() >>> 0;
  if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when storing " + bytes + " bytes to address " + dest + ". DYNAMICTOP=" + brk);
  assert(brk >= _emscripten_stack_get_base());
  assert(brk <= HEAP8.length);
 }
 setValue(dest, value, getSafeHeapType(bytes, isFloat), 1);
 return value;
}

function SAFE_HEAP_STORE_D(dest, value, bytes) {
 return SAFE_HEAP_STORE(dest, value, bytes, true);
}

function SAFE_HEAP_LOAD(dest, bytes, unsigned, isFloat) {
 if (dest <= 0) abort("segmentation fault loading " + bytes + " bytes from address " + dest);
 if (dest % bytes !== 0) abort("alignment error loading from address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
 if (runtimeInitialized) {
  var brk = _sbrk() >>> 0;
  if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when loading " + bytes + " bytes from address " + dest + ". DYNAMICTOP=" + brk);
  assert(brk >= _emscripten_stack_get_base());
  assert(brk <= HEAP8.length);
 }
 var type = getSafeHeapType(bytes, isFloat);
 var ret = getValue(dest, type, 1);
 if (unsigned) ret = unSign(ret, parseInt(type.substr(1), 10));
 return ret;
}

function SAFE_HEAP_LOAD_D(dest, bytes, unsigned) {
 return SAFE_HEAP_LOAD(dest, bytes, unsigned, true);
}

function SAFE_FT_MASK(value, mask) {
 var ret = value & mask;
 if (ret !== value) {
  abort("Function table mask error: function pointer is " + value + " which is masked by " + mask + ", the likely cause of this is that the function pointer is being called by the wrong type.");
 }
 return ret;
}

function segfault() {
 abort("segmentation fault");
}

function alignfault() {
 abort("alignment fault");
}

function ftfault() {
 abort("Function table mask error");
}

var wasmMemory;

var ABORT = false;

var EXITSTATUS;

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}

function getCFunc(ident) {
 var func = Module["_" + ident];
 assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
 return func;
}

function ccall(ident, returnType, argTypes, args, opts) {
 var toC = {
  "string": function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    var len = (str.length << 2) + 1;
    ret = stackAlloc(len);
    stringToUTF8(str, ret, len);
   }
   return ret;
  },
  "array": function(arr) {
   var ret = stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }
 };
 function convertReturnValue(ret) {
  if (returnType === "string") return UTF8ToString(ret);
  if (returnType === "boolean") return Boolean(ret);
  return ret;
 }
 var func = getCFunc(ident);
 var cArgs = [];
 var stack = 0;
 assert(returnType !== "array", 'Return type should not be "array".');
 if (args) {
  for (var i = 0; i < args.length; i++) {
   var converter = toC[argTypes[i]];
   if (converter) {
    if (stack === 0) stack = stackSave();
    cArgs[i] = converter(args[i]);
   } else {
    cArgs[i] = args[i];
   }
  }
 }
 var ret = func.apply(null, cArgs);
 ret = convertReturnValue(ret);
 if (stack !== 0) stackRestore(stack);
 return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
 return function() {
  return ccall(ident, returnType, argTypes, arguments, opts);
 };
}

var ALLOC_NORMAL = 0;

var ALLOC_STACK = 1;

function allocate(slab, allocator) {
 var ret;
 assert(typeof allocator === "number", "allocate no longer takes a type argument");
 assert(typeof slab !== "number", "allocate no longer takes a number as arg0");
 if (allocator == ALLOC_STACK) {
  ret = stackAlloc(slab.length);
 } else {
  ret = _malloc(slab.length);
 }
 if (slab.subarray || slab.slice) {
  HEAPU8.set(slab, ret);
 } else {
  HEAPU8.set(new Uint8Array(slab), ret);
 }
 return ret;
}

var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
  return UTF8Decoder.decode(heap.subarray(idx, endPtr));
 } else {
  var str = "";
  while (idx < endPtr) {
   var u0 = heap[idx++];
   if (!(u0 & 128)) {
    str += String.fromCharCode(u0);
    continue;
   }
   var u1 = heap[idx++] & 63;
   if ((u0 & 224) == 192) {
    str += String.fromCharCode((u0 & 31) << 6 | u1);
    continue;
   }
   var u2 = heap[idx++] & 63;
   if ((u0 & 240) == 224) {
    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
   } else {
    if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte 0x" + u0.toString(16) + " encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!");
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
   }
   if (u0 < 65536) {
    str += String.fromCharCode(u0);
   } else {
    var ch = u0 - 65536;
    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
   }
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | u >> 6;
   heap[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | u >> 12;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   if (u >= 2097152) warnOnce("Invalid Unicode code point 0x" + u.toString(16) + " encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).");
   heap[outIdx++] = 240 | u >> 18;
   heap[outIdx++] = 128 | u >> 12 & 63;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) ++len; else if (u <= 2047) len += 2; else if (u <= 65535) len += 3; else len += 4;
 }
 return len;
}

function AsciiToString(ptr) {
 var str = "";
 while (1) {
  var ch = SAFE_HEAP_LOAD(ptr++ | 0, 1, 1) >>> 0;
  if (!ch) return str;
  str += String.fromCharCode(ch);
 }
}

function stringToAscii(str, outPtr) {
 return writeAsciiToMemory(str, outPtr, false);
}

var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
 assert(ptr % 2 == 0, "Pointer passed to UTF16ToString must be aligned to two bytes!");
 var endPtr = ptr;
 var idx = endPtr >> 1;
 var maxIdx = idx + maxBytesToRead / 2;
 while (!(idx >= maxIdx) && SAFE_HEAP_LOAD(idx * 2, 2, 1)) ++idx;
 endPtr = idx << 1;
 if (endPtr - ptr > 32 && UTF16Decoder) {
  return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
 } else {
  var str = "";
  for (var i = 0; !(i >= maxBytesToRead / 2); ++i) {
   var codeUnit = SAFE_HEAP_LOAD(ptr + i * 2 | 0, 2, 0) | 0;
   if (codeUnit == 0) break;
   str += String.fromCharCode(codeUnit);
  }
  return str;
 }
}

function stringToUTF16(str, outPtr, maxBytesToWrite) {
 assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
 assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 2) return 0;
 maxBytesToWrite -= 2;
 var startPtr = outPtr;
 var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
 for (var i = 0; i < numCharsToWrite; ++i) {
  var codeUnit = str.charCodeAt(i);
  SAFE_HEAP_STORE(outPtr | 0, codeUnit | 0, 2);
  outPtr += 2;
 }
 SAFE_HEAP_STORE(outPtr | 0, 0 | 0, 2);
 return outPtr - startPtr;
}

function lengthBytesUTF16(str) {
 return str.length * 2;
}

function UTF32ToString(ptr, maxBytesToRead) {
 assert(ptr % 4 == 0, "Pointer passed to UTF32ToString must be aligned to four bytes!");
 var i = 0;
 var str = "";
 while (!(i >= maxBytesToRead / 4)) {
  var utf32 = SAFE_HEAP_LOAD(ptr + i * 4 | 0, 4, 0) | 0;
  if (utf32 == 0) break;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
 return str;
}

function stringToUTF32(str, outPtr, maxBytesToWrite) {
 assert(outPtr % 4 == 0, "Pointer passed to stringToUTF32 must be aligned to four bytes!");
 assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  SAFE_HEAP_STORE(outPtr | 0, codeUnit | 0, 4);
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 SAFE_HEAP_STORE(outPtr | 0, 0 | 0, 4);
 return outPtr - startPtr;
}

function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}

function allocateUTF8(str) {
 var size = lengthBytesUTF8(str) + 1;
 var ret = _malloc(size);
 if (ret) stringToUTF8Array(str, HEAP8, ret, size);
 return ret;
}

function allocateUTF8OnStack(str) {
 var size = lengthBytesUTF8(str) + 1;
 var ret = stackAlloc(size);
 stringToUTF8Array(str, HEAP8, ret, size);
 return ret;
}

function writeStringToMemory(string, buffer, dontAddNull) {
 warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
 var lastChar, end;
 if (dontAddNull) {
  end = buffer + lengthBytesUTF8(string);
  lastChar = SAFE_HEAP_LOAD(end, 1, 0);
 }
 stringToUTF8(string, buffer, Infinity);
 if (dontAddNull) SAFE_HEAP_STORE(end, lastChar, 1);
}

function writeArrayToMemory(array, buffer) {
 assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
 HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  assert(str.charCodeAt(i) === str.charCodeAt(i) & 255);
  SAFE_HEAP_STORE(buffer++ | 0, str.charCodeAt(i) | 0, 1);
 }
 if (!dontAddNull) SAFE_HEAP_STORE(buffer | 0, 0 | 0, 1);
}

function alignUp(x, multiple) {
 if (x % multiple > 0) {
  x += multiple - x % multiple;
 }
 return x;
}

var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
 buffer = buf;
 Module["HEAP8"] = HEAP8 = new Int8Array(buf);
 Module["HEAP16"] = HEAP16 = new Int16Array(buf);
 Module["HEAP32"] = HEAP32 = new Int32Array(buf);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}

var TOTAL_STACK = 5242880;

if (Module["TOTAL_STACK"]) assert(TOTAL_STACK === Module["TOTAL_STACK"], "the stack size can no longer be determined at runtime");

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

if (!Object.getOwnPropertyDescriptor(Module, "INITIAL_MEMORY")) {
 Object.defineProperty(Module, "INITIAL_MEMORY", {
  configurable: true,
  get: function() {
   abort("Module.INITIAL_MEMORY has been replaced with plain INITIAL_MEMORY (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
  }
 });
}

assert(INITIAL_MEMORY >= TOTAL_STACK, "INITIAL_MEMORY should be larger than TOTAL_STACK, was " + INITIAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");

assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined, "JS engine does not provide full typed array support");

assert(!Module["wasmMemory"], "Use of `wasmMemory` detected.  Use -s IMPORTED_MEMORY to define wasmMemory externally");

assert(INITIAL_MEMORY == 16777216, "Detected runtime INITIAL_MEMORY setting.  Use -s IMPORTED_MEMORY to define wasmMemory dynamically");

var wasmTable;

function writeStackCookie() {
 var max = _emscripten_stack_get_end();
 assert((max & 3) == 0);
 SAFE_HEAP_STORE(((max >> 2) + 1) * 4, 34821223, 4);
 SAFE_HEAP_STORE(((max >> 2) + 2) * 4, 2310721022, 4);
}

function checkStackCookie() {
 if (ABORT) return;
 var max = _emscripten_stack_get_end();
 var cookie1 = SAFE_HEAP_LOAD(((max >> 2) + 1) * 4, 4, 1);
 var cookie2 = SAFE_HEAP_LOAD(((max >> 2) + 2) * 4, 4, 1);
 if (cookie1 != 34821223 || cookie2 != 2310721022) {
  abort("Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x" + cookie2.toString(16) + " " + cookie1.toString(16));
 }
}

(function() {
 var h16 = new Int16Array(1);
 var h8 = new Int8Array(h16.buffer);
 h16[0] = 25459;
 if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian!";
})();

function abortFnPtrError(ptr, sig) {
 abort("Invalid function pointer " + ptr + " called with signature '" + sig + "'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this). Build with ASSERTIONS=2 for more info.");
}

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

var runtimeExited = false;

__ATINIT__.push({
 func: function() {
  ___wasm_call_ctors();
 }
});

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 checkStackCookie();
 assert(!runtimeInitialized);
 runtimeInitialized = true;
 if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
 TTY.init();
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 checkStackCookie();
 FS.ignorePermissions = false;
 callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
 checkStackCookie();
 runtimeExited = true;
}

function postRun() {
 checkStackCookie();
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

var runDependencyTracking = {};

function getUniqueRunDependency(id) {
 var orig = id;
 while (1) {
  if (!runDependencyTracking[id]) return id;
  id = orig + Math.random();
 }
}

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(!runDependencyTracking[id]);
  runDependencyTracking[id] = 1;
  if (runDependencyWatcher === null && typeof setInterval !== "undefined") {
   runDependencyWatcher = setInterval(function() {
    if (ABORT) {
     clearInterval(runDependencyWatcher);
     runDependencyWatcher = null;
     return;
    }
    var shown = false;
    for (var dep in runDependencyTracking) {
     if (!shown) {
      shown = true;
      err("still waiting on run dependencies:");
     }
     err("dependency: " + dep);
    }
    if (shown) {
     err("(end of list)");
    }
   }, 1e4);
  }
 } else {
  err("warning: run dependency added without ID");
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(runDependencyTracking[id]);
  delete runDependencyTracking[id];
 } else {
  err("warning: run dependency removed without ID");
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

Module["preloadedImages"] = {};

Module["preloadedAudios"] = {};

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 what += "";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 var output = "abort(" + what + ") at " + stackTrace();
 what = output;
 var e = new WebAssembly.RuntimeError(what);
 throw e;
}

function hasPrefix(str, prefix) {
 return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://";

function isFileURI(filename) {
 return hasPrefix(filename, fileURIPrefix);
}

function createExportWrapper(name, fixedasm) {
 return function() {
  var displayName = name;
  var asm = fixedasm;
  if (!fixedasm) {
   asm = Module["asm"];
  }
  assert(runtimeInitialized, "native function `" + displayName + "` called before runtime initialization");
  assert(!runtimeExited, "native function `" + displayName + "` called after runtime exit (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
  if (!asm[name]) {
   assert(asm[name], "exported native function `" + displayName + "` not found");
  }
  return asm[name].apply(null, arguments);
 };
}

var wasmBinaryFile = "data:application/octet-stream;base64,AGFzbQEAAAABvwM4YAF/AX9gAn9/AGABfwBgAn9/AX9gA39/fwF/YAV/f39/fwF/YAAAYAN/f38AYAZ/f39/f38Bf2AFf39/f38AYAR/f39/AGAEf39/fwF/YAZ/f39/f38AYAh/f39/f39/fwF/YAABf2AHf39/f39/fwF/YAd/f39/f39/AGAFf35+fn4AYAN/f34AYAV/f39/fgF/YAF/AX5gCn9/f39/f39/f38AYAR/f39/AX5gA39+fwF+YAR/fn5/AGAKf39/f39/f39/fwF/YAd/f39/f35+AX9gBn9/f39+fgF/YAJ/fwF+YAh/f39/f39/fwBgD39/f39/f39/f39/f39/fwBgBX9/fn9/AGACf34AYAJ/fQBgC39/f39/f39/f39/AX9gDH9/f39/f39/f39/fwF/YAV/f39/fAF/YAZ/fH9/f38Bf2ACfn8Bf2AEf39/fgF+YAJ/fwF8YAN/f3wAYAN/fn4AYAJ/fABgCX9/f39/f39/fwF/YAN+f38Bf2ACfn4Bf2ADfn5+AX9gBH5+fn4Bf2ACf38BfWADf39/AX1gAn5+AX1gAX8BfGADf39/AXxgAn5+AXxgAnx/AXwC+AQWA2VudhlfZW1iaW5kX3JlZ2lzdGVyX2Z1bmN0aW9uAAwDZW52FV9lbWJpbmRfcmVnaXN0ZXJfdm9pZAABA2VudhVfZW1iaW5kX3JlZ2lzdGVyX2Jvb2wACQNlbnYbX2VtYmluZF9yZWdpc3Rlcl9zdGRfc3RyaW5nAAEDZW52HF9lbWJpbmRfcmVnaXN0ZXJfc3RkX3dzdHJpbmcABwNlbnYWX2VtYmluZF9yZWdpc3Rlcl9lbXZhbAABA2VudhhfZW1iaW5kX3JlZ2lzdGVyX2ludGVnZXIACQNlbnYWX2VtYmluZF9yZWdpc3Rlcl9mbG9hdAAHA2VudhxfZW1iaW5kX3JlZ2lzdGVyX21lbW9yeV92aWV3AAcWd2FzaV9zbmFwc2hvdF9wcmV2aWV3MQhmZF9jbG9zZQAAFndhc2lfc25hcHNob3RfcHJldmlldzEHZmRfcmVhZAALFndhc2lfc25hcHNob3RfcHJldmlldzEIZmRfd3JpdGUACwNlbnYFYWJvcnQABhZ3YXNpX3NuYXBzaG90X3ByZXZpZXcxEWVudmlyb25fc2l6ZXNfZ2V0AAMW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gICAgICAgPA/hL8FIAALC1QBAX4CQCADQcAAcQRAIAEgA0FAaq2GIQJCACEBDAELIANFDQAgAiADrSIEhiABQcAAIANrrYiEIQIgASAEhiEBCyAAQQAgARD6BiAAQQggAhD6BgtUAQF+AkAgA0HAAHEEQCACIANBQGqtiCEBQgAhAgwBCyADRQ0AIAJBwAAgA2uthiABIAOtIgSIhCEBIAIgBIghAgsgAEEAIAEQ+gYgAEEIIAIQ+gYL5wMCAn8CfiMAQSBrIgIkAAJAIAFC////////////AIMiBUKAgICAgIDAgDx9IAVCgICAgICAwP/DAH1UBEAgAUIEhiAAQjyIhCEFIABC//////////8PgyIAQoGAgICAgICACFoEQCAFQoGAgICAgICAwAB8IQQMAgsgBUKAgICAgICAgEB9IQQgAEKAgICAgICAgAiFQgBSDQEgBCAFQgGDfCEEDAELIABQIAVCgICAgICAwP//AFQgBUKAgICAgIDA//8AURtFBEAgAUIEhiAAQjyIhEL/////////A4NCgICAgICAgPz/AIQhBAwBC0KAgICAgICA+P8AIQQgBUL///////+//8MAVg0AQgAhBCAFQjCIpyIDQZH3AEkNACACQRBqIAAgAUL///////8/g0KAgICAgIDAAIQiBCADQYH3AGsQoAEgAiAAIARBgfgAIANrEKEBIAJBABDuBiIAQjyIIAJBCGpBABDuBkIEhoQhBCACQRAQ7gYgAkEYakEAEO4GhEIAUq0gAEL//////////w+DhCIAQoGAgICAgICACFoEQCAEQgF8IQQMAQsgAEKAgICAgICAgAiFQgBSDQAgBEIBgyAEfCEECyACQSBqJAAgBCABQoCAgICAgICAgH+DhL8LmwMBA38jAEHQAWsiAyQAIANBzAEgAhD1BkEAIQIgA0GgAWpBAEEoENMGGiADQcgBIANBzAEQ5wYQ9QYCQEEAIAEgA0HIAWogA0HQAGogA0GgAWoQpAFBAEgEQEF/IQEMAQsgAEHMABDnBkEATiECIABBABDnBiEEIABBygAQ4gZBAEwEQCAAQQAgBEFfcRD1BgsgBEEgcSEFAn8gAEEwEOcGBEAgACABIANByAFqIANB0ABqIANBoAFqEKQBDAELIABBMEHQABD1BiAAQRAgA0HQAGoQ9QYgAEEcIAMQ9QYg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ACABEPoGIABB+AAgAEEIEOcGIgIgAEEEEOcGIgNrrCIEEPoGIABB6AAgAyABp2ogAiABIARTGyACIAFCAFIbEPUGC9YBAgR/AX4CQAJAIABB8AAQ7gYiBVBFBEAgAEH4ABDuBiAFWQ0BCyAAEGYiA0F/Sg0BCyAAQegAQQAQ9QZBfw8LIABBCBDnBiICIQECQCAAQfAAEO4GIgVQDQAgAiEBIAUgAEH4ABDuBkJ/hXwiBSACIABBBBDnBiIEa6xZDQAgBCAFp2ohAQsgAEHoACABEPUGIABBBBDnBiEBIAIEQCAAQfgAIABB+AAQ7gYgAiABa0EBaqx8EPoGCyABQQFrIgBBABDjBiADRwRAIABBACADEPAGCyADC9YBAgN/AX4jAEEQayIDJAAgAEEAAn4gAbwiBEH/////B3EiAkGAgIAEa0H////3B00EQCACrUIZhkKAgICAgICAwD98IQVCAAwBCyACQYCAgPwHTwRAIAStQhmGQoCAgICAgMD//wCEIQVCAAwBCyACRQRAQgAMAQsgAyACrUIAIAJnIgJB0QBqEKABIANBCGpBABDuBkKAgICAgIDAAIVBif8AIAJrrUIwhoQhBSADQQAQ7gYLEPoGIABBCCAFIARBgICAgHhxrUIghoQQ+gYgA0EQaiQAC4oBAgJ/AX4jAEEQayIDJAAgAEEAAn4gAUUEQEIADAELIAMgASABQR91IgJqIAJzIgKtQgAgAmciAkHRAGoQoAEgA0EIakEAEO4GQoCAgICAgMAAhUGegAEgAmutQjCGfCABQYCAgIB4ca1CIIaEIQQgA0EAEO4GCxD6BiAAQQggBBD6BiADQRBqJAAL0AsCBX8PfiMAQeAAayIFJAAgAkIghiABQiCIhCEPIARCL4YgA0IRiIQhDCAEQv///////z+DIg1CD4YgA0IxiIQhESACIASFQoCAgICAgICAgH+DIQogAkL///////8/gyILQiCIIRAgDUIRiCESIARCMIinQf//AXEhBwJAAkAgAkIwiKdB//8BcSIJQQFrQf3/AU0EQCAHQQFrQf7/AUkNAQsgAVAgAkL///////////8AgyIOQoCAgICAgMD//wBUIA5CgICAgICAwP//AFEbRQRAIAJCgICAgICAIIQhCgwCCyADUCAEQv///////////wCDIgJCgICAgICAwP//AFQgAkKAgICAgIDA//8AURtFBEAgBEKAgICAgIAghCEKIAMhAQwCCyABIA5CgICAgICAwP//AIWEUARAIAIgA4RQBEBCgICAgICA4P//ACEKQgAhAQwDCyAKQoCAgICAgMD//wCEIQpCACEBDAILIAMgAkKAgICAgIDA//8AhYRQBEAgASAOhCECQgAhASACUARAQoCAgICAgOD//wAhCgwDCyAKQoCAgICAgMD//wCEIQoMAgsgASAOhFAEQEIAIQEMAgsgAiADhFAEQEIAIQEMAgsgDkL///////8/WARAIAVB0ABqIAEgCyABIAsgC1AiBht5IAZBBnStfKciBkEPaxCgAUEQIAZrIQYgBUHQABDuBiIBQiCIIAVB2ABqQQAQ7gYiC0IghoQhDyALQiCIIRALIAJC////////P1YNACAFQUBrIAMgDSADIA0gDVAiCBt5IAhBBnStfKciCEEPaxCgASAGIAhrQRBqIQYgBUHAABDuBiIDQjGIIAVByABqQQAQ7gYiAkIPhoQhESACQi+GIANCEYiEIQwgAkIRiCESCyAMQv////8PgyICIAFC/////w+DIgF+IhMgA0IPhkKAgP7/D4MiAyAPQv////8PgyIOfnwiBEIghiINIAEgA358IgwgDVStIAIgDn4iFSADIAtC/////w+DIgt+fCIUIBFC/////w+DIg0gAX58IhEgBCATVK1CIIYgBEIgiIR8IhMgAiALfiIWIAMgEEKAgASEIg9+fCIDIA0gDn58IhAgASASQv////8Hg0KAgICACIQiAX58IhJCIIZ8Ihd8IQQgByAJaiAGakH//wBrIQYCQCALIA1+IhggAiAPfnwiAiAYVK0gAiACIAEgDn58IgJWrXwgAiACIBQgFVStIBEgFFStfHwiAlatfCABIA9+fCABIAt+IgsgDSAPfnwiASALVK1CIIYgAUIgiIR8IAIgAUIghnwiASACVK18IAEgASAQIBJWrSADIBZUrSADIBBWrXx8QiCGIBJCIIiEfCIBVq18IAEgESATVq0gEyAXVq18fCICIAFUrXwiAUKAgICAgIDAAINQRQRAIAZBAWohBgwBCyAMQj+IIQMgAUIBhiACQj+IhCEBIAJCAYYgBEI/iIQhAiAMQgGGIQwgAyAEQgGGhCEECyAGQf//AU4EQCAKQoCAgICAgMD//wCEIQpCACEBDAELAkAgBkEATARAQQEgBmsiB0GAAU8EQEIAIQEMAwsgBUEwaiAMIAQgBkH/AGoiBhCgASAFQSBqIAIgASAGEKABIAVBEGogDCAEIAcQoQEgBSACIAEgBxChASAFQSAQ7gYgBUEQEO4GhCAFQTAQ7gYgBUE4akEAEO4GhEIAUq2EIQwgBUEoakEAEO4GIAVBGGpBABDuBoQhBCAFQQhqQQAQ7gYhASAFQQAQ7gYhAgwBCyABQv///////z+DIAatQjCGhCEBCyABIAqEIQogDFAgBEJ/VSAEQoCAgICAgICAgH9RG0UEQCAKIAJCAXwiASACVK18IQoMAQsgDCAEQoCAgICAgICAgH+FhFBFBEAgAiEBDAELIAogAiACQgGDfCIBIAJUrXwhCgsgAEEAIAEQ+gYgAEEIIAoQ+gYgBUHgAGokAAuUCgIEfwR+IwBB8ABrIgUkACAEQv///////////wCDIQkCQAJAIAFCAX0iC0J/USACQv///////////wCDIgogASALVq18QgF9IgtC////////v///AFYgC0L///////+///8AURtFBEAgA0IBfSILQn9SIAkgAyALVq18QgF9IgtC////////v///AFQgC0L///////+///8AURsNAQsgAVAgCkKAgICAgIDA//8AVCAKQoCAgICAgMD//wBRG0UEQCACQoCAgICAgCCEIQQgASEDDAILIANQIAlCgICAgICAwP//AFQgCUKAgICAgIDA//8AURtFBEAgBEKAgICAgIAghCEEDAILIAEgCkKAgICAgIDA//8AhYRQBEBCgICAgICA4P//ACACIAEgA4UgAiAEhUKAgICAgICAgIB/hYRQIgYbIQRCACABIAYbIQMMAgsgAyAJQoCAgICAgMD//wCFhFANASABIAqEUARAIAMgCYRCAFINAiABIAODIQMgAiAEgyEEDAILIAMgCYRQRQ0AIAEhAyACIQQMAQsgAyABIAEgA1QgCSAKViAJIApRGyIHGyEJIAQgAiAHGyILQv///////z+DIQogAiAEIAcbIgJCMIinQf//AXEhCCALQjCIp0H//wFxIgZFBEAgBUHgAGogCSAKIAkgCiAKUCIGG3kgBkEGdK18pyIGQQ9rEKABQRAgBmshBiAFQegAakEAEO4GIQogBUHgABDuBiEJCyABIAMgBxshAyACQv///////z+DIQQgCEUEQCAFQdAAaiADIAQgAyAEIARQIgcbeSAHQQZ0rXynIgdBD2sQoAFBECAHayEIIAVB2ABqQQAQ7gYhBCAFQdAAEO4GIQMLIARCA4YgA0I9iIRCgICAgICAgASEIQQgCkIDhiAJQj2IhCEBIANCA4YhAyACIAuFIQwCQCAGIAhrIgdFDQAgB0H/AEsEQEIAIQRCASEDDAELIAVBQGsgAyAEQYABIAdrEKABIAVBMGogAyAEIAcQoQEgBUEwEO4GIAVBwAAQ7gYgBUHIAGpBABDuBoRCAFKthCEDIAVBOGpBABDuBiEECyABQoCAgICAgIAEhCEKIAlCA4YhAgJAIAxCf1cEQCACIAN9IgEgCiAEfSACIANUrX0iBIRQBEBCACEDQgAhBAwDCyAEQv////////8DVg0BIAVBIGogASAEIAEgBCAEUCIHG3kgB0EGdK18p0EMayIHEKABIAYgB2shBiAFQShqQQAQ7gYhBCAFQSAQ7gYhAQwBCyACIAN8IgEgA1StIAQgCnx8IgRCgICAgICAgAiDUA0AIAFCAYMgBEI/hiABQgGIhIQhASAGQQFqIQYgBEIBiCEECyALQoCAgICAgICAgH+DIQIgBkH//wFOBEAgAkKAgICAgIDA//8AhCEEQgAhAwwBC0EAIQcCQCAGQQBKBEAgBiEHDAELIAVBEGogASAEIAZB/wBqEKABIAUgASAEQQEgBmsQoQEgBUEAEO4GIAVBEBDuBiAFQRhqQQAQ7gaEQgBSrYQhASAFQQhqQQAQ7gYhBAsgAadBB3EiBkEES60gBEI9hiABQgOIhCIBfCIDIAFUrSAEQgOIQv///////z+DIAetQjCGhCAChHwhBAJAIAZBBEYEQCAEIANCAYMiASADfCIDIAFUrXwhBAwBCyAGRQ0BCwsgAEEAIAMQ+gYgAEEIIAQQ+gYgBUHwAGokAAuLAgICfwN+IwBBEGsiAiQAAkAgAb0iBUL///////////8AgyIEQoCAgICAgIAIfUL/////////7/8AWARAIARCPIYhBiAEQgSIQoCAgICAgICAPHwhBAwBCyAEQoCAgICAgID4/wBaBEAgBUI8hiEGIAVCBIhCgICAgICAwP//AIQhBAwBCyAEUARAQgAhBAwBCyACIARCACAFp2dBIGogBEIgiKdnIARCgICAgBBUGyIDQTFqEKABIAJBCGpBABDuBkKAgICAgIDAAIVBjPgAIANrrUIwhoQhBCACQQAQ7gYhBgsgAEEAIAYQ+gYgAEEIIAQgBUKAgICAgICAgIB/g4QQ+gYgAkEQaiQAC9sBAgF/An5BASEEAkAgAEIAUiABQv///////////wCDIgVCgICAgICAwP//AFYgBUKAgICAgIDA//8AURsNACACQgBSIANC////////////AIMiBkKAgICAgIDA//8AViAGQoCAgICAgMD//wBRGw0AIAAgAoQgBSAGhIRQBEBBAA8LIAEgA4NCAFkEQEF/IQQgACACVCABIANTIAEgA1EbDQEgACAChSABIAOFhEIAUg8LQX8hBCAAIAJWIAEgA1UgASADURsNACAAIAKFIAEgA4WEQgBSIQQLIAQLxAECAX8CfkF/IQMCQCAAQgBSIAFC////////////AIMiBEKAgICAgIDA//8AViAEQoCAgICAgMD//wBRGw0AQQAgAkL///////////8AgyIFQoCAgICAgMD//wBWIAVCgICAgICAwP//AFEbDQAgACAEIAWEhFAEQEEADwsgASACg0IAWQRAQQAgASACUyABIAJRGw0BIAAgASAChYRCAFIPCyAAQgBSIAEgAlUgASACURsNACAAIAEgAoWEQgBSIQMLIAMLOQAgAEEAIAEQ+gYgAEEIIAJC////////P4MgBEIwiKdBgIACcSACQjCIp0H//wFxcq1CMIaEEPoGC28CAX8BfiMAQRBrIgIkACAAQQACfiABRQRAQgAMAQsgAiABrUIAIAFnIgFB0QBqEKABIAJBCGpBABDuBkKAgICAgIDAAIVBnoABIAFrrUIwhnwhAyACQQAQ7gYLEPoGIABBCCADEPoGIAJBEGokAAtJAQF/IwBBEGsiBSQAIAUgASACIAMgBEKAgICAgICAgIB/hRCRAiAAQQAgBUEAEO4GEPoGIABBCCAFQQgQ7gYQ+gYgBUEQaiQAC+0CAQF/IwBB0ABrIgQkAAJAIANBgIABTgRAIARBIGogASACQgBCgICAgICAgP//ABCQAiAEQShqQQAQ7gYhAiAEQSAQ7gYhASADQf//AUgEQCADQf//AGshAwwCCyAEQRBqIAEgAkIAQoCAgICAgID//wAQkAIgA0H9/wIgA0H9/wJIG0H+/wFrIQMgBEEYakEAEO4GIQIgBEEQEO4GIQEMAQsgA0GBgH9KDQAgBEFAayABIAJCAEKAgICAgIDAABCQAiAEQcgAakEAEO4GIQIgBEHAABDuBiEBIANBg4B+SgRAIANB/v8AaiEDDAELIARBMGogASACQgBCgICAgICAwAAQkAIgA0GGgH0gA0GGgH1KG0H8/wFqIQMgBEE4akEAEO4GIQIgBEEwEO4GIQELIAQgASACQgAgA0H//wBqrUIwhhCQAiAAQQggBEEIakEAEO4GEPoGIABBACAEQQAQ7gYQ+gYgBEHQAGokAAttAQN+IABBCCACQiCIIgMgAUIgiCIEfiACQv////8PgyICIAFC/////w+DIgF+IgVCIIggAiAEfnwiAkIgiHwgASADfiACQv////8Pg3wiAUIgiHwQ+gYgAEEAIAVC/////w+DIAFCIIaEEPoGC+ARAgV/C34jAEHAAWsiBSQAIARC////////P4MhEiACQv///////z+DIQwgAiAEhUKAgICAgICAgIB/gyERIARCMIinQf//AXEhBwJAAkACQCACQjCIp0H//wFxIglBAWtB/f8BTQRAIAdBAWtB/v8BSQ0BCyABUCACQv///////////wCDIgpCgICAgICAwP//AFQgCkKAgICAgIDA//8AURtFBEAgAkKAgICAgIAghCERDAILIANQIARC////////////AIMiAkKAgICAgIDA//8AVCACQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIREgAyEBDAILIAEgCkKAgICAgIDA//8AhYRQBEAgAyACQoCAgICAgMD//wCFhFAEQEIAIQFCgICAgICA4P//ACERDAMLIBFCgICAgICAwP//AIQhEUIAIQEMAgsgAyACQoCAgICAgMD//wCFhFAEQEIAIQEMAgsgASAKhFANAiACIAOEUARAIBFCgICAgICAwP//AIQhEUIAIQEMAgsgCkL///////8/WARAIAVBsAFqIAEgDCABIAwgDFAiBht5IAZBBnStfKciBkEPaxCgAUEQIAZrIQYgBUG4AWpBABDuBiEMIAVBsAEQ7gYhAQsgAkL///////8/Vg0AIAVBoAFqIAMgEiADIBIgElAiCBt5IAhBBnStfKciCEEPaxCgASAGIAhqQRBrIQYgBUGoAWpBABDuBiESIAVBoAEQ7gYhAwsgBUGQAWogEkKAgICAgIDAAIQiFEIPhiADQjGIhCICQoTJ+c6/5ryC9QAgAn0iBBCZAiAFQYABakIAIAVBmAFqQQAQ7gZ9IAQQmQIgBUHwAGogBUGAARDuBkI/iCAFQYgBakEAEO4GQgGGhCIEIAIQmQIgBUHgAGogBEIAIAVB+ABqQQAQ7gZ9EJkCIAVB0ABqIAVB4AAQ7gZCP4ggBUHoAGpBABDuBkIBhoQiBCACEJkCIAVBQGsgBEIAIAVB2ABqQQAQ7gZ9EJkCIAVBMGogBUHAABDuBkI/iCAFQcgAakEAEO4GQgGGhCIEIAIQmQIgBUEgaiAEQgAgBUE4akEAEO4GfRCZAiAFQRBqIAVBIBDuBkI/iCAFQShqQQAQ7gZCAYaEIgQgAhCZAiAFIARCACAFQRhqQQAQ7gZ9EJkCIAYgCSAHa2ohBgJ+QgAgBUEAEO4GQj+IIAVBCGpBABDuBkIBhoRCAX0iCkL/////D4MiBCACQiCIIgt+Ig4gCkIgiCIKIAJC/////w+DIhB+fCICQiCIIAIgDlStQiCGhCAKIAt+fCACQiCGIgsgBCAQfnwiAiALVK18IAIgAiAEIANCEYhC/////w+DIg5+IhAgCiADQg+GQoCA/v8PgyINfnwiC0IghiIPIAQgDX58IA9UrSAKIA5+IAsgEFStQiCGIAtCIIiEfHx8IgJWrXwgAkIAUq18fSILQv////8PgyIOIAR+IhAgCiAOfiINIAQgC0IgiCIPfnwiC0IghnwiDiAQVK0gCiAPfiALIA1UrUIghiALQiCIhHx8IA5CACACfSICQiCIIgsgBH4iECACQv////8PgyINIAp+fCICQiCGIg8gBCANfnwgD1StIAogC34gAiAQVK1CIIYgAkIgiIR8fHwiAiAOVK18IAJCAn0iECACVK18QgF9IgtC/////w+DIgIgDEIChiABQj6IhEL/////D4MiBH4iDiABQh6IQv////8PgyIKIAtCIIgiC358Ig0gDlStIA0gDSAQQiCIIg4gDEIeiEL//+//D4NCgIAQhCIMfnwiDVatfCALIAx+fCACIAx+IhMgBCALfnwiDyATVK1CIIYgD0IgiIR8IA0gDSAPQiCGfCINVq18IA0gDSAKIA5+IhMgEEL/////D4MiECAEfnwiDyATVK0gDyAPIAIgAUIChkL8////D4MiE358Ig9WrXx8Ig1WrXwgDSALIBN+IgsgDCAQfnwiDCAEIA5+fCIEIAIgCn58IgJCIIggAiAEVK0gCyAMVq0gBCAMVK18fEIghoR8IgQgDVStfCAEIAQgDyAOIBN+IgwgCiAQfnwiCkIgiCAKIAxUrUIghoR8IgogD1StIAogAkIghnwgClStfHwiBFatfCICQv////////8AWARAIAFCMYYgBEL/////D4MiASADQv////8PgyIKfiIMQgBSrX1CACAMfSIQIARCIIgiDCAKfiINIAEgA0IgiCILfnwiDkIghiIPVK19IAJC/////w+DIAp+IAEgEkL/////D4N+fCALIAx+fCANIA5WrUIghiAOQiCIhHwgBCAUQiCIfiADIAJCIIh+fCACIAt+fCAMIBJ+fEIghnx9IRIgBkEBayEGIBAgD30MAQsgBEIhiCELIAFCMIYgAkI/hiAEQgGIhCIEQv////8PgyIBIANC/////w+DIgp+IgxCAFKtfUIAIAx9Ig4gASADQiCIIgx+IhAgCyACQh+GhCINQv////8PgyIPIAp+fCILQiCGIhNUrX0gBCAUQiCIfiADIAJCIYh+fCACQgGIIgIgDH58IA0gEn58QiCGIAwgD34gAkL/////D4MgCn58IAEgEkL/////D4N+fCALIBBUrUIghiALQiCIhHx8fSESIA4gE30LIQEgBkGAgAFOBEAgEUKAgICAgIDA//8AhCERQgAhAQwBCyAGQf//AGohByAGQYGAf0wEQAJAIAcNACAEIAFCAYYgA1YgEkIBhiABQj+IhCIBIBRWIAEgFFEbrXwiASAEVK0gAkL///////8/g3wiAkKAgICAgIDAAINQDQAgAiARhCERDAILQgAhAQwBCyAEIAFCAYYgA1ogEkIBhiABQj+IhCIBIBRaIAEgFFEbrXwiASAEVK0gAkL///////8/g3wgB61CMIZ8IBGEIRELIABBACABEPoGIABBCCAREPoGIAVBwAFqJAAPCyAAQQBCABD6BiAAQQhCgICAgICA4P//ACARIAIgA4RQGxD6BiAFQcABaiQAC4AJAgZ/An4jAEEwayIGJAACQCACQQJNBEAgAUEEaiEFIAJBAnQiAkGcJ2pBABDnBiEIIAJBkCdqQQAQ5wYhCQNAAn8gAUEEEOcGIgIgAUHoABDnBkkE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ASABIARBsSdqQQAQ4wYiAksNAAsLIARBsSdqQQAQ4wYgAU8NAANAAn8gAEEEEOcGIgIgAEHoABDnBkkEQCAAQQQgAkEBahD1BiACQQAQ4wYMAQsgABCNAgtBsSdqQQAQ4wYgAUkNAAtB5IYBQQBBxAAQ9QYgBkEAIANCAYNQGyEGIAMhCQsgAEHoABDnBgRAIABBBCAAQQQQ5wZBAWsQ9QYLAkAgAyAJVg0AIAOnQQFxIAZyRQRAQeSGAUEAQcQAEPUGIANCAX0hAwwDCyADIAlaDQBB5IYBQQBBxAAQ9QYMAgsgCSAGrCIDhSADfSEDDAELQgAhAyAAQgAQjAILIAdBEGokACADC8QDAgN/AX4jAEEgayIDJAACQCABQv///////////wCDIgVCgICAgICAwMA/fSAFQoCAgICAgMC/wAB9VARAIAFCGYinIQQgAFAgAUL///8PgyIFQoCAgAhUIAVCgICACFEbRQRAIARBgYCAgARqIQIMAgsgBEGAgICABGohAiAAIAVCgICACIWEQgBSDQEgAiAEQQFxaiECDAELIABQIAVCgICAgICAwP//AFQgBUKAgICAgIDA//8AURtFBEAgAUIZiKdB////AXFBgICA/gdyIQIMAQtBgICA/AchAiAFQv///////7+/wABWDQBBACECIAVCMIinIgRBkf4ASQ0AIANBEGogACABQv///////z+DQoCAgICAgMAAhCIFIARBgf4AaxCgASADIAAgBUGB/wAgBGsQoQEgA0EIakEAEO4GIgBCGYinIQIgA0EAEO4GIANBEBDuBiADQRhqQQAQ7gaEQgBSrYQiBVAgAEL///8PgyIAQoCAgAhUIABCgICACFEbRQRAIAJBAWohAgwBCyAFIABCgICACIWEQgBSDQAgAkEBcSACaiECCyADQSBqJAAgAiABQiCIp0GAgICAeHFyvguLAwEGfyMAQRBrIgckACADQfCfASADGyIFQQAQ5wYhAwJAAkACQCABRQRAIAMNAQwDC0F+IQQgAkUNAiAAIAdBDGogABshBgJAIAMEQCACIQAMAQsgAUEAEOMGIgBBGHRBGHUiA0EATgRAIAZBACAAEPUGIANBAEchBAwEC0HwhAFBrAEQ5wZBABDnBiEDIAFBABDiBiEAIANFBEAgBkEAIABB/78DcRD1BkEBIQQMBAsgAEH/AXFBwgFrIgBBMksNASAAQQJ0QcApakEAEOcGIQMgAkEBayIARQ0CIAFBAWohAQsgAUEAEOMGIghBA3YiCUEQayADQRp1IAlqckEHSw0AA0AgAEEBayEAIAhB/wFxQYABayADQQZ0ciIDQQBOBEAgBUEAQQAQ9QYgBkEAIAMQ9QYgAiAAayEEDAQLIABFDQIgAUEBaiIBQQAQ4wYiCEHAAXFBgAFGDQALCyAFQQBBABD1BkHkhgFBAEEZEPUGQX8hBAwBCyAFQQAgAxD1BgsgB0EQaiQAIAQL9xQCDX8DfiMAQbACayIFJAAgAEHMABDnBhoCQCABQQAQ4wYiBEUNAAJAAkADQAJAAkAgBEH/AXEQiwIEQANAIAEiBEEBaiEBIARBARDjBhCLAg0ACyAAQgAQjAIDQAJ/IABBBBDnBiIBIABB6AAQ5wZJBEAgAEEEIAFBAWoQ9QYgAUEAEOMGDAELIAAQjQILEIsCDQALIABBBBDnBiEBIABB6AAQ5wYEQCAAQQQgAUEBayIBEPUGCyAAQfgAEO4GIBB8IAEgAEEIEOcGa6x8IRAMAQsCQAJAAkAgAUEAEOMGIgRBJUYEQCABQQEQ4wYiA0EqRg0BIANBJUcNAgsgAEIAEIwCIAEgBEElRmohBAJ/IABBBBDnBiIBIABB6AAQ5wZJBEAgAEEEIAFBAWoQ9QYgAUEAEOMGDAELIAAQjQILIQEgBEEAEOMGIAFHBEAgAEHoABDnBgRAIABBBCAAQQQQ5wZBAWsQ9QYLQQAhDCABQQBODQkMBwsgEEIBfCEQDAMLIAFBAmohBEEAIQcMAQsCQCADEJsBRQ0AIAFBAhDjBkEkRw0AIAFBA2ohBCACIAFBARDjBkEwaxCjAiEHDAELIAFBAWohBCACQQAQ5wYhByACQQRqIQILQQAhDEEAIQEgBEEAEOMGEJsBBEADQCAEQQAQ4wYgAUEKbGpBMGshASAEQQEQ4wYhAyAEQQFqIQQgAxCbAQ0ACwsCQCAEQQAQ4wYiCEHtAEcEQCAEIQMMAQsgBEEBaiEDQQAhCSAHQQBHIQwgBEEBEOMGIQhBACEKCyADQQFqIQRBAyEGAkACQAJAAkACQAJAIAhB/wFxQcEAaw46BAkECQQEBAkJCQkDCQkJCQkJBAkJCQkECQkECQkJCQkECQQEBAQEAAQFCQEJBAQECQkEAgQJCQQJAgkLIANBAmogBCADQQEQ4wZB6ABGIgMbIQRBfkF/IAMbIQYMBAsgA0ECaiAEIANBARDjBkHsAEYiAxshBEEDQQEgAxshBgwDC0EBIQYMAgtBAiEGDAELQQAhBiADIQQLQQEgBiAEQQAQ4wYiA0EvcUEDRiIIGyEOAkAgA0EgciADIAgbIgtB2wBGDQACQCALQe4ARwRAIAtB4wBHDQEgAUEBIAFBAUobIQEMAgsgByAOIBAQpAIMAgsgAEIAEIwCA0ACfyAAQQQQ5wYiAyAAQegAEOcGSQRAIABBBCADQQFqEPUGIANBABDjBgwBCyAAEI0CCxCLAg0ACyAAQQQQ5wYhAyAAQegAEOcGBEAgAEEEIANBAWsiAxD1BgsgAEH4ABDuBiAQfCADIABBCBDnBmusfCEQCyAAIAGsIhEQjAICQCAAQQQQ5wYiCCAAQegAEOcGIgNJBEAgAEEEIAhBAWoQ9QYMAQsgABCNAkEASA0EIABB6AAQ5wYhAwsgAwRAIABBBCAAQQQQ5wZBAWsQ9QYLQRAhAwJAAkACQAJAAkACQAJAAkACQAJAAkACQCALQdgAaw4hBgsLAgsLCwsLAQsCBAEBAQsFCwsLCwsDBgsLAgsECwsGAAsgC0HBAGsiAUEGS0EBIAF0QfEAcUVyDQoLIAUgACAOQQAQmwIgAEH4ABDuBkIAIABBBBDnBiAAQQgQ5wZrrH1RDQ4gB0UNCSAFQQgQ7gYhESAFQQAQ7gYhEiAODgMFBgcJCyALQe8BcUHjAEYEQCAFQSBqQX9BgQIQ0wYaIAVBIEEAEPAGIAtB8wBHDQggBUHBAEEAEPAGIAVBLkEAEPAGIAUQ9AYMCAsgBUEgaiAEQQEQ4wYiA0HeAEYiCEGBAhDTBhogBUEgQQAQ8AYgBEECaiAEQQFqIAgbIQ0CfwJAAkAgBEECQQEgCBtqQQAQ4wYiBEEtRwRAIARB3QBGDQEgA0HeAEchBiANDAMLIAVBzgAgA0HeAEciBhDwBgwBCyAFQf4AIANB3gBHIgYQ8AYLIA1BAWoLIQQDQAJAIARBABDjBiIDQS1HBEAgA0UNDyADQd0ARw0BDAoLQS0hAyAEQQEQ4wYiCEUgCEHdAEZyDQAgBEEBaiENAkAgCCAEQQFrQQAQ4wYiBE0EQCAIIQMMAQsDQCAEQQFqIgQgBUEgampBACAGEPAGIAQgDUEAEOMGIgNJDQALCyANIQQLIAMgBWpBIWpBACAGEPAGIARBAWohBAwACwALQQghAwwCC0EKIQMMAQtBACEDCyAAIANBAEJ/EJ8CIREgAEH4ABDuBkIAIABBBBDnBiAAQQgQ5wZrrH1RDQkgB0UgC0HwAEdyRQRAIAdBACAREPgGDAULIAcgDiAREKQCDAQLIAcgEiAREKACEPsGDAMLIAdBACASIBEQogEQ/AYMAgsgB0EAIBIQ+gYgB0EIIBEQ+gYMAQsgAUEBakEfIAtB4wBGIggbIQYCQCAOQQFHIg1FBEAgByEDIAwEQCAGQQJ0EMgGIgNFDQULIAVBqAJCABD6BkEAIQEDQCADIQoCQANAAn8gAEEEEOcGIgMgAEHoABDnBkkEQCAAQQQgA0EBahD1BiADQQAQ4wYMAQsgABCNAgsiAyAFakEhakEAEOMGRQ0BIAVBGyADEPAGIAVBHGogBUEbakEBIAVBqAJqEKECIgNBfkYNAEEAIQkgA0F/Rg0JIAoEQCAKIAFBAnRqQQAgBUEcEOcGEPUGIAFBAWohAQsgDEUgASAGR3INAAsgCiAGQQF0QQFyIgZBAnQQygYiA0UNCAwBCwtBACEJAn9BASAFQagCaiIDRQ0AGiADQQAQ5wZFC0UNBgwBCyAMBEBBACEBIAYQyAYiA0UNBANAIAMhCQNAAn8gAEEEEOcGIgMgAEHoABDnBkkEQCAAQQQgA0EBahD1BiADQQAQ4wYMAQsgABCNAgsiAyAFakEhakEAEOMGRQRAQQAhCgwECyABIAlqQQAgAxDwBiABQQFqIgEgBkcNAAtBACEKIAkgBkEBdEEBciIGEMoGIgMNAAsMBgtBACEBIAcEQANAAn8gAEEEEOcGIgMgAEHoABDnBkkEQCAAQQQgA0EBahD1BiADQQAQ4wYMAQsgABCNAgsiAyAFakEhakEAEOMGRQRAQQAhCiAHIQkMAwsgASAHakEAIAMQ8AYgAUEBaiEBDAALAAsDQAJ/IABBBBDnBiIBIABB6AAQ5wZJBEAgAEEEIAFBAWoQ9QYgAUEAEOMGDAELIAAQjQILIAVqQSFqQQAQ4wYNAAtBACEJQQAhCkEAIQELIABBBBDnBiEDIABB6AAQ5wYEQCAAQQQgA0EBayIDEPUGCyAAQfgAEO4GIAMgAEEIEOcGa6x8IhJQIAggESASUnFyDQUCQCAMRQ0AIA1FBEAgB0EAIAoQ9QYMAQsgB0EAIAkQ9QYLIAgNACAKBEAgCiABQQJ0akEAQQAQ9QYLIAlFBEBBACEJDAELIAEgCWpBAEEAEPAGCyAAQfgAEO4GIBB8IABBBBDnBiAAQQgQ5wZrrHwhECAPIAdBAEdqIQ8LIARBAWohASAEQQEQ4wYiBA0BDAQLC0EAIQlBACEKCyAPQX8gDxshDwsgDEUNACAJEMkGIAoQyQYLIAVBsAJqJAAgDws4AQF/IwBBEGsiAkEMIAAQ9QYgAkEIIAFBAnQgAGpBBGsgACABQQFLGyIAQQRqEPUGIABBABDnBgtJAAJAIABFDQACQAJAAkACQCABQQJqDgYAAQICBAMECyAAQQAgAhD2Bg8LIAAgAhD3Bg8LIABBACACEPgGDwsgAEEAIAIQ+gYLC10BAn8gASAAQdQAEOcGIgEgASACQYACaiIDEJwBIgQgAWsgAyAEGyIDIAIgAiADSxsiAhDSBhogAEHUACABIANqIgMQ9QYgAEEIIAMQ9QYgAEEEIAEgAmoQ9QYgAgtUAQF/IwBBkAFrIgMkACADQQBBkAEQ0wYiA0HMAEF/EPUGIANBLCAAEPUGIANBIEHYABD1BiADQdQAIAAQ9QYgAyABIAIQogIhACADQZABaiQAIAALCwAgACABIAIQpQILYAECfyABQQAQ4wYhAgJAIABBABDjBiIDRSADIAJB/wFxR3INAANAIAFBARDjBiECIABBARDjBiIDRQ0BIAFBAWohASAAQQFqIQAgAyACQf8BcUYNAAsLIAMgAkH/AXFrC5gBAQJ/IwBBEGsiACQAAkAgAEEMaiAAQQhqEA0NAEEAQfSfASAAQQwQ5wZBAnRBBGoQyAYiARD1BiABRQ0AIABBCBDnBhDIBiIBRQRAQQBB9J8BQQAQ9QYMAQtBAEH0nwEQ5wYgAEEMEOcGQQJ0akEAQQAQ9QZBAEH0nwEQ5wYgARAORQ0AQQBB9J8BQQAQ9QYLIABBEGokAAvAAQECfwJAIABBA3EEQANAIABBABDjBiIBRSABQT1Gcg0CIABBAWoiAEEDcQ0ACwsCQCAAQQAQ5wYiAUF/cyABQYGChAhrcUGAgYKEeHENAANAIAFBvfr06QNzIgFBf3MgAUGBgoQIa3FBgIGChHhxDQEgAEEEEOcGIQEgAEEEaiEAIAFBgYKECGsgAUF/c3FBgIGChHhxRQ0ACwsDQCAAIgFBABDjBiICBEAgAUEBaiEAIAJBPUcNAQsLIAEPCyAAC3EBA38gAkUEQEEADwsCQCAAQQAQ4wYiA0UNAANAAkAgAUEAEOMGIgUgA0H/AXFHDQAgAkEBayICRSAFRXINACABQQFqIQEgAEEBEOMGIQMgAEEBaiEAIAMNAQwCCwsgAyEECyAEQf8BcSABQQAQ4wZrC60BAQR/IAAQ2QYhBAJAQQBB9J8BEOcGRQ0AIABBABDjBkUNACAAEKoCIgFBACABQQAQ4wZBPUYbDQBBAEH0nwEQ5wZBABDnBiIBRQ0AAkADQCAAIAEgBBCrAiEDQQBB9J8BEOcGIQEgA0UEQCABIAJBAnRqQQAQ5wYgBGoiA0EAEOMGQT1GDQILIAEgAkEBaiICQQJ0akEAEOcGIgENAAtBAA8LIANBAWohAgsgAgu7AwEDfwJAIAFBABDjBg0AQfArEKwCIgEEQCABQQAQ4wYNAQsgAEEMbEGALGoQrAIiAQRAIAFBABDjBg0BC0HILBCsAiIBBEAgAUEAEOMGDQELQc0sIQELAkADQCABIAJqQQAQ4wYiBEUgBEEvRnJFBEBBDyEEIAJBAWoiAkEPRw0BDAILCyACIQQLQc0sIQMCQAJAAkACQAJAIAFBABDjBiICQS5GDQAgASAEakEAEOMGDQAgASEDIAJBwwBHDQELIANBARDjBkUNAQsgA0HNLBCoAkUNACADQdUsEKgCDQELIABFBEBBpCshAiADQQEQ4wZBLkYNAgtBAA8LQQBBgKABEOcGIgIEQANAIAMgAkEIahCoAkUNAiACQRgQ5wYiAg0ACwtBAEGAoAEQ5wYiAgRAA0AgAyACQQhqEKgCRQRAIAIPCyACQRgQ5wYiAg0ACwsCQEEcEMgGIgJFBEBBACECDAELIAJBAEEAQaQrEO0GEPkGIAJBCGoiASADIAQQ0gYaIAEgBGpBAEEAEPAGIAJBGEEAQYCgARDnBhD1BkEAQYCgASACEPUGCyACQaQrIAAgAnIbIQILIAILFQAgAEEARyAAQcArR3EgAEHYK0dxC9wBAQR/IwBBIGsiASQAAkACQEEAEK4CBEADQEH/////ByAAdkEBcQRAIABBAnRBACAAQaXNABCtAhD1BgsgAEEBaiIAQQZHDQALDAELA0AgAUEIaiAAQQJ0akEAAn9BASAAdEH/////B3EiAkEBckUEQCAAQQJ0QQAQ5wYMAQsgAEGlzQBB2ywgAhsQrQILIgIQ9QYgAyACQQBHaiEDIABBAWoiAEEGRw0AC0HAKyEAAkAgAw4CAgABCyABQQgQ5wZBpCtHDQBB2CshAAwBC0EAIQALIAFBIGokACAAC2sBAn8jAEEQayIDJAAgA0EMIAIQ9QYgA0EIIAIQ9QZBfyEEAkBBAEEAIAEgAhCvASICQQBIDQAgAEEAIAJBAWoiAhDIBiIAEPUGIABFDQAgACACIAEgA0EMEOcGEK8BIQQLIANBEGokACAECxcAIAAQmwFBAEcgAEEgckHhAGtBBklyCywBAX8jAEEQayICJAAgAkEMIAEQ9QYgAEGQzQAgARCmAiEAIAJBEGokACAACw8AIAAQrgIEQCAAEMkGCwslAQJ/IAAhAQNAIAEiAkEEaiEBIAJBABDnBg0ACyACIABrQQJ1C98DAQV/IwBBEGsiByQAAkACQAJAAkAgAARAIAJBBE8NASACIQMMAgtBACECIAFBABDnBiIAQQAQ5wYiA0UNAwNAQQEhBSADQYABTwRAQX8hBiAHQQxqIAMQnQEiBUF/Rg0FCyAAQQQQ5wYhAyAAQQRqIQAgAiAFaiICIQYgAw0ACwwDCyABQQAQ5wYhBSACIQMDQAJAIAVBABDnBiIEQQFrQf8ATwRAIARFBEAgAEEAQQAQ8AYgAUEAQQAQ9QYMBQtBfyEGIAAgBBCdASIEQX9GDQUgAyAEayEDIAAgBGohAAwBCyAAQQAgBBDwBiADQQFrIQMgAEEBaiEAIAFBABDnBiEFCyABQQAgBUEEaiIFEPUGIANBA0sNAAsLIAMEQCABQQAQ5wYhBQNAAkAgBUEAEOcGIgRBAWtB/wBPBEAgBEUEQCAAQQBBABDwBiABQQBBABD1BgwFC0F/IQYgB0EMaiAEEJ0BIgRBf0YNBSADIARJDQQgACAFQQAQ5wYQnQEaIAMgBGshAyAAIARqIQAMAQsgAEEAIAQQ8AYgA0EBayEDIABBAWohACABQQAQ5wYhBQsgAUEAIAVBBGoiBRD1BiADDQALCyACIQYMAQsgAiADayEGCyAHQRBqJAAgBgvzAgEGfyMAQZACayIFJAAgBUEMIAFBABDnBiIIEPUGIAAgBUEQaiAAGyEGAkACQAJAIANBgAIgABsiA0UgCEVyDQAgAiADTyIEIAJBIEtyRQ0BA0AgAiADIAIgBBsiBGshAiAGIAVBDGogBBC1AiIEQX9GBEBBACEDIAVBDBDnBiEIQX8hBwwCCyAGIAQgBmogBiAFQRBqRiIJGyEGIAQgB2ohByAFQQwQ5wYhCCADQQAgBCAJG2siA0UgCEVyDQEgAiADTyIEIAJBIU9yDQALDAELIAhFDQELIANFIAJFcg0AIAchBANAAkACQCAGIAhBABDnBhCdASIJQQFqQQFNBEBBfyEHIAkNBCAFQQxBABD1BgwBCyAFQQwgBUEMEOcGQQRqIggQ9QYgBCAJaiEEIAMgCWsiAw0BCyAEIQcMAgsgBiAJaiEGIAQhByACQQFrIgINAAsLIAAEQCABQQAgBUEMEOcGEPUGCyAFQZACaiQAIAcL7ggBBX8gAUEAEOcGIQQCQAJAAkACQAJAAkACQAJ/AkACQAJAAkAgA0UNACADQQAQ5wYiBkUNACAARQRAIAIhAwwDCyADQQBBABD1BiACIQMMAQsCQEHwhAFBrAEQ5wZBABDnBkUEQCAARQ0BIAJFDQwgAiEGA0AgBEEAEOIGIgMEQCAAQQAgA0H/vwNxEPUGIABBBGohACAEQQFqIQQgBkEBayIGDQEMDgsLIABBAEEAEPUGIAFBAEEAEPUGIAIgBmsPCyACIQMgAEUNAwwFCyAEENkGDwtBASEFDAMLQQAMAQtBAQshBQNAIAVFBEAgBEEAEOMGQQN2IgVBEGsgBkEadSAFanJBB0sNAwJ/IARBAWoiBSAGQYCAgBBxRQ0AGiAFQQAQ4wZBwAFxQYABRw0EIARBAmoiBSAGQYCAIHFFDQAaIAVBABDjBkHAAXFBgAFHDQQgBEEDagshBCADQQFrIQNBASEFDAELA0ACQCAEQQNxIARBABDjBiIGQQFrQf4AS3INACAEQQAQ5wYiBkGBgoQIayAGckGAgYKEeHENAANAIANBBGshAyAEQQQQ5wYhBiAEQQRqIgUhBCAGIAZBgYKECGtyQYCBgoR4cUUNAAsgBSEECyAGQf8BcSIFQQFrQf4ATQRAIANBAWshAyAEQQFqIQQMAQsLIAVBwgFrIgVBMksNAyAEQQFqIQQgBUECdEHAKWpBABDnBiEGQQAhBQwACwALA0AgBUUEQCADRQ0HA0ACQAJAAkAgBEEAEOMGIgVBAWsiB0H+AEsEQCAFIQYMAQsgBEEDcSADQQVJcg0BAkADQCAEQQAQ5wYiBkGBgoQIayAGckGAgYKEeHENASAAQQAgBkH/AXEQ9QYgAEEEIARBARDjBhD1BiAAQQggBEECEOMGEPUGIABBDCAEQQMQ4wYQ9QYgAEEQaiEAIARBBGohBCADQQRrIgNBBEsNAAsgBEEAEOMGIQYLIAZB/wFxIgVBAWshBwsgB0H+AEsNAQsgAEEAIAUQ9QYgAEEEaiEAIARBAWohBCADQQFrIgMNAQwJCwsgBUHCAWsiBUEySw0DIARBAWohBCAFQQJ0QcApakEAEOcGIQZBASEFDAELIARBABDjBiIFQQN2IgdBEGsgByAGQRp1anJBB0sNAQJAAkACfyAEQQFqIgcgBUGAAWsgBkEGdHIiBUF/Sg0AGiAHQQAQ4wZBgAFrIgdBP0sNASAEQQJqIgggByAFQQZ0ciIFQX9KDQAaIAhBABDjBkGAAWsiB0E/Sw0BIAcgBUEGdHIhBSAEQQNqCyEEIABBACAFEPUGIANBAWshAyAAQQRqIQAMAQtB5IYBQQBBGRD1BiAEQQFrIQQMBQtBACEFDAALAAsgBEEBayEEIAYNASAEQQAQ4wYhBgsgBkH/AXENACAABEAgAEEAQQAQ9QYgAUEAQQAQ9QYLIAIgA2sPC0HkhgFBAEEZEPUGIABFDQELIAFBACAEEPUGC0F/DwsgAUEAIAQQ9QYgAgujAwEGfyMAQZAIayIHJAAgB0EMIAFBABDnBiIJEPUGIAAgB0EQaiAAGyEIAkACQAJAIANBgAIgABsiA0UgCUVyDQAgAkECdiIFIANPIQogAkGDAU1BACADIAVLGw0BA0AgAiADIAUgChsiBWshAiAIIAdBDGogBSAEELcCIgpBf0YEQEEAIQMgB0EMEOcGIQlBfyEGDAILIAggCCAKQQJ0aiAIIAdBEGpGIgUbIQggBiAKaiEGIAdBDBDnBiEJIANBACAKIAUbayIDRSAJRXINASACQQJ2IgUgA08hCiADIAVNIAJBgwFLcg0ACwwBCyAJRQ0BCyADRSACRXINACAGIQUDQAJAAkAgCCAJIAIgBBChAiIGQQJqQQJNBEACQAJAIAZBAWoOAgYAAQsgB0EMQQAQ9QYMAgsgBEEAQQAQ9QYMAQsgB0EMIAdBDBDnBiAGaiIJEPUGIAVBAWohBSADQQFrIgMNAQsgBSEGDAILIAhBBGohCCACIAZrIQIgBSEGIAINAAsLIAAEQCABQQAgB0EMEOcGEPUGCyAHQZAIaiQAIAYLNwEBf0HwhAFBrAEQ5wYhASAABEBB8IQBQawBQdifASAAIABBf0YbEPUGC0F/IAEgAUHYnwFGGwsGABCDAgALkAEBAX8jAEGQAWsiBCQAIARBLCAAEPUGIARBBCAAEPUGIARBAEEAEPUGIARBzABBfxD1BiAEQQhBfyAAQf////8HaiAAQQBIGxD1BiAEQgAQjAIgBCACQQEgAxCfAiEDIAEEQCABQQAgACAEQQQQ5wYgBEH4ABDnBmogBEEIEOcGa2oQ9QYLIARBkAFqJAAgAwsNACAAIAEgAkJ/ELsCCxYAIAAgASACQoCAgICAgICAgH8QuwILNgIBfwF9IwBBEGsiAiQAIAIgACABQQAQvwIgAkEAEO4GIAJBCBDuBhCgAiEDIAJBEGokACADC7gBAgF/A34jAEGgAWsiBCQAIARBEGpBAEGQARDTBhogBEHcAEF/EPUGIARBPCABEPUGIARBGEF/EPUGIARBFCABEPUGIARBEGpCABCMAiAEIARBEGogA0EBEJsCIARBCBDuBiEFIARBABDuBiEGIAIEQCACQQAgASABIARBiAEQ7gYgBEEUEOcGIARBGBDnBmusfCIHp2ogB1AbEPUGCyAAQQAgBhD6BiAAQQggBRD6BiAEQaABaiQACzYCAX8BfCMAQRBrIgIkACACIAAgAUEBEL8CIAJBABDuBiACQQgQ7gYQogEhAyACQRBqJAAgAws7AQF/IwBBEGsiAyQAIAMgASACQQIQvwIgAEEAIANBABDuBhD6BiAAQQggA0EIEO4GEPoGIANBEGokAAs3ACMAQRBrIgMkACADIAEgAhDBAiAAQQAgA0EAEO4GEPoGIABBCCADQQgQ7gYQ+gYgA0EQaiQACwcAIAAQyQYLWAECfwJAA0AgAyAERwRAQX8hACABIAJGDQIgAUEAEOIGIgUgA0EAEOIGIgZIDQIgBSAGSgRAQQEPBSADQQFqIQMgAUEBaiEBDAILAAsLIAEgAkchAAsgAAsLACAAIAIgAxDGAgsoAQF/IwBBEGsiAyQAIAAgA0EIaiADEDQgACABIAIQxwIgA0EQaiQAC5kBAQR/IwBBEGsiBSQAIAEgAhCCBiIEQW9NBEACQCAEQQpNBEAgACAEEKUEIAAQOiEDDAELIAAgBBDyBUEBaiIGEI8GIgMQ8wUgACAGEPQFIAAgBBCkBAsDQCABIAJHBEAgAyABEKMEIANBAWohAyABQQFqIQEMAQsLIAVBD0EAEPAGIAMgBUEPahCjBCAFQRBqJAAPCxC6AgALQwEBf0EAIQADQCABIAJGBEAgAA8LIAFBABDiBiAAQQR0aiIAQYCAgIB/cSIDQRh2IANyIABzIQAgAUEBaiEBDAALAAtYAQJ/AkADQCADIARHBEBBfyEAIAEgAkYNAiABQQAQ5wYiBSADQQAQ5wYiBkgNAiAFIAZKBEBBAQ8FIANBBGohAyABQQRqIQEMAgsACwsgASACRyEACyAACwsAIAAgAiADEMsCCykBAX8jAEEQayIDJAAgACADQQhqIAMQzAIgACABIAIQzQIgA0EQaiQACwwAIAEQHBogAhAcGgubAQEEfyMAQRBrIgUkACABIAIQ4gUiBEHv////A00EQAJAIARBAU0EQCAAIAQQuAQgACEDDAELIAAgBBCDBkEBaiIGEIYGIgMQhAYgACAGEIUGIAAgBBC3BAsDQCABIAJHBEAgAyABEIoCIANBBGohAyABQQRqIQEMAQsLIAVBDEEAEPUGIAMgBUEMahCKAiAFQRBqJAAPCxC6AgALQwEBf0EAIQADQCABIAJGBEAgAA8LIAFBABDnBiAAQQR0aiIAQYCAgIB/cSIDQRh2IANyIABzIQAgAUEEaiEBDAALAAuNAgEBfyMAQSBrIgYkACAGQRggARD1BgJAIAMQJ0EBcUUEQCAGQQBBfxD1BiAGQRggACABIAIgAyAEIAYgAEEAEOcGQRAQ5wYRCAAiARD1BgJAAkACQCAGQQAQ5wYOAgABAgsgBUEAQQAQ8AYMAwsgBUEAQQEQ8AYMAgsgBUEAQQEQ8AYgBEEAQQQQ9QYMAQsgBiADENsBIAYQPSEBIAYQ0AIgBiADENsBIAYQ0QIhACAGENACIAYgABDSAiAGQQxyIAAQ0wIgBUEAIAZBGGogAiAGIAZBGGoiAyABIARBARDUAiAGRhDwBiAGQRgQ5wYhAQNAIANBDGsQmgYiAyAGRw0ACwsgBkEgaiQAIAELDAAgAEEAEOcGEOoECwsAIABB/KEBENUCCxUAIAAgASABQQAQ5wZBGBDnBhEBAAsVACAAIAEgAUEAEOcGQRwQ5wYRAQAL4gQBC38jAEGAAWsiCCQAIAhB+AAgARD1BiACIAMQ1gIhCSAIQRBB2QAQ9QYgCEEIakEAIAhBEGoQ1wIhDyAIQRBqIQoCQCAJQeUATwRAIAkQyAYiCkUNASAPIAoQ2AILIAohByACIQEDQCABIANGBEADQAJAIAlBACAAIAhB+ABqENwBG0UEQCAAIAhB+ABqEOABBEAgBUEAIAVBABDnBkECchD1BgsMAQsgABDdASENIAZFBEAgBCANENkCIQ0LIAxBAWohEEEAIQ4gCiEHIAIhAQNAIAEgA0YEQCAQIQwgDkUNAyAAEN8BGiAKIQcgAiEBIAkgC2pBAkkNAwNAIAEgA0YNBAJAIAdBABDjBkECRw0AIAEQswEgDEYNACAHQQBBABDwBiALQQFrIQsLIAdBAWohByABQQxqIQEMAAsACwJAIAdBABDjBkEBRw0AIAEgDBDaAkEAEOMGIRECQCANQf8BcSAGBH8gEQUgBCARQRh0QRh1ENkCC0H/AXFGBEBBASEOIAEQswEgEEcNAiAHQQBBAhDwBiALQQFqIQsMAQsgB0EAQQAQ8AYLIAlBAWshCQsgB0EBaiEHIAFBDGohAQwACwALCwJAAkADQCACIANGDQEgCkEAEOMGQQJHBEAgCkEBaiEKIAJBDGohAgwBCwsgAiEDDAELIAVBACAFQQAQ5wZBBHIQ9QYLIA8Q2wIgCEGAAWokACADDwsCQCABELIBRQRAIAdBAEEBEPAGDAELIAdBAEECEPAGIAtBAWohCyAJQQFrIQkLIAdBAWohByABQQxqIQEMAAsACxCDAgALEQAgAEEAEOcGIAEQ4QQQ5wQLCgAgASAAa0EMbQszAQF/IwBBEGsiAyQAIANBDCABEPUGIAAgA0EMahCKAiAAQQRqIAIQigIgA0EQaiQAIAALKgEBfyAAQQAQ5wYhAiAAQQAgARD1BiACBEAgAiAAEL4DQQAQ5wYRAgALCxUAIAAgASAAQQAQ5wZBDBDnBhEDAAsKACAAELcBIAFqCwkAIABBABDYAgsPACABIAIgAyAEIAUQ3QILygMBAn8jAEGQAmsiBSQAIAVBgAIgARD1BiAFQYgCIAAQ9QYgAhDeAiEGIAVB0AFqIAIgBUH/AWoQ3wIgBUHAAWoQ4AIiACAAEOECEOICIAVBvAEgAEEAEOMCIgEQ9QYgBUEMIAVBEGoQ9QYgBUEIQQAQ9QYDQAJAIAVBiAJqIAVBgAJqENwBRQ0AIAVBvAEQ5wYgABCzASABakYEQCAAELMBIQIgACAAELMBQQF0EOICIAAgABDhAhDiAiAFQbwBIAIgAEEAEOMCIgFqEPUGCyAFQYgCahDdASAGIAEgBUG8AWogBUEIaiAFQf8BEOIGIAVB0AFqIAVBEGogBUEMakGQywAQ5AINACAFQYgCahDfARoMAQsLAkAgBUHQAWoQswFFDQAgBUEMEOcGIgIgBUEQamtBnwFKDQAgBUEMIAJBBGoQ9QYgAkEAIAVBCBDnBhD1BgsgBEEAIAEgBUG8ARDnBiADIAYQ5QIQ9QYgBUHQAWogBUEQaiAFQQwQ5wYgAxDmAiAFQYgCaiAFQYACahDgAQRAIANBACADQQAQ5wZBAnIQ9QYLIAVBiAIQ5wYhASAAEJoGGiAFQdABahCaBhogBUGQAmokACABCy0AAkAgABAnQcoAcSIABEAgAEHAAEYEQEEIDwsgAEEIRw0BQRAPC0EADwtBCgtBAQF/IwBBEGsiAyQAIANBCGogARDbASACQQAgA0EIahDRAiIBEKYDEPAGIAAgARCnAyADQQhqENACIANBEGokAAsmAQF/IwBBEGsiASQAIAAgAUEIaiABEDQgABC0ASABQRBqJAAgAAsaAQF/QQohASAAEDgEfyAAEIIDQQFrBUEKCwsJACAAIAEQnQYLCQAgABA1IAFqC50DAQN/IwBBEGsiCiQAIApBDyAAEPAGAkACQAJAIANBABDnBiACRw0AQSshCyAJQRgQ4wYgAEH/AXEiDEcEQEEtIQsgCUEZEOMGIAxHDQELIANBACACQQFqEPUGIAJBACALEPAGDAELIAYQswFFIAAgBUdyRQRAQQAhACAIQQAQ5wYiASAHa0GfAUoNAiAEQQAQ5wYhACAIQQAgAUEEahD1BiABQQAgABD1BgwBC0F/IQAgCSAJQRpqIApBD2oQgwMgCWsiBUEXSg0BAkACQAJAIAFBCGsOAwACAAELIAEgBUoNAQwDCyABQRBHIAVBFkhyDQAgA0EAEOcGIgEgAkYgASACa0ECSnINAiABQQFrQQAQ4wZBMEcNAkEAIQAgBEEAQQAQ9QYgA0EAIAFBAWoQ9QYgAUEAIAVBkMsAakEAEOMGEPAGDAILIANBACADQQAQ5wYiAEEBahD1BiAAQQAgBUGQywBqQQAQ4wYQ8AYgBEEAIARBABDnBkEBahD1BkEAIQAMAQtBACEAIARBAEEAEPUGCyAKQRBqJAAgAAvUAQICfwF+IwBBEGsiBCQAAn8CQAJAIAAgAUcEQEHkhgFBABDnBiEFQeSGAUEAQQAQ9QYgACAEQQxqIAMQgAMQvQIhBgJAQeSGAUEAEOcGIgAEQCAEQQwQ5wYgAUcNASAAQcQARg0EDAMLQeSGAUEAIAUQ9QYgBEEMEOcGIAFGDQILCyACQQBBBBD1BkEADAILIAZCgICAgHhTIAZC/////wdVcg0AIAanDAELIAJBAEEEEPUGQf////8HIAZCAVkNABpBgICAgHgLIQAgBEEQaiQAIAALvQEBAn8CQCAAELMBRSACIAFrQQVIcg0AIAEgAhDJAyACQQRrIQQgABC3ASICIAAQswFqIQUDQAJAIAJBABDiBiEAIAEgBE8NAAJAIABBAUggAEH/AE5yDQAgAUEAEOcGIAJBABDiBkYNACADQQBBBBD1Bg8LIAJBAWogAiAFIAJrQQFKGyECIAFBBGohAQwBCwsgAEEBSCAAQf8ATnINACAEQQAQ5wZBAWsgAkEAEOIGSQ0AIANBAEEEEPUGCwsPACABIAIgAyAEIAUQ6AILygMBAn8jAEGQAmsiBSQAIAVBgAIgARD1BiAFQYgCIAAQ9QYgAhDeAiEGIAVB0AFqIAIgBUH/AWoQ3wIgBUHAAWoQ4AIiACAAEOECEOICIAVBvAEgAEEAEOMCIgEQ9QYgBUEMIAVBEGoQ9QYgBUEIQQAQ9QYDQAJAIAVBiAJqIAVBgAJqENwBRQ0AIAVBvAEQ5wYgABCzASABakYEQCAAELMBIQIgACAAELMBQQF0EOICIAAgABDhAhDiAiAFQbwBIAIgAEEAEOMCIgFqEPUGCyAFQYgCahDdASAGIAEgBUG8AWogBUEIaiAFQf8BEOIGIAVB0AFqIAVBEGogBUEMakGQywAQ5AINACAFQYgCahDfARoMAQsLAkAgBUHQAWoQswFFDQAgBUEMEOcGIgIgBUEQamtBnwFKDQAgBUEMIAJBBGoQ9QYgAkEAIAVBCBDnBhD1BgsgBEEAIAEgBUG8ARDnBiADIAYQ6QIQ+gYgBUHQAWogBUEQaiAFQQwQ5wYgAxDmAiAFQYgCaiAFQYACahDgAQRAIANBACADQQAQ5wZBAnIQ9QYLIAVBiAIQ5wYhASAAEJoGGiAFQdABahCaBhogBUGQAmokACABC8cBAgJ/AX4jAEEQayIEJAACQAJAIAAgAUcEQEHkhgFBABDnBiEFQeSGAUEAQQAQ9QYgACAEQQxqIAMQgAMQvQIhBgJAQeSGAUEAEOcGIgAEQCAEQQwQ5wYgAUcNASAAQcQARg0DDAQLQeSGAUEAIAUQ9QYgBEEMEOcGIAFGDQMLCyACQQBBBBD1BkIAIQYMAQsgAkEAQQQQ9QYgBkIBWQRAQv///////////wAhBgwBC0KAgICAgICAgIB/IQYLIARBEGokACAGCw8AIAEgAiADIAQgBRDrAgvKAwECfyMAQZACayIFJAAgBUGAAiABEPUGIAVBiAIgABD1BiACEN4CIQYgBUHQAWogAiAFQf8BahDfAiAFQcABahDgAiIAIAAQ4QIQ4gIgBUG8ASAAQQAQ4wIiARD1BiAFQQwgBUEQahD1BiAFQQhBABD1BgNAAkAgBUGIAmogBUGAAmoQ3AFFDQAgBUG8ARDnBiAAELMBIAFqRgRAIAAQswEhAiAAIAAQswFBAXQQ4gIgACAAEOECEOICIAVBvAEgAiAAQQAQ4wIiAWoQ9QYLIAVBiAJqEN0BIAYgASAFQbwBaiAFQQhqIAVB/wEQ4gYgBUHQAWogBUEQaiAFQQxqQZDLABDkAg0AIAVBiAJqEN8BGgwBCwsCQCAFQdABahCzAUUNACAFQQwQ5wYiAiAFQRBqa0GfAUoNACAFQQwgAkEEahD1BiACQQAgBUEIEOcGEPUGCyAEQQAgASAFQbwBEOcGIAMgBhDsAhDyBiAFQdABaiAFQRBqIAVBDBDnBiADEOYCIAVBiAJqIAVBgAJqEOABBEAgA0EAIANBABDnBkECchD1BgsgBUGIAhDnBiEBIAAQmgYaIAVB0AFqEJoGGiAFQZACaiQAIAEL7wECA38BfiMAQRBrIgQkAAJ/AkACQAJAIAAgAUcEQAJAAkAgAEEAEOMGIgVBLUcNACAAQQFqIgAgAUcNAAwBC0HkhgFBABDnBiEGQeSGAUEAQQAQ9QYgACAEQQxqIAMQgAMQvAIhBwJAQeSGAUEAEOcGIgAEQCAEQQwQ5wYgAUcNASAAQcQARg0FDAQLQeSGAUEAIAYQ9QYgBEEMEOcGIAFGDQMLCwsgAkEAQQQQ9QZBAAwDCyAHQv//A1gNAQsgAkEAQQQQ9QZB//8DDAELQQAgB6ciAGsgACAFQS1GGwshACAEQRBqJAAgAEH//wNxCw8AIAEgAiADIAQgBRDuAgvKAwECfyMAQZACayIFJAAgBUGAAiABEPUGIAVBiAIgABD1BiACEN4CIQYgBUHQAWogAiAFQf8BahDfAiAFQcABahDgAiIAIAAQ4QIQ4gIgBUG8ASAAQQAQ4wIiARD1BiAFQQwgBUEQahD1BiAFQQhBABD1BgNAAkAgBUGIAmogBUGAAmoQ3AFFDQAgBUG8ARDnBiAAELMBIAFqRgRAIAAQswEhAiAAIAAQswFBAXQQ4gIgACAAEOECEOICIAVBvAEgAiAAQQAQ4wIiAWoQ9QYLIAVBiAJqEN0BIAYgASAFQbwBaiAFQQhqIAVB/wEQ4gYgBUHQAWogBUEQaiAFQQxqQZDLABDkAg0AIAVBiAJqEN8BGgwBCwsCQCAFQdABahCzAUUNACAFQQwQ5wYiAiAFQRBqa0GfAUoNACAFQQwgAkEEahD1BiACQQAgBUEIEOcGEPUGCyAEQQAgASAFQbwBEOcGIAMgBhDvAhD1BiAFQdABaiAFQRBqIAVBDBDnBiADEOYCIAVBiAJqIAVBgAJqEOABBEAgA0EAIANBABDnBkECchD1BgsgBUGIAhDnBiEBIAAQmgYaIAVB0AFqEJoGGiAFQZACaiQAIAEL6gECA38BfiMAQRBrIgQkAAJ/AkACQAJAIAAgAUcEQAJAAkAgAEEAEOMGIgVBLUcNACAAQQFqIgAgAUcNAAwBC0HkhgFBABDnBiEGQeSGAUEAQQAQ9QYgACAEQQxqIAMQgAMQvAIhBwJAQeSGAUEAEOcGIgAEQCAEQQwQ5wYgAUcNASAAQcQARg0FDAQLQeSGAUEAIAYQ9QYgBEEMEOcGIAFGDQMLCwsgAkEAQQQQ9QZBAAwDCyAHQv////8PWA0BCyACQQBBBBD1BkF/DAELQQAgB6ciAGsgACAFQS1GGwshACAEQRBqJAAgAAsPACABIAIgAyAEIAUQ8QILygMBAn8jAEGQAmsiBSQAIAVBgAIgARD1BiAFQYgCIAAQ9QYgAhDeAiEGIAVB0AFqIAIgBUH/AWoQ3wIgBUHAAWoQ4AIiACAAEOECEOICIAVBvAEgAEEAEOMCIgEQ9QYgBUEMIAVBEGoQ9QYgBUEIQQAQ9QYDQAJAIAVBiAJqIAVBgAJqENwBRQ0AIAVBvAEQ5wYgABCzASABakYEQCAAELMBIQIgACAAELMBQQF0EOICIAAgABDhAhDiAiAFQbwBIAIgAEEAEOMCIgFqEPUGCyAFQYgCahDdASAGIAEgBUG8AWogBUEIaiAFQf8BEOIGIAVB0AFqIAVBEGogBUEMakGQywAQ5AINACAFQYgCahDfARoMAQsLAkAgBUHQAWoQswFFDQAgBUEMEOcGIgIgBUEQamtBnwFKDQAgBUEMIAJBBGoQ9QYgAkEAIAVBCBDnBhD1BgsgBEEAIAEgBUG8ARDnBiADIAYQ8gIQ+gYgBUHQAWogBUEQaiAFQQwQ5wYgAxDmAiAFQYgCaiAFQYACahDgAQRAIANBACADQQAQ5wZBAnIQ9QYLIAVBiAIQ5wYhASAAEJoGGiAFQdABahCaBhogBUGQAmokACABC9kBAgN/AX4jAEEQayIEJAACfgJAAkAgACABRwRAAkACQCAAQQAQ4wYiBUEtRw0AIABBAWoiACABRw0ADAELQeSGAUEAEOcGIQZB5IYBQQBBABD1BiAAIARBDGogAxCAAxC8AiEHAkBB5IYBQQAQ5wYiAARAIARBDBDnBiABRw0BIABBxABGDQQMBQtB5IYBQQAgBhD1BiAEQQwQ5wYgAUYNBAsLCyACQQBBBBD1BkIADAILIAJBAEEEEPUGQn8MAQtCACAHfSAHIAVBLUYbCyEHIARBEGokACAHCw8AIAEgAiADIAQgBRD0Agv+AwEBfyMAQZACayIFJAAgBUGAAiABEPUGIAVBiAIgABD1BiAFQdABaiACIAVB4AFqIAVB3wFqIAVB3gFqEPUCIAVBwAFqEOACIgEgARDhAhDiAiAFQbwBIAFBABDjAiIAEPUGIAVBDCAFQRBqEPUGIAVBCEEAEPUGIAVBB0EBEPAGIAVBBkHFABDwBgNAAkAgBUGIAmogBUGAAmoQ3AFFDQAgBUG8ARDnBiABELMBIABqRgRAIAEQswEhAiABIAEQswFBAXQQ4gIgASABEOECEOICIAVBvAEgAiABQQAQ4wIiAGoQ9QYLIAVBiAJqEN0BIAVBB2ogBUEGaiAAIAVBvAFqIAVB3wEQ4gYgBUHeARDiBiAFQdABaiAFQRBqIAVBDGogBUEIaiAFQeABahD2Ag0AIAVBiAJqEN8BGgwBCwsCQCAFQdABahCzAUUNACAFQQcQ4wZB/wFxRQ0AIAVBDBDnBiICIAVBEGprQZ8BSg0AIAVBDCACQQRqEPUGIAJBACAFQQgQ5wYQ9QYLIAQgACAFQbwBEOcGIAMQ9wIQ+wYgBUHQAWogBUEQaiAFQQwQ5wYgAxDmAiAFQYgCaiAFQYACahDgAQRAIANBACADQQAQ5wZBAnIQ9QYLIAVBiAIQ5wYhACABEJoGGiAFQdABahCaBhogBUGQAmokACAAC2EBAX8jAEEQayIFJAAgBUEIaiABENsBIAVBCGoQPUGQywBBsMsAIAIQ/wIgA0EAIAVBCGoQ0QIiARClAxDwBiAEQQAgARCmAxDwBiAAIAEQpwMgBUEIahDQAiAFQRBqJAALtgQBAX8jAEEQayIMJAAgDEEPIAAQ8AYCQAJAIAAgBUYEQCABQQAQ4wZFDQFBACEAIAFBAEEAEPAGIARBACAEQQAQ5wYiAUEBahD1BiABQQBBLhDwBiAHELMBRQ0CIAlBABDnBiIBIAhrQZ8BSg0CIApBABDnBiECIAlBACABQQRqEPUGIAFBACACEPUGDAILAkAgACAGRw0AIAcQswFFDQAgAUEAEOMGRQ0BQQAhACAJQQAQ5wYiASAIa0GfAUoNAiAKQQAQ5wYhACAJQQAgAUEEahD1BiABQQAgABD1BkEAIQAgCkEAQQAQ9QYMAgtBfyEAIAsgC0EgaiAMQQ9qEIMDIAtrIgVBH0oNASAFQZDLAGpBABDjBiEGAkACQAJAAkAgBUEWaw4EAQEAAAILIAMgBEEAEOcGIgFHBEAgAUEBa0EAEOMGQd8AcSACQQAQ4wZB/wBxRw0FCyAEQQAgAUEBahD1BiABQQAgBhDwBkEAIQAMBAsgAkEAQdAAEPAGDAELIAJBABDiBiIAIAZB3wBxRw0AIAJBACAAQYABchDwBiABQQAQ4wZFDQAgAUEAQQAQ8AYgBxCzAUUNACAJQQAQ5wYiACAIa0GfAUoNACAKQQAQ5wYhASAJQQAgAEEEahD1BiAAQQAgARD1BgsgBEEAIARBABDnBiIAQQFqEPUGIABBACAGEPAGQQAhACAFQRVKDQEgCkEAIApBABDnBkEBahD1BgwBC0F/IQALIAxBEGokACAAC6QBAgN/AX0jAEEQayIDJAACQCAAIAFHBEBB5IYBQQAQ5wYhBEHkhgFBAEEAEPUGIANBDGohBRCAAxogACAFEL4CIQYCQEHkhgFBABDnBiIABEAgA0EMEOcGIAFHDQEgAEHEAEcNAyACQQBBBBD1BgwDC0HkhgFBACAEEPUGIANBDBDnBiABRg0CCwsgAkEAQQQQ9QZDAAAAACEGCyADQRBqJAAgBgsPACABIAIgAyAEIAUQ+QILgAQBAX8jAEGQAmsiBSQAIAVBgAIgARD1BiAFQYgCIAAQ9QYgBUHQAWogAiAFQeABaiAFQd8BaiAFQd4BahD1AiAFQcABahDgAiIBIAEQ4QIQ4gIgBUG8ASABQQAQ4wIiABD1BiAFQQwgBUEQahD1BiAFQQhBABD1BiAFQQdBARDwBiAFQQZBxQAQ8AYDQAJAIAVBiAJqIAVBgAJqENwBRQ0AIAVBvAEQ5wYgARCzASAAakYEQCABELMBIQIgASABELMBQQF0EOICIAEgARDhAhDiAiAFQbwBIAIgAUEAEOMCIgBqEPUGCyAFQYgCahDdASAFQQdqIAVBBmogACAFQbwBaiAFQd8BEOIGIAVB3gEQ4gYgBUHQAWogBUEQaiAFQQxqIAVBCGogBUHgAWoQ9gINACAFQYgCahDfARoMAQsLAkAgBUHQAWoQswFFDQAgBUEHEOMGQf8BcUUNACAFQQwQ5wYiAiAFQRBqa0GfAUoNACAFQQwgAkEEahD1BiACQQAgBUEIEOcGEPUGCyAEQQAgACAFQbwBEOcGIAMQ+gIQ/AYgBUHQAWogBUEQaiAFQQwQ5wYgAxDmAiAFQYgCaiAFQYACahDgAQRAIANBACADQQAQ5wZBAnIQ9QYLIAVBiAIQ5wYhACABEJoGGiAFQdABahCaBhogBUGQAmokACAAC6gBAgN/AXwjAEEQayIDJAACQCAAIAFHBEBB5IYBQQAQ5wYhBEHkhgFBAEEAEPUGIANBDGohBRCAAxogACAFEMACIQYCQEHkhgFBABDnBiIABEAgA0EMEOcGIAFHDQEgAEHEAEcNAyACQQBBBBD1BgwDC0HkhgFBACAEEPUGIANBDBDnBiABRg0CCwsgAkEAQQQQ9QZEAAAAAAAAAAAhBgsgA0EQaiQAIAYLDwAgASACIAMgBCAFEPwCC5cEAQF/IwBBoAJrIgUkACAFQZACIAEQ9QYgBUGYAiAAEPUGIAVB4AFqIAIgBUHwAWogBUHvAWogBUHuAWoQ9QIgBUHQAWoQ4AIiASABEOECEOICIAVBzAEgAUEAEOMCIgAQ9QYgBUEcIAVBIGoQ9QYgBUEYQQAQ9QYgBUEXQQEQ8AYgBUEWQcUAEPAGA0ACQCAFQZgCaiAFQZACahDcAUUNACAFQcwBEOcGIAEQswEgAGpGBEAgARCzASECIAEgARCzAUEBdBDiAiABIAEQ4QIQ4gIgBUHMASACIAFBABDjAiIAahD1BgsgBUGYAmoQ3QEgBUEXaiAFQRZqIAAgBUHMAWogBUHvARDiBiAFQe4BEOIGIAVB4AFqIAVBIGogBUEcaiAFQRhqIAVB8AFqEPYCDQAgBUGYAmoQ3wEaDAELCwJAIAVB4AFqELMBRQ0AIAVBFxDjBkH/AXFFDQAgBUEcEOcGIgIgBUEgamtBnwFKDQAgBUEcIAJBBGoQ9QYgAkEAIAVBGBDnBhD1BgsgBSAAIAVBzAEQ5wYgAxD9AiAEQQAgBUEAEO4GEPoGIARBCCAFQQgQ7gYQ+gYgBUHgAWogBUEgaiAFQRwQ5wYgAxDmAiAFQZgCaiAFQZACahDgAQRAIANBACADQQAQ5wZBAnIQ9QYLIAVBmAIQ5wYhACABEJoGGiAFQeABahCaBhogBUGgAmokACAAC78BAgJ/An4jAEEgayIEJAACQCABIAJHBEBB5IYBQQAQ5wYhBUHkhgFBAEEAEPUGIAQgASAEQRxqEIcGIARBCBDuBiEGIARBABDuBiEHAkBB5IYBQQAQ5wYiAQRAIARBHBDnBiACRw0BIAFBxABHDQMgA0EAQQQQ9QYMAwtB5IYBQQAgBRD1BiAEQRwQ5wYgAkYNAgsLIANBAEEEEPUGQgAhB0IAIQYLIABBACAHEPoGIABBCCAGEPoGIARBIGokAAurAwEBfyMAQZACayIAJAAgAEGAAiACEPUGIABBiAIgARD1BiAAQdABahDgAiEGIABBEGogAxDbASAAQRBqED1BkMsAQarLACAAQeABahD/AiAAQRBqENACIABBwAFqEOACIgIgAhDhAhDiAiAAQbwBIAJBABDjAiIBEPUGIABBDCAAQRBqEPUGIABBCEEAEPUGA0ACQCAAQYgCaiAAQYACahDcAUUNACAAQbwBEOcGIAIQswEgAWpGBEAgAhCzASEDIAIgAhCzAUEBdBDiAiACIAIQ4QIQ4gIgAEG8ASADIAJBABDjAiIBahD1BgsgAEGIAmoQ3QFBECABIABBvAFqIABBCGpBACAGIABBEGogAEEMaiAAQeABahDkAg0AIABBiAJqEN8BGgwBCwsgAiAAQbwBEOcGIAFrEOICIAIQtwEhARCAAyEDIABBACAFEPUGIAEgAyAAEIEDQQFHBEAgBEEAQQQQ9QYLIABBiAJqIABBgAJqEOABBEAgBEEAIARBABDnBkECchD1BgsgAEGIAhDnBiEBIAIQmgYaIAYQmgYaIABBkAJqJAAgAQsaACAAIAEgAiADIABBABDnBkEgEOcGEQsAGgs5AAJAQQBBrKEBEOMGQQFxDQBBrKEBEK0GRQ0AQQBBqKEBEK8CEPUGQayhARCyBgtBAEGooQEQ5wYLSwEBfyMAQRBrIgMkACADQQwgARD1BiADQQggAhD1BiADIANBDGoQhAMhASAAQbHLACADQQgQ5wYQpgIhACABEIUDIANBEGokACAACxIAIAAQO0EIEOcGQf////8HcQs5ACACQQAQ4wZB/wFxIQIDQAJAIAAgAUcEfyAAQQAQ4wYgAkcNASAABSABCw8LIABBAWohAAwACwALFQAgAEEAIAFBABDnBhC5AhD1BiAACxQAIABBABDnBiIABEAgABC5AhoLC44CAQF/IwBBIGsiBiQAIAZBGCABEPUGAkAgAxAnQQFxRQRAIAZBAEF/EPUGIAZBGCAAIAEgAiADIAQgBiAAQQAQ5wZBEBDnBhEIACIBEPUGAkACQAJAIAZBABDnBg4CAAECCyAFQQBBABDwBgwDCyAFQQBBARDwBgwCCyAFQQBBARDwBiAEQQBBBBD1BgwBCyAGIAMQ2wEgBhDpASEBIAYQ0AIgBiADENsBIAYQhwMhACAGENACIAYgABDSAiAGQQxyIAAQ0wIgBUEAIAZBGGogAiAGIAZBGGoiAyABIARBARCIAyAGRhDwBiAGQRgQ5wYhAQNAIANBDGsQpgYiAyAGRw0ACwsgBkEgaiQAIAELCwAgAEGEogEQ1QIL1AQBC38jAEGAAWsiCCQAIAhB+AAgARD1BiACIAMQ1gIhCSAIQRBB2QAQ9QYgCEEIakEAIAhBEGoQ1wIhDyAIQRBqIQoCQCAJQeUATwRAIAkQyAYiCkUNASAPIAoQ2AILIAohByACIQEDQCABIANGBEADQAJAIAlBACAAIAhB+ABqEOoBG0UEQCAAIAhB+ABqEO4BBEAgBUEAIAVBABDnBkECchD1BgsMAQsgABDrASENIAZFBEAgBCANEIkDIQ0LIAxBAWohEEEAIQ4gCiEHIAIhAQNAIAEgA0YEQCAQIQwgDkUNAyAAEO0BGiAKIQcgAiEBIAkgC2pBAkkNAwNAIAEgA0YNBAJAIAdBABDjBkECRw0AIAEQigMgDEYNACAHQQBBABDwBiALQQFrIQsLIAdBAWohByABQQxqIQEMAAsACwJAIAdBABDjBkEBRw0AIAEgDBCLA0EAEOcGIRECQCAGBH8gEQUgBCAREIkDCyANRgRAQQEhDiABEIoDIBBHDQIgB0EAQQIQ8AYgC0EBaiELDAELIAdBAEEAEPAGCyAJQQFrIQkLIAdBAWohByABQQxqIQEMAAsACwsCQAJAA0AgAiADRg0BIApBABDjBkECRwRAIApBAWohCiACQQxqIQIMAQsLIAIhAwwBCyAFQQAgBUEAEOcGQQRyEPUGCyAPENsCIAhBgAFqJAAgAw8LAkAgARCMA0UEQCAHQQBBARDwBgwBCyAHQQBBAhDwBiALQQFqIQsgCUEBayEJCyAHQQFqIQcgAUEMaiEBDAALAAsQgwIACxUAIAAgASAAQQAQ5wZBHBDnBhEDAAsVACAAEPEDBEAgABDyAw8LIAAQ8wMLDQAgABDFAyABQQJ0agsIACAAEIoDRQsPACABIAIgAyAEIAUQjgML1QMBA38jAEHgAmsiBSQAIAVB0AIgARD1BiAFQdgCIAAQ9QYgAhDeAiEGIAIgBUHgAWoQjwMhByAFQdABaiACIAVBzAJqEJADIAVBwAFqEOACIgAgABDhAhDiAiAFQbwBIABBABDjAiIBEPUGIAVBDCAFQRBqEPUGIAVBCEEAEPUGA0ACQCAFQdgCaiAFQdACahDqAUUNACAFQbwBEOcGIAAQswEgAWpGBEAgABCzASECIAAgABCzAUEBdBDiAiAAIAAQ4QIQ4gIgBUG8ASACIABBABDjAiIBahD1BgsgBUHYAmoQ6wEgBiABIAVBvAFqIAVBCGogBUHMAhDnBiAFQdABaiAFQRBqIAVBDGogBxCRAw0AIAVB2AJqEO0BGgwBCwsCQCAFQdABahCzAUUNACAFQQwQ5wYiAiAFQRBqa0GfAUoNACAFQQwgAkEEahD1BiACQQAgBUEIEOcGEPUGCyAEQQAgASAFQbwBEOcGIAMgBhDlAhD1BiAFQdABaiAFQRBqIAVBDBDnBiADEOYCIAVB2AJqIAVB0AJqEO4BBEAgA0EAIANBABDnBkECchD1BgsgBUHYAhDnBiEBIAAQmgYaIAVB0AFqEJoGGiAFQeACaiQAIAELCQAgACABEKgDC0EBAX8jAEEQayIDJAAgA0EIaiABENsBIAJBACADQQhqEIcDIgEQpgMQ9QYgACABEKcDIANBCGoQ0AIgA0EQaiQAC6MDAQJ/IwBBEGsiCiQAIApBDCAAEPUGAkACQAJAIANBABDnBiACRw0AQSshCyAJQeAAEOcGIABHBEBBLSELIAlB5AAQ5wYgAEcNAQsgA0EAIAJBAWoQ9QYgAkEAIAsQ8AYMAQsgBhCzAUUgACAFR3JFBEBBACEAIAhBABDnBiIBIAdrQZ8BSg0CIARBABDnBiEAIAhBACABQQRqEPUGIAFBACAAEPUGDAELQX8hACAJIAlB6ABqIApBDGoQpAMgCWsiBkHcAEoNASAGQQJ1IQUCQAJAAkAgAUEIaw4DAAIAAQsgASAFSg0BDAMLIAFBEEcgBkHYAEhyDQAgA0EAEOcGIgEgAkYgASACa0ECSnINAiABQQFrQQAQ4wZBMEcNAkEAIQAgBEEAQQAQ9QYgA0EAIAFBAWoQ9QYgAUEAIAVBkMsAakEAEOMGEPAGDAILIANBACADQQAQ5wYiAEEBahD1BiAAQQAgBUGQywBqQQAQ4wYQ8AYgBEEAIARBABDnBkEBahD1BkEAIQAMAQtBACEAIARBAEEAEPUGCyAKQRBqJAAgAAsPACABIAIgAyAEIAUQkwML1QMBA38jAEHgAmsiBSQAIAVB0AIgARD1BiAFQdgCIAAQ9QYgAhDeAiEGIAIgBUHgAWoQjwMhByAFQdABaiACIAVBzAJqEJADIAVBwAFqEOACIgAgABDhAhDiAiAFQbwBIABBABDjAiIBEPUGIAVBDCAFQRBqEPUGIAVBCEEAEPUGA0ACQCAFQdgCaiAFQdACahDqAUUNACAFQbwBEOcGIAAQswEgAWpGBEAgABCzASECIAAgABCzAUEBdBDiAiAAIAAQ4QIQ4gIgBUG8ASACIABBABDjAiIBahD1BgsgBUHYAmoQ6wEgBiABIAVBvAFqIAVBCGogBUHMAhDnBiAFQdABaiAFQRBqIAVBDGogBxCRAw0AIAVB2AJqEO0BGgwBCwsCQCAFQdABahCzAUUNACAFQQwQ5wYiAiAFQRBqa0GfAUoNACAFQQwgAkEEahD1BiACQQAgBUEIEOcGEPUGCyAEQQAgASAFQbwBEOcGIAMgBhDpAhD6BiAFQdABaiAFQRBqIAVBDBDnBiADEOYCIAVB2AJqIAVB0AJqEO4BBEAgA0EAIANBABDnBkECchD1BgsgBUHYAhDnBiEBIAAQmgYaIAVB0AFqEJoGGiAFQeACaiQAIAELDwAgASACIAMgBCAFEJUDC9UDAQN/IwBB4AJrIgUkACAFQdACIAEQ9QYgBUHYAiAAEPUGIAIQ3gIhBiACIAVB4AFqEI8DIQcgBUHQAWogAiAFQcwCahCQAyAFQcABahDgAiIAIAAQ4QIQ4gIgBUG8ASAAQQAQ4wIiARD1BiAFQQwgBUEQahD1BiAFQQhBABD1BgNAAkAgBUHYAmogBUHQAmoQ6gFFDQAgBUG8ARDnBiAAELMBIAFqRgRAIAAQswEhAiAAIAAQswFBAXQQ4gIgACAAEOECEOICIAVBvAEgAiAAQQAQ4wIiAWoQ9QYLIAVB2AJqEOsBIAYgASAFQbwBaiAFQQhqIAVBzAIQ5wYgBUHQAWogBUEQaiAFQQxqIAcQkQMNACAFQdgCahDtARoMAQsLAkAgBUHQAWoQswFFDQAgBUEMEOcGIgIgBUEQamtBnwFKDQAgBUEMIAJBBGoQ9QYgAkEAIAVBCBDnBhD1BgsgBEEAIAEgBUG8ARDnBiADIAYQ7AIQ8gYgBUHQAWogBUEQaiAFQQwQ5wYgAxDmAiAFQdgCaiAFQdACahDuAQRAIANBACADQQAQ5wZBAnIQ9QYLIAVB2AIQ5wYhASAAEJoGGiAFQdABahCaBhogBUHgAmokACABCw8AIAEgAiADIAQgBRCXAwvVAwEDfyMAQeACayIFJAAgBUHQAiABEPUGIAVB2AIgABD1BiACEN4CIQYgAiAFQeABahCPAyEHIAVB0AFqIAIgBUHMAmoQkAMgBUHAAWoQ4AIiACAAEOECEOICIAVBvAEgAEEAEOMCIgEQ9QYgBUEMIAVBEGoQ9QYgBUEIQQAQ9QYDQAJAIAVB2AJqIAVB0AJqEOoBRQ0AIAVBvAEQ5wYgABCzASABakYEQCAAELMBIQIgACAAELMBQQF0EOICIAAgABDhAhDiAiAFQbwBIAIgAEEAEOMCIgFqEPUGCyAFQdgCahDrASAGIAEgBUG8AWogBUEIaiAFQcwCEOcGIAVB0AFqIAVBEGogBUEMaiAHEJEDDQAgBUHYAmoQ7QEaDAELCwJAIAVB0AFqELMBRQ0AIAVBDBDnBiICIAVBEGprQZ8BSg0AIAVBDCACQQRqEPUGIAJBACAFQQgQ5wYQ9QYLIARBACABIAVBvAEQ5wYgAyAGEO8CEPUGIAVB0AFqIAVBEGogBUEMEOcGIAMQ5gIgBUHYAmogBUHQAmoQ7gEEQCADQQAgA0EAEOcGQQJyEPUGCyAFQdgCEOcGIQEgABCaBhogBUHQAWoQmgYaIAVB4AJqJAAgAQsPACABIAIgAyAEIAUQmQML1QMBA38jAEHgAmsiBSQAIAVB0AIgARD1BiAFQdgCIAAQ9QYgAhDeAiEGIAIgBUHgAWoQjwMhByAFQdABaiACIAVBzAJqEJADIAVBwAFqEOACIgAgABDhAhDiAiAFQbwBIABBABDjAiIBEPUGIAVBDCAFQRBqEPUGIAVBCEEAEPUGA0ACQCAFQdgCaiAFQdACahDqAUUNACAFQbwBEOcGIAAQswEgAWpGBEAgABCzASECIAAgABCzAUEBdBDiAiAAIAAQ4QIQ4gIgBUG8ASACIABBABDjAiIBahD1BgsgBUHYAmoQ6wEgBiABIAVBvAFqIAVBCGogBUHMAhDnBiAFQdABaiAFQRBqIAVBDGogBxCRAw0AIAVB2AJqEO0BGgwBCwsCQCAFQdABahCzAUUNACAFQQwQ5wYiAiAFQRBqa0GfAUoNACAFQQwgAkEEahD1BiACQQAgBUEIEOcGEPUGCyAEQQAgASAFQbwBEOcGIAMgBhDyAhD6BiAFQdABaiAFQRBqIAVBDBDnBiADEOYCIAVB2AJqIAVB0AJqEO4BBEAgA0EAIANBABDnBkECchD1BgsgBUHYAhDnBiEBIAAQmgYaIAVB0AFqEJoGGiAFQeACaiQAIAELDwAgASACIAMgBCAFEJsDC/4DAQF/IwBB8AJrIgUkACAFQeACIAEQ9QYgBUHoAiAAEPUGIAVByAFqIAIgBUHgAWogBUHcAWogBUHYAWoQnAMgBUG4AWoQ4AIiASABEOECEOICIAVBtAEgAUEAEOMCIgAQ9QYgBUEMIAVBEGoQ9QYgBUEIQQAQ9QYgBUEHQQEQ8AYgBUEGQcUAEPAGA0ACQCAFQegCaiAFQeACahDqAUUNACAFQbQBEOcGIAEQswEgAGpGBEAgARCzASECIAEgARCzAUEBdBDiAiABIAEQ4QIQ4gIgBUG0ASACIAFBABDjAiIAahD1BgsgBUHoAmoQ6wEgBUEHaiAFQQZqIAAgBUG0AWogBUHcARDnBiAFQdgBEOcGIAVByAFqIAVBEGogBUEMaiAFQQhqIAVB4AFqEJ0DDQAgBUHoAmoQ7QEaDAELCwJAIAVByAFqELMBRQ0AIAVBBxDjBkH/AXFFDQAgBUEMEOcGIgIgBUEQamtBnwFKDQAgBUEMIAJBBGoQ9QYgAkEAIAVBCBDnBhD1BgsgBCAAIAVBtAEQ5wYgAxD3AhD7BiAFQcgBaiAFQRBqIAVBDBDnBiADEOYCIAVB6AJqIAVB4AJqEO4BBEAgA0EAIANBABDnBkECchD1BgsgBUHoAhDnBiEAIAEQmgYaIAVByAFqEJoGGiAFQfACaiQAIAALYgEBfyMAQRBrIgUkACAFQQhqIAEQ2wEgBUEIahDpAUGQywBBsMsAIAIQowMgA0EAIAVBCGoQhwMiARClAxD1BiAEQQAgARCmAxD1BiAAIAEQpwMgBUEIahDQAiAFQRBqJAALwAQBAX8jAEEQayIMJAAgDEEMIAAQ9QYCQAJAIAAgBUYEQCABQQAQ4wZFDQFBACEAIAFBAEEAEPAGIARBACAEQQAQ5wYiAUEBahD1BiABQQBBLhDwBiAHELMBRQ0CIAlBABDnBiIBIAhrQZ8BSg0CIApBABDnBiECIAlBACABQQRqEPUGIAFBACACEPUGDAILAkAgACAGRw0AIAcQswFFDQAgAUEAEOMGRQ0BQQAhACAJQQAQ5wYiASAIa0GfAUoNAiAKQQAQ5wYhACAJQQAgAUEEahD1BiABQQAgABD1BkEAIQAgCkEAQQAQ9QYMAgtBfyEAIAsgC0GAAWogDEEMahCkAyALayIFQfwASg0BIAVBAnVBkMsAakEAEOMGIQYCQAJAAkACQCAFQdgAa0Eedw4EAQEAAAILIAMgBEEAEOcGIgFHBEAgAUEBa0EAEOMGQd8AcSACQQAQ4wZB/wBxRw0FCyAEQQAgAUEBahD1BiABQQAgBhDwBkEAIQAMBAsgAkEAQdAAEPAGDAELIAJBABDiBiIAIAZB3wBxRw0AIAJBACAAQYABchDwBiABQQAQ4wZFDQAgAUEAQQAQ8AYgBxCzAUUNACAJQQAQ5wYiACAIa0GfAUoNACAKQQAQ5wYhASAJQQAgAEEEahD1BiAAQQAgARD1BgsgBEEAIARBABDnBiIAQQFqEPUGIABBACAGEPAGQQAhACAFQdQASg0BIApBACAKQQAQ5wZBAWoQ9QYMAQtBfyEACyAMQRBqJAAgAAsPACABIAIgAyAEIAUQnwMLgAQBAX8jAEHwAmsiBSQAIAVB4AIgARD1BiAFQegCIAAQ9QYgBUHIAWogAiAFQeABaiAFQdwBaiAFQdgBahCcAyAFQbgBahDgAiIBIAEQ4QIQ4gIgBUG0ASABQQAQ4wIiABD1BiAFQQwgBUEQahD1BiAFQQhBABD1BiAFQQdBARDwBiAFQQZBxQAQ8AYDQAJAIAVB6AJqIAVB4AJqEOoBRQ0AIAVBtAEQ5wYgARCzASAAakYEQCABELMBIQIgASABELMBQQF0EOICIAEgARDhAhDiAiAFQbQBIAIgAUEAEOMCIgBqEPUGCyAFQegCahDrASAFQQdqIAVBBmogACAFQbQBaiAFQdwBEOcGIAVB2AEQ5wYgBUHIAWogBUEQaiAFQQxqIAVBCGogBUHgAWoQnQMNACAFQegCahDtARoMAQsLAkAgBUHIAWoQswFFDQAgBUEHEOMGQf8BcUUNACAFQQwQ5wYiAiAFQRBqa0GfAUoNACAFQQwgAkEEahD1BiACQQAgBUEIEOcGEPUGCyAEQQAgACAFQbQBEOcGIAMQ+gIQ/AYgBUHIAWogBUEQaiAFQQwQ5wYgAxDmAiAFQegCaiAFQeACahDuAQRAIANBACADQQAQ5wZBAnIQ9QYLIAVB6AIQ5wYhACABEJoGGiAFQcgBahCaBhogBUHwAmokACAACw8AIAEgAiADIAQgBRChAwuXBAEBfyMAQYADayIFJAAgBUHwAiABEPUGIAVB+AIgABD1BiAFQdgBaiACIAVB8AFqIAVB7AFqIAVB6AFqEJwDIAVByAFqEOACIgEgARDhAhDiAiAFQcQBIAFBABDjAiIAEPUGIAVBHCAFQSBqEPUGIAVBGEEAEPUGIAVBF0EBEPAGIAVBFkHFABDwBgNAAkAgBUH4AmogBUHwAmoQ6gFFDQAgBUHEARDnBiABELMBIABqRgRAIAEQswEhAiABIAEQswFBAXQQ4gIgASABEOECEOICIAVBxAEgAiABQQAQ4wIiAGoQ9QYLIAVB+AJqEOsBIAVBF2ogBUEWaiAAIAVBxAFqIAVB7AEQ5wYgBUHoARDnBiAFQdgBaiAFQSBqIAVBHGogBUEYaiAFQfABahCdAw0AIAVB+AJqEO0BGgwBCwsCQCAFQdgBahCzAUUNACAFQRcQ4wZB/wFxRQ0AIAVBHBDnBiICIAVBIGprQZ8BSg0AIAVBHCACQQRqEPUGIAJBACAFQRgQ5wYQ9QYLIAUgACAFQcQBEOcGIAMQ/QIgBEEAIAVBABDuBhD6BiAEQQggBUEIEO4GEPoGIAVB2AFqIAVBIGogBUEcEOcGIAMQ5gIgBUH4AmogBUHwAmoQ7gEEQCADQQAgA0EAEOcGQQJyEPUGCyAFQfgCEOcGIQAgARCaBhogBUHYAWoQmgYaIAVBgANqJAAgAAusAwEBfyMAQeACayIAJAAgAEHQAiACEPUGIABB2AIgARD1BiAAQdABahDgAiEGIABBEGogAxDbASAAQRBqEOkBQZDLAEGqywAgAEHgAWoQowMgAEEQahDQAiAAQcABahDgAiICIAIQ4QIQ4gIgAEG8ASACQQAQ4wIiARD1BiAAQQwgAEEQahD1BiAAQQhBABD1BgNAAkAgAEHYAmogAEHQAmoQ6gFFDQAgAEG8ARDnBiACELMBIAFqRgRAIAIQswEhAyACIAIQswFBAXQQ4gIgAiACEOECEOICIABBvAEgAyACQQAQ4wIiAWoQ9QYLIABB2AJqEOsBQRAgASAAQbwBaiAAQQhqQQAgBiAAQRBqIABBDGogAEHgAWoQkQMNACAAQdgCahDtARoMAQsLIAIgAEG8ARDnBiABaxDiAiACELcBIQEQgAMhAyAAQQAgBRD1BiABIAMgABCBA0EBRwRAIARBAEEEEPUGCyAAQdgCaiAAQdACahDuAQRAIARBACAEQQAQ5wZBAnIQ9QYLIABB2AIQ5wYhASACEJoGGiAGEJoGGiAAQeACaiQAIAELGgAgACABIAIgAyAAQQAQ5wZBMBDnBhELABoLNQAgAkEAEOcGIQIDQAJAIAAgAUcEfyAAQQAQ5wYgAkcNASAABSABCw8LIABBBGohAAwACwALEwAgACAAQQAQ5wZBDBDnBhEAAAsTACAAIABBABDnBkEQEOcGEQAACxUAIAAgASABQQAQ5wZBFBDnBhEBAAs9AQF/IwBBEGsiAiQAIAJBCGogABDbASACQQhqEOkBQZDLAEGqywAgARCjAyACQQhqENACIAJBEGokACABC+oBAQF/IwBBMGsiBSQAIAVBKCABEPUGAkAgAhAnQQFxRQRAIAAgASACIAMgBCAAQQAQ5wZBGBDnBhEFACECDAELIAVBGGogAhDbASAFQRhqENECIQAgBUEYahDQAgJAIAQEQCAFQRhqIAAQ0gIMAQsgBUEYaiAAENMCCyAFQRAgBUEYahCqAxD1BgNAIAVBCCAFQRhqEKsDEPUGIAVBEGogBUEIahCsA0UEQCAFQSgQ5wYhAiAFQRhqEJoGGgwCCyAFQShqIAVBEGoQrQNBABDiBhD7ASAFQRBqEK4DDAALAAsgBUEwaiQAIAILKQEBfyMAQRBrIgEkACABQQhqIAAQNRCvA0EAEOcGIQAgAUEQaiQAIAALLwEBfyMAQRBrIgEkACABQQhqIAAQNSAAELMBahCvA0EAEOcGIQAgAUEQaiQAIAALEAAgABCtAyABEK0DRkEBcwsJACAAQQAQ5wYLEwAgAEEAIABBABDnBkEBahD1BgsNACAAQQAgARD1BiAAC98BAQR/IwBBIGsiACQAIABBHGpBAEHAywAQ5AYQ8gYgAEEYQbzLABDmBhD1BiAAQRhqQQFyQbTLAEEBIAIQJxCxAyACECchBiAAQRBrIgUiCCQAEIADIQcgAEEAIAQQ9QYgBSAFIAZBCXZBAXFBDWogByAAQRhqIAAQsgMgBWoiBiACELMDIQcgCEEgayIEJAAgAEEIaiACENsBIAUgByAGIAQgAEEUaiAAQRBqIABBCGoQtAMgAEEIahDQAiABIAQgAEEUEOcGIABBEBDnBiACIAMQKSEBIABBIGokACABC5kBAQF/IANBgBBxBEAgAEEAQSsQ8AYgAEEBaiEACyADQYAEcQRAIABBAEEjEPAGIABBAWohAAsDQCABQQAQ4wYiBARAIABBACAEEPAGIABBAWohACABQQFqIQEMAQsLIABBAAJ/Qe8AIANBygBxIgFBwABGDQAaQdgAQfgAIANBgIABcRsgAUEIRg0AGkHkAEH1ACACGwsQ8AYLSwEBfyMAQRBrIgUkACAFQQwgAhD1BiAFQQggBBD1BiAFIAVBDGoQhAMhAiAAIAEgAyAFQQgQ5wYQrwEhACACEIUDIAVBEGokACAAC2YAIAIQJ0GwAXEiAkEgRgRAIAEPCwJAIAJBEEcNAAJAAkAgAEEAEOMGIgJBK2sOAwABAAELIABBAWoPCyACQTBHIAEgAGtBAkhyDQAgAEEBEOMGQSByQfgARw0AIABBAmohAAsgAAuMBAEIfyMAQRBrIgokACAGED0hCyAKIAYQ0QIiBhCnAwJAIAoQsgEEQCALIAAgAiADEP8CIAVBACADIAIgAGtqIgYQ9QYMAQsgBUEAIAMQ9QYCQAJAIAAiCEEAEOMGIgdBK2sOAwABAAELIAsgB0EYdEEYdRA+IQggBUEAIAVBABDnBiIHQQFqEPUGIAdBACAIEPAGIABBAWohCAsCQCACIAhrQQJIDQAgCEEAEOMGQTBHDQAgCEEBEOMGQSByQfgARw0AIAtBMBA+IQcgBUEAIAVBABDnBiIJQQFqEPUGIAlBACAHEPAGIAsgCEEBEOIGED4hByAFQQAgBUEAEOcGIglBAWoQ9QYgCUEAIAcQ8AYgCEECaiEICyAIIAIQtQNBACEJIAYQpgMhDEEAIQcgCCEGA0AgAiAGTQRAIAMgCCAAa2ogBUEAEOcGELUDIAVBABDnBiEGDAILAkAgCiAHEOMCQQAQ4wZFDQAgCiAHEOMCQQAQ4gYgCUcNACAFQQAgBUEAEOcGIglBAWoQ9QYgCUEAIAwQ8AYgByAHIAoQswFBAWtJaiEHQQAhCQsgCyAGQQAQ4gYQPiENIAVBACAFQQAQ5wYiDkEBahD1BiAOQQAgDRDwBiAGQQFqIQYgCUEBaiEJDAALAAsgBEEAIAYgAyABIABraiABIAJGGxD1BiAKEJoGGiAKQRBqJAALCQAgACABENIDC8kBAQR/IwBBIGsiACQAIABBGEIlEPoGIABBGGpBAXJBtssAQQEgAhAnELEDIAIQJyEHIABBIGsiBSIGJAAQgAMhCCAAQQAgBBD6BiAFIAUgB0EJdkEBcUEXaiAIIABBGGogABCyAyAFaiIHIAIQswMhCCAGQTBrIgYkACAAQQhqIAIQ2wEgBSAIIAcgBiAAQRRqIABBEGogAEEIahC0AyAAQQhqENACIAEgBiAAQRQQ5wYgAEEQEOcGIAIgAxApIQEgAEEgaiQAIAEL3wEBBH8jAEEgayIAJAAgAEEcakEAQcDLABDkBhDyBiAAQRhBvMsAEOYGEPUGIABBGGpBAXJBtMsAQQAgAhAnELEDIAIQJyEGIABBEGsiBSIIJAAQgAMhByAAQQAgBBD1BiAFIAUgBkEJdkEBcUEMciAHIABBGGogABCyAyAFaiIGIAIQswMhByAIQSBrIgQkACAAQQhqIAIQ2wEgBSAHIAYgBCAAQRRqIABBEGogAEEIahC0AyAAQQhqENACIAEgBCAAQRQQ5wYgAEEQEOcGIAIgAxApIQEgAEEgaiQAIAELyQEBBH8jAEEgayIAJAAgAEEYQiUQ+gYgAEEYakEBckG2ywBBACACECcQsQMgAhAnIQcgAEEgayIFIgYkABCAAyEIIABBACAEEPoGIAUgBSAHQQl2QQFxQRdqIAggAEEYaiAAELIDIAVqIgcgAhCzAyEIIAZBMGsiBiQAIABBCGogAhDbASAFIAggByAGIABBFGogAEEQaiAAQQhqELQDIABBCGoQ0AIgASAGIABBFBDnBiAAQRAQ5wYgAiADECkhASAAQSBqJAAgAQuTBAEGfyMAQdABayIAJAAgAEHIAUIlEPoGIABByAFqQQFyQbnLACACECcQugMhBiAAQZwBIABBoAFqEPUGEIADIQUCfyAGBEAgAhC7AyEHIABBKCAEEPwGIABBICAHEPUGIABBoAFqQR4gBSAAQcgBaiAAQSBqELIDDAELIABBMCAEEPwGIABBoAFqQR4gBSAAQcgBaiAAQTBqELIDCyEFIABB0ABB2QAQ9QYgAEGQAWpBACAAQdAAahDXAiEHAkAgBUEeTgRAEIADIQUCfyAGBEAgAhC7AyEGIABBCCAEEPwGIABBACAGEPUGIABBnAFqIAUgAEHIAWogABC8AwwBCyAAQRAgBBD8BiAAQZwBaiAFIABByAFqIABBEGoQvAMLIQUgAEGcARDnBiIGRQ0BIAcgBhDYAgsgAEGcARDnBiIGIAUgBmoiCCACELMDIQkgAEHQAEHZABD1BiAAQcgAakEAIABB0ABqENcCIQYCfyAAQZwBEOcGIABBoAFqRgRAIABB0ABqIQUgAEGgAWoMAQsgBUEBdBDIBiIFRQ0BIAYgBRDYAiAAQZwBEOcGCyEKIABBOGogAhDbASAKIAkgCCAFIABBxABqIABBQGsgAEE4ahC9AyAAQThqENACIAEgBSAAQcQAEOcGIABBwAAQ5wYgAiADECkhASAGENsCIAcQ2wIgAEHQAWokACABDwsQgwIAC9YBAQJ/IAJBgBBxBEAgAEEAQSsQ8AYgAEEBaiEACyACQYAIcQRAIABBAEEjEPAGIABBAWohAAsgAkGEAnEiA0GEAkcEQCAAEPEGIABBAmohAAsgAkGAgAFxIQIDQCABQQAQ4wYiBARAIABBACAEEPAGIABBAWohACABQQFqIQEMAQsLIABBAAJ/AkAgA0GAAkcEQCADQQRHDQFBxgBB5gAgAhsMAgtBxQBB5QAgAhsMAQtBwQBB4QAgAhsgA0GEAkYNABpBxwBB5wAgAhsLEPAGIANBhAJHCwkAIABBCBDnBgtJAQF/IwBBEGsiBCQAIARBDCABEPUGIARBCCADEPUGIAQgBEEMahCEAyEBIAAgAiAEQQgQ5wYQsAIhACABEIUDIARBEGokACAAC/0FAQp/IwBBEGsiCSQAIAYQPSEKIAkgBhDRAiINEKcDIAVBACADEPUGAkACQCAAIgdBABDjBiIGQStrDgMAAQABCyAKIAZBGHRBGHUQPiEGIAVBACAFQQAQ5wYiB0EBahD1BiAHQQAgBhDwBiAAQQFqIQcLAkACQCACIAciBmtBAUwNACAHQQAQ4wZBMEcNACAHQQEQ4wZBIHJB+ABHDQAgCkEwED4hBiAFQQAgBUEAEOcGIghBAWoQ9QYgCEEAIAYQ8AYgCiAHQQEQ4gYQPiEGIAVBACAFQQAQ5wYiCEEBahD1BiAIQQAgBhDwBiAHQQJqIgchBgNAIAIgBk0NAiAGQQAQ4gYQgAMQsQJFDQIgBkEBaiEGDAALAAsDQCACIAZNDQEgBkEAEOIGIQgQgAMaIAgQmwFFDQEgBkEBaiEGDAALAAsCQCAJELIBBEAgCiAHIAYgBUEAEOcGEP8CIAVBACAFQQAQ5wYgBiAHa2oQ9QYMAQsgByAGELUDIA0QpgMhDiAHIQgDQCAGIAhNBEAgAyAHIABraiAFQQAQ5wYQtQMMAgsCQCAJIAwQ4wJBABDiBkEBSA0AIAkgDBDjAkEAEOIGIAtHDQAgBUEAIAVBABDnBiILQQFqEPUGIAtBACAOEPAGIAwgDCAJELMBQQFrSWohDEEAIQsLIAogCEEAEOIGED4hDyAFQQAgBUEAEOcGIhBBAWoQ9QYgEEEAIA8Q8AYgCEEBaiEIIAtBAWohCwwACwALA0ACQCAKAn8gAiAGSwRAIAZBABDjBiIHQS5HDQIgDRClAyEHIAVBACAFQQAQ5wYiCEEBahD1BiAIQQAgBxDwBiAGQQFqIQYLIAYLIAIgBUEAEOcGEP8CIAVBACAFQQAQ5wYgAiAGa2oiBRD1BiAEQQAgBSADIAEgAGtqIAEgAkYbEPUGIAkQmgYaIAlBEGokAA8LIAogB0EYdEEYdRA+IQcgBUEAIAVBABDnBiIIQQFqEPUGIAhBACAHEPAGIAZBAWohBgwACwALBwAgAEEEagvLBAEGfyMAQYACayIAJAAgAEH4AUIlEPoGIABB+AFqQQFyQbrLACACECcQugMhByAAQcwBIABB0AFqEPUGEIADIQYCfyAHBEAgAhC7AyEIIABByABqQQAgBRD6BiAAQUBrQQAgBBD6BiAAQTAgCBD1BiAAQdABakEeIAYgAEH4AWogAEEwahCyAwwBCyAAQdAAIAQQ+gYgAEHYACAFEPoGIABB0AFqQR4gBiAAQfgBaiAAQdAAahCyAwshBiAAQYABQdkAEPUGIABBwAFqQQAgAEGAAWoQ1wIhCAJAIAZBHk4EQBCAAyEGAn8gBwRAIAIQuwMhByAAQRhqQQAgBRD6BiAAQRBqQQAgBBD6BiAAQQAgBxD1BiAAQcwBaiAGIABB+AFqIAAQvAMMAQsgAEEgIAQQ+gYgAEEoIAUQ+gYgAEHMAWogBiAAQfgBaiAAQSBqELwDCyEGIABBzAEQ5wYiB0UNASAIIAcQ2AILIABBzAEQ5wYiByAGIAdqIgkgAhCzAyEKIABBgAFB2QAQ9QYgAEH4AGpBACAAQYABahDXAiEHAn8gAEHMARDnBiAAQdABakYEQCAAQYABaiEGIABB0AFqDAELIAZBAXQQyAYiBkUNASAHIAYQ2AIgAEHMARDnBgshCyAAQegAaiACENsBIAsgCiAJIAYgAEH0AGogAEHwAGogAEHoAGoQvQMgAEHoAGoQ0AIgASAGIABB9AAQ5wYgAEHwABDnBiACIAMQKSEBIAcQ2wIgCBDbAiAAQYACaiQAIAEPCxCDAgALyQEBA38jAEHgAGsiACQAIABB3ABqQQBBxssAEOQGEPIGIABB2ABBwssAEOYGEPUGEIADIQUgAEEAIAQQ9QYgAEFAayAAQUBrQRQgBSAAQdgAaiAAELIDIgYgAEFAa2oiBCACELMDIQUgAEEQaiACENsBIABBEGoQPSEHIABBEGoQ0AIgByAAQUBrIAQgAEEQahD/AiABIABBEGogBiAAQRBqaiIBIAUgAGsgAGpBMGsgBCAFRhsgASACIAMQKSEBIABB4ABqJAAgAQvqAQEBfyMAQTBrIgUkACAFQSggARD1BgJAIAIQJ0EBcUUEQCAAIAEgAiADIAQgAEEAEOcGQRgQ5wYRBQAhAgwBCyAFQRhqIAIQ2wEgBUEYahCHAyEAIAVBGGoQ0AICQCAEBEAgBUEYaiAAENICDAELIAVBGGogABDTAgsgBUEQIAVBGGoQwgMQ9QYDQCAFQQggBUEYahDDAxD1BiAFQRBqIAVBCGoQrANFBEAgBUEoEOcGIQIgBUEYahCmBhoMAgsgBUEoaiAFQRBqEK0DQQAQ5wYQ/QEgBUEQahDEAwwACwALIAVBMGokACACCyoBAX8jAEEQayIBJAAgAUEIaiAAEMUDEK8DQQAQ5wYhACABQRBqJAAgAAszAQF/IwBBEGsiASQAIAFBCGogABDFAyAAEIoDQQJ0ahCvA0EAEOcGIQAgAUEQaiQAIAALEwAgAEEAIABBABDnBkEEahD1BgsSACAAEPEDBEAgABCtAw8LIAAL7QEBBH8jAEEgayIAJAAgAEEcakEAQcDLABDkBhDyBiAAQRhBvMsAEOYGEPUGIABBGGpBAXJBtMsAQQEgAhAnELEDIAIQJyEGIABBEGsiBSIIJAAQgAMhByAAQQAgBBD1BiAFIAUgBkEJdkEBcSIEQQ1qIAcgAEEYaiAAELIDIAVqIgYgAhCzAyEHIAggBEEDdEHrAGpB8ABxayIEJAAgAEEIaiACENsBIAUgByAGIAQgAEEUaiAAQRBqIABBCGoQxwMgAEEIahDQAiABIAQgAEEUEOcGIABBEBDnBiACIAMQyAMhASAAQSBqJAAgAQuaBAEIfyMAQRBrIgokACAGEOkBIQsgCiAGEIcDIgYQpwMCQCAKELIBBEAgCyAAIAIgAxCjAyAFQQAgAyACIABrQQJ0aiIGEPUGDAELIAVBACADEPUGAkACQCAAIghBABDjBiIHQStrDgMAAQABCyALIAdBGHRBGHUQiQIhCCAFQQAgBUEAEOcGIgdBBGoQ9QYgB0EAIAgQ9QYgAEEBaiEICwJAIAIgCGtBAkgNACAIQQAQ4wZBMEcNACAIQQEQ4wZBIHJB+ABHDQAgC0EwEIkCIQcgBUEAIAVBABDnBiIJQQRqEPUGIAlBACAHEPUGIAsgCEEBEOIGEIkCIQcgBUEAIAVBABDnBiIJQQRqEPUGIAlBACAHEPUGIAhBAmohCAsgCCACELUDQQAhCSAGEKYDIQxBACEHIAghBgNAIAIgBk0EQCADIAggAGtBAnRqIAVBABDnBhDJAyAFQQAQ5wYhBgwCCwJAIAogBxDjAkEAEOMGRQ0AIAogBxDjAkEAEOIGIAlHDQAgBUEAIAVBABDnBiIJQQRqEPUGIAlBACAMEPUGIAcgByAKELMBQQFrSWohB0EAIQkLIAsgBkEAEOIGEIkCIQ0gBUEAIAVBABDnBiIOQQRqEPUGIA5BACANEPUGIAZBAWohBiAJQQFqIQkMAAsACyAEQQAgBiADIAEgAGtBAnRqIAEgAkYbEPUGIAoQmgYaIApBEGokAAutAQEEfyMAQRBrIggkAAJAIABFDQAgBBAsIQYgAiABayIHQQFOBEAgACABIAdBAnUiBxD+ASAHRw0BCyAGIAMgAWtBAnUiAWtBACABIAZIGyIBQQFOBEAgACAIIAEgBRDKAyIFEMUDIAEQ/gEhBiAFEKYGGiABIAZHDQELIAMgAmsiAUEBTgRAIAAgAiABQQJ1IgEQ/gEgAUcNAQsgBBAwIAAhCQsgCEEQaiQAIAkLCQAgACABENMDCysBAX8jAEEQayIDJAAgACADQQhqIAMQzAIgACABIAIQrAYgA0EQaiQAIAAL1wEBBX8jAEEgayIAJAAgAEEYQiUQ+gYgAEEYakEBckG2ywBBASACECcQsQMgAhAnIQUgAEEgayIGIggkABCAAyEHIABBACAEEPoGIAYgBiAFQQl2QQFxIgVBF2ogByAAQRhqIAAQsgMgBmoiByACELMDIQkgCCAFQQN0QbsBakHwAXFrIgUkACAAQQhqIAIQ2wEgBiAJIAcgBSAAQRRqIABBEGogAEEIahDHAyAAQQhqENACIAEgBSAAQRQQ5wYgAEEQEOcGIAIgAxDIAyEBIABBIGokACABC+EBAQR/IwBBIGsiACQAIABBHGpBAEHAywAQ5AYQ8gYgAEEYQbzLABDmBhD1BiAAQRhqQQFyQbTLAEEAIAIQJxCxAyACECchBiAAQRBrIgUiCCQAEIADIQcgAEEAIAQQ9QYgBSAFIAZBCXZBAXFBDHIgByAAQRhqIAAQsgMgBWoiBiACELMDIQcgCEHgAGsiBCQAIABBCGogAhDbASAFIAcgBiAEIABBFGogAEEQaiAAQQhqEMcDIABBCGoQ0AIgASAEIABBFBDnBiAAQRAQ5wYgAiADEMgDIQEgAEEgaiQAIAEL1wEBBX8jAEEgayIAJAAgAEEYQiUQ+gYgAEEYakEBckG2ywBBACACECcQsQMgAhAnIQUgAEEgayIGIggkABCAAyEHIABBACAEEPoGIAYgBiAFQQl2QQFxIgVBF2ogByAAQRhqIAAQsgMgBmoiByACELMDIQkgCCAFQQN0QbsBakHwAXFrIgUkACAAQQhqIAIQ2wEgBiAJIAcgBSAAQRRqIABBEGogAEEIahDHAyAAQQhqENACIAEgBSAAQRQQ5wYgAEEQEOcGIAIgAxDIAyEBIABBIGokACABC5QEAQZ/IwBBgANrIgAkACAAQfgCQiUQ+gYgAEH4AmpBAXJBucsAIAIQJxC6AyEGIABBzAIgAEHQAmoQ9QYQgAMhBQJ/IAYEQCACELsDIQcgAEEoIAQQ/AYgAEEgIAcQ9QYgAEHQAmpBHiAFIABB+AJqIABBIGoQsgMMAQsgAEEwIAQQ/AYgAEHQAmpBHiAFIABB+AJqIABBMGoQsgMLIQUgAEHQAEHZABD1BiAAQcACakEAIABB0ABqENcCIQcCQCAFQR5OBEAQgAMhBQJ/IAYEQCACELsDIQYgAEEIIAQQ/AYgAEEAIAYQ9QYgAEHMAmogBSAAQfgCaiAAELwDDAELIABBECAEEPwGIABBzAJqIAUgAEH4AmogAEEQahC8AwshBSAAQcwCEOcGIgZFDQEgByAGENgCCyAAQcwCEOcGIgYgBSAGaiIIIAIQswMhCSAAQdAAQdkAEPUGIABByABqQQAgAEHQAGoQ1wIhBgJ/IABBzAIQ5wYgAEHQAmpGBEAgAEHQAGohBSAAQdACagwBCyAFQQN0EMgGIgVFDQEgBiAFENgCIABBzAIQ5wYLIQogAEE4aiACENsBIAogCSAIIAUgAEHEAGogAEFAayAAQThqEM8DIABBOGoQ0AIgASAFIABBxAAQ5wYgAEHAABDnBiACIAMQyAMhASAGENsCIAcQ2wIgAEGAA2okACABDwsQgwIAC5UGAQp/IwBBEGsiCSQAIAYQ6QEhCiAJIAYQhwMiDRCnAyAFQQAgAxD1BgJAAkAgACIHQQAQ4wYiBkEraw4DAAEAAQsgCiAGQRh0QRh1EIkCIQYgBUEAIAVBABDnBiIHQQRqEPUGIAdBACAGEPUGIABBAWohBwsCQAJAIAIgByIGa0EBTA0AIAdBABDjBkEwRw0AIAdBARDjBkEgckH4AEcNACAKQTAQiQIhBiAFQQAgBUEAEOcGIghBBGoQ9QYgCEEAIAYQ9QYgCiAHQQEQ4gYQiQIhBiAFQQAgBUEAEOcGIghBBGoQ9QYgCEEAIAYQ9QYgB0ECaiIHIQYDQCACIAZNDQIgBkEAEOIGEIADELECRQ0CIAZBAWohBgwACwALA0AgAiAGTQ0BIAZBABDiBiEIEIADGiAIEJsBRQ0BIAZBAWohBgwACwALAkAgCRCyAQRAIAogByAGIAVBABDnBhCjAyAFQQAgBUEAEOcGIAYgB2tBAnRqEPUGDAELIAcgBhC1AyANEKYDIQ4gByEIA0AgBiAITQRAIAMgByAAa0ECdGogBUEAEOcGEMkDDAILAkAgCSALEOMCQQAQ4gZBAUgNACAJIAsQ4wJBABDiBiAMRw0AIAVBACAFQQAQ5wYiDEEEahD1BiAMQQAgDhD1BiALIAsgCRCzAUEBa0lqIQtBACEMCyAKIAhBABDiBhCJAiEPIAVBACAFQQAQ5wYiEEEEahD1BiAQQQAgDxD1BiAIQQFqIQggDEEBaiEMDAALAAsCQAJAA0AgAiAGTQ0BIAZBABDjBiIHQS5HBEAgCiAHQRh0QRh1EIkCIQcgBUEAIAVBABDnBiIIQQRqEPUGIAhBACAHEPUGIAZBAWohBgwBCwsgDRClAyEHIAVBACAFQQAQ5wYiC0EEaiIIEPUGIAtBACAHEPUGIAZBAWohBgwBCyAFQQAQ5wYhCAsgCiAGIAIgCBCjAyAFQQAgBUEAEOcGIAIgBmtBAnRqIgUQ9QYgBEEAIAUgAyABIABrQQJ0aiABIAJGGxD1BiAJEJoGGiAJQRBqJAALzAQBBn8jAEGwA2siACQAIABBqANCJRD6BiAAQagDakEBckG6ywAgAhAnELoDIQcgAEH8AiAAQYADahD1BhCAAyEGAn8gBwRAIAIQuwMhCCAAQcgAakEAIAUQ+gYgAEFAa0EAIAQQ+gYgAEEwIAgQ9QYgAEGAA2pBHiAGIABBqANqIABBMGoQsgMMAQsgAEHQACAEEPoGIABB2AAgBRD6BiAAQYADakEeIAYgAEGoA2ogAEHQAGoQsgMLIQYgAEGAAUHZABD1BiAAQfACakEAIABBgAFqENcCIQgCQCAGQR5OBEAQgAMhBgJ/IAcEQCACELsDIQcgAEEYakEAIAUQ+gYgAEEQakEAIAQQ+gYgAEEAIAcQ9QYgAEH8AmogBiAAQagDaiAAELwDDAELIABBICAEEPoGIABBKCAFEPoGIABB/AJqIAYgAEGoA2ogAEEgahC8AwshBiAAQfwCEOcGIgdFDQEgCCAHENgCCyAAQfwCEOcGIgcgBiAHaiIJIAIQswMhCiAAQYABQdkAEPUGIABB+ABqQQAgAEGAAWoQ1wIhBwJ/IABB/AIQ5wYgAEGAA2pGBEAgAEGAAWohBiAAQYADagwBCyAGQQN0EMgGIgZFDQEgByAGENgCIABB/AIQ5wYLIQsgAEHoAGogAhDbASALIAogCSAGIABB9ABqIABB8ABqIABB6ABqEM8DIABB6ABqENACIAEgBiAAQfQAEOcGIABB8AAQ5wYgAiADEMgDIQEgBxDbAiAIENsCIABBsANqJAAgAQ8LEIMCAAvWAQEDfyMAQdABayIAJAAgAEHMAWpBAEHGywAQ5AYQ8gYgAEHIAUHCywAQ5gYQ9QYQgAMhBSAAQQAgBBD1BiAAQbABaiAAQbABakEUIAUgAEHIAWogABCyAyIGIABBsAFqaiIEIAIQswMhBSAAQRBqIAIQ2wEgAEEQahDpASEHIABBEGoQ0AIgByAAQbABaiAEIABBEGoQowMgASAAQRBqIABBEGogBkECdGoiASAFIABrQQJ0IABqQbAFayAEIAVGGyABIAIgAxDIAyEBIABB0AFqJAAgAQssAAJAIAAgAUYNAANAIAAgAUEBayIBTw0BIAAgARCKBCAAQQFqIQAMAAsACwssAAJAIAAgAUYNAANAIAAgAUEEayIBTw0BIAAgARCFAiAAQQRqIQAMAAsACwuCBAEEfyMAQSBrIggkACAIQRAgAhD1BiAIQRggARD1BiAIQQhqIAMQ2wEgCEEIahA9IQkgCEEIahDQAiAEQQBBABD1BkEAIQICQANAIAYgB0YgAnINAQJAIAhBGGogCEEQahDgAQ0AAkAgCSAGQQAQ4gYQ1QNBJUYEQCAGQQFqIgIgB0YNAkEAIQoCQCAJIAJBABDiBhDVAyIBQcUARiABQf8BcUEwRnJFBEAgASELIAYhAgwBCyAGQQJqIgYgB0YNAyAJIAZBABDiBhDVAyELIAEhCgsgCEEYIAAgCEEYEOcGIAhBEBDnBiADIAQgBSALIAogAEEAEOcGQSQQ5wYRDQAQ9QYgAkECaiEGDAELIAlBgMAAIAZBABDiBhDeAQRAA0ACQCAHIAZBAWoiBkYEQCAHIQYMAQsgCUGAwAAgBkEAEOIGEN4BDQELCwNAIAhBGGogCEEQahDcAUUNAiAJQYDAACAIQRhqEN0BEN4BRQ0CIAhBGGoQ3wEaDAALAAsgCSAIQRhqEN0BENkCIAkgBkEAEOIGENkCRgRAIAZBAWohBiAIQRhqEN8BGgwBCyAEQQBBBBD1BgsgBEEAEOcGIQIMAQsLIARBAEEEEPUGCyAIQRhqIAhBEGoQ4AEEQCAEQQAgBEEAEOcGQQJyEPUGCyAIQRgQ5wYhACAIQSBqJAAgAAsXACAAIAFBACAAQQAQ5wZBJBDnBhEEAAsEAEECC0MBAX8jAEEQayIGJAAgBkEIQqWQ6anSyc6S0wAQ+gYgACABIAIgAyAEIAUgBkEIaiAGQRBqENQDIQAgBkEQaiQAIAALNQAgACABIAIgAyAEIAUgAEEIaiAAQQgQ5wZBFBDnBhEAACIAELcBIAAQtwEgABCzAWoQ1AMLTwEBfyMAQRBrIgYkACAGQQggARD1BiAGIAMQ2wEgBhA9IQEgBhDQAiAAIAVBGGogBkEIaiACIAQgARDaAyAGQQgQ5wYhACAGQRBqJAAgAAtGACACIAMgAEEIaiAAQQgQ5wZBABDnBhEAACIAIABBqAFqIAUgBEEAENQCIABrIgBBpwFMBEAgAUEAIABBDG1BB28Q9QYLC08BAX8jAEEQayIGJAAgBkEIIAEQ9QYgBiADENsBIAYQPSEBIAYQ0AIgACAFQRBqIAZBCGogAiAEIAEQ3AMgBkEIEOcGIQAgBkEQaiQAIAALRgAgAiADIABBCGogAEEIEOcGQQQQ5wYRAAAiACAAQaACaiAFIARBABDUAiAAayIAQZ8CTARAIAFBACAAQQxtQQxvEPUGCwtNAQF/IwBBEGsiBiQAIAZBCCABEPUGIAYgAxDbASAGED0hASAGENACIAVBFGogBkEIaiACIAQgARDeAyAGQQgQ5wYhACAGQRBqJAAgAAtGACABIAIgAyAEQQQQ3wMhASADQQAQ4wZBBHFFBEAgAEEAIAFB0A9qIAFB7A5qIAEgAUHkAEgbIAFBxQBIG0HsDmsQ9QYLC+cBAQJ/IwBBEGsiBSQAIAVBCCABEPUGAkAgACAFQQhqEOABBEAgAkEAIAJBABDnBkEGchD1BkEAIQEMAQsgA0GAECAAEN0BIgEQ3gFFBEAgAkEAIAJBABDnBkEEchD1BkEAIQEMAQsgAyABENUDIQEDQAJAIAAQ3wEaIAFBMGshASAAIAVBCGoQ3AFFIARBAkhyDQAgA0GAECAAEN0BIgYQ3gFFDQIgBEEBayEEIAMgBhDVAyABQQpsaiEBDAELCyAAIAVBCGoQ4AFFDQAgAkEAIAJBABDnBkECchD1BgsgBUEQaiQAIAEL6wcBAX8jAEEgayIHJAAgB0EYIAEQ9QYgBEEAQQAQ9QYgB0EIaiADENsBIAdBCGoQPSEIIAdBCGoQ0AICfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgBkHBAGsOOQABFwQXBRcGBxcXFwoXFxcXDg8QFxcXExUXFxcXFxcXAAECAwMXFwEXCBcXCQsXDBcNFwsXFxESFBYLIAAgBUEYaiAHQRhqIAIgBCAIENoDDBgLIAAgBUEQaiAHQRhqIAIgBCAIENwDDBcLIABBCGogAEEIEOcGQQwQ5wYRAAAhASAHQRggACAHQRgQ5wYgAiADIAQgBSABELcBIAEQtwEgARCzAWoQ1AMQ9QYMFgsgBUEMaiAHQRhqIAIgBCAIEOEDDBULIAdBCEKl2r2pwuzLkvkAEPoGIAdBGCAAIAEgAiADIAQgBSAHQQhqIAdBEGoQ1AMQ9QYMFAsgB0EIQqWytanSrcuS5AAQ+gYgB0EYIAAgASACIAMgBCAFIAdBCGogB0EQahDUAxD1BgwTCyAFQQhqIAdBGGogAiAEIAgQ4gMMEgsgBUEIaiAHQRhqIAIgBCAIEOMDDBELIAVBHGogB0EYaiACIAQgCBDkAwwQCyAFQRBqIAdBGGogAiAEIAgQ5QMMDwsgBUEEaiAHQRhqIAIgBCAIEOYDDA4LIAdBGGogAiAEIAgQ5wMMDQsgACAFQQhqIAdBGGogAiAEIAgQ6AMMDAsgB0EPQc/LABDmBhDzBiAHQQhByMsAEOwGEPoGIAdBGCAAIAEgAiADIAQgBSAHQQhqIAdBE2oQ1AMQ9QYMCwsgB0EMakEAQQBB18sAEOMGEPAGIAdBCEHTywAQ5gYQ9QYgB0EYIAAgASACIAMgBCAFIAdBCGogB0ENahDUAxD1BgwKCyAFIAdBGGogAiAEIAgQ6QMMCQsgB0EIQqWQ6anSyc6S0wAQ+gYgB0EYIAAgASACIAMgBCAFIAdBCGogB0EQahDUAxD1BgwICyAFQRhqIAdBGGogAiAEIAgQ6gMMBwsgACABIAIgAyAEIAUgAEEAEOcGQRQQ5wYRCAAMBwsgAEEIaiAAQQgQ5wZBGBDnBhEAACEBIAdBGCAAIAdBGBDnBiACIAMgBCAFIAEQtwEgARC3ASABELMBahDUAxD1BgwFCyAFQRRqIAdBGGogAiAEIAgQ3gMMBAsgBUEUaiAHQRhqIAIgBCAIEOsDDAMLIAZBJUYNAQsgBEEAIARBABDnBkEEchD1BgwBCyAHQRhqIAIgBCAIEOwDCyAHQRgQ5wYLIQAgB0EgaiQAIAALQAAgASACIAMgBEECEN8DIQEgA0EAEOcGIgJBBHEgAUEBa0EeS3JFBEAgAEEAIAEQ9QYPCyADQQAgAkEEchD1Bgs9ACABIAIgAyAEQQIQ3wMhASADQQAQ5wYiAkEEcSABQRdKckUEQCAAQQAgARD1Bg8LIANBACACQQRyEPUGC0AAIAEgAiADIARBAhDfAyEBIANBABDnBiICQQRxIAFBAWtBC0tyRQRAIABBACABEPUGDwsgA0EAIAJBBHIQ9QYLPgAgASACIAMgBEEDEN8DIQEgA0EAEOcGIgJBBHEgAUHtAkpyRQRAIABBACABEPUGDwsgA0EAIAJBBHIQ9QYLQAAgASACIAMgBEECEN8DIQEgA0EAEOcGIgJBBHEgAUEMSnJFBEAgAEEAIAFBAWsQ9QYPCyADQQAgAkEEchD1Bgs9ACABIAIgAyAEQQIQ3wMhASADQQAQ5wYiAkEEcSABQTtKckUEQCAAQQAgARD1Bg8LIANBACACQQRyEPUGC2cBAX8jAEEQayIEJAAgBEEIIAEQ9QYDQAJAIAAgBEEIahDcAUUNACADQYDAACAAEN0BEN4BRQ0AIAAQ3wEaDAELCyAAIARBCGoQ4AEEQCACQQAgAkEAEOcGQQJyEPUGCyAEQRBqJAALiwEAIABBCGogAEEIEOcGQQgQ5wYRAAAiABCzAUEAIABBDGoQswFrRgRAIARBACAEQQAQ5wZBBHIQ9QYPCyACIAMgACAAQRhqIAUgBEEAENQCIABrIgIgAUEAEOcGIgBBDEdyRQRAIAFBAEEAEPUGDwsgAkEMRyAAQQtKckUEQCABQQAgAEEMahD1BgsLPQAgASACIAMgBEECEN8DIQEgA0EAEOcGIgJBBHEgAUE8SnJFBEAgAEEAIAEQ9QYPCyADQQAgAkEEchD1Bgs9ACABIAIgAyAEQQEQ3wMhASADQQAQ5wYiAkEEcSABQQZKckUEQCAAQQAgARD1Bg8LIANBACACQQRyEPUGCywAIAEgAiADIARBBBDfAyEBIANBABDjBkEEcUUEQCAAQQAgAUHsDmsQ9QYLC2sBAX8jAEEQayIEJAAgBEEIIAEQ9QZBBiEBAkACQCAAIARBCGoQ4AENAEEEIQEgAyAAEN0BENUDQSVHDQBBAiEBIAAQ3wEgBEEIahDgAUUNAQsgAkEAIAJBABDnBiABchD1BgsgBEEQaiQAC4MEAQR/IwBBIGsiCCQAIAhBECACEPUGIAhBGCABEPUGIAhBCGogAxDbASAIQQhqEOkBIQkgCEEIahDQAiAEQQBBABD1BkEAIQICQANAIAYgB0YgAnINAQJAIAhBGGogCEEQahDuAQ0AAkAgCSAGQQAQ5wYQ7gNBJUYEQCAGQQRqIgIgB0YNAkEAIQoCQCAJIAJBABDnBhDuAyIBQcUARiABQf8BcUEwRnJFBEAgASELIAYhAgwBCyAGQQhqIgYgB0YNAyAJIAZBABDnBhDuAyELIAEhCgsgCEEYIAAgCEEYEOcGIAhBEBDnBiADIAQgBSALIAogAEEAEOcGQSQQ5wYRDQAQ9QYgAkEIaiEGDAELIAlBgMAAIAZBABDnBhDsAQRAA0ACQCAHIAZBBGoiBkYEQCAHIQYMAQsgCUGAwAAgBkEAEOcGEOwBDQELCwNAIAhBGGogCEEQahDqAUUNAiAJQYDAACAIQRhqEOsBEOwBRQ0CIAhBGGoQ7QEaDAALAAsgCSAIQRhqEOsBEIkDIAkgBkEAEOcGEIkDRgRAIAZBBGohBiAIQRhqEO0BGgwBCyAEQQBBBBD1BgsgBEEAEOcGIQIMAQsLIARBAEEEEPUGCyAIQRhqIAhBEGoQ7gEEQCAEQQAgBEEAEOcGQQJyEPUGCyAIQRgQ5wYhACAIQSBqJAAgAAsXACAAIAFBACAAQQAQ5wZBNBDnBhEEAAt0AQF/IwBBIGsiBiQAIAZBGGpBAEEAQYjNABDuBhD6BiAGQRBqQQBBAEGAzQAQ7gYQ+gYgBkEIQQBB+MwAEO4GEPoGIAZBAEEAQfDMABDuBhD6BiAAIAEgAiADIAQgBSAGIAZBIGoQ7QMhACAGQSBqJAAgAAs4ACAAIAEgAiADIAQgBSAAQQhqIABBCBDnBkEUEOcGEQAAIgAQxQMgABDFAyAAEIoDQQJ0ahDtAwsPACAAQQtqQQAQ4wZBB3YLCQAgAEEEEOcGCwwAIABBC2pBABDjBgtQAQF/IwBBEGsiBiQAIAZBCCABEPUGIAYgAxDbASAGEOkBIQEgBhDQAiAAIAVBGGogBkEIaiACIAQgARD1AyAGQQgQ5wYhACAGQRBqJAAgAAtGACACIAMgAEEIaiAAQQgQ5wZBABDnBhEAACIAIABBqAFqIAUgBEEAEIgDIABrIgBBpwFMBEAgAUEAIABBDG1BB28Q9QYLC1ABAX8jAEEQayIGJAAgBkEIIAEQ9QYgBiADENsBIAYQ6QEhASAGENACIAAgBUEQaiAGQQhqIAIgBCABEPcDIAZBCBDnBiEAIAZBEGokACAAC0YAIAIgAyAAQQhqIABBCBDnBkEEEOcGEQAAIgAgAEGgAmogBSAEQQAQiAMgAGsiAEGfAkwEQCABQQAgAEEMbUEMbxD1BgsLTgEBfyMAQRBrIgYkACAGQQggARD1BiAGIAMQ2wEgBhDpASEBIAYQ0AIgBUEUaiAGQQhqIAIgBCABEPkDIAZBCBDnBiEAIAZBEGokACAAC0YAIAEgAiADIARBBBD6AyEBIANBABDjBkEEcUUEQCAAQQAgAUHQD2ogAUHsDmogASABQeQASBsgAUHFAEgbQewOaxD1BgsL5wEBAn8jAEEQayIFJAAgBUEIIAEQ9QYCQCAAIAVBCGoQ7gEEQCACQQAgAkEAEOcGQQZyEPUGQQAhAQwBCyADQYAQIAAQ6wEiARDsAUUEQCACQQAgAkEAEOcGQQRyEPUGQQAhAQwBCyADIAEQ7gMhAQNAAkAgABDtARogAUEwayEBIAAgBUEIahDqAUUgBEECSHINACADQYAQIAAQ6wEiBhDsAUUNAiAEQQFrIQQgAyAGEO4DIAFBCmxqIQEMAQsLIAAgBUEIahDuAUUNACACQQAgAkEAEOcGQQJyEPUGCyAFQRBqJAAgAQv3CAEBfyMAQUBqIgckACAHQTggARD1BiAEQQBBABD1BiAHIAMQ2wEgBxDpASEIIAcQ0AICfwJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAgBkHBAGsOOQABFwQXBRcGBxcXFwoXFxcXDg8QFxcXExUXFxcXFxcXAAECAwMXFwEXCBcXCQsXDBcNFwsXFxESFBYLIAAgBUEYaiAHQThqIAIgBCAIEPUDDBgLIAAgBUEQaiAHQThqIAIgBCAIEPcDDBcLIABBCGogAEEIEOcGQQwQ5wYRAAAhASAHQTggACAHQTgQ5wYgAiADIAQgBSABEMUDIAEQxQMgARCKA0ECdGoQ7QMQ9QYMFgsgBUEMaiAHQThqIAIgBCAIEPwDDBULIAdBGGpBAEEAQfjLABDuBhD6BiAHQRBqQQBBAEHwywAQ7gYQ+gYgB0EIQQBB6MsAEO4GEPoGIAdBAEEAQeDLABDuBhD6BiAHQTggACABIAIgAyAEIAUgByAHQSBqEO0DEPUGDBQLIAdBGGpBAEEAQZjMABDuBhD6BiAHQRBqQQBBAEGQzAAQ7gYQ+gYgB0EIQQBBiMwAEO4GEPoGIAdBAEEAQYDMABDuBhD6BiAHQTggACABIAIgAyAEIAUgByAHQSBqEO0DEPUGDBMLIAVBCGogB0E4aiACIAQgCBD9AwwSCyAFQQhqIAdBOGogAiAEIAgQ/gMMEQsgBUEcaiAHQThqIAIgBCAIEP8DDBALIAVBEGogB0E4aiACIAQgCBCABAwPCyAFQQRqIAdBOGogAiAEIAgQgQQMDgsgB0E4aiACIAQgCBCCBAwNCyAAIAVBCGogB0E4aiACIAQgCBCDBAwMCyAHQaDMAEEsENIGIgZBOCAAIAEgAiADIAQgBSAGIAZBLGoQ7QMQ9QYMCwsgB0EQakEAQQBB4MwAEOcGEPUGIAdBCEEAQdjMABDuBhD6BiAHQQBBAEHQzAAQ7gYQ+gYgB0E4IAAgASACIAMgBCAFIAcgB0EUahDtAxD1BgwKCyAFIAdBOGogAiAEIAgQhAQMCQsgB0EYakEAQQBBiM0AEO4GEPoGIAdBEGpBAEEAQYDNABDuBhD6BiAHQQhBAEH4zAAQ7gYQ+gYgB0EAQQBB8MwAEO4GEPoGIAdBOCAAIAEgAiADIAQgBSAHIAdBIGoQ7QMQ9QYMCAsgBUEYaiAHQThqIAIgBCAIEIUEDAcLIAAgASACIAMgBCAFIABBABDnBkEUEOcGEQgADAcLIABBCGogAEEIEOcGQRgQ5wYRAAAhASAHQTggACAHQTgQ5wYgAiADIAQgBSABEMUDIAEQxQMgARCKA0ECdGoQ7QMQ9QYMBQsgBUEUaiAHQThqIAIgBCAIEPkDDAQLIAVBFGogB0E4aiACIAQgCBCGBAwDCyAGQSVGDQELIARBACAEQQAQ5wZBBHIQ9QYMAQsgB0E4aiACIAQgCBCHBAsgB0E4EOcGCyEAIAdBQGskACAAC0AAIAEgAiADIARBAhD6AyEBIANBABDnBiICQQRxIAFBAWtBHktyRQRAIABBACABEPUGDwsgA0EAIAJBBHIQ9QYLPQAgASACIAMgBEECEPoDIQEgA0EAEOcGIgJBBHEgAUEXSnJFBEAgAEEAIAEQ9QYPCyADQQAgAkEEchD1BgtAACABIAIgAyAEQQIQ+gMhASADQQAQ5wYiAkEEcSABQQFrQQtLckUEQCAAQQAgARD1Bg8LIANBACACQQRyEPUGCz4AIAEgAiADIARBAxD6AyEBIANBABDnBiICQQRxIAFB7QJKckUEQCAAQQAgARD1Bg8LIANBACACQQRyEPUGC0AAIAEgAiADIARBAhD6AyEBIANBABDnBiICQQRxIAFBDEpyRQRAIABBACABQQFrEPUGDwsgA0EAIAJBBHIQ9QYLPQAgASACIAMgBEECEPoDIQEgA0EAEOcGIgJBBHEgAUE7SnJFBEAgAEEAIAEQ9QYPCyADQQAgAkEEchD1BgtnAQF/IwBBEGsiBCQAIARBCCABEPUGA0ACQCAAIARBCGoQ6gFFDQAgA0GAwAAgABDrARDsAUUNACAAEO0BGgwBCwsgACAEQQhqEO4BBEAgAkEAIAJBABDnBkECchD1BgsgBEEQaiQAC4sBACAAQQhqIABBCBDnBkEIEOcGEQAAIgAQigNBACAAQQxqEIoDa0YEQCAEQQAgBEEAEOcGQQRyEPUGDwsgAiADIAAgAEEYaiAFIARBABCIAyAAayICIAFBABDnBiIAQQxHckUEQCABQQBBABD1Bg8LIAJBDEcgAEELSnJFBEAgAUEAIABBDGoQ9QYLCz0AIAEgAiADIARBAhD6AyEBIANBABDnBiICQQRxIAFBPEpyRQRAIABBACABEPUGDwsgA0EAIAJBBHIQ9QYLPQAgASACIAMgBEEBEPoDIQEgA0EAEOcGIgJBBHEgAUEGSnJFBEAgAEEAIAEQ9QYPCyADQQAgAkEEchD1BgssACABIAIgAyAEQQQQ+gMhASADQQAQ4wZBBHFFBEAgAEEAIAFB7A5rEPUGCwtrAQF/IwBBEGsiBCQAIARBCCABEPUGQQYhAQJAAkAgACAEQQhqEO4BDQBBBCEBIAMgABDrARDuA0ElRw0AQQIhASAAEO0BIARBCGoQ7gFFDQELIAJBACACQQAQ5wYgAXIQ9QYLIARBEGokAAtOACMAQYABayICJAAgAkEMIAJB9ABqEPUGIABBCGogAkEQaiACQQxqIAQgBSAGEIkEIAJBEGogAkEMEOcGIAEQiAYhACACQYABaiQAIAALcgEBfyMAQRBrIgYkACAGQQ9BABDwBiAGQQ4gBRDwBiAGQQ0gBBDwBiAGQQxBJRDwBiAFBEAgBkENaiAGQQ5qEIoECyACQQAgASABIAJBABDnBhCLBCAGQQxqIAMgAEEAEOcGEA8gAWoQ9QYgBkEQaiQAC0EBAX8jAEEQayICJAAgAkEPIABBABDjBhDwBiAAQQAgAUEAEOMGEPAGIAFBACACQQ9qQQAQ4wYQ8AYgAkEQaiQACwcAIAEgAGsLTgAjAEGgA2siAiQAIAJBDCACQaADahD1BiAAQQhqIAJBEGogAkEMaiAEIAUgBhCNBCACQRBqIAJBDBDnBiABEIkGIQAgAkGgA2okACAAC4oBAQF/IwBBkAFrIgYkACAGQRwgBkGEAWoQ9QYgACAGQSBqIAZBHGogAyAEIAUQiQQgBkEQQgAQ+gYgBkEMIAZBIGoQ9QYgASAGQQxqIAEgAkEAEOcGEI4EIAZBEGogAEEAEOcGEI8EIgBBf0YEQBCDAgALIAJBACABIABBAnRqEPUGIAZBkAFqJAALCgAgASAAa0ECdQtAAQF/IwBBEGsiBSQAIAVBDCAEEPUGIAVBCGogBUEMahCEAyEEIAAgASACIAMQtwIhACAEEIUDIAVBEGokACAACwUAQf8ACwgAIAAQ4AIaCwoAIABBAUEtEC4LDgAgAEEAQYKGgCAQ8wYLCABB/////wcLCAAgABCWBBoLJwEBfyMAQRBrIgEkACAAIAFBCGogARDMAiAAEJcEIAFBEGokACAACzEBAX8gACEBQQAhAANAIABBA0YEQA8LIAEgAEECdGpBAEEAEPUGIABBAWohAAwACwALDAAgAEEBQS0QygMaC44EAQF/IwBBoAJrIgAkACAAQZACIAIQ9QYgAEGYAiABEPUGIABBEEHaABD1BiAAQZgBaiAAQaABaiAAQRBqENcCIQEgAEGQAWogBBDbASAAQZABahA9IQcgAEGPAUEAEPAGAkAgAEGYAmogAiADIABBkAFqIAQQJyAFIABBjwFqIAcgASAAQZQBaiAAQYQCahCaBEUNACAAQYcBQZvNABDmBhDzBiAAQYABQZTNABDsBhD6BiAHIABBgAFqIABBigFqIABB9gBqEP8CIABBEEHZABD1BiAAQQhqQQAgAEEQahDXAiEDIABBEGohAgJAIABBlAEQ5wYgARCtA2tB4wBOBEAgAyAAQZQBEOcGIAEQrQNrQQJqEMgGENgCIAMQrQNFDQEgAxCtAyECCyAAQY8BEOMGBEAgAkEAQS0Q8AYgAkEBaiECCyABEK0DIQQDQAJAIABBlAEQ5wYgBE0EQCACQQBBABDwBiAAQQAgBhD1BiAAQRBqIAAQsgJBAUcNASADENsCDAQLIAJBACAAQfYAaiAAQYABaiAEEIMDIABrIABqQQpqQQAQ4wYQ8AYgAkEBaiECIARBAWohBAwBCwsQgwIACxCDAgALIABBmAJqIABBkAJqEOABBEAgBUEAIAVBABDnBkECchD1BgsgAEGYAhDnBiECIABBkAFqENACIAEQ2wIgAEGgAmokACACC/MPAQl/IwBBsARrIgskACALQaQEIAoQ9QYgC0GoBCABEPUGIAtB6ABB2gAQ9QYgC0GEASALQYgBaiALQZABaiALQegAahDXAiIPEK0DIgEQ9QYgC0GAASABQZADahD1BiALQegAahDgAiERIAtB2ABqEOACIQ4gC0HIAGoQ4AIhDCALQThqEOACIQ0gC0EoahDgAiEQIAIgAyALQfgAaiALQfcAaiALQfYAaiARIA4gDCANIAtBJGoQmwQgCUEAIAgQrQMQ9QYgBEGABHEiEkEJdiETQQAhAUEAIQIDQCACIQoCQAJAAkACQCABQQRGDQAgACALQagEahDcAUUNAEEAIQQCQAJAAkACQAJAAkAgC0H4AGogAWpBABDiBg4FAQAEAwUJCyABQQNGDQcgB0GAwAAgABDdARDeAQRAIAtBGGogABCcBCAQIAtBGGoQnQQQowYMAgsgBUEAIAVBABDnBkEEchD1BkEAIQAMBgsgAUEDRg0GCwNAIAAgC0GoBGoQ3AFFDQYgB0GAwAAgABDdARDeAUUNBiALQRhqIAAQnAQgECALQRhqEJ0EEKMGDAALAAsgDBCzAUEAIA0QswFrRg0EAkAgDBCzAQRAIA0QswENAQsgDBCzASEDIAAQ3QEhAiADBEAgDEEAEOMCQQAQ4wYgAkH/AXFGBEAgABDfARogDCAKIAwQswFBAUsbIQIMCAsgBkEAQQEQ8AYMBgsgDUEAEOMCQQAQ4wYgAkH/AXFHDQUgABDfARogBkEAQQEQ8AYgDSAKIA0QswFBAUsbIQIMBgsgABDdAUH/AXEgDEEAEOMCQQAQ4wZGBEAgABDfARogDCAKIAwQswFBAUsbIQIMBgsgABDdAUH/AXEgDUEAEOMCQQAQ4wZGBEAgABDfARogBkEAQQEQ8AYgDSAKIA0QswFBAUsbIQIMBgsgBUEAIAVBABDnBkEEchD1BkEAIQAMAwsgAUECSSAKckUEQEEAIQIgAUECRiALQfsAEOMGQQBHcSATckUNBQsgC0EQIA4QqgMQ9QYgC0EYaiALQRBqEJ4EIQICQCABRQ0AIAEgC2pB9wBqQQAQ4wZBAUsNAANAAkAgC0EQIA4QqwMQ9QYgAiALQRBqEKwDRQ0AIAdBgMAAIAIQrQNBABDiBhDeAUUNACACEK4DDAELCyALQRAgDhCqAxD1BgJ/IAtBEGohAyACEK0DIAMQrQNrIgIgEBCzAU0LBEAgC0EQIBAQqwMQ9QYgC0EQakEAIAJrEK4EIBAQqwMgDhCqAxCtBA0BCyALQQggDhCqAxD1BiALQRBqIAtBCGoQngQaIAtBGCALQRAQ5wYQ9QYLIAtBECALQRgQ5wYQ9QYDQAJAIAtBCCAOEKsDEPUGIAtBEGogC0EIahCsA0UNACAAIAtBqARqENwBRQ0AIAAQ3QFB/wFxIAtBEGoQrQNBABDjBkcNACAAEN8BGiALQRBqEK4DDAELCyASRQ0DIAtBCCAOEKsDEPUGIAtBEGogC0EIahCsA0UNAyAFQQAgBUEAEOcGQQRyEPUGQQAhAAwCCwNAAkAgACALQagEahDcAUUNAAJ/IAdBgBAgABDdASICEN4BBEAgCUEAAn8gCUEAEOcGIgMgC0GkBBDnBkYEQCAIIAkgC0GkBGoQnwQgCUEAEOcGIQMLIANBAWoLEPUGIANBACACEPAGIARBAWoMAQsgBEUgERCzAUVyDQEgAkH/AXEgC0H2ABDjBkH/AXFHDQEgC0GEAQJ/IAtBhAEQ5wYiAiALQYABEOcGRgRAIA8gC0GEAWogC0GAAWoQoAQgC0GEARDnBiECCyACQQRqCxD1BiACQQAgBBD1BkEACyEEIAAQ3wEaDAELCyAPEK0DIQMCQCAERQ0AIAMgC0GEARDnBiICRg0AIAtBhAECfyALQYABEOcGIAJGBEAgDyALQYQBaiALQYABahCgBCALQYQBEOcGIQILIAJBBGoLEPUGIAJBACAEEPUGCwJAIAtBJBDnBkEBSA0AAkAgACALQagEahDgAUUEQCAAEN0BQf8BcSALQfcAEOMGRg0BCyAFQQAgBUEAEOcGQQRyEPUGQQAhAAwDCwNAIAAQ3wEaIAtBJBDnBkEBSA0BAkAgACALQagEahDgAUUEQCAHQYAQIAAQ3QEQ3gENAQsgBUEAIAVBABDnBkEEchD1BkEAIQAMBAsgCUEAEOcGIAtBpAQQ5wZGBEAgCCAJIAtBpARqEJ8ECyAAEN0BIQIgCUEAIAlBABDnBiIDQQFqEPUGIANBACACEPAGIAtBJCALQSQQ5wZBAWsQ9QYMAAsACyAKIQIgCUEAEOcGIAgQrQNHDQMgBUEAIAVBABDnBkEEchD1BkEAIQAMAQsCQCAKRQ0AQQEhBANAIAoQswEgBE0NAQJAIAAgC0GoBGoQ4AFFBEAgABDdAUH/AXEgCiAEENoCQQAQ4wZGDQELIAVBACAFQQAQ5wZBBHIQ9QZBACEADAMLIAAQ3wEaIARBAWohBAwACwALQQEhACAPEK0DIAtBhAEQ5wZGDQBBACEAIAtBGEEAEPUGIBEgDxCtAyALQYQBEOcGIAtBGGoQ5gIgC0EYEOcGBEAgBUEAIAVBABDnBkEEchD1BgwBC0EBIQALIBAQmgYaIA0QmgYaIAwQmgYaIA4QmgYaIBEQmgYaIA8Q2wIgC0GwBGokACAADwsgCiECCyABQQFqIQEMAAsAC7MCAQF/IwBBEGsiCiQAIAlBAAJ/IAAEQCAKIAEQpwQiABCoBCACQQAgCkEAEOcGEPMGIAogABCpBCAIIAoQqgQgChCaBhogCiAAENMCIAcgChCqBCAKEJoGGiADQQAgABClAxDwBiAEQQAgABCmAxDwBiAKIAAQpwMgBSAKEKoEIAoQmgYaIAogABDSAiAGIAoQqgQgChCaBhogABCrBAwBCyAKIAEQrAQiABCoBCACQQAgCkEAEOcGEPMGIAogABCpBCAIIAoQqgQgChCaBhogCiAAENMCIAcgChCqBCAKEJoGGiADQQAgABClAxDwBiAEQQAgABCmAxDwBiAKIAAQpwMgBSAKEKoEIAoQmgYaIAogABDSAiAGIAoQqgQgChCaBhogABCrBAsQ9QYgCkEQaiQACy0BAX8gAUEAEOcGEOUBQRh0QRh1IQIgAEEEIAFBABDnBhD1BiAAQQAgAhDwBgsJACAAQQAQ4gYLEAAgAEEAIAEQrQMQ9QYgAAvTAQEGfyMAQRBrIgQkACAAEL4DQQAQ5wYhBQJ/IAJBABDnBiAAEK0DayIDQf////8HSQRAIANBAXQMAQtBfwsiA0EBIAMbIQMgAUEAEOcGIQYgABCtAyEHIAVB2gBGBH9BAAUgABCtAwsgAxDKBiIIBEAgBUHaAEcEQCAAEK8EGgsgBEEEQdkAEPUGIAAgBEEIaiAIIARBBGoQ1wIiBRCwBCAFENsCIAFBACAAEK0DIAYgB2tqEPUGIAJBACAAEK0DIANqEPUGIARBEGokAA8LEIMCAAvWAQEGfyMAQRBrIgQkACAAEL4DQQAQ5wYhBQJ/IAJBABDnBiAAEK0DayIDQf////8HSQRAIANBAXQMAQtBfwsiA0EEIAMbIQMgAUEAEOcGIQYgABCtAyEHIAVB2gBGBH9BAAUgABCtAwsgAxDKBiIIBEAgBUHaAEcEQCAAEK8EGgsgBEEEQdkAEPUGIAAgBEEIaiAIIARBBGoQ1wIiBRCwBCAFENsCIAFBACAAEK0DIAYgB2tqEPUGIAJBACAAEK0DIANBfHFqEPUGIARBEGokAA8LEIMCAAvLAgECfyMAQaABayIAJAAgAEGQASACEPUGIABBmAEgARD1BiAAQRRB2gAQ9QYgAEEYaiAAQSBqIABBFGoQ1wIhASAAQRBqIAQQ2wEgAEEQahA9IQcgAEEPQQAQ8AYCQCAAQZgBaiACIAMgAEEQaiAEECcgBSAAQQ9qIAcgASAAQRRqIABBhAFqEJoERQ0AIAYQogQgAEEPEOMGBEAgBiAHQS0QPhCjBgsgB0EwED4hAyABEK0DIgQgAEEUEOcGIgdBAWsiAiACIARJGyEIIANB/wFxIQMDQAJAIAYgAiAESwR/IARBABDjBiADRg0BIAQFIAgLIAcQpgQMAgsgBEEBaiEEDAALAAsgAEGYAWogAEGQAWoQ4AEEQCAFQQAgBUEAEOcGQQJyEPUGCyAAQZgBEOcGIQIgAEEQahDQAiABENsCIABBoAFqJAAgAgtgAQJ/IwBBEGsiASQAAkAgABA4BEAgABA5IQIgAUEPQQAQ8AYgAiABQQ9qEKMEIABBABCkBAwBCyAAEDohAiABQQ5BABDwBiACIAFBDmoQowQgAEEAEKUECyABQRBqJAALEAAgAEEAIAFBABDjBhDwBgsNACAAEDtBBCABEPUGCw0AIAAQO0ELIAEQ8AYL1AEBBH8jAEEgayIFJAAgABCzASEEIAAQ4QIhAwJAIAEgAhCCBiIGRQ0AIAEQHCAAEC8gABAvIAAQswFqEIoGBEAgACAFQRBqIAEgAiAAEIsGIgAQtwEgABCzARCiBiAAEJoGGgwBCyAGIAMgBGtLBEAgACADIAQgBmogA2sgBCAEEKAGCyAAEDUgBGohAwNAIAEgAkcEQCADIAEQowQgAUEBaiEBIANBAWohAwwBCwsgBUEPQQAQ8AYgAyAFQQ9qEKMEIAAgBCAGahCMBgsgBUEgaiQACwsAIABB4KABENUCCxUAIAAgASABQQAQ5wZBLBDnBhEBAAsVACAAIAEgAUEAEOcGQSAQ5wYRAQALCQAgACABEL8ECxMAIAAgAEEAEOcGQSQQ5wYRAAALCwAgAEHYoAEQ1QILgwEBAX8jAEEgayIDJAAgA0EQIAEQ9QYgA0EYIAAQ9QYgA0EIIAIQ9QYDQAJAIANBGGogA0EQahCsAyIARQ0AIANBGGoQrQMhASADQQhqEK0DIQIgAUEAEOMGIAJBABDjBkcNACADQRhqEK4DIANBCGoQrgMMAQsLIANBIGokACAAQQFzC0MBAX8jAEEQayICJAAgAkEIIABBABDnBhD1BiACQQhqIgBBACAAQQAQ5wYgAWoQ9QYgAkEIEOcGIQAgAkEQaiQAIAALGAEBfyAAQQAQ5wYhASAAQQBBABD1BiABCyQAIAAgARCvBBDYAiABEL4DQQAQ5wYhASAAEL4DQQAgARD1BguaBAEBfyMAQfAEayIAJAAgAEHgBCACEPUGIABB6AQgARD1BiAAQRBB2gAQ9QYgAEHIAWogAEHQAWogAEEQahDXAiEBIABBwAFqIAQQ2wEgAEHAAWoQ6QEhByAAQb8BQQAQ8AYCQCAAQegEaiACIAMgAEHAAWogBBAnIAUgAEG/AWogByABIABBxAFqIABB4ARqELIERQ0AIABBtwFBm80AEOYGEPMGIABBsAFBlM0AEOwGEPoGIAcgAEGwAWogAEG6AWogAEGAAWoQowMgAEEQQdkAEPUGIABBCGpBACAAQRBqENcCIQMgAEEQaiECAkAgAEHEARDnBiABEK0Da0GJA04EQCADIABBxAEQ5wYgARCtA2tBAnVBAmoQyAYQ2AIgAxCtA0UNASADEK0DIQILIABBvwEQ4wYEQCACQQBBLRDwBiACQQFqIQILIAEQrQMhBANAAkAgAEHEARDnBiAETQRAIAJBAEEAEPAGIABBACAGEPUGIABBEGogABCyAkEBRw0BIAMQ2wIMBAsgAkEAIABBsAFqIABBgAFqIABBqAFqIAQQpAMgAEGAAWprQQJ1akEAEOMGEPAGIAJBAWohAiAEQQRqIQQMAQsLEIMCAAsQgwIACyAAQegEaiAAQeAEahDuAQRAIAVBACAFQQAQ5wZBAnIQ9QYLIABB6AQQ5wYhAiAAQcABahDQAiABENsCIABB8ARqJAAgAgvADwEJfyMAQbAEayILJAAgC0GkBCAKEPUGIAtBqAQgARD1BiALQeAAQdoAEPUGIAtBhAEgC0GIAWogC0GQAWogC0HgAGoQ1wIiDxCtAyIBEPUGIAtBgAEgAUGQA2oQ9QYgC0HgAGoQ4AIhESALQdAAahCWBCEOIAtBQGsQlgQhDCALQTBqEJYEIQ0gC0EgahCWBCEQIAIgAyALQfgAaiALQfQAaiALQfAAaiARIA4gDCANIAtBHGoQswQgCUEAIAgQrQMQ9QYgBEGABHEiEkEJdiETQQAhAUEAIQIDQCACIQoCQAJAAkACQCABQQRGDQAgACALQagEahDqAUUNAEEAIQQCQAJAAkACQAJAAkAgC0H4AGogAWpBABDiBg4FAQAEAwUJCyABQQNGDQcgB0GAwAAgABDrARDsAQRAIAtBEGogABC0BCAQIAtBEGoQrQMQqwYMAgsgBUEAIAVBABDnBkEEchD1BkEAIQAMBgsgAUEDRg0GCwNAIAAgC0GoBGoQ6gFFDQYgB0GAwAAgABDrARDsAUUNBiALQRBqIAAQtAQgECALQRBqEK0DEKsGDAALAAsgDBCKA0EAIA0QigNrRg0EAkAgDBCKAwRAIA0QigMNAQsgDBCKAyEDIAAQ6wEhAiADBEAgDBDFA0EAEOcGIAJGBEAgABDtARogDCAKIAwQigNBAUsbIQIMCAsgBkEAQQEQ8AYMBgsgDRDFA0EAEOcGIAJHDQUgABDtARogBkEAQQEQ8AYgDSAKIA0QigNBAUsbIQIMBgsgABDrASAMEMUDQQAQ5wZGBEAgABDtARogDCAKIAwQigNBAUsbIQIMBgsgABDrASANEMUDQQAQ5wZGBEAgABDtARogBkEAQQEQ8AYgDSAKIA0QigNBAUsbIQIMBgsgBUEAIAVBABDnBkEEchD1BkEAIQAMAwsgAUECSSAKckUEQEEAIQIgAUECRiALQfsAEOMGQQBHcSATckUNBQsgC0EIIA4QwgMQ9QYgC0EQaiALQQhqEJ4EIQICQCABRQ0AIAEgC2pB9wBqQQAQ4wZBAUsNAANAAkAgC0EIIA4QwwMQ9QYgAiALQQhqEKwDRQ0AIAdBgMAAIAIQrQNBABDnBhDsAUUNACACEMQDDAELCyALQQggDhDCAxD1BgJ/IAtBCGohAyACEK0DIAMQrQNrQQJ1IgIgEBCKA00LBEAgC0EIIBAQwwMQ9QYgC0EIakEAIAJrEL4EIBAQwwMgDhDCAxC9BA0BCyALQQAgDhDCAxD1BiALQQhqIAsQngQaIAtBECALQQgQ5wYQ9QYLIAtBCCALQRAQ5wYQ9QYDQAJAIAtBACAOEMMDEPUGIAtBCGogCxCsA0UNACAAIAtBqARqEOoBRQ0AIAAQ6wEgC0EIahCtA0EAEOcGRw0AIAAQ7QEaIAtBCGoQxAMMAQsLIBJFDQMgC0EAIA4QwwMQ9QYgC0EIaiALEKwDRQ0DIAVBACAFQQAQ5wZBBHIQ9QZBACEADAILA0ACQCAAIAtBqARqEOoBRQ0AAn8gB0GAECAAEOsBIgIQ7AEEQCAJQQACfyAJQQAQ5wYiAyALQaQEEOcGRgRAIAggCSALQaQEahCgBCAJQQAQ5wYhAwsgA0EEagsQ9QYgA0EAIAIQ9QYgBEEBagwBCyAERSARELMBRXINASALQfAAEOcGIAJHDQEgC0GEAQJ/IAtBhAEQ5wYiAiALQYABEOcGRgRAIA8gC0GEAWogC0GAAWoQoAQgC0GEARDnBiECCyACQQRqCxD1BiACQQAgBBD1BkEACyEEIAAQ7QEaDAELCyAPEK0DIQMCQCAERQ0AIAMgC0GEARDnBiICRg0AIAtBhAECfyALQYABEOcGIAJGBEAgDyALQYQBaiALQYABahCgBCALQYQBEOcGIQILIAJBBGoLEPUGIAJBACAEEPUGCwJAIAtBHBDnBkEBSA0AAkAgACALQagEahDuAUUEQCAAEOsBIAtB9AAQ5wZGDQELIAVBACAFQQAQ5wZBBHIQ9QZBACEADAMLA0AgABDtARogC0EcEOcGQQFIDQECQCAAIAtBqARqEO4BRQRAIAdBgBAgABDrARDsAQ0BCyAFQQAgBUEAEOcGQQRyEPUGQQAhAAwECyAJQQAQ5wYgC0GkBBDnBkYEQCAIIAkgC0GkBGoQoAQLIAAQ6wEhAiAJQQAgCUEAEOcGIgNBBGoQ9QYgA0EAIAIQ9QYgC0EcIAtBHBDnBkEBaxD1BgwACwALIAohAiAJQQAQ5wYgCBCtA0cNAyAFQQAgBUEAEOcGQQRyEPUGQQAhAAwBCwJAIApFDQBBASEEA0AgChCKAyAETQ0BAkAgACALQagEahDuAUUEQCAAEOsBIAogBBCLA0EAEOcGRg0BCyAFQQAgBUEAEOcGQQRyEPUGQQAhAAwDCyAAEO0BGiAEQQFqIQQMAAsAC0EBIQAgDxCtAyALQYQBEOcGRg0AQQAhACALQRBBABD1BiARIA8QrQMgC0GEARDnBiALQRBqEOYCIAtBEBDnBgRAIAVBACAFQQAQ5wZBBHIQ9QYMAQtBASEACyAQEKYGGiANEKYGGiAMEKYGGiAOEKYGGiAREJoGGiAPENsCIAtBsARqJAAgAA8LIAohAgsgAUEBaiEBDAALAAuzAgEBfyMAQRBrIgokACAJQQACfyAABEAgCiABELoEIgAQqAQgAkEAIApBABDnBhDzBiAKIAAQqQQgCCAKELsEIAoQpgYaIAogABDTAiAHIAoQuwQgChCmBhogA0EAIAAQpQMQ9QYgBEEAIAAQpgMQ9QYgCiAAEKcDIAUgChCqBCAKEJoGGiAKIAAQ0gIgBiAKELsEIAoQpgYaIAAQqwQMAQsgCiABELwEIgAQqAQgAkEAIApBABDnBhDzBiAKIAAQqQQgCCAKELsEIAoQpgYaIAogABDTAiAHIAoQuwQgChCmBhogA0EAIAAQpQMQ9QYgBEEAIAAQpgMQ9QYgCiAAEKcDIAUgChCqBCAKEJoGGiAKIAAQ0gIgBiAKELsEIAoQpgYaIAAQqwQLEPUGIApBEGokAAsnAQF/IAFBABDnBhD1ASECIABBBCABQQAQ5wYQ9QYgAEEAIAIQ9QYLtAIBAX8jAEHAA2siACQAIABBsAMgAhD1BiAAQbgDIAEQ9QYgAEEUQdoAEPUGIABBGGogAEEgaiAAQRRqENcCIQEgAEEQaiAEENsBIABBEGoQ6QEhByAAQQ9BABDwBiAAQbgDaiACIAMgAEEQaiAEECcgBSAAQQ9qIAcgASAAQRRqIABBsANqELIEBEAgBhC2BCAAQQ8Q4wYEQCAGIAdBLRCJAhCrBgsgB0EwEIkCIQIgARCtAyEEIABBFBDnBiIDQQRrIQcDQAJAIAQgB08NACAEQQAQ5wYgAkcNACAEQQRqIQQMAQsLIAYgBCADELkECyAAQbgDaiAAQbADahDuAQRAIAVBACAFQQAQ5wZBAnIQ9QYLIABBuAMQ5wYhAiAAQRBqENACIAEQ2wIgAEHAA2okACACC1wBAn8jAEEQayIBJAACQCAAEPEDBEAgABCtAyECIAFBDEEAEPUGIAIgAUEMahCKAiAAQQAQtwQMAQsgAUEIQQAQ9QYgACABQQhqEIoCIABBABC4BAsgAUEQaiQACwsAIABBBCABEPUGCw4AIABBC2pBACABEPAGC9UBAQR/IwBBEGsiBSQAIAAQigMhBCAAEOMFIQMCQCABIAIQ4gUiBkUNACABIAAQxQMgABDFAyAAEIoDQQJ0ahCKBgRAIAAgBSABIAIgABCOBiIAEMUDIAAQigMQqgYgABCmBhoMAQsgBiADIARrSwRAIAAgAyAEIAZqIANrIAQgBBCpBgsgABDFAyAEQQJ0aiEDA0AgASACRwRAIAMgARCKAiABQQRqIQEgA0EEaiEDDAELCyAFQQBBABD1BiADIAUQigIgACAEIAZqEOQFCyAFQRBqJAALCwAgAEHwoAEQ1QILCQAgACABEMAECwsAIABB6KABENUCC4MBAQF/IwBBIGsiAyQAIANBECABEPUGIANBGCAAEPUGIANBCCACEPUGA0ACQCADQRhqIANBEGoQrAMiAEUNACADQRhqEK0DIQEgA0EIahCtAyECIAFBABDnBiACQQAQ5wZHDQAgA0EYahDEAyADQQhqEMQDDAELCyADQSBqJAAgAEEBcwtGAQF/IwBBEGsiAiQAIAJBCCAAQQAQ5wYQ9QYgAkEIaiIAQQAgAEEAEOcGIAFBAnRqEPUGIAJBCBDnBiEAIAJBEGokACAAC3gBAn8jAEEQayIDJAAgABA4BEAgABA5IQIgABCCAxogAhDJBgsgARA7IQIgABA7IgBBCGpBACACQQhqQQAQ5wYQ9QYgAEEAIAJBABDtBhD5BiABQQAQpQQgARA6IQAgA0EPQQAQ8AYgACADQQ9qEKMEIANBEGokAAtqAQJ/IwBBEGsiAiQAIAAQ8QMEQCAAEK0DIQMgABDnBRogAxDJBgsgAEEIakEAIAFBCGpBABDnBhD1BiAAQQAgAUEAEO0GEPkGIAFBABC4BCACQQxBABD1BiABIAJBDGoQigIgAkEQaiQAC4IFAQt/IwBB0ANrIgAkACAAQRAgBRD6BiAAQRggBhD6BiAAQdwCIABB4AJqEPUGIABB4AJqIABBEGoQsQEhByAAQfABQdkAEPUGIABB6AFqQQAgAEHwAWoQ1wIhDyAAQfABQdkAEPUGIABB4AFqQQAgAEHwAWoQ1wIhCiAAQfABaiEIAkAgB0HkAE8EQBCAAyEHIABBACAFEPoGIABBCCAGEPoGIABB3AJqIAdBn80AIAAQvAMhByAAQdwCEOcGIghFDQEgDyAIENgCIAogBxDIBhDYAiAKEMIEDQEgChCtAyEICyAAQdgBaiADENsBIABB2AFqED0iESAAQdwCEOcGIgkgByAJaiAIEP8CIAICfyAHBEAgAEHcAhDnBkEAEOMGQS1GIQsLIAsLIABB2AFqIABB0AFqIABBzwFqIABBzgFqIABBwAFqEOACIhAgAEGwAWoQ4AIiDCAAQaABahDgAiIJIABBnAFqEMMEIABBMEHZABD1BiAAQShqQQAgAEEwahDXAiENAn8gAEGcARDnBiICIAdIBEAgCRCzASAHIAJrQQF0QQFyagwBCyAJELMBQQJqCyEOIABBMGohAiAMELMBIA5qIABBnAEQ5wZqIg5B5QBPBEAgDSAOEMgGENgCIA0QrQMiAkUNAQsgAiAAQSRqIABBIGogAxAnIAggByAIaiARIAsgAEHQAWogAEHPARDiBiAAQc4BEOIGIBAgDCAJIABBnAEQ5wYQxAQgASACIABBJBDnBiAAQSAQ5wYgAyAEECkhASANENsCIAkQmgYaIAwQmgYaIBAQmgYaIABB2AFqENACIAoQ2wIgDxDbAiAAQdADaiQAIAEPCxCDAgALDwAgAEEAEOcGQQBHQQFzC9sCAQF/IwBBEGsiCiQAIAlBAAJ/IAAEQCACEKcEIQACQCABBEAgCiAAEKgEIANBACAKQQAQ5wYQ8wYgCiAAEKkEDAELIAogABDFBCADQQAgCkEAEOcGEPMGIAogABDTAgsgCCAKEKoEIAoQmgYaIARBACAAEKUDEPAGIAVBACAAEKYDEPAGIAogABCnAyAGIAoQqgQgChCaBhogCiAAENICIAcgChCqBCAKEJoGGiAAEKsEDAELIAIQrAQhAAJAIAEEQCAKIAAQqAQgA0EAIApBABDnBhDzBiAKIAAQqQQMAQsgCiAAEMUEIANBACAKQQAQ5wYQ8wYgCiAAENMCCyAIIAoQqgQgChCaBhogBEEAIAAQpQMQ8AYgBUEAIAAQpgMQ8AYgCiAAEKcDIAYgChCqBCAKEJoGGiAKIAAQ0gIgByAKEKoEIAoQmgYaIAAQqwQLEPUGIApBEGokAAvDBgEKfyMAQRBrIhQkACACQQAgABD1BiADQYAEcSEWA0AgFUEERgRAIA0QswFBAUsEQCAUQQggDRDGBBD1BiACQQAgFEEIakEBEK4EIA0QxwQgAkEAEOcGEMgEEPUGCyADQbABcSIDQRBHBEAgAUEAIANBIEYEfyACQQAQ5wYFIAALEPUGCyAUQRBqJAAPCwJAAkACQAJAAkACQCAIIBVqQQAQ4gYOBQABAwIEBQsgAUEAIAJBABDnBhD1BgwECyABQQAgAkEAEOcGEPUGIAZBIBA+IQ8gAkEAIAJBABDnBiIQQQFqEPUGIBBBACAPEPAGDAMLIA0QsgENAiANQQAQ2gJBABDjBiEPIAJBACACQQAQ5wYiEEEBahD1BiAQQQAgDxDwBgwCCyAMELIBIBZFcg0BIAJBACAMEMYEIAwQxwQgAkEAEOcGEMgEEPUGDAELIAJBABDnBiEXIARBAWogBCAHGyIEIREDQAJAIAUgEU0NACAGQYAQIBFBABDiBhDeAUUNACARQQFqIREMAQsLIA4iD0EBTgRAA0AgD0EBSCIQIAQgEU9yRQRAIBFBAWsiEUEAEOMGIRAgAkEAIAJBABDnBiISQQFqEPUGIBJBACAQEPAGIA9BAWshDwwBCwsgEAR/QQAFIAZBMBA+CyESA0ACQCACQQAgAkEAEOcGIhBBAWoQ9QYgD0EBSA0AIBBBACASEPAGIA9BAWshDwwBCwsgEEEAIAkQ8AYLAkAgBCARRgRAIAZBMBA+IQ8gAkEAIAJBABDnBiIQQQFqEPUGIBBBACAPEPAGDAELAn9BfyALELIBDQAaIAtBABDaAkEAEOIGCyEQQQAhD0EAIRMDQCAEIBFGDQECQCAPIBBHBEAgDyESDAELIAJBACACQQAQ5wYiEEEBahD1BiAQQQAgChDwBkEAIRIgE0EBaiITIAsQswFPBEAgDyEQDAELIAsgExDaAkEAEOMGQf8ARgRAQX8hEAwBCyALIBMQ2gJBABDiBiEQCyARQQFrIhFBABDjBiEPIAJBACACQQAQ5wYiGEEBahD1BiAYQQAgDxDwBiASQQFqIQ8MAAsACyAXIAJBABDnBhC1AwsgFUEBaiEVDAALAAsVACAAIAEgAUEAEOcGQSgQ5wYRAQALKgEBfyMAQRBrIgEkACABQQhqIAAQtwEQrwNBABDnBiEAIAFBEGokACAACzABAX8jAEEQayIBJAAgAUEIaiAAELcBIAAQswFqEK8DQQAQ5wYhACABQRBqJAAgAAskACAAEM4EIQAgARDOBCAAayIBBEAgAiAAIAEQ1AYLIAEgAmoLsAMBB38jAEHAAWsiACQAIABBuAFqIAMQ2wEgAEG4AWoQPSEKIAICfyAFELMBBEAgBUEAENoCQQAQ4wYgCkEtED5B/wFxRiELCyALCyAAQbgBaiAAQbABaiAAQa8BaiAAQa4BaiAAQaABahDgAiIMIABBkAFqEOACIgggAEGAAWoQ4AIiByAAQfwAahDDBCAAQRBB2QAQ9QYgAEEIakEAIABBEGoQ1wIhCQJ/IAUQswEgAEH8ABDnBkoEQCAFELMBIQIgAEH8ABDnBiEGIAcQswEgAiAGa0EBdGpBAWoMAQsgBxCzAUECagshBiAAQRBqIQICQCAIELMBIAZqIABB/AAQ5wZqIgZB5QBJDQAgCSAGEMgGENgCIAkQrQMiAg0AEIMCAAsgAiAAQQRqIAAgAxAnIAUQtwEgBRC3ASAFELMBaiAKIAsgAEGwAWogAEGvARDiBiAAQa4BEOIGIAwgCCAHIABB/AAQ5wYQxAQgASACIABBBBDnBiAAQQAQ5wYgAyAEECkhASAJENsCIAcQmgYaIAgQmgYaIAwQmgYaIABBuAFqENACIABBwAFqJAAgAQuNBQELfyMAQbAIayIAJAAgAEEQIAUQ+gYgAEEYIAYQ+gYgAEG8ByAAQcAHahD1BiAAQcAHaiAAQRBqELEBIQcgAEGgBEHZABD1BiAAQZgEakEAIABBoARqENcCIQ8gAEGgBEHZABD1BiAAQZAEakEAIABBoARqENcCIQogAEGgBGohCAJAIAdB5ABPBEAQgAMhByAAQQAgBRD6BiAAQQggBhD6BiAAQbwHaiAHQZ/NACAAELwDIQcgAEG8BxDnBiIIRQ0BIA8gCBDYAiAKIAdBAnQQyAYQ2AIgChDCBA0BIAoQrQMhCAsgAEGIBGogAxDbASAAQYgEahDpASIRIABBvAcQ5wYiCSAHIAlqIAgQowMgAgJ/IAcEQCAAQbwHEOcGQQAQ4wZBLUYhCwsgCwsgAEGIBGogAEGABGogAEH8A2ogAEH4A2ogAEHoA2oQ4AIiECAAQdgDahCWBCIMIABByANqEJYEIgkgAEHEA2oQywQgAEEwQdkAEPUGIABBKGpBACAAQTBqENcCIQ0CfyAAQcQDEOcGIgIgB0gEQCAJEIoDIAcgAmtBAXRBAXJqDAELIAkQigNBAmoLIQ4gAEEwaiECIAwQigMgDmogAEHEAxDnBmoiDkHlAE8EQCANIA5BAnQQyAYQ2AIgDRCtAyICRQ0BCyACIABBJGogAEEgaiADECcgCCAIIAdBAnRqIBEgCyAAQYAEaiAAQfwDEOcGIABB+AMQ5wYgECAMIAkgAEHEAxDnBhDMBCABIAIgAEEkEOcGIABBIBDnBiADIAQQyAMhASANENsCIAkQpgYaIAwQpgYaIBAQmgYaIABBiARqENACIAoQ2wIgDxDbAiAAQbAIaiQAIAEPCxCDAgAL2wIBAX8jAEEQayIKJAAgCUEAAn8gAARAIAIQugQhAAJAIAEEQCAKIAAQqAQgA0EAIApBABDnBhDzBiAKIAAQqQQMAQsgCiAAEMUEIANBACAKQQAQ5wYQ8wYgCiAAENMCCyAIIAoQuwQgChCmBhogBEEAIAAQpQMQ9QYgBUEAIAAQpgMQ9QYgCiAAEKcDIAYgChCqBCAKEJoGGiAKIAAQ0gIgByAKELsEIAoQpgYaIAAQqwQMAQsgAhC8BCEAAkAgAQRAIAogABCoBCADQQAgCkEAEOcGEPMGIAogABCpBAwBCyAKIAAQxQQgA0EAIApBABDnBhDzBiAKIAAQ0wILIAggChC7BCAKEKYGGiAEQQAgABClAxD1BiAFQQAgABCmAxD1BiAKIAAQpwMgBiAKEKoEIAoQmgYaIAogABDSAiAHIAoQuwQgChCmBhogABCrBAsQ9QYgCkEQaiQAC8wGAQp/IwBBEGsiFCQAIAJBACAAEPUGIANBgARxIRYDQCAVQQRGBEAgDRCKA0EBSwRAIBRBCCANEMIDEPUGIAJBACAUQQhqQQEQvgQgDRDDAyACQQAQ5wYQyAQQ9QYLIANBsAFxIgNBEEcEQCABQQAgA0EgRgR/IAJBABDnBgUgAAsQ9QYLIBRBEGokAA8LAkACQAJAAkACQAJAIAggFWpBABDiBg4FAAEDAgQFCyABQQAgAkEAEOcGEPUGDAQLIAFBACACQQAQ5wYQ9QYgBkEgEIkCIQ8gAkEAIAJBABDnBiIQQQRqEPUGIBBBACAPEPUGDAMLIA0QjAMNAiANQQAQiwNBABDnBiEPIAJBACACQQAQ5wYiEEEEahD1BiAQQQAgDxD1BgwCCyAMEIwDIBZFcg0BIAJBACAMEMIDIAwQwwMgAkEAEOcGEMgEEPUGDAELIAJBABDnBiEXIARBBGogBCAHGyIEIREDQAJAIAUgEU0NACAGQYAQIBFBABDnBhDsAUUNACARQQRqIREMAQsLIA4iD0EBTgRAA0AgD0EBSCIQIAQgEU9yRQRAIBFBBGsiEUEAEOcGIRAgAkEAIAJBABDnBiISQQRqEPUGIBJBACAQEPUGIA9BAWshDwwBCwsgEAR/QQAFIAZBMBCJAgshEgNAAkAgAkEAIAJBABDnBiIQQQRqEPUGIA9BAUgNACAQQQAgEhD1BiAPQQFrIQ8MAQsLIBBBACAJEPUGCwJAIAQgEUYEQCAGQTAQiQIhDyACQQAgAkEAEOcGIhBBBGoiERD1BiAQQQAgDxD1BgwBCwJ/QX8gCxCyAQ0AGiALQQAQ2gJBABDiBgshEEEAIQ9BACETA0AgBCARRwRAAkAgDyAQRwRAIA8hEgwBCyACQQAgAkEAEOcGIhBBBGoQ9QYgEEEAIAoQ9QZBACESIBNBAWoiEyALELMBTwRAIA8hEAwBCyALIBMQ2gJBABDjBkH/AEYEQEF/IRAMAQsgCyATENoCQQAQ4gYhEAsgEUEEayIRQQAQ5wYhDyACQQAgAkEAEOcGIhhBBGoQ9QYgGEEAIA8Q9QYgEkEBaiEPDAELCyACQQAQ5wYhEQsgFyAREMkDCyAVQQFqIRUMAAsAC7UDAQd/IwBB8ANrIgAkACAAQegDaiADENsBIABB6ANqEOkBIQogAgJ/IAUQigMEQCAFQQAQiwNBABDnBiAKQS0QiQJGIQsLIAsLIABB6ANqIABB4ANqIABB3ANqIABB2ANqIABByANqEOACIgwgAEG4A2oQlgQiCCAAQagDahCWBCIHIABBpANqEMsEIABBEEHZABD1BiAAQQhqQQAgAEEQahDXAiEJAn8gBRCKAyAAQaQDEOcGSgRAIAUQigMhAiAAQaQDEOcGIQYgBxCKAyACIAZrQQF0akEBagwBCyAHEIoDQQJqCyEGIABBEGohAgJAIAgQigMgBmogAEGkAxDnBmoiBkHlAEkNACAJIAZBAnQQyAYQ2AIgCRCtAyICDQAQgwIACyACIABBBGogACADECcgBRDFAyAFEMUDIAUQigNBAnRqIAogCyAAQeADaiAAQdwDEOcGIABB2AMQ5wYgDCAIIAcgAEGkAxDnBhDMBCABIAIgAEEEEOcGIABBABDnBiADIAQQyAMhASAJENsCIAcQpgYaIAgQpgYaIAwQmgYaIABB6ANqENACIABB8ANqJAAgAQspAQF/IwBBEGsiASQAIAFBCCAAEPUGIAFBCGoQrQMhACABQRBqJAAgAAsWAEF/An8gARC3ARpB/////wcLQQEbC1QAIwBBIGsiASQAIAFBEGoQ4AIiAxDRBCAFELcBIAUQtwEgBRCzAWoQ0gQgAxC3ASECIAAQ4AIQ0QQgAiACENkGIAJqENIEIAMQmgYaIAFBIGokAAsnAQF/IwBBEGsiASQAIAFBCGogABCvA0EAEOcGIQAgAUEQaiQAIAALQwEBfyMAQRBrIgMkACADQQggABD1BgNAIAEgAkkEQCADQQhqIAEQ0wQgAUEBaiEBDAELCyADQQgQ5wYaIANBEGokAAsTACAAQQAQ5wYgAUEAEOIGEKMGC5EBACMAQSBrIgEkACABQRBqEOACIQQCfyABQQhqIgIQ1wQgAkEAQYTWABD1BiACCyAEENEEIAUQxQMgBRDFAyAFEIoDQQJ0ahDVBCAEELcBIQIgABCWBCEDAn8gAUEIaiIAENcEIABBAEHk1gAQ9QYgAAsgAxDRBCACIAIQ2QYgAmoQ1gQgBBCaBhogAUEgaiQAC7oBAQJ/IwBBQGoiBCQAIARBOCABEPUGIARBMGohBQJAA0AgAiADSQRAIARBCCACEPUGIAAgBEEwaiACIAMgBEEIaiAEQRBqIAUgBEEMaiAAQQAQ5wZBDBDnBhENAEECRg0CIARBEGohASAEQQgQ5wYgAkYNAgNAIARBDBDnBiABTQRAIARBCBDnBiECDAMLIARBOGogARDTBCABQQFqIQEMAAsACwsgBEE4EOcGGiAEQUBrJAAPCxCDAgAL7gEBAn8jAEGgAWsiBCQAIARBmAEgARD1BiAEQZABaiEFAkADQCACIANJBEAgBEEIIAIQ9QYgACAEQZABaiACIAJBIGogAyADIAJrQSBKGyAEQQhqIARBEGogBSAEQQxqIABBABDnBkEQEOcGEQ0AQQJGDQIgBEEQaiEBIARBCBDnBiACRg0CA0AgBEEMEOcGIAFNBEAgBEEIEOcGIQIMAwsgBEEEIAFBABDnBhD1BiAEQQRqIQIgBEGYAWpBABDnBiACQQAQ5wYQqwYgAUEEaiEBDAALAAsLIARBmAEQ5wYaIARBoAFqJAAPCxCDAgALEgAgABDaBCAAQQBBkNUAEPUGCycAIABBAEH4zQAQ9QYgAEEIEOcGEIADRwRAIABBCBDnBhCzAgsgAAvcCAEBf0GArgEQ2gRBgK4BQQBBsM0AEPUGENsEENwEQRwQ3QRBsK8BQaXNABD/AUGQrgEQ3gQhAEGQrgEQ3wRBkK4BIAAQ4ARBwKsBENoEQcCrAUEAQejZABD1BkHAqwFBiKABEOEEEOIEQcirARDaBEHIqwFBAEGI2gAQ9QZByKsBQZCgARDhBBDiBBDjBEHQqwFB1KEBEOEEEOIEQeCrARDaBEHgqwFBAEH00QAQ9QZB4KsBQcyhARDhBBDiBEHoqwEQ2gRB6KsBQQBBiNMAEPUGQeirAUHcoQEQ4QQQ4gRB8KsBENoEQfCrAUEAQfjNABD1BkHwqwFBCBCAAxD1BkHwqwFB5KEBEOEEEOIEQYCsARDaBEGArAFBAEGc1AAQ9QZBgKwBQeyhARDhBBDiBEGIrAEQ1wRBiKwBQfShARDhBBDiBEGQrAEQ2gRBkKwBQQhBrtgAEPIGQZCsAUEAQajOABD1BkGcrAEQ4AIaQZCsAUH8oQEQ4QQQ4gRBsKwBENoEQbCsAUEIQq6AgIDABRD5BkGwrAFBAEHQzgAQ9QZBwKwBEOACGkGwrAFBhKIBEOEEEOIEQdCsARDaBEHQrAFBAEGo2gAQ9QZB0KwBQZigARDhBBDiBEHYrAEQ2gRB2KwBQQBBnNwAEPUGQdisAUGgoAEQ4QQQ4gRB4KwBENoEQeCsAUEAQfDdABD1BkHgrAFBqKABEOEEEOIEQeisARDaBEHorAFBAEHY3wAQ9QZB6KwBQbCgARDhBBDiBEHwrAEQ2gRB8KwBQQBBsOcAEPUGQfCsAUHYoAEQ4QQQ4gRB+KwBENoEQfisAUEAQcToABD1BkH4rAFB4KABEOEEEOIEQYCtARDaBEGArQFBAEG46QAQ9QZBgK0BQeigARDhBBDiBEGIrQEQ2gRBiK0BQQBBrOoAEPUGQYitAUHwoAEQ4QQQ4gRBkK0BENoEQZCtAUEAQaDrABD1BkGQrQFB+KABEOEEEOIEQZitARDaBEGYrQFBAEHE7AAQ9QZBmK0BQYChARDhBBDiBEGgrQEQ2gRBoK0BQQBB6O0AEPUGQaCtAUGIoQEQ4QQQ4gRBqK0BENoEQaitAUEAQYzvABD1BkGorQFBkKEBEOEEEOIEQbCtARDaBEG4rQFBAEGc+wAQ9QZBsK0BQQBBoOEAEPUGQbitAUEAQdDhABD1BkGwrQFBuKABEOEEEOIEQcCtARDaBEHIrQFBAEHA+wAQ9QZBwK0BQQBBqOMAEPUGQcitAUEAQdjjABD1BkHArQFBwKABEOEEEOIEQdCtARDaBEHYrQEQ9wVB0K0BQQBBlOUAEPUGQdCtAUHIoAEQ4QQQ4gRB4K0BENoEQeitARD3BUHgrQFBAEGw5gAQ9QZB4K0BQdCgARDhBBDiBEHwrQEQ2gRB8K0BQQBBsPAAEPUGQfCtAUGYoQEQ4QQQ4gRB+K0BENoEQfitAUEAQajxABD1BkH4rQFBoKEBEOEEEOIECyEAIABBBEEAEPUGIABBAEHk+wAQ9QYgAEEAQbzRABD1BgtMAQJ/IwBBEGsiACQAQZCuAUEAQgAQ+gYgAEEMQQAQ9QYgAEEIaiEBQaCuASAAQQxqEO4FIAEQHBpBsK4BQfAAQQAQ8AYgAEEQaiQAC0oBAX8Q6AVBHEkEQBC6AgALQZCuAUEAQZCuARDpBUEcEOoFIgAQ9QZBkK4BQQQgABD1BkGQrgEQ6wVBACAAQfAAahD1BkEAEOwFC24BAn8jAEEQayIBJAAgASAAEO0FIgBBBBDnBiECA0AgAEEIEOcGIAJHBEBBkK4BEOkFGiAAQQQQ5wYQ8QUgAEEEIABBBBDnBkEEaiICEPUGDAELCyAAQQAQ5wZBBCAAQQQQ5wYQ9QYgAUEQaiQACxQAIABBBBDnBiAAQQAQ5wZrQQJ1Cw4AIAAgAEEAEOcGEPYFCywAIAAQrQMaIAAQrQMgABDwBUECdGoaIAAQrQMaIAAQrQMgABDeBEECdGoaC2kBAn8jAEEgayIBJAAgAUEMQQAQ9QYgAUEIQdsAEPUGIAFBACABQQgQ7gYQ+gYgAAJ/IAFBEGoiAkEEIAFBABDtBhD5BiACQQAgABD1BiACCxD0BCAAQQQQ5wYhACABQSBqJAAgAEEBawuPAQECfyMAQRBrIgIkACAAEOYEIAJBCGogABDoBCEAQZCuARDeBCABTQRAIAFBAWoQ6QQLQZCuASABEOUEQQAQ5wYEQEGQrgEgARDlBEEAEOcGEOoECyAAEK8EIQNBkK4BIAEQ5QRBACADEPUGIABBABDnBiEBIABBAEEAEPUGIAEEQCABEOoECyACQRBqJAALOABB0KsBENoEQdCrAUEMQQAQ8AZB0KsBQQhBABD1BkHQqwFBAEHEzQAQ9QZB0KsBQQgQ+AQQ9QYLSgACQEEAQbihARDjBkEBcQ0AQbihARCtBkUNABDZBEEAQbChAUGArgEQ9QZBAEG0oQFBsKEBEPUGQbihARCyBgtBAEG0oQEQ5wYLDwAgAEEAEOcGIAFBAnRqCxgAIABBBGoiAEEAIABBABDnBkEBahD1BgsgACAAIAEQ7wRFBEAQgwIACyAAQRBqIAEQ5QRBABDnBgs1AQF/IwBBEGsiAiQAIAJBDCABEPUGIAJBCGohASAAIAJBDGoQigIgARAcGiACQRBqJAAgAAtQAQF/IABBkK4BEN4EIgFLBEAgACABaxDuBA8LIAAgAUkEQEGQrgFBABDnBiAAQQJ0aiEAQZCuARDeBCEBQZCuASAAEPYFQZCuASABEOAECws4AQF/An8gAEEEaiIBQQAgAUEAEOcGQQFrIgEQ9QYgAUF/RgsEQCAAIABBABDnBkEIEOcGEQIACwt/AQJ/IABBAEGwzQAQ9QYgAEEQaiEBA0AgARDeBCACSwRAIAEgAhDlBEEAEOcGBEAgASACEOUEQQAQ5wYQ6gQLIAJBAWohAgwBCwsgAEGwAWoQmgYaIAEQ7AQgAUEAEOcGBEAgARDfBCABEOkFIAFBABDnBiABEPAFEPUFCyAACzUAIAAQrQMaIAAQrQMgABDwBUECdGoaIAAQrQMgABDeBEECdGoaIAAQrQMgABDwBUECdGoaCwoAIAAQ6wQQyQYLqgEBAn8jAEEgayICJAACQCAAQZCuARDrBUEAEOcGQZCuAUEEEOcGa0ECdU0EQCAAEN0EDAELQZCuARDpBSEBIAJBCGpBkK4BEN4EIABqEPgFQZCuARDeBCABEPkFIgEgABD6BSABEPsFIAEgAUEEEOcGEIAGIAFBABDnBgRAIAEQ/AUgAUEAEOcGIAEQ/QVBABDnBiABQQAQ5wZrQQJ1EPUFCwsgAkEgaiQACyYBAX8gAEEQaiIAEN4EIAFLBH8gACABEOUEQQAQ5wZBAEcFQQALCxcAIABBACABQQAQ5wYiABD1BiAAEOYEC0QAAkBBAEHEoQEQ4wZBAXENAEHEoQEQrQZFDQBBvKEBEOQEEPAEQQBBwKEBQbyhARD1BkHEoQEQsgYLQQBBwKEBEOcGCxgAIABBABDxBEEAEOcGIgAQ9QYgABDmBAslACAAQQQCf0EAQcihAUEAQcihARDnBkEBaiIAEPUGIAALEPUGCz4BAn8jAEEQayICJAAgABCtA0F/RwRAIAICfyACQQhqIgMgARCvAxogAwsQrwMaIAAgAhCVBgsgAkEQaiQACxMAIAAgAEEAEOcGQQQQ5wYRAgALDwAgAEEAEOcGEK0DEIEGCyYAQQAhACACQf8ATQR/EPgEIAJBAXRqQQAQ5QYgAXFBAEcFQQALCwoAQdwsQQAQ5wYLTgADQCABIAJHBEBBACEAIANBACABQQAQ5wZB/wBNBH8Q+AQgAUEAEOcGQQF0akEAEOUGBUEACxDyBiADQQJqIQMgAUEEaiEBDAELCyACC0YAA0ACQCACIANHBH8gAkEAEOcGQf8ASw0BEPgEIAJBABDnBkEBdGpBABDlBiABcUUNASACBSADCw8LIAJBBGohAgwACwALRwACQANAIAIgA0YNAQJAIAJBABDnBkH/AEsNABD4BCACQQAQ5wZBAXRqQQAQ5QYgAXFFDQAgAkEEaiECDAELCyACIQMLIAMLHAAgAUH/AE0EfxD9BCABQQJ0akEAEOcGBSABCwsKAEHgMkEAEOcGC0UAA0AgASACRwRAIAFBACABQQAQ5wYiAEH/AE0EfxD9BCABQQAQ5wZBAnRqQQAQ5wYFIAALEPUGIAFBBGohAQwBCwsgAgscACABQf8ATQR/EIAFIAFBAnRqQQAQ5wYFIAELCwoAQfA+QQAQ5wYLRQADQCABIAJHBEAgAUEAIAFBABDnBiIAQf8ATQR/EIAFIAFBABDnBkECdGpBABDnBgUgAAsQ9QYgAUEEaiEBDAELCyACCwQAIAELLQADQCABIAJHBEAgA0EAIAFBABDiBhD1BiADQQRqIQMgAUEBaiEBDAELCyACCxMAIAEgAiABQYABSRtBGHRBGHULOAADQCABIAJHBEAgBEEAIAFBABDnBiIAIAMgAEGAAUkbEPAGIARBAWohBCABQQRqIQEMAQsLIAILLwEBfyAAQQBBxM0AEPUGAkAgAEEIEOcGIgFFDQAgAEEMEOMGRQ0AIAEQyQYLIAALCgAgABCGBRDJBgslACABQQBOBH8Q/QQgAUH/AXFBAnRqQQAQ5wYFIAELQRh0QRh1C0QAA0AgASACRwRAIAFBACABQQAQ4gYiAEEATgR/EP0EIAFBABDiBkECdGpBABDnBgUgAAsQ8AYgAUEBaiEBDAELCyACCyUAIAFBAE4EfxCABSABQf8BcUECdGpBABDnBgUgAQtBGHRBGHULRAADQCABIAJHBEAgAUEAIAFBABDiBiIAQQBOBH8QgAUgAUEAEOIGQQJ0akEAEOcGBSAACxDwBiABQQFqIQEMAQsLIAILLQADQCABIAJHBEAgA0EAIAFBABDjBhDwBiADQQFqIQMgAUEBaiEBDAELCyACCwwAIAEgAiABQX9KGws3AANAIAEgAkcEQCAEQQAgAUEAEOIGIgAgAyAAQX9KGxDwBiAEQQFqIQQgAUEBaiEBDAELCyACCxYAIARBACACEPUGIAdBACAFEPUGQQMLDQAgBEEAIAIQ9QZBAwsEAEEBCz0AIwBBEGsiACQAIABBDCAEEPUGIABBCCADIAJrEPUGIABBDGogAEEIahCTBUEAEOcGIQEgAEEQaiQAIAELCQAgACABEJQFCyQBAn8jAEEQayICJAAgASAAEIYCIQMgAkEQaiQAIAEgACADGwsKACAAENgEEMkGC4kEAQR/IwBBEGsiCiQAIAIhCANAAkAgAyAIRgRAIAMhCAwBCyAIQQAQ5wZFDQAgCEEEaiEIDAELCyAHQQAgBRD1BiAEQQAgAhD1BgNAAkACQCAFIAZGIAIgA0ZyBH8gAgUgCkEIIAFBABDtBhD6BkEBIQkCQAJAAkACQAJAIAUgBCAIIAJrQQJ1IAYgBWsgAEEIEOcGEJcFIgtBAWoOAgAGAQsgB0EAIAUQ9QYDQAJAIARBABDnBiACRg0AIAUgAkEAEOcGIABBCBDnBhCYBSIBQX9GDQAgB0EAIAdBABDnBiABaiIFEPUGIAJBBGohAgwBCwsgBEEAIAIQ9QYMAQsgB0EAIAdBABDnBiALaiIFEPUGIAUgBkYNAiADIAhGBEAgBEEAEOcGIQIgAyEIDAcLIApBBGpBACAAQQgQ5wYQmAUiCEF/Rw0BC0ECIQkMAwsgCkEEaiECIAYgB0EAEOcGayAISQRADAMLA0AgCARAIAJBABDjBiEFIAdBACAHQQAQ5wYiCUEBahD1BiAJQQAgBRDwBiAIQQFrIQggAkEBaiECDAELCyAEQQAgBEEAEOcGQQRqIgIQ9QYgAiEIA0AgAyAIRgRAIAMhCAwFCyAIQQAQ5wZFDQQgCEEEaiEIDAALAAsgBEEAEOcGCyADRyEJCyAKQRBqJAAgCQ8LIAdBABDnBiEFDAALAAtAAQF/IwBBEGsiBSQAIAVBDCAEEPUGIAVBCGogBUEMahCEAyEEIAAgASACIAMQtgIhACAEEIUDIAVBEGokACAACzwBAX8jAEEQayIDJAAgA0EMIAIQ9QYgA0EIaiADQQxqEIQDIQIgACABEJ0BIQAgAhCFAyADQRBqJAAgAAvpAwEDfyMAQRBrIgkkACACIQgDQAJAIAMgCEYEQCADIQgMAQsgCEEAEOMGRQ0AIAhBAWohCAwBCwsgB0EAIAUQ9QYgBEEAIAIQ9QYDQAJAAn8CQCAFIAZGIAIgA0ZyDQAgCUEIIAFBABDtBhD6BgJAAkACQAJAIAUgBCAIIAJrIAYgBWtBAnUgASAAQQgQ5wYQmgUiCkF/RgRAA0ACQCAHQQAgBRD1BiAEQQAQ5wYgAkYNAEEBIQYCQAJAAkAgBSACIAggAmsgCUEIaiAAQQgQ5wYQmwUiAUECag4DCAACAQsgBEEAIAIQ9QYMBQsgASEGCyACIAZqIQIgB0EAEOcGQQRqIQUMAQsLIARBACACEPUGDAULIAdBACAHQQAQ5wYgCkECdGoiBRD1BiAFIAZGDQMgBEEAEOcGIQIgAyAIRgRAIAMhCAwICyAFIAJBASABIABBCBDnBhCbBUUNAQtBAgwECyAHQQAgB0EAEOcGQQRqEPUGIARBACAEQQAQ5wZBAWoiAhD1BiACIQgDQCADIAhGBEAgAyEIDAYLIAhBABDjBkUNBSAIQQFqIQgMAAsACyAEQQAgAhD1BkEBDAILIARBABDnBiECCyACIANHCyEIIAlBEGokACAIDwsgB0EAEOcGIQUMAAsAC0IBAX8jAEEQayIGJAAgBkEMIAUQ9QYgBkEIaiAGQQxqEIQDIQUgACABIAIgAyAEELgCIQAgBRCFAyAGQRBqJAAgAAtAAQF/IwBBEGsiBSQAIAVBDCAEEPUGIAVBCGogBUEMahCEAyEEIAAgASACIAMQoQIhACAEEIUDIAVBEGokACAAC6UBAQF/IwBBEGsiBSQAIARBACACEPUGQQIhAgJAIAVBDGpBACAAQQgQ5wYQmAUiAEEBakECSQ0AQQEhAiAAQQFrIgEgAyAEQQAQ5wZrSw0AIAVBDGohAgNAIAFFBEBBACECDAILIAJBABDjBiEAIARBACAEQQAQ5wYiA0EBahD1BiADQQAgABDwBiABQQFrIQEgAkEBaiECDAALAAsgBUEQaiQAIAILMQEBf0F/IQECQCAAQQgQ5wYQngUEf0F/BSAAQQgQ5wYiAA0BQQELDwsgABCfBUEBRgtDAQJ/IwBBEGsiASQAIAFBDCAAEPUGIAFBCGogAUEMahCEAyEAIwBBEGsiAiQAIAJBEGokACAAEIUDIAFBEGokAEEAC0kBAn8jAEEQayIBJAAgAUEMIAAQ9QYgAUEIaiABQQxqEIQDIQBBBEEBQfCEAUGsARDnBkEAEOcGGyECIAAQhQMgAUEQaiQAIAILXAEEfwNAAkAgAiADRiAEIAZNcg0AQQEhBwJAAkAgAiADIAJrIAEgAEEIEOcGEKEFIghBAmoOAwICAQALIAghBwsgBkEBaiEGIAUgB2ohBSACIAdqIQIMAQsLIAULRwEBfyMAQRBrIgQkACAEQQwgAxD1BiAEQQhqIARBDGoQhAMhA0EAIAAgASACQYSgASACGxChAiEAIAMQhQMgBEEQaiQAIAALFwAgAEEIEOcGIgBFBEBBAQ8LIAAQnwULWQAjAEEQayIAJAAgAEEMIAIQ9QYgAEEIIAUQ9QYgAiADIABBDGogBSAGIABBCGoQpAUhASAEQQAgAEEMEOcGEPUGIAdBACAAQQgQ5wYQ9QYgAEEQaiQAIAELnwYBAn8gAkEAIAAQ9QYgBUEAIAMQ9QYgAkEAEOcGIQYCQAJAA0AgASAGTQRAQQAhAAwDC0ECIQAgBkEAEOUGIgNB///DAEsNAgJAAkAgA0H/AE0EQEEBIQAgBCAFQQAQ5wYiBmtBAUgNBSAFQQAgBkEBahD1BiAGQQAgAxDwBgwBCyADQf8PTQRAIAQgBUEAEOcGIgBrQQJIDQQgBUEAIABBAWoQ9QYgAEEAIANBBnZBwAFyEPAGIAVBACAFQQAQ5wYiAEEBahD1BiAAQQAgA0E/cUGAAXIQ8AYMAQsgA0H/rwNNBEAgBCAFQQAQ5wYiAGtBA0gNBCAFQQAgAEEBahD1BiAAQQAgA0EMdkHgAXIQ8AYgBUEAIAVBABDnBiIAQQFqEPUGIABBACADQQZ2QT9xQYABchDwBiAFQQAgBUEAEOcGIgBBAWoQ9QYgAEEAIANBP3FBgAFyEPAGDAELIANB/7cDTQRAQQEhACABIAZrQQRIDQUgBkECEOUGIgdBgPgDcUGAuANHDQIgBCAFQQAQ5wZrQQRIDQUgB0H/B3EgA0EKdEGA+ANxIANBwAdxIgBBCnRyckGAgARqQf//wwBLDQIgAkEAIAZBAmoQ9QYgBUEAIAVBABDnBiIGQQFqEPUGIAZBACAAQQZ2QQFqIgBBAnZB8AFyEPAGIAVBACAFQQAQ5wYiBkEBahD1BiAGQQAgAEEEdEEwcSADQQJ2QQ9xckGAAXIQ8AYgBUEAIAVBABDnBiIAQQFqEPUGIABBACAHQQZ2QQ9xIANBBHRBMHFyQYABchDwBiAFQQAgBUEAEOcGIgBBAWoQ9QYgAEEAIAdBP3FBgAFyEPAGDAELIANBgMADSQ0EIAQgBUEAEOcGIgBrQQNIDQMgBUEAIABBAWoQ9QYgAEEAIANBDHZB4AFyEPAGIAVBACAFQQAQ5wYiAEEBahD1BiAAQQAgA0EGdkE/cUGAAXIQ8AYgBUEAIAVBABDnBiIAQQFqEPUGIABBACADQT9xQYABchDwBgsgAkEAIAJBABDnBkECaiIGEPUGDAELC0ECDwtBAQ8LIAALWQAjAEEQayIAJAAgAEEMIAIQ9QYgAEEIIAUQ9QYgAiADIABBDGogBSAGIABBCGoQpgUhASAEQQAgAEEMEOcGEPUGIAdBACAAQQgQ5wYQ9QYgAEEQaiQAIAELuwUBBX8gAkEAIAAQ9QYgBUEAIAMQ9QYCQAJAAkADQCACQQAQ5wYiACABTyADIARPckUEQEECIQkgAEEAEOMGIgZB///DAEsNBCACQQACfyAGQRh0QRh1QQBOBEAgA0EAIAYQ8gYgAEEBagwBCyAGQcIBSQ0FIAZB3wFNBEAgASAAa0ECSA0FIABBARDjBiIHQcABcUGAAUcNBCAHQT9xIAZBBnRBwA9xciIGQf//wwBLDQQgA0EAIAYQ8gYgAEECagwBCyAGQe8BTQRAIAEgAGtBA0gNBSAAQQIQ4wYhCCAAQQEQ4wYhBwJAAkAgBkHtAUcEQCAGQeABRw0BIAdB4AFxQaABRg0CDAcLIAdB4AFxQYABRg0BDAYLIAdBwAFxQYABRw0FCyAIQcABcUGAAUcNBCAIQT9xIAdBP3FBBnQgBkEMdHJyIgZB//8DcUH//8MASw0EIANBACAGEPIGIABBA2oMAQsgBkH0AUsNBUEBIQkgASAAa0EESA0DIABBAxDjBiEIIABBAhDjBiEHIABBARDjBiEAAkACQAJAAkAgBkHwAWsOBQACAgIBAgsgAEHwAGpB/wFxQTBPDQgMAgsgAEHwAXFBgAFHDQcMAQsgAEHAAXFBgAFHDQYLIAdBwAFxQYABRyAIQcABcUGAAUdyDQUgBCADa0EESA0DQQIhCSAIQT9xIgggB0EGdCIKQcAfcSAAQQx0QYDgD3EgBkEHcSIGQRJ0cnJyQf//wwBLDQMgA0EAIAdBBHZBA3EgAEECdCIAQcABcSAGQQh0ciAAQTxxcnJBwP8AakGAsANyEPIGIAVBACADQQJqEPUGIANBAiAKQcAHcSAIckGAuANyEPIGIAJBABDnBkEEagsQ9QYgBUEAIAVBABDnBkECaiIDEPUGDAELCyAAIAFJIQkLIAkPC0EBDwtBAgsLACACIAMgBBCoBQv8AwEGfyAAIQMDQAJAIAIgBk0gASADTXINACADQQAQ4wYiBEH//8MASw0AAn8gA0EBaiAEQRh0QRh1QQBODQAaIARBwgFJDQEgBEHfAU0EQCABIANrQQJIDQIgA0EBEOMGIgVBwAFxQYABRyAFQT9xIARBBnRBwA9xckH//8MAS3INAiADQQJqDAELAkACQCAEQe8BTQRAIAEgA2tBA0gNBCADQQIQ4wYhByADQQEQ4wYhBSAEQe0BRg0BIARB4AFGBEAgBUHgAXFBoAFGDQMMBQsgBUHAAXFBgAFHDQQMAgsgAiAGa0ECSSAEQfQBS3IgASADa0EESHINAyADQQMQ4wYhByADQQIQ4wYhCCADQQEQ4wYhBQJAAkACQAJAIARB8AFrDgUAAgICAQILIAVB8ABqQf8BcUEwSQ0CDAYLIAVB8AFxQYABRg0BDAULIAVBwAFxQYABRw0ECyAIQcABcUGAAUcgB0HAAXFBgAFHciAHQT9xIAhBBnRBwB9xIARBEnRBgIDwAHEgBUE/cUEMdHJyckH//8MAS3INAyAGQQFqIQYgA0EEagwCCyAFQeABcUGAAUcNAgsgB0HAAXFBgAFHIAdBP3EgBEEMdEGA4ANxIAVBP3FBBnRyckH//8MAS3INASADQQNqCyEDIAZBAWohBgwBCwsgAyAAawsEAEEEC1kAIwBBEGsiACQAIABBDCACEPUGIABBCCAFEPUGIAIgAyAAQQxqIAUgBiAAQQhqEKsFIQEgBEEAIABBDBDnBhD1BiAHQQAgAEEIEOcGEPUGIABBEGokACABC5wEAQF/IAJBACAAEPUGIAVBACADEPUGIAJBABDnBiEDAkADQCABIANNBEBBACEGDAILQQIhBiADQQAQ5wYiAEH//8MASyAAQYBwcUGAsANGcg0BAkACQCAAQf8ATQRAQQEhBiAEIAVBABDnBiIDa0EBSA0EIAVBACADQQFqEPUGIANBACAAEPAGDAELIABB/w9NBEAgBCAFQQAQ5wYiA2tBAkgNAiAFQQAgA0EBahD1BiADQQAgAEEGdkHAAXIQ8AYgBUEAIAVBABDnBiIDQQFqEPUGIANBACAAQT9xQYABchDwBgwBCyAEIAVBABDnBiIDayEGIABB//8DTQRAIAZBA0gNAiAFQQAgA0EBahD1BiADQQAgAEEMdkHgAXIQ8AYgBUEAIAVBABDnBiIDQQFqEPUGIANBACAAQQZ2QT9xQYABchDwBiAFQQAgBUEAEOcGIgNBAWoQ9QYgA0EAIABBP3FBgAFyEPAGDAELIAZBBEgNASAFQQAgA0EBahD1BiADQQAgAEESdkHwAXIQ8AYgBUEAIAVBABDnBiIDQQFqEPUGIANBACAAQQx2QT9xQYABchDwBiAFQQAgBUEAEOcGIgNBAWoQ9QYgA0EAIABBBnZBP3FBgAFyEPAGIAVBACAFQQAQ5wYiA0EBahD1BiADQQAgAEE/cUGAAXIQ8AYLIAJBACACQQAQ5wZBBGoiAxD1BgwBCwtBAQ8LIAYLWQAjAEEQayIAJAAgAEEMIAIQ9QYgAEEIIAUQ9QYgAiADIABBDGogBSAGIABBCGoQrQUhASAEQQAgAEEMEOcGEPUGIAdBACAAQQgQ5wYQ9QYgAEEQaiQAIAELvgQBBn8gAkEAIAAQ9QYgBUEAIAMQ9QYCQAJAA0AgAkEAEOcGIgYgAU8gAyAET3JFBEAgBkEAEOIGIghB/wFxIQACQCAIQQBOBEAgAEH//8MATQRAQQEhCAwCC0ECDwtBAiEKIABBwgFJDQMgAEHfAU0EQCABIAZrQQJIDQUgBkEBEOMGIgdBwAFxQYABRw0EQQIhCCAHQT9xIABBBnRBwA9xciIAQf//wwBNDQEMBAsgAEHvAU0EQCABIAZrQQNIDQUgBkECEOMGIQkgBkEBEOMGIQcCQAJAIABB7QFHBEAgAEHgAUcNASAHQeABcUGgAUYNAgwHCyAHQeABcUGAAUYNAQwGCyAHQcABcUGAAUcNBQsgCUHAAXFBgAFHDQRBAyEIIAlBP3EgAEEMdEGA4ANxIAdBP3FBBnRyciIAQf//wwBNDQEMBAsgAEH0AUsNAyABIAZrQQRIDQQgBkEDEOMGIQkgBkECEOMGIQsgBkEBEOMGIQcCQAJAAkACQCAAQfABaw4FAAICAgECCyAHQfAAakH/AXFBMEkNAgwGCyAHQfABcUGAAUYNAQwFCyAHQcABcUGAAUcNBAsgC0HAAXFBgAFHIAlBwAFxQYABR3INA0EEIQggCUE/cSALQQZ0QcAfcSAAQRJ0QYCA8ABxIAdBP3FBDHRycnIiAEH//8MASw0DCyADQQAgABD1BiACQQAgBiAIahD1BiAFQQAgBUEAEOcGQQRqIgMQ9QYMAQsLIAEgBkshCgsgCg8LQQELCwAgAiADIAQQrwUL9AMBB38gACEDA0ACQCACIAhNIAEgA01yDQAgA0EAEOIGIgZB/wFxIQQCQCAGQQBOBEBBASEGIARB///DAE0NAQwCCyAEQcIBSQ0BIARB3wFNBEAgASADa0ECSA0CIANBARDjBiIFQcABcUGAAUcNAkECIQYgBUE/cSAEQQZ0QcAPcXJB///DAE0NAQwCCwJAAkAgBEHvAU0EQCABIANrQQNIDQQgA0ECEOMGIQcgA0EBEOMGIQUgBEHtAUYNASAEQeABRgRAIAVB4AFxQaABRg0DDAULIAVBwAFxQYABRw0EDAILIAEgA2tBBEggBEH0AUtyDQMgA0EDEOMGIQcgA0ECEOMGIQkgA0EBEOMGIQUCQAJAAkACQCAEQfABaw4FAAICAgECCyAFQfAAakH/AXFBMEkNAgwGCyAFQfABcUGAAUYNAQwFCyAFQcABcUGAAUcNBAsgCUHAAXFBgAFHIAdBwAFxQYABR3INA0EEIQYgB0E/cSAJQQZ0QcAfcSAEQRJ0QYCA8ABxIAVBP3FBDHRycnJB///DAEsNAwwCCyAFQeABcUGAAUcNAgsgB0HAAXFBgAFHDQFBAyEGIAdBP3EgBEEMdEGA4ANxIAVBP3FBBnRyckH//8MASw0BCyAIQQFqIQggAyAGaiEDDAELCyADIABrCxgAIABBAEGozgAQ9QYgAEEMahCaBhogAAsKACAAELAFEMkGCxgAIABBAEHQzgAQ9QYgAEEQahCaBhogAAsKACAAELIFEMkGCwkAIABBCBDiBgsJACAAQQkQ4gYLCQAgAEEMEOcGCwwAIAAgAUEMahCYBgsMACAAIAFBEGoQmAYLCwAgAEHwzgAQ/wELCwAgAEH4zgAQuwULLAEBfyMAQRBrIgIkACAAIAJBCGogAhDMAiAAIAEgARC0AhClBiACQRBqJAALCwAgAEGMzwAQ/wELCwAgAEGUzwAQuwULDQAgACABIAEQIRCbBgs9AAJAQQBBkKIBEOMGQQFxDQBBkKIBEK0GRQ0AEMAFQQBBjKIBQcCjARD1BkGQogEQsgYLQQBBjKIBEOcGC9oBAQF/AkBBAEHopAEQ4wZBAXENAEHopAEQrQZFDQBBwKMBIQADQCAAEOACQQxqIgBB6KQBRw0AC0HopAEQsgYLQcCjAUH48QAQvgVBzKMBQf/xABC+BUHYowFBhvIAEL4FQeSjAUGO8gAQvgVB8KMBQZjyABC+BUH8owFBofIAEL4FQYikAUGo8gAQvgVBlKQBQbHyABC+BUGgpAFBtfIAEL4FQaykAUG58gAQvgVBuKQBQb3yABC+BUHEpAFBwfIAEL4FQdCkAUHF8gAQvgVB3KQBQcnyABC+BQscAEHopAEhAANAIABBDGsQmgYiAEHAowFHDQALCz0AAkBBAEGYogEQ4wZBAXENAEGYogEQrQZFDQAQwwVBAEGUogFB8KQBEPUGQZiiARCyBgtBAEGUogEQ5wYL2gEBAX8CQEEAQZimARDjBkEBcQ0AQZimARCtBkUNAEHwpAEhAANAIAAQlgRBDGoiAEGYpgFHDQALQZimARCyBgtB8KQBQdDyABDFBUH8pAFB7PIAEMUFQYilAUGI8wAQxQVBlKUBQajzABDFBUGgpQFB0PMAEMUFQaylAUH08wAQxQVBuKUBQZD0ABDFBUHEpQFBtPQAEMUFQdClAUHE9AAQxQVB3KUBQdT0ABDFBUHopQFB5PQAEMUFQfSlAUH09AAQxQVBgKYBQYT1ABDFBUGMpgFBlPUAEMUFCxwAQZimASEAA0AgAEEMaxCmBiIAQfCkAUcNAAsLDgAgACABIAEQtAIQpwYLPQACQEEAQaCiARDjBkEBcQ0AQaCiARCtBkUNABDHBUEAQZyiAUGgpgEQ9QZBoKIBELIGC0EAQZyiARDnBgvIAgEBfwJAQQBBwKgBEOMGQQFxDQBBwKgBEK0GRQ0AQaCmASEAA0AgABDgAkEMaiIAQcCoAUcNAAtBwKgBELIGC0GgpgFBpPUAEL4FQaymAUGs9QAQvgVBuKYBQbX1ABC+BUHEpgFBu/UAEL4FQdCmAUHB9QAQvgVB3KYBQcX1ABC+BUHopgFByvUAEL4FQfSmAUHP9QAQvgVBgKcBQdb1ABC+BUGMpwFB4PUAEL4FQZinAUHo9QAQvgVBpKcBQfH1ABC+BUGwpwFB+vUAEL4FQbynAUH+9QAQvgVByKcBQYL2ABC+BUHUpwFBhvYAEL4FQeCnAUHB9QAQvgVB7KcBQYr2ABC+BUH4pwFBjvYAEL4FQYSoAUGS9gAQvgVBkKgBQZb2ABC+BUGcqAFBmvYAEL4FQaioAUGe9gAQvgVBtKgBQaL2ABC+BQscAEHAqAEhAANAIABBDGsQmgYiAEGgpgFHDQALCz0AAkBBAEGoogEQ4wZBAXENAEGoogEQrQZFDQAQygVBAEGkogFB0KgBEPUGQaiiARCyBgtBAEGkogEQ5wYLyAIBAX8CQEEAQfCqARDjBkEBcQ0AQfCqARCtBkUNAEHQqAEhAANAIAAQlgRBDGoiAEHwqgFHDQALQfCqARCyBgtB0KgBQaj2ABDFBUHcqAFByPYAEMUFQeioAUHs9gAQxQVB9KgBQYT3ABDFBUGAqQFBnPcAEMUFQYypAUGs9wAQxQVBmKkBQcD3ABDFBUGkqQFB1PcAEMUFQbCpAUHw9wAQxQVBvKkBQZj4ABDFBUHIqQFBuPgAEMUFQdSpAUHc+AAQxQVB4KkBQYD5ABDFBUHsqQFBkPkAEMUFQfipAUGg+QAQxQVBhKoBQbD5ABDFBUGQqgFBnPcAEMUFQZyqAUHA+QAQxQVBqKoBQdD5ABDFBUG0qgFB4PkAEMUFQcCqAUHw+QAQxQVBzKoBQYD6ABDFBUHYqgFBkPoAEMUFQeSqAUGg+gAQxQULHABB8KoBIQADQCAAQQxrEKYGIgBB0KgBRw0ACws9AAJAQQBBsKIBEOMGQQFxDQBBsKIBEK0GRQ0AEM0FQQBBrKIBQYCrARD1BkGwogEQsgYLQQBBrKIBEOcGC1YBAX8CQEEAQZirARDjBkEBcQ0AQZirARCtBkUNAEGAqwEhAANAIAAQ4AJBDGoiAEGYqwFHDQALQZirARCyBgtBgKsBQbD6ABC+BUGMqwFBs/oAEL4FCxwAQZirASEAA0AgAEEMaxCaBiIAQYCrAUcNAAsLPQACQEEAQbiiARDjBkEBcQ0AQbiiARCtBkUNABDQBUEAQbSiAUGgqwEQ9QZBuKIBELIGC0EAQbSiARDnBgtWAQF/AkBBAEG4qwEQ4wZBAXENAEG4qwEQrQZFDQBBoKsBIQADQCAAEJYEQQxqIgBBuKsBRw0AC0G4qwEQsgYLQaCrAUG4+gAQxQVBrKsBQcT6ABDFBQscAEG4qwEhAANAIABBDGsQpgYiAEGgqwFHDQALCzMAAkBBAEHIogEQ4wZBAXENAEHIogEQrQZFDQBBvKIBQazPABD/AUHIogEQsgYLQbyiAQsKAEG8ogEQmgYaCzMAAkBBAEHYogEQ4wZBAXENAEHYogEQrQZFDQBBzKIBQbjPABC7BUHYogEQsgYLQcyiAQsKAEHMogEQpgYaCzMAAkBBAEHoogEQ4wZBAXENAEHoogEQrQZFDQBB3KIBQdzPABD/AUHoogEQsgYLQdyiAQsKAEHcogEQmgYaCzMAAkBBAEH4ogEQ4wZBAXENAEH4ogEQrQZFDQBB7KIBQejPABC7BUH4ogEQsgYLQeyiAQsKAEHsogEQpgYaCzMAAkBBAEGIowEQ4wZBAXENAEGIowEQrQZFDQBB/KIBQYzQABD/AUGIowEQsgYLQfyiAQsKAEH8ogEQmgYaCzMAAkBBAEGYowEQ4wZBAXENAEGYowEQrQZFDQBBjKMBQaTQABC7BUGYowEQsgYLQYyjAQsKAEGMowEQpgYaCzMAAkBBAEGoowEQ4wZBAXENAEGoowEQrQZFDQBBnKMBQfjQABD/AUGoowEQsgYLQZyjAQsKAEGcowEQmgYaCzMAAkBBAEG4owEQ4wZBAXENAEG4owEQrQZFDQBBrKMBQYTRABC7BUG4owEQsgYLQayjAQsKAEGsowEQpgYaCwkAIAAgARCOBAsbAQF/QQEhASAAEPEDBH8gABDnBUEBawVBAQsLGQAgABDxAwRAIAAgARC3BA8LIAAgARC4BAsKACAAEOYFEMkGCyMBAX8gAEEIaiIBQQAQ5wYQgANHBEAgAUEAEOcGELMCCyAACxAAIABBCBDnBkH/////B3ELTwECfyMAQRBrIgAkACAAQQwCf0GQrgEQ6QUaQf////8DCxD1BiAAQQhB/////wcQ9QYgAEEMaiAAQQhqEJMFQQAQ5wYhASAAQRBqJAAgAQsHACAAQSBqCwkAIAAgARDvBQsHACAAQRBqCzgAQZCuARCtAxpBkK4BEK0DQZCuARDwBUECdGoaQZCuARCtA0GQrgEQ8AVBAnRqGkGQrgEQrQMaCzIBAX8gAEEAQZCuARD1BiAAQQRBkK4BQQQQ5wYiAhD1BiAAQQggAiABQQJ0ahD1BiAACwsAIABBAEEAEPUGCy8AAkAgAUEcSw0AIABB8AAQ4wZB/wFxDQAgAEHwAEEBEPAGIAAPCyABQQJ0EI8GCxcAIAAQ6wVBABDnBiAAQQAQ5wZrQQJ1CwsAIABBAEEAEPUGCyQAIABBC08EfyAAQRBqQXBxIgAgAEEBayIAIABBC0YbBUEKCwsNACAAEDtBACABEPUGCxQAIAAQO0EIIAFBgICAgHhyEPUGCx4AAkAgACABRgRAIABB8ABBABDwBgwBCyABEMkGCwswAQF/IABBBBDnBiECA0AgASACRwRAIAAQ6QUaIAJBBGshAgwBCwsgAEEEIAEQ9QYLDAAgAEEAEIADEPUGC2EBAn8jAEEQayIBJAAgAUEMIAAQ9QYgABDoBSICTQRAQZCuARDwBSIAIAJBAXZJBEAgAUEIIABBAXQQ9QYgAUEIaiABQQxqEIACQQAQ5wYhAgsgAUEQaiQAIAIPCxC6AgALggEBA38jAEEQayIEJAAgBEEMQQAQ9QYgAEEMaiIGIARBDGoQ7gUgBkEEaiADEK8DGiAAQQACfyABBEAgABD8BSABEOoFIQULIAULEPUGIABBCCAFIAJBAnRqIgIQ9QYgAEEEIAIQ9QYgABD9BUEAIAUgAUECdGoQ9QYgBEEQaiQAIAALcQECfyMAQRBrIgIkACACIABBCGogARD+BSIBQQAQ5wYhAwNAIAFBBBDnBiADRwRAIAAQ/AUaIAFBABDnBhDxBSABQQAgAUEAEOcGQQRqIgMQ9QYMAQsLIAFBCBDnBkEAIAFBABDnBhD1BiACQRBqJAALagEBf0GQrgEQ7ARBkK4BEOkFQZCuAUEAEOcGQZCuAUEEEOcGIABBBGoiARD/BUGQrgEgARCFAkGUrgEgAEEIahCFAkGQrgEQ6wUgABD9BRCFAiAAQQAgAEEEEOcGEPUGQZCuARDeBBDsBQsKACAAQRBqEK0DCwcAIABBDGoLNQEBfyAAQQAgAUEAEOcGEPUGIAFBABDnBiEDIABBCCABEPUGIABBBCADIAJBAnRqEPUGIAALLAAgA0EAIANBABDnBiACIAFrIgBrIgIQ9QYgAEEBTgRAIAIgASAAENIGGgsLKwADQCAAQQgQ5wYgAUcEQCAAEPwFGiAAQQggAEEIEOcGQQRrEPUGDAELCwtFAQJ/IABBABDnBiAAQQhqQQAQ5wYiAkEBdWohASAAQQQQ5wYhACABIAJBAXEEfyABQQAQ5wYgAGpBABDnBgUgAAsRAgALCQAgACABEIsECyQAIABBAk8EfyAAQQRqQXxxIgAgAEEBayIAIABBAkYbBUEBCwsLACAAQQAgARD1BgsSACAAQQggAUGAgICAeHIQ9QYLGgAgAEH/////A0sEQBCDAgALIABBAnQQjwYLPAEBfyMAQRBrIgMkACADIAEgAhCAAxDCAiAAQQAgA0EAEO4GEPoGIABBCCADQQgQ7gYQ+gYgA0EQaiQAC0sBAX8jAEEQayIDJAAgA0EIIAIQ9QYDQCAAIAFHBEAgA0EIaiAAQQAQ4gYQ+wEgAEEBaiEADAELCyADQQgQ5wYhACADQRBqJAAgAAtLAQF/IwBBEGsiAyQAIANBCCACEPUGA0AgACABRwRAIANBCGogAEEAEOcGEP0BIABBBGohAAwBCwsgA0EIEOcGIQAgA0EQaiQAIAALDQAgACACSSAAIAFPcQssAQF/IwBBEGsiBCQAIAAgBEEIaiADEI0GGiAAIAEgAhDHAiAEQRBqJAAgAAsYACAAEDgEQCAAIAEQpAQPCyAAIAEQpQQLDQAgARAcGiAAEDYgAAslACMAQRBrIgMkACADQQhqEBwaIAAgASACEM0CIANBEGokACAACzQBAX8gAEEBIAAbIQACQANAIAAQyAYiAQ0BQYywARCtAyIBBEAgAREGAAwBCwsQDAALIAELDwBBgLTBAiQCQYC0ASQBCwcAIwAjAWsLBAAjAgsEACMBCwMAAAs2AANAIABBABDnBkEBRg0ACyAAQQAQ5wZFBEAgAEEAQQEQ9QYgAUHcABECACAAQQBBfxD1BgsLKwEBfyACBEAgACEDA0AgA0EAIAEQ9QYgA0EEaiEDIAJBAWsiAg0ACwsgAAtwAQF/AkAgAiAAIAFrQQJ1SwRAA0AgACACQQFrIgJBAnQiA2pBACABIANqQQAQ5wYQ9QYgAg0ADAILAAsgAkUNACAAIQMDQCADQQAgAUEAEOcGEPUGIANBBGohAyABQQRqIQEgAkEBayICDQALCyAAC2oBAn8jAEEQayICJAAgACACQQhqIAIQjQYhAwJAIAEQOEUEQCABEDshACADEDsiAUEIakEAIABBCGpBABDnBhD1BiABQQAgAEEAEO0GEPkGDAELIAAgARC4ASABELUBEJkGCyACQRBqJAALfgEDfyMAQRBrIgMkACACQW9NBEACQCACQQpNBEAgACACEKUEIAAQOiEEDAELIAAgAhDyBUEBaiIFEI8GIgQQ8wUgACAFEPQFIAAgAhCkBAsgBBAcIAEgAhDHASADQQ9BABDwBiACIARqIANBD2oQowQgA0EQaiQADwsQugIACx4BAX8gABA4BEAgABA5IQEgABCCAxogARDJBgsgAAt2AQN/IwBBEGsiBCQAAkAgAiAAEOECIgNNBEAgABA1EBwiAyEFIAIEQCAFIAEgAhDUBgsgBEEPQQAQ8AYgAiADaiAEQQ9qEKMEIAAgAhCMBgwBCyAAIAMgAiADayAAELMBIgBBACAAIAIgARCcBgsgBEEQaiQAC4ECAQN/IwBBEGsiCCQAIAIgAUF/c0ERa00EQCAAEDUhCQJ/IAFB5////wdJBEAgCEEIIAFBAXQQ9QYgCEEMIAEgAmoQ9QYgCEEMaiAIQQhqEIACQQAQ5wYQ8gUMAQtBbgtBAWoiChCPBiECIAQEQCACEBwgCRAcIAQQxwELIAYEQCACEBwgBGogByAGEMcBCyADIAVrIgMgBGsiBwRAIAIQHCAEaiAGaiAJEBwgBGogBWogBxDHAQsgAUEKRwRAIAkQyQYLIAAgAhDzBSAAIAoQ9AUgACADIAZqIgAQpAQgCEEHQQAQ8AYgACACaiAIQQdqEKMEIAhBEGokAA8LELoCAAsjAQF/IAEgABCzASICSwRAIAAgASACaxCeBg8LIAAgARCfBgt2AQR/IwBBEGsiBCQAIAEEQCAAEOECIQIgABCzASIDIAFqIQUgASACIANrSwRAIAAgAiAFIAJrIAMgAxCgBgsgABA1IgIQHCADaiABQQAQoQYgACAFEIwGIARBD0EAEPAGIAIgBWogBEEPahCjBAsgBEEQaiQAC2YBAn8jAEEQayICJAACQCAAEDgEQCAAEDkhAyACQQ9BABDwBiABIANqIAJBD2oQowQgACABEKQEDAELIAAQOiEDIAJBDkEAEPAGIAEgA2ogAkEOahCjBCAAIAEQpQQLIAJBEGokAAu+AQEDfyMAQRBrIgUkACACQW8gAWtNBEAgABA1IQYCfyABQef///8HSQRAIAVBCCABQQF0EPUGIAVBDCABIAJqEPUGIAVBDGogBUEIahCAAkEAEOcGEPIFDAELQW4LQQFqIgcQjwYhAiAEBEAgAhAcIAYQHCAEEMcBCyADIARrIgMEQCACEBwgBGogBhAcIARqIAMQxwELIAFBCkcEQCAGEMkGCyAAIAIQ8wUgACAHEPQFIAVBEGokAA8LELoCAAsUACABBEAgACACEIgBIAEQ0wYaCwuAAQEDfyMAQRBrIgUkAAJAIAIgABDhAiIEIAAQswEiA2tNBEAgAkUNASAAEDUQHCIEIANqIAEgAhDHASAAIAIgA2oiABCMBiAFQQ9BABDwBiAAIARqIAVBD2oQowQMAQsgACAEIAIgA2ogBGsgAyADQQAgAiABEJwGCyAFQRBqJAALwAEBA38jAEEQayIDJAAgA0EPIAEQ8AYCQAJAAkACQCAAEDgEQCAAEIIDIQEgABC1ASIEIAFBAWsiAkYNAQwDC0EKIQRBCiECIAAQtgEiAUEKRw0BCyAAIAJBASACIAIQoAYgBCEBIAAQOA0BCyAAEDohAiAAIAFBAWoQpQQMAQsgABA5IQIgACAEQQFqEKQEIAQhAQsgASACaiIAIANBD2oQowQgA0EOQQAQ8AYgAEEBaiADQQ5qEKMEIANBEGokAAt+AQN/IwBBEGsiAyQAIAFBb00EQAJAIAFBCk0EQCAAIAEQpQQgABA6IQQMAQsgACABEPIFQQFqIgUQjwYiBBDzBSAAIAUQ9AUgACABEKQECyAEEBwgASACEKEGIANBD0EAEPAGIAEgBGogA0EPahCjBCADQRBqJAAPCxC6AgALgQEBA38jAEEQayIDJAAgAkHv////A00EQAJAIAJBAU0EQCAAIAIQuAQgACEEDAELIAAgAhCDBkEBaiIFEIYGIgQQhAYgACAFEIUGIAAgAhC3BAsgBCABIAIQ0QEgA0EMQQAQ9QYgBCACQQJ0aiADQQxqEIoCIANBEGokAA8LELoCAAsgAQF/IAAQ8QMEQCAAEK0DIQEgABDnBRogARDJBgsgAAt8AQN/IwBBEGsiBCQAAkAgAiAAEOMFIgNNBEAgABDFAyIFIQMgAgR/IAMgASACEJcGBSADCxogBEEMQQAQ9QYgBSACQQJ0aiAEQQxqEIoCIAAgAhDkBQwBCyAAIAMgAiADayAAEIoDIgBBACAAIAIgARCoBgsgBEEQaiQAC5ECAQN/IwBBEGsiCCQAIAIgAUF/c0Hv////A2pNBEAgABDFAyEJAn8gAUHn////AUkEQCAIQQggAUEBdBD1BiAIQQwgASACahD1BiAIQQxqIAhBCGoQgAJBABDnBhCDBgwBC0Hu////AwtBAWoiChCGBiECIAQEQCACIAkgBBDRAQsgBgRAIARBAnQgAmogByAGENEBCyADIAVrIgMgBGsiBwRAIARBAnQiBCACaiAGQQJ0aiAEIAlqIAVBAnRqIAcQ0QELIAFBAUcEQCAJEMkGCyAAIAIQhAYgACAKEIUGIAAgAyAGaiIAELcEIAhBBEEAEPUGIAIgAEECdGogCEEEahCKAiAIQRBqJAAPCxC6AgALxAEBA38jAEEQayIFJAAgAkHv////AyABa00EQCAAEMUDIQYCfyABQef///8BSQRAIAVBCCABQQF0EPUGIAVBDCABIAJqEPUGIAVBDGogBUEIahCAAkEAEOcGEIMGDAELQe7///8DC0EBaiIHEIYGIQIgBARAIAIgBiAEENEBCyADIARrIgMEQCAEQQJ0IgQgAmogBCAGaiADENEBCyABQQFHBEAgBhDJBgsgACACEIQGIAAgBxCFBiAFQRBqJAAPCxC6AgALhQEBA38jAEEQayIFJAACQCACIAAQ4wUiBCAAEIoDIgNrTQRAIAJFDQEgABDFAyIEIANBAnRqIAEgAhDRASAAIAIgA2oiABDkBSAFQQxBABD1BiAEIABBAnRqIAVBDGoQigIMAQsgACAEIAIgA2ogBGsgAyADQQAgAiABEKgGCyAFQRBqJAALwgEBA38jAEEQayIDJAAgA0EMIAEQ9QYCQAJAAkACQCAAEPEDBEAgABDnBSEBIAAQ8gMiBCABQQFrIgJGDQEMAwtBASEEQQEhAiAAEPMDIgFBAUcNAQsgACACQQEgAiACEKkGIAQhASAAEPEDDQELIAAiAiABQQFqELgEDAELIAAQrQMhAiAAIARBAWoQtwQgBCEBCyACIAFBAnRqIgAgA0EMahCKAiADQQhBABD1BiAAQQRqIANBCGoQigIgA0EQaiQAC4oBAQN/IwBBEGsiBCQAIAFB7////wNNBEACQCABQQFNBEAgACABELgEIAAhAwwBCyAAIAEQgwZBAWoiBRCGBiIDEIQGIAAgBRCFBiAAIAEQtwQLIAEEfyADIAIgARCWBgUgAwsaIARBDEEAEPUGIAMgAUECdGogBEEMahCKAiAEQRBqJAAPCxC6AgALIgEBfyMAQRBrIgEkACABIAAQrgYQrwYhACABQRBqJAAgAAsLACAAIAEQsAYgAAs4AQJ/IwBBEGsiASQAIAFBCGogAEEEEOcGEK8DQQAQ5wYQ8QFFBEAgABCxBiECCyABQRBqJAAgAgspACAAQQxBABD1BiAAQQQgARD1BiAAQQAgARD1BiAAQQggAUEBahD1Bgs0AQF/AkAgAEEIEOcGIgBBABDjBiIBQQFHBH8gAUECcQ0BIABBAEECEPAGQQEFQQALDwsACx4BAX8jAEEQayIBJAAgASAAEK4GELMGIAFBEGokAAs9AQF/IwBBEGsiASQAIAFBCGogAEEEEOcGEK8DQQAQ5wZBAEEBEPAGIABBCBDnBkEAQQEQ8AYgAUEQaiQACwMAAAsLACAAIAFBABC2BgsvACACRQRAIABBBBDnBiABQQQQ5wZGDwsgACABRgRAQQEPCyAAEEAgARBAEKgCRQuyAQECfyMAQUBqIgMkAEEBIQQCQCAAIAFBABC2Bg0AQQAhBCABRQ0AIAEQuAYiAUUNACADQQhqQQRyQQBBNBDTBhogA0E4QQEQ9QYgA0EUQX8Q9QYgA0EQIAAQ9QYgA0EIIAEQ9QYgASADQQhqIAJBABDnBkEBIAFBABDnBkEcEOcGEQoAIANBIBDnBiIAQQFGBEAgAkEAIANBGBDnBhD1BgsgAEEBRiEECyADQUBrJAAgBAvXAgEEfyMAQUBqIgEkACAAQQAQ5wYiAkEEa0EAEOcGIQMgAkEIa0EAEOcGIQQgAUEUQQAQ9QYgAUEQQbD9ABD1BiABQQwgABD1BiABQQhB4P0AEPUGQQAhAiABQRhqQQBBJxDTBhogACAEaiEAAkAgA0Hg/QBBABC2BgRAIAFBOEEBEPUGIAMgAUEIaiAAIABBAUEAIANBABDnBkEUEOcGEQwAIABBACABQSAQ5wZBAUYbIQIMAQsgAyABQQhqIABBAUEAIANBABDnBkEYEOcGEQkAAkACQCABQSwQ5wYOAgABAgsgAUEcEOcGQQAgAUEoEOcGQQFGG0EAIAFBJBDnBkEBRhtBACABQTAQ5wZBAUYbIQIMAQsgAUEgEOcGQQFHBEAgAUEwEOcGDQEgAUEkEOcGQQFHDQEgAUEoEOcGQQFHDQELIAFBGBDnBiECCyABQUBrJAAgAgtxAQF/IABBEBDnBiIDRQRAIABBJEEBEPUGIABBGCACEPUGIABBECABEPUGDwsCQCABIANGBEAgAEEYEOcGQQJHDQEgAEEYIAIQ9QYPCyAAQTZBARDwBiAAQRhBAhD1BiAAQSQgAEEkEOcGQQFqEPUGCwscACAAIAFBCBDnBkEAELYGBEAgASACIAMQuQYLCzsAIAAgAUEIEOcGQQAQtgYEQCABIAIgAxC5Bg8LIABBCBDnBiIAIAEgAiADIABBABDnBkEcEOcGEQoAC2IBAn8gAEEEEOcGIQQCf0EAIAJFDQAaIARBCHUiBSAEQQFxRQ0AGiACQQAQ5wYgBWpBABDnBgshBSAAQQAQ5wYiACABIAIgBWogA0ECIARBAnEbIABBABDnBkEcEOcGEQoAC3sBAn8gACABQQgQ5wZBABC2BgRAIAEgAiADELkGDwsgAEEMEOcGIQQgAEEQaiIFIAEgAiADELwGAkAgBEECSA0AIAUgBEEDdGohBCAAQRhqIQADQCAAIAEgAiADELwGIABBCGoiACAETw0BIAFBNhDjBkH/AXFFDQALCwvCAQAgAEE1QQEQ8AYCQCAAQQQQ5wYgAkcNACAAQTRBARDwBiAAQRAQ5wYiAkUEQCAAQSRBARD1BiAAQRggAxD1BiAAQRAgARD1BiADQQFHDQEgAEEwEOcGQQFHDQEgAEE2QQEQ8AYPCyABIAJGBEAgAEEYEOcGIgJBAkYEQCAAQRggAxD1BiADIQILIABBMBDnBkEBRyACQQFHcg0BIABBNkEBEPAGDwsgAEE2QQEQ8AYgAEEkIABBJBDnBkEBahD1BgsLJgACQCAAQQQQ5wYgAUcNACAAQRwQ5wZBAUYNACAAQRwgAhD1BgsL5QQBBH8gACABQQgQ5wYgBBC2BgRAIAEgAiADEL8GDwsCQCAAIAFBABDnBiAEELYGBEACQCABQRAQ5wYgAkcEQCABQRQQ5wYgAkcNAQsgA0EBRw0CIAFBIEEBEPUGDwsgAUEgIAMQ9QYgAUEsEOcGQQRHBEAgAEEQaiIFIABBDBDnBkEDdGohCCABQSwCfwJAA0ACQCAFIAhPDQAgAUE0QQAQ8gYgBSABIAIgAkEBIAQQwQYgAUE2EOMGDQACQCABQTUQ4wZFDQAgAUE0EOMGBEBBASEDIAFBGBDnBkEBRg0EQQEhB0EBIQYgAEEIEOMGQQJxDQEMBAtBASEHIAYhAyAAQQgQ4wZBAXFFDQMLIAVBCGohBQwBCwsgBiEDQQQgB0UNARoLQQMLEPUGIANBAXENAgsgAUEUIAIQ9QYgAUEoIAFBKBDnBkEBahD1BiABQSQQ5wZBAUcNASABQRgQ5wZBAkcNASABQTZBARDwBg8LIABBDBDnBiEGIABBEGoiBSABIAIgAyAEEMIGIAZBAkgNACAFIAZBA3RqIQYgAEEYaiEFAkAgAEEIEOcGIgBBAnFFBEAgAUEkEOcGQQFHDQELA0AgAUE2EOMGDQIgBSABIAIgAyAEEMIGIAVBCGoiBSAGSQ0ACwwBCyAAQQFxRQRAA0AgAUE2EOMGDQIgAUEkEOcGQQFGDQIgBSABIAIgAyAEEMIGIAVBCGoiBSAGSQ0ADAILAAsDQCABQTYQ4wYNASABQSQQ5wZBAUYEQCABQRgQ5wZBAUYNAgsgBSABIAIgAyAEEMIGIAVBCGoiBSAGSQ0ACwsLWAECfyAAQQQQ5wYiB0EIdSEGIAdBAXEEQCADQQAQ5wYgBmpBABDnBiEGCyAAQQAQ5wYiACABIAIgAyAGaiAEQQIgB0ECcRsgBSAAQQAQ5wZBFBDnBhEMAAtWAQJ/IABBBBDnBiIGQQh1IQUgBkEBcQRAIAJBABDnBiAFakEAEOcGIQULIABBABDnBiIAIAEgAiAFaiADQQIgBkECcRsgBCAAQQAQ5wZBGBDnBhEJAAulAgAgACABQQgQ5wYgBBC2BgRAIAEgAiADEL8GDwsCQCAAIAFBABDnBiAEELYGBEACQCABQRAQ5wYgAkcEQCABQRQQ5wYgAkcNAQsgA0EBRw0CIAFBIEEBEPUGDwsgAUEgIAMQ9QYCQCABQSwQ5wZBBEYNACABQTRBABDyBiAAQQgQ5wYiACABIAIgAkEBIAQgAEEAEOcGQRQQ5wYRDAAgAUE1EOMGBEAgAUEsQQMQ9QYgAUE0EOMGRQ0BDAMLIAFBLEEEEPUGCyABQRQgAhD1BiABQSggAUEoEOcGQQFqEPUGIAFBJBDnBkEBRw0BIAFBGBDnBkECRw0BIAFBNkEBEPAGDwsgAEEIEOcGIgAgASACIAMgBCAAQQAQ5wZBGBDnBhEJAAsLrgEAIAAgAUEIEOcGIAQQtgYEQCABIAIgAxC/Bg8LAkAgACABQQAQ5wYgBBC2BkUNAAJAIAFBEBDnBiACRwRAIAFBFBDnBiACRw0BCyADQQFHDQEgAUEgQQEQ9QYPCyABQRQgAhD1BiABQSAgAxD1BiABQSggAUEoEOcGQQFqEPUGAkAgAUEkEOcGQQFHDQAgAUEYEOcGQQJHDQAgAUE2QQEQ8AYLIAFBLEEEEPUGCwvBAgEGfyAAIAFBCBDnBiAFELYGBEAgASACIAMgBBC+Bg8LIAFBNRDjBiEHIABBDBDnBiEGIAFBNUEAEPAGIAFBNBDjBiEIIAFBNEEAEPAGIABBEGoiCSABIAIgAyAEIAUQwQYgByABQTUQ4wYiCnIhByAIIAFBNBDjBiILciEIAkAgBkECSA0AIAkgBkEDdGohCSAAQRhqIQYDQCABQTYQ4wYNAQJAIAtB/wFxBEAgAUEYEOcGQQFGDQMgAEEIEOMGQQJxDQEMAwsgCkH/AXFFDQAgAEEIEOMGQQFxRQ0CCyABQTRBABDyBiAGIAEgAiADIAQgBRDBBiABQTUQ4wYiCiAHciEHIAFBNBDjBiILIAhyIQggBkEIaiIGIAlJDQALCyABQTUgB0H/AXFBAEcQ8AYgAUE0IAhB/wFxQQBHEPAGC0EAIAAgAUEIEOcGIAUQtgYEQCABIAIgAyAEEL4GDwsgAEEIEOcGIgAgASACIAMgBCAFIABBABDnBkEUEOcGEQwACx4AIAAgAUEIEOcGIAUQtgYEQCABIAIgAyAEEL4GCwvMNAEMfyMAQRBrIgwkAAJAAkACQAJAAkACQAJAAkACQAJAAkACQCAAQfQBTQRAQQBBkLABEOcGIgVBECAAQQtqQXhxIABBC0kbIghBA3YiAnYiAUEDcQRAIAFBf3NBAXEgAmoiA0EDdCIBQcCwAWpBABDnBiIEQQhqIQACQCAEQQgQ5wYiAiABQbiwAWoiAUYEQEEAQZCwASAFQX4gA3dxEPUGDAELQQBBoLABEOcGGiACQQwgARD1BiABQQggAhD1BgsgBEEEIANBA3QiAUEDchD1BiABIARqIgFBBCABQQQQ5wZBAXIQ9QYMDQsgCEEAQZiwARDnBiIKTQ0BIAEEQAJAQQIgAnQiAEEAIABrciABIAJ0cSIAQQAgAGtxQQFrIgAgAEEMdkEQcSICdiIBQQV2QQhxIgAgAnIgASAAdiIBQQJ2QQRxIgByIAEgAHYiAUEBdkECcSIAciABIAB2IgFBAXZBAXEiAHIgASAAdmoiA0EDdCIAQcCwAWpBABDnBiIEQQgQ5wYiASAAQbiwAWoiAEYEQEEAQZCwASAFQX4gA3dxIgUQ9QYMAQtBAEGgsAEQ5wYaIAFBDCAAEPUGIABBCCABEPUGCyAEQQhqIQAgBEEEIAhBA3IQ9QYgBCAIaiICQQQgA0EDdCIBIAhrIgNBAXIQ9QYgASAEakEAIAMQ9QYgCgRAIApBA3YiAUEDdEG4sAFqIQZBAEGksAEQ5wYhBAJ/IAVBASABdCIBcUUEQEEAQZCwASABIAVyEPUGIAYMAQsgBkEIEOcGCyEBIAZBCCAEEPUGIAFBDCAEEPUGIARBDCAGEPUGIARBCCABEPUGC0EAQaSwASACEPUGQQBBmLABIAMQ9QYMDQtBAEGUsAEQ5wYiB0UNASAHQQAgB2txQQFrIgAgAEEMdkEQcSICdiIBQQV2QQhxIgAgAnIgASAAdiIBQQJ2QQRxIgByIAEgAHYiAUEBdkECcSIAciABIAB2IgFBAXZBAXEiAHIgASAAdmpBAnRBwLIBakEAEOcGIgFBBBDnBkF4cSAIayEEIAEhAgNAAkAgAkEQEOcGIgBFBEAgAkEUakEAEOcGIgBFDQELIABBBBDnBkF4cSAIayICIAQgAiAESSICGyEEIAAgASACGyEBIAAhAgwBCwsgASAIaiIJIAFNDQIgAUEYEOcGIQsgASABQQwQ5wYiA0cEQEEAQaCwARDnBiABQQgQ5wYiAE0EQCAAQQwQ5wYaCyAAQQwgAxD1BiADQQggABD1BgwMCyABQRRqIgJBABDnBiIARQRAIAFBEBDnBiIARQ0EIAFBEGohAgsDQCACIQYgACIDQRRqIgJBABDnBiIADQAgA0EQaiECIANBEBDnBiIADQALIAZBAEEAEPUGDAsLQX8hCCAAQb9/Sw0AIABBC2oiAEF4cSEIQQBBlLABEOcGIglFDQBBHyEFQQAgCGshBAJAAkACQAJ/IAhB////B00EQCAAQQh2IgAgAEGA/j9qQRB2QQhxIgJ0IgAgAEGA4B9qQRB2QQRxIgF0IgAgAEGAgA9qQRB2QQJxIgB0QQ92IAEgAnIgAHJrIgBBAXQgCCAAQRVqdkEBcXJBHGohBQsgBUECdEHAsgFqC0EAEOcGIgJFBEBBACEADAELQQAhACAIQQBBGSAFQQF2ayAFQR9GG3QhAQNAAkAgAkEEEOcGQXhxIAhrIgYgBE8NACACIQMgBiIEDQBBACEEIAIhAAwDCyAAIAJBFGpBABDnBiIGIAYgAiABQR12QQRxakEQakEAEOcGIgJGGyAAIAYbIQAgAUEBdCEBIAINAAsLIAAgA3JFBEBBAiAFdCIAQQAgAGtyIAlxIgBFDQMgAEEAIABrcUEBayIAIABBDHZBEHEiAnYiAUEFdkEIcSIAIAJyIAEgAHYiAUECdkEEcSIAciABIAB2IgFBAXZBAnEiAHIgASAAdiIBQQF2QQFxIgByIAEgAHZqQQJ0QcCyAWpBABDnBiEACyAARQ0BCwNAIABBBBDnBkF4cSAIayIBIARJIQYgAEEQEOcGIgJFBEAgAEEUakEAEOcGIQILIAEgBCAGGyEEIAAgAyAGGyEDIAIiAA0ACwsgA0UNACAEQQBBmLABEOcGIAhrTw0AIAMgCGoiByADTQ0BIANBGBDnBiEFIAMgA0EMEOcGIgFHBEBBAEGgsAEQ5wYgA0EIEOcGIgBNBEAgAEEMEOcGGgsgAEEMIAEQ9QYgAUEIIAAQ9QYMCgsgA0EUaiICQQAQ5wYiAEUEQCADQRAQ5wYiAEUNBCADQRBqIQILA0AgAiEGIAAiAUEUaiICQQAQ5wYiAA0AIAFBEGohAiABQRAQ5wYiAA0ACyAGQQBBABD1BgwJCyAIQQBBmLABEOcGIgJNBEBBAEGksAEQ5wYhAwJAIAIgCGsiAUEQTwRAQQBBmLABIAEQ9QZBAEGksAEgAyAIaiIAEPUGIABBBCABQQFyEPUGIAIgA2pBACABEPUGIANBBCAIQQNyEPUGDAELQQBBpLABQQAQ9QZBAEGYsAFBABD1BiADQQQgAkEDchD1BiACIANqIgBBBCAAQQQQ5wZBAXIQ9QYLIANBCGohAAwLCyAIQQBBnLABEOcGIgdJBEBBAEGcsAEgByAIayIBEPUGQQBBqLABQQBBqLABEOcGIgIgCGoiABD1BiAAQQQgAUEBchD1BiACQQQgCEEDchD1BiACQQhqIQAMCwsCf0EAQeizARDnBgRAQQBB8LMBEOcGDAELQQBB9LMBQn8Q+QZBAEHsswFCgKCAgICABBD5BkEAQeizASAMQQxqQXBxQdiq1aoFcxD1BkEAQfyzAUEAEPUGQQBBzLMBQQAQ9QZBgCALIQFBACEAIAEgCEEvaiIJaiIFQQAgAWsiBnEiAiAITQ0KQQBByLMBEOcGIgQEQEEAQcCzARDnBiIDIAJqIgEgA00gASAES3INCwtBAEHMswEQ4wZBBHENBQJAAkBBAEGosAEQ5wYiAwRAQdCzASEAA0AgAyAAQQAQ5wYiAU8EQCAAQQQQ5wYgAWogA0sNAwsgAEEIEOcGIgANAAsLQQAQzgYiAUF/Rg0GIAIhBUEAQeyzARDnBiIDQQFrIgAgAXEEQCACIAFrIAAgAWpBACADa3FqIQULIAUgCE0gBUH+////B0tyDQZBAEHIswEQ5wYiBARAQQBBwLMBEOcGIgMgBWoiACADTSAAIARLcg0HCyAFEM4GIgAgAUcNAQwICyAFIAdrIAZxIgVB/v///wdLDQUgBRDOBiIBIABBABDnBiAAQQQQ5wZqRg0EIAEhAAsgAEF/RiAIQTBqIAVNckUEQEEAQfCzARDnBiIBIAkgBWtqQQAgAWtxIgFB/v///wdLBEAgACEBDAgLIAEQzgZBf0cEQCABIAVqIQUgACEBDAgLQQAgBWsQzgYaDAULIAAiAUF/Rw0GDAQLAAtBACEDDAcLQQAhAQwFCyABQX9HDQILQQBBzLMBQQBBzLMBEOcGQQRyEPUGCyACQf7///8HSw0BIAIQzgYiAUEAEM4GIgBPIAFBf0ZyIABBf0ZyDQEgACABayIFIAhBKGpNDQELQQBBwLMBQQBBwLMBEOcGIAVqIgAQ9QZBAEHEswEQ5wYgAEkEQEEAQcSzASAAEPUGCwJAAkACQEEAQaiwARDnBiIGBEBB0LMBIQADQCABIABBABDnBiIDIABBBBDnBiICakYNAiAAQQgQ5wYiAA0ACwwCC0EAQaCwARDnBiIAQQAgACABTRtFBEBBAEGgsAEgARD1BgtBACEAQQBB1LMBIAUQ9QZBAEHQswEgARD1BkEAQbCwAUF/EPUGQQBBtLABQQBB6LMBEOcGEPUGQQBB3LMBQQAQ9QYDQCAAQQN0IgNBwLABakEAIANBuLABaiICEPUGIANBxLABakEAIAIQ9QYgAEEBaiIAQSBHDQALQQBBnLABIAVBKGsiA0F4IAFrQQdxQQAgAUEIakEHcRsiAGsiAhD1BkEAQaiwASAAIAFqIgAQ9QYgAEEEIAJBAXIQ9QYgASADakEEQSgQ9QZBAEGssAFBAEH4swEQ5wYQ9QYMAgsgASAGTSADIAZLcg0AIABBDBDnBkEIcQ0AIABBBCACIAVqEPUGQQBBqLABIAZBeCAGa0EHcUEAIAZBCGpBB3EbIgBqIgIQ9QZBAEGcsAFBAEGcsAEQ5wYgBWoiASAAayIAEPUGIAJBBCAAQQFyEPUGIAEgBmpBBEEoEPUGQQBBrLABQQBB+LMBEOcGEPUGDAELQQBBoLABEOcGIgMgAUsEQEEAQaCwASABEPUGIAEhAwsgASAFaiECQdCzASEAAkACQAJAAkACQAJAA0AgAEEAEOcGIAJHBEAgAEEIEOcGIgANAQwCCwsgAEEMEOMGQQhxRQ0BC0HQswEhAANAIAYgAEEAEOcGIgJPBEAgAEEEEOcGIAJqIgQgBksNAwsgAEEIEOcGIQAMAAsACyAAQQAgARD1BiAAQQQgAEEEEOcGIAVqEPUGIAFBeCABa0EHcUEAIAFBCGpBB3EbaiIJQQQgCEEDchD1BiACQXggAmtBB3FBACACQQhqQQdxG2oiBSAJayAIayECIAggCWohByAFIAZGBEBBAEGosAEgBxD1BkEAQZywAUEAQZywARDnBiACaiIAEPUGIAdBBCAAQQFyEPUGDAMLQQBBpLABEOcGIAVGBEBBAEGksAEgBxD1BkEAQZiwAUEAQZiwARDnBiACaiIAEPUGIAdBBCAAQQFyEPUGIAAgB2pBACAAEPUGDAMLIAVBBBDnBiIAQQNxQQFGBEAgAEF4cSEGAkAgAEH/AU0EQCAFQQwQ5wYhAyAFQQgQ5wYiASAAQQN2IgBBA3RBuLABakcaIAEgA0YEQEEAQZCwAUEAQZCwARDnBkF+IAB3cRD1BgwCCyABQQwgAxD1BiADQQggARD1BgwBCyAFQRgQ5wYhCAJAIAUgBUEMEOcGIgFHBEAgBUEIEOcGIgAgA08EQCAAQQwQ5wYaCyAAQQwgARD1BiABQQggABD1BgwBCwJAIAVBFGoiAEEAEOcGIgQNACAFQRBqIgBBABDnBiIEDQBBACEBDAELA0AgACEDIAQiAUEUaiIAQQAQ5wYiBA0AIAFBEGohACABQRAQ5wYiBA0ACyADQQBBABD1BgsgCEUNAAJAIAVBHBDnBiIDQQJ0QcCyAWoiAEEAEOcGIAVGBEAgAEEAIAEQ9QYgAQ0BQQBBlLABQQBBlLABEOcGQX4gA3dxEPUGDAILIAhBEEEUIAhBEBDnBiAFRhtqQQAgARD1BiABRQ0BCyABQRggCBD1BiAFQRAQ5wYiAARAIAFBECAAEPUGIABBGCABEPUGCyAFQRQQ5wYiAEUNACABQRRqQQAgABD1BiAAQRggARD1BgsgBSAGaiEFIAIgBmohAgsgBUEEIAVBBBDnBkF+cRD1BiAHQQQgAkEBchD1BiACIAdqQQAgAhD1BiACQf8BTQRAIAJBA3YiAEEDdEG4sAFqIQICf0EAQZCwARDnBiIBQQEgAHQiAHFFBEBBAEGQsAEgACABchD1BiACDAELIAJBCBDnBgshACACQQggBxD1BiAAQQwgBxD1BiAHQQwgAhD1BiAHQQggABD1BgwDC0EfIQAgB0EcAn8gAkH///8HTQRAIAJBCHYiACAAQYD+P2pBEHZBCHEiA3QiACAAQYDgH2pBEHZBBHEiAXQiACAAQYCAD2pBEHZBAnEiAHRBD3YgASADciAAcmsiAEEBdCACIABBFWp2QQFxckEcaiEACyAACxD1BiAHQRBCABD5BiAAQQJ0QcCyAWohBAJAQQBBlLABEOcGIgNBASAAdCIBcUUEQEEAQZSwASABIANyEPUGIARBACAHEPUGIAdBGCAEEPUGDAELIAJBAEEZIABBAXZrIABBH0YbdCEAIARBABDnBiEBA0AgASIDQQQQ5wZBeHEgAkYNAyAAQR12IQEgAEEBdCEAIAMgAUEEcWpBEGoiBEEAEOcGIgENAAsgBEEAIAcQ9QYgB0EYIAMQ9QYLIAdBDCAHEPUGIAdBCCAHEPUGDAILQQBBnLABIAVBKGsiA0F4IAFrQQdxQQAgAUEIakEHcRsiAGsiAhD1BkEAQaiwASAAIAFqIgAQ9QYgAEEEIAJBAXIQ9QYgASADakEEQSgQ9QZBAEGssAFBAEH4swEQ5wYQ9QYgBiAEQScgBGtBB3FBACAEQSdrQQdxG2pBL2siACAAIAZBEGpJGyICQQRBGxD1BiACQRBqQQBBAEHYswEQ7QYQ+QYgAkEIQQBB0LMBEO0GEPkGQQBB2LMBIAJBCGoQ9QZBAEHUswEgBRD1BkEAQdCzASABEPUGQQBB3LMBQQAQ9QYgAkEYaiEAA0AgAEEEQQcQ9QYgAEEIaiEBIABBBGohACABIARJDQALIAIgBkYNAyACQQQgAkEEEOcGQX5xEPUGIAZBBCACIAZrIgRBAXIQ9QYgAkEAIAQQ9QYgBEH/AU0EQCAEQQN2IgBBA3RBuLABaiECAn9BAEGQsAEQ5wYiAUEBIAB0IgBxRQRAQQBBkLABIAAgAXIQ9QYgAgwBCyACQQgQ5wYLIQAgAkEIIAYQ9QYgAEEMIAYQ9QYgBkEMIAIQ9QYgBkEIIAAQ9QYMBAtBHyEAIARB////B00EQCAEQQh2IgAgAEGA/j9qQRB2QQhxIgJ0IgAgAEGA4B9qQRB2QQRxIgF0IgAgAEGAgA9qQRB2QQJxIgB0QQ92IAEgAnIgAHJrIgBBAXQgBCAAQRVqdkEBcXJBHGohAAsgBkEQQgAQ+QYgBkEcakEAIAAQ9QYgAEECdEHAsgFqIQMCQEEAQZSwARDnBiICQQEgAHQiAXFFBEBBAEGUsAEgASACchD1BiADQQAgBhD1BiAGQRhqQQAgAxD1BgwBCyAEQQBBGSAAQQF2ayAAQR9GG3QhACADQQAQ5wYhAQNAIAEiAkEEEOcGQXhxIARGDQQgAEEddiEBIABBAXQhACACIAFBBHFqQRBqIgNBABDnBiIBDQALIANBACAGEPUGIAZBGGpBACACEPUGCyAGQQwgBhD1BiAGQQggBhD1BgwDCyADQQgQ5wYiAEEMIAcQ9QYgA0EIIAcQ9QYgB0EYQQAQ9QYgB0EMIAMQ9QYgB0EIIAAQ9QYLIAlBCGohAAwFCyACQQgQ5wYiAEEMIAYQ9QYgAkEIIAYQ9QYgBkEYakEAQQAQ9QYgBkEMIAIQ9QYgBkEIIAAQ9QYLQQBBnLABEOcGIgAgCE0NAEEAQZywASAAIAhrIgEQ9QZBAEGosAFBAEGosAEQ5wYiAiAIaiIAEPUGIABBBCABQQFyEPUGIAJBBCAIQQNyEPUGIAJBCGohAAwDC0HkhgFBAEEwEPUGQQAhAAwCCwJAIAVFDQACQCADQRwQ5wYiAkECdEHAsgFqIgBBABDnBiADRgRAIABBACABEPUGIAENAUEAQZSwASAJQX4gAndxIgkQ9QYMAgsgBUEQQRQgBUEQEOcGIANGG2pBACABEPUGIAFFDQELIAFBGCAFEPUGIANBEBDnBiIABEAgAUEQIAAQ9QYgAEEYIAEQ9QYLIANBFGpBABDnBiIARQ0AIAFBFGpBACAAEPUGIABBGCABEPUGCwJAIARBD00EQCADQQQgBCAIaiIAQQNyEPUGIAAgA2oiAEEEIABBBBDnBkEBchD1BgwBCyADQQQgCEEDchD1BiAHQQQgBEEBchD1BiAEIAdqQQAgBBD1BiAEQf8BTQRAIARBA3YiAEEDdEG4sAFqIQICf0EAQZCwARDnBiIBQQEgAHQiAHFFBEBBAEGQsAEgACABchD1BiACDAELIAJBCBDnBgshACACQQggBxD1BiAAQQwgBxD1BiAHQQwgAhD1BiAHQQggABD1BgwBC0EfIQAgB0EcAn8gBEH///8HTQRAIARBCHYiACAAQYD+P2pBEHZBCHEiAnQiACAAQYDgH2pBEHZBBHEiAXQiACAAQYCAD2pBEHZBAnEiAHRBD3YgASACciAAcmsiAEEBdCAEIABBFWp2QQFxckEcaiEACyAACxD1BiAHQRBCABD5BiAAQQJ0QcCyAWohAgJAAkAgCUEBIAB0IgFxRQRAQQBBlLABIAEgCXIQ9QYgAkEAIAcQ9QYgB0EYIAIQ9QYMAQsgBEEAQRkgAEEBdmsgAEEfRht0IQAgAkEAEOcGIQgDQCAIIgFBBBDnBkF4cSAERg0CIABBHXYhAiAAQQF0IQAgASACQQRxakEQaiICQQAQ5wYiCA0ACyACQQAgBxD1BiAHQRggARD1BgsgB0EMIAcQ9QYgB0EIIAcQ9QYMAQsgAUEIEOcGIgBBDCAHEPUGIAFBCCAHEPUGIAdBGEEAEPUGIAdBDCABEPUGIAdBCCAAEPUGCyADQQhqIQAMAQsCQCALRQ0AAkAgAUEcEOcGIgJBAnRBwLIBaiIAQQAQ5wYgAUYEQCAAQQAgAxD1BiADDQFBAEGUsAEgB0F+IAJ3cRD1BgwCCyALQRBBFCALQRAQ5wYgAUYbakEAIAMQ9QYgA0UNAQsgA0EYIAsQ9QYgAUEQEOcGIgAEQCADQRAgABD1BiAAQRggAxD1BgsgAUEUakEAEOcGIgBFDQAgA0EUakEAIAAQ9QYgAEEYIAMQ9QYLAkAgBEEPTQRAIAFBBCAEIAhqIgBBA3IQ9QYgACABaiIAQQQgAEEEEOcGQQFyEPUGDAELIAFBBCAIQQNyEPUGIAlBBCAEQQFyEPUGIAQgCWpBACAEEPUGIAoEQCAKQQN2IgBBA3RBuLABaiEDQQBBpLABEOcGIQICf0EBIAB0IgAgBXFFBEBBAEGQsAEgACAFchD1BiADDAELIANBCBDnBgshACADQQggAhD1BiAAQQwgAhD1BiACQQwgAxD1BiACQQggABD1BgtBAEGksAEgCRD1BkEAQZiwASAEEPUGCyABQQhqIQALIAxBEGokACAAC44PAQd/AkAgAEUNACAAQQhrIgMgAEEEa0EAEOcGIgFBeHEiAGohBQJAIAFBAXENACABQQNxRQ0BIAMgA0EAEOcGIgJrIgNBAEGgsAEQ5wYiBEkNASAAIAJqIQBBAEGksAEQ5wYgA0cEQCACQf8BTQRAIANBDBDnBiEBIANBCBDnBiIEIAJBA3YiAkEDdEG4sAFqRxogASAERgRAQQBBkLABQQBBkLABEOcGQX4gAndxEPUGDAMLIARBDCABEPUGIAFBCCAEEPUGDAILIANBGBDnBiEGAkAgAyADQQwQ5wYiAUcEQCADQQgQ5wYiAiAETwRAIAJBDBDnBhoLIAJBDCABEPUGIAFBCCACEPUGDAELAkAgA0EUaiICQQAQ5wYiBA0AIANBEGoiAkEAEOcGIgQNAEEAIQEMAQsDQCACIQcgBCIBQRRqIgJBABDnBiIEDQAgAUEQaiECIAFBEBDnBiIEDQALIAdBAEEAEPUGCyAGRQ0BAkAgA0EcEOcGIgJBAnRBwLIBaiIEQQAQ5wYgA0YEQCAEQQAgARD1BiABDQFBAEGUsAFBAEGUsAEQ5wZBfiACd3EQ9QYMAwsgBkEQQRQgBkEQEOcGIANGG2pBACABEPUGIAFFDQILIAFBGCAGEPUGIANBEBDnBiICBEAgAUEQIAIQ9QYgAkEYIAEQ9QYLIANBFBDnBiICRQ0BIAFBFGpBACACEPUGIAJBGCABEPUGDAELIAVBBBDnBiIBQQNxQQNHDQBBAEGYsAEgABD1BiAFQQQgAUF+cRD1BiADQQQgAEEBchD1BiAAIANqQQAgABD1Bg8LIAMgBU8NACAFQQQQ5wYiAUEBcUUNAAJAIAFBAnFFBEBBAEGosAEQ5wYgBUYEQEEAQaiwASADEPUGQQBBnLABQQBBnLABEOcGIABqIgAQ9QYgA0EEIABBAXIQ9QZBAEGksAEQ5wYgA0cNA0EAQZiwAUEAEPUGQQBBpLABQQAQ9QYPC0EAQaSwARDnBiAFRgRAQQBBpLABIAMQ9QZBAEGYsAFBAEGYsAEQ5wYgAGoiABD1BiADQQQgAEEBchD1BiAAIANqQQAgABD1Bg8LIAFBeHEgAGohAAJAIAFB/wFNBEAgBUEMEOcGIQIgBUEIEOcGIgQgAUEDdiIBQQN0QbiwAWoiB0cEQEEAQaCwARDnBhoLIAIgBEYEQEEAQZCwAUEAQZCwARDnBkF+IAF3cRD1BgwCCyACIAdHBEBBAEGgsAEQ5wYaCyAEQQwgAhD1BiACQQggBBD1BgwBCyAFQRgQ5wYhBgJAIAUgBUEMEOcGIgFHBEBBAEGgsAEQ5wYgBUEIEOcGIgJNBEAgAkEMEOcGGgsgAkEMIAEQ9QYgAUEIIAIQ9QYMAQsCQCAFQRRqIgJBABDnBiIEDQAgBUEQaiICQQAQ5wYiBA0AQQAhAQwBCwNAIAIhByAEIgFBFGoiAkEAEOcGIgQNACABQRBqIQIgAUEQEOcGIgQNAAsgB0EAQQAQ9QYLIAZFDQACQCAFQRwQ5wYiAkECdEHAsgFqIgRBABDnBiAFRgRAIARBACABEPUGIAENAUEAQZSwAUEAQZSwARDnBkF+IAJ3cRD1BgwCCyAGQRBBFCAGQRAQ5wYgBUYbakEAIAEQ9QYgAUUNAQsgAUEYIAYQ9QYgBUEQEOcGIgIEQCABQRAgAhD1BiACQRggARD1BgsgBUEUEOcGIgJFDQAgAUEUakEAIAIQ9QYgAkEYIAEQ9QYLIANBBCAAQQFyEPUGIAAgA2pBACAAEPUGQQBBpLABEOcGIANHDQFBAEGYsAEgABD1Bg8LIAVBBCABQX5xEPUGIANBBCAAQQFyEPUGIAAgA2pBACAAEPUGCyAAQf8BTQRAIABBA3YiAUEDdEG4sAFqIQACf0EAQZCwARDnBiICQQEgAXQiAXFFBEBBAEGQsAEgASACchD1BiAADAELIABBCBDnBgshAiAAQQggAxD1BiACQQwgAxD1BiADQQwgABD1BiADQQggAhD1Bg8LQR8hAiAAQf///wdNBEAgAEEIdiIBIAFBgP4/akEQdkEIcSIBdCICIAJBgOAfakEQdkEEcSICdCIEIARBgIAPakEQdkECcSIEdEEPdiABIAJyIARyayIBQQF0IAAgAUEVanZBAXFyQRxqIQILIANBEEIAEPkGIANBHGpBACACEPUGIAJBAnRBwLIBaiEBAkACQAJAQQBBlLABEOcGIgRBASACdCIHcUUEQEEAQZSwASAEIAdyEPUGIAFBACADEPUGIANBGGpBACABEPUGDAELIABBAEEZIAJBAXZrIAJBH0YbdCECIAFBABDnBiEBA0AgASIEQQQQ5wZBeHEgAEYNAiACQR12IQEgAkEBdCECIAQgAUEEcWpBEGoiB0EAEOcGIgENAAsgB0EAIAMQ9QYgA0EYakEAIAQQ9QYLIANBDCADEPUGIANBCCADEPUGDAELIARBCBDnBiIAQQwgAxD1BiAEQQggAxD1BiADQRhqQQBBABD1BiADQQwgBBD1BiADQQggABD1BgtBAEGwsAFBAEGwsAEQ5wZBAWsiAEF/IAAbEPUGCwuKAQECfyAARQRAIAEQyAYPCyABQUBPBEBB5IYBQQBBMBD1BkEADwsgAEEIa0EQIAFBC2pBeHEgAUELSRsQywYiAgRAIAJBCGoPCyABEMgGIgJFBEBBAA8LIAIgAEF8QXggAEEEa0EAEOcGIgNBA3EbIANBeHFqIgMgASABIANLGxDSBhogABDJBiACC7MIAQl/IABBBBDnBiIIQQNxIQIgACAIQXhxIgZqIQRBAEGgsAEQ5wYhBQJAIAJFBEBBACECIAFBgAJJDQEgAUEEaiAGTQRAIAAhAiAGIAFrQQBB8LMBEOcGQQF0TQ0CC0EADwsCQCABIAZNBEAgBiABayICQRBJDQEgAEEEIAhBAXEgAXJBAnIQ9QYgACABaiIBQQQgAkEDchD1BiAEQQQgBEEEEOcGQQFyEPUGIAEgAhDMBgwBC0EAIQJBAEGosAEQ5wYgBEYEQEEAQZywARDnBiAGaiIFIAFNDQIgAEEEIAhBAXEgAXJBAnIQ9QYgACABaiICQQQgBSABayIBQQFyEPUGQQBBnLABIAEQ9QZBAEGosAEgAhD1BgwBC0EAQaSwARDnBiAERgRAQQBBmLABEOcGIAZqIgUgAUkNAgJAIAUgAWsiAkEQTwRAIABBBCAIQQFxIAFyQQJyEPUGIAAgAWoiAUEEIAJBAXIQ9QYgACAFaiIFQQAgAhD1BiAFQQQgBUEEEOcGQX5xEPUGDAELIABBBCAIQQFxIAVyQQJyEPUGIAAgBWoiAUEEIAFBBBDnBkEBchD1BkEAIQJBACEBC0EAQaSwASABEPUGQQBBmLABIAIQ9QYMAQsgBEEEEOcGIgNBAnENASADQXhxIAZqIgkgAUkNASAJIAFrIQoCQCADQf8BTQRAIARBDBDnBiEHIARBCBDnBiIGIANBA3YiBUEDdEG4sAFqRxogBiAHRgRAQQBBkLABQQBBkLABEOcGQX4gBXdxEPUGDAILIAZBDCAHEPUGIAdBCCAGEPUGDAELIARBGBDnBiEHAkAgBCAEQQwQ5wYiA0cEQCAEQQgQ5wYiAiAFTwRAIAJBDBDnBhoLIAJBDCADEPUGIANBCCACEPUGDAELAkAgBEEUaiICQQAQ5wYiBg0AIARBEGoiAkEAEOcGIgYNAEEAIQMMAQsDQCACIQUgBiIDQRRqIgJBABDnBiIGDQAgA0EQaiECIANBEBDnBiIGDQALIAVBAEEAEPUGCyAHRQ0AAkAgBEEcEOcGIgVBAnRBwLIBaiICQQAQ5wYgBEYEQCACQQAgAxD1BiADDQFBAEGUsAFBAEGUsAEQ5wZBfiAFd3EQ9QYMAgsgB0EQQRQgB0EQEOcGIARGG2pBACADEPUGIANFDQELIANBGCAHEPUGIARBEBDnBiICBEAgA0EQIAIQ9QYgAkEYIAMQ9QYLIARBFBDnBiICRQ0AIANBFGpBACACEPUGIAJBGCADEPUGCyAKQQ9NBEAgAEEEIAhBAXEgCXJBAnIQ9QYgACAJaiIBQQQgAUEEEOcGQQFyEPUGDAELIABBBCAIQQFxIAFyQQJyEPUGIAAgAWoiAkEEIApBA3IQ9QYgACAJaiIBQQQgAUEEEOcGQQFyEPUGIAIgChDMBgsgACECCyACC6kOAQZ/IAAgAWohBQJAAkAgAEEEEOcGIgJBAXENACACQQNxRQ0BIABBABDnBiIDIAFqIQFBAEGksAEQ5wYgACADayIARwRAQQBBoLABEOcGIQIgA0H/AU0EQCAAQQwQ5wYhBiAAQQgQ5wYiBCADQQN2IgNBA3RBuLABakcaIAQgBkYEQEEAQZCwAUEAQZCwARDnBkF+IAN3cRD1BgwDCyAEQQwgBhD1BiAGQQggBBD1BgwCCyAAQRgQ5wYhBwJAIAAgAEEMEOcGIgNHBEAgAiAAQQgQ5wYiAk0EQCACQQwQ5wYaCyACQQwgAxD1BiADQQggAhD1BgwBCwJAIABBFGoiAkEAEOcGIgQNACAAQRBqIgJBABDnBiIEDQBBACEDDAELA0AgAiEGIAQiA0EUaiICQQAQ5wYiBA0AIANBEGohAiADQRAQ5wYiBA0ACyAGQQBBABD1BgsgB0UNAQJAIABBHBDnBiIEQQJ0QcCyAWoiAkEAEOcGIABGBEAgAkEAIAMQ9QYgAw0BQQBBlLABQQBBlLABEOcGQX4gBHdxEPUGDAMLIAdBEEEUIAdBEBDnBiAARhtqQQAgAxD1BiADRQ0CCyADQRggBxD1BiAAQRAQ5wYiAgRAIANBECACEPUGIAJBGCADEPUGCyAAQRQQ5wYiAkUNASADQRRqQQAgAhD1BiACQRggAxD1BgwBCyAFQQQQ5wYiAkEDcUEDRw0AQQBBmLABIAEQ9QYgBUEEIAJBfnEQ9QYgAEEEIAFBAXIQ9QYgBUEAIAEQ9QYPCwJAIAVBBBDnBiIDQQJxRQRAQQBBqLABEOcGIAVGBEBBAEGosAEgABD1BkEAQZywAUEAQZywARDnBiABaiIBEPUGIABBBCABQQFyEPUGQQBBpLABEOcGIABHDQNBAEGYsAFBABD1BkEAQaSwAUEAEPUGDwtBAEGksAEQ5wYgBUYEQEEAQaSwASAAEPUGQQBBmLABQQBBmLABEOcGIAFqIgEQ9QYgAEEEIAFBAXIQ9QYgACABakEAIAEQ9QYPC0EAQaCwARDnBiECIANBeHEgAWohAQJAIANB/wFNBEAgBUEMEOcGIQYgBUEIEOcGIgQgA0EDdiIDQQN0QbiwAWpHGiAEIAZGBEBBAEGQsAFBAEGQsAEQ5wZBfiADd3EQ9QYMAgsgBEEMIAYQ9QYgBkEIIAQQ9QYMAQsgBUEYEOcGIQcCQCAFIAVBDBDnBiIDRwRAIAIgBUEIEOcGIgJNBEAgAkEMEOcGGgsgAkEMIAMQ9QYgA0EIIAIQ9QYMAQsCQCAFQRRqIgRBABDnBiICDQAgBUEQaiIEQQAQ5wYiAg0AQQAhAwwBCwNAIAQhBiACIgNBFGoiBEEAEOcGIgINACADQRBqIQQgA0EQEOcGIgINAAsgBkEAQQAQ9QYLIAdFDQACQCAFQRwQ5wYiBEECdEHAsgFqIgJBABDnBiAFRgRAIAJBACADEPUGIAMNAUEAQZSwAUEAQZSwARDnBkF+IAR3cRD1BgwCCyAHQRBBFCAHQRAQ5wYgBUYbakEAIAMQ9QYgA0UNAQsgA0EYIAcQ9QYgBUEQEOcGIgIEQCADQRAgAhD1BiACQRggAxD1BgsgBUEUEOcGIgJFDQAgA0EUakEAIAIQ9QYgAkEYIAMQ9QYLIABBBCABQQFyEPUGIAAgAWpBACABEPUGQQBBpLABEOcGIABHDQFBAEGYsAEgARD1Bg8LIAVBBCADQX5xEPUGIABBBCABQQFyEPUGIAAgAWpBACABEPUGCyABQf8BTQRAIAFBA3YiAkEDdEG4sAFqIQECf0EAQZCwARDnBiIDQQEgAnQiAnFFBEBBAEGQsAEgAiADchD1BiABDAELIAFBCBDnBgshAiABQQggABD1BiACQQwgABD1BiAAQQwgARD1BiAAQQggAhD1Bg8LQR8hAiABQf///wdNBEAgAUEIdiICIAJBgP4/akEQdkEIcSIEdCICIAJBgOAfakEQdkEEcSIDdCICIAJBgIAPakEQdkECcSICdEEPdiADIARyIAJyayICQQF0IAEgAkEVanZBAXFyQRxqIQILIABBEEIAEPkGIABBHGpBACACEPUGIAJBAnRBwLIBaiEGAkACQEEAQZSwARDnBiIEQQEgAnQiA3FFBEBBAEGUsAEgAyAEchD1BiAGQQAgABD1BiAAQRhqQQAgBhD1BgwBCyABQQBBGSACQQF2ayACQR9GG3QhAiAGQQAQ5wYhAwNAIAMiBEEEEOcGQXhxIAFGDQIgAkEddiEDIAJBAXQhAiAEIANBBHFqQRBqIgZBABDnBiIDDQALIAZBACAAEPUGIABBGGpBACAEEPUGCyAAQQwgABD1BiAAQQggABD1Bg8LIARBCBDnBiIBQQwgABD1BiAEQQggABD1BiAAQRhqQQBBABD1BiAAQQwgBBD1BiAAQQggARD1BgsLBgBB1IYBC1sBAn9BAEHUhgEQ5wYiASAAQQNqQXxxIgJqIQACQCACQQFOQQAgACABTRsNAD8AQRB0IABJBEAgABAQRQ0BC0EAQdSGASAAEPUGIAEPC0HkhgFBAEEwEPUGQX8L4AYCBH8DfiMAQYABayIFJAACQAJAAkAgAyAEQgBCABCTAkUNACADIAQQ0QYhByACQjCIpyIIQf//AXEiBkH//wFGDQAgBw0BCyAFQRBqIAEgAiADIAQQkAIgBSAFQRAQ7gYiASAFQRhqQQAQ7gYiAiABIAIQmgIgBUEIakEAEO4GIQIgBUEAEO4GIQQMAQsgASACQv///////z+DIAatQjCGhCIKIAMgBEL///////8/gyAEQjCIp0H//wFxIgetQjCGhCIJEJMCQQBMBEAgASAKIAMgCRCTAgRAIAEhBAwCCyAFQfAAaiABIAJCAEIAEJACIAVB+ABqQQAQ7gYhAiAFQfAAEO4GIQQMAQsgBgR+IAEFIAVB4ABqIAEgCkIAQoCAgICAgMC7wAAQkAIgBUHoAGpBABDuBiIKQjCIp0H4AGshBiAFQeAAEO4GCyEEIAdFBEAgBUHQAGogAyAJQgBCgICAgICAwLvAABCQAiAFQdgAakEAEO4GIglCMIinQfgAayEHIAVB0AAQ7gYhAwsgCUL///////8/g0KAgICAgIDAAIQhCSAKQv///////z+DQoCAgICAgMAAhCEKIAYgB0oEQANAAn4gCiAJfSADIARWrX0iC0IAWQRAIAsgBCADfSIEhFAEQCAFQSBqIAEgAkIAQgAQkAIgBUEoakEAEO4GIQIgBUEgEO4GIQQMBQsgC0IBhiAEQj+IhAwBCyAKQgGGIARCP4iECyEKIARCAYYhBCAGQQFrIgYgB0oNAAsgByEGCwJAIAogCX0gAyAEVq19IglCAFMEQCAKIQkMAQsgCSAEIAN9IgSEQgBSDQAgBUEwaiABIAJCAEIAEJACIAVBOGpBABDuBiECIAVBMBDuBiEEDAELIAlC////////P1gEQANAIARCP4ghASAGQQFrIQYgBEIBhiEEIAEgCUIBhoQiCUKAgICAgIDAAFQNAAsLIAhBgIACcSEHIAZBAEwEQCAFQUBrIAQgCUL///////8/gyAGQfgAaiAHcq1CMIaEQgBCgICAgICAwMM/EJACIAVByABqQQAQ7gYhAiAFQcAAEO4GIQQMAQsgCUL///////8/gyAGIAdyrUIwhoQhAgsgAEEAIAQQ+gYgAEEIIAIQ+gYgBUGAAWokAAupAQEBfEQAAAAAAADwPyEBAkAgAEGACE4EQEQAAAAAAADgfyEBIABB/w9IBEAgAEH/B2shAAwCC0QAAAAAAADwfyEBIABB/RcgAEH9F0gbQf4PayEADAELIABBgXhKDQBEAAAAAAAAEAAhASAAQYNwSgRAIABB/gdqIQAMAQtEAAAAAAAAAAAhASAAQYZoIABBhmhKG0H8D2ohAAsgASAAQf8Haq1CNIa/ogtEAgF/AX4gAUL///////8/gyEDAn8gAUIwiKdB//8BcSICQf//AUcEQEEEIAINARpBAkEDIAAgA4RQGw8LIAAgA4RQCwveBAEDfyACQYAETwRAIAAgASACEBEaIAAPCyAAIAJqIQMCQCAAIAFzQQNxRQRAAkAgAkEBSARAIAAhAgwBCyAAQQNxRQRAIAAhAgwBCyAAIQIDQCACQQAgAUEAEOMGEPAGIAFBAWohASACQQFqIgIgA08NASACQQNxDQALCwJAIANBfHEiBEHAAEkNACACIARBQGoiBUsNAANAIAJBACABQQAQ5wYQ9QYgAkEEIAFBBBDnBhD1BiACQQggAUEIEOcGEPUGIAJBDCABQQwQ5wYQ9QYgAkEQIAFBEBDnBhD1BiACQRQgAUEUEOcGEPUGIAJBGCABQRgQ5wYQ9QYgAkEcIAFBHBDnBhD1BiACQSAgAUEgEOcGEPUGIAJBJCABQSQQ5wYQ9QYgAkEoIAFBKBDnBhD1BiACQSwgAUEsEOcGEPUGIAJBMCABQTAQ5wYQ9QYgAkE0IAFBNBDnBhD1BiACQTggAUE4EOcGEPUGIAJBPCABQTwQ5wYQ9QYgAUFAayEBIAJBQGsiAiAFTQ0ACwsgAiAETw0BA0AgAkEAIAFBABDnBhD1BiABQQRqIQEgAkEEaiICIARJDQALDAELIANBBEkEQCAAIQIMAQsgACADQQRrIgRLBEAgACECDAELIAAhAgNAIAJBACABQQAQ4wYQ8AYgAkEBIAFBARDjBhDwBiACQQIgAUECEOMGEPAGIAJBAyABQQMQ4wYQ8AYgAUEEaiEBIAJBBGoiAiAETQ0ACwsgAiADSQRAA0AgAkEAIAFBABDjBhDwBiABQQFqIQEgAkEBaiICIANHDQALCyAAC6YDAgJ/AX4CQCACRQ0AIAAgAmoiA0EBa0EAIAEQ8AYgAEEAIAEQ8AYgAkEDSQ0AIANBAmtBACABEPAGIABBASABEPAGIANBA2tBACABEPAGIABBAiABEPAGIAJBB0kNACADQQRrQQAgARDwBiAAQQMgARDwBiACQQlJDQAgAEEAIABrQQNxIgRqIgNBACABQf8BcUGBgoQIbCIBEPUGIAMgAiAEa0F8cSIEaiICQQRrQQAgARD1BiAEQQlJDQAgA0EIIAEQ9QYgA0EEIAEQ9QYgAkEIa0EAIAEQ9QYgAkEMa0EAIAEQ9QYgBEEZSQ0AIANBGCABEPUGIANBFCABEPUGIANBECABEPUGIANBDCABEPUGIAJBEGtBACABEPUGIAJBFGtBACABEPUGIAJBGGtBACABEPUGIAJBHGtBACABEPUGIAQgA0EEcUEYciIEayICQSBJDQAgAa1CgYCAgBB+IQUgAyAEaiEBA0AgAUEYIAUQ+gYgAUEQIAUQ+gYgAUEIIAUQ+gYgAUEAIAUQ+gYgAUEgaiEBIAJBIGsiAkEfSw0ACwsgAAvvAgEBfwJAIAAgAUYNACABIABrIAJrQQAgAkEBdGtNBEAgACABIAIQ0gYaDwsgACABc0EDcSEDAkACQCAAIAFJBEAgAw0CIABBA3FFDQEDQCACRQ0EIABBACABQQAQ4wYQ8AYgAUEBaiEBIAJBAWshAiAAQQFqIgBBA3ENAAsMAQsCQCADDQAgACACakEDcQRAA0AgAkUNBSAAIAJBAWsiAmoiA0EAIAEgAmpBABDjBhDwBiADQQNxDQALCyACQQNNDQADQCAAIAJBBGsiAmpBACABIAJqQQAQ5wYQ9QYgAkEDSw0ACwsgAkUNAgNAIAAgAkEBayICakEAIAEgAmpBABDjBhDwBiACDQALDAILIAJBA00NAANAIABBACABQQAQ5wYQ9QYgAUEEaiEBIABBBGohACACQQRrIgJBA0sNAAsLIAJFDQADQCAAQQAgAUEAEOMGEPAGIABBAWohACABQQFqIQEgAkEBayICDQALCwtvAQF/IABBygAgAEHKABDjBiIBQQFrIAFyEPAGIABBABDnBiIBQQhxBEAgAEEAIAFBIHIQ9QZBfw8LIABBBEIAEPkGIABBHCAAQSwQ5wYiARD1BiAAQRQgARD1BiAAQRAgAEEwEOcGIAFqEPUGQQAL1wEBA38CQCABIAJBEBDnBiIDBH8gAwUgAhDVBg0BIAJBEBDnBgsgAkEUEOcGIgVrSwRAIAIgACABIAJBJBDnBhEEAA8LAkAgAkHLABDiBkEASARAQQAhAwwBCyABIQQDQCAEIgNFBEBBACEDDAILIAAgA0EBayIEakEAEOMGQQpHDQALIAIgACADIAJBJBDnBhEEACIEIANJDQEgACADaiEAIAEgA2shASACQRQQ5wYhBQsgBSAAIAEQ0gYaIAJBFCACQRQQ5wYgAWoQ9QYgASADaiEECyAEC0UBAX8gASACbCEEIAQCfyADQcwAEOcGQX9MBEAgACAEIAMQ1gYMAQsgACAEIAMQ1gYLIgBGBEAgAkEAIAEbDwsgACABbgsuAQF/IwBBEGsiACQAIABBDEEAEPUGQQBBrBYQ5wZBwghBABCsARogAEEQaiQAC5gBAQN/IAAhAQJAAkAgAEEDcUUNACAAQQAQ4wZFBEBBAA8LA0AgAUEBaiIBQQNxRQ0BIAFBABDjBg0ACwwBCwNAIAEiAkEEaiEBIAJBABDnBiIDQX9zIANBgYKECGtxQYCBgoR4cUUNAAsgA0H/AXFFBEAgAiAAaw8LA0AgAkEBEOMGIQMgAkEBaiIBIQIgAw0ACwsgASAAawsEACMACwYAIAAkAAsQACMAIABrQXBxIgAkACAACyIBAX4gASACrSADrUIghoQgBCAAERcAIgVCIIinEBIgBacLGQAgASACIAOtIAStQiCGhCAFIAYgABEfAAsZACABIAIgAyAEIAWtIAatQiCGhCAAERMACyMAIAEgAiADIAQgBa0gBq1CIIaEIAetIAitQiCGhCAAERsACyUAIAEgAiADIAQgBSAGrSAHrUIghoQgCK0gCa1CIIaEIAARGgALJQAgACABaiIAQYAISUHUhgEoAgAgAEEBaklyBEAQFAsgACwAAAslACAAIAFqIgBBgAhJQdSGASgCACAAQQFqSXIEQBAUCyAALQAACyAAIABBgAhJQdSGASgCACAAQQJqSXIEQBAUCyAALwAACy8AIAAgAWoiAEGACElB1IYBKAIAIABBAmpJcgRAEBQLIABBAXEEQBAVCyAALwEACyAAIABBgAhJQdSGASgCACAAQQRqSXIEQBAUCyAAKAAACy8AIAAgAWoiAEGACElB1IYBKAIAIABBBGpJcgRAEBQLIABBA3EEQBAVCyAAKAIACyoAIABBgAhJQdSGASgCACAAQQJqSXIEQBAUCyAAQQFxBEAQFQsgADIBAAsqACAAQYAISUHUhgEoAgAgAEECaklyBEAQFAsgAEEBcQRAEBULIAAzAQALKgAgAEGACElB1IYBKAIAIABBBGpJcgRAEBQLIABBA3EEQBAVCyAANAIACyoAIABBgAhJQdSGASgCACAAQQRqSXIEQBAUCyAAQQNxBEAQFQsgADUCAAsgACAAQYAISUHUhgEoAgAgAEEIaklyBEAQFAsgACkAAAsvACAAIAFqIgBBgAhJQdSGASgCACAAQQhqSXIEQBAUCyAAQQNxBEAQFQsgACkCAAsvACAAIAFqIgBBgAhJQdSGASgCACAAQQhqSXIEQBAUCyAAQQdxBEAQFQsgACkDAAsvACAAIAFqIgBBgAhJQdSGASgCACAAQQhqSXIEQBAUCyAAQQdxBEAQFQsgACsDAAsnACAAIAFqIgBBgAhJQdSGASgCACAAQQFqSXIEQBAUCyAAIAI6AAALJAAgAEGACElB1IYBKAIAIABBAmpJcgRAEBQLIABBrtQAOwAACzEAIAAgAWoiAEGACElB1IYBKAIAIABBAmpJcgRAEBQLIABBAXEEQBAVCyAAIAI7AQALJwAgACABaiIAQYAISUHUhgEoAgAgAEEEaklyBEAQFAsgACACNgAACzEAIABBKmoiAEGACElB1IYBKAIAIABBBGpJcgRAEBQLIABBAXEEQBAVCyAAQQA2AQALMQAgACABaiIAQYAISUHUhgEoAgAgAEEEaklyBEAQFAsgAEEDcQRAEBULIAAgAjYCAAsnACAAIAFqIgBBgAhJQdSGASgCACAAQQFqSXIEQBAUCyAAIAI8AAALLAAgAEGACElB1IYBKAIAIABBAmpJcgRAEBQLIABBAXEEQBAVCyAAIAE9AQALMQAgACABaiIAQYAISUHUhgEoAgAgAEEEaklyBEAQFAsgAEEDcQRAEBULIAAgAj4CAAsxACAAIAFqIgBBgAhJQdSGASgCACAAQQhqSXIEQBAUCyAAQQNxBEAQFQsgACACNwIACzEAIAAgAWoiAEGACElB1IYBKAIAIABBCGpJcgRAEBQLIABBB3EEQBAVCyAAIAI3AwALLAAgAEGACElB1IYBKAIAIABBBGpJcgRAEBQLIABBA3EEQBAVCyAAIAE4AgALMQAgACABaiIAQYAISUHUhgEoAgAgAEEIaklyBEAQFAsgAEEHcQRAEBULIAAgAjkDAAsLg2Q1AEGACAuEEkhlbGxvV29ybGQAaGVsbG9BdWRpbwAAAEA/AAB2aQAAQD8AALg/AAC4PwAAoD8AAHZpaWlpAGhlbGxvIHdvcmxkAGhlbGxvIHBpcm50ZgoAdm9pZABib29sAGNoYXIAc2lnbmVkIGNoYXIAdW5zaWduZWQgY2hhcgBzaG9ydAB1bnNpZ25lZCBzaG9ydABpbnQAdW5zaWduZWQgaW50AGxvbmcAdW5zaWduZWQgbG9uZwBmbG9hdABkb3VibGUAc3RkOjpzdHJpbmcAc3RkOjpiYXNpY19zdHJpbmc8dW5zaWduZWQgY2hhcj4Ac3RkOjp3c3RyaW5nAHN0ZDo6dTE2c3RyaW5nAHN0ZDo6dTMyc3RyaW5nAGVtc2NyaXB0ZW46OnZhbABlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgY2hhcj4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8c2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIHNob3J0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVuc2lnbmVkIGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8bG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgbG9uZz4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50OF90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MTZfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dWludDMyX3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGZsb2F0PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxkb3VibGU+AE5TdDNfXzIxMmJhc2ljX3N0cmluZ0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVOU185YWxsb2NhdG9ySWNFRUVFAE5TdDNfXzIyMV9fYmFzaWNfc3RyaW5nX2NvbW1vbklMYjFFRUUAAOA/AAClBwAAZEAAAGYHAAAAAAAAAQAAAMwHAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSWhOU18xMWNoYXJfdHJhaXRzSWhFRU5TXzlhbGxvY2F0b3JJaEVFRUUAAGRAAADsBwAAAAAAAAEAAADMBwAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVOU185YWxsb2NhdG9ySXdFRUVFAABkQAAARAgAAAAAAAABAAAAzAcAAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJRHNOU18xMWNoYXJfdHJhaXRzSURzRUVOU185YWxsb2NhdG9ySURzRUVFRQAAAGRAAACcCAAAAAAAAAEAAADMBwAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEaU5TXzExY2hhcl90cmFpdHNJRGlFRU5TXzlhbGxvY2F0b3JJRGlFRUVFAAAAZEAAAPgIAAAAAAAAAQAAAMwHAAAAAAAATjEwZW1zY3JpcHRlbjN2YWxFAADgPwAAVAkAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWNFRQAA4D8AAHAJAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lhRUUAAOA/AACYCQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaEVFAADgPwAAwAkAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXNFRQAA4D8AAOgJAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0l0RUUAAOA/AAAQCgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJaUVFAADgPwAAOAoAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWpFRQAA4D8AAGAKAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lsRUUAAOA/AACICgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJbUVFAADgPwAAsAoAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWZFRQAA4D8AANgKAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lkRUUAAOA/AAAACwAAuEAAAEhBAADgQQAAAAAAAIwLAAAPAAAAEAAAABEAAAASAAAAEwAAABQAAAAVAAAAFgAAABcAAAAYAAAAGQAAABoAAAAbAAAAHAAAAE5TdDNfXzIxMF9fc3RkaW5idWZJY0VFAAhAAAB0CwAA6BEAAHVuc3VwcG9ydGVkIGxvY2FsZSBmb3Igc3RhbmRhcmQgaW5wdXQAAAAAAAAAGAwAAB0AAAAeAAAAHwAAACAAAAAhAAAAIgAAACMAAAAkAAAAJQAAACYAAAAnAAAAKAAAACkAAAAqAAAATlN0M19fMjEwX19zdGRpbmJ1Zkl3RUUACEAAAAAMAAAkEgAAAAAAAIAMAAAPAAAAKwAAACwAAAASAAAAEwAAABQAAAAtAAAAFgAAABcAAAAuAAAALwAAADAAAAAxAAAAMgAAAE5TdDNfXzIxMV9fc3Rkb3V0YnVmSWNFRQAAAAAIQAAAZAwAAOgRAAAAAAAA6AwAAB0AAAAzAAAANAAAACAAAAAhAAAAIgAAADUAAAAkAAAAJQAAADYAAAA3AAAAOAAAADkAAAA6AAAATlN0M19fMjExX19zdGRvdXRidWZJd0VFAAAAAAhAAADMDAAAJBIAAC0rICAgMFgweAAobnVsbCkAQZAaC0ERAAoAERERAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABEADwoREREDCgcAAQAJCwsAAAkGCwAACwAGEQAAABEREQBB4RoLIQsAAAAAAAAAABEACgoREREACgAAAgAJCwAAAAkACwAACwBBmxsLAQwAQacbCxUMAAAAAAwAAAAACQwAAAAAAAwAAAwAQdUbCwEOAEHhGwsVDQAAAAQNAAAAAAkOAAAAAAAOAAAOAEGPHAsBEABBmxwLHg8AAAAADwAAAAAJEAAAAAAAEAAAEAAAEgAAABISEgBB0hwLDhIAAAASEhIAAAAAAAAJAEGDHQsBCwBBjx0LFQoAAAAACgAAAAAJCwAAAAAACwAACwBBvR0LAQwAQckdC0sMAAAAAAwAAAAACQwAAAAAAAwAAAwAADAxMjM0NTY3ODlBQkNERUYtMFgrMFggMFgtMHgrMHggMHgAaW5mAElORgBuYW4ATkFOAC4AQbweCwE9AEHjHgsF//////8AQawfC4cM6BEAAA8AAAA+AAAAPwAAABIAAAATAAAAFAAAABUAAAAWAAAAFwAAAC4AAAAvAAAAMAAAABsAAAAcAAAAAAAAACQSAAAdAAAAQAAAAEEAAAAgAAAAIQAAACIAAAAjAAAAJAAAACUAAAA2AAAANwAAADgAAAApAAAAKgAAAAgAAAAAAAAAXBIAAEIAAABDAAAA+P////j///9cEgAARAAAAEUAAAA0EAAASBAAAAgAAAAAAAAApBIAAEYAAABHAAAA+P////j///+kEgAASAAAAEkAAABkEAAAeBAAAAQAAAAAAAAA7BIAAEoAAABLAAAA/P////z////sEgAATAAAAE0AAACUEAAAqBAAAAQAAAAAAAAANBMAAE4AAABPAAAA/P////z///80EwAAUAAAAFEAAADEEAAA2BAAAAAAAAAcEQAAUgAAAFMAAABpb3NfYmFzZTo6Y2xlYXIATlN0M19fMjhpb3NfYmFzZUUAAADgPwAACBEAAAAAAABgEQAAVAAAAFUAAABOU3QzX18yOWJhc2ljX2lvc0ljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQAAAAhAAAA0EQAAHBEAAAAAAACoEQAAVgAAAFcAAABOU3QzX18yOWJhc2ljX2lvc0l3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRQAAAAhAAAB8EQAAHBEAAE5TdDNfXzIxNWJhc2ljX3N0cmVhbWJ1ZkljTlNfMTFjaGFyX3RyYWl0c0ljRUVFRQAAAADgPwAAtBEAAE5TdDNfXzIxNWJhc2ljX3N0cmVhbWJ1Zkl3TlNfMTFjaGFyX3RyYWl0c0l3RUVFRQAAAADgPwAA8BEAAE5TdDNfXzIxM2Jhc2ljX2lzdHJlYW1JY05TXzExY2hhcl90cmFpdHNJY0VFRUUAAGRAAAAsEgAAAAAAAAEAAABgEQAAA/T//05TdDNfXzIxM2Jhc2ljX2lzdHJlYW1Jd05TXzExY2hhcl90cmFpdHNJd0VFRUUAAGRAAAB0EgAAAAAAAAEAAACoEQAAA/T//05TdDNfXzIxM2Jhc2ljX29zdHJlYW1JY05TXzExY2hhcl90cmFpdHNJY0VFRUUAAGRAAAC8EgAAAAAAAAEAAABgEQAAA/T//05TdDNfXzIxM2Jhc2ljX29zdHJlYW1Jd05TXzExY2hhcl90cmFpdHNJd0VFRUUAAGRAAAAEEwAAAAAAAAEAAACoEQAAA/T//2luZmluaXR5AG5hbgAAAAAAAAAA0XSeAFedvSqAcFIP//8+JwoAAABkAAAA6AMAABAnAACghgEAQEIPAICWmAAA4fUFGAAAADUAAABxAAAAa////877//+Sv///AAAAAAAAAAD/////////////////////////////////////////////////////////////////AAECAwQFBgcICf////////8KCwwNDg8QERITFBUWFxgZGhscHR4fICEiI////////woLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIj/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wABAgQHAwYFAAAAAAAAAAIAAMADAADABAAAwAUAAMAGAADABwAAwAgAAMAJAADACgAAwAsAAMAMAADADQAAwA4AAMAPAADAEAAAwBEAAMASAADAEwAAwBQAAMAVAADAFgAAwBcAAMAYAADAGQAAwBoAAMAbAADAHAAAwB0AAMAeAADAHwAAwAAAALMBAADDAgAAwwMAAMMEAADDBQAAwwYAAMMHAADDCAAAwwkAAMMKAADDCwAAwwwAAMMNAADTDgAAww8AAMMAAAy7AQAMwwIADMMDAAzDBAAM0wAAAADeEgSVAAAAAP///////////////5AVAAAUAAAAQy5VVEYtOABB2CsLAqQVAEHwKwsGTENfQUxMAEGALAteTENfQ1RZUEUAAAAATENfTlVNRVJJQwAATENfVElNRQAAAAAATENfQ09MTEFURQAATENfTU9ORVRBUlkATENfTUVTU0FHRVMATEFORwBDLlVURi04AFBPU0lYAABgFwBB4C4L/wECAAIAAgACAAIAAgACAAIAAgADIAIgAiACIAIgAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAWAEwATABMAEwATABMAEwATABMAEwATABMAEwATABMAI2AjYCNgI2AjYCNgI2AjYCNgI2ATABMAEwATABMAEwATACNUI1QjVCNUI1QjVCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQjFCMUIxQTABMAEwATABMAEwAjWCNYI1gjWCNYI1gjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYIxgjGCMYEwATABMAEwAIAQeAyCwJwGwBB9DYL+QMBAAAAAgAAAAMAAAAEAAAABQAAAAYAAAAHAAAACAAAAAkAAAAKAAAACwAAAAwAAAANAAAADgAAAA8AAAAQAAAAEQAAABIAAAATAAAAFAAAABUAAAAWAAAAFwAAABgAAAAZAAAAGgAAABsAAAAcAAAAHQAAAB4AAAAfAAAAIAAAACEAAAAiAAAAIwAAACQAAAAlAAAAJgAAACcAAAAoAAAAKQAAACoAAAArAAAALAAA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ZwQcX2VtYmluZF9yZWdpc3Rlcl9zdGRfd3N0cmluZwUWX2VtYmluZF9yZWdpc3Rlcl9lbXZhbAYYX2VtYmluZF9yZWdpc3Rlcl9pbnRlZ2VyBxZfZW1iaW5kX3JlZ2lzdGVyX2Zsb2F0CBxfZW1iaW5kX3JlZ2lzdGVyX21lbW9yeV92aWV3CQ9fX3dhc2lfZmRfY2xvc2UKDl9fd2FzaV9mZF9yZWFkCw9fX3dhc2lfZmRfd3JpdGUMBWFib3J0DRhfX3dhc2lfZW52aXJvbl9zaXplc19nZXQOEl9fd2FzaV9lbnZpcm9uX2dldA8Kc3RyZnRpbWVfbBAWZW1zY3JpcHRlbl9yZXNpemVfaGVhcBEVZW1zY3JpcHRlbl9tZW1jcHlfYmlnEgtzZXRUZW1wUmV0MBMabGVnYWxpbXBvcnQkX193YXNpX2ZkX3NlZWsUCHNlZ2ZhdWx0FQphbGlnbmZhdWx0FhFfX3dhc21fY2FsbF9jdG9ycxdMRW1zY3JpcHRlbkJpbmRpbmdJbml0aWFsaXplcl9Xb3JsZEpTOjpFbXNjcmlwdGVuQmluZGluZ0luaXRpYWxpemVyX1dvcmxkSlMoKRg4dm9pZCBlbXNjcmlwdGVuOjpmdW5jdGlvbjx2b2lkPihjaGFyIGNvbnN0Kiwgdm9pZCAoKikoKSkZzgF2b2lkIGVtc2NyaXB0ZW46OmZ1bmN0aW9uPHZvaWQsIHVuc2lnbmVkIGxvbmcsIHVuc2lnbmVkIGxvbmcsIHVuc2lnbmVkIGludCwgZW1zY3JpcHRlbjo6YWxsb3dfcmF3X3BvaW50ZXJzPihjaGFyIGNvbnN0Kiwgdm9pZCAoKikodW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgaW50KSwgZW1zY3JpcHRlbjo6YWxsb3dfcmF3X3BvaW50ZXJzKRo3ZW1zY3JpcHRlbjo6aW50ZXJuYWw6Okludm9rZXI8dm9pZD46Omludm9rZSh2b2lkICgqKSgpKRu5AWVtc2NyaXB0ZW46OmludGVybmFsOjpJbnZva2VyPHZvaWQsIHVuc2lnbmVkIGxvbmcsIHVuc2lnbmVkIGxvbmcsIHVuc2lnbmVkIGludD46Omludm9rZSh2b2lkICgqKSh1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBpbnQpLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBpbnQpHFNlbXNjcmlwdGVuOjppbnRlcm5hbDo6QmluZGluZ1R5cGU8dW5zaWduZWQgbG9uZywgdm9pZD46OmZyb21XaXJlVHlwZSh1bnNpZ25lZCBsb25nKR0OSGVsbG86OmhlbGxvKCkeugFzdGQ6Ol9fMjo6YmFzaWNfb3N0cmVhbTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiYgc3RkOjpfXzI6Om9wZXJhdG9yPDw8c3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4oc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mLCBjaGFyIGNvbnN0KikfrQFzdGQ6Ol9fMjo6YmFzaWNfb3N0cmVhbTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiYgc3RkOjpfXzI6OmVuZGw8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4oc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mKSDHAXN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+OjpvcGVyYXRvcjw8KHN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+JiAoKikoc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mKSkhMHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPjo6bGVuZ3RoKGNoYXIgY29uc3QqKSLdAXN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+JiBzdGQ6Ol9fMjo6X19wdXRfY2hhcmFjdGVyX3NlcXVlbmNlPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+KHN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+JiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGxvbmcpI0pzdGQ6Ol9fMjo6YmFzaWNfaW9zPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Ojp3aWRlbihjaGFyKSBjb25zdCQ9SGVsbG86OmhlbGxvQXVkaW8odW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgaW50KSVac3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnNlbnRyeTo6b3BlcmF0b3IgYm9vbCgpIGNvbnN0JpQBc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46Om9zdHJlYW1idWZfaXRlcmF0b3Ioc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mKSchc3RkOjpfXzI6Omlvc19iYXNlOjpmbGFncygpIGNvbnN0KEVzdGQ6Ol9fMjo6YmFzaWNfaW9zPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+OjpmaWxsKCkgY29uc3QphQJzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiBzdGQ6Ol9fMjo6X19wYWRfYW5kX291dHB1dDxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPihzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0Kiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhcikqUXN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+OjpmYWlsZWQoKSBjb25zdCtPc3RkOjpfXzI6OmJhc2ljX2lvczxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6c2V0c3RhdGUodW5zaWduZWQgaW50KSwhc3RkOjpfXzI6Omlvc19iYXNlOjp3aWR0aCgpIGNvbnN0LVdzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+OjpzcHV0bihjaGFyIGNvbnN0KiwgbG9uZykueHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46OmJhc2ljX3N0cmluZyh1bnNpZ25lZCBsb25nLCBjaGFyKS9dc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6ZGF0YSgpMB9zdGQ6Ol9fMjo6aW9zX2Jhc2U6OndpZHRoKGxvbmcpMUZzdGQ6Ol9fMjo6YmFzaWNfaW9zPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+OjpyZGJ1ZigpIGNvbnN0MjJzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj46OmVxX2ludF90eXBlKGludCwgaW50KTMqc3RkOjpfXzI6Omlvc19iYXNlOjpzZXRzdGF0ZSh1bnNpZ25lZCBpbnQpNKQCc3RkOjpfXzI6Ol9fY29tcHJlc3NlZF9wYWlyPHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Ol9fcmVwLCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Ol9fY29tcHJlc3NlZF9wYWlyPHN0ZDo6X18yOjpfX2RlZmF1bHRfaW5pdF90YWcsIHN0ZDo6X18yOjpfX2RlZmF1bHRfaW5pdF90YWc+KHN0ZDo6X18yOjpfX2RlZmF1bHRfaW5pdF90YWcmJiwgc3RkOjpfXzI6Ol9fZGVmYXVsdF9pbml0X3RhZyYmKTVmc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19nZXRfcG9pbnRlcigpNr4Bc3RkOjpfXzI6Ol9fY29tcHJlc3NlZF9wYWlyX2VsZW08c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19yZXAsIDAsIGZhbHNlPjo6X19jb21wcmVzc2VkX3BhaXJfZWxlbShzdGQ6Ol9fMjo6X19kZWZhdWx0X2luaXRfdGFnKTd6c3RkOjpfXzI6Ol9fY29tcHJlc3NlZF9wYWlyX2VsZW08c3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiwgMSwgdHJ1ZT46Ol9fY29tcHJlc3NlZF9wYWlyX2VsZW0oc3RkOjpfXzI6Ol9fZGVmYXVsdF9pbml0X3RhZyk4aHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Ol9faXNfbG9uZygpIGNvbnN0OWtzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpfX2dldF9sb25nX3BvaW50ZXIoKTpsc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19nZXRfc2hvcnRfcG9pbnRlcigpO6QBc3RkOjpfXzI6Ol9fY29tcHJlc3NlZF9wYWlyPHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Ol9fcmVwLCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46OmZpcnN0KCkgY29uc3Q8IXN0ZDo6X18yOjppb3NfYmFzZTo6cmRidWYoKSBjb25zdD1hc3RkOjpfXzI6OmN0eXBlPGNoYXI+IGNvbnN0JiBzdGQ6Ol9fMjo6dXNlX2ZhY2V0PHN0ZDo6X18yOjpjdHlwZTxjaGFyPiA+KHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKT4oc3RkOjpfXzI6OmN0eXBlPGNoYXI+Ojp3aWRlbihjaGFyKSBjb25zdD8NX19nZXRUeXBlTmFtZUAcc3RkOjp0eXBlX2luZm86Om5hbWUoKSBjb25zdEEqX19lbWJpbmRfcmVnaXN0ZXJfbmF0aXZlX2FuZF9idWlsdGluX3R5cGVzQj92b2lkIChhbm9ueW1vdXMgbmFtZXNwYWNlKTo6cmVnaXN0ZXJfaW50ZWdlcjxjaGFyPihjaGFyIGNvbnN0KilDRnZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9pbnRlZ2VyPHNpZ25lZCBjaGFyPihjaGFyIGNvbnN0KilESHZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9pbnRlZ2VyPHVuc2lnbmVkIGNoYXI+KGNoYXIgY29uc3QqKUVAdm9pZCAoYW5vbnltb3VzIG5hbWVzcGFjZSk6OnJlZ2lzdGVyX2ludGVnZXI8c2hvcnQ+KGNoYXIgY29uc3QqKUZJdm9pZCAoYW5vbnltb3VzIG5hbWVzcGFjZSk6OnJlZ2lzdGVyX2ludGVnZXI8dW5zaWduZWQgc2hvcnQ+KGNoYXIgY29uc3QqKUc+dm9pZCAoYW5vbnltb3VzIG5hbWVzcGFjZSk6OnJlZ2lzdGVyX2ludGVnZXI8aW50PihjaGFyIGNvbnN0KilIR3ZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9pbnRlZ2VyPHVuc2lnbmVkIGludD4oY2hhciBjb25zdCopST92b2lkIChhbm9ueW1vdXMgbmFtZXNwYWNlKTo6cmVnaXN0ZXJfaW50ZWdlcjxsb25nPihjaGFyIGNvbnN0KilKSHZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9pbnRlZ2VyPHVuc2lnbmVkIGxvbmc+KGNoYXIgY29uc3QqKUs+dm9pZCAoYW5vbnltb3VzIG5hbWVzcGFjZSk6OnJlZ2lzdGVyX2Zsb2F0PGZsb2F0PihjaGFyIGNvbnN0KilMP3ZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9mbG9hdDxkb3VibGU+KGNoYXIgY29uc3QqKU1Ddm9pZCAoYW5vbnltb3VzIG5hbWVzcGFjZSk6OnJlZ2lzdGVyX21lbW9yeV92aWV3PGNoYXI+KGNoYXIgY29uc3QqKU5Kdm9pZCAoYW5vbnltb3VzIG5hbWVzcGFjZSk6OnJlZ2lzdGVyX21lbW9yeV92aWV3PHNpZ25lZCBjaGFyPihjaGFyIGNvbnN0KilPTHZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9tZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPihjaGFyIGNvbnN0KilQRHZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9tZW1vcnlfdmlldzxzaG9ydD4oY2hhciBjb25zdCopUU12b2lkIChhbm9ueW1vdXMgbmFtZXNwYWNlKTo6cmVnaXN0ZXJfbWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+KGNoYXIgY29uc3QqKVJCdm9pZCAoYW5vbnltb3VzIG5hbWVzcGFjZSk6OnJlZ2lzdGVyX21lbW9yeV92aWV3PGludD4oY2hhciBjb25zdCopU0t2b2lkIChhbm9ueW1vdXMgbmFtZXNwYWNlKTo6cmVnaXN0ZXJfbWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PihjaGFyIGNvbnN0KilUQ3ZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9tZW1vcnlfdmlldzxsb25nPihjaGFyIGNvbnN0KilVTHZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9tZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPihjaGFyIGNvbnN0KilWRHZvaWQgKGFub255bW91cyBuYW1lc3BhY2UpOjpyZWdpc3Rlcl9tZW1vcnlfdmlldzxmbG9hdD4oY2hhciBjb25zdCopV0V2b2lkIChhbm9ueW1vdXMgbmFtZXNwYWNlKTo6cmVnaXN0ZXJfbWVtb3J5X3ZpZXc8ZG91YmxlPihjaGFyIGNvbnN0KilYbkVtc2NyaXB0ZW5CaW5kaW5nSW5pdGlhbGl6ZXJfbmF0aXZlX2FuZF9idWlsdGluX3R5cGVzOjpFbXNjcmlwdGVuQmluZGluZ0luaXRpYWxpemVyX25hdGl2ZV9hbmRfYnVpbHRpbl90eXBlcygpWQhfX3N0cmR1cFoFZHVtbXlbDV9fc3RkaW9fY2xvc2VcEF9fZXJybm9fbG9jYXRpb25dEl9fd2FzaV9zeXNjYWxsX3JldF4MX19zdGRpb19yZWFkXwxfX3N0ZGlvX3NlZWtgDV9fc3RkaW9fd3JpdGVhGV9fZW1zY3JpcHRlbl9zdGRvdXRfY2xvc2ViGF9fZW1zY3JpcHRlbl9zdGRvdXRfc2Vla2MGX19sb2NrZAhfX3RvcmVhZGUGdW5nZXRjZgdfX3VmbG93ZwRnZXRjaAZmZmx1c2hpEV9fZmZsdXNoX3VubG9ja2VkaiBzdGQ6Ol9fMjo6RG9JT1NJbml0OjpEb0lPU0luaXQoKWs/c3RkOjpfXzI6Ol9fc3RkaW5idWY8Y2hhcj46Ol9fc3RkaW5idWYoX0lPX0ZJTEUqLCBfX21ic3RhdGVfdCopbIoBc3RkOjpfXzI6OmJhc2ljX2lzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OmJhc2ljX2lzdHJlYW0oc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiopbUJzdGQ6Ol9fMjo6X19zdGRpbmJ1Zjx3Y2hhcl90Pjo6X19zdGRpbmJ1ZihfSU9fRklMRSosIF9fbWJzdGF0ZV90KilulgFzdGQ6Ol9fMjo6YmFzaWNfaXN0cmVhbTx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPjo6YmFzaWNfaXN0cmVhbShzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+KilvQXN0ZDo6X18yOjpfX3N0ZG91dGJ1ZjxjaGFyPjo6X19zdGRvdXRidWYoX0lPX0ZJTEUqLCBfX21ic3RhdGVfdCopcIoBc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OmJhc2ljX29zdHJlYW0oc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiopcURzdGQ6Ol9fMjo6X19zdGRvdXRidWY8d2NoYXJfdD46Ol9fc3Rkb3V0YnVmKF9JT19GSUxFKiwgX19tYnN0YXRlX3QqKXKWAXN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+OjpiYXNpY19vc3RyZWFtKHN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4qKXN6c3RkOjpfXzI6OmJhc2ljX2lvczxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6dGllKHN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Kil0TXN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OmdldGxvYygpIGNvbnN0dURzdGQ6Ol9fMjo6YmFzaWNfaW9zPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+OjpiYXNpY19pb3MoKXZ9c3RkOjpfXzI6OmJhc2ljX2lvczxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6aW5pdChzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Kil3SnN0ZDo6X18yOjpiYXNpY19pb3M8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID46OmJhc2ljX2lvcygpeIsBc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhciwgY2hhciwgX19tYnN0YXRlX3Q+IGNvbnN0JiBzdGQ6Ol9fMjo6dXNlX2ZhY2V0PHN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIsIGNoYXIsIF9fbWJzdGF0ZV90PiA+KHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKXlBc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhciwgY2hhciwgX19tYnN0YXRlX3Q+OjphbHdheXNfbm9jb252KCkgY29uc3R6kQFzdGQ6Ol9fMjo6Y29kZWN2dDx3Y2hhcl90LCBjaGFyLCBfX21ic3RhdGVfdD4gY29uc3QmIHN0ZDo6X18yOjp1c2VfZmFjZXQ8c3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+ID4oc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYpeyZzdGQ6Ol9fMjo6aW9zX2Jhc2U6OnNldGYodW5zaWduZWQgaW50KXwZX19jeHhfZ2xvYmFsX2FycmF5X2R0b3IuMX0pc3RkOjpfXzI6Ol9fc3RkaW5idWY8Y2hhcj46On5fX3N0ZGluYnVmKCl+OnN0ZDo6X18yOjpfX3N0ZGluYnVmPGNoYXI+OjppbWJ1ZShzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0Jil/PHN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZW5jb2RpbmcoKSBjb25zdIABJ3N0ZDo6X18yOjpfX3N0ZGluYnVmPGNoYXI+Ojp1bmRlcmZsb3coKYEBK3N0ZDo6X18yOjpfX3N0ZGluYnVmPGNoYXI+OjpfX2dldGNoYXIoYm9vbCmCASNzdGQ6Ol9fMjo6X19zdGRpbmJ1ZjxjaGFyPjo6dWZsb3coKYMBKnN0ZDo6X18yOjpfX3N0ZGluYnVmPGNoYXI+OjpwYmFja2ZhaWwoaW50KYQBLnN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPjo6dG9fY2hhcl90eXBlKGludCmFAYEBc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhciwgY2hhciwgX19tYnN0YXRlX3Q+OjpvdXQoX19tYnN0YXRlX3QmLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqJiwgY2hhciosIGNoYXIqLCBjaGFyKiYpIGNvbnN0hgE1aW50IGNvbnN0JiBzdGQ6Ol9fMjo6bWF4PGludD4oaW50IGNvbnN0JiwgaW50IGNvbnN0JimHAYABc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhciwgY2hhciwgX19tYnN0YXRlX3Q+OjppbihfX21ic3RhdGVfdCYsIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdComLCBjaGFyKiwgY2hhciosIGNoYXIqJikgY29uc3SIAS5zdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj46OnRvX2ludF90eXBlKGNoYXIpiQFuaW50IGNvbnN0JiBzdGQ6Ol9fMjo6bWF4PGludCwgc3RkOjpfXzI6Ol9fbGVzczxpbnQsIGludD4gPihpbnQgY29uc3QmLCBpbnQgY29uc3QmLCBzdGQ6Ol9fMjo6X19sZXNzPGludCwgaW50PimKAURzdGQ6Ol9fMjo6X19sZXNzPGludCwgaW50Pjo6b3BlcmF0b3IoKShpbnQgY29uc3QmLCBpbnQgY29uc3QmKSBjb25zdIsBHnN0ZDo6X18yOjppb3NfYmFzZTo6aW9zX2Jhc2UoKYwBLHN0ZDo6X18yOjpfX3N0ZGluYnVmPHdjaGFyX3Q+Ojp+X19zdGRpbmJ1ZigpjQE9c3RkOjpfXzI6Ol9fc3RkaW5idWY8d2NoYXJfdD46OmltYnVlKHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKY4BKnN0ZDo6X18yOjpfX3N0ZGluYnVmPHdjaGFyX3Q+Ojp1bmRlcmZsb3coKY8BLnN0ZDo6X18yOjpfX3N0ZGluYnVmPHdjaGFyX3Q+OjpfX2dldGNoYXIoYm9vbCmQASZzdGQ6Ol9fMjo6X19zdGRpbmJ1Zjx3Y2hhcl90Pjo6dWZsb3coKZEBNnN0ZDo6X18yOjpfX3N0ZGluYnVmPHdjaGFyX3Q+OjpwYmFja2ZhaWwodW5zaWduZWQgaW50KZIBR3N0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Pjo6ZXFfaW50X3R5cGUodW5zaWduZWQgaW50LCB1bnNpZ25lZCBpbnQpkwE7c3RkOjpfXzI6Ol9fc3Rkb3V0YnVmPGNoYXI+OjppbWJ1ZShzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0JimUASNzdGQ6Ol9fMjo6X19zdGRvdXRidWY8Y2hhcj46OnN5bmMoKZUBNnN0ZDo6X18yOjpfX3N0ZG91dGJ1ZjxjaGFyPjo6eHNwdXRuKGNoYXIgY29uc3QqLCBsb25nKZYBKnN0ZDo6X18yOjpfX3N0ZG91dGJ1ZjxjaGFyPjo6b3ZlcmZsb3coaW50KZcBPnN0ZDo6X18yOjpfX3N0ZG91dGJ1Zjx3Y2hhcl90Pjo6aW1idWUoc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYpmAE8c3RkOjpfXzI6Ol9fc3Rkb3V0YnVmPHdjaGFyX3Q+Ojp4c3B1dG4od2NoYXJfdCBjb25zdCosIGxvbmcpmQE2c3RkOjpfXzI6Ol9fc3Rkb3V0YnVmPHdjaGFyX3Q+OjpvdmVyZmxvdyh1bnNpZ25lZCBpbnQpmgEHd21lbWNweZsBB2lzZGlnaXScAQZtZW1jaHKdAQd3Y3J0b21ingEGd2N0b21inwEFZnJleHCgAQlfX2FzaGx0aTOhAQlfX2xzaHJ0aTOiAQxfX3RydW5jdGZkZjKjARNfX3ZmcHJpbnRmX2ludGVybmFspAELcHJpbnRmX2NvcmWlAQNvdXSmAQZnZXRpbnSnAQdwb3BfYXJnqAEFZm10X3ipAQVmbXRfb6oBBWZtdF91qwEDcGFkrAEIdmZwcmludGatAQZmbXRfZnCuARNwb3BfYXJnX2xvbmdfZG91YmxlrwEJdnNucHJpbnRmsAEIc25fd3JpdGWxAQhzbnByaW50ZrIBZHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46OmVtcHR5KCkgY29uc3SzAWNzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpzaXplKCkgY29uc3S0AV9zdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpfX3plcm8oKbUBbnN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Ol9fZ2V0X2xvbmdfc2l6ZSgpIGNvbnN0tgFvc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19nZXRfc2hvcnRfc2l6ZSgpIGNvbnN0twFsc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19nZXRfcG9pbnRlcigpIGNvbnN0uAFxc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19nZXRfbG9uZ19wb2ludGVyKCkgY29uc3S5AUVzdGQ6Ol9fMjo6YmFzaWNfaW9zPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Ojp+YmFzaWNfaW9zKCm6AR9zdGQ6Ol9fMjo6aW9zX2Jhc2U6On5pb3NfYmFzZSgpuwE/c3RkOjpfXzI6Omlvc19iYXNlOjpfX2NhbGxfY2FsbGJhY2tzKHN0ZDo6X18yOjppb3NfYmFzZTo6ZXZlbnQpvAFHc3RkOjpfXzI6OmJhc2ljX2lvczxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6fmJhc2ljX2lvcygpLjG9AVFzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Ojp+YmFzaWNfc3RyZWFtYnVmKCm+AVNzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Ojp+YmFzaWNfc3RyZWFtYnVmKCkuMb8BUHN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OmJhc2ljX3N0cmVhbWJ1ZigpwAFdc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6aW1idWUoc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYpwQFSc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6c2V0YnVmKGNoYXIqLCBsb25nKcIBfHN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnNlZWtvZmYobG9uZyBsb25nLCBzdGQ6Ol9fMjo6aW9zX2Jhc2U6OnNlZWtkaXIsIHVuc2lnbmVkIGludCnDASxzdGQ6Ol9fMjo6ZnBvczxfX21ic3RhdGVfdD46OmZwb3MobG9uZyBsb25nKcQBcXN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnNlZWtwb3Moc3RkOjpfXzI6OmZwb3M8X19tYnN0YXRlX3Q+LCB1bnNpZ25lZCBpbnQpxQFSc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6eHNnZXRuKGNoYXIqLCBsb25nKcYBOWxvbmcgY29uc3QmIHN0ZDo6X18yOjptaW48bG9uZz4obG9uZyBjb25zdCYsIGxvbmcgY29uc3QmKccBRHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPjo6Y29weShjaGFyKiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGxvbmcpyAF2bG9uZyBjb25zdCYgc3RkOjpfXzI6Om1pbjxsb25nLCBzdGQ6Ol9fMjo6X19sZXNzPGxvbmcsIGxvbmc+ID4obG9uZyBjb25zdCYsIGxvbmcgY29uc3QmLCBzdGQ6Ol9fMjo6X19sZXNzPGxvbmcsIGxvbmc+KckBSnN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnVuZGVyZmxvdygpygFGc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6dWZsb3coKcsBTXN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnBiYWNrZmFpbChpbnQpzAFYc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6eHNwdXRuKGNoYXIgY29uc3QqLCBsb25nKc0BV3N0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID46On5iYXNpY19zdHJlYW1idWYoKc4BWXN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID46On5iYXNpY19zdHJlYW1idWYoKS4xzwFWc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1Zjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPjo6YmFzaWNfc3RyZWFtYnVmKCnQAVtzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+Ojp4c2dldG4od2NoYXJfdCosIGxvbmcp0QFNc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+Ojpjb3B5KHdjaGFyX3QqLCB3Y2hhcl90IGNvbnN0KiwgdW5zaWduZWQgbG9uZynSAUxzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+Ojp1Zmxvdygp0wFhc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1Zjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPjo6eHNwdXRuKHdjaGFyX3QgY29uc3QqLCBsb25nKdQBT3N0ZDo6X18yOjpiYXNpY19pc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Ojp+YmFzaWNfaXN0cmVhbSgpLjHVAV52aXJ0dWFsIHRodW5rIHRvIHN0ZDo6X18yOjpiYXNpY19pc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Ojp+YmFzaWNfaXN0cmVhbSgp1gFPc3RkOjpfXzI6OmJhc2ljX2lzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46On5iYXNpY19pc3RyZWFtKCkuMtcBYHZpcnR1YWwgdGh1bmsgdG8gc3RkOjpfXzI6OmJhc2ljX2lzdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46On5iYXNpY19pc3RyZWFtKCkuMdgBRXN0ZDo6X18yOjpiYXNpY19pb3M8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46Omdvb2QoKSBjb25zdNkBRHN0ZDo6X18yOjpiYXNpY19pb3M8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnRpZSgpIGNvbnN02gFEc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OmZsdXNoKCnbASJzdGQ6Ol9fMjo6aW9zX2Jhc2U6OmdldGxvYygpIGNvbnN03AHRAWJvb2wgc3RkOjpfXzI6Om9wZXJhdG9yIT08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gY29uc3QmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiBjb25zdCYp3QFUc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46Om9wZXJhdG9yKigpIGNvbnN03gE1c3RkOjpfXzI6OmN0eXBlPGNoYXI+Ojppcyh1bnNpZ25lZCBzaG9ydCwgY2hhcikgY29uc3TfAU9zdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6b3BlcmF0b3IrKygp4AHRAWJvb2wgc3RkOjpfXzI6Om9wZXJhdG9yPT08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gY29uc3QmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiBjb25zdCYp4QGJAXN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+OjpzZW50cnk6OnNlbnRyeShzdGQ6Ol9fMjo6YmFzaWNfb3N0cmVhbTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiYp4gFOc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnNlbnRyeTo6fnNlbnRyeSgp4wGYAXN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+OjplcXVhbChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiBjb25zdCYpIGNvbnN05AFGc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6c2dldGMoKeUBR3N0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnNidW1wYygp5gFKc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1ZjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6c3B1dGMoY2hhcinnASdzdGQ6Ol9fMjo6aW9zX2Jhc2U6OmNsZWFyKHVuc2lnbmVkIGludCnoAUpzdGQ6Ol9fMjo6YmFzaWNfb3N0cmVhbTx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPjo6Zmx1c2goKekBZ3N0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYgc3RkOjpfXzI6OnVzZV9mYWNldDxzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD4gPihzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0JinqAeMBYm9vbCBzdGQ6Ol9fMjo6b3BlcmF0b3IhPTx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiBjb25zdCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+IGNvbnN0JinrAVpzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPjo6b3BlcmF0b3IqKCkgY29uc3TsATtzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmlzKHVuc2lnbmVkIHNob3J0LCB3Y2hhcl90KSBjb25zdO0BVXN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+OjpvcGVyYXRvcisrKCnuAeMBYm9vbCBzdGQ6Ol9fMjo6b3BlcmF0b3I9PTx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiBjb25zdCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+IGNvbnN0JinvAVVzdGQ6Ol9fMjo6YmFzaWNfaW9zPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+OjpzZXRzdGF0ZSh1bnNpZ25lZCBpbnQp8AGVAXN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+OjpzZW50cnk6OnNlbnRyeShzdGQ6Ol9fMjo6YmFzaWNfb3N0cmVhbTx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiYp8QFgc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID46OnNlbnRyeTo6b3BlcmF0b3IgYm9vbCgpIGNvbnN08gFUc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID46OnNlbnRyeTo6fnNlbnRyeSgp8wGkAXN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+OjplcXVhbChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiBjb25zdCYpIGNvbnN09AFMc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1Zjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPjo6c2dldGMoKfUBTXN0ZDo6X18yOjpiYXNpY19zdHJlYW1idWY8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID46OnNidW1wYygp9gFTc3RkOjpfXzI6OmJhc2ljX3N0cmVhbWJ1Zjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPjo6c3B1dGMod2NoYXJfdCn3AU9zdGQ6Ol9fMjo6YmFzaWNfb3N0cmVhbTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6fmJhc2ljX29zdHJlYW0oKS4x+AFedmlydHVhbCB0aHVuayB0byBzdGQ6Ol9fMjo6YmFzaWNfb3N0cmVhbTxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6fmJhc2ljX29zdHJlYW0oKfkBT3N0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Ojp+YmFzaWNfb3N0cmVhbSgpLjL6AWB2aXJ0dWFsIHRodW5rIHRvIHN0ZDo6X18yOjpiYXNpY19vc3RyZWFtPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Ojp+YmFzaWNfb3N0cmVhbSgpLjH7AVJzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6b3BlcmF0b3I9KGNoYXIp/AFGc3RkOjpfXzI6OmJhc2ljX29zdHJlYW08Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46OnB1dChjaGFyKf0BW3N0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+OjpvcGVyYXRvcj0od2NoYXJfdCn+AWBzdGQ6Ol9fMjo6YmFzaWNfc3RyZWFtYnVmPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+OjpzcHV0bih3Y2hhcl90IGNvbnN0KiwgbG9uZyn/AYABc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6YmFzaWNfc3RyaW5nPHN0ZDo6bnVsbHB0cl90PihjaGFyIGNvbnN0KimAAl11bnNpZ25lZCBsb25nIGNvbnN0JiBzdGQ6Ol9fMjo6bWF4PHVuc2lnbmVkIGxvbmc+KHVuc2lnbmVkIGxvbmcgY29uc3QmLCB1bnNpZ25lZCBsb25nIGNvbnN0JimBAr4BdW5zaWduZWQgbG9uZyBjb25zdCYgc3RkOjpfXzI6Om1heDx1bnNpZ25lZCBsb25nLCBzdGQ6Ol9fMjo6X19sZXNzPHVuc2lnbmVkIGxvbmcsIHVuc2lnbmVkIGxvbmc+ID4odW5zaWduZWQgbG9uZyBjb25zdCYsIHVuc2lnbmVkIGxvbmcgY29uc3QmLCBzdGQ6Ol9fMjo6X19sZXNzPHVuc2lnbmVkIGxvbmcsIHVuc2lnbmVkIGxvbmc+KYICIXN0ZDo6X18yOjppb3NfYmFzZTo6fmlvc19iYXNlKCkuMYMCJnN0ZDo6X18yOjpfX3Rocm93X2ZhaWx1cmUoY2hhciBjb25zdCophAIfc3RkOjpfXzI6Omlvc19iYXNlOjppbml0KHZvaWQqKYUCtQFzdGQ6Ol9fMjo6ZW5hYmxlX2lmPChpc19tb3ZlX2NvbnN0cnVjdGlibGU8dW5zaWduZWQgaW50Pjo6dmFsdWUpICYmIChpc19tb3ZlX2Fzc2lnbmFibGU8dW5zaWduZWQgaW50Pjo6dmFsdWUpLCB2b2lkPjo6dHlwZSBzdGQ6Ol9fMjo6c3dhcDx1bnNpZ25lZCBpbnQ+KHVuc2lnbmVkIGludCYsIHVuc2lnbmVkIGludCYphgJsc3RkOjpfXzI6Ol9fbGVzczx1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nPjo6b3BlcmF0b3IoKSh1bnNpZ25lZCBsb25nIGNvbnN0JiwgdW5zaWduZWQgbG9uZyBjb25zdCYpIGNvbnN0hwJZc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46Ol9fdGVzdF9mb3JfZW9mKCkgY29uc3SIAl9zdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPjo6X190ZXN0X2Zvcl9lb2YoKSBjb25zdIkCK3N0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pjo6d2lkZW4oY2hhcikgY29uc3SKAn1zdGQ6Ol9fMjo6X19jb21wcmVzc2VkX3BhaXJfZWxlbTx2b2lkICgqKSh2b2lkKiksIDEsIGZhbHNlPjo6X19jb21wcmVzc2VkX3BhaXJfZWxlbTx2b2lkICgqKSh2b2lkKiksIHZvaWQ+KHZvaWQgKComJikodm9pZCopKYsCB2lzc3BhY2WMAgdfX3NobGltjQIIX19zaGdldGOOAg1fX2V4dGVuZHNmdGYyjwILX19mbG9hdHNpdGaQAghfX211bHRmM5ECCF9fYWRkdGYzkgINX19leHRlbmRkZnRmMpMCB19fbGV0ZjKUAgdfX2dldGYylQIJY29weXNpZ25slgINX19mbG9hdHVuc2l0ZpcCCF9fc3VidGYzmAIHc2NhbGJubJkCCF9fbXVsdGkzmgIIX19kaXZ0ZjObAgtfX2Zsb2F0c2NhbpwCCGhleGZsb2F0nQIIZGVjZmxvYXSeAgdzY2FuZXhwnwIJX19pbnRzY2FuoAIMX190cnVuY3Rmc2YyoQIHbWJydG93Y6ICB3Zmc2NhbmajAgVhcmdfbqQCCXN0b3JlX2ludKUCDV9fc3RyaW5nX3JlYWSmAgd2c3NjYW5mpwIHZG9fcmVhZKgCBnN0cmNtcKkCIF9fZW1zY3JpcHRlbl9lbnZpcm9uX2NvbnN0cnVjdG9yqgILX19zdHJjaHJudWyrAgdzdHJuY21wrAIGZ2V0ZW52rQIMX19nZXRfbG9jYWxlrgISX19sb2NfaXNfYWxsb2NhdGVkrwILX19uZXdsb2NhbGWwAgl2YXNwcmludGaxAgxfX2lzeGRpZ2l0X2yyAgZzc2NhbmazAgpmcmVlbG9jYWxltAIGd2NzbGVutQIJd2NzcnRvbWJztgIKd2NzbnJ0b21ic7cCCW1ic3J0b3djc7gCCm1ic25ydG93Y3O5AgtfX3VzZWxvY2FsZboCQnN0ZDo6X18yOjpfX3ZlY3Rvcl9iYXNlX2NvbW1vbjx0cnVlPjo6X190aHJvd19sZW5ndGhfZXJyb3IoKSBjb25zdLsCBnN0cnRveLwCCnN0cnRvdWxsX2y9AglzdHJ0b2xsX2y+AgZzdHJ0b2a/AghzdHJ0b3guMcACBnN0cnRvZMECB3N0cnRvbGTCAglzdHJ0b2xkX2zDAiVzdGQ6Ol9fMjo6Y29sbGF0ZTxjaGFyPjo6fmNvbGxhdGUoKS4xxAJdc3RkOjpfXzI6OmNvbGxhdGU8Y2hhcj46OmRvX2NvbXBhcmUoY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCopIGNvbnN0xQJFc3RkOjpfXzI6OmNvbGxhdGU8Y2hhcj46OmRvX3RyYW5zZm9ybShjaGFyIGNvbnN0KiwgY2hhciBjb25zdCopIGNvbnN0xgKQAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46OmJhc2ljX3N0cmluZzxjaGFyIGNvbnN0Kiwgdm9pZD4oY2hhciBjb25zdCosIGNoYXIgY29uc3QqKccC1QFzdGQ6Ol9fMjo6ZW5hYmxlX2lmPF9faXNfY3BwMTdfZm9yd2FyZF9pdGVyYXRvcjxjaGFyIGNvbnN0Kj46OnZhbHVlLCB2b2lkPjo6dHlwZSBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpfX2luaXQ8Y2hhciBjb25zdCo+KGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KinIAkBzdGQ6Ol9fMjo6Y29sbGF0ZTxjaGFyPjo6ZG9faGFzaChjaGFyIGNvbnN0KiwgY2hhciBjb25zdCopIGNvbnN0yQJsc3RkOjpfXzI6OmNvbGxhdGU8d2NoYXJfdD46OmRvX2NvbXBhcmUod2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN0ygJOc3RkOjpfXzI6OmNvbGxhdGU8d2NoYXJfdD46OmRvX3RyYW5zZm9ybSh3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN0ywKiAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46OmJhc2ljX3N0cmluZzx3Y2hhcl90IGNvbnN0Kiwgdm9pZD4od2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqKcwCsAJzdGQ6Ol9fMjo6X19jb21wcmVzc2VkX3BhaXI8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6X19yZXAsIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6X19jb21wcmVzc2VkX3BhaXI8c3RkOjpfXzI6Ol9fZGVmYXVsdF9pbml0X3RhZywgc3RkOjpfXzI6Ol9fZGVmYXVsdF9pbml0X3RhZz4oc3RkOjpfXzI6Ol9fZGVmYXVsdF9pbml0X3RhZyYmLCBzdGQ6Ol9fMjo6X19kZWZhdWx0X2luaXRfdGFnJiYpzQLqAXN0ZDo6X18yOjplbmFibGVfaWY8X19pc19jcHAxN19mb3J3YXJkX2l0ZXJhdG9yPHdjaGFyX3QgY29uc3QqPjo6dmFsdWUsIHZvaWQ+Ojp0eXBlIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Ol9faW5pdDx3Y2hhcl90IGNvbnN0Kj4od2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqKc4CSXN0ZDo6X18yOjpjb2xsYXRlPHdjaGFyX3Q+Ojpkb19oYXNoKHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0KikgY29uc3TPApoCc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgYm9vbCYpIGNvbnN00AIbc3RkOjpfXzI6OmxvY2FsZTo6fmxvY2FsZSgp0QJnc3RkOjpfXzI6Om51bXB1bmN0PGNoYXI+IGNvbnN0JiBzdGQ6Ol9fMjo6dXNlX2ZhY2V0PHN0ZDo6X18yOjpudW1wdW5jdDxjaGFyPiA+KHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKdICKnN0ZDo6X18yOjpudW1wdW5jdDxjaGFyPjo6dHJ1ZW5hbWUoKSBjb25zdNMCK3N0ZDo6X18yOjpudW1wdW5jdDxjaGFyPjo6ZmFsc2VuYW1lKCkgY29uc3TUAqQFc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCogc3RkOjpfXzI6Ol9fc2Nhbl9rZXl3b3JkPHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+IGNvbnN0Kiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+ID4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCosIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4gY29uc3QqLCBzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj4gY29uc3QmLCB1bnNpZ25lZCBpbnQmLCBib29sKdUCOHN0ZDo6X18yOjpsb2NhbGU6OnVzZV9mYWNldChzdGQ6Ol9fMjo6bG9jYWxlOjppZCYpIGNvbnN01gK1A3N0ZDo6X18yOjppdGVyYXRvcl90cmFpdHM8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCo+OjpkaWZmZXJlbmNlX3R5cGUgc3RkOjpfXzI6OmRpc3RhbmNlPHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4gY29uc3QqPihzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+IGNvbnN0Kiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCop1wLMAXN0ZDo6X18yOjp1bmlxdWVfcHRyPHVuc2lnbmVkIGNoYXIsIHZvaWQgKCopKHZvaWQqKT46OnVuaXF1ZV9wdHI8dHJ1ZSwgdm9pZD4odW5zaWduZWQgY2hhciosIHN0ZDo6X18yOjpfX2RlcGVuZGVudF90eXBlPHN0ZDo6X18yOjpfX3VuaXF1ZV9wdHJfZGVsZXRlcl9zZmluYWU8dm9pZCAoKikodm9pZCopPiwgdHJ1ZT46Ol9fZ29vZF9ydmFsX3JlZl90eXBlKdgCS3N0ZDo6X18yOjp1bmlxdWVfcHRyPHVuc2lnbmVkIGNoYXIsIHZvaWQgKCopKHZvaWQqKT46OnJlc2V0KHVuc2lnbmVkIGNoYXIqKdkCKnN0ZDo6X18yOjpjdHlwZTxjaGFyPjo6dG91cHBlcihjaGFyKSBjb25zdNoCdnN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Om9wZXJhdG9yW10odW5zaWduZWQgbG9uZykgY29uc3TbAkNzdGQ6Ol9fMjo6dW5pcXVlX3B0cjx1bnNpZ25lZCBjaGFyLCB2b2lkICgqKSh2b2lkKik+Ojp+dW5pcXVlX3B0cigp3AKaAnN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGxvbmcmKSBjb25zdN0C6wJzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiBzdGQ6Ol9fMjo6bnVtX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2RvX2dldF9zaWduZWQ8bG9uZz4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBsb25nJikgY29uc3TeAjlzdGQ6Ol9fMjo6X19udW1fZ2V0X2Jhc2U6Ol9fZ2V0X2Jhc2Uoc3RkOjpfXzI6Omlvc19iYXNlJinfAkhzdGQ6Ol9fMjo6X19udW1fZ2V0PGNoYXI+OjpfX3N0YWdlMl9pbnRfcHJlcChzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCBjaGFyJingAmVzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpiYXNpY19zdHJpbmcoKeECZ3N0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46OmNhcGFjaXR5KCkgY29uc3TiAmxzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpyZXNpemUodW5zaWduZWQgbG9uZynjAnBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpvcGVyYXRvcltdKHVuc2lnbmVkIGxvbmcp5ALlAXN0ZDo6X18yOjpfX251bV9nZXQ8Y2hhcj46Ol9fc3RhZ2UyX2ludF9sb29wKGNoYXIsIGludCwgY2hhciosIGNoYXIqJiwgdW5zaWduZWQgaW50JiwgY2hhciwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCYsIHVuc2lnbmVkIGludCosIHVuc2lnbmVkIGludComLCBjaGFyIGNvbnN0KinlAlxsb25nIHN0ZDo6X18yOjpfX251bV9nZXRfc2lnbmVkX2ludGVncmFsPGxvbmc+KGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgaW50JiwgaW50KeYCpQFzdGQ6Ol9fMjo6X19jaGVja19ncm91cGluZyhzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+IGNvbnN0JiwgdW5zaWduZWQgaW50KiwgdW5zaWduZWQgaW50KiwgdW5zaWduZWQgaW50JinnAp8Cc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgbG9uZyBsb25nJikgY29uc3ToAvUCc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19kb19nZXRfc2lnbmVkPGxvbmcgbG9uZz4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBsb25nIGxvbmcmKSBjb25zdOkCZmxvbmcgbG9uZyBzdGQ6Ol9fMjo6X19udW1fZ2V0X3NpZ25lZF9pbnRlZ3JhbDxsb25nIGxvbmc+KGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgaW50JiwgaW50KeoCpAJzdGQ6Ol9fMjo6bnVtX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB1bnNpZ25lZCBzaG9ydCYpIGNvbnN06wKBA3N0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+IHN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46Ol9fZG9fZ2V0X3Vuc2lnbmVkPHVuc2lnbmVkIHNob3J0PihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHVuc2lnbmVkIHNob3J0JikgY29uc3TsAnJ1bnNpZ25lZCBzaG9ydCBzdGQ6Ol9fMjo6X19udW1fZ2V0X3Vuc2lnbmVkX2ludGVncmFsPHVuc2lnbmVkIHNob3J0PihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGludCYsIGludCntAqICc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdW5zaWduZWQgaW50JikgY29uc3TuAv0Cc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19kb19nZXRfdW5zaWduZWQ8dW5zaWduZWQgaW50PihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHVuc2lnbmVkIGludCYpIGNvbnN07wJudW5zaWduZWQgaW50IHN0ZDo6X18yOjpfX251bV9nZXRfdW5zaWduZWRfaW50ZWdyYWw8dW5zaWduZWQgaW50PihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGludCYsIGludCnwAqgCc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdW5zaWduZWQgbG9uZyBsb25nJikgY29uc3TxAokDc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19kb19nZXRfdW5zaWduZWQ8dW5zaWduZWQgbG9uZyBsb25nPihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHVuc2lnbmVkIGxvbmcgbG9uZyYpIGNvbnN08gJ6dW5zaWduZWQgbG9uZyBsb25nIHN0ZDo6X18yOjpfX251bV9nZXRfdW5zaWduZWRfaW50ZWdyYWw8dW5zaWduZWQgbG9uZyBsb25nPihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGludCYsIGludCnzApsCc3RkOjpfXzI6Om51bV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgZmxvYXQmKSBjb25zdPQC9QJzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiBzdGQ6Ol9fMjo6bnVtX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2RvX2dldF9mbG9hdGluZ19wb2ludDxmbG9hdD4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBmbG9hdCYpIGNvbnN09QJYc3RkOjpfXzI6Ol9fbnVtX2dldDxjaGFyPjo6X19zdGFnZTJfZmxvYXRfcHJlcChzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCBjaGFyKiwgY2hhciYsIGNoYXImKfYC8AFzdGQ6Ol9fMjo6X19udW1fZ2V0PGNoYXI+OjpfX3N0YWdlMl9mbG9hdF9sb29wKGNoYXIsIGJvb2wmLCBjaGFyJiwgY2hhciosIGNoYXIqJiwgY2hhciwgY2hhciwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCYsIHVuc2lnbmVkIGludCosIHVuc2lnbmVkIGludComLCB1bnNpZ25lZCBpbnQmLCBjaGFyKin3Ak9mbG9hdCBzdGQ6Ol9fMjo6X19udW1fZ2V0X2Zsb2F0PGZsb2F0PihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGludCYp+AKcAnN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGRvdWJsZSYpIGNvbnN0+QL3AnN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+IHN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46Ol9fZG9fZ2V0X2Zsb2F0aW5nX3BvaW50PGRvdWJsZT4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBkb3VibGUmKSBjb25zdPoCUWRvdWJsZSBzdGQ6Ol9fMjo6X19udW1fZ2V0X2Zsb2F0PGRvdWJsZT4oY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBpbnQmKfsCoQJzdGQ6Ol9fMjo6bnVtX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBsb25nIGRvdWJsZSYpIGNvbnN0/AKBA3N0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+IHN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46Ol9fZG9fZ2V0X2Zsb2F0aW5nX3BvaW50PGxvbmcgZG91YmxlPihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGxvbmcgZG91YmxlJikgY29uc3T9Altsb25nIGRvdWJsZSBzdGQ6Ol9fMjo6X19udW1fZ2V0X2Zsb2F0PGxvbmcgZG91YmxlPihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGludCYp/gKbAnN0ZDo6X18yOjpudW1fZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHZvaWQqJikgY29uc3T/AkNzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46OndpZGVuKGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgY2hhciopIGNvbnN0gAMSc3RkOjpfXzI6Ol9fY2xvYygpgQNMc3RkOjpfXzI6Ol9fbGliY3BwX3NzY2FuZl9sKGNoYXIgY29uc3QqLCBfX2xvY2FsZV9zdHJ1Y3QqLCBjaGFyIGNvbnN0KiwgLi4uKYIDbXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Ol9fZ2V0X2xvbmdfY2FwKCkgY29uc3SDA1RjaGFyIGNvbnN0KiBzdGQ6Ol9fMjo6ZmluZDxjaGFyIGNvbnN0KiwgY2hhcj4oY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0JimEA0lzdGQ6Ol9fMjo6X19saWJjcHBfbG9jYWxlX2d1YXJkOjpfX2xpYmNwcF9sb2NhbGVfZ3VhcmQoX19sb2NhbGVfc3RydWN0KiYphQM5c3RkOjpfXzI6Ol9fbGliY3BwX2xvY2FsZV9ndWFyZDo6fl9fbGliY3BwX2xvY2FsZV9ndWFyZCgphgOvAnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGJvb2wmKSBjb25zdIcDbXN0ZDo6X18yOjpudW1wdW5jdDx3Y2hhcl90PiBjb25zdCYgc3RkOjpfXzI6OnVzZV9mYWNldDxzdGQ6Ol9fMjo6bnVtcHVuY3Q8d2NoYXJfdD4gPihzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0JimIA+AFc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPiBjb25zdCogc3RkOjpfXzI6Ol9fc2Nhbl9rZXl3b3JkPHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+IGNvbnN0Kiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+ID4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPiBjb25zdCosIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID4gY29uc3QqLCBzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD4gY29uc3QmLCB1bnNpZ25lZCBpbnQmLCBib29sKYkDMHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pjo6dG91cHBlcih3Y2hhcl90KSBjb25zdIoDbHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46OnNpemUoKSBjb25zdIsDf3N0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Om9wZXJhdG9yW10odW5zaWduZWQgbG9uZykgY29uc3SMA21zdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjplbXB0eSgpIGNvbnN0jQOvAnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGxvbmcmKSBjb25zdI4DhgNzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiBzdGQ6Ol9fMjo6bnVtX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2RvX2dldF9zaWduZWQ8bG9uZz4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBsb25nJikgY29uc3SPA01zdGQ6Ol9fMjo6X19udW1fZ2V0PHdjaGFyX3Q+OjpfX2RvX3dpZGVuKHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QqKSBjb25zdJADTnN0ZDo6X18yOjpfX251bV9nZXQ8d2NoYXJfdD46Ol9fc3RhZ2UyX2ludF9wcmVwKHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QmKZED8QFzdGQ6Ol9fMjo6X19udW1fZ2V0PHdjaGFyX3Q+OjpfX3N0YWdlMl9pbnRfbG9vcCh3Y2hhcl90LCBpbnQsIGNoYXIqLCBjaGFyKiYsIHVuc2lnbmVkIGludCYsIHdjaGFyX3QsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4gY29uc3QmLCB1bnNpZ25lZCBpbnQqLCB1bnNpZ25lZCBpbnQqJiwgd2NoYXJfdCBjb25zdCopkgO0AnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGxvbmcgbG9uZyYpIGNvbnN0kwOQA3N0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+IHN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZG9fZ2V0X3NpZ25lZDxsb25nIGxvbmc+KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgbG9uZyBsb25nJikgY29uc3SUA7kCc3RkOjpfXzI6Om51bV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdW5zaWduZWQgc2hvcnQmKSBjb25zdJUDnANzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiBzdGQ6Ol9fMjo6bnVtX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2RvX2dldF91bnNpZ25lZDx1bnNpZ25lZCBzaG9ydD4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB1bnNpZ25lZCBzaG9ydCYpIGNvbnN0lgO3AnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHVuc2lnbmVkIGludCYpIGNvbnN0lwOYA3N0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+IHN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZG9fZ2V0X3Vuc2lnbmVkPHVuc2lnbmVkIGludD4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB1bnNpZ25lZCBpbnQmKSBjb25zdJgDvQJzdGQ6Ol9fMjo6bnVtX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB1bnNpZ25lZCBsb25nIGxvbmcmKSBjb25zdJkDpANzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiBzdGQ6Ol9fMjo6bnVtX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2RvX2dldF91bnNpZ25lZDx1bnNpZ25lZCBsb25nIGxvbmc+KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdW5zaWduZWQgbG9uZyBsb25nJikgY29uc3SaA7ACc3RkOjpfXzI6Om51bV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgZmxvYXQmKSBjb25zdJsDkANzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiBzdGQ6Ol9fMjo6bnVtX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2RvX2dldF9mbG9hdGluZ19wb2ludDxmbG9hdD4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBmbG9hdCYpIGNvbnN0nANkc3RkOjpfXzI6Ol9fbnVtX2dldDx3Y2hhcl90Pjo6X19zdGFnZTJfZmxvYXRfcHJlcChzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90Kiwgd2NoYXJfdCYsIHdjaGFyX3QmKZ0D/wFzdGQ6Ol9fMjo6X19udW1fZ2V0PHdjaGFyX3Q+OjpfX3N0YWdlMl9mbG9hdF9sb29wKHdjaGFyX3QsIGJvb2wmLCBjaGFyJiwgY2hhciosIGNoYXIqJiwgd2NoYXJfdCwgd2NoYXJfdCwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCYsIHVuc2lnbmVkIGludCosIHVuc2lnbmVkIGludComLCB1bnNpZ25lZCBpbnQmLCB3Y2hhcl90KimeA7ECc3RkOjpfXzI6Om51bV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgZG91YmxlJikgY29uc3SfA5IDc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gc3RkOjpfXzI6Om51bV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6X19kb19nZXRfZmxvYXRpbmdfcG9pbnQ8ZG91YmxlPihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGRvdWJsZSYpIGNvbnN0oAO2AnN0ZDo6X18yOjpudW1fZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGxvbmcgZG91YmxlJikgY29uc3ShA5wDc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gc3RkOjpfXzI6Om51bV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6X19kb19nZXRfZmxvYXRpbmdfcG9pbnQ8bG9uZyBkb3VibGU+KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgbG9uZyBkb3VibGUmKSBjb25zdKIDsAJzdGQ6Ol9fMjo6bnVtX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB2b2lkKiYpIGNvbnN0owNJc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojp3aWRlbihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHdjaGFyX3QqKSBjb25zdKQDZndjaGFyX3QgY29uc3QqIHN0ZDo6X18yOjpmaW5kPHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90Pih3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QmKaUDL3N0ZDo6X18yOjpudW1wdW5jdDxjaGFyPjo6ZGVjaW1hbF9wb2ludCgpIGNvbnN0pgMvc3RkOjpfXzI6Om51bXB1bmN0PGNoYXI+Ojp0aG91c2FuZHNfc2VwKCkgY29uc3SnAypzdGQ6Ol9fMjo6bnVtcHVuY3Q8Y2hhcj46Omdyb3VwaW5nKCkgY29uc3SoA2d3Y2hhcl90IGNvbnN0KiBzdGQ6Ol9fMjo6X19udW1fZ2V0PHdjaGFyX3Q+OjpfX2RvX3dpZGVuX3A8d2NoYXJfdD4oc3RkOjpfXzI6Omlvc19iYXNlJiwgd2NoYXJfdCopIGNvbnN0qQPNAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgYm9vbCkgY29uc3SqA15zdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpiZWdpbigpqwNcc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6ZW5kKCmsA2pib29sIHN0ZDo6X18yOjpvcGVyYXRvciE9PGNoYXIqPihzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+IGNvbnN0Jiwgc3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIqPiBjb25zdCYprQMvc3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIqPjo6b3BlcmF0b3IqKCkgY29uc3SuAypzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+OjpvcGVyYXRvcisrKCmvAzBzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+OjpfX3dyYXBfaXRlcihjaGFyKimwA80Bc3RkOjpfXzI6Om51bV9wdXQ8Y2hhciwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCBjaGFyLCBsb25nKSBjb25zdLEDTnN0ZDo6X18yOjpfX251bV9wdXRfYmFzZTo6X19mb3JtYXRfaW50KGNoYXIqLCBjaGFyIGNvbnN0KiwgYm9vbCwgdW5zaWduZWQgaW50KbIDV3N0ZDo6X18yOjpfX2xpYmNwcF9zbnByaW50Zl9sKGNoYXIqLCB1bnNpZ25lZCBsb25nLCBfX2xvY2FsZV9zdHJ1Y3QqLCBjaGFyIGNvbnN0KiwgLi4uKbMDVXN0ZDo6X18yOjpfX251bV9wdXRfYmFzZTo6X19pZGVudGlmeV9wYWRkaW5nKGNoYXIqLCBjaGFyKiwgc3RkOjpfXzI6Omlvc19iYXNlIGNvbnN0Jim0A3VzdGQ6Ol9fMjo6X19udW1fcHV0PGNoYXI+OjpfX3dpZGVuX2FuZF9ncm91cF9pbnQoY2hhciosIGNoYXIqLCBjaGFyKiwgY2hhciosIGNoYXIqJiwgY2hhciomLCBzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0Jim1Ayt2b2lkIHN0ZDo6X18yOjpyZXZlcnNlPGNoYXIqPihjaGFyKiwgY2hhcioptgPSAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgbG9uZyBsb25nKSBjb25zdLcD1gFzdGQ6Ol9fMjo6bnVtX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXIsIHVuc2lnbmVkIGxvbmcpIGNvbnN0uAPbAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgdW5zaWduZWQgbG9uZyBsb25nKSBjb25zdLkDzwFzdGQ6Ol9fMjo6bnVtX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXIsIGRvdWJsZSkgY29uc3S6A0pzdGQ6Ol9fMjo6X19udW1fcHV0X2Jhc2U6Ol9fZm9ybWF0X2Zsb2F0KGNoYXIqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgaW50KbsDJXN0ZDo6X18yOjppb3NfYmFzZTo6cHJlY2lzaW9uKCkgY29uc3S8A0lzdGQ6Ol9fMjo6X19saWJjcHBfYXNwcmludGZfbChjaGFyKiosIF9fbG9jYWxlX3N0cnVjdCosIGNoYXIgY29uc3QqLCAuLi4pvQN3c3RkOjpfXzI6Ol9fbnVtX3B1dDxjaGFyPjo6X193aWRlbl9hbmRfZ3JvdXBfZmxvYXQoY2hhciosIGNoYXIqLCBjaGFyKiwgY2hhciosIGNoYXIqJiwgY2hhciomLCBzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0Jim+Az1zdGQ6Ol9fMjo6X19jb21wcmVzc2VkX3BhaXI8Y2hhciosIHZvaWQgKCopKHZvaWQqKT46OnNlY29uZCgpvwPUAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgbG9uZyBkb3VibGUpIGNvbnN0wAPUAXN0ZDo6X18yOjpudW1fcHV0PGNoYXIsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgY2hhciwgdm9pZCBjb25zdCopIGNvbnN0wQPfAXN0ZDo6X18yOjpudW1fcHV0PHdjaGFyX3QsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgd2NoYXJfdCwgYm9vbCkgY29uc3TCA2dzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpiZWdpbigpwwNlc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6ZW5kKCnEAy1zdGQ6Ol9fMjo6X193cmFwX2l0ZXI8d2NoYXJfdCo+OjpvcGVyYXRvcisrKCnFA29zdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpfX2dldF9wb2ludGVyKCnGA98Bc3RkOjpfXzI6Om51bV9wdXQ8d2NoYXJfdCwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90LCBsb25nKSBjb25zdMcDgQFzdGQ6Ol9fMjo6X19udW1fcHV0PHdjaGFyX3Q+OjpfX3dpZGVuX2FuZF9ncm91cF9pbnQoY2hhciosIGNoYXIqLCBjaGFyKiwgd2NoYXJfdCosIHdjaGFyX3QqJiwgd2NoYXJfdComLCBzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0JinIA6MCc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gc3RkOjpfXzI6Ol9fcGFkX2FuZF9vdXRwdXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4oc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QpyQM0dm9pZCBzdGQ6Ol9fMjo6cmV2ZXJzZTx3Y2hhcl90Kj4od2NoYXJfdCosIHdjaGFyX3QqKcoDhAFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpiYXNpY19zdHJpbmcodW5zaWduZWQgbG9uZywgd2NoYXJfdCnLA+QBc3RkOjpfXzI6Om51bV9wdXQ8d2NoYXJfdCwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90LCBsb25nIGxvbmcpIGNvbnN0zAPoAXN0ZDo6X18yOjpudW1fcHV0PHdjaGFyX3QsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgd2NoYXJfdCwgdW5zaWduZWQgbG9uZykgY29uc3TNA+0Bc3RkOjpfXzI6Om51bV9wdXQ8d2NoYXJfdCwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90LCB1bnNpZ25lZCBsb25nIGxvbmcpIGNvbnN0zgPhAXN0ZDo6X18yOjpudW1fcHV0PHdjaGFyX3QsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgd2NoYXJfdCwgZG91YmxlKSBjb25zdM8DgwFzdGQ6Ol9fMjo6X19udW1fcHV0PHdjaGFyX3Q+OjpfX3dpZGVuX2FuZF9ncm91cF9mbG9hdChjaGFyKiwgY2hhciosIGNoYXIqLCB3Y2hhcl90Kiwgd2NoYXJfdComLCB3Y2hhcl90KiYsIHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKdAD5gFzdGQ6Ol9fMjo6bnVtX3B1dDx3Y2hhcl90LCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QsIGxvbmcgZG91YmxlKSBjb25zdNED5gFzdGQ6Ol9fMjo6bnVtX3B1dDx3Y2hhcl90LCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QsIHZvaWQgY29uc3QqKSBjb25zdNIDU3ZvaWQgc3RkOjpfXzI6Ol9fcmV2ZXJzZTxjaGFyKj4oY2hhciosIGNoYXIqLCBzdGQ6Ol9fMjo6cmFuZG9tX2FjY2Vzc19pdGVyYXRvcl90YWcp0wNcdm9pZCBzdGQ6Ol9fMjo6X19yZXZlcnNlPHdjaGFyX3QqPih3Y2hhcl90Kiwgd2NoYXJfdCosIHN0ZDo6X18yOjpyYW5kb21fYWNjZXNzX2l0ZXJhdG9yX3RhZynUA7ACc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmdldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHRtKiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqKSBjb25zdNUDL3N0ZDo6X18yOjpjdHlwZTxjaGFyPjo6bmFycm93KGNoYXIsIGNoYXIpIGNvbnN01gNzc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX2RhdGVfb3JkZXIoKSBjb25zdNcDngJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fZ2V0X3RpbWUoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSopIGNvbnN02AOeAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojpkb19nZXRfZGF0ZShzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHRtKikgY29uc3TZA6ECc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX2dldF93ZWVrZGF5KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qKSBjb25zdNoDrwJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19nZXRfd2Vla2RheW5hbWUoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+IGNvbnN0JikgY29uc3TbA6MCc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX2dldF9tb250aG5hbWUoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSopIGNvbnN03AOtAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2dldF9tb250aG5hbWUoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+IGNvbnN0JikgY29uc3TdA54Cc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX2dldF95ZWFyKHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qKSBjb25zdN4DqAJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19nZXRfeWVhcihpbnQmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj4gY29uc3QmKSBjb25zdN8DpQJpbnQgc3RkOjpfXzI6Ol9fZ2V0X3VwX3RvX25fZGlnaXRzPGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID4oc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+IGNvbnN0JiwgaW50KeADpQJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fZ2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qLCBjaGFyLCBjaGFyKSBjb25zdOEDpwJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19nZXRfZGF5KGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYpIGNvbnN04gOoAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2dldF9ob3VyKGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYpIGNvbnN04wOrAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2dldF8xMl9ob3VyKGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYpIGNvbnN05AOwAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2dldF9kYXlfeWVhcl9udW0oaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+IGNvbnN0JikgY29uc3TlA6kCc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46Ol9fZ2V0X21vbnRoKGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYpIGNvbnN05gOqAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2dldF9taW51dGUoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+IGNvbnN0JikgY29uc3TnA6kCc3RkOjpfXzI6OnRpbWVfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46Ol9fZ2V0X3doaXRlX3NwYWNlKHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYpIGNvbnN06AOpAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2dldF9hbV9wbShpbnQmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj4gY29uc3QmKSBjb25zdOkDqgJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19nZXRfc2Vjb25kKGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYpIGNvbnN06gOrAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2dldF93ZWVrZGF5KGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYpIGNvbnN06wOpAnN0ZDo6X18yOjp0aW1lX2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+OjpfX2dldF95ZWFyNChpbnQmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj4gY29uc3QmKSBjb25zdOwDpQJzdGQ6Ol9fMjo6dGltZV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19nZXRfcGVyY2VudChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj4gY29uc3QmKSBjb25zdO0DywJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6Z2V0KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN07gM1c3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+OjpuYXJyb3cod2NoYXJfdCwgY2hhcikgY29uc3TvA7MCc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX2dldF90aW1lKHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6Omlvc19iYXNlJiwgdW5zaWduZWQgaW50JiwgdG0qKSBjb25zdPADswJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fZ2V0X2RhdGUoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSopIGNvbnN08QNxc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6X19pc19sb25nKCkgY29uc3TyA3dzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpfX2dldF9sb25nX3NpemUoKSBjb25zdPMDeHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Ol9fZ2V0X3Nob3J0X3NpemUoKSBjb25zdPQDtgJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fZ2V0X3dlZWtkYXkoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSopIGNvbnN09QPHAnN0ZDo6X18yOjp0aW1lX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2dldF93ZWVrZGF5bmFtZShpbnQmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD4gY29uc3QmKSBjb25zdPYDuAJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fZ2V0X21vbnRobmFtZShzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHRtKikgY29uc3T3A8UCc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZ2V0X21vbnRobmFtZShpbnQmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD4gY29uc3QmKSBjb25zdPgDswJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fZ2V0X3llYXIoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSopIGNvbnN0+QPAAnN0ZDo6X18yOjp0aW1lX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2dldF95ZWFyKGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYpIGNvbnN0+gO9AmludCBzdGQ6Ol9fMjo6X19nZXRfdXBfdG9fbl9kaWdpdHM8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPihzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD4gY29uc3QmLCBpbnQp+wO6AnN0ZDo6X18yOjp0aW1lX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCB0bSosIGNoYXIsIGNoYXIpIGNvbnN0/AO/AnN0ZDo6X18yOjp0aW1lX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2dldF9kYXkoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JikgY29uc3T9A8ACc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZ2V0X2hvdXIoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JikgY29uc3T+A8MCc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZ2V0XzEyX2hvdXIoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JikgY29uc3T/A8gCc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZ2V0X2RheV95ZWFyX251bShpbnQmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD4gY29uc3QmKSBjb25zdIAEwQJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6X19nZXRfbW9udGgoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JikgY29uc3SBBMICc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZ2V0X21pbnV0ZShpbnQmLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD4gY29uc3QmKSBjb25zdIIEwQJzdGQ6Ol9fMjo6dGltZV9nZXQ8d2NoYXJfdCwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6X19nZXRfd2hpdGVfc3BhY2Uoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JikgY29uc3SDBMECc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZ2V0X2FtX3BtKGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYpIGNvbnN0hATCAnN0ZDo6X18yOjp0aW1lX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2dldF9zZWNvbmQoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JikgY29uc3SFBMMCc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZ2V0X3dlZWtkYXkoaW50Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgdW5zaWduZWQgaW50Jiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0JikgY29uc3SGBMECc3RkOjpfXzI6OnRpbWVfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46Ol9fZ2V0X3llYXI0KGludCYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYpIGNvbnN0hwS9AnN0ZDo6X18yOjp0aW1lX2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2dldF9wZXJjZW50KHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+Jiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYpIGNvbnN0iATfAXN0ZDo6X18yOjp0aW1lX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXIsIHRtIGNvbnN0KiwgY2hhciwgY2hhcikgY29uc3SJBEpzdGQ6Ol9fMjo6X190aW1lX3B1dDo6X19kb19wdXQoY2hhciosIGNoYXIqJiwgdG0gY29uc3QqLCBjaGFyLCBjaGFyKSBjb25zdIoEjQFzdGQ6Ol9fMjo6ZW5hYmxlX2lmPChpc19tb3ZlX2NvbnN0cnVjdGlibGU8Y2hhcj46OnZhbHVlKSAmJiAoaXNfbW92ZV9hc3NpZ25hYmxlPGNoYXI+Ojp2YWx1ZSksIHZvaWQ+Ojp0eXBlIHN0ZDo6X18yOjpzd2FwPGNoYXI+KGNoYXImLCBjaGFyJimLBFZ1bnNpZ25lZCBsb25nIHN0ZDo6X18yOjooYW5vbnltb3VzIG5hbWVzcGFjZSk6OmNvdW50b2Y8Y2hhcj4oY2hhciBjb25zdCosIGNoYXIgY29uc3QqKYwE8QFzdGQ6Ol9fMjo6dGltZV9wdXQ8d2NoYXJfdCwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gPjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB3Y2hhcl90LCB0bSBjb25zdCosIGNoYXIsIGNoYXIpIGNvbnN0jQRQc3RkOjpfXzI6Ol9fdGltZV9wdXQ6Ol9fZG9fcHV0KHdjaGFyX3QqLCB3Y2hhcl90KiYsIHRtIGNvbnN0KiwgY2hhciwgY2hhcikgY29uc3SOBF91bnNpZ25lZCBsb25nIHN0ZDo6X18yOjooYW5vbnltb3VzIG5hbWVzcGFjZSk6OmNvdW50b2Y8d2NoYXJfdD4od2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqKY8EZXN0ZDo6X18yOjpfX2xpYmNwcF9tYnNydG93Y3NfbCh3Y2hhcl90KiwgY2hhciBjb25zdCoqLCB1bnNpZ25lZCBsb25nLCBfX21ic3RhdGVfdCosIF9fbG9jYWxlX3N0cnVjdCopkAQ7c3RkOjpfXzI6Om1vbmV5cHVuY3Q8Y2hhciwgZmFsc2U+Ojpkb19kZWNpbWFsX3BvaW50KCkgY29uc3SRBDZzdGQ6Ol9fMjo6bW9uZXlwdW5jdDxjaGFyLCBmYWxzZT46OmRvX2dyb3VwaW5nKCkgY29uc3SSBDtzdGQ6Ol9fMjo6bW9uZXlwdW5jdDxjaGFyLCBmYWxzZT46OmRvX25lZ2F0aXZlX3NpZ24oKSBjb25zdJMEOHN0ZDo6X18yOjptb25leXB1bmN0PGNoYXIsIGZhbHNlPjo6ZG9fcG9zX2Zvcm1hdCgpIGNvbnN0lAQ+c3RkOjpfXzI6Om1vbmV5cHVuY3Q8d2NoYXJfdCwgZmFsc2U+Ojpkb19kZWNpbWFsX3BvaW50KCkgY29uc3SVBDxzdGQ6Ol9fMjo6bW9uZXlwdW5jdDx3Y2hhcl90LCBmYWxzZT46OmRvX2N1cnJfc3ltYm9sKCkgY29uc3SWBG5zdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpiYXNpY19zdHJpbmcoKZcEaHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Ol9femVybygpmAQ+c3RkOjpfXzI6Om1vbmV5cHVuY3Q8d2NoYXJfdCwgZmFsc2U+Ojpkb19uZWdhdGl2ZV9zaWduKCkgY29uc3SZBKkCc3RkOjpfXzI6Om1vbmV5X2dldDxjaGFyLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBib29sLCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBsb25nIGRvdWJsZSYpIGNvbnN0mgSMA3N0ZDo6X18yOjptb25leV9nZXQ8Y2hhciwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6X19kb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgYm9vbCwgc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYsIHVuc2lnbmVkIGludCwgdW5zaWduZWQgaW50JiwgYm9vbCYsIHN0ZDo6X18yOjpjdHlwZTxjaGFyPiBjb25zdCYsIHN0ZDo6X18yOjp1bmlxdWVfcHRyPGNoYXIsIHZvaWQgKCopKHZvaWQqKT4mLCBjaGFyKiYsIGNoYXIqKZsE3QNzdGQ6Ol9fMjo6X19tb25leV9nZXQ8Y2hhcj46Ol9fZ2F0aGVyX2luZm8oYm9vbCwgc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYsIHN0ZDo6X18yOjptb25leV9iYXNlOjpwYXR0ZXJuJiwgY2hhciYsIGNoYXImLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+JiwgaW50JimcBFJzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPjo6b3BlcmF0b3IrKyhpbnQpnQRdc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID46Ol9fcHJveHk6Om9wZXJhdG9yKigpIGNvbnN0ngSoAXN0ZDo6X18yOjpfX3dyYXBfaXRlcjxjaGFyIGNvbnN0Kj46Ol9fd3JhcF9pdGVyPGNoYXIqPihzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+IGNvbnN0Jiwgc3RkOjpfXzI6OmVuYWJsZV9pZjxpc19jb252ZXJ0aWJsZTxjaGFyKiwgY2hhciBjb25zdCo+Ojp2YWx1ZSwgdm9pZD46OnR5cGUqKZ8EZnZvaWQgc3RkOjpfXzI6Ol9fZG91YmxlX29yX25vdGhpbmc8Y2hhcj4oc3RkOjpfXzI6OnVuaXF1ZV9wdHI8Y2hhciwgdm9pZCAoKikodm9pZCopPiYsIGNoYXIqJiwgY2hhciomKaAEhgF2b2lkIHN0ZDo6X18yOjpfX2RvdWJsZV9vcl9ub3RoaW5nPHVuc2lnbmVkIGludD4oc3RkOjpfXzI6OnVuaXF1ZV9wdHI8dW5zaWduZWQgaW50LCB2b2lkICgqKSh2b2lkKik+JiwgdW5zaWduZWQgaW50KiYsIHVuc2lnbmVkIGludComKaEE8wJzdGQ6Ol9fMjo6bW9uZXlfZ2V0PGNoYXIsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIGJvb2wsIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4mKSBjb25zdKIEXnN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46OmNsZWFyKCmjBDdzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj46OmFzc2lnbihjaGFyJiwgY2hhciBjb25zdCYppAR1c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19zZXRfbG9uZ19zaXplKHVuc2lnbmVkIGxvbmcppQR2c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19zZXRfc2hvcnRfc2l6ZSh1bnNpZ25lZCBsb25nKaYE2gFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+JiBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpfX2FwcGVuZF9mb3J3YXJkX3Vuc2FmZTxjaGFyKj4oY2hhciosIGNoYXIqKacEd3N0ZDo6X18yOjptb25leXB1bmN0PGNoYXIsIHRydWU+IGNvbnN0JiBzdGQ6Ol9fMjo6dXNlX2ZhY2V0PHN0ZDo6X18yOjptb25leXB1bmN0PGNoYXIsIHRydWU+ID4oc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYpqAQ0c3RkOjpfXzI6Om1vbmV5cHVuY3Q8Y2hhciwgdHJ1ZT46Om5lZ19mb3JtYXQoKSBjb25zdKkEN3N0ZDo6X18yOjptb25leXB1bmN0PGNoYXIsIHRydWU+OjpuZWdhdGl2ZV9zaWduKCkgY29uc3SqBLkBc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6b3BlcmF0b3I9KHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4mJimrBDVzdGQ6Ol9fMjo6bW9uZXlwdW5jdDxjaGFyLCB0cnVlPjo6ZnJhY19kaWdpdHMoKSBjb25zdKwEeXN0ZDo6X18yOjptb25leXB1bmN0PGNoYXIsIGZhbHNlPiBjb25zdCYgc3RkOjpfXzI6OnVzZV9mYWNldDxzdGQ6Ol9fMjo6bW9uZXlwdW5jdDxjaGFyLCBmYWxzZT4gPihzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0JimtBO8BYm9vbCBzdGQ6Ol9fMjo6ZXF1YWw8c3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIqPiwgc3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIqPiwgc3RkOjpfXzI6Ol9fZXF1YWxfdG88Y2hhciwgY2hhcj4gPihzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+LCBzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+LCBzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+LCBzdGQ6Ol9fMjo6X19lcXVhbF90bzxjaGFyLCBjaGFyPimuBDNzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhcio+OjpvcGVyYXRvcisobG9uZykgY29uc3SvBDZzdGQ6Ol9fMjo6dW5pcXVlX3B0cjxjaGFyLCB2b2lkICgqKSh2b2lkKik+OjpyZWxlYXNlKCmwBGVzdGQ6Ol9fMjo6dW5pcXVlX3B0cjxjaGFyLCB2b2lkICgqKSh2b2lkKik+OjpvcGVyYXRvcj0oc3RkOjpfXzI6OnVuaXF1ZV9wdHI8Y2hhciwgdm9pZCAoKikodm9pZCopPiYmKbEEvgJzdGQ6Ol9fMjo6bW9uZXlfZ2V0PHdjaGFyX3QsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIGJvb2wsIHN0ZDo6X18yOjppb3NfYmFzZSYsIHVuc2lnbmVkIGludCYsIGxvbmcgZG91YmxlJikgY29uc3SyBK0Dc3RkOjpfXzI6Om1vbmV5X2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+OjpfX2RvX2dldChzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBib29sLCBzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0JiwgdW5zaWduZWQgaW50LCB1bnNpZ25lZCBpbnQmLCBib29sJiwgc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+IGNvbnN0Jiwgc3RkOjpfXzI6OnVuaXF1ZV9wdHI8d2NoYXJfdCwgdm9pZCAoKikodm9pZCopPiYsIHdjaGFyX3QqJiwgd2NoYXJfdCopswSBBHN0ZDo6X18yOjpfX21vbmV5X2dldDx3Y2hhcl90Pjo6X19nYXRoZXJfaW5mbyhib29sLCBzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0Jiwgc3RkOjpfXzI6Om1vbmV5X2Jhc2U6OnBhdHRlcm4mLCB3Y2hhcl90Jiwgd2NoYXJfdCYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID4mLCBpbnQmKbQEWHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+OjpvcGVyYXRvcisrKGludCm1BJEDc3RkOjpfXzI6Om1vbmV5X2dldDx3Y2hhcl90LCBzdGQ6Ol9fMjo6aXN0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+Ojpkb19nZXQoc3RkOjpfXzI6OmlzdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIHN0ZDo6X18yOjppc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+LCBib29sLCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCB1bnNpZ25lZCBpbnQmLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+JikgY29uc3S2BGdzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpjbGVhcigptwR+c3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6X19zZXRfbG9uZ19zaXplKHVuc2lnbmVkIGxvbmcpuAR/c3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6X19zZXRfc2hvcnRfc2l6ZSh1bnNpZ25lZCBsb25nKbkE9QFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+JiBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpfX2FwcGVuZF9mb3J3YXJkX3Vuc2FmZTx3Y2hhcl90Kj4od2NoYXJfdCosIHdjaGFyX3QqKboEfXN0ZDo6X18yOjptb25leXB1bmN0PHdjaGFyX3QsIHRydWU+IGNvbnN0JiBzdGQ6Ol9fMjo6dXNlX2ZhY2V0PHN0ZDo6X18yOjptb25leXB1bmN0PHdjaGFyX3QsIHRydWU+ID4oc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYpuwTLAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Om9wZXJhdG9yPShzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+JiYpvAR/c3RkOjpfXzI6Om1vbmV5cHVuY3Q8d2NoYXJfdCwgZmFsc2U+IGNvbnN0JiBzdGQ6Ol9fMjo6dXNlX2ZhY2V0PHN0ZDo6X18yOjptb25leXB1bmN0PHdjaGFyX3QsIGZhbHNlPiA+KHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKb0EigJib29sIHN0ZDo6X18yOjplcXVhbDxzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8d2NoYXJfdCo+LCBzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8d2NoYXJfdCo+LCBzdGQ6Ol9fMjo6X19lcXVhbF90bzx3Y2hhcl90LCB3Y2hhcl90PiA+KHN0ZDo6X18yOjpfX3dyYXBfaXRlcjx3Y2hhcl90Kj4sIHN0ZDo6X18yOjpfX3dyYXBfaXRlcjx3Y2hhcl90Kj4sIHN0ZDo6X18yOjpfX3dyYXBfaXRlcjx3Y2hhcl90Kj4sIHN0ZDo6X18yOjpfX2VxdWFsX3RvPHdjaGFyX3QsIHdjaGFyX3Q+Kb4ENnN0ZDo6X18yOjpfX3dyYXBfaXRlcjx3Y2hhcl90Kj46Om9wZXJhdG9yKyhsb25nKSBjb25zdL8E5QFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpfX21vdmVfYXNzaWduKHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6aW50ZWdyYWxfY29uc3RhbnQ8Ym9vbCwgdHJ1ZT4pwAT3AXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Ol9fbW92ZV9hc3NpZ24oc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjppbnRlZ3JhbF9jb25zdGFudDxib29sLCB0cnVlPinBBNwBc3RkOjpfXzI6Om1vbmV5X3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4sIGJvb2wsIHN0ZDo6X18yOjppb3NfYmFzZSYsIGNoYXIsIGxvbmcgZG91YmxlKSBjb25zdMIEdGJvb2wgc3RkOjpfXzI6Om9wZXJhdG9yPT08Y2hhciwgdm9pZCAoKikodm9pZCopPihzdGQ6Ol9fMjo6dW5pcXVlX3B0cjxjaGFyLCB2b2lkICgqKSh2b2lkKik+IGNvbnN0Jiwgc3RkOjpudWxscHRyX3QpwwSLA3N0ZDo6X18yOjpfX21vbmV5X3B1dDxjaGFyPjo6X19nYXRoZXJfaW5mbyhib29sLCBib29sLCBzdGQ6Ol9fMjo6bG9jYWxlIGNvbnN0Jiwgc3RkOjpfXzI6Om1vbmV5X2Jhc2U6OnBhdHRlcm4mLCBjaGFyJiwgY2hhciYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4mLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiYsIGludCYpxATZA3N0ZDo6X18yOjpfX21vbmV5X3B1dDxjaGFyPjo6X19mb3JtYXQoY2hhciosIGNoYXIqJiwgY2hhciomLCB1bnNpZ25lZCBpbnQsIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0Kiwgc3RkOjpfXzI6OmN0eXBlPGNoYXI+IGNvbnN0JiwgYm9vbCwgc3RkOjpfXzI6Om1vbmV5X2Jhc2U6OnBhdHRlcm4gY29uc3QmLCBjaGFyLCBjaGFyLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+IGNvbnN0Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4gY29uc3QmLCBpbnQpxQQ0c3RkOjpfXzI6Om1vbmV5cHVuY3Q8Y2hhciwgdHJ1ZT46OnBvc19mb3JtYXQoKSBjb25zdMYEZHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46OmJlZ2luKCkgY29uc3THBGJzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjplbmQoKSBjb25zdMgEjgFjaGFyKiBzdGQ6Ol9fMjo6Y29weTxzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhciBjb25zdCo+LCBjaGFyKj4oc3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIgY29uc3QqPiwgc3RkOjpfXzI6Ol9fd3JhcF9pdGVyPGNoYXIgY29uc3QqPiwgY2hhciopyQStAnN0ZDo6X18yOjptb25leV9wdXQ8Y2hhciwgc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gPjo6ZG9fcHV0KHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+LCBib29sLCBzdGQ6Ol9fMjo6aW9zX2Jhc2UmLCBjaGFyLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+IGNvbnN0JikgY29uc3TKBO4Bc3RkOjpfXzI6Om1vbmV5X3B1dDx3Y2hhcl90LCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiA+Ojpkb19wdXQoc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4sIGJvb2wsIHN0ZDo6X18yOjppb3NfYmFzZSYsIHdjaGFyX3QsIGxvbmcgZG91YmxlKSBjb25zdMsEpgNzdGQ6Ol9fMjo6X19tb25leV9wdXQ8d2NoYXJfdD46Ol9fZ2F0aGVyX2luZm8oYm9vbCwgYm9vbCwgc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYsIHN0ZDo6X18yOjptb25leV9iYXNlOjpwYXR0ZXJuJiwgd2NoYXJfdCYsIHdjaGFyX3QmLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+Jiwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPiYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID4mLCBpbnQmKcwEhgRzdGQ6Ol9fMjo6X19tb25leV9wdXQ8d2NoYXJfdD46Ol9fZm9ybWF0KHdjaGFyX3QqLCB3Y2hhcl90KiYsIHdjaGFyX3QqJiwgdW5zaWduZWQgaW50LCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90PiBjb25zdCYsIGJvb2wsIHN0ZDo6X18yOjptb25leV9iYXNlOjpwYXR0ZXJuIGNvbnN0Jiwgd2NoYXJfdCwgd2NoYXJfdCwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCYsIHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID4gY29uc3QmLCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+IGNvbnN0JiwgaW50Kc0EyAJzdGQ6Ol9fMjo6bW9uZXlfcHV0PHdjaGFyX3QsIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID46OmRvX3B1dChzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPiwgYm9vbCwgc3RkOjpfXzI6Omlvc19iYXNlJiwgd2NoYXJfdCwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPiBjb25zdCYpIGNvbnN0zgSTAXN0ZDo6X18yOjplbmFibGVfaWY8aXNfdHJpdmlhbGx5X2NvcHlfYXNzaWduYWJsZTxjaGFyPjo6dmFsdWUsIGNoYXIgY29uc3QqPjo6dHlwZSBzdGQ6Ol9fMjo6X191bndyYXBfaXRlcjxjaGFyPihzdGQ6Ol9fMjo6X193cmFwX2l0ZXI8Y2hhciBjb25zdCo+Kc8EngFzdGQ6Ol9fMjo6bWVzc2FnZXM8Y2hhcj46OmRvX29wZW4oc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCYsIHN0ZDo6X18yOjpsb2NhbGUgY29uc3QmKSBjb25zdNAElAFzdGQ6Ol9fMjo6bWVzc2FnZXM8Y2hhcj46OmRvX2dldChsb25nLCBpbnQsIGludCwgc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiBjb25zdCYpIGNvbnN00QS+AnN0ZDo6X18yOjpiYWNrX2luc2VydF9pdGVyYXRvcjxzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+ID4gc3RkOjpfXzI6OmJhY2tfaW5zZXJ0ZXI8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiA+KHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4mKdIEuANzdGQ6Ol9fMjo6YmFja19pbnNlcnRfaXRlcmF0b3I8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiA+IHN0ZDo6X18yOjpfX25hcnJvd190b191dGY4PDh1bD46Om9wZXJhdG9yKCk8c3RkOjpfXzI6OmJhY2tfaW5zZXJ0X2l0ZXJhdG9yPHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4gPiwgY2hhcj4oc3RkOjpfXzI6OmJhY2tfaW5zZXJ0X2l0ZXJhdG9yPHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4gPiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqKSBjb25zdNMEjgFzdGQ6Ol9fMjo6YmFja19pbnNlcnRfaXRlcmF0b3I8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiA+OjpvcGVyYXRvcj0oY2hhciBjb25zdCYp1ASgAXN0ZDo6X18yOjptZXNzYWdlczx3Y2hhcl90Pjo6ZG9fZ2V0KGxvbmcsIGludCwgaW50LCBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+IGNvbnN0JikgY29uc3TVBMIDc3RkOjpfXzI6OmJhY2tfaW5zZXJ0X2l0ZXJhdG9yPHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4gPiBzdGQ6Ol9fMjo6X19uYXJyb3dfdG9fdXRmODwzMnVsPjo6b3BlcmF0b3IoKTxzdGQ6Ol9fMjo6YmFja19pbnNlcnRfaXRlcmF0b3I8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiA+LCB3Y2hhcl90PihzdGQ6Ol9fMjo6YmFja19pbnNlcnRfaXRlcmF0b3I8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPiA+LCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCopIGNvbnN01gTQA3N0ZDo6X18yOjpiYWNrX2luc2VydF9pdGVyYXRvcjxzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+ID4gc3RkOjpfXzI6Ol9fd2lkZW5fZnJvbV91dGY4PDMydWw+OjpvcGVyYXRvcigpPHN0ZDo6X18yOjpiYWNrX2luc2VydF9pdGVyYXRvcjxzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+ID4gPihzdGQ6Ol9fMjo6YmFja19pbnNlcnRfaXRlcmF0b3I8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPiA+LCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCopIGNvbnN01wRGc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhcjMyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6Y29kZWN2dCh1bnNpZ25lZCBsb25nKdgEOXN0ZDo6X18yOjpjb2RlY3Z0PHdjaGFyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6fmNvZGVjdnQoKdkELXN0ZDo6X18yOjpsb2NhbGU6Ol9faW1wOjpfX2ltcCh1bnNpZ25lZCBsb25nKdoELXN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0OjpmYWNldCh1bnNpZ25lZCBsb25nKdsEfnN0ZDo6X18yOjpfX3ZlY3Rvcl9iYXNlPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+ID46Ol9fdmVjdG9yX2Jhc2UoKdwEggFzdGQ6Ol9fMjo6dmVjdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+ID46Ol9fdmFsbG9jYXRlKHVuc2lnbmVkIGxvbmcp3QSJAXN0ZDo6X18yOjp2ZWN0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6X19jb25zdHJ1Y3RfYXRfZW5kKHVuc2lnbmVkIGxvbmcp3gR0c3RkOjpfXzI6OnZlY3RvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiA+OjpzaXplKCkgY29uc3TfBHZzdGQ6Ol9fMjo6X192ZWN0b3JfYmFzZTxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiA+OjpjbGVhcigp4ASOAXN0ZDo6X18yOjp2ZWN0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6X19hbm5vdGF0ZV9zaHJpbmsodW5zaWduZWQgbG9uZykgY29uc3ThBB1zdGQ6Ol9fMjo6bG9jYWxlOjppZDo6X19nZXQoKeIEQHN0ZDo6X18yOjpsb2NhbGU6Ol9faW1wOjppbnN0YWxsKHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgbG9uZynjBEhzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46OmN0eXBlKHVuc2lnbmVkIHNob3J0IGNvbnN0KiwgYm9vbCwgdW5zaWduZWQgbG9uZynkBBtzdGQ6Ol9fMjo6bG9jYWxlOjpjbGFzc2ljKCnlBIEBc3RkOjpfXzI6OnZlY3RvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiA+OjpvcGVyYXRvcltdKHVuc2lnbmVkIGxvbmcp5gQoc3RkOjpfXzI6Ol9fc2hhcmVkX2NvdW50OjpfX2FkZF9zaGFyZWQoKecELnN0ZDo6X18yOjpsb2NhbGU6Ol9faW1wOjp1c2VfZmFjZXQobG9uZykgY29uc3ToBIkBc3RkOjpfXzI6OnVuaXF1ZV9wdHI8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQsIHN0ZDo6X18yOjooYW5vbnltb3VzIG5hbWVzcGFjZSk6OnJlbGVhc2U+Ojp1bmlxdWVfcHRyPHRydWUsIHZvaWQ+KHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KinpBH1zdGQ6Ol9fMjo6dmVjdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+ID46OnJlc2l6ZSh1bnNpZ25lZCBsb25nKeoELHN0ZDo6X18yOjpfX3NoYXJlZF9jb3VudDo6X19yZWxlYXNlX3NoYXJlZCgp6wQhc3RkOjpfXzI6OmxvY2FsZTo6X19pbXA6On5fX2ltcCgp7ASBAXN0ZDo6X18yOjp2ZWN0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6X19hbm5vdGF0ZV9kZWxldGUoKSBjb25zdO0EI3N0ZDo6X18yOjpsb2NhbGU6Ol9faW1wOjp+X19pbXAoKS4x7gR/c3RkOjpfXzI6OnZlY3RvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiA+OjpfX2FwcGVuZCh1bnNpZ25lZCBsb25nKe8ELnN0ZDo6X18yOjpsb2NhbGU6Ol9faW1wOjpoYXNfZmFjZXQobG9uZykgY29uc3TwBDFzdGQ6Ol9fMjo6bG9jYWxlOjpsb2NhbGUoc3RkOjpfXzI6OmxvY2FsZSBjb25zdCYp8QQcc3RkOjpfXzI6OmxvY2FsZTo6X19nbG9iYWwoKfIEGnN0ZDo6X18yOjpsb2NhbGU6OmxvY2FsZSgp8wQec3RkOjpfXzI6OmxvY2FsZTo6aWQ6Ol9faW5pdCgp9ASMAXZvaWQgc3RkOjpfXzI6OmNhbGxfb25jZTxzdGQ6Ol9fMjo6KGFub255bW91cyBuYW1lc3BhY2UpOjpfX2Zha2VfYmluZD4oc3RkOjpfXzI6Om9uY2VfZmxhZyYsIHN0ZDo6X18yOjooYW5vbnltb3VzIG5hbWVzcGFjZSk6Ol9fZmFrZV9iaW5kJiYp9QQrc3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQ6Ol9fb25femVyb19zaGFyZWQoKfYEaXZvaWQgc3RkOjpfXzI6Ol9fY2FsbF9vbmNlX3Byb3h5PHN0ZDo6X18yOjp0dXBsZTxzdGQ6Ol9fMjo6KGFub255bW91cyBuYW1lc3BhY2UpOjpfX2Zha2VfYmluZCYmPiA+KHZvaWQqKfcEPnN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pjo6ZG9faXModW5zaWduZWQgc2hvcnQsIHdjaGFyX3QpIGNvbnN0+AQmc3RkOjpfXzI6OmN0eXBlPGNoYXI+OjpjbGFzc2ljX3RhYmxlKCn5BFZzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX2lzKHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0KiwgdW5zaWduZWQgc2hvcnQqKSBjb25zdPoEWnN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pjo6ZG9fc2Nhbl9pcyh1bnNpZ25lZCBzaG9ydCwgd2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqKSBjb25zdPsEW3N0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pjo6ZG9fc2Nhbl9ub3QodW5zaWduZWQgc2hvcnQsIHdjaGFyX3QgY29uc3QqLCB3Y2hhcl90IGNvbnN0KikgY29uc3T8BDNzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX3RvdXBwZXIod2NoYXJfdCkgY29uc3T9BC5zdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46Ol9fY2xhc3NpY191cHBlcl90YWJsZSgp/gREc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb190b3VwcGVyKHdjaGFyX3QqLCB3Y2hhcl90IGNvbnN0KikgY29uc3T/BDNzdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX3RvbG93ZXIod2NoYXJfdCkgY29uc3SABS5zdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46Ol9fY2xhc3NpY19sb3dlcl90YWJsZSgpgQVEc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb190b2xvd2VyKHdjaGFyX3QqLCB3Y2hhcl90IGNvbnN0KikgY29uc3SCBS5zdGQ6Ol9fMjo6Y3R5cGU8d2NoYXJfdD46OmRvX3dpZGVuKGNoYXIpIGNvbnN0gwVMc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb193aWRlbihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHdjaGFyX3QqKSBjb25zdIQFOHN0ZDo6X18yOjpjdHlwZTx3Y2hhcl90Pjo6ZG9fbmFycm93KHdjaGFyX3QsIGNoYXIpIGNvbnN0hQVWc3RkOjpfXzI6OmN0eXBlPHdjaGFyX3Q+Ojpkb19uYXJyb3cod2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqLCBjaGFyLCBjaGFyKikgY29uc3SGBR9zdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46On5jdHlwZSgphwUhc3RkOjpfXzI6OmN0eXBlPGNoYXI+Ojp+Y3R5cGUoKS4xiAUtc3RkOjpfXzI6OmN0eXBlPGNoYXI+Ojpkb190b3VwcGVyKGNoYXIpIGNvbnN0iQU7c3RkOjpfXzI6OmN0eXBlPGNoYXI+Ojpkb190b3VwcGVyKGNoYXIqLCBjaGFyIGNvbnN0KikgY29uc3SKBS1zdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46OmRvX3RvbG93ZXIoY2hhcikgY29uc3SLBTtzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46OmRvX3RvbG93ZXIoY2hhciosIGNoYXIgY29uc3QqKSBjb25zdIwFRnN0ZDo6X18yOjpjdHlwZTxjaGFyPjo6ZG9fd2lkZW4oY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyKikgY29uc3SNBTJzdGQ6Ol9fMjo6Y3R5cGU8Y2hhcj46OmRvX25hcnJvdyhjaGFyLCBjaGFyKSBjb25zdI4FTXN0ZDo6X18yOjpjdHlwZTxjaGFyPjo6ZG9fbmFycm93KGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgY2hhciwgY2hhciopIGNvbnN0jwWEAXN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fb3V0KF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiYsIGNoYXIqLCBjaGFyKiwgY2hhciomKSBjb25zdJAFYHN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fdW5zaGlmdChfX21ic3RhdGVfdCYsIGNoYXIqLCBjaGFyKiwgY2hhciomKSBjb25zdJEFP3N0ZDo6X18yOjpjb2RlY3Z0PGNoYXIsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fZW5jb2RpbmcoKSBjb25zdJIFcnN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fbGVuZ3RoKF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBsb25nKSBjb25zdJMFXXVuc2lnbmVkIGxvbmcgY29uc3QmIHN0ZDo6X18yOjptaW48dW5zaWduZWQgbG9uZz4odW5zaWduZWQgbG9uZyBjb25zdCYsIHVuc2lnbmVkIGxvbmcgY29uc3QmKZQFvgF1bnNpZ25lZCBsb25nIGNvbnN0JiBzdGQ6Ol9fMjo6bWluPHVuc2lnbmVkIGxvbmcsIHN0ZDo6X18yOjpfX2xlc3M8dW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZz4gPih1bnNpZ25lZCBsb25nIGNvbnN0JiwgdW5zaWduZWQgbG9uZyBjb25zdCYsIHN0ZDo6X18yOjpfX2xlc3M8dW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZz4plQU7c3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojp+Y29kZWN2dCgpLjGWBZABc3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19vdXQoX19tYnN0YXRlX3QmLCB3Y2hhcl90IGNvbnN0Kiwgd2NoYXJfdCBjb25zdCosIHdjaGFyX3QgY29uc3QqJiwgY2hhciosIGNoYXIqLCBjaGFyKiYpIGNvbnN0lwV1c3RkOjpfXzI6Ol9fbGliY3BwX3djc25ydG9tYnNfbChjaGFyKiwgd2NoYXJfdCBjb25zdCoqLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCBfX21ic3RhdGVfdCosIF9fbG9jYWxlX3N0cnVjdCopmAVMc3RkOjpfXzI6Ol9fbGliY3BwX3djcnRvbWJfbChjaGFyKiwgd2NoYXJfdCwgX19tYnN0YXRlX3QqLCBfX2xvY2FsZV9zdHJ1Y3QqKZkFjwFzdGQ6Ol9fMjo6Y29kZWN2dDx3Y2hhcl90LCBjaGFyLCBfX21ic3RhdGVfdD46OmRvX2luKF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiYsIHdjaGFyX3QqLCB3Y2hhcl90Kiwgd2NoYXJfdComKSBjb25zdJoFdXN0ZDo6X18yOjpfX2xpYmNwcF9tYnNucnRvd2NzX2wod2NoYXJfdCosIGNoYXIgY29uc3QqKiwgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgX19tYnN0YXRlX3QqLCBfX2xvY2FsZV9zdHJ1Y3QqKZsFYnN0ZDo6X18yOjpfX2xpYmNwcF9tYnJ0b3djX2wod2NoYXJfdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBsb25nLCBfX21ic3RhdGVfdCosIF9fbG9jYWxlX3N0cnVjdCopnAVjc3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb191bnNoaWZ0KF9fbWJzdGF0ZV90JiwgY2hhciosIGNoYXIqLCBjaGFyKiYpIGNvbnN0nQVCc3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19lbmNvZGluZygpIGNvbnN0ngVTc3RkOjpfXzI6Ol9fbGliY3BwX21idG93Y19sKHdjaGFyX3QqLCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgbG9uZywgX19sb2NhbGVfc3RydWN0KimfBTFzdGQ6Ol9fMjo6X19saWJjcHBfbWJfY3VyX21heF9sKF9fbG9jYWxlX3N0cnVjdCopoAV1c3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19sZW5ndGgoX19tYnN0YXRlX3QmLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIHVuc2lnbmVkIGxvbmcpIGNvbnN0oQVXc3RkOjpfXzI6Ol9fbGliY3BwX21icmxlbl9sKGNoYXIgY29uc3QqLCB1bnNpZ25lZCBsb25nLCBfX21ic3RhdGVfdCosIF9fbG9jYWxlX3N0cnVjdCopogVEc3RkOjpfXzI6OmNvZGVjdnQ8d2NoYXJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19tYXhfbGVuZ3RoKCkgY29uc3SjBZQBc3RkOjpfXzI6OmNvZGVjdnQ8Y2hhcjE2X3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fb3V0KF9fbWJzdGF0ZV90JiwgY2hhcjE2X3QgY29uc3QqLCBjaGFyMTZfdCBjb25zdCosIGNoYXIxNl90IGNvbnN0KiYsIGNoYXIqLCBjaGFyKiwgY2hhciomKSBjb25zdKQFtQFzdGQ6Ol9fMjo6dXRmMTZfdG9fdXRmOCh1bnNpZ25lZCBzaG9ydCBjb25zdCosIHVuc2lnbmVkIHNob3J0IGNvbnN0KiwgdW5zaWduZWQgc2hvcnQgY29uc3QqJiwgdW5zaWduZWQgY2hhciosIHVuc2lnbmVkIGNoYXIqLCB1bnNpZ25lZCBjaGFyKiYsIHVuc2lnbmVkIGxvbmcsIHN0ZDo6X18yOjpjb2RlY3Z0X21vZGUppQWTAXN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIxNl90LCBjaGFyLCBfX21ic3RhdGVfdD46OmRvX2luKF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiYsIGNoYXIxNl90KiwgY2hhcjE2X3QqLCBjaGFyMTZfdComKSBjb25zdKYFtQFzdGQ6Ol9fMjo6dXRmOF90b191dGYxNih1bnNpZ25lZCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgY2hhciBjb25zdCosIHVuc2lnbmVkIGNoYXIgY29uc3QqJiwgdW5zaWduZWQgc2hvcnQqLCB1bnNpZ25lZCBzaG9ydCosIHVuc2lnbmVkIHNob3J0KiYsIHVuc2lnbmVkIGxvbmcsIHN0ZDo6X18yOjpjb2RlY3Z0X21vZGUppwV2c3RkOjpfXzI6OmNvZGVjdnQ8Y2hhcjE2X3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fbGVuZ3RoKF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBsb25nKSBjb25zdKgFgAFzdGQ6Ol9fMjo6dXRmOF90b191dGYxNl9sZW5ndGgodW5zaWduZWQgY2hhciBjb25zdCosIHVuc2lnbmVkIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCBzdGQ6Ol9fMjo6Y29kZWN2dF9tb2RlKakFRXN0ZDo6X18yOjpjb2RlY3Z0PGNoYXIxNl90LCBjaGFyLCBfX21ic3RhdGVfdD46OmRvX21heF9sZW5ndGgoKSBjb25zdKoFlAFzdGQ6Ol9fMjo6Y29kZWN2dDxjaGFyMzJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19vdXQoX19tYnN0YXRlX3QmLCBjaGFyMzJfdCBjb25zdCosIGNoYXIzMl90IGNvbnN0KiwgY2hhcjMyX3QgY29uc3QqJiwgY2hhciosIGNoYXIqLCBjaGFyKiYpIGNvbnN0qwWuAXN0ZDo6X18yOjp1Y3M0X3RvX3V0ZjgodW5zaWduZWQgaW50IGNvbnN0KiwgdW5zaWduZWQgaW50IGNvbnN0KiwgdW5zaWduZWQgaW50IGNvbnN0KiYsIHVuc2lnbmVkIGNoYXIqLCB1bnNpZ25lZCBjaGFyKiwgdW5zaWduZWQgY2hhciomLCB1bnNpZ25lZCBsb25nLCBzdGQ6Ol9fMjo6Y29kZWN2dF9tb2RlKawFkwFzdGQ6Ol9fMjo6Y29kZWN2dDxjaGFyMzJfdCwgY2hhciwgX19tYnN0YXRlX3Q+Ojpkb19pbihfX21ic3RhdGVfdCYsIGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KiwgY2hhciBjb25zdComLCBjaGFyMzJfdCosIGNoYXIzMl90KiwgY2hhcjMyX3QqJikgY29uc3StBa4Bc3RkOjpfXzI6OnV0ZjhfdG9fdWNzNCh1bnNpZ25lZCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgY2hhciBjb25zdCosIHVuc2lnbmVkIGNoYXIgY29uc3QqJiwgdW5zaWduZWQgaW50KiwgdW5zaWduZWQgaW50KiwgdW5zaWduZWQgaW50KiYsIHVuc2lnbmVkIGxvbmcsIHN0ZDo6X18yOjpjb2RlY3Z0X21vZGUprgV2c3RkOjpfXzI6OmNvZGVjdnQ8Y2hhcjMyX3QsIGNoYXIsIF9fbWJzdGF0ZV90Pjo6ZG9fbGVuZ3RoKF9fbWJzdGF0ZV90JiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBsb25nKSBjb25zdK8Ff3N0ZDo6X18yOjp1dGY4X3RvX3VjczRfbGVuZ3RoKHVuc2lnbmVkIGNoYXIgY29uc3QqLCB1bnNpZ25lZCBjaGFyIGNvbnN0KiwgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgc3RkOjpfXzI6OmNvZGVjdnRfbW9kZSmwBSVzdGQ6Ol9fMjo6bnVtcHVuY3Q8Y2hhcj46On5udW1wdW5jdCgpsQUnc3RkOjpfXzI6Om51bXB1bmN0PGNoYXI+Ojp+bnVtcHVuY3QoKS4xsgUoc3RkOjpfXzI6Om51bXB1bmN0PHdjaGFyX3Q+Ojp+bnVtcHVuY3QoKbMFKnN0ZDo6X18yOjpudW1wdW5jdDx3Y2hhcl90Pjo6fm51bXB1bmN0KCkuMbQFMnN0ZDo6X18yOjpudW1wdW5jdDxjaGFyPjo6ZG9fZGVjaW1hbF9wb2ludCgpIGNvbnN0tQUyc3RkOjpfXzI6Om51bXB1bmN0PGNoYXI+Ojpkb190aG91c2FuZHNfc2VwKCkgY29uc3S2BTVzdGQ6Ol9fMjo6bnVtcHVuY3Q8d2NoYXJfdD46OmRvX3Rob3VzYW5kc19zZXAoKSBjb25zdLcFLXN0ZDo6X18yOjpudW1wdW5jdDxjaGFyPjo6ZG9fZ3JvdXBpbmcoKSBjb25zdLgFMHN0ZDo6X18yOjpudW1wdW5jdDx3Y2hhcl90Pjo6ZG9fZ3JvdXBpbmcoKSBjb25zdLkFLXN0ZDo6X18yOjpudW1wdW5jdDxjaGFyPjo6ZG9fdHJ1ZW5hbWUoKSBjb25zdLoFMHN0ZDo6X18yOjpudW1wdW5jdDx3Y2hhcl90Pjo6ZG9fdHJ1ZW5hbWUoKSBjb25zdLsFjAFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpiYXNpY19zdHJpbmc8c3RkOjpudWxscHRyX3Q+KHdjaGFyX3QgY29uc3QqKbwFLnN0ZDo6X18yOjpudW1wdW5jdDxjaGFyPjo6ZG9fZmFsc2VuYW1lKCkgY29uc3S9BTFzdGQ6Ol9fMjo6bnVtcHVuY3Q8d2NoYXJfdD46OmRvX2ZhbHNlbmFtZSgpIGNvbnN0vgVtc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6b3BlcmF0b3I9KGNoYXIgY29uc3QqKb8FNXN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTxjaGFyPjo6X193ZWVrcygpIGNvbnN0wAUWc3RkOjpfXzI6OmluaXRfd2Vla3MoKcEFGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjU1wgU4c3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPHdjaGFyX3Q+OjpfX3dlZWtzKCkgY29uc3TDBRdzdGQ6Ol9fMjo6aW5pdF93d2Vla3MoKcQFGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjcwxQV5c3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6b3BlcmF0b3I9KHdjaGFyX3QgY29uc3QqKcYFNnN0ZDo6X18yOjpfX3RpbWVfZ2V0X2Nfc3RvcmFnZTxjaGFyPjo6X19tb250aHMoKSBjb25zdMcFF3N0ZDo6X18yOjppbml0X21vbnRocygpyAUaX19jeHhfZ2xvYmFsX2FycmF5X2R0b3IuODXJBTlzdGQ6Ol9fMjo6X190aW1lX2dldF9jX3N0b3JhZ2U8d2NoYXJfdD46Ol9fbW9udGhzKCkgY29uc3TKBRhzdGQ6Ol9fMjo6aW5pdF93bW9udGhzKCnLBRtfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci4xMDnMBTVzdGQ6Ol9fMjo6X190aW1lX2dldF9jX3N0b3JhZ2U8Y2hhcj46Ol9fYW1fcG0oKSBjb25zdM0FFnN0ZDo6X18yOjppbml0X2FtX3BtKCnOBRtfX2N4eF9nbG9iYWxfYXJyYXlfZHRvci4xMzPPBThzdGQ6Ol9fMjo6X190aW1lX2dldF9jX3N0b3JhZ2U8d2NoYXJfdD46Ol9fYW1fcG0oKSBjb25zdNAFF3N0ZDo6X18yOjppbml0X3dhbV9wbSgp0QUbX19jeHhfZ2xvYmFsX2FycmF5X2R0b3IuMTM20gUxc3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPGNoYXI+OjpfX3goKSBjb25zdNMFF19fY3h4X2dsb2JhbF9hcnJheV9kdG9y1AU0c3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPHdjaGFyX3Q+OjpfX3goKSBjb25zdNUFGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjMy1gUxc3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPGNoYXI+OjpfX1goKSBjb25zdNcFGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjM02AU0c3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPHdjaGFyX3Q+OjpfX1goKSBjb25zdNkFGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjM22gUxc3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPGNoYXI+OjpfX2MoKSBjb25zdNsFGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjM43AU0c3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPHdjaGFyX3Q+OjpfX2MoKSBjb25zdN0FGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjQw3gUxc3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPGNoYXI+OjpfX3IoKSBjb25zdN8FGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjQy4AU0c3RkOjpfXzI6Ol9fdGltZV9nZXRfY19zdG9yYWdlPHdjaGFyX3Q+OjpfX3IoKSBjb25zdOEFGl9fY3h4X2dsb2JhbF9hcnJheV9kdG9yLjQ04gVlc3RkOjpfXzI6Oml0ZXJhdG9yX3RyYWl0czx3Y2hhcl90Kj46OmRpZmZlcmVuY2VfdHlwZSBzdGQ6Ol9fMjo6ZGlzdGFuY2U8d2NoYXJfdCo+KHdjaGFyX3QqLCB3Y2hhcl90KinjBXBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpjYXBhY2l0eSgpIGNvbnN05AV5c3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6X19zZXRfc2l6ZSh1bnNpZ25lZCBsb25nKeUFaXN0ZDo6X18yOjp0aW1lX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojp+dGltZV9wdXQoKeYFa3N0ZDo6X18yOjp0aW1lX3B1dDxjaGFyLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPiA+Ojp+dGltZV9wdXQoKS4x5wV2c3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6X19nZXRfbG9uZ19jYXAoKSBjb25zdOgFeHN0ZDo6X18yOjp2ZWN0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6bWF4X3NpemUoKSBjb25zdOkFeHN0ZDo6X18yOjpfX3ZlY3Rvcl9iYXNlPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+ID46Ol9fYWxsb2MoKeoFqwFzdGQ6Ol9fMjo6YWxsb2NhdG9yX3RyYWl0czxzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6YWxsb2NhdGUoc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+JiwgdW5zaWduZWQgbG9uZynrBXpzdGQ6Ol9fMjo6X192ZWN0b3JfYmFzZTxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiA+OjpfX2VuZF9jYXAoKewFiwFzdGQ6Ol9fMjo6dmVjdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+ID46Ol9fYW5ub3RhdGVfbmV3KHVuc2lnbmVkIGxvbmcpIGNvbnN07QWMAnN0ZDo6X18yOjp2ZWN0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6X0NvbnN0cnVjdFRyYW5zYWN0aW9uOjpfQ29uc3RydWN0VHJhbnNhY3Rpb24oc3RkOjpfXzI6OnZlY3RvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiA+JiwgdW5zaWduZWQgbG9uZynuBYUBc3RkOjpfXzI6Ol9fY29tcHJlc3NlZF9wYWlyX2VsZW08c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqKiwgMCwgZmFsc2U+OjpfX2NvbXByZXNzZWRfcGFpcl9lbGVtPHN0ZDo6bnVsbHB0cl90LCB2b2lkPihzdGQ6Om51bGxwdHJfdCYmKe8FX3N0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPjo6YWxsb2NhdGUodW5zaWduZWQgbG9uZywgdm9pZCBjb25zdCop8AV/c3RkOjpfXzI6Ol9fdmVjdG9yX2Jhc2U8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6Y2FwYWNpdHkoKSBjb25zdPEFgwJ2b2lkIHN0ZDo6X18yOjphbGxvY2F0b3JfdHJhaXRzPHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiA+OjpfX2NvbnN0cnVjdDxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCo+KHN0ZDo6X18yOjppbnRlZ3JhbF9jb25zdGFudDxib29sLCBmYWxzZT4sIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiYsIHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiop8gVxc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19yZWNvbW1lbmQodW5zaWduZWQgbG9uZynzBXBzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpfX3NldF9sb25nX3BvaW50ZXIoY2hhciop9AV0c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19zZXRfbG9uZ19jYXAodW5zaWduZWQgbG9uZyn1BcgBc3RkOjpfXzI6OmFsbG9jYXRvcl90cmFpdHM8c3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+ID46OmRlYWxsb2NhdGUoc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+Jiwgc3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqKiwgdW5zaWduZWQgbG9uZyn2BZsBc3RkOjpfXzI6Ol9fdmVjdG9yX2Jhc2U8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6X19kZXN0cnVjdF9hdF9lbmQoc3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqKin3BSJzdGQ6Ol9fMjo6X190aW1lX3B1dDo6X190aW1lX3B1dCgp+AWIAXN0ZDo6X18yOjp2ZWN0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6X19yZWNvbW1lbmQodW5zaWduZWQgbG9uZykgY29uc3T5BdgBc3RkOjpfXzI6Ol9fc3BsaXRfYnVmZmVyPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+Jj46Ol9fc3BsaXRfYnVmZmVyKHVuc2lnbmVkIGxvbmcsIHVuc2lnbmVkIGxvbmcsIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiYp+gWRAXN0ZDo6X18yOjpfX3NwbGl0X2J1ZmZlcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiY+OjpfX2NvbnN0cnVjdF9hdF9lbmQodW5zaWduZWQgbG9uZyn7BfMBc3RkOjpfXzI6OnZlY3RvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiA+OjpfX3N3YXBfb3V0X2NpcmN1bGFyX2J1ZmZlcihzdGQ6Ol9fMjo6X19zcGxpdF9idWZmZXI8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4mPiYp/AV5c3RkOjpfXzI6Ol9fc3BsaXRfYnVmZmVyPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0Kiwgc3RkOjpfXzI6Ol9fc3NvX2FsbG9jYXRvcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIDI4dWw+Jj46Ol9fYWxsb2MoKf0Fe3N0ZDo6X18yOjpfX3NwbGl0X2J1ZmZlcjxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCosIHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiY+OjpfX2VuZF9jYXAoKf4FxwFzdGQ6Ol9fMjo6X19zcGxpdF9idWZmZXI8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4mPjo6X0NvbnN0cnVjdFRyYW5zYWN0aW9uOjpfQ29uc3RydWN0VHJhbnNhY3Rpb24oc3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqKiosIHVuc2lnbmVkIGxvbmcp/wXgA3N0ZDo6X18yOjplbmFibGVfaWY8KChzdGQ6Ol9fMjo6aW50ZWdyYWxfY29uc3RhbnQ8Ym9vbCwgZmFsc2U+Ojp2YWx1ZSkgfHwgKCEoX19oYXNfY29uc3RydWN0PHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiwgYm9vbCosIGJvb2w+Ojp2YWx1ZSkpKSAmJiAoaXNfdHJpdmlhbGx5X21vdmVfY29uc3RydWN0aWJsZTxib29sPjo6dmFsdWUpLCB2b2lkPjo6dHlwZSBzdGQ6Ol9fMjo6YWxsb2NhdG9yX3RyYWl0czxzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4gPjo6X19jb25zdHJ1Y3RfYmFja3dhcmRfd2l0aF9leGNlcHRpb25fZ3VhcmFudGVlczxzdGQ6Ol9fMjo6bG9jYWxlOjpmYWNldCo+KHN0ZDo6X18yOjpfX3Nzb19hbGxvY2F0b3I8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCAyOHVsPiYsIGJvb2wqLCBib29sKiwgYm9vbComKYAGxgFzdGQ6Ol9fMjo6X19zcGxpdF9idWZmZXI8c3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqLCBzdGQ6Ol9fMjo6X19zc29fYWxsb2NhdG9yPHN0ZDo6X18yOjpsb2NhbGU6OmZhY2V0KiwgMjh1bD4mPjo6X19kZXN0cnVjdF9hdF9lbmQoc3RkOjpfXzI6OmxvY2FsZTo6ZmFjZXQqKiwgc3RkOjpfXzI6OmludGVncmFsX2NvbnN0YW50PGJvb2wsIGZhbHNlPimBBkBzdGQ6Ol9fMjo6KGFub255bW91cyBuYW1lc3BhY2UpOjpfX2Zha2VfYmluZDo6b3BlcmF0b3IoKSgpIGNvbnN0ggZxc3RkOjpfXzI6Oml0ZXJhdG9yX3RyYWl0czxjaGFyIGNvbnN0Kj46OmRpZmZlcmVuY2VfdHlwZSBzdGQ6Ol9fMjo6ZGlzdGFuY2U8Y2hhciBjb25zdCo+KGNoYXIgY29uc3QqLCBjaGFyIGNvbnN0KimDBnpzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpfX3JlY29tbWVuZCh1bnNpZ25lZCBsb25nKYQGfHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Ol9fc2V0X2xvbmdfcG9pbnRlcih3Y2hhcl90KimFBn1zdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpfX3NldF9sb25nX2NhcCh1bnNpZ25lZCBsb25nKYYGQnN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD46OmFsbG9jYXRlKHVuc2lnbmVkIGxvbmcsIHZvaWQgY29uc3QqKYcGQ2xvbmcgZG91YmxlIHN0ZDo6X18yOjpfX2RvX3N0cnRvZDxsb25nIGRvdWJsZT4oY2hhciBjb25zdCosIGNoYXIqKimIBvgBc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+ID4gc3RkOjpfXzI6Ol9fY29weV9jb25zdGV4cHI8Y2hhciosIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiA+ID4oY2hhciosIGNoYXIqLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4gPimJBpMCc3RkOjpfXzI6Om9zdHJlYW1idWZfaXRlcmF0b3I8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+ID4gc3RkOjpfXzI6Ol9fY29weV9jb25zdGV4cHI8d2NoYXJfdCosIHN0ZDo6X18yOjpvc3RyZWFtYnVmX2l0ZXJhdG9yPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90PiA+ID4od2NoYXJfdCosIHdjaGFyX3QqLCBzdGQ6Ol9fMjo6b3N0cmVhbWJ1Zl9pdGVyYXRvcjx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4gPimKBkpib29sIHN0ZDo6X18yOjpfX3B0cl9pbl9yYW5nZTxjaGFyPihjaGFyIGNvbnN0KiwgY2hhciBjb25zdCosIGNoYXIgY29uc3QqKYsGoAFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpiYXNpY19zdHJpbmc8Y2hhciosIHZvaWQ+KGNoYXIqLCBjaGFyKiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiBjb25zdCYpjAZwc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19zZXRfc2l6ZSh1bnNpZ25lZCBsb25nKY0GqgJzdGQ6Ol9fMjo6X19jb21wcmVzc2VkX3BhaXI8c3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19yZXAsIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19jb21wcmVzc2VkX3BhaXI8c3RkOjpfXzI6Ol9fZGVmYXVsdF9pbml0X3RhZywgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiBjb25zdCY+KHN0ZDo6X18yOjpfX2RlZmF1bHRfaW5pdF90YWcmJiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiBjb25zdCYpjga1AXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46OmJhc2ljX3N0cmluZzx3Y2hhcl90Kiwgdm9pZD4od2NoYXJfdCosIHdjaGFyX3QqLCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+IGNvbnN0JimPBhtvcGVyYXRvciBuZXcodW5zaWduZWQgbG9uZymQBhVlbXNjcmlwdGVuX3N0YWNrX2luaXSRBhllbXNjcmlwdGVuX3N0YWNrX2dldF9mcmVlkgYZZW1zY3JpcHRlbl9zdGFja19nZXRfYmFzZZMGGGVtc2NyaXB0ZW5fc3RhY2tfZ2V0X2VuZJQGLXN0ZDo6X18yOjpfX3NoYXJlZF9jb3VudDo6fl9fc2hhcmVkX2NvdW50KCkuMZUGRnN0ZDo6X18yOjpfX2NhbGxfb25jZSh1bnNpZ25lZCBsb25nIHZvbGF0aWxlJiwgdm9pZCosIHZvaWQgKCopKHZvaWQqKSmWBgd3bWVtc2V0lwYId21lbW1vdmWYBsEBc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6YmFzaWNfc3RyaW5nKHN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID4gY29uc3QmKZkGeXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Ol9faW5pdChjaGFyIGNvbnN0KiwgdW5zaWduZWQgbG9uZymaBmZzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+Ojp+YmFzaWNfc3RyaW5nKCmbBnlzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+Ojphc3NpZ24oY2hhciBjb25zdCosIHVuc2lnbmVkIGxvbmcpnAbTAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8Y2hhciwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPGNoYXI+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPGNoYXI+ID46Ol9fZ3Jvd19ieV9hbmRfcmVwbGFjZSh1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCBjaGFyIGNvbnN0KimdBnJzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpyZXNpemUodW5zaWduZWQgbG9uZywgY2hhcimeBnJzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjphcHBlbmQodW5zaWduZWQgbG9uZywgY2hhcimfBnRzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpfX2VyYXNlX3RvX2VuZCh1bnNpZ25lZCBsb25nKaAGugFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjpfX2dyb3dfYnkodW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZymhBj9zdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj46OmFzc2lnbihjaGFyKiwgdW5zaWduZWQgbG9uZywgY2hhcimiBnlzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPGNoYXIsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czxjaGFyPiwgc3RkOjpfXzI6OmFsbG9jYXRvcjxjaGFyPiA+OjphcHBlbmQoY2hhciBjb25zdCosIHVuc2lnbmVkIGxvbmcpowZmc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6cHVzaF9iYWNrKGNoYXIppAZyc3RkOjpfXzI6OmJhc2ljX3N0cmluZzxjaGFyLCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8Y2hhcj4sIHN0ZDo6X18yOjphbGxvY2F0b3I8Y2hhcj4gPjo6X19pbml0KHVuc2lnbmVkIGxvbmcsIGNoYXIppQaFAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Ol9faW5pdCh3Y2hhcl90IGNvbnN0KiwgdW5zaWduZWQgbG9uZymmBm9zdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+Ojp+YmFzaWNfc3RyaW5nKCmnBoUBc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6YXNzaWduKHdjaGFyX3QgY29uc3QqLCB1bnNpZ25lZCBsb25nKagG3wFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjpfX2dyb3dfYnlfYW5kX3JlcGxhY2UodW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgdW5zaWduZWQgbG9uZywgd2NoYXJfdCBjb25zdCopqQbDAXN0ZDo6X18yOjpiYXNpY19zdHJpbmc8d2NoYXJfdCwgc3RkOjpfXzI6OmNoYXJfdHJhaXRzPHdjaGFyX3Q+LCBzdGQ6Ol9fMjo6YWxsb2NhdG9yPHdjaGFyX3Q+ID46Ol9fZ3Jvd19ieSh1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nLCB1bnNpZ25lZCBsb25nKaoGhQFzdGQ6Ol9fMjo6YmFzaWNfc3RyaW5nPHdjaGFyX3QsIHN0ZDo6X18yOjpjaGFyX3RyYWl0czx3Y2hhcl90Piwgc3RkOjpfXzI6OmFsbG9jYXRvcjx3Y2hhcl90PiA+OjphcHBlbmQod2NoYXJfdCBjb25zdCosIHVuc2lnbmVkIGxvbmcpqwZyc3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6cHVzaF9iYWNrKHdjaGFyX3QprAZ+c3RkOjpfXzI6OmJhc2ljX3N0cmluZzx3Y2hhcl90LCBzdGQ6Ol9fMjo6Y2hhcl90cmFpdHM8d2NoYXJfdD4sIHN0ZDo6X18yOjphbGxvY2F0b3I8d2NoYXJfdD4gPjo6X19pbml0KHVuc2lnbmVkIGxvbmcsIHdjaGFyX3QprQYTX19jeGFfZ3VhcmRfYWNxdWlyZa4GVl9fY3h4YWJpdjE6Oihhbm9ueW1vdXMgbmFtZXNwYWNlKTo6SW5pdEJ5dGVOb1RocmVhZHM6OkluaXRCeXRlTm9UaHJlYWRzKHVuc2lnbmVkIGludCoprwZ5X19jeHhhYml2MTo6KGFub255bW91cyBuYW1lc3BhY2UpOjpHdWFyZE9iamVjdDxfX2N4eGFiaXYxOjooYW5vbnltb3VzIG5hbWVzcGFjZSk6OkluaXRCeXRlTm9UaHJlYWRzPjo6Y3hhX2d1YXJkX2FjcXVpcmUoKbAGgAFfX2N4eGFiaXYxOjooYW5vbnltb3VzIG5hbWVzcGFjZSk6Okd1YXJkT2JqZWN0PF9fY3h4YWJpdjE6Oihhbm9ueW1vdXMgbmFtZXNwYWNlKTo6SW5pdEJ5dGVOb1RocmVhZHM+OjpHdWFyZE9iamVjdCh1bnNpZ25lZCBpbnQqKbEGSV9fY3h4YWJpdjE6Oihhbm9ueW1vdXMgbmFtZXNwYWNlKTo6SW5pdEJ5dGVOb1RocmVhZHM6OmFjcXVpcmVfaW5pdF9ieXRlKCmyBhNfX2N4YV9ndWFyZF9yZWxlYXNlswZ5X19jeHhhYml2MTo6KGFub255bW91cyBuYW1lc3BhY2UpOjpHdWFyZE9iamVjdDxfX2N4eGFiaXYxOjooYW5vbnltb3VzIG5hbWVzcGFjZSk6OkluaXRCeXRlTm9UaHJlYWRzPjo6Y3hhX2d1YXJkX3JlbGVhc2UoKbQGEl9fY3hhX3B1cmVfdmlydHVhbLUGYV9fY3h4YWJpdjE6Ol9fZnVuZGFtZW50YWxfdHlwZV9pbmZvOjpjYW5fY2F0Y2goX19jeHhhYml2MTo6X19zaGltX3R5cGVfaW5mbyBjb25zdCosIHZvaWQqJikgY29uc3S2Bjxpc19lcXVhbChzdGQ6OnR5cGVfaW5mbyBjb25zdCosIHN0ZDo6dHlwZV9pbmZvIGNvbnN0KiwgYm9vbCm3BltfX2N4eGFiaXYxOjpfX2NsYXNzX3R5cGVfaW5mbzo6Y2FuX2NhdGNoKF9fY3h4YWJpdjE6Ol9fc2hpbV90eXBlX2luZm8gY29uc3QqLCB2b2lkKiYpIGNvbnN0uAYOX19keW5hbWljX2Nhc3S5BmtfX2N4eGFiaXYxOjpfX2NsYXNzX3R5cGVfaW5mbzo6cHJvY2Vzc19mb3VuZF9iYXNlX2NsYXNzKF9fY3h4YWJpdjE6Ol9fZHluYW1pY19jYXN0X2luZm8qLCB2b2lkKiwgaW50KSBjb25zdLoGbl9fY3h4YWJpdjE6Ol9fY2xhc3NfdHlwZV9pbmZvOjpoYXNfdW5hbWJpZ3VvdXNfcHVibGljX2Jhc2UoX19jeHhhYml2MTo6X19keW5hbWljX2Nhc3RfaW5mbyosIHZvaWQqLCBpbnQpIGNvbnN0uwZxX19jeHhhYml2MTo6X19zaV9jbGFzc190eXBlX2luZm86Omhhc191bmFtYmlndW91c19wdWJsaWNfYmFzZShfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCosIGludCkgY29uc3S8BnNfX2N4eGFiaXYxOjpfX2Jhc2VfY2xhc3NfdHlwZV9pbmZvOjpoYXNfdW5hbWJpZ3VvdXNfcHVibGljX2Jhc2UoX19jeHhhYml2MTo6X19keW5hbWljX2Nhc3RfaW5mbyosIHZvaWQqLCBpbnQpIGNvbnN0vQZyX19jeHhhYml2MTo6X192bWlfY2xhc3NfdHlwZV9pbmZvOjpoYXNfdW5hbWJpZ3VvdXNfcHVibGljX2Jhc2UoX19jeHhhYml2MTo6X19keW5hbWljX2Nhc3RfaW5mbyosIHZvaWQqLCBpbnQpIGNvbnN0vgaDAV9fY3h4YWJpdjE6Ol9fY2xhc3NfdHlwZV9pbmZvOjpwcm9jZXNzX3N0YXRpY190eXBlX2Fib3ZlX2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIHZvaWQgY29uc3QqLCBpbnQpIGNvbnN0vwZ2X19jeHhhYml2MTo6X19jbGFzc190eXBlX2luZm86OnByb2Nlc3Nfc3RhdGljX3R5cGVfYmVsb3dfZHN0KF9fY3h4YWJpdjE6Ol9fZHluYW1pY19jYXN0X2luZm8qLCB2b2lkIGNvbnN0KiwgaW50KSBjb25zdMAGc19fY3h4YWJpdjE6Ol9fdm1pX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2JlbG93X2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TBBoEBX19jeHhhYml2MTo6X19iYXNlX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2Fib3ZlX2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIHZvaWQgY29uc3QqLCBpbnQsIGJvb2wpIGNvbnN0wgZ0X19jeHhhYml2MTo6X19iYXNlX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2JlbG93X2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TDBnJfX2N4eGFiaXYxOjpfX3NpX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2JlbG93X2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TEBm9fX2N4eGFiaXYxOjpfX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2JlbG93X2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TFBoABX19jeHhhYml2MTo6X192bWlfY2xhc3NfdHlwZV9pbmZvOjpzZWFyY2hfYWJvdmVfZHN0KF9fY3h4YWJpdjE6Ol9fZHluYW1pY19jYXN0X2luZm8qLCB2b2lkIGNvbnN0Kiwgdm9pZCBjb25zdCosIGludCwgYm9vbCkgY29uc3TGBn9fX2N4eGFiaXYxOjpfX3NpX2NsYXNzX3R5cGVfaW5mbzo6c2VhcmNoX2Fib3ZlX2RzdChfX2N4eGFiaXYxOjpfX2R5bmFtaWNfY2FzdF9pbmZvKiwgdm9pZCBjb25zdCosIHZvaWQgY29uc3QqLCBpbnQsIGJvb2wpIGNvbnN0xwZ8X19jeHhhYml2MTo6X19jbGFzc190eXBlX2luZm86OnNlYXJjaF9hYm92ZV9kc3QoX19jeHhhYml2MTo6X19keW5hbWljX2Nhc3RfaW5mbyosIHZvaWQgY29uc3QqLCB2b2lkIGNvbnN0KiwgaW50LCBib29sKSBjb25zdMgGCGRsbWFsbG9jyQYGZGxmcmVlygYJZGxyZWFsbG9jywYRdHJ5X3JlYWxsb2NfY2h1bmvMBg1kaXNwb3NlX2NodW5rzQYXZW1zY3JpcHRlbl9nZXRfc2Jya19wdHLOBgRzYnJrzwYFZm1vZGzQBgZzY2FsYm7RBg1fX2ZwY2xhc3NpZnls0gYGbWVtY3B50wYGbWVtc2V01AYHbWVtbW92ZdUGCV9fdG93cml0ZdYGCV9fZndyaXRleNcGBmZ3cml0ZdgGBnByaW50ZtkGBnN0cmxlbtoGCXN0YWNrU2F2ZdsGDHN0YWNrUmVzdG9yZdwGCnN0YWNrQWxsb2PdBhZsZWdhbHN0dWIkZHluQ2FsbF9qaWpp3gYYbGVnYWxzdHViJGR5bkNhbGxfdmlpamlp3wYYbGVnYWxzdHViJGR5bkNhbGxfaWlpaWlq4AYZbGVnYWxzdHViJGR5bkNhbGxfaWlpaWlqauEGGmxlZ2Fsc3R1YiRkeW5DYWxsX2lpaWlpaWpq4gYWU0FGRV9IRUFQX0xPQURfaTMyXzFfMeMGGFNBRkVfSEVBUF9MT0FEX2kzMl8xX1VfMeQGGFNBRkVfSEVBUF9MT0FEX2kzMl8yX1VfMeUGGFNBRkVfSEVBUF9MT0FEX2kzMl8yX1VfMuYGFlNBRkVfSEVBUF9MT0FEX2kzMl80XzHnBhZTQUZFX0hFQVBfTE9BRF9pMzJfNF806AYWU0FGRV9IRUFQX0xPQURfaTY0XzJfMukGGFNBRkVfSEVBUF9MT0FEX2k2NF8yX1VfMuoGFlNBRkVfSEVBUF9MT0FEX2k2NF80XzTrBhhTQUZFX0hFQVBfTE9BRF9pNjRfNF9VXzTsBhZTQUZFX0hFQVBfTE9BRF9pNjRfOF8x7QYWU0FGRV9IRUFQX0xPQURfaTY0XzhfNO4GFlNBRkVfSEVBUF9MT0FEX2k2NF84XzjvBhZTQUZFX0hFQVBfTE9BRF9mNjRfOF848AYXU0FGRV9IRUFQX1NUT1JFX2kzMl8xXzHxBhdTQUZFX0hFQVBfU1RPUkVfaTMyXzJfMfIGF1NBRkVfSEVBUF9TVE9SRV9pMzJfMl8y8wYXU0FGRV9IRUFQX1NUT1JFX2kzMl80XzH0BhdTQUZFX0hFQVBfU1RPUkVfaTMyXzRfMvUGF1NBRkVfSEVBUF9TVE9SRV9pMzJfNF809gYXU0FGRV9IRUFQX1NUT1JFX2k2NF8xXzH3BhdTQUZFX0hFQVBfU1RPUkVfaTY0XzJfMvgGF1NBRkVfSEVBUF9TVE9SRV9pNjRfNF80+QYXU0FGRV9IRUFQX1NUT1JFX2k2NF84XzT6BhdTQUZFX0hFQVBfU1RPUkVfaTY0XzhfOPsGF1NBRkVfSEVBUF9TVE9SRV9mMzJfNF80/AYXU0FGRV9IRUFQX1NUT1JFX2Y2NF84XzgHLQMAD19fc3RhY2tfcG9pbnRlcgELX19zdGFja19lbmQCDF9fc3RhY2tfYmFzZQnFBDUABy5yb2RhdGEBCS5yb2RhdGEuMQIJLnJvZGF0YS4yAwkucm9kYXRhLjMECS5yb2RhdGEuNAUJLnJvZGF0YS41Bgkucm9kYXRhLjYHCS5yb2RhdGEuNwgJLnJvZGF0YS44CQkucm9kYXRhLjkKCi5yb2RhdGEuMTALCi5yb2RhdGEuMTEMCi5yb2RhdGEuMTINCi5yb2RhdGEuMTMOCi5yb2RhdGEuMTQPCi5yb2RhdGEuMTUQCi5yb2RhdGEuMTYRCi5yb2RhdGEuMTcSCi5yb2RhdGEuMTgTCi5yb2RhdGEuMTkUCi5yb2RhdGEuMjAVCi5yb2RhdGEuMjEWCi5yb2RhdGEuMjIXCi5yb2RhdGEuMjMYCi5yb2RhdGEuMjQZCi5yb2RhdGEuMjUaCi5yb2RhdGEuMjYbCi5yb2RhdGEuMjccCi5yb2RhdGEuMjgdCi5yb2RhdGEuMjkeCi5yb2RhdGEuMzAfCi5yb2RhdGEuMzEgCi5yb2RhdGEuMzIhCi5yb2RhdGEuMzMiCi5yb2RhdGEuMzQjCi5yb2RhdGEuMzUkCi5yb2RhdGEuMzYlBS5kYXRhJgcuZGF0YS4xJwcuZGF0YS4yKAcuZGF0YS4zKQcuZGF0YS40KgcuZGF0YS41KwcuZGF0YS42LAcuZGF0YS43LQcuZGF0YS44LgcuZGF0YS45LwguZGF0YS4xMDAILmRhdGEuMTExCC5kYXRhLjEyMgguZGF0YS4xMzMILmRhdGEuMTQ0CC5kYXRhLjE1";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
 try {
  if (file == wasmBinaryFile && wasmBinary) {
   return new Uint8Array(wasmBinary);
  }
  var binary = tryParseAsDataURI(file);
  if (binary) {
   return binary;
  }
  if (readBinary) {
   return readBinary(file);
  } else {
   throw "both async and sync fetching of the wasm failed";
  }
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise() {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch === "function" && !isFileURI(wasmBinaryFile)) {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(function() {
    return getBinary(wasmBinaryFile);
   });
  } else {
   if (readAsync) {
    return new Promise(function(resolve, reject) {
     readAsync(wasmBinaryFile, function(response) {
      resolve(new Uint8Array(response));
     }, reject);
    });
   }
  }
 }
 return Promise.resolve().then(function() {
  return getBinary(wasmBinaryFile);
 });
}

function createWasm() {
 var info = {
  "env": asmLibraryArg,
  "wasi_snapshot_preview1": asmLibraryArg
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  wasmMemory = Module["asm"]["memory"];
  assert(wasmMemory, "memory not found in wasm exports");
  updateGlobalBufferAndViews(wasmMemory.buffer);
  wasmTable = Module["asm"]["__indirect_function_table"];
  assert(wasmTable, "table not found in wasm exports");
  removeRunDependency("wasm-instantiate");
 }
 addRunDependency("wasm-instantiate");
 var trueModule = Module;
 function receiveInstantiatedSource(output) {
  assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
  trueModule = null;
  receiveInstance(output["instance"]);
 }
 function instantiateArrayBuffer(receiver) {
  return getBinaryPromise().then(function(binary) {
   return WebAssembly.instantiate(binary, info);
  }).then(receiver, function(reason) {
   err("failed to asynchronously prepare wasm: " + reason);
   if (isFileURI(wasmBinaryFile)) {
    err("warning: Loading from a file URI (" + wasmBinaryFile + ") is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing");
   }
   abort(reason);
  });
 }
 function instantiateAsync() {
  if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && typeof fetch === "function") {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    var result = WebAssembly.instantiateStreaming(response, info);
    return result.then(receiveInstantiatedSource, function(reason) {
     err("wasm streaming compile failed: " + reason);
     err("falling back to ArrayBuffer instantiation");
     return instantiateArrayBuffer(receiveInstantiatedSource);
    });
   });
  } else {
   return instantiateArrayBuffer(receiveInstantiatedSource);
  }
 }
 if (Module["instantiateWasm"]) {
  try {
   var exports = Module["instantiateWasm"](info, receiveInstance);
   return exports;
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 instantiateAsync();
 return {};
}

var tempDouble;

var tempI64;

var ASM_CONSTS = {};

function abortStackOverflow(allocSize) {
 abort("Stack overflow! Attempted to allocate " + allocSize + " bytes on the stack, but stack has only " + (_emscripten_stack_get_free() + allocSize) + " bytes available!");
}

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback(Module);
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    wasmTable.get(func)();
   } else {
    wasmTable.get(func)(callback.arg);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}

function demangle(func) {
 warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
 return func;
}

function demangleAll(text) {
 var regex = /\b_Z[\w\d_]+/g;
 return text.replace(regex, function(x) {
  var y = demangle(x);
  return x === y ? x : y + " [" + x + "]";
 });
}

function jsStackTrace() {
 var error = new Error();
 if (!error.stack) {
  try {
   throw new Error();
  } catch (e) {
   error = e;
  }
  if (!error.stack) {
   return "(no stack trace available)";
  }
 }
 return error.stack.toString();
}

function stackTrace() {
 var js = jsStackTrace();
 if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
 return demangleAll(js);
}

function unSign(value, bits) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}

function _atexit(func, arg) {}

function ___cxa_atexit(a0, a1) {
 return _atexit(a0, a1);
}

function getShiftFromSize(size) {
 switch (size) {
 case 1:
  return 0;

 case 2:
  return 1;

 case 4:
  return 2;

 case 8:
  return 3;

 default:
  throw new TypeError("Unknown type size: " + size);
 }
}

function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}

var embind_charCodes = undefined;

function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (SAFE_HEAP_LOAD(c, 1, 1)) {
  ret += embind_charCodes[SAFE_HEAP_LOAD(c++, 1, 1)];
 }
 return ret;
}

var awaitingDependencies = {};

var registeredTypes = {};

var typeDependencies = {};

var char_0 = 48;

var char_9 = 57;

function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 } else {
  return name;
 }
}

function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body);
}

function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, function(message) {
  this.name = errorName;
  this.message = message;
  var stack = new Error(message).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 });
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 };
 return errorClass;
}

var BindingError = undefined;

function throwBindingError(message) {
 throw new BindingError(message);
}

var InternalError = undefined;

function throwInternalError(message) {
 throw new InternalError(message);
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach(function(type) {
  typeDependencies[type] = dependentTypes;
 });
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach(function(dt, i) {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push(function() {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   });
  }
 });
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}

function registerType(rawType, registeredInstance, options) {
 options = options || {};
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach(function(cb) {
   cb();
  });
 }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(wt) {
   return !!wt;
  },
  "toWireType": function(destructors, o) {
   return o ? trueValue : falseValue;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": function(pointer) {
   var heap;
   if (size === 1) {
    heap = HEAP8;
   } else if (size === 2) {
    heap = HEAP16;
   } else if (size === 4) {
    heap = HEAP32;
   } else {
    throw new TypeError("Unknown boolean type size: " + name);
   }
   return this["fromWireType"](heap[pointer >> shift]);
  },
  destructorFunction: null
 });
}

var emval_free_list = [];

var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];

function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}

function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}

function get_first_emval() {
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}

function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}

function __emval_register(value) {
 switch (value) {
 case undefined:
  {
   return 1;
  }

 case null:
  {
   return 2;
  }

 case true:
  {
   return 3;
  }

 case false:
  {
   return 4;
  }

 default:
  {
   var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
   emval_handle_array[handle] = {
    refcount: 1,
    value: value
   };
   return handle;
  }
 }
}

function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](SAFE_HEAP_LOAD((pointer >> 2) * 4, 4, 1));
}

function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(handle) {
   var rv = emval_handle_array[handle].value;
   __emval_decref(handle);
   return rv;
  },
  "toWireType": function(destructors, value) {
   return __emval_register(value);
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}

function _embind_repr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}

function floatReadValueFromPointer(name, shift) {
 switch (shift) {
 case 2:
  return function(pointer) {
   return this["fromWireType"](SAFE_HEAP_LOAD_D((pointer >> 2) * 4, 4, 0));
  };

 case 3:
  return function(pointer) {
   return this["fromWireType"](SAFE_HEAP_LOAD_D((pointer >> 3) * 8, 8, 0));
  };

 default:
  throw new TypeError("Unknown float type: " + name);
 }
}

function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   return value;
  },
  "toWireType": function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   return value;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}

function new_(constructor, argumentList) {
 if (!(constructor instanceof Function)) {
  throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
 }
 var dummy = createNamedFunction(constructor.name || "unknownFunctionName", function() {});
 dummy.prototype = constructor.prototype;
 var obj = new dummy();
 var r = constructor.apply(obj, argumentList);
 return r instanceof Object ? r : obj;
}

function runDestructors(destructors) {
 while (destructors.length) {
  var ptr = destructors.pop();
  var del = destructors.pop();
  del(ptr);
 }
}

function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
 var argCount = argTypes.length;
 if (argCount < 2) {
  throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
 }
 var isClassMethodFunc = argTypes[1] !== null && classType !== null;
 var needsDestructorStack = false;
 for (var i = 1; i < argTypes.length; ++i) {
  if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
   needsDestructorStack = true;
   break;
  }
 }
 var returns = argTypes[0].name !== "void";
 var argsList = "";
 var argsListWired = "";
 for (var i = 0; i < argCount - 2; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
 }
 var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
 if (needsDestructorStack) {
  invokerFnBody += "var destructors = [];\n";
 }
 var dtorStack = needsDestructorStack ? "destructors" : "null";
 var args1 = [ "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam" ];
 var args2 = [ throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1] ];
 if (isClassMethodFunc) {
  invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
 }
 for (var i = 0; i < argCount - 2; ++i) {
  invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
  args1.push("argType" + i);
  args2.push(argTypes[i + 2]);
 }
 if (isClassMethodFunc) {
  argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
 }
 invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
 if (needsDestructorStack) {
  invokerFnBody += "runDestructors(destructors);\n";
 } else {
  for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
   var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
   if (argTypes[i].destructorFunction !== null) {
    invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
    args1.push(paramName + "_dtor");
    args2.push(argTypes[i].destructorFunction);
   }
  }
 }
 if (returns) {
  invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
 } else {}
 invokerFnBody += "}\n";
 args1.push(invokerFnBody);
 var invokerFunction = new_(Function, args1).apply(null, args2);
 return invokerFunction;
}

function ensureOverloadTable(proto, methodName, humanName) {
 if (undefined === proto[methodName].overloadTable) {
  var prevFunc = proto[methodName];
  proto[methodName] = function() {
   if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
    throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
   }
   return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
  };
  proto[methodName].overloadTable = [];
  proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
 }
}

function exposePublicSymbol(name, value, numArguments) {
 if (Module.hasOwnProperty(name)) {
  if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
   throwBindingError("Cannot register public name '" + name + "' twice");
  }
  ensureOverloadTable(Module, name, name);
  if (Module.hasOwnProperty(numArguments)) {
   throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
  }
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  if (undefined !== numArguments) {
   Module[name].numArguments = numArguments;
  }
 }
}

function heap32VectorToArray(count, firstElement) {
 var array = [];
 for (var i = 0; i < count; i++) {
  array.push(SAFE_HEAP_LOAD(((firstElement >> 2) + i) * 4, 4, 0));
 }
 return array;
}

function replacePublicSymbol(name, value, numArguments) {
 if (!Module.hasOwnProperty(name)) {
  throwInternalError("Replacing nonexistant public symbol");
 }
 if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  Module[name].argCount = numArguments;
 }
}

function dynCallLegacy(sig, ptr, args) {
 assert("dynCall_" + sig in Module, "bad function pointer type - no table for sig '" + sig + "'");
 if (args && args.length) {
  assert(args.length === sig.substring(1).replace(/j/g, "--").length);
 } else {
  assert(sig.length == 1);
 }
 var f = Module["dynCall_" + sig];
 return args && args.length ? f.apply(null, [ ptr ].concat(args)) : f.call(null, ptr);
}

function dynCall(sig, ptr, args) {
 if (sig.indexOf("j") != -1) {
  return dynCallLegacy(sig, ptr, args);
 }
 assert(wasmTable.get(ptr), "missing table entry in dynCall: " + ptr);
 return wasmTable.get(ptr).apply(null, args);
}

function getDynCaller(sig, ptr) {
 assert(sig.indexOf("j") >= 0, "getDynCaller should only be called with i64 sigs");
 var argCache = [];
 return function() {
  argCache.length = arguments.length;
  for (var i = 0; i < arguments.length; i++) {
   argCache[i] = arguments[i];
  }
  return dynCall(sig, ptr, argCache);
 };
}

function embind__requireFunction(signature, rawFunction) {
 signature = readLatin1String(signature);
 function makeDynCaller() {
  if (signature.indexOf("j") != -1) {
   return getDynCaller(signature, rawFunction);
  }
  return wasmTable.get(rawFunction);
 }
 var fp = makeDynCaller();
 if (typeof fp !== "function") {
  throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
 }
 return fp;
}

var UnboundTypeError = undefined;

function getTypeName(type) {
 var ptr = ___getTypeName(type);
 var rv = readLatin1String(ptr);
 _free(ptr);
 return rv;
}

function throwUnboundTypeError(message, types) {
 var unboundTypes = [];
 var seen = {};
 function visit(type) {
  if (seen[type]) {
   return;
  }
  if (registeredTypes[type]) {
   return;
  }
  if (typeDependencies[type]) {
   typeDependencies[type].forEach(visit);
   return;
  }
  unboundTypes.push(type);
  seen[type] = true;
 }
 types.forEach(visit);
 throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([ ", " ]));
}

function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
 var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 name = readLatin1String(name);
 rawInvoker = embind__requireFunction(signature, rawInvoker);
 exposePublicSymbol(name, function() {
  throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes);
 }, argCount - 1);
 whenDependentTypesAreResolved([], argTypes, function(argTypes) {
  var invokerArgsArray = [ argTypes[0], null ].concat(argTypes.slice(1));
  replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
  return [];
 });
}

function integerReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? function readS8FromPointer(pointer) {
   return SAFE_HEAP_LOAD(pointer, 1, 0);
  } : function readU8FromPointer(pointer) {
   return SAFE_HEAP_LOAD(pointer, 1, 1);
  };

 case 1:
  return signed ? function readS16FromPointer(pointer) {
   return SAFE_HEAP_LOAD((pointer >> 1) * 2, 2, 0);
  } : function readU16FromPointer(pointer) {
   return SAFE_HEAP_LOAD((pointer >> 1) * 2, 2, 1);
  };

 case 2:
  return signed ? function readS32FromPointer(pointer) {
   return SAFE_HEAP_LOAD((pointer >> 2) * 4, 4, 0);
  } : function readU32FromPointer(pointer) {
   return SAFE_HEAP_LOAD((pointer >> 2) * 4, 4, 1);
  };

 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = function(value) {
  return value;
 };
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = function(value) {
   return value << bitshift >>> bitshift;
  };
 }
 var isUnsignedType = name.indexOf("unsigned") != -1;
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   if (value < minRange || value > maxRange) {
    throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
   }
   return isUnsignedType ? value >>> 0 : value | 0;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = HEAPU32;
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(buffer, data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}

function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 var stdStringIsUTF8 = name === "std::string";
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = SAFE_HEAP_LOAD((value >> 2) * 4, 4, 1);
   var str;
   if (stdStringIsUTF8) {
    var decodeStartPtr = value + 4;
    for (var i = 0; i <= length; ++i) {
     var currentBytePtr = value + 4 + i;
     if (i == length || SAFE_HEAP_LOAD(currentBytePtr, 1, 1) == 0) {
      var maxRead = currentBytePtr - decodeStartPtr;
      var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
      if (str === undefined) {
       str = stringSegment;
      } else {
       str += String.fromCharCode(0);
       str += stringSegment;
      }
      decodeStartPtr = currentBytePtr + 1;
     }
    }
   } else {
    var a = new Array(length);
    for (var i = 0; i < length; ++i) {
     a[i] = String.fromCharCode(SAFE_HEAP_LOAD(value + 4 + i, 1, 1));
    }
    str = a.join("");
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   var getLength;
   var valueIsOfTypeString = typeof value === "string";
   if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
    throwBindingError("Cannot pass non-string to std::string");
   }
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    getLength = function() {
     return lengthBytesUTF8(value);
    };
   } else {
    getLength = function() {
     return value.length;
    };
   }
   var length = getLength();
   var ptr = _malloc(4 + length + 1);
   SAFE_HEAP_STORE((ptr >> 2) * 4, length, 4);
   if (stdStringIsUTF8 && valueIsOfTypeString) {
    stringToUTF8(value, ptr + 4, length + 1);
   } else {
    if (valueIsOfTypeString) {
     for (var i = 0; i < length; ++i) {
      var charCode = value.charCodeAt(i);
      if (charCode > 255) {
       _free(ptr);
       throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
      }
      SAFE_HEAP_STORE(ptr + 4 + i, charCode, 1);
     }
    } else {
     for (var i = 0; i < length; ++i) {
      SAFE_HEAP_STORE(ptr + 4 + i, value[i], 1);
     }
    }
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
 if (charSize === 2) {
  decodeString = UTF16ToString;
  encodeString = stringToUTF16;
  lengthBytesUTF = lengthBytesUTF16;
  getHeap = function() {
   return HEAPU16;
  };
  shift = 1;
 } else if (charSize === 4) {
  decodeString = UTF32ToString;
  encodeString = stringToUTF32;
  lengthBytesUTF = lengthBytesUTF32;
  getHeap = function() {
   return HEAPU32;
  };
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": function(value) {
   var length = SAFE_HEAP_LOAD((value >> 2) * 4, 4, 1);
   var HEAP = getHeap();
   var str;
   var decodeStartPtr = value + 4;
   for (var i = 0; i <= length; ++i) {
    var currentBytePtr = value + 4 + i * charSize;
    if (i == length || HEAP[currentBytePtr >> shift] == 0) {
     var maxReadBytes = currentBytePtr - decodeStartPtr;
     var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
     if (str === undefined) {
      str = stringSegment;
     } else {
      str += String.fromCharCode(0);
      str += stringSegment;
     }
     decodeStartPtr = currentBytePtr + charSize;
    }
   }
   _free(value);
   return str;
  },
  "toWireType": function(destructors, value) {
   if (!(typeof value === "string")) {
    throwBindingError("Cannot pass non-string to C++ string type " + name);
   }
   var length = lengthBytesUTF(value);
   var ptr = _malloc(4 + length + charSize);
   SAFE_HEAP_STORE((ptr >> 2) * 4, length >> shift, 4);
   encodeString(value, ptr + 4, length + charSize);
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  },
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: function(ptr) {
   _free(ptr);
  }
 });
}

function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": function() {
   return undefined;
  },
  "toWireType": function(destructors, o) {
   return undefined;
  }
 });
}

function _abort() {
 abort();
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.copyWithin(dest, src, src + num);
}

function _emscripten_get_heap_size() {
 return HEAPU8.length;
}

function emscripten_realloc_buffer(size) {
 try {
  wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
  updateGlobalBufferAndViews(wasmMemory.buffer);
  return 1;
 } catch (e) {
  console.error("emscripten_realloc_buffer: Attempted to grow heap from " + buffer.byteLength + " bytes to " + size + " bytes, but got error: " + e);
 }
}

function _emscripten_resize_heap(requestedSize) {
 var oldSize = _emscripten_get_heap_size();
 assert(requestedSize > oldSize);
 var maxHeapSize = 2147483648;
 if (requestedSize > maxHeapSize) {
  err("Cannot enlarge memory, asked to go up to " + requestedSize + " bytes, but the limit is " + maxHeapSize + " bytes!");
  return false;
 }
 for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
  var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
  overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
  var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
  var replacement = emscripten_realloc_buffer(newSize);
  if (replacement) {
   return true;
  }
 }
 err("Failed to grow the heap from " + oldSize + " bytes to " + newSize + " bytes, not enough memory!");
 return false;
}

var ENV = {};

function getExecutableName() {
 return thisProgram || "./this.program";
}

function getEnvStrings() {
 if (!getEnvStrings.strings) {
  var lang = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
  var env = {
   "USER": "web_user",
   "LOGNAME": "web_user",
   "PATH": "/",
   "PWD": "/",
   "HOME": "/home/web_user",
   "LANG": lang,
   "_": getExecutableName()
  };
  for (var x in ENV) {
   env[x] = ENV[x];
  }
  var strings = [];
  for (var x in env) {
   strings.push(x + "=" + env[x]);
  }
  getEnvStrings.strings = strings;
 }
 return getEnvStrings.strings;
}

var PATH = {
 splitPath: function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 },
 normalizeArray: function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (;up; up--) {
    parts.unshift("..");
   }
  }
  return parts;
 },
 normalize: function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter(function(p) {
   return !!p;
  }), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 },
 dirname: function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 },
 basename: function(path) {
  if (path === "/") return "/";
  path = PATH.normalize(path);
  path = path.replace(/\/$/, "");
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 },
 extname: function(path) {
  return PATH.splitPath(path)[3];
 },
 join: function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
 },
 join2: function(l, r) {
  return PATH.normalize(l + "/" + r);
 }
};

function getRandomDevice() {
 if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
  var randomBuffer = new Uint8Array(1);
  return function() {
   crypto.getRandomValues(randomBuffer);
   return randomBuffer[0];
  };
 } else if (ENVIRONMENT_IS_NODE) {
  try {
   var crypto_module = require("crypto");
   return function() {
    return crypto_module["randomBytes"](1)[0];
   };
  } catch (e) {}
 }
 return function() {
  abort("no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: function(array) { for (var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };");
 };
}

var PATH_FS = {
 resolve: function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
   var path = i >= 0 ? arguments[i] : FS.cwd();
   if (typeof path !== "string") {
    throw new TypeError("Arguments to path.resolve must be strings");
   } else if (!path) {
    return "";
   }
   resolvedPath = path + "/" + resolvedPath;
   resolvedAbsolute = path.charAt(0) === "/";
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
   return !!p;
  }), !resolvedAbsolute).join("/");
  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
 },
 relative: function(from, to) {
  from = PATH_FS.resolve(from).substr(1);
  to = PATH_FS.resolve(to).substr(1);
  function trim(arr) {
   var start = 0;
   for (;start < arr.length; start++) {
    if (arr[start] !== "") break;
   }
   var end = arr.length - 1;
   for (;end >= 0; end--) {
    if (arr[end] !== "") break;
   }
   if (start > end) return [];
   return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
   if (fromParts[i] !== toParts[i]) {
    samePartsLength = i;
    break;
   }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
   outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
 }
};

var TTY = {
 ttys: [],
 init: function() {},
 shutdown: function() {},
 register: function(dev, ops) {
  TTY.ttys[dev] = {
   input: [],
   output: [],
   ops: ops
  };
  FS.registerDevice(dev, TTY.stream_ops);
 },
 stream_ops: {
  open: function(stream) {
   var tty = TTY.ttys[stream.node.rdev];
   if (!tty) {
    throw new FS.ErrnoError(43);
   }
   stream.tty = tty;
   stream.seekable = false;
  },
  close: function(stream) {
   stream.tty.ops.flush(stream.tty);
  },
  flush: function(stream) {
   stream.tty.ops.flush(stream.tty);
  },
  read: function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(60);
   }
   var bytesRead = 0;
   for (var i = 0; i < length; i++) {
    var result;
    try {
     result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
     throw new FS.ErrnoError(29);
    }
    if (result === undefined && bytesRead === 0) {
     throw new FS.ErrnoError(6);
    }
    if (result === null || result === undefined) break;
    bytesRead++;
    buffer[offset + i] = result;
   }
   if (bytesRead) {
    stream.node.timestamp = Date.now();
   }
   return bytesRead;
  },
  write: function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(60);
   }
   try {
    for (var i = 0; i < length; i++) {
     stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    }
   } catch (e) {
    throw new FS.ErrnoError(29);
   }
   if (length) {
    stream.node.timestamp = Date.now();
   }
   return i;
  }
 },
 default_tty_ops: {
  get_char: function(tty) {
   if (!tty.input.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
     var BUFSIZE = 256;
     var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
     var bytesRead = 0;
     try {
      bytesRead = nodeFS.readSync(process.stdin.fd, buf, 0, BUFSIZE, null);
     } catch (e) {
      if (e.toString().indexOf("EOF") != -1) bytesRead = 0; else throw e;
     }
     if (bytesRead > 0) {
      result = buf.slice(0, bytesRead).toString("utf-8");
     } else {
      result = null;
     }
    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
     result = window.prompt("Input: ");
     if (result !== null) {
      result += "\n";
     }
    } else if (typeof readline == "function") {
     result = readline();
     if (result !== null) {
      result += "\n";
     }
    }
    if (!result) {
     return null;
    }
    tty.input = intArrayFromString(result, true);
   }
   return tty.input.shift();
  },
  put_char: function(tty, val) {
   if (val === null || val === 10) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  },
  flush: function(tty) {
   if (tty.output && tty.output.length > 0) {
    out(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  }
 },
 default_tty1_ops: {
  put_char: function(tty, val) {
   if (val === null || val === 10) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  },
  flush: function(tty) {
   if (tty.output && tty.output.length > 0) {
    err(UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  }
 }
};

function mmapAlloc(size) {
 var alignedSize = alignMemory(size, 16384);
 var ptr = _malloc(alignedSize);
 while (size < alignedSize) SAFE_HEAP_STORE(ptr + size++, 0, 1);
 return ptr;
}

var MEMFS = {
 ops_table: null,
 mount: function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
 },
 createNode: function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
   throw new FS.ErrnoError(63);
  }
  if (!MEMFS.ops_table) {
   MEMFS.ops_table = {
    dir: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      lookup: MEMFS.node_ops.lookup,
      mknod: MEMFS.node_ops.mknod,
      rename: MEMFS.node_ops.rename,
      unlink: MEMFS.node_ops.unlink,
      rmdir: MEMFS.node_ops.rmdir,
      readdir: MEMFS.node_ops.readdir,
      symlink: MEMFS.node_ops.symlink
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek
     }
    },
    file: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek,
      read: MEMFS.stream_ops.read,
      write: MEMFS.stream_ops.write,
      allocate: MEMFS.stream_ops.allocate,
      mmap: MEMFS.stream_ops.mmap,
      msync: MEMFS.stream_ops.msync
     }
    },
    link: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      readlink: MEMFS.node_ops.readlink
     },
     stream: {}
    },
    chrdev: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: FS.chrdev_stream_ops
    }
   };
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
   node.node_ops = MEMFS.ops_table.dir.node;
   node.stream_ops = MEMFS.ops_table.dir.stream;
   node.contents = {};
  } else if (FS.isFile(node.mode)) {
   node.node_ops = MEMFS.ops_table.file.node;
   node.stream_ops = MEMFS.ops_table.file.stream;
   node.usedBytes = 0;
   node.contents = null;
  } else if (FS.isLink(node.mode)) {
   node.node_ops = MEMFS.ops_table.link.node;
   node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
   node.node_ops = MEMFS.ops_table.chrdev.node;
   node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
   parent.contents[name] = node;
   parent.timestamp = node.timestamp;
  }
  return node;
 },
 getFileDataAsTypedArray: function(node) {
  if (!node.contents) return new Uint8Array(0);
  if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
 },
 expandFileStorage: function(node, newCapacity) {
  var prevCapacity = node.contents ? node.contents.length : 0;
  if (prevCapacity >= newCapacity) return;
  var CAPACITY_DOUBLING_MAX = 1024 * 1024;
  newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
  if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
  var oldContents = node.contents;
  node.contents = new Uint8Array(newCapacity);
  if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
 },
 resizeFileStorage: function(node, newSize) {
  if (node.usedBytes == newSize) return;
  if (newSize == 0) {
   node.contents = null;
   node.usedBytes = 0;
  } else {
   var oldContents = node.contents;
   node.contents = new Uint8Array(newSize);
   if (oldContents) {
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
   }
   node.usedBytes = newSize;
  }
 },
 node_ops: {
  getattr: function(node) {
   var attr = {};
   attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
   attr.ino = node.id;
   attr.mode = node.mode;
   attr.nlink = 1;
   attr.uid = 0;
   attr.gid = 0;
   attr.rdev = node.rdev;
   if (FS.isDir(node.mode)) {
    attr.size = 4096;
   } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
   } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
   } else {
    attr.size = 0;
   }
   attr.atime = new Date(node.timestamp);
   attr.mtime = new Date(node.timestamp);
   attr.ctime = new Date(node.timestamp);
   attr.blksize = 4096;
   attr.blocks = Math.ceil(attr.size / attr.blksize);
   return attr;
  },
  setattr: function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
   if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
   }
  },
  lookup: function(parent, name) {
   throw FS.genericErrors[44];
  },
  mknod: function(parent, name, mode, dev) {
   return MEMFS.createNode(parent, name, mode, dev);
  },
  rename: function(old_node, new_dir, new_name) {
   if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
     new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (new_node) {
     for (var i in new_node.contents) {
      throw new FS.ErrnoError(55);
     }
    }
   }
   delete old_node.parent.contents[old_node.name];
   old_node.parent.timestamp = Date.now();
   old_node.name = new_name;
   new_dir.contents[new_name] = old_node;
   new_dir.timestamp = old_node.parent.timestamp;
   old_node.parent = new_dir;
  },
  unlink: function(parent, name) {
   delete parent.contents[name];
   parent.timestamp = Date.now();
  },
  rmdir: function(parent, name) {
   var node = FS.lookupNode(parent, name);
   for (var i in node.contents) {
    throw new FS.ErrnoError(55);
   }
   delete parent.contents[name];
   parent.timestamp = Date.now();
  },
  readdir: function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  },
  symlink: function(parent, newname, oldpath) {
   var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
   node.link = oldpath;
   return node;
  },
  readlink: function(node) {
   if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(28);
   }
   return node.link;
  }
 },
 stream_ops: {
  read: function(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= stream.node.usedBytes) return 0;
   var size = Math.min(stream.node.usedBytes - position, length);
   assert(size >= 0);
   if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
   } else {
    for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
   }
   return size;
  },
  write: function(stream, buffer, offset, length, position, canOwn) {
   assert(!(buffer instanceof ArrayBuffer));
   if (buffer.buffer === HEAP8.buffer) {
    canOwn = false;
   }
   if (!length) return 0;
   var node = stream.node;
   node.timestamp = Date.now();
   if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
     assert(position === 0, "canOwn must imply no weird position inside the file");
     node.contents = buffer.subarray(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (node.usedBytes === 0 && position === 0) {
     node.contents = buffer.slice(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (position + length <= node.usedBytes) {
     node.contents.set(buffer.subarray(offset, offset + length), position);
     return length;
    }
   }
   MEMFS.expandFileStorage(node, position + length);
   if (node.contents.subarray && buffer.subarray) {
    node.contents.set(buffer.subarray(offset, offset + length), position);
   } else {
    for (var i = 0; i < length; i++) {
     node.contents[position + i] = buffer[offset + i];
    }
   }
   node.usedBytes = Math.max(node.usedBytes, position + length);
   return length;
  },
  llseek: function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.usedBytes;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(28);
   }
   return position;
  },
  allocate: function(stream, offset, length) {
   MEMFS.expandFileStorage(stream.node, offset + length);
   stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
  },
  mmap: function(stream, address, length, position, prot, flags) {
   if (address !== 0) {
    throw new FS.ErrnoError(28);
   }
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
   }
   var ptr;
   var allocated;
   var contents = stream.node.contents;
   if (!(flags & 2) && contents.buffer === buffer) {
    allocated = false;
    ptr = contents.byteOffset;
   } else {
    if (position > 0 || position + length < contents.length) {
     if (contents.subarray) {
      contents = contents.subarray(position, position + length);
     } else {
      contents = Array.prototype.slice.call(contents, position, position + length);
     }
    }
    allocated = true;
    ptr = mmapAlloc(length);
    if (!ptr) {
     throw new FS.ErrnoError(48);
    }
    HEAP8.set(contents, ptr);
   }
   return {
    ptr: ptr,
    allocated: allocated
   };
  },
  msync: function(stream, buffer, offset, length, mmapFlags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(43);
   }
   if (mmapFlags & 2) {
    return 0;
   }
   var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
   return 0;
  }
 }
};

var ERRNO_MESSAGES = {
 0: "Success",
 1: "Arg list too long",
 2: "Permission denied",
 3: "Address already in use",
 4: "Address not available",
 5: "Address family not supported by protocol family",
 6: "No more processes",
 7: "Socket already connected",
 8: "Bad file number",
 9: "Trying to read unreadable message",
 10: "Mount device busy",
 11: "Operation canceled",
 12: "No children",
 13: "Connection aborted",
 14: "Connection refused",
 15: "Connection reset by peer",
 16: "File locking deadlock error",
 17: "Destination address required",
 18: "Math arg out of domain of func",
 19: "Quota exceeded",
 20: "File exists",
 21: "Bad address",
 22: "File too large",
 23: "Host is unreachable",
 24: "Identifier removed",
 25: "Illegal byte sequence",
 26: "Connection already in progress",
 27: "Interrupted system call",
 28: "Invalid argument",
 29: "I/O error",
 30: "Socket is already connected",
 31: "Is a directory",
 32: "Too many symbolic links",
 33: "Too many open files",
 34: "Too many links",
 35: "Message too long",
 36: "Multihop attempted",
 37: "File or path name too long",
 38: "Network interface is not configured",
 39: "Connection reset by network",
 40: "Network is unreachable",
 41: "Too many open files in system",
 42: "No buffer space available",
 43: "No such device",
 44: "No such file or directory",
 45: "Exec format error",
 46: "No record locks available",
 47: "The link has been severed",
 48: "Not enough core",
 49: "No message of desired type",
 50: "Protocol not available",
 51: "No space left on device",
 52: "Function not implemented",
 53: "Socket is not connected",
 54: "Not a directory",
 55: "Directory not empty",
 56: "State not recoverable",
 57: "Socket operation on non-socket",
 59: "Not a typewriter",
 60: "No such device or address",
 61: "Value too large for defined data type",
 62: "Previous owner died",
 63: "Not super-user",
 64: "Broken pipe",
 65: "Protocol error",
 66: "Unknown protocol",
 67: "Protocol wrong type for socket",
 68: "Math result not representable",
 69: "Read only file system",
 70: "Illegal seek",
 71: "No such process",
 72: "Stale file handle",
 73: "Connection timed out",
 74: "Text file busy",
 75: "Cross-device link",
 100: "Device not a stream",
 101: "Bad font file fmt",
 102: "Invalid slot",
 103: "Invalid request code",
 104: "No anode",
 105: "Block device required",
 106: "Channel number out of range",
 107: "Level 3 halted",
 108: "Level 3 reset",
 109: "Link number out of range",
 110: "Protocol driver not attached",
 111: "No CSI structure available",
 112: "Level 2 halted",
 113: "Invalid exchange",
 114: "Invalid request descriptor",
 115: "Exchange full",
 116: "No data (for no delay io)",
 117: "Timer expired",
 118: "Out of streams resources",
 119: "Machine is not on the network",
 120: "Package not installed",
 121: "The object is remote",
 122: "Advertise error",
 123: "Srmount error",
 124: "Communication error on send",
 125: "Cross mount point (not really error)",
 126: "Given log. name not unique",
 127: "f.d. invalid for this operation",
 128: "Remote address changed",
 129: "Can   access a needed shared lib",
 130: "Accessing a corrupted shared lib",
 131: ".lib section in a.out corrupted",
 132: "Attempting to link in too many libs",
 133: "Attempting to exec a shared library",
 135: "Streams pipe error",
 136: "Too many users",
 137: "Socket type not supported",
 138: "Not supported",
 139: "Protocol family not supported",
 140: "Can't send after socket shutdown",
 141: "Too many references",
 142: "Host is down",
 148: "No medium (in tape drive)",
 156: "Level 2 not synchronized"
};

var ERRNO_CODES = {
 EPERM: 63,
 ENOENT: 44,
 ESRCH: 71,
 EINTR: 27,
 EIO: 29,
 ENXIO: 60,
 E2BIG: 1,
 ENOEXEC: 45,
 EBADF: 8,
 ECHILD: 12,
 EAGAIN: 6,
 EWOULDBLOCK: 6,
 ENOMEM: 48,
 EACCES: 2,
 EFAULT: 21,
 ENOTBLK: 105,
 EBUSY: 10,
 EEXIST: 20,
 EXDEV: 75,
 ENODEV: 43,
 ENOTDIR: 54,
 EISDIR: 31,
 EINVAL: 28,
 ENFILE: 41,
 EMFILE: 33,
 ENOTTY: 59,
 ETXTBSY: 74,
 EFBIG: 22,
 ENOSPC: 51,
 ESPIPE: 70,
 EROFS: 69,
 EMLINK: 34,
 EPIPE: 64,
 EDOM: 18,
 ERANGE: 68,
 ENOMSG: 49,
 EIDRM: 24,
 ECHRNG: 106,
 EL2NSYNC: 156,
 EL3HLT: 107,
 EL3RST: 108,
 ELNRNG: 109,
 EUNATCH: 110,
 ENOCSI: 111,
 EL2HLT: 112,
 EDEADLK: 16,
 ENOLCK: 46,
 EBADE: 113,
 EBADR: 114,
 EXFULL: 115,
 ENOANO: 104,
 EBADRQC: 103,
 EBADSLT: 102,
 EDEADLOCK: 16,
 EBFONT: 101,
 ENOSTR: 100,
 ENODATA: 116,
 ETIME: 117,
 ENOSR: 118,
 ENONET: 119,
 ENOPKG: 120,
 EREMOTE: 121,
 ENOLINK: 47,
 EADV: 122,
 ESRMNT: 123,
 ECOMM: 124,
 EPROTO: 65,
 EMULTIHOP: 36,
 EDOTDOT: 125,
 EBADMSG: 9,
 ENOTUNIQ: 126,
 EBADFD: 127,
 EREMCHG: 128,
 ELIBACC: 129,
 ELIBBAD: 130,
 ELIBSCN: 131,
 ELIBMAX: 132,
 ELIBEXEC: 133,
 ENOSYS: 52,
 ENOTEMPTY: 55,
 ENAMETOOLONG: 37,
 ELOOP: 32,
 EOPNOTSUPP: 138,
 EPFNOSUPPORT: 139,
 ECONNRESET: 15,
 ENOBUFS: 42,
 EAFNOSUPPORT: 5,
 EPROTOTYPE: 67,
 ENOTSOCK: 57,
 ENOPROTOOPT: 50,
 ESHUTDOWN: 140,
 ECONNREFUSED: 14,
 EADDRINUSE: 3,
 ECONNABORTED: 13,
 ENETUNREACH: 40,
 ENETDOWN: 38,
 ETIMEDOUT: 73,
 EHOSTDOWN: 142,
 EHOSTUNREACH: 23,
 EINPROGRESS: 26,
 EALREADY: 7,
 EDESTADDRREQ: 17,
 EMSGSIZE: 35,
 EPROTONOSUPPORT: 66,
 ESOCKTNOSUPPORT: 137,
 EADDRNOTAVAIL: 4,
 ENETRESET: 39,
 EISCONN: 30,
 ENOTCONN: 53,
 ETOOMANYREFS: 141,
 EUSERS: 136,
 EDQUOT: 19,
 ESTALE: 72,
 ENOTSUP: 138,
 ENOMEDIUM: 148,
 EILSEQ: 25,
 EOVERFLOW: 61,
 ECANCELED: 11,
 ENOTRECOVERABLE: 56,
 EOWNERDEAD: 62,
 ESTRPIPE: 135
};

var FS = {
 root: null,
 mounts: [],
 devices: {},
 streams: [],
 nextInode: 1,
 nameTable: null,
 currentPath: "/",
 initialized: false,
 ignorePermissions: true,
 trackingDelegate: {},
 tracking: {
  openFlags: {
   READ: 1,
   WRITE: 2
  }
 },
 ErrnoError: null,
 genericErrors: {},
 filesystems: null,
 syncFSRequests: 0,
 lookupPath: function(path, opts) {
  path = PATH_FS.resolve(FS.cwd(), path);
  opts = opts || {};
  if (!path) return {
   path: "",
   node: null
  };
  var defaults = {
   follow_mount: true,
   recurse_count: 0
  };
  for (var key in defaults) {
   if (opts[key] === undefined) {
    opts[key] = defaults[key];
   }
  }
  if (opts.recurse_count > 8) {
   throw new FS.ErrnoError(32);
  }
  var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
   return !!p;
  }), false);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
   var islast = i === parts.length - 1;
   if (islast && opts.parent) {
    break;
   }
   current = FS.lookupNode(current, parts[i]);
   current_path = PATH.join2(current_path, parts[i]);
   if (FS.isMountpoint(current)) {
    if (!islast || islast && opts.follow_mount) {
     current = current.mounted.root;
    }
   }
   if (!islast || opts.follow) {
    var count = 0;
    while (FS.isLink(current.mode)) {
     var link = FS.readlink(current_path);
     current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
     var lookup = FS.lookupPath(current_path, {
      recurse_count: opts.recurse_count
     });
     current = lookup.node;
     if (count++ > 40) {
      throw new FS.ErrnoError(32);
     }
    }
   }
  }
  return {
   path: current_path,
   node: current
  };
 },
 getPath: function(node) {
  var path;
  while (true) {
   if (FS.isRoot(node)) {
    var mount = node.mount.mountpoint;
    if (!path) return mount;
    return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
   }
   path = path ? node.name + "/" + path : node.name;
   node = node.parent;
  }
 },
 hashName: function(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
   hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
 },
 hashAddNode: function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
 },
 hashRemoveNode: function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
   FS.nameTable[hash] = node.name_next;
  } else {
   var current = FS.nameTable[hash];
   while (current) {
    if (current.name_next === node) {
     current.name_next = node.name_next;
     break;
    }
    current = current.name_next;
   }
  }
 },
 lookupNode: function(parent, name) {
  var errCode = FS.mayLookup(parent);
  if (errCode) {
   throw new FS.ErrnoError(errCode, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
   var nodeName = node.name;
   if (node.parent.id === parent.id && nodeName === name) {
    return node;
   }
  }
  return FS.lookup(parent, name);
 },
 createNode: function(parent, name, mode, rdev) {
  assert(typeof parent === "object");
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
 },
 destroyNode: function(node) {
  FS.hashRemoveNode(node);
 },
 isRoot: function(node) {
  return node === node.parent;
 },
 isMountpoint: function(node) {
  return !!node.mounted;
 },
 isFile: function(mode) {
  return (mode & 61440) === 32768;
 },
 isDir: function(mode) {
  return (mode & 61440) === 16384;
 },
 isLink: function(mode) {
  return (mode & 61440) === 40960;
 },
 isChrdev: function(mode) {
  return (mode & 61440) === 8192;
 },
 isBlkdev: function(mode) {
  return (mode & 61440) === 24576;
 },
 isFIFO: function(mode) {
  return (mode & 61440) === 4096;
 },
 isSocket: function(mode) {
  return (mode & 49152) === 49152;
 },
 flagModes: {
  "r": 0,
  "r+": 2,
  "w": 577,
  "w+": 578,
  "a": 1089,
  "a+": 1090
 },
 modeStringToFlags: function(str) {
  var flags = FS.flagModes[str];
  if (typeof flags === "undefined") {
   throw new Error("Unknown file open mode: " + str);
  }
  return flags;
 },
 flagsToPermissionString: function(flag) {
  var perms = [ "r", "w", "rw" ][flag & 3];
  if (flag & 512) {
   perms += "w";
  }
  return perms;
 },
 nodePermissions: function(node, perms) {
  if (FS.ignorePermissions) {
   return 0;
  }
  if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
   return 2;
  } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
   return 2;
  } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
   return 2;
  }
  return 0;
 },
 mayLookup: function(dir) {
  var errCode = FS.nodePermissions(dir, "x");
  if (errCode) return errCode;
  if (!dir.node_ops.lookup) return 2;
  return 0;
 },
 mayCreate: function(dir, name) {
  try {
   var node = FS.lookupNode(dir, name);
   return 20;
  } catch (e) {}
  return FS.nodePermissions(dir, "wx");
 },
 mayDelete: function(dir, name, isdir) {
  var node;
  try {
   node = FS.lookupNode(dir, name);
  } catch (e) {
   return e.errno;
  }
  var errCode = FS.nodePermissions(dir, "wx");
  if (errCode) {
   return errCode;
  }
  if (isdir) {
   if (!FS.isDir(node.mode)) {
    return 54;
   }
   if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
    return 10;
   }
  } else {
   if (FS.isDir(node.mode)) {
    return 31;
   }
  }
  return 0;
 },
 mayOpen: function(node, flags) {
  if (!node) {
   return 44;
  }
  if (FS.isLink(node.mode)) {
   return 32;
  } else if (FS.isDir(node.mode)) {
   if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
    return 31;
   }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
 },
 MAX_OPEN_FDS: 4096,
 nextfd: function(fd_start, fd_end) {
  fd_start = fd_start || 0;
  fd_end = fd_end || FS.MAX_OPEN_FDS;
  for (var fd = fd_start; fd <= fd_end; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(33);
 },
 getStream: function(fd) {
  return FS.streams[fd];
 },
 createStream: function(stream, fd_start, fd_end) {
  if (!FS.FSStream) {
   FS.FSStream = function() {};
   FS.FSStream.prototype = {
    object: {
     get: function() {
      return this.node;
     },
     set: function(val) {
      this.node = val;
     }
    },
    isRead: {
     get: function() {
      return (this.flags & 2097155) !== 1;
     }
    },
    isWrite: {
     get: function() {
      return (this.flags & 2097155) !== 0;
     }
    },
    isAppend: {
     get: function() {
      return this.flags & 1024;
     }
    }
   };
  }
  var newStream = new FS.FSStream();
  for (var p in stream) {
   newStream[p] = stream[p];
  }
  stream = newStream;
  var fd = FS.nextfd(fd_start, fd_end);
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
 },
 closeStream: function(fd) {
  FS.streams[fd] = null;
 },
 chrdev_stream_ops: {
  open: function(stream) {
   var device = FS.getDevice(stream.node.rdev);
   stream.stream_ops = device.stream_ops;
   if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
   }
  },
  llseek: function() {
   throw new FS.ErrnoError(70);
  }
 },
 major: function(dev) {
  return dev >> 8;
 },
 minor: function(dev) {
  return dev & 255;
 },
 makedev: function(ma, mi) {
  return ma << 8 | mi;
 },
 registerDevice: function(dev, ops) {
  FS.devices[dev] = {
   stream_ops: ops
  };
 },
 getDevice: function(dev) {
  return FS.devices[dev];
 },
 getMounts: function(mount) {
  var mounts = [];
  var check = [ mount ];
  while (check.length) {
   var m = check.pop();
   mounts.push(m);
   check.push.apply(check, m.mounts);
  }
  return mounts;
 },
 syncfs: function(populate, callback) {
  if (typeof populate === "function") {
   callback = populate;
   populate = false;
  }
  FS.syncFSRequests++;
  if (FS.syncFSRequests > 1) {
   err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work");
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function doCallback(errCode) {
   assert(FS.syncFSRequests > 0);
   FS.syncFSRequests--;
   return callback(errCode);
  }
  function done(errCode) {
   if (errCode) {
    if (!done.errored) {
     done.errored = true;
     return doCallback(errCode);
    }
    return;
   }
   if (++completed >= mounts.length) {
    doCallback(null);
   }
  }
  mounts.forEach(function(mount) {
   if (!mount.type.syncfs) {
    return done(null);
   }
   mount.type.syncfs(mount, populate, done);
  });
 },
 mount: function(type, opts, mountpoint) {
  if (typeof type === "string") {
   throw type;
  }
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
   throw new FS.ErrnoError(10);
  } else if (!root && !pseudo) {
   var lookup = FS.lookupPath(mountpoint, {
    follow_mount: false
   });
   mountpoint = lookup.path;
   node = lookup.node;
   if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(10);
   }
   if (!FS.isDir(node.mode)) {
    throw new FS.ErrnoError(54);
   }
  }
  var mount = {
   type: type,
   opts: opts,
   mountpoint: mountpoint,
   mounts: []
  };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
   FS.root = mountRoot;
  } else if (node) {
   node.mounted = mount;
   if (node.mount) {
    node.mount.mounts.push(mount);
   }
  }
  return mountRoot;
 },
 unmount: function(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, {
   follow_mount: false
  });
  if (!FS.isMountpoint(lookup.node)) {
   throw new FS.ErrnoError(28);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach(function(hash) {
   var current = FS.nameTable[hash];
   while (current) {
    var next = current.name_next;
    if (mounts.indexOf(current.mount) !== -1) {
     FS.destroyNode(current);
    }
    current = next;
   }
  });
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  assert(idx !== -1);
  node.mount.mounts.splice(idx, 1);
 },
 lookup: function(parent, name) {
  return parent.node_ops.lookup(parent, name);
 },
 mknod: function(path, mode, dev) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
   throw new FS.ErrnoError(28);
  }
  var errCode = FS.mayCreate(parent, name);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.mknod) {
   throw new FS.ErrnoError(63);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
 },
 create: function(path, mode) {
  mode = mode !== undefined ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
 },
 mkdir: function(path, mode) {
  mode = mode !== undefined ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
 },
 mkdirTree: function(path, mode) {
  var dirs = path.split("/");
  var d = "";
  for (var i = 0; i < dirs.length; ++i) {
   if (!dirs[i]) continue;
   d += "/" + dirs[i];
   try {
    FS.mkdir(d, mode);
   } catch (e) {
    if (e.errno != 20) throw e;
   }
  }
 },
 mkdev: function(path, mode, dev) {
  if (typeof dev === "undefined") {
   dev = mode;
   mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
 },
 symlink: function(oldpath, newpath) {
  if (!PATH_FS.resolve(oldpath)) {
   throw new FS.ErrnoError(44);
  }
  var lookup = FS.lookupPath(newpath, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(44);
  }
  var newname = PATH.basename(newpath);
  var errCode = FS.mayCreate(parent, newname);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.symlink) {
   throw new FS.ErrnoError(63);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
 },
 rename: function(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  lookup = FS.lookupPath(old_path, {
   parent: true
  });
  old_dir = lookup.node;
  lookup = FS.lookupPath(new_path, {
   parent: true
  });
  new_dir = lookup.node;
  if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
  if (old_dir.mount !== new_dir.mount) {
   throw new FS.ErrnoError(75);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH_FS.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(28);
  }
  relative = PATH_FS.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(55);
  }
  var new_node;
  try {
   new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {}
  if (old_node === new_node) {
   return;
  }
  var isdir = FS.isDir(old_node.mode);
  var errCode = FS.mayDelete(old_dir, old_name, isdir);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!old_dir.node_ops.rename) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
   throw new FS.ErrnoError(10);
  }
  if (new_dir !== old_dir) {
   errCode = FS.nodePermissions(old_dir, "w");
   if (errCode) {
    throw new FS.ErrnoError(errCode);
   }
  }
  try {
   if (FS.trackingDelegate["willMovePath"]) {
    FS.trackingDelegate["willMovePath"](old_path, new_path);
   }
  } catch (e) {
   err("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
  FS.hashRemoveNode(old_node);
  try {
   old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
   throw e;
  } finally {
   FS.hashAddNode(old_node);
  }
  try {
   if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path);
  } catch (e) {
   err("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
 },
 rmdir: function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var errCode = FS.mayDelete(parent, name, true);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.rmdir) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(10);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 },
 readdir: function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
   throw new FS.ErrnoError(54);
  }
  return node.node_ops.readdir(node);
 },
 unlink: function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var errCode = FS.mayDelete(parent, name, false);
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  if (!parent.node_ops.unlink) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(10);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   err("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   err("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 },
 readlink: function(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
   throw new FS.ErrnoError(44);
  }
  if (!link.node_ops.readlink) {
   throw new FS.ErrnoError(28);
  }
  return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
 },
 stat: function(path, dontFollow) {
  var lookup = FS.lookupPath(path, {
   follow: !dontFollow
  });
  var node = lookup.node;
  if (!node) {
   throw new FS.ErrnoError(44);
  }
  if (!node.node_ops.getattr) {
   throw new FS.ErrnoError(63);
  }
  return node.node_ops.getattr(node);
 },
 lstat: function(path) {
  return FS.stat(path, true);
 },
 chmod: function(path, mode, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, {
   mode: mode & 4095 | node.mode & ~4095,
   timestamp: Date.now()
  });
 },
 lchmod: function(path, mode) {
  FS.chmod(path, mode, true);
 },
 fchmod: function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  FS.chmod(stream.node, mode);
 },
 chown: function(path, uid, gid, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  node.node_ops.setattr(node, {
   timestamp: Date.now()
  });
 },
 lchown: function(path, uid, gid) {
  FS.chown(path, uid, gid, true);
 },
 fchown: function(fd, uid, gid) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  FS.chown(stream.node, uid, gid);
 },
 truncate: function(path, len) {
  if (len < 0) {
   throw new FS.ErrnoError(28);
  }
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: true
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(63);
  }
  if (FS.isDir(node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!FS.isFile(node.mode)) {
   throw new FS.ErrnoError(28);
  }
  var errCode = FS.nodePermissions(node, "w");
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  node.node_ops.setattr(node, {
   size: len,
   timestamp: Date.now()
  });
 },
 ftruncate: function(fd, len) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(28);
  }
  FS.truncate(stream.node, len);
 },
 utime: function(path, atime, mtime) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  node.node_ops.setattr(node, {
   timestamp: Math.max(atime, mtime)
  });
 },
 open: function(path, flags, mode, fd_start, fd_end) {
  if (path === "") {
   throw new FS.ErrnoError(44);
  }
  flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
  mode = typeof mode === "undefined" ? 438 : mode;
  if (flags & 64) {
   mode = mode & 4095 | 32768;
  } else {
   mode = 0;
  }
  var node;
  if (typeof path === "object") {
   node = path;
  } else {
   path = PATH.normalize(path);
   try {
    var lookup = FS.lookupPath(path, {
     follow: !(flags & 131072)
    });
    node = lookup.node;
   } catch (e) {}
  }
  var created = false;
  if (flags & 64) {
   if (node) {
    if (flags & 128) {
     throw new FS.ErrnoError(20);
    }
   } else {
    node = FS.mknod(path, mode, 0);
    created = true;
   }
  }
  if (!node) {
   throw new FS.ErrnoError(44);
  }
  if (FS.isChrdev(node.mode)) {
   flags &= ~512;
  }
  if (flags & 65536 && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(54);
  }
  if (!created) {
   var errCode = FS.mayOpen(node, flags);
   if (errCode) {
    throw new FS.ErrnoError(errCode);
   }
  }
  if (flags & 512) {
   FS.truncate(node, 0);
  }
  flags &= ~(128 | 512 | 131072);
  var stream = FS.createStream({
   node: node,
   path: FS.getPath(node),
   flags: flags,
   seekable: true,
   position: 0,
   stream_ops: node.stream_ops,
   ungotten: [],
   error: false
  }, fd_start, fd_end);
  if (stream.stream_ops.open) {
   stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
   if (!FS.readFiles) FS.readFiles = {};
   if (!(path in FS.readFiles)) {
    FS.readFiles[path] = 1;
    err("FS.trackingDelegate error on read file: " + path);
   }
  }
  try {
   if (FS.trackingDelegate["onOpenFile"]) {
    var trackingFlags = 0;
    if ((flags & 2097155) !== 1) {
     trackingFlags |= FS.tracking.openFlags.READ;
    }
    if ((flags & 2097155) !== 0) {
     trackingFlags |= FS.tracking.openFlags.WRITE;
    }
    FS.trackingDelegate["onOpenFile"](path, trackingFlags);
   }
  } catch (e) {
   err("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
  }
  return stream;
 },
 close: function(stream) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (stream.getdents) stream.getdents = null;
  try {
   if (stream.stream_ops.close) {
    stream.stream_ops.close(stream);
   }
  } catch (e) {
   throw e;
  } finally {
   FS.closeStream(stream.fd);
  }
  stream.fd = null;
 },
 isClosed: function(stream) {
  return stream.fd === null;
 },
 llseek: function(stream, offset, whence) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (!stream.seekable || !stream.stream_ops.llseek) {
   throw new FS.ErrnoError(70);
  }
  if (whence != 0 && whence != 1 && whence != 2) {
   throw new FS.ErrnoError(28);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
 },
 read: function(stream, buffer, offset, length, position) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.read) {
   throw new FS.ErrnoError(28);
  }
  var seeking = typeof position !== "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(70);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 },
 write: function(stream, buffer, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(28);
  }
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(8);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(31);
  }
  if (!stream.stream_ops.write) {
   throw new FS.ErrnoError(28);
  }
  if (stream.seekable && stream.flags & 1024) {
   FS.llseek(stream, 0, 2);
  }
  var seeking = typeof position !== "undefined";
  if (!seeking) {
   position = stream.position;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(70);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) stream.position += bytesWritten;
  try {
   if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path);
  } catch (e) {
   err("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message);
  }
  return bytesWritten;
 },
 allocate: function(stream, offset, length) {
  if (FS.isClosed(stream)) {
   throw new FS.ErrnoError(8);
  }
  if (offset < 0 || length <= 0) {
   throw new FS.ErrnoError(28);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(8);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(43);
  }
  if (!stream.stream_ops.allocate) {
   throw new FS.ErrnoError(138);
  }
  stream.stream_ops.allocate(stream, offset, length);
 },
 mmap: function(stream, address, length, position, prot, flags) {
  if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
   throw new FS.ErrnoError(2);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(2);
  }
  if (!stream.stream_ops.mmap) {
   throw new FS.ErrnoError(43);
  }
  return stream.stream_ops.mmap(stream, address, length, position, prot, flags);
 },
 msync: function(stream, buffer, offset, length, mmapFlags) {
  if (!stream || !stream.stream_ops.msync) {
   return 0;
  }
  return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
 },
 munmap: function(stream) {
  return 0;
 },
 ioctl: function(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
   throw new FS.ErrnoError(59);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
 },
 readFile: function(path, opts) {
  opts = opts || {};
  opts.flags = opts.flags || 0;
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
   ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
   ret = buf;
  }
  FS.close(stream);
  return ret;
 },
 writeFile: function(path, data, opts) {
  opts = opts || {};
  opts.flags = opts.flags || 577;
  var stream = FS.open(path, opts.flags, opts.mode);
  if (typeof data === "string") {
   var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
   var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
   FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn);
  } else if (ArrayBuffer.isView(data)) {
   FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
  } else {
   throw new Error("Unsupported data type");
  }
  FS.close(stream);
 },
 cwd: function() {
  return FS.currentPath;
 },
 chdir: function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  if (lookup.node === null) {
   throw new FS.ErrnoError(44);
  }
  if (!FS.isDir(lookup.node.mode)) {
   throw new FS.ErrnoError(54);
  }
  var errCode = FS.nodePermissions(lookup.node, "x");
  if (errCode) {
   throw new FS.ErrnoError(errCode);
  }
  FS.currentPath = lookup.path;
 },
 createDefaultDirectories: function() {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
 },
 createDefaultDevices: function() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {
   read: function() {
    return 0;
   },
   write: function(stream, buffer, offset, length, pos) {
    return length;
   }
  });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var random_device = getRandomDevice();
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
 },
 createSpecialDirectories: function() {
  FS.mkdir("/proc");
  var proc_self = FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({
   mount: function() {
    var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
    node.node_ops = {
     lookup: function(parent, name) {
      var fd = +name;
      var stream = FS.getStream(fd);
      if (!stream) throw new FS.ErrnoError(8);
      var ret = {
       parent: null,
       mount: {
        mountpoint: "fake"
       },
       node_ops: {
        readlink: function() {
         return stream.path;
        }
       }
      };
      ret.parent = ret;
      return ret;
     }
    };
    return node;
   }
  }, {}, "/proc/self/fd");
 },
 createStandardStreams: function() {
  if (Module["stdin"]) {
   FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
   FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
   FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
   FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", 0);
  var stdout = FS.open("/dev/stdout", 1);
  var stderr = FS.open("/dev/stderr", 1);
  assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
  assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
  assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")");
 },
 ensureErrnoError: function() {
  if (FS.ErrnoError) return;
  FS.ErrnoError = function ErrnoError(errno, node) {
   this.node = node;
   this.setErrno = function(errno) {
    this.errno = errno;
    for (var key in ERRNO_CODES) {
     if (ERRNO_CODES[key] === errno) {
      this.code = key;
      break;
     }
    }
   };
   this.setErrno(errno);
   this.message = ERRNO_MESSAGES[errno];
   if (this.stack) {
    Object.defineProperty(this, "stack", {
     value: new Error().stack,
     writable: true
    });
    this.stack = demangleAll(this.stack);
   }
  };
  FS.ErrnoError.prototype = new Error();
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [ 44 ].forEach(function(code) {
   FS.genericErrors[code] = new FS.ErrnoError(code);
   FS.genericErrors[code].stack = "<generic error, no stack>";
  });
 },
 staticInit: function() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = {
   "MEMFS": MEMFS
  };
 },
 init: function(input, output, error) {
  assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
 },
 quit: function() {
  FS.init.initialized = false;
  var fflush = Module["_fflush"];
  if (fflush) fflush(0);
  for (var i = 0; i < FS.streams.length; i++) {
   var stream = FS.streams[i];
   if (!stream) {
    continue;
   }
   FS.close(stream);
  }
 },
 getMode: function(canRead, canWrite) {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
 },
 findObject: function(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (ret.exists) {
   return ret.object;
  } else {
   return null;
  }
 },
 analyzePath: function(path, dontResolveLastLink) {
  try {
   var lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   path = lookup.path;
  } catch (e) {}
  var ret = {
   isRoot: false,
   exists: false,
   error: 0,
   name: null,
   path: null,
   object: null,
   parentExists: false,
   parentPath: null,
   parentObject: null
  };
  try {
   var lookup = FS.lookupPath(path, {
    parent: true
   });
   ret.parentExists = true;
   ret.parentPath = lookup.path;
   ret.parentObject = lookup.node;
   ret.name = PATH.basename(path);
   lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   ret.exists = true;
   ret.path = lookup.path;
   ret.object = lookup.node;
   ret.name = lookup.node.name;
   ret.isRoot = lookup.path === "/";
  } catch (e) {
   ret.error = e.errno;
  }
  return ret;
 },
 createPath: function(parent, path, canRead, canWrite) {
  parent = typeof parent === "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
   var part = parts.pop();
   if (!part) continue;
   var current = PATH.join2(parent, part);
   try {
    FS.mkdir(current);
   } catch (e) {}
   parent = current;
  }
  return current;
 },
 createFile: function(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
 },
 createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
  var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
  var mode = FS.getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
   if (typeof data === "string") {
    var arr = new Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
    data = arr;
   }
   FS.chmod(node, mode | 146);
   var stream = FS.open(node, 577);
   FS.write(stream, data, 0, data.length, 0, canOwn);
   FS.close(stream);
   FS.chmod(node, mode);
  }
  return node;
 },
 createDevice: function(parent, name, input, output) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(!!input, !!output);
  if (!FS.createDevice.major) FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {
   open: function(stream) {
    stream.seekable = false;
   },
   close: function(stream) {
    if (output && output.buffer && output.buffer.length) {
     output(10);
    }
   },
   read: function(stream, buffer, offset, length, pos) {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
     var result;
     try {
      result = input();
     } catch (e) {
      throw new FS.ErrnoError(29);
     }
     if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(6);
     }
     if (result === null || result === undefined) break;
     bytesRead++;
     buffer[offset + i] = result;
    }
    if (bytesRead) {
     stream.node.timestamp = Date.now();
    }
    return bytesRead;
   },
   write: function(stream, buffer, offset, length, pos) {
    for (var i = 0; i < length; i++) {
     try {
      output(buffer[offset + i]);
     } catch (e) {
      throw new FS.ErrnoError(29);
     }
    }
    if (length) {
     stream.node.timestamp = Date.now();
    }
    return i;
   }
  });
  return FS.mkdev(path, mode, dev);
 },
 forceLoadFile: function(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
  if (typeof XMLHttpRequest !== "undefined") {
   throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (read_) {
   try {
    obj.contents = intArrayFromString(read_(obj.url), true);
    obj.usedBytes = obj.contents.length;
   } catch (e) {
    throw new FS.ErrnoError(29);
   }
  } else {
   throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
 },
 createLazyFile: function(parent, name, url, canRead, canWrite) {
  function LazyUint8Array() {
   this.lengthKnown = false;
   this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
   if (idx > this.length - 1 || idx < 0) {
    return undefined;
   }
   var chunkOffset = idx % this.chunkSize;
   var chunkNum = idx / this.chunkSize | 0;
   return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
   this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
   var xhr = new XMLHttpRequest();
   xhr.open("HEAD", url, false);
   xhr.send(null);
   if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
   var datalength = Number(xhr.getResponseHeader("Content-length"));
   var header;
   var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
   var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
   var chunkSize = 1024 * 1024;
   if (!hasByteServing) chunkSize = datalength;
   var doXHR = function(from, to) {
    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
    if (xhr.overrideMimeType) {
     xhr.overrideMimeType("text/plain; charset=x-user-defined");
    }
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    if (xhr.response !== undefined) {
     return new Uint8Array(xhr.response || []);
    } else {
     return intArrayFromString(xhr.responseText || "", true);
    }
   };
   var lazyArray = this;
   lazyArray.setDataGetter(function(chunkNum) {
    var start = chunkNum * chunkSize;
    var end = (chunkNum + 1) * chunkSize - 1;
    end = Math.min(end, datalength - 1);
    if (typeof lazyArray.chunks[chunkNum] === "undefined") {
     lazyArray.chunks[chunkNum] = doXHR(start, end);
    }
    if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
    return lazyArray.chunks[chunkNum];
   });
   if (usesGzip || !datalength) {
    chunkSize = datalength = 1;
    datalength = this.getter(0).length;
    chunkSize = datalength;
    out("LazyFiles on gzip forces download of the whole file when length is accessed");
   }
   this._length = datalength;
   this._chunkSize = chunkSize;
   this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest !== "undefined") {
   if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
   var lazyArray = new LazyUint8Array();
   Object.defineProperties(lazyArray, {
    length: {
     get: function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._length;
     }
    },
    chunkSize: {
     get: function() {
      if (!this.lengthKnown) {
       this.cacheLength();
      }
      return this._chunkSize;
     }
    }
   });
   var properties = {
    isDevice: false,
    contents: lazyArray
   };
  } else {
   var properties = {
    isDevice: false,
    url: url
   };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
   node.contents = properties.contents;
  } else if (properties.url) {
   node.contents = null;
   node.url = properties.url;
  }
  Object.defineProperties(node, {
   usedBytes: {
    get: function() {
     return this.contents.length;
    }
   }
  });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach(function(key) {
   var fn = node.stream_ops[key];
   stream_ops[key] = function forceLoadLazyFile() {
    FS.forceLoadFile(node);
    return fn.apply(null, arguments);
   };
  });
  stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
   FS.forceLoadFile(node);
   var contents = stream.node.contents;
   if (position >= contents.length) return 0;
   var size = Math.min(contents.length - position, length);
   assert(size >= 0);
   if (contents.slice) {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents[position + i];
    }
   } else {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents.get(position + i);
    }
   }
   return size;
  };
  node.stream_ops = stream_ops;
  return node;
 },
 createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
  Browser.init();
  var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency("cp " + fullname);
  function processData(byteArray) {
   function finish(byteArray) {
    if (preFinish) preFinish();
    if (!dontCreateFile) {
     FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
    if (onload) onload();
    removeRunDependency(dep);
   }
   var handled = false;
   Module["preloadPlugins"].forEach(function(plugin) {
    if (handled) return;
    if (plugin["canHandle"](fullname)) {
     plugin["handle"](byteArray, fullname, finish, function() {
      if (onerror) onerror();
      removeRunDependency(dep);
     });
     handled = true;
    }
   });
   if (!handled) finish(byteArray);
  }
  addRunDependency(dep);
  if (typeof url == "string") {
   Browser.asyncLoad(url, function(byteArray) {
    processData(byteArray);
   }, onerror);
  } else {
   processData(url);
  }
 },
 indexedDB: function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 },
 DB_NAME: function() {
  return "EM_FS_" + window.location.pathname;
 },
 DB_VERSION: 20,
 DB_STORE_NAME: "FILE_DATA",
 saveFilesToDB: function(paths, onload, onerror) {
  onload = onload || function() {};
  onerror = onerror || function() {};
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
   out("creating db");
   var db = openRequest.result;
   db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   var transaction = db.transaction([ FS.DB_STORE_NAME ], "readwrite");
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach(function(path) {
    var putRequest = files.put(FS.analyzePath(path).object.contents, path);
    putRequest.onsuccess = function putRequest_onsuccess() {
     ok++;
     if (ok + fail == total) finish();
    };
    putRequest.onerror = function putRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   });
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 },
 loadFilesFromDB: function(paths, onload, onerror) {
  onload = onload || function() {};
  onerror = onerror || function() {};
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   try {
    var transaction = db.transaction([ FS.DB_STORE_NAME ], "readonly");
   } catch (e) {
    onerror(e);
    return;
   }
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach(function(path) {
    var getRequest = files.get(path);
    getRequest.onsuccess = function getRequest_onsuccess() {
     if (FS.analyzePath(path).exists) {
      FS.unlink(path);
     }
     FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
     ok++;
     if (ok + fail == total) finish();
    };
    getRequest.onerror = function getRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   });
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 },
 absolutePath: function() {
  abort("FS.absolutePath has been removed; use PATH_FS.resolve instead");
 },
 createFolder: function() {
  abort("FS.createFolder has been removed; use FS.mkdir instead");
 },
 createLink: function() {
  abort("FS.createLink has been removed; use FS.symlink instead");
 },
 joinPath: function() {
  abort("FS.joinPath has been removed; use PATH.join instead");
 },
 mmapAlloc: function() {
  abort("FS.mmapAlloc has been replaced by the top level function mmapAlloc");
 },
 standardizePath: function() {
  abort("FS.standardizePath has been removed; use PATH.normalize instead");
 }
};

var SYSCALLS = {
 mappings: {},
 DEFAULT_POLLMASK: 5,
 umask: 511,
 calculateAt: function(dirfd, path, allowEmpty) {
  if (path[0] === "/") {
   return path;
  }
  var dir;
  if (dirfd === -100) {
   dir = FS.cwd();
  } else {
   var dirstream = FS.getStream(dirfd);
   if (!dirstream) throw new FS.ErrnoError(8);
   dir = dirstream.path;
  }
  if (path.length == 0) {
   if (!allowEmpty) {
    throw new FS.ErrnoError(44);
   }
   return dir;
  }
  return PATH.join2(dir, path);
 },
 doStat: function(func, path, buf) {
  try {
   var stat = func(path);
  } catch (e) {
   if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
    return -54;
   }
   throw e;
  }
  SAFE_HEAP_STORE(buf | 0, stat.dev | 0, 4);
  SAFE_HEAP_STORE(buf + 4 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE(buf + 8 | 0, stat.ino | 0, 4);
  SAFE_HEAP_STORE(buf + 12 | 0, stat.mode | 0, 4);
  SAFE_HEAP_STORE(buf + 16 | 0, stat.nlink | 0, 4);
  SAFE_HEAP_STORE(buf + 20 | 0, stat.uid | 0, 4);
  SAFE_HEAP_STORE(buf + 24 | 0, stat.gid | 0, 4);
  SAFE_HEAP_STORE(buf + 28 | 0, stat.rdev | 0, 4);
  SAFE_HEAP_STORE(buf + 32 | 0, 0 | 0, 4);
  tempI64 = [ stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  SAFE_HEAP_STORE(buf + 40 | 0, tempI64[0] | 0, 4), SAFE_HEAP_STORE(buf + 44 | 0, tempI64[1] | 0, 4);
  SAFE_HEAP_STORE(buf + 48 | 0, 4096 | 0, 4);
  SAFE_HEAP_STORE(buf + 52 | 0, stat.blocks | 0, 4);
  SAFE_HEAP_STORE(buf + 56 | 0, stat.atime.getTime() / 1e3 | 0 | 0, 4);
  SAFE_HEAP_STORE(buf + 60 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE(buf + 64 | 0, stat.mtime.getTime() / 1e3 | 0 | 0, 4);
  SAFE_HEAP_STORE(buf + 68 | 0, 0 | 0, 4);
  SAFE_HEAP_STORE(buf + 72 | 0, stat.ctime.getTime() / 1e3 | 0 | 0, 4);
  SAFE_HEAP_STORE(buf + 76 | 0, 0 | 0, 4);
  tempI64 = [ stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  SAFE_HEAP_STORE(buf + 80 | 0, tempI64[0] | 0, 4), SAFE_HEAP_STORE(buf + 84 | 0, tempI64[1] | 0, 4);
  return 0;
 },
 doMsync: function(addr, stream, len, flags, offset) {
  var buffer = HEAPU8.slice(addr, addr + len);
  FS.msync(stream, buffer, offset, len, flags);
 },
 doMkdir: function(path, mode) {
  path = PATH.normalize(path);
  if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
  FS.mkdir(path, mode, 0);
  return 0;
 },
 doMknod: function(path, mode, dev) {
  switch (mode & 61440) {
  case 32768:
  case 8192:
  case 24576:
  case 4096:
  case 49152:
   break;

  default:
   return -28;
  }
  FS.mknod(path, mode, dev);
  return 0;
 },
 doReadlink: function(path, buf, bufsize) {
  if (bufsize <= 0) return -28;
  var ret = FS.readlink(path);
  var len = Math.min(bufsize, lengthBytesUTF8(ret));
  var endChar = SAFE_HEAP_LOAD(buf + len, 1, 0);
  stringToUTF8(ret, buf, bufsize + 1);
  SAFE_HEAP_STORE(buf + len, endChar, 1);
  return len;
 },
 doAccess: function(path, amode) {
  if (amode & ~7) {
   return -28;
  }
  var node;
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  node = lookup.node;
  if (!node) {
   return -44;
  }
  var perms = "";
  if (amode & 4) perms += "r";
  if (amode & 2) perms += "w";
  if (amode & 1) perms += "x";
  if (perms && FS.nodePermissions(node, perms)) {
   return -2;
  }
  return 0;
 },
 doDup: function(path, flags, suggestFD) {
  var suggest = FS.getStream(suggestFD);
  if (suggest) FS.close(suggest);
  return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
 },
 doReadv: function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = SAFE_HEAP_LOAD(iov + i * 8 | 0, 4, 0) | 0;
   var len = SAFE_HEAP_LOAD(iov + (i * 8 + 4) | 0, 4, 0) | 0;
   var curr = FS.read(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
   if (curr < len) break;
  }
  return ret;
 },
 doWritev: function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = SAFE_HEAP_LOAD(iov + i * 8 | 0, 4, 0) | 0;
   var len = SAFE_HEAP_LOAD(iov + (i * 8 + 4) | 0, 4, 0) | 0;
   var curr = FS.write(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
  }
  return ret;
 },
 varargs: undefined,
 get: function() {
  assert(SYSCALLS.varargs != undefined);
  SYSCALLS.varargs += 4;
  var ret = SAFE_HEAP_LOAD(SYSCALLS.varargs - 4 | 0, 4, 0) | 0;
  return ret;
 },
 getStr: function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 },
 getStreamFromFD: function(fd) {
  var stream = FS.getStream(fd);
  if (!stream) throw new FS.ErrnoError(8);
  return stream;
 },
 get64: function(low, high) {
  if (low >= 0) assert(high === 0); else assert(high === -1);
  return low;
 }
};

function _environ_get(__environ, environ_buf) {
 try {
  var bufSize = 0;
  getEnvStrings().forEach(function(string, i) {
   var ptr = environ_buf + bufSize;
   SAFE_HEAP_STORE(__environ + i * 4 | 0, ptr | 0, 4);
   writeAsciiToMemory(string, ptr);
   bufSize += string.length + 1;
  });
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return e.errno;
 }
}

function _environ_sizes_get(penviron_count, penviron_buf_size) {
 try {
  var strings = getEnvStrings();
  SAFE_HEAP_STORE(penviron_count | 0, strings.length | 0, 4);
  var bufSize = 0;
  strings.forEach(function(string) {
   bufSize += string.length + 1;
  });
  SAFE_HEAP_STORE(penviron_buf_size | 0, bufSize | 0, 4);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return e.errno;
 }
}

function _fd_close(fd) {
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return e.errno;
 }
}

function _fd_read(fd, iov, iovcnt, pnum) {
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = SYSCALLS.doReadv(stream, iov, iovcnt);
  SAFE_HEAP_STORE(pnum | 0, num | 0, 4);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return e.errno;
 }
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var HIGH_OFFSET = 4294967296;
  var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
  var DOUBLE_LIMIT = 9007199254740992;
  if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
   return -61;
  }
  FS.llseek(stream, offset, whence);
  tempI64 = [ stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  SAFE_HEAP_STORE(newOffset | 0, tempI64[0] | 0, 4), SAFE_HEAP_STORE(newOffset + 4 | 0, tempI64[1] | 0, 4);
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return e.errno;
 }
}

function _fd_write(fd, iov, iovcnt, pnum) {
 try {
  var stream = SYSCALLS.getStreamFromFD(fd);
  var num = SYSCALLS.doWritev(stream, iov, iovcnt);
  SAFE_HEAP_STORE(pnum | 0, num | 0, 4);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return e.errno;
 }
}

function _setTempRet0($i) {
 setTempRet0($i | 0);
}

function __isLeapYear(year) {
 return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function __arraySum(array, index) {
 var sum = 0;
 for (var i = 0; i <= index; sum += array[i++]) {}
 return sum;
}

var __MONTH_DAYS_LEAP = [ 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

var __MONTH_DAYS_REGULAR = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

function __addDays(date, days) {
 var newDate = new Date(date.getTime());
 while (days > 0) {
  var leap = __isLeapYear(newDate.getFullYear());
  var currentMonth = newDate.getMonth();
  var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  if (days > daysInCurrentMonth - newDate.getDate()) {
   days -= daysInCurrentMonth - newDate.getDate() + 1;
   newDate.setDate(1);
   if (currentMonth < 11) {
    newDate.setMonth(currentMonth + 1);
   } else {
    newDate.setMonth(0);
    newDate.setFullYear(newDate.getFullYear() + 1);
   }
  } else {
   newDate.setDate(newDate.getDate() + days);
   return newDate;
  }
 }
 return newDate;
}

function _strftime(s, maxsize, format, tm) {
 var tm_zone = SAFE_HEAP_LOAD(tm + 40 | 0, 4, 0) | 0;
 var date = {
  tm_sec: SAFE_HEAP_LOAD(tm | 0, 4, 0) | 0,
  tm_min: SAFE_HEAP_LOAD(tm + 4 | 0, 4, 0) | 0,
  tm_hour: SAFE_HEAP_LOAD(tm + 8 | 0, 4, 0) | 0,
  tm_mday: SAFE_HEAP_LOAD(tm + 12 | 0, 4, 0) | 0,
  tm_mon: SAFE_HEAP_LOAD(tm + 16 | 0, 4, 0) | 0,
  tm_year: SAFE_HEAP_LOAD(tm + 20 | 0, 4, 0) | 0,
  tm_wday: SAFE_HEAP_LOAD(tm + 24 | 0, 4, 0) | 0,
  tm_yday: SAFE_HEAP_LOAD(tm + 28 | 0, 4, 0) | 0,
  tm_isdst: SAFE_HEAP_LOAD(tm + 32 | 0, 4, 0) | 0,
  tm_gmtoff: SAFE_HEAP_LOAD(tm + 36 | 0, 4, 0) | 0,
  tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
 };
 var pattern = UTF8ToString(format);
 var EXPANSION_RULES_1 = {
  "%c": "%a %b %d %H:%M:%S %Y",
  "%D": "%m/%d/%y",
  "%F": "%Y-%m-%d",
  "%h": "%b",
  "%r": "%I:%M:%S %p",
  "%R": "%H:%M",
  "%T": "%H:%M:%S",
  "%x": "%m/%d/%y",
  "%X": "%H:%M:%S",
  "%Ec": "%c",
  "%EC": "%C",
  "%Ex": "%m/%d/%y",
  "%EX": "%H:%M:%S",
  "%Ey": "%y",
  "%EY": "%Y",
  "%Od": "%d",
  "%Oe": "%e",
  "%OH": "%H",
  "%OI": "%I",
  "%Om": "%m",
  "%OM": "%M",
  "%OS": "%S",
  "%Ou": "%u",
  "%OU": "%U",
  "%OV": "%V",
  "%Ow": "%w",
  "%OW": "%W",
  "%Oy": "%y"
 };
 for (var rule in EXPANSION_RULES_1) {
  pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule]);
 }
 var WEEKDAYS = [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ];
 var MONTHS = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
 function leadingSomething(value, digits, character) {
  var str = typeof value === "number" ? value.toString() : value || "";
  while (str.length < digits) {
   str = character[0] + str;
  }
  return str;
 }
 function leadingNulls(value, digits) {
  return leadingSomething(value, digits, "0");
 }
 function compareByDay(date1, date2) {
  function sgn(value) {
   return value < 0 ? -1 : value > 0 ? 1 : 0;
  }
  var compare;
  if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
   if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
    compare = sgn(date1.getDate() - date2.getDate());
   }
  }
  return compare;
 }
 function getFirstWeekStartDate(janFourth) {
  switch (janFourth.getDay()) {
  case 0:
   return new Date(janFourth.getFullYear() - 1, 11, 29);

  case 1:
   return janFourth;

  case 2:
   return new Date(janFourth.getFullYear(), 0, 3);

  case 3:
   return new Date(janFourth.getFullYear(), 0, 2);

  case 4:
   return new Date(janFourth.getFullYear(), 0, 1);

  case 5:
   return new Date(janFourth.getFullYear() - 1, 11, 31);

  case 6:
   return new Date(janFourth.getFullYear() - 1, 11, 30);
  }
 }
 function getWeekBasedYear(date) {
  var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
  var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
  var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
  var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
  var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
   if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
    return thisDate.getFullYear() + 1;
   } else {
    return thisDate.getFullYear();
   }
  } else {
   return thisDate.getFullYear() - 1;
  }
 }
 var EXPANSION_RULES_2 = {
  "%a": function(date) {
   return WEEKDAYS[date.tm_wday].substring(0, 3);
  },
  "%A": function(date) {
   return WEEKDAYS[date.tm_wday];
  },
  "%b": function(date) {
   return MONTHS[date.tm_mon].substring(0, 3);
  },
  "%B": function(date) {
   return MONTHS[date.tm_mon];
  },
  "%C": function(date) {
   var year = date.tm_year + 1900;
   return leadingNulls(year / 100 | 0, 2);
  },
  "%d": function(date) {
   return leadingNulls(date.tm_mday, 2);
  },
  "%e": function(date) {
   return leadingSomething(date.tm_mday, 2, " ");
  },
  "%g": function(date) {
   return getWeekBasedYear(date).toString().substring(2);
  },
  "%G": function(date) {
   return getWeekBasedYear(date);
  },
  "%H": function(date) {
   return leadingNulls(date.tm_hour, 2);
  },
  "%I": function(date) {
   var twelveHour = date.tm_hour;
   if (twelveHour == 0) twelveHour = 12; else if (twelveHour > 12) twelveHour -= 12;
   return leadingNulls(twelveHour, 2);
  },
  "%j": function(date) {
   return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3);
  },
  "%m": function(date) {
   return leadingNulls(date.tm_mon + 1, 2);
  },
  "%M": function(date) {
   return leadingNulls(date.tm_min, 2);
  },
  "%n": function() {
   return "\n";
  },
  "%p": function(date) {
   if (date.tm_hour >= 0 && date.tm_hour < 12) {
    return "AM";
   } else {
    return "PM";
   }
  },
  "%S": function(date) {
   return leadingNulls(date.tm_sec, 2);
  },
  "%t": function() {
   return "\t";
  },
  "%u": function(date) {
   return date.tm_wday || 7;
  },
  "%U": function(date) {
   var janFirst = new Date(date.tm_year + 1900, 0, 1);
   var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
   var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
   if (compareByDay(firstSunday, endDate) < 0) {
    var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
    var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
    var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
    return leadingNulls(Math.ceil(days / 7), 2);
   }
   return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00";
  },
  "%V": function(date) {
   var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
   var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
   var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
   var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
   var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
   if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
    return "53";
   }
   if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
    return "01";
   }
   var daysDifference;
   if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
    daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate();
   } else {
    daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate();
   }
   return leadingNulls(Math.ceil(daysDifference / 7), 2);
  },
  "%w": function(date) {
   return date.tm_wday;
  },
  "%W": function(date) {
   var janFirst = new Date(date.tm_year, 0, 1);
   var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
   var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
   if (compareByDay(firstMonday, endDate) < 0) {
    var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
    var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
    var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
    return leadingNulls(Math.ceil(days / 7), 2);
   }
   return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00";
  },
  "%y": function(date) {
   return (date.tm_year + 1900).toString().substring(2);
  },
  "%Y": function(date) {
   return date.tm_year + 1900;
  },
  "%z": function(date) {
   var off = date.tm_gmtoff;
   var ahead = off >= 0;
   off = Math.abs(off) / 60;
   off = off / 60 * 100 + off % 60;
   return (ahead ? "+" : "-") + String("0000" + off).slice(-4);
  },
  "%Z": function(date) {
   return date.tm_zone;
  },
  "%%": function() {
   return "%";
  }
 };
 for (var rule in EXPANSION_RULES_2) {
  if (pattern.indexOf(rule) >= 0) {
   pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date));
  }
 }
 var bytes = intArrayFromString(pattern, false);
 if (bytes.length > maxsize) {
  return 0;
 }
 writeArrayToMemory(bytes, s);
 return bytes.length - 1;
}

function _strftime_l(s, maxsize, format, tm) {
 return _strftime(s, maxsize, format, tm);
}

embind_init_charCodes();

BindingError = Module["BindingError"] = extendError(Error, "BindingError");

InternalError = Module["InternalError"] = extendError(Error, "InternalError");

init_emval();

UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");

var FSNode = function(parent, name, mode, rdev) {
 if (!parent) {
  parent = this;
 }
 this.parent = parent;
 this.mount = parent.mount;
 this.mounted = null;
 this.id = FS.nextInode++;
 this.name = name;
 this.mode = mode;
 this.node_ops = {};
 this.stream_ops = {};
 this.rdev = rdev;
};

var readMode = 292 | 73;

var writeMode = 146;

Object.defineProperties(FSNode.prototype, {
 read: {
  get: function() {
   return (this.mode & readMode) === readMode;
  },
  set: function(val) {
   val ? this.mode |= readMode : this.mode &= ~readMode;
  }
 },
 write: {
  get: function() {
   return (this.mode & writeMode) === writeMode;
  },
  set: function(val) {
   val ? this.mode |= writeMode : this.mode &= ~writeMode;
  }
 },
 isFolder: {
  get: function() {
   return FS.isDir(this.mode);
  }
 },
 isDevice: {
  get: function() {
   return FS.isChrdev(this.mode);
  }
 }
});

FS.FSNode = FSNode;

FS.staticInit();

Module["FS_createPath"] = FS.createPath;

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

Module["FS_createLazyFile"] = FS.createLazyFile;

Module["FS_createDevice"] = FS.createDevice;

Module["FS_unlink"] = FS.unlink;

var ASSERTIONS = true;

function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}

function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   if (ASSERTIONS) {
    assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
   }
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}

var decodeBase64 = typeof atob === "function" ? atob : function(input) {
 var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 var output = "";
 var chr1, chr2, chr3;
 var enc1, enc2, enc3, enc4;
 var i = 0;
 input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 do {
  enc1 = keyStr.indexOf(input.charAt(i++));
  enc2 = keyStr.indexOf(input.charAt(i++));
  enc3 = keyStr.indexOf(input.charAt(i++));
  enc4 = keyStr.indexOf(input.charAt(i++));
  chr1 = enc1 << 2 | enc2 >> 4;
  chr2 = (enc2 & 15) << 4 | enc3 >> 2;
  chr3 = (enc3 & 3) << 6 | enc4;
  output = output + String.fromCharCode(chr1);
  if (enc3 !== 64) {
   output = output + String.fromCharCode(chr2);
  }
  if (enc4 !== 64) {
   output = output + String.fromCharCode(chr3);
  }
 } while (i < input.length);
 return output;
};

function intArrayFromBase64(s) {
 if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
  var buf;
  try {
   buf = Buffer.from(s, "base64");
  } catch (_) {
   buf = new Buffer(s, "base64");
  }
  return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"]);
 }
 try {
  var decoded = decodeBase64(s);
  var bytes = new Uint8Array(decoded.length);
  for (var i = 0; i < decoded.length; ++i) {
   bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
 } catch (_) {
  throw new Error("Converting base64 string to bytes failed.");
 }
}

function tryParseAsDataURI(filename) {
 if (!isDataURI(filename)) {
  return;
 }
 return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}

var asmLibraryArg = {
 "__cxa_atexit": ___cxa_atexit,
 "_embind_register_bool": __embind_register_bool,
 "_embind_register_emval": __embind_register_emval,
 "_embind_register_float": __embind_register_float,
 "_embind_register_function": __embind_register_function,
 "_embind_register_integer": __embind_register_integer,
 "_embind_register_memory_view": __embind_register_memory_view,
 "_embind_register_std_string": __embind_register_std_string,
 "_embind_register_std_wstring": __embind_register_std_wstring,
 "_embind_register_void": __embind_register_void,
 "abort": _abort,
 "alignfault": alignfault,
 "emscripten_memcpy_big": _emscripten_memcpy_big,
 "emscripten_resize_heap": _emscripten_resize_heap,
 "environ_get": _environ_get,
 "environ_sizes_get": _environ_sizes_get,
 "fd_close": _fd_close,
 "fd_read": _fd_read,
 "fd_seek": _fd_seek,
 "fd_write": _fd_write,
 "segfault": segfault,
 "setTempRet0": _setTempRet0,
 "strftime_l": _strftime_l
};

var asm = createWasm();

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");

var __ZN5Hello5helloEv = Module["__ZN5Hello5helloEv"] = createExportWrapper("_ZN5Hello5helloEv");

var __ZN5Hello10helloAudioEmmj = Module["__ZN5Hello10helloAudioEmmj"] = createExportWrapper("_ZN5Hello10helloAudioEmmj");

var ___getTypeName = Module["___getTypeName"] = createExportWrapper("__getTypeName");

var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = createExportWrapper("__embind_register_native_and_builtin_types");

var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");

var _malloc = Module["_malloc"] = createExportWrapper("malloc");

var _fflush = Module["_fflush"] = createExportWrapper("fflush");

var stackSave = Module["stackSave"] = createExportWrapper("stackSave");

var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");

var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");

var _emscripten_stack_init = Module["_emscripten_stack_init"] = function() {
 return (_emscripten_stack_init = Module["_emscripten_stack_init"] = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};

var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = function() {
 return (_emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};

var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = function() {
 return (_emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};

var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = function() {
 return (_emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};

var _free = Module["_free"] = createExportWrapper("free");

var _sbrk = Module["_sbrk"] = createExportWrapper("sbrk");

var _emscripten_get_sbrk_ptr = Module["_emscripten_get_sbrk_ptr"] = createExportWrapper("emscripten_get_sbrk_ptr");

var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");

var dynCall_viijii = Module["dynCall_viijii"] = createExportWrapper("dynCall_viijii");

var dynCall_iiiiij = Module["dynCall_iiiiij"] = createExportWrapper("dynCall_iiiiij");

var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = createExportWrapper("dynCall_iiiiijj");

var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = createExportWrapper("dynCall_iiiiiijj");

if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = function() {
 abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = function() {
 abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ccall")) Module["ccall"] = function() {
 abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "cwrap")) Module["cwrap"] = function() {
 abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "setValue")) Module["setValue"] = function() {
 abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getValue")) Module["getValue"] = function() {
 abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "allocate")) Module["allocate"] = function() {
 abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = function() {
 abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = function() {
 abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = function() {
 abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = function() {
 abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = function() {
 abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() {
 abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = function() {
 abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = function() {
 abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = function() {
 abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = function() {
 abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = function() {
 abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = function() {
 abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = function() {
 abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = function() {
 abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

Module["addRunDependency"] = addRunDependency;

Module["removeRunDependency"] = removeRunDependency;

if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = function() {
 abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

Module["FS_createPath"] = FS.createPath;

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

Module["FS_createLazyFile"] = FS.createLazyFile;

if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = function() {
 abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

Module["FS_createDevice"] = FS.createDevice;

Module["FS_unlink"] = FS.unlink;

if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = function() {
 abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = function() {
 abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = function() {
 abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = function() {
 abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "addFunction")) Module["addFunction"] = function() {
 abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "removeFunction")) Module["removeFunction"] = function() {
 abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() {
 abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = function() {
 abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "makeBigInt")) Module["makeBigInt"] = function() {
 abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() {
 abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = function() {
 abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = function() {
 abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = function() {
 abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = function() {
 abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = function() {
 abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = function() {
 abort("'callMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = function() {
 abort("'abort' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8")) Module["stringToNewUTF8"] = function() {
 abort("'stringToNewUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "setFileTime")) Module["setFileTime"] = function() {
 abort("'setFileTime' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer")) Module["emscripten_realloc_buffer"] = function() {
 abort("'emscripten_realloc_buffer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = function() {
 abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES")) Module["ERRNO_CODES"] = function() {
 abort("'ERRNO_CODES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES")) Module["ERRNO_MESSAGES"] = function() {
 abort("'ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "setErrNo")) Module["setErrNo"] = function() {
 abort("'setErrNo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "readSockaddr")) Module["readSockaddr"] = function() {
 abort("'readSockaddr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeSockaddr")) Module["writeSockaddr"] = function() {
 abort("'writeSockaddr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "DNS")) Module["DNS"] = function() {
 abort("'DNS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getHostByName")) Module["getHostByName"] = function() {
 abort("'getHostByName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES")) Module["GAI_ERRNO_MESSAGES"] = function() {
 abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "Protocols")) Module["Protocols"] = function() {
 abort("'Protocols' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "Sockets")) Module["Sockets"] = function() {
 abort("'Sockets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getRandomDevice")) Module["getRandomDevice"] = function() {
 abort("'getRandomDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "traverseStack")) Module["traverseStack"] = function() {
 abort("'traverseStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE")) Module["UNWIND_CACHE"] = function() {
 abort("'UNWIND_CACHE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "withBuiltinMalloc")) Module["withBuiltinMalloc"] = function() {
 abort("'withBuiltinMalloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgsArray")) Module["readAsmConstArgsArray"] = function() {
 abort("'readAsmConstArgsArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs")) Module["readAsmConstArgs"] = function() {
 abort("'readAsmConstArgs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "mainThreadEM_ASM")) Module["mainThreadEM_ASM"] = function() {
 abort("'mainThreadEM_ASM' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q")) Module["jstoi_q"] = function() {
 abort("'jstoi_q' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s")) Module["jstoi_s"] = function() {
 abort("'jstoi_s' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getExecutableName")) Module["getExecutableName"] = function() {
 abort("'getExecutableName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "listenOnce")) Module["listenOnce"] = function() {
 abort("'listenOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "autoResumeAudioContext")) Module["autoResumeAudioContext"] = function() {
 abort("'autoResumeAudioContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "dynCallLegacy")) Module["dynCallLegacy"] = function() {
 abort("'dynCallLegacy' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getDynCaller")) Module["getDynCaller"] = function() {
 abort("'getDynCaller' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() {
 abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "callRuntimeCallbacks")) Module["callRuntimeCallbacks"] = function() {
 abort("'callRuntimeCallbacks' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "abortStackOverflow")) Module["abortStackOverflow"] = function() {
 abort("'abortStackOverflow' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative")) Module["reallyNegative"] = function() {
 abort("'reallyNegative' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "unSign")) Module["unSign"] = function() {
 abort("'unSign' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "reSign")) Module["reSign"] = function() {
 abort("'reSign' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "formatString")) Module["formatString"] = function() {
 abort("'formatString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "PATH")) Module["PATH"] = function() {
 abort("'PATH' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS")) Module["PATH_FS"] = function() {
 abort("'PATH_FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS")) Module["SYSCALLS"] = function() {
 abort("'SYSCALLS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2")) Module["syscallMmap2"] = function() {
 abort("'syscallMmap2' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap")) Module["syscallMunmap"] = function() {
 abort("'syscallMunmap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getSocketFromFD")) Module["getSocketFromFD"] = function() {
 abort("'getSocketFromFD' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getSocketAddress")) Module["getSocketAddress"] = function() {
 abort("'getSocketAddress' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "JSEvents")) Module["JSEvents"] = function() {
 abort("'JSEvents' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerKeyEventCallback")) Module["registerKeyEventCallback"] = function() {
 abort("'registerKeyEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets")) Module["specialHTMLTargets"] = function() {
 abort("'specialHTMLTargets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "maybeCStringToJsString")) Module["maybeCStringToJsString"] = function() {
 abort("'maybeCStringToJsString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "findEventTarget")) Module["findEventTarget"] = function() {
 abort("'findEventTarget' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "findCanvasEventTarget")) Module["findCanvasEventTarget"] = function() {
 abort("'findCanvasEventTarget' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getBoundingClientRect")) Module["getBoundingClientRect"] = function() {
 abort("'getBoundingClientRect' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillMouseEventData")) Module["fillMouseEventData"] = function() {
 abort("'fillMouseEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerMouseEventCallback")) Module["registerMouseEventCallback"] = function() {
 abort("'registerMouseEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerWheelEventCallback")) Module["registerWheelEventCallback"] = function() {
 abort("'registerWheelEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerUiEventCallback")) Module["registerUiEventCallback"] = function() {
 abort("'registerUiEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerFocusEventCallback")) Module["registerFocusEventCallback"] = function() {
 abort("'registerFocusEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceOrientationEventData")) Module["fillDeviceOrientationEventData"] = function() {
 abort("'fillDeviceOrientationEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceOrientationEventCallback")) Module["registerDeviceOrientationEventCallback"] = function() {
 abort("'registerDeviceOrientationEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillDeviceMotionEventData")) Module["fillDeviceMotionEventData"] = function() {
 abort("'fillDeviceMotionEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerDeviceMotionEventCallback")) Module["registerDeviceMotionEventCallback"] = function() {
 abort("'registerDeviceMotionEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "screenOrientation")) Module["screenOrientation"] = function() {
 abort("'screenOrientation' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillOrientationChangeEventData")) Module["fillOrientationChangeEventData"] = function() {
 abort("'fillOrientationChangeEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerOrientationChangeEventCallback")) Module["registerOrientationChangeEventCallback"] = function() {
 abort("'registerOrientationChangeEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillFullscreenChangeEventData")) Module["fillFullscreenChangeEventData"] = function() {
 abort("'fillFullscreenChangeEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerFullscreenChangeEventCallback")) Module["registerFullscreenChangeEventCallback"] = function() {
 abort("'registerFullscreenChangeEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerRestoreOldStyle")) Module["registerRestoreOldStyle"] = function() {
 abort("'registerRestoreOldStyle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "hideEverythingExceptGivenElement")) Module["hideEverythingExceptGivenElement"] = function() {
 abort("'hideEverythingExceptGivenElement' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "restoreHiddenElements")) Module["restoreHiddenElements"] = function() {
 abort("'restoreHiddenElements' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "setLetterbox")) Module["setLetterbox"] = function() {
 abort("'setLetterbox' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "currentFullscreenStrategy")) Module["currentFullscreenStrategy"] = function() {
 abort("'currentFullscreenStrategy' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "restoreOldWindowedStyle")) Module["restoreOldWindowedStyle"] = function() {
 abort("'restoreOldWindowedStyle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "softFullscreenResizeWebGLRenderTarget")) Module["softFullscreenResizeWebGLRenderTarget"] = function() {
 abort("'softFullscreenResizeWebGLRenderTarget' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "doRequestFullscreen")) Module["doRequestFullscreen"] = function() {
 abort("'doRequestFullscreen' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillPointerlockChangeEventData")) Module["fillPointerlockChangeEventData"] = function() {
 abort("'fillPointerlockChangeEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockChangeEventCallback")) Module["registerPointerlockChangeEventCallback"] = function() {
 abort("'registerPointerlockChangeEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerPointerlockErrorEventCallback")) Module["registerPointerlockErrorEventCallback"] = function() {
 abort("'registerPointerlockErrorEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "requestPointerLock")) Module["requestPointerLock"] = function() {
 abort("'requestPointerLock' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillVisibilityChangeEventData")) Module["fillVisibilityChangeEventData"] = function() {
 abort("'fillVisibilityChangeEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerVisibilityChangeEventCallback")) Module["registerVisibilityChangeEventCallback"] = function() {
 abort("'registerVisibilityChangeEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerTouchEventCallback")) Module["registerTouchEventCallback"] = function() {
 abort("'registerTouchEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillGamepadEventData")) Module["fillGamepadEventData"] = function() {
 abort("'fillGamepadEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerGamepadEventCallback")) Module["registerGamepadEventCallback"] = function() {
 abort("'registerGamepadEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerBeforeUnloadEventCallback")) Module["registerBeforeUnloadEventCallback"] = function() {
 abort("'registerBeforeUnloadEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "fillBatteryEventData")) Module["fillBatteryEventData"] = function() {
 abort("'fillBatteryEventData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "battery")) Module["battery"] = function() {
 abort("'battery' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerBatteryEventCallback")) Module["registerBatteryEventCallback"] = function() {
 abort("'registerBatteryEventCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "setCanvasElementSize")) Module["setCanvasElementSize"] = function() {
 abort("'setCanvasElementSize' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getCanvasElementSize")) Module["getCanvasElementSize"] = function() {
 abort("'getCanvasElementSize' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "polyfillSetImmediate")) Module["polyfillSetImmediate"] = function() {
 abort("'polyfillSetImmediate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "demangle")) Module["demangle"] = function() {
 abort("'demangle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "demangleAll")) Module["demangleAll"] = function() {
 abort("'demangleAll' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace")) Module["jsStackTrace"] = function() {
 abort("'jsStackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() {
 abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings")) Module["getEnvStrings"] = function() {
 abort("'getEnvStrings' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "checkWasiClock")) Module["checkWasiClock"] = function() {
 abort("'checkWasiClock' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64")) Module["writeI53ToI64"] = function() {
 abort("'writeI53ToI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped")) Module["writeI53ToI64Clamped"] = function() {
 abort("'writeI53ToI64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling")) Module["writeI53ToI64Signaling"] = function() {
 abort("'writeI53ToI64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped")) Module["writeI53ToU64Clamped"] = function() {
 abort("'writeI53ToU64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling")) Module["writeI53ToU64Signaling"] = function() {
 abort("'writeI53ToU64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64")) Module["readI53FromI64"] = function() {
 abort("'readI53FromI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64")) Module["readI53FromU64"] = function() {
 abort("'readI53FromU64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53")) Module["convertI32PairToI53"] = function() {
 abort("'convertI32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53")) Module["convertU32PairToI53"] = function() {
 abort("'convertU32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "uncaughtExceptionCount")) Module["uncaughtExceptionCount"] = function() {
 abort("'uncaughtExceptionCount' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "exceptionLast")) Module["exceptionLast"] = function() {
 abort("'exceptionLast' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "exceptionCaught")) Module["exceptionCaught"] = function() {
 abort("'exceptionCaught' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfoAttrs")) Module["ExceptionInfoAttrs"] = function() {
 abort("'ExceptionInfoAttrs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ExceptionInfo")) Module["ExceptionInfo"] = function() {
 abort("'ExceptionInfo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "CatchInfo")) Module["CatchInfo"] = function() {
 abort("'CatchInfo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "exception_addRef")) Module["exception_addRef"] = function() {
 abort("'exception_addRef' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "exception_decRef")) Module["exception_decRef"] = function() {
 abort("'exception_decRef' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "Browser")) Module["Browser"] = function() {
 abort("'Browser' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "funcWrappers")) Module["funcWrappers"] = function() {
 abort("'funcWrappers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() {
 abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "setMainLoop")) Module["setMainLoop"] = function() {
 abort("'setMainLoop' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

Module["FS"] = FS;

if (!Object.getOwnPropertyDescriptor(Module, "mmapAlloc")) Module["mmapAlloc"] = function() {
 abort("'mmapAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "MEMFS")) Module["MEMFS"] = function() {
 abort("'MEMFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "TTY")) Module["TTY"] = function() {
 abort("'TTY' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "PIPEFS")) Module["PIPEFS"] = function() {
 abort("'PIPEFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "SOCKFS")) Module["SOCKFS"] = function() {
 abort("'SOCKFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "_setNetworkCallback")) Module["_setNetworkCallback"] = function() {
 abort("'_setNetworkCallback' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode")) Module["SDL_unicode"] = function() {
 abort("'SDL_unicode' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext")) Module["SDL_ttfContext"] = function() {
 abort("'SDL_ttfContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio")) Module["SDL_audio"] = function() {
 abort("'SDL_audio' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "SDL")) Module["SDL"] = function() {
 abort("'SDL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx")) Module["SDL_gfx"] = function() {
 abort("'SDL_gfx' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "emval_handle_array")) Module["emval_handle_array"] = function() {
 abort("'emval_handle_array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "emval_free_list")) Module["emval_free_list"] = function() {
 abort("'emval_free_list' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "emval_symbols")) Module["emval_symbols"] = function() {
 abort("'emval_symbols' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "init_emval")) Module["init_emval"] = function() {
 abort("'init_emval' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "count_emval_handles")) Module["count_emval_handles"] = function() {
 abort("'count_emval_handles' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "get_first_emval")) Module["get_first_emval"] = function() {
 abort("'get_first_emval' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getStringOrSymbol")) Module["getStringOrSymbol"] = function() {
 abort("'getStringOrSymbol' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "requireHandle")) Module["requireHandle"] = function() {
 abort("'requireHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "emval_newers")) Module["emval_newers"] = function() {
 abort("'emval_newers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "craftEmvalAllocator")) Module["craftEmvalAllocator"] = function() {
 abort("'craftEmvalAllocator' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "emval_get_global")) Module["emval_get_global"] = function() {
 abort("'emval_get_global' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "emval_methodCallers")) Module["emval_methodCallers"] = function() {
 abort("'emval_methodCallers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "InternalError")) Module["InternalError"] = function() {
 abort("'InternalError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "BindingError")) Module["BindingError"] = function() {
 abort("'BindingError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "UnboundTypeError")) Module["UnboundTypeError"] = function() {
 abort("'UnboundTypeError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "PureVirtualError")) Module["PureVirtualError"] = function() {
 abort("'PureVirtualError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "init_embind")) Module["init_embind"] = function() {
 abort("'init_embind' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "throwInternalError")) Module["throwInternalError"] = function() {
 abort("'throwInternalError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "throwBindingError")) Module["throwBindingError"] = function() {
 abort("'throwBindingError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "throwUnboundTypeError")) Module["throwUnboundTypeError"] = function() {
 abort("'throwUnboundTypeError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ensureOverloadTable")) Module["ensureOverloadTable"] = function() {
 abort("'ensureOverloadTable' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "exposePublicSymbol")) Module["exposePublicSymbol"] = function() {
 abort("'exposePublicSymbol' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "replacePublicSymbol")) Module["replacePublicSymbol"] = function() {
 abort("'replacePublicSymbol' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "extendError")) Module["extendError"] = function() {
 abort("'extendError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "createNamedFunction")) Module["createNamedFunction"] = function() {
 abort("'createNamedFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registeredInstances")) Module["registeredInstances"] = function() {
 abort("'registeredInstances' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getBasestPointer")) Module["getBasestPointer"] = function() {
 abort("'getBasestPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerInheritedInstance")) Module["registerInheritedInstance"] = function() {
 abort("'registerInheritedInstance' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "unregisterInheritedInstance")) Module["unregisterInheritedInstance"] = function() {
 abort("'unregisterInheritedInstance' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getInheritedInstance")) Module["getInheritedInstance"] = function() {
 abort("'getInheritedInstance' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getInheritedInstanceCount")) Module["getInheritedInstanceCount"] = function() {
 abort("'getInheritedInstanceCount' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getLiveInheritedInstances")) Module["getLiveInheritedInstances"] = function() {
 abort("'getLiveInheritedInstances' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registeredTypes")) Module["registeredTypes"] = function() {
 abort("'registeredTypes' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "awaitingDependencies")) Module["awaitingDependencies"] = function() {
 abort("'awaitingDependencies' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "typeDependencies")) Module["typeDependencies"] = function() {
 abort("'typeDependencies' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registeredPointers")) Module["registeredPointers"] = function() {
 abort("'registeredPointers' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "registerType")) Module["registerType"] = function() {
 abort("'registerType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "whenDependentTypesAreResolved")) Module["whenDependentTypesAreResolved"] = function() {
 abort("'whenDependentTypesAreResolved' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "embind_charCodes")) Module["embind_charCodes"] = function() {
 abort("'embind_charCodes' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "embind_init_charCodes")) Module["embind_init_charCodes"] = function() {
 abort("'embind_init_charCodes' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "readLatin1String")) Module["readLatin1String"] = function() {
 abort("'readLatin1String' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getTypeName")) Module["getTypeName"] = function() {
 abort("'getTypeName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "heap32VectorToArray")) Module["heap32VectorToArray"] = function() {
 abort("'heap32VectorToArray' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "requireRegisteredType")) Module["requireRegisteredType"] = function() {
 abort("'requireRegisteredType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "getShiftFromSize")) Module["getShiftFromSize"] = function() {
 abort("'getShiftFromSize' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "integerReadValueFromPointer")) Module["integerReadValueFromPointer"] = function() {
 abort("'integerReadValueFromPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "enumReadValueFromPointer")) Module["enumReadValueFromPointer"] = function() {
 abort("'enumReadValueFromPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "floatReadValueFromPointer")) Module["floatReadValueFromPointer"] = function() {
 abort("'floatReadValueFromPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "simpleReadValueFromPointer")) Module["simpleReadValueFromPointer"] = function() {
 abort("'simpleReadValueFromPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "runDestructors")) Module["runDestructors"] = function() {
 abort("'runDestructors' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "new_")) Module["new_"] = function() {
 abort("'new_' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "craftInvokerFunction")) Module["craftInvokerFunction"] = function() {
 abort("'craftInvokerFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "embind__requireFunction")) Module["embind__requireFunction"] = function() {
 abort("'embind__requireFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "tupleRegistrations")) Module["tupleRegistrations"] = function() {
 abort("'tupleRegistrations' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "structRegistrations")) Module["structRegistrations"] = function() {
 abort("'structRegistrations' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "genericPointerToWireType")) Module["genericPointerToWireType"] = function() {
 abort("'genericPointerToWireType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "constNoSmartPtrRawPointerToWireType")) Module["constNoSmartPtrRawPointerToWireType"] = function() {
 abort("'constNoSmartPtrRawPointerToWireType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "nonConstNoSmartPtrRawPointerToWireType")) Module["nonConstNoSmartPtrRawPointerToWireType"] = function() {
 abort("'nonConstNoSmartPtrRawPointerToWireType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "init_RegisteredPointer")) Module["init_RegisteredPointer"] = function() {
 abort("'init_RegisteredPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer")) Module["RegisteredPointer"] = function() {
 abort("'RegisteredPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_getPointee")) Module["RegisteredPointer_getPointee"] = function() {
 abort("'RegisteredPointer_getPointee' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_destructor")) Module["RegisteredPointer_destructor"] = function() {
 abort("'RegisteredPointer_destructor' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_deleteObject")) Module["RegisteredPointer_deleteObject"] = function() {
 abort("'RegisteredPointer_deleteObject' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "RegisteredPointer_fromWireType")) Module["RegisteredPointer_fromWireType"] = function() {
 abort("'RegisteredPointer_fromWireType' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "runDestructor")) Module["runDestructor"] = function() {
 abort("'runDestructor' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "releaseClassHandle")) Module["releaseClassHandle"] = function() {
 abort("'releaseClassHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "finalizationGroup")) Module["finalizationGroup"] = function() {
 abort("'finalizationGroup' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "detachFinalizer_deps")) Module["detachFinalizer_deps"] = function() {
 abort("'detachFinalizer_deps' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "detachFinalizer")) Module["detachFinalizer"] = function() {
 abort("'detachFinalizer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "attachFinalizer")) Module["attachFinalizer"] = function() {
 abort("'attachFinalizer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "makeClassHandle")) Module["makeClassHandle"] = function() {
 abort("'makeClassHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "init_ClassHandle")) Module["init_ClassHandle"] = function() {
 abort("'init_ClassHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle")) Module["ClassHandle"] = function() {
 abort("'ClassHandle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_isAliasOf")) Module["ClassHandle_isAliasOf"] = function() {
 abort("'ClassHandle_isAliasOf' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "throwInstanceAlreadyDeleted")) Module["throwInstanceAlreadyDeleted"] = function() {
 abort("'throwInstanceAlreadyDeleted' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_clone")) Module["ClassHandle_clone"] = function() {
 abort("'ClassHandle_clone' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_delete")) Module["ClassHandle_delete"] = function() {
 abort("'ClassHandle_delete' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "deletionQueue")) Module["deletionQueue"] = function() {
 abort("'deletionQueue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_isDeleted")) Module["ClassHandle_isDeleted"] = function() {
 abort("'ClassHandle_isDeleted' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ClassHandle_deleteLater")) Module["ClassHandle_deleteLater"] = function() {
 abort("'ClassHandle_deleteLater' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "flushPendingDeletes")) Module["flushPendingDeletes"] = function() {
 abort("'flushPendingDeletes' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "delayFunction")) Module["delayFunction"] = function() {
 abort("'delayFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "setDelayFunction")) Module["setDelayFunction"] = function() {
 abort("'setDelayFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "RegisteredClass")) Module["RegisteredClass"] = function() {
 abort("'RegisteredClass' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "shallowCopyInternalPointer")) Module["shallowCopyInternalPointer"] = function() {
 abort("'shallowCopyInternalPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "downcastPointer")) Module["downcastPointer"] = function() {
 abort("'downcastPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "upcastPointer")) Module["upcastPointer"] = function() {
 abort("'upcastPointer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "validateThis")) Module["validateThis"] = function() {
 abort("'validateThis' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "char_0")) Module["char_0"] = function() {
 abort("'char_0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "char_9")) Module["char_9"] = function() {
 abort("'char_9' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "makeLegalFunctionName")) Module["makeLegalFunctionName"] = function() {
 abort("'makeLegalFunctionName' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = function() {
 abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = function() {
 abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = function() {
 abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = function() {
 abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = function() {
 abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = function() {
 abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = function() {
 abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = function() {
 abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = function() {
 abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = function() {
 abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = function() {
 abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = function() {
 abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = function() {
 abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack")) Module["allocateUTF8OnStack"] = function() {
 abort("'allocateUTF8OnStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

Module["writeStackCookie"] = writeStackCookie;

Module["checkStackCookie"] = checkStackCookie;

if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromBase64")) Module["intArrayFromBase64"] = function() {
 abort("'intArrayFromBase64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "tryParseAsDataURI")) Module["tryParseAsDataURI"] = function() {
 abort("'tryParseAsDataURI' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
};

if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", {
 configurable: true,
 get: function() {
  abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
 }
});

if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", {
 configurable: true,
 get: function() {
  abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
 }
});

var calledRun;

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

var calledMain = false;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function stackCheckInit() {
 _emscripten_stack_init();
 writeStackCookie();
}

function run(args) {
 args = args || arguments_;
 if (runDependencies > 0) {
  return;
 }
 stackCheckInit();
 preRun();
 if (runDependencies > 0) {
  return;
 }
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  preMain();
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  assert(!Module["_main"], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
 checkStackCookie();
}

Module["run"] = run;

function checkUnflushedContent() {
 var oldOut = out;
 var oldErr = err;
 var has = false;
 out = err = function(x) {
  has = true;
 };
 try {
  var flush = Module["_fflush"];
  if (flush) flush(0);
  [ "stdout", "stderr" ].forEach(function(name) {
   var info = FS.analyzePath("/dev/" + name);
   if (!info) return;
   var stream = info.object;
   var rdev = stream.rdev;
   var tty = TTY.ttys[rdev];
   if (tty && tty.output && tty.output.length) {
    has = true;
   }
  });
 } catch (e) {}
 out = oldOut;
 err = oldErr;
 if (has) {
  warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.");
 }
}

function exit(status, implicit) {
 checkUnflushedContent();
 if (implicit && noExitRuntime && status === 0) {
  return;
 }
 if (noExitRuntime) {
  if (!implicit) {
   var msg = "program exited (with status: " + status + "), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)";
   err(msg);
  }
 } else {
  EXITSTATUS = status;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
  ABORT = true;
 }
 quit_(status, new ExitStatus(status));
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

run();
globalThis.Module = Module;

export default Module;