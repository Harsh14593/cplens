from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import codeforces, leetcode, codechef

app = FastAPI(title="CPLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(codeforces.router, prefix="/api/codeforces", tags=["Codeforces"])
app.include_router(leetcode.router, prefix="/api/leetcode", tags=["LeetCode"])
app.include_router(codechef.router, prefix="/api/codechef", tags=["CodeChef"])

@app.get("/")
def root():
    return {"status": "CPLens API running"}
