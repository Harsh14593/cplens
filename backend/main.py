from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import codeforces, leetcode, codechef, recommendations, ai

app = FastAPI(title="CPLens API")

import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(codeforces.router, prefix="/api/codeforces", tags=["Codeforces"])
app.include_router(leetcode.router, prefix="/api/leetcode", tags=["LeetCode"])
app.include_router(codechef.router, prefix="/api/codechef", tags=["CodeChef"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])

@app.get("/")
def root():
    return {"status": "CPLens API running"}
