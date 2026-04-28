from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import uuid
import time

from app.schemas.models import Furniture, FurnitureType, RoomDimensions
from app.utils.logger import setup_logger

router = APIRouter(prefix="/furniture", tags=["Furniture Management"])
logger = setup_logger()

furniture_library: dict = {}
project_furniture: dict = {}

sample_furniture = [
    {
        "id": str(uuid.uuid4()),
        "type": FurnitureType.SOFA,
        "name": "三人沙发",
        "model_url": "/models/sofa_3_seater.glb",
        "dimensions": RoomDimensions(width=2.2, depth=0.9, height=0.85),
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
    },
    {
        "id": str(uuid.uuid4()),
        "type": FurnitureType.TV,
        "name": "65寸电视",
        "model_url": "/models/tv_65inch.glb",
        "dimensions": RoomDimensions(width=1.45, depth=0.08, height=0.83),
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
    },
    {
        "id": str(uuid.uuid4()),
        "type": FurnitureType.TABLE,
        "name": "茶几",
        "model_url": "/models/coffee_table.glb",
        "dimensions": RoomDimensions(width=1.2, depth=0.6, height=0.45),
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
    },
    {
        "id": str(uuid.uuid4()),
        "type": FurnitureType.LIGHT,
        "name": "吊灯",
        "model_url": "/models/chandelier.glb",
        "dimensions": RoomDimensions(width=0.8, depth=0.8, height=1.2),
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
    },
    {
        "id": str(uuid.uuid4()),
        "type": FurnitureType.CABINET,
        "name": "电视柜",
        "model_url": "/models/tv_cabinet.glb",
        "dimensions": RoomDimensions(width=1.8, depth=0.4, height=0.55),
        "position": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
    }
]

for item in sample_furniture:
    furniture_library[item["id"]] = Furniture(**item)

@router.get("/library", response_model=List[Furniture])
async def get_furniture_library(
    furniture_type: Optional[FurnitureType] = Query(None, description="按家具类型筛选")
):
    result = list(furniture_library.values())
    if furniture_type:
        result = [f for f in result if f.type == furniture_type]
    return result

@router.get("/library/{furniture_id}", response_model=Furniture)
async def get_furniture_item(furniture_id: str):
    item = furniture_library.get(furniture_id)
    if not item:
        raise HTTPException(status_code=404, detail="Furniture item not found")
    return item

@router.get("/project/{project_id}", response_model=List[Furniture])
async def get_project_furniture(project_id: str):
    return project_furniture.get(project_id, [])

@router.post("/project/{project_id}/add", response_model=Furniture)
async def add_furniture_to_project(
    project_id: str,
    furniture_id: str,
    position: List[float],
    rotation: Optional[List[float]] = None,
    scale: Optional[List[float]] = None
):
    template = furniture_library.get(furniture_id)
    if not template:
        raise HTTPException(status_code=404, detail="Furniture template not found")
    
    if len(position) != 3:
        raise HTTPException(status_code=400, detail="Position must be 3 coordinates [x, y, z]")
    
    instance_id = str(uuid.uuid4())
    furniture_instance = Furniture(
        id=instance_id,
        type=template.type,
        name=template.name,
        model_url=template.model_url,
        dimensions=template.dimensions,
        position=position,
        rotation=rotation or [0, 0, 0],
        scale=scale or [1, 1, 1]
    )
    
    if project_id not in project_furniture:
        project_furniture[project_id] = []
    project_furniture[project_id].append(furniture_instance)
    
    logger.info(f"Added furniture {instance_id} to project {project_id}")
    return furniture_instance

@router.put("/project/{project_id}/update/{furniture_id}", response_model=Furniture)
async def update_furniture_in_project(
    project_id: str,
    furniture_id: str,
    position: Optional[List[float]] = None,
    rotation: Optional[List[float]] = None,
    scale: Optional[List[float]] = None
):
    furniture_list = project_furniture.get(project_id, [])
    furniture_item = next((f for f in furniture_list if f.id == furniture_id), None)
    
    if not furniture_item:
        raise HTTPException(status_code=404, detail="Furniture not found in project")
    
    if position is not None:
        if len(position) != 3:
            raise HTTPException(status_code=400, detail="Position must be 3 coordinates")
        furniture_item.position = position
    
    if rotation is not None:
        if len(rotation) != 3:
            raise HTTPException(status_code=400, detail="Rotation must be 3 angles")
        furniture_item.rotation = rotation
    
    if scale is not None:
        if len(scale) != 3:
            raise HTTPException(status_code=400, detail="Scale must be 3 values")
        furniture_item.scale = scale
    
    logger.info(f"Updated furniture {furniture_id} in project {project_id}")
    return furniture_item

@router.delete("/project/{project_id}/remove/{furniture_id}")
async def remove_furniture_from_project(project_id: str, furniture_id: str):
    furniture_list = project_furniture.get(project_id, [])
    furniture_item = next((f for f in furniture_list if f.id == furniture_id), None)
    
    if not furniture_item:
        raise HTTPException(status_code=404, detail="Furniture not found in project")
    
    furniture_list.remove(furniture_item)
    logger.info(f"Removed furniture {furniture_id} from project {project_id}")
    
    return {"message": "Furniture removed successfully"}
