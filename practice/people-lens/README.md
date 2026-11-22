# People Lens

A standalone practice app: Android camera → laptop YOLO → annotated frames.
Uses YOLO11 nano, filters the pretrained COCO model to the person class, and
automatically chooses CUDA when available. No training is required. The visible
count is people in the current frame, not unique people or shop footfall.

## Install on Windows

Use Python 3.11 or 3.12 from python.org. In PowerShell, from this folder:

On this checkout, **install-gpu.cmd** performs the GPU package installation and
**start.cmd** starts the service afterward. The installer can also replace a CPU-only
PyTorch installation. For manual setup:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -c "import torch; print('CUDA available:', torch.cuda.is_available())"
.\.venv\Scripts\python.exe server.py
```

The first launch downloads the YOLO weights. Keep the terminal open. It prints a
pairing code and the actual processing device. For a CPU fallback, append
`--device cpu`. If CUDA is unavailable unexpectedly, check the NVIDIA driver and
the [official PyTorch installer](https://pytorch.org/get-started/locally/).
To replace an existing CPU build, use `install-gpu.cmd` or add
`--upgrade --force-reinstall` to the PyTorch install command above.

## Android: easiest first test over USB

1. Install Google's [SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools).
2. On the phone, enable Developer options and USB debugging. Connect it to the
   laptop using a data cable, and accept the phone's debugging prompt for this laptop.
3. In a second terminal, using `adb.exe` from Platform Tools, run:

```powershell
adb devices
adb reverse tcp:8765 tcp:8765
```

4. Open **http://localhost:8765** in Chrome **on the phone**.
5. Paste the pairing code printed by the server, then tap **Start camera** and allow
   camera access. The first inference can take longer while the model warms up.
6. Point at people. Try changing confidence. Stop the camera before switching front/back.

The USB forwarding makes localhost on the phone reach the laptop. Chrome treats
localhost as a secure context. Ordinary `http://192.168...` Wi-Fi addresses will
not enable browser camera access. There is no need to disable browser security.

To disconnect: stop the camera, press Ctrl+C in the server terminal, then run
`adb reverse --remove tcp:8765`. You can disable USB debugging afterward.

## Optional: Wi-Fi instead of USB

Both devices must be on a network that allows them to communicate. Use a locally
trusted HTTPS certificate. With [mkcert](https://github.com/FiloSottile/mkcert):

```powershell
mkcert -install
# Replace 192.168.1.10 with your laptop's actual Wi-Fi IPv4 address.
mkcert -cert-file cert.pem -key-file key.pem localhost 127.0.0.1 192.168.1.10
.\.venv\Scripts\python.exe server.py --host 0.0.0.0 --cert cert.pem --key key.pem
```

Install mkcert's **rootCA.pem** on the phone as a trusted CA certificate, following
its mobile instructions. Find it with `mkcert -CAROOT`. Never transfer the private
`rootCA-key.pem`. Trusting a local CA is a device trust change; USB avoids that setup.
Open `https://192.168.1.10:8765` on the phone and enter the pairing code. If Windows
asks about network access, use your private network only. A changing laptop IP
requires a certificate covering the new address. Do not expose this practice server
through internet port forwarding.

## What to expect

- At most one frame request at a time per browser; no growing frame queue.
- Images are resized to a maximum 960-pixel side, with YOLO inference at size 640.
- The preview shows the exact analysed frame, not a newer live frame. It will look
  less smooth than a normal camera preview, but boxes align with their source.
- The displayed time includes transfer and processing. GPU availability does not
  imply a guaranteed frame rate.
- Backgrounding the page stops the camera. Tap Start camera to resume.
- A photo input is available for checking detection without a camera.
- Frames are held in memory, sent only to this service, and not written to disk.
- This is a single-user learning server, not a hardened public service.
- No staff exclusion, identity recognition, recording, or cumulative visit counting.

## Checks

```powershell
py -3.12 -m unittest discover -s . -p "test_*.py" -v
node --check app.js
node --test app.test.mjs
```

The HTTP tests use a test detector to verify validation and transport without GPU
dependencies. They do not certify model accuracy. Test a real photo with people
and a live phone session before relying on detection results.

Reference: [Ultralytics prediction](https://docs.ultralytics.com/modes/predict/),
[browser camera access](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
