from app.routers.reconstruction import router as reconstruction_router
from app.routers.design import router as design_router
from app.routers.furniture import router as furniture_router
from app.routers.visualization import router as visualization_router

__all__ = ["reconstruction_router", "design_router", "furniture_router", "visualization_router"]
