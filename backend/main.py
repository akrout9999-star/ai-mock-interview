import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import initialize_database
from routes.auth import router as auth_router
from routes.interviews import router as interviews_router

# Load environment variables from .env during local development
load_dotenv()


app = FastAPI(
    title="TechPrep API",
    description="Backend API for TechPrep — AI-Powered Adaptive Mock Interviewer",
    version="1.0.0",
)


# ---------------------------------------------------------
# Database startup
# ---------------------------------------------------------


@app.on_event("startup")
def startup():
    initialize_database()


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

if frontend_url and frontend_url not in allowed_origins:
    allowed_origins.append(frontend_url)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Routes
# ---------------------------------------------------------

app.include_router(auth_router)
app.include_router(interviews_router)


# ---------------------------------------------------------
# System endpoints
# ---------------------------------------------------------


@app.get("/")
def root():
    return {
        "message": "TechPrep API is running",
        "version": "1.0.0",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "TechPrep",
    }
