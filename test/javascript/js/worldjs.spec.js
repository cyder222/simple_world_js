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
        audioBufferMix = await auidoLoader('/home/cyder/src/libs/simple_world_js/test/assets/wav/test.wav');
        audioBuffer = audioBufferMix.getChannelData(0).slice(0, 1024);
        heapBuffer = new HeapAudioBuffer(Module, audioBuffer.length, 1);
        heapBuffer.getChannelData(0).set(audioBuffer);

    });

    afterAll(() => {
        heapBuffer.free();
    });

    it('0チャンネル目のsp2melの値が正しい', () => {
        const expectMel = JSON.parse(fs.readFileSync('/home/cyder/src/libs/simple_world_js/test/expect/melspectrogram.json', 'utf8'))
        expect(converter.melspectram(heapBuffer.getHeapAddress(), audioBuffer.length, 16000, 512, 40, 512, 80).mel[0]).toEqual(expectMel[0])
    });
    it('mgc2spの値が正しい', () => {
        //expect(converter.mgc2sp(heapBuffer.getChannelData(9))).toBe(100);
    });
});