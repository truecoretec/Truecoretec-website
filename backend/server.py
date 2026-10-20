import logging
import os

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from core import client, ensure_indexes, seed_content
from auth import auth_router, seed_admin
from public_api import public_router
from admin_api import admin_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("truecore")

app = FastAPI(title="TrueCore Technologies API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_router)
app.include_router(auth_router)
app.include_router(admin_router)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    errors = [{"field": ".".join(str(p) for p in e["loc"][1:]), "message": e["msg"]} for e in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": "Please correct the highlighted fields.",
                                                  "errors": errors})


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})


@app.on_event("startup")
async def startup():
    await ensure_indexes()
    await seed_admin()
    await seed_content()
    logger.info("TrueCore API ready")


@app.on_event("shutdown")
async def shutdown():
    client.close()
