from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers.reconstruction import router as reconstruction_router
from app.routers.design import router as design_router
from app.routers.furniture import router as furniture_router
from app.routers.visualization import router as visualization_router
from app.utils.logger import setup_logger

logger = setup_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME}...")
    import os
    for dir_name in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.MODELS_DIR]:
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
            logger.info(f"Created directory: {dir_name}")
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reconstruction_router, prefix=settings.API_V1_STR)
app.include_router(design_router, prefix=settings.API_V1_STR)
app.include_router(furniture_router, prefix=settings.API_V1_STR)
app.include_router(visualization_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.APP_NAME} API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
