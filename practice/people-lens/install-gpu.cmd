@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  py -3.12 -m venv .venv
  if errorlevel 1 goto failed
)
echo Installing GPU support. This downloads several GB.
".venv\Scripts\python.exe" -m pip install --upgrade --force-reinstall torch torchvision --index-url https://download.pytorch.org/whl/cu128
if errorlevel 1 goto failed
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto failed
".venv\Scripts\python.exe" -c "import torch; print('CUDA available:', torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU only: check your driver and PyTorch installation')"
echo Setup finished. Run start.cmd to launch the app.
pause
exit /b 0
:failed
echo Setup did not finish. Read the error above and the instructions in README.md.
pause
exit /b 1
