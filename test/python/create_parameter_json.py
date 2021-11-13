import librosa
import json
import pysptk
import numpy as np
import pyworld as pw

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

class NumpyAsStringEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
            np.int16, np.int32, np.int64, np.uint8,
            np.uint16, np.uint32, np.uint64)):
            return repr(int(obj))
        elif isinstance(obj, (np.float_, np.float16, np.float32,
            np.float64)):
            return repr(float(obj))
        elif isinstance(obj,(np.ndarray,)):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

y, sr = librosa.load("/home/cyder/src/libs/simple_world_js/test/assets/wav/test.wav", sr=16000,  dtype=None)
mel = librosa.feature.melspectrogram(y[0:10240], center=True, sr=16000, n_fft=512, hop_length=80, n_mels=40)
mel_db = librosa.core.power_to_db(mel.transpose())

path = '/home/cyder/src/libs/simple_world_js/test/expect/melspectrogram.json'
path_mel = '/home/cyder/src/libs/simple_world_js/test/expect/melspectrogram_db.json'
path2 = '/home/cyder/src/libs/simple_world_js/test/expect/audio.json'
dumped = json.dumps(mel.transpose(), cls=NumpyEncoder)
dumped2 = json.dumps(y[0:10240],cls=NumpyEncoder)

with open(path, 'w') as f:
    f.write(dumped)

with open(path2, 'w') as f:
    f.write(dumped2)
with open(path_mel, 'w') as f:
    f.write(json.dumps(mel_db, cls=NumpyEncoder))

_f0, t = pw.dio(y, sr)
f0 = pw.stonemask(y, _f0, t, sr)  # pitch refinement
sp = pw.cheaptrick(y, f0, t, sr)  # extract smoothed spectrogram
alpha =  pysptk.util.mcepalpha(sr)

mcep = pysptk.sp2mc(sp, 40, alpha)
mcep = mcep[:27]
sp2 = pysptk.mc2sp(mcep, fftlen = 1024, alpha = alpha)

sp2 = list(map(lambda x: list(map(lambda y: repr(y), x)), sp2))
dumped3 = json.dumps(mcep, cls=NumpyEncoder)
dumped4 = json.dumps(sp2)

path3 = '/home/cyder/src/libs/simple_world_js/test/expect/mcep.json'
path4 = '/home/cyder/src/libs/simple_world_js/test/expect/sp.json'

with open(path3, 'w') as f:
    f.write(dumped3)

with open(path4, 'w') as f:
    f.write(dumped4)