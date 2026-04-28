from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List
import uuid
import time
import os

from app.config import settings
from app.schemas.models import ReconstructionTask, ReconstructionStatus, Room, RoomType, RoomDimensions, Wall
from app.utils.logger import setup_logger

router = APIRouter(prefix="/reconstruction", tags=["3D Reconstruction"])
logger = setup_logger()

reconstruction_tasks: dict = {}

def simulate_reconstruction(task_id: str):
    task = reconstruction_tasks.get(task_id)
    if not task:
        return
    
    try:
        task.status = ReconstructionStatus.PROCESSING
        task.progress = 0.1
        task.updated_at = time.time()
        
        for i in range(1, 10):
            time.sleep(0.5)
            task.progress = i * 0.1
            task.updated_at = time.time()
        
        sample_room = Room(
            id=str(uuid.uuid4()),
            type=RoomType.LIVING_ROOM,
            name="客厅",
            dimensions=RoomDimensions(width=5.0, depth=4.0, height=2.8),
            walls=[
                Wall(id="wall_1", start_point=[0, 0, 0], end_point=[5, 0, 0], height=2.8, thickness=0.2),
                Wall(id="wall_2", start_point=[5, 0, 0], end_point=[5, 0, 4], height=2.8, thickness=0.2, has_door=True),
                Wall(id="wall_3", start_point=[5, 0, 4], end_point=[0, 0, 4], height=2.8, thickness=0.2, has_window=True),
                Wall(id="wall_4", start_point=[0, 0, 4], end_point=[0, 0, 0], height=2.8, thickness=0.2),
            ],
            floor={"material": "wood", "color": "#8B4513"},
            ceiling={"material": "white", "color": "#FFFFFF"}
        )
        
        task.rooms = [sample_room]
        task.status = ReconstructionStatus.COMPLETED
        task.progress = 1.0
        task.updated_at = time.time()
        logger.info(f"Reconstruction task {task_id} completed")
        
    except Exception as e:
        task.status = ReconstructionStatus.FAILED
        task.error_message = str(e)
        task.updated_at = time.time()
        logger.error(f"Reconstruction task {task_id} failed: {str(e)}")

@router.post("/upload", response_model=ReconstructionTask)
async def upload_images(
    background_tasks: BackgroundTasks,
    images: List[UploadFile] = File(...)
):
    if not images:
        raise HTTPException(status_code=400, detail="No images provided")
    
    if len(images) < 3:
        raise HTTPException(status_code=400, detail="At least 3 images required for reconstruction")
    
    for image in images:
        if image.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400, 
                detail=f"Image type {image.content_type} not allowed. Allowed types: {settings.ALLOWED_IMAGE_TYPES}"
            )
    
    task_id = str(uuid.uuid4())
    task_dir = os.path.join(settings.UPLOAD_DIR, task_id)
    os.makedirs(task_dir, exist_ok=True)
    
    for i, image in enumerate(images):
        file_extension = image.filename.split('.')[-1] if image.filename else 'jpg'
        file_path = os.path.join(task_dir, f"image_{i+1}.{file_extension}")
        content = await image.read()
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"Saved image {i+1} to {file_path}")
    
    task = ReconstructionTask(
        task_id=task_id,
        status=ReconstructionStatus.UPLOADED,
        image_count=len(images),
        progress=0.0,
        created_at=time.time(),
        updated_at=time.time()
    )
    reconstruction_tasks[task_id] = task
    
    background_tasks.add_task(simulate_reconstruction, task_id)
    logger.info(f"Started reconstruction task: {task_id} with {len(images)} images")
    
    return task

@router.get("/status/{task_id}", response_model=ReconstructionTask)
async def get_reconstruction_status(task_id: str):
    task = reconstruction_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/tasks", response_model=List[ReconstructionTask])
async def list_reconstruction_tasks():
    return list(reconstruction_tasks.values())
