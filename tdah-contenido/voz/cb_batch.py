# Uso: cb_batch.py <ref.wav> <posts.json> <carpeta_audio>  -> genera NN.mp3 con el campo "script" de cada post
import sys, json, os, subprocess, torch, torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
torch.set_num_threads(4)
ref, pj, outd = sys.argv[1:4]
m = ChatterboxMultilingualTTS.from_pretrained(device="cpu")
for i, p in enumerate(json.load(open(pj)), 1):
    w = os.path.join(outd, f"{i:02d}.wav")
    wav = m.generate(p["script"], language_id="es", audio_prompt_path=ref, exaggeration=0.55, cfg_weight=0.5)
    ta.save(w, wav, m.sr)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", w, "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse", "-b:a", "192k", w[:-4] + ".mp3"], check=True)
    print("ok", w, flush=True)
