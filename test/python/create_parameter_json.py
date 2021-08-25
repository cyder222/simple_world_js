import librosa
import json
import numpy as np

class NumpyEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
            np.int16, np.int32, np.int64, np.uint8,
            np.uint16, np.uint32, np.uint64)):
            return int(obj)
        elif isinstance(obj, (np.float_, np.float16, np.float32,
            np.float64)):
            return float(obj)
        elif isinstance(obj,(np.ndarray,)): #### This is the fix
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

y, sr = librosa.load("/home/cyder/src/libs/simple_world_js/test/assets/wav/test.wav", sr=16000) 
mel = librosa.feature.melspectrogram(y[0:1024], center=True, sr=16000, n_fft=512, hop_length=80, n_mels=40)

path = '/home/cyder/src/libs/simple_world_js/test/expect/melspectrogram.json'
path2 = '/home/cyder/src/libs/simple_world_js/test/expect/audio.json'
dumped = json.dumps(mel.transpose(), cls=NumpyEncoder)
dumped2 = json.dumps(y[0:1024],cls=NumpyEncoder)

with open(path, 'w') as f:
    f.write(dumped)

with open(path2, 'w') as f:
    f.write(dumped2)