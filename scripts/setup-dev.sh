#!/bin/bash

echo "Creating virtual environment 'venv' for backend..."
python3 -m venv backend/venv

echo "Installing backend dependencies..."
source backend/venv/bin/activate
pip install -r backend/requirements.txt
playwright install chromium
playwright install-deps
deactivate

echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Setup completed successfully!"
read -p "Press Enter to exit..."
