from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

CF_API = "https://codeforces.com/api"

@router.get("/user/{handle}")
async def get_user(handle: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{CF_API}/user.info?handles={handle}")
        data = r.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=404, detail="User not found")
    return data["result"][0]

@router.get("/submissions/{handle}")
async def get_submissions(handle: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{CF_API}/user.status?handle={handle}&count=500")
        data = r.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=404, detail="Could not fetch submissions")
    return data["result"]

@router.get("/contests/{handle}")
async def get_contest_history(handle: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{CF_API}/user.rating?handle={handle}")
        data = r.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=404, detail="Could not fetch contest history")
    return data["result"]

@router.get("/analyze/{handle}")
async def analyze(handle: str):
    async with httpx.AsyncClient() as client:
        sub_r = await client.get(f"{CF_API}/user.status?handle={handle}&count=10000")
        rating_r = await client.get(f"{CF_API}/user.rating?handle={handle}")

    submissions = sub_r.json().get("result", [])
    contests = rating_r.json().get("result", [])

    from analysis.engine import analyze_codeforces
    return analyze_codeforces(submissions, contests)
