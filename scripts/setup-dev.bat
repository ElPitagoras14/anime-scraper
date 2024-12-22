@echo off

echo Creating virtual environment 'venv' for backend...
python -m venv backend\venv

echo Installing backend dependencies...
call backend\venv\Scripts\pip install -r backend\requirements.txt
call playwright install chromium
call playwright install-deps

echo Installing frontend dependencies...
cd frontend
npm install

echo Setup completed successfully!
pause
