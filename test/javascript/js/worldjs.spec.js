import { afterAll, expect } from "@jest/globals";
import auidoLoader from 'audio-loader';
import { HeapAudioBuffer } from "./wasm-audio-helper";
import { default as Module } from "../../../WorldJS.js";
import fs from 'fs'

function sleep(sec) {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));

}

describe('worldjs', () => {
    let worldwrapper;
    let converter;
    let audioBuffer;
    let heapBuffer;
    let audioBufferMix;
    beforeAll(async () => {
        while (Module.WorldWrapper == null) {
            await sleep(1);
        }
        //worldwrapper = new Module.WorldWrapper(128);
        converter = new Module.FeatureConverter();
        //audioBufferMix = await auidoLoader('/home/cyder/src/libs/simple_world_js/test/assets/wav/test.wav');
        //audioBuffer = audioBufferMix.getChannelData(0).slice(0, 1024);
        //console.log(audioBuffer);
        audioBuffer = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/audio.json', 'utf8'))
        heapBuffer = new HeapAudioBuffer(Module, audioBuffer.length, 1);
        heapBuffer.getChannelData(0).set(audioBuffer);

    });

    afterAll(() => {
       heapBuffer.free();
    });

    it('0チャンネル目のsp2melの値が正しい', () => {
        // create parameter json.pyで作られたjsonとwebassemblyの出力が同じかどうかチェックする
        // @TODO 32bit計算のLibrosaCppを使っているため、64bit計算のlibrosaと多少値が違う
        const expectMel = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/melspectrogram.json', 'utf8'))
        expect(converter.melspectram(heapBuffer.getHeapAddress(), audioBuffer.length, 16000, 512, 40, 512, 80).mel[0]).toEqual(expectMel[0])
    });
    it('mgc2spの値が正しい', () => {
        const expectSp = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/sp.json', 'utf8'));
        const mcep = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/mcep.json', 'utf8'));
        const featureLen = mcep[0].length
        const heapBuffer = new HeapAudioBuffer(Module, featureLen, 1);
      
        heapBuffer.getChannelData(0).set(mcep[0]);
        const sp = converter.mc2sp(heapBuffer.getHeapAddress(), featureLen, 0.41000000000000003, 1024).sp;
        const compareSp = [];
        sp.forEach((value)=>{
            compareSp.push(value.toString().slice(0,4));
        });

        const compareExpectSp = expectSp[0].map((value) => {
            return value.toString().slice(0,4);
        });
        expect(compareSp).toEqual(compareExpectSp);
    });
});