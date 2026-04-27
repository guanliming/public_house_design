from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class RoomType(str, Enum):
    LIVING_ROOM = "living_room"
    BEDROOM = "bedroom"
    KITCHEN = "kitchen"
    BATHROOM = "bathroom"
    DINING_ROOM = "dining_room"
    OFFICE = "office"
    BALCONY = "balcony"
    CORRIDOR = "corridor"

class RoomDimensions(BaseModel):
    width: float = Field(..., description="房间宽度（米）")
    depth: float = Field(..., description="房间深度（米）")
    height: float = Field(..., description="房间高度（米）")

class Wall(BaseModel):
    id: str
    start_point: List[float]
    end_point: List[float]
    height: float
    thickness: float
    has_door: bool = False
    has_window: bool = False

class Room(BaseModel):
    id: str
    type: RoomType = RoomType.LIVING_ROOM
    name: str
    dimensions: RoomDimensions
    walls: List[Wall]
    floor: Optional[Dict[str, Any]] = None
    ceiling: Optional[Dict[str, Any]] = None

class FurnitureType(str, Enum):
    SOFA = "sofa"
    CHAIR = "chair"
    TABLE = "table"
    CABINET = "cabinet"
    BED = "bed"
    TV = "tv"
    LIGHT = "light"
    RUG = "rug"
    PLANT = "plant"

class Furniture(BaseModel):
    id: str
    type: FurnitureType
    name: str
    model_url: str
    dimensions: RoomDimensions
    position: List[float]
    rotation: List[float]
    scale: List[float] = [1.0, 1.0, 1.0]

class ReconstructionStatus(str, Enum):
    PENDING = "pending"
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ReconstructionTask(BaseModel):
    task_id: str
    status: ReconstructionStatus = ReconstructionStatus.PENDING
    image_count: int = 0
    progress: float = 0.0
    rooms: Optional[List[Room]] = None
    error_message: Optional[str] = None
    created_at: float
    updated_at: float

class DesignProject(BaseModel):
    id: str
    name: str
    reconstruction_task_id: str
    rooms: List[Room]
    furniture: List[Furniture]
    materials: Dict[str, Any]
    created_at: float
    updated_at: float
