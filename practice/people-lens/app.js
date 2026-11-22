const $ = (id) => document.getElementById(id);
const video = $('video'), canvas = $('result'), ctx = canvas.getContext('2d');
const frame = document.createElement('canvas'), frameCtx = frame.getContext('2d');
let stream = null, generation = 0, controller = null, busy = false;
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
function stop(message = 'Camera stopped. No frames are being sent.') {
  generation++; busy = false; controller?.abort(); controller = null;
  stream?.getTracks().forEach(track => track.stop()); stream = null; video.srcObject = null;
  $('start').disabled = false; $('stop').disabled = true; $('camera').disabled = false;
  $('photo').disabled = false; $('mode').textContent = 'Camera off';
  canvas.style.display = 'none'; $('empty').hidden = false; $('count').textContent = '—';
  $('timing').textContent = 'Awaiting a frame'; status(message);
}
function capture(source, width, height) {
  const scale = Math.min(1, 960 / Math.max(width, height));
  frame.width = Math.round(width * scale); frame.height = Math.round(height * scale);
  frameCtx.drawImage(source, 0, 0, frame.width, frame.height);
  return new Promise(resolve => frame.toBlob(resolve, 'image/jpeg', 0.8));
}
async function detect(blob, run) {
  if (!blob) throw new Error('Could not capture this image. Please try another.');
  const request = new AbortController(); controller = request;
  const timeout = setTimeout(() => request.abort(), 60000);
  const started = performance.now();
  try {
    const response = await fetch('/detect', { method: 'POST', body: blob,
      headers: { 'Content-Type': 'image/jpeg', 'X-Pairing-Code': $('pairing').value.trim(),
        'X-Confidence': String(Number($('confidence').value) / 100) }, signal: request.signal });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Detection failed. Try again.');
    if (run !== generation) return;
    canvas.width = frame.width; canvas.height = frame.height;
    ctx.drawImage(frame, 0, 0);
    const line = Math.max(2, canvas.width / 240); ctx.lineWidth = line;
    ctx.font = `600 ${Math.max(15, canvas.width / 40)}px system-ui`;
    for (const box of result.boxes) {
      const [x1,y1,x2,y2] = box.xyxy;
      const x = x1 * canvas.width, y = y1 * canvas.height;
      ctx.strokeStyle = '#f2be49'; ctx.strokeRect(x, y, (x2-x1)*canvas.width, (y2-y1)*canvas.height);
      const label = `Person ${Math.round(box.confidence*100)}%`;
      const labelWidth = ctx.measureText(label).width + 12, labelHeight = Math.max(24, canvas.width / 28);
      const lx = Math.max(0, Math.min(x, canvas.width-labelWidth)), ly = Math.max(labelHeight, y);
      ctx.fillStyle = '#f2be49'; ctx.fillRect(lx, ly-labelHeight, labelWidth, labelHeight);
      ctx.fillStyle = '#162438'; ctx.fillText(label, lx+6, ly-6);
    }
    canvas.style.display = 'block'; $('empty').hidden = true;
    $('count').textContent = result.count; $('device').textContent = result.device;
    $('timing').textContent = `${Math.round(performance.now()-started)} ms / frame`;
    status(`Detecting people · ${result.processing_ms} ms processing. Frames are not saved.`);
  } finally { clearTimeout(timeout); if (controller === request) controller = null; }
}
function describeError(error) {
  if (error.name === 'NotAllowedError') return 'Camera access was denied. Allow it in browser settings, then try again.';
  if (error.name === 'NotFoundError') return 'No camera found. You can try a photo instead.';
  if (error.name === 'NotReadableError') return 'The camera is busy. Close other camera apps and try again.';
  if (error.name === 'AbortError') return 'The laptop took too long to respond. Check the service and retry.';
  return error.message || 'Connection failed. Check that your laptop service is running.';
}
$('controls').addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    status('Camera access needs HTTPS on your phone, or localhost via USB. See the setup guide. You can still try a photo.', true); return;
  }
  stop(); const run = generation; busy = true; $('start').disabled = true; $('photo').disabled = true;
  $('stop').disabled = false; $('camera').disabled = true; status('Requesting camera access…');
  try {
    const acquired = await navigator.mediaDevices.getUserMedia({ audio:false, video:{ facingMode:{ideal:$('camera').value}, width:{ideal:960}, height:{ideal:720} } });
    if (run !== generation) { acquired.getTracks().forEach(track => track.stop()); return; }
    stream = acquired; video.srcObject = stream; await video.play();
    if (run !== generation) return;
    $('mode').textContent = 'Analysed camera frames';
    for (const track of stream.getTracks()) track.addEventListener('ended', () => { if (run === generation) stop('Camera disconnected. Start it again to continue.'); });
    while (run === generation) {
      if (video.videoWidth) {
        const blob = await capture(video, video.videoWidth, video.videoHeight);
        if (run !== generation) break;
        await detect(blob, run);
      }
      await new Promise(resolve => setTimeout(resolve, 120));
    }
  } catch(error) { if (run === generation) { stop(); status(describeError(error), true); } }
  finally { if (run === generation) busy = false; }
});
$('stop').addEventListener('click', () => stop());
$('confidence').addEventListener('input', () => { $('confidenceValue').value = `${$('confidence').value}%`; });
$('photo').addEventListener('change', async event => {
  const file = event.target.files[0]; if (!file || busy) return;
  if (!$('pairing').value.trim()) { status('Enter your laptop pairing code first.', true); event.target.value = ''; return; }
  stop(); const run = generation; busy = true; $('start').disabled = true; $('photo').disabled = true; $('stop').disabled = false;
  let image;
  try {
    if (file.size > 20 * 1024 * 1024) throw new Error('Choose a photo smaller than 20 MB.');
    status('Analysing photo…'); image = await createImageBitmap(file);
    if (run !== generation) return;
    const blob = await capture(image, image.width, image.height);
    if (run !== generation) return;
    await detect(blob, run); if (run === generation) $('mode').textContent = 'Analysed photo';
  } catch(error) { if (run === generation) status(describeError(error), true); }
  finally { image?.close(); if (run === generation) { busy = false; $('start').disabled = false; $('photo').disabled = false; event.target.value = ''; } }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stop('Paused because the app left the foreground. Tap Start camera to resume.'); });
window.addEventListener('pagehide', () => stop());
fetch('/health').then(response => { if(!response.ok) throw new Error(); return response.json(); }).then(data => {
  $('device').textContent = data.device;
  if ($('status').textContent === 'Connecting to the detection service…') status('Laptop ready. Enter the pairing code to begin.');
}).catch(() => {
  $('device').textContent = 'Laptop unavailable';
  if ($('status').textContent === 'Connecting to the detection service…') status('Cannot reach the laptop. Start server.py and reload this page.', true);
});
