"""Single-user YOLO practice server. Frames stay in memory and are not recorded."""
import argparse
import hmac
import io
import json
import os
import secrets
import ssl
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MAX_FRAME = 2 * 1024 * 1024


class Detector:
    def __init__(self, model_path, device):
        (ROOT / ".runtime").mkdir(exist_ok=True)
        os.environ.setdefault("YOLO_CONFIG_DIR", str(ROOT / ".runtime"))
        import torch
        from ultralytics import YOLO, settings
        settings.update({"sync": False})
        self.device = ("0" if torch.cuda.is_available() else "cpu") if device == "auto" else device
        self.label = torch.cuda.get_device_name(0) if self.device == "0" else self.device.upper()
        self.model = YOLO(model_path)
        self.lock = threading.Lock()

    def predict(self, payload, confidence):
        from PIL import Image, UnidentifiedImageError
        try:
            with Image.open(io.BytesIO(payload)) as source:
                if source.width * source.height > 4_000_000:
                    raise ValueError("Frame is too large. Maximum: 4 megapixels.")
                frame = source.convert("RGB")
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
            raise ValueError("Send a valid JPEG or PNG image.") from exc
        started = time.perf_counter()
        with self.lock:
            result = self.model.predict(frame, classes=[0], conf=confidence, imgsz=640,
                                        device=self.device, verbose=False, save=False)[0]
        boxes = []
        for box in result.boxes:
            boxes.append({"xyxy": box.xyxyn[0].tolist(), "confidence": float(box.conf[0])})
        return {"boxes": boxes, "count": len(boxes),
                "processing_ms": round((time.perf_counter() - started) * 1000),
                "device": self.label}


def make_handler(detector, token):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # Do not log frames, pairing codes, or request URLs.

        def send(self, status, body, mime="application/json"):
            if isinstance(body, dict):
                body = json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Permissions-Policy", "camera=(self), microphone=()")
            self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path = self.path.split("?", 1)[0]
            files = {"/": (ROOT / "index.html", "text/html; charset=utf-8"),
                     "/app.js": (ROOT / "app.js", "text/javascript"),
                     "/style.css": (ROOT / "style.css", "text/css"),
                     "/font.woff2": (ROOT.parents[1] / "public/fonts/manrope-latin-wght-normal.woff2", "font/woff2")}
            if path == "/health":
                self.send(200, {"ready": True, "device": detector.label})
            elif path in files and files[path][0].exists():
                file, mime = files[path]
                self.send(200, file.read_bytes(), mime)
            else:
                self.send(404, {"error": "Not found"})

        def do_POST(self):
            if self.path != "/detect":
                return self.send(404, {"error": "Not found"})
            if not hmac.compare_digest(self.headers.get("X-Pairing-Code", "").encode(), token.encode()):
                return self.send(401, {"error": "Pairing code is incorrect. Copy it from the laptop terminal."})
            try:
                size = int(self.headers.get("Content-Length", "0"))
                confidence = float(self.headers.get("X-Confidence", "0.4"))
                if not 0.1 <= confidence <= 0.9:
                    raise ValueError("Confidence must be between 0.1 and 0.9.")
                if not 0 < size <= MAX_FRAME:
                    return self.send(413, {"error": "Frame must be between 1 byte and 2 MB."})
                self.connection.settimeout(15)
                data = self.rfile.read(size)
                if len(data) != size:
                    raise ValueError("Incomplete frame. Please retry.")
                self.send(200, detector.predict(data, confidence))
            except (ValueError, TimeoutError) as exc:
                self.send(400, {"error": str(exc)})
            except Exception:
                self.send(500, {"error": "Detection failed. Stop and restart the laptop service; try --device cpu if GPU setup failed."})
    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--device", choices=["auto", "0", "cpu"], default="auto")
    parser.add_argument("--model", default=str(ROOT / "yolo11n.pt"))
    parser.add_argument("--cert")
    parser.add_argument("--key")
    args = parser.parse_args()
    if bool(args.cert) != bool(args.key):
        parser.error("Supply both --cert and --key.")
    if args.host not in ("127.0.0.1", "localhost") and not args.cert:
        parser.error("Wi-Fi access requires --cert and --key. See README.md for phone setup.")
    print("Loading YOLO (first run downloads model weights)...", flush=True)
    detector = Detector(args.model, args.device)
    token = secrets.token_urlsafe(18)
    server = ThreadingHTTPServer((args.host, args.port), make_handler(detector, token))
    if args.cert:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(args.cert, args.key)
        server.socket = context.wrap_socket(server.socket, server_side=True)
    print(f"Device: {detector.label}\nPairing code: {token}", flush=True)
    scheme = "https" if args.cert else "http"
    print(f"Open {scheme}://{'YOUR-LAPTOP-IP' if args.host == '0.0.0.0' else args.host}:{args.port}\nPress Ctrl+C to stop.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
