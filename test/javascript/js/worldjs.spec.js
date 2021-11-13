import { afterAll, expect } from "@jest/globals";
import auidoLoader from 'audio-loader';
import { HeapAudioBuffer } from "./wasm-audio-helper";
import { default as WorldJS } from "../../../WorldJS.js";
import { InferenceSession, Tensor } from "onnxruntime-web";
import fs from 'fs'

function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

function scale(values, mean, scale){
    
    return values.map((value, index)=>{
        return (value - mean[index]) / scale[index];
    });
}

function reverseScale(value, mean, scale){
    return values.map((value, index) => {
        return value * scale[index] + mean[index];
    });
}

describe('worldjs', () => {
    let converter;
    let Module = null;
    let worldwrapper = null;
    const kernelBufferSize = 16000 * 200 * 128 - 80;

    beforeAll(async () => {
        if(Module == null) Module = await WorldJS();
        worldwrapper = new Module.WorldWrapper(kernelBufferSize, 16000, 5.0);
        converter = new Module.FeatureConverter();
        //audioBufferMix = await auidoLoader('/home/cyder/src/libs/simple_world_js/test/assets/wav/test.wav');
        //audioBuffer = audioBufferMix.getChannelData(0).slice(0, 1024);
        //console.log(audioBuffer);

    });

    it('0チャンネル目のsp2melの値が正しい', () => {
        const audioBuffer = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/audio.json', 'utf8'))
        const heapBuffer = new HeapAudioBuffer(Module, audioBuffer.length, 1);
        heapBuffer.getChannelData(0).set(audioBuffer);
        // create parameter json.pyで作られたjsonとwebassemblyの出力が同じかどうかチェックする
        // @TODO 32bit計算のLibrosaCppを使っているため、64bit計算のlibrosaと値が違う。そのため、2桁、3桁レベルであっていれば許容する
        const expectMel = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/melspectrogram.json', 'utf8'));
        const compareExpectMel = expectMel.map((value)=> value.reduce((prev,next) => {
            return [...prev, next.toString().slice(0,3)];
        },[]));
        const mel = converter.melspectram(heapBuffer.getHeapAddress(), audioBuffer.length, 16000, 512, 40, 512, 80, false).mel;
        const compareMel = mel.map((value)=> value.reduce((prev,next) => {
            return [...prev, next.toString().slice(0,3)];
        },[]));
        expect(expectMel.length).toEqual(mel.length)
        expect(compareMel).toEqual(compareExpectMel)

        heapBuffer.free();
    });

    it('0チャンネル目のsp2mel(as_db=true)の値が正しい', () => {
        const audioBuffer = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/audio.json', 'utf8'))
        const heapBuffer = new HeapAudioBuffer(Module, audioBuffer.length, 1);
        heapBuffer.getChannelData(0).set(audioBuffer);
        // create parameter json.pyで作られたjsonとwebassemblyの出力が同じかどうかチェックする
        // @TODO 32bit計算のLibrosaCppを使っているため、64bit計算のlibrosaと値が違う。そのため、2桁、3桁レベルであっていれば許容する
        const expectMel = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/melspectrogram_db.json', 'utf8'));
        const compareExpectMel = expectMel.map((value)=> value.reduce((prev,next) => {
            return [...prev, next.toString().slice(0,3)];
        },[]));
        const mel = converter.melspectram(heapBuffer.getHeapAddress(), audioBuffer.length, 16000, 512, 40, 512, 80, true).mel;
        const compareMel = mel.map((value)=> value.reduce((prev,next) => {
            return [...prev, next.toString().slice(0,3)];
        },[]));
        expect(expectMel.length).toEqual(mel.length)
        expect(compareMel).toEqual(compareExpectMel)

        heapBuffer.free();
    });


    /*it('mgc2spの値が正しい', () => {
        const expectSp = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/sp.json', 'utf8'));
        const mcep = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/mcep.json', 'utf8'));
        const featureLen = mcep[0].length
        const heapBuffer = new HeapAudioBuffer(Module, featureLen, 1);
      
        heapBuffer.getChannelData(0).set(mcep[0]);
        const sp = converter.mc2sp(heapBuffer.getHeapAddress(), featureLen, 0.41000000000000003, 1024).sp;
        const compareSp = sp.reduce((prev,next)=>{
            return [...prev, next.toString().slice(0,4)];
        },[]);

        const compareExpectSp = expectSp[0].reduce((prev,next) => {
            return [...prev, next.toString().slice(0,4)];
        },[]);
        expect(compareSp).toEqual(compareExpectSp);
        heapBuffer.free();
    });*/

    it('onnxを含めて正しく変換できる', () => {
        const sourceWave = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/full_wave.json', 'utf8'));
        // full waveから(16000 / 200)*128ごとに取り出して変換していく
        for(i = 0; i< sourceWave.length; i+=kernelBufferSize)
        {
            const chunkWave = sourceWave.slice(i, i + kernelBufferSize - 1);
            const chunkKernelSize = chunkWave.length;
            const buffer = new HeapAudioBuffer(Module, kernelBufferSize, 1);
            buffer.getChannelData(0).set(new Float32Array(chunkKernelSize));
            

            const { f0, fft_size, spectral, aperiodicity } = worldWrapper.FeatureExtract(buffer.getHeapAddress());
            const mel = featureConverter.melspectram(buffer.getHeapAddress(), buffer.length, 16000, 512, 40, 512, 80, true).mel;

            // onnx
            const inputArray = mel.map((float32array)=> {return scale([...float32array], asrScaler.X_mean, asrScaler.X_scale);});
            const flatInputArray = [].concat(...inputArray);
            const inputTensor = new Tensor("float32",[].concat(flatInputArray),[1,40,128]);
            const feeds = { 0: inputTensor };
            console.time("onnx");
            const results = await onnxSession.run(feeds);
            console.timeEnd("onnx");

            const genMcep = results["109"].data;

            // onnxの結果を調整
            const newMcep = splitArray(genMcep, 40).map((mcep)=>{
                return reverseScale([...mcep], vcScaler.Y_mean, vcScaler.Y_scale);
            });

            const flatNewMcep = [].concat(...newMcep);
            const mcepBuffer = new HeapAudioBuffer(Module, 128 * 40);
            mcepBuffer.getChannelView().set(flatNewMcep);
            console.time("mcarray2sp");
            const convertedSp = featureConverter.mcArray2SpArray(mcepBuffer.getHeapAddress(), 40, 128, 0.41000000000000003, 1024).sp;
            
        }

    })

    it('mcArray2SpArrayの値が正しい', () => {
        const expectSp = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/sp.json', 'utf8'));
        const mcep = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/genedMcep.json', 'utf8'));
        const mcep2 = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/mcep.json'))
        const featureLen = mcep2[0].length;
        const frameLen = mcep2.length;

        const heapBuffer = new HeapAudioBuffer(Module, featureLen * frameLen, 1);
        heapBuffer.getChannelData(0).set(Float32Array.from([].concat(...mcep2)));
        //const heapBuffer0 = new HeapAudioBuffer(Module, mcep.length, 1);
        //heapBuffer.getChannelData(0).set(Float32Array.from([].concat(...mcep)));
        //heapBuffer0.getChannelData(0).set(Float32Array.from(mcep));
        //const spArray0 = converter.mcArray2SpArray(heapBuffer0.getHeapAddress(), 40, 128, 0.41000000000000003, 1024).sp;
        heapBuffer0.free();
        // console.log(spArray0[0]);
        //converter.mcArray2SpArray(heapBuffer.getHeapAddress(), featureLen, frameLen, 0.41000000000000003, 1024).sp;
        //converter.mcArray2SpArray(heapBuffer.getHeapAddress(), featureLen, frameLen, 0.41000000000000003, 1024).sp;
        const spArray = converter.mcArray2SpArray(heapBuffer.getHeapAddress(), featureLen, frameLen, 0.41000000000000003, 1024).sp;

        const compareSpArray = spArray?.map((sp)=>{
            return sp.reduce((prev,next) =>{
                return [...prev, next.toString().replace('.','').slice(next.toString().search(/[1-9]/),next.toString().search(/[1-9]/) + 3)];
            },[]);
        });

        const compareExpectSpArray = expectSp.map((sp)=>{
            return sp.reduce((prev,next) =>{
                return [...prev, next.toString().replace('.','').slice(next.toString().search(/[1-9]/), next.toString().search(/[1-9]/) + 3)];
            },[]);
        });
        expect(compareSpArray).toEqual(compareExpectSpArray);
        
        heapBuffer.free();
    });
});