cd /mnt/d/code/public_house_design/frontend
npm run dev
cd /mnt/d/code/public_house_design/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000