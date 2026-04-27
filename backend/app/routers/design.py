from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
import uuid
import time

from app.schemas.models import DesignProject, Room, Furniture
from app.utils.logger import setup_logger

router = APIRouter(prefix="/design", tags=["Design Projects"])
logger = setup_logger()

design_projects: dict = {}

@router.post("/projects", response_model=DesignProject)
async def create_project(
    name: str,
    reconstruction_task_id: Optional[str] = None,
    rooms: Optional[List[Room]] = None
):
    project_id = str(uuid.uuid4())
    
    project = DesignProject(
        id=project_id,
        name=name,
        reconstruction_task_id=reconstruction_task_id or "",
        rooms=rooms or [],
        furniture=[],
        materials={},
        created_at=time.time(),
        updated_at=time.time()
    )
    
    design_projects[project_id] = project
    logger.info(f"Created design project: {project_id}")
    
    return project

@router.get("/projects/{project_id}", response_model=DesignProject)
async def get_project(project_id: str):
    project = design_projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.get("/projects", response_model=List[DesignProject])
async def list_projects():
    return list(design_projects.values())

@router.put("/projects/{project_id}/rooms", response_model=DesignProject)
async def update_rooms(project_id: str, rooms: List[Room]):
    project = design_projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.rooms = rooms
    project.updated_at = time.time()
    
    logger.info(f"Updated rooms for project: {project_id}")
    return project

@router.put("/projects/{project_id}/materials", response_model=DesignProject)
async def update_materials(project_id: str, materials: Dict[str, Any]):
    project = design_projects.get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.materials = materials
    project.updated_at = time.time()
    
    logger.info(f"Updated materials for project: {project_id}")
    return project

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    if project_id not in design_projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    del design_projects[project_id]
    logger.info(f"Deleted design project: {project_id}")
    
    return {"message": "Project deleted successfully"}
