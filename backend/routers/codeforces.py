from fastapi import APIRouter, HTTPException
import httpx
import asyncio
import cache

router = APIRouter()

CF_API = "https://codeforces.com/api"

@router.get("/user/{handle}")
async def get_user(handle: str):
    key = f"cf:user:{handle}"
    if (hit := cache.get(key)) is not None:
        return hit
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{CF_API}/user.info?handles={handle}")
        data = r.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=404, detail="User not found")
    result = data["result"][0]
    cache.set(key, result, ttl=300)
    return result

@router.get("/contests/{handle}")
async def get_contest_history(handle: str):
    key = f"cf:contests:{handle}"
    if (hit := cache.get(key)) is not None:
        return hit
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{CF_API}/user.rating?handle={handle}")
        data = r.json()
    if data["status"] != "OK":
        raise HTTPException(status_code=404, detail="Could not fetch contest history")
    cache.set(key, data["result"], ttl=300)
    return data["result"]

@router.get("/analyze/{handle}")
async def analyze(handle: str):
    key = f"cf:analyze:{handle}"
    if (hit := cache.get(key)) is not None:
        return hit
    async with httpx.AsyncClient(timeout=20) as client:
        sub_r, rating_r = await asyncio.gather(
            client.get(f"{CF_API}/user.status?handle={handle}&count=5000"),
            client.get(f"{CF_API}/user.rating?handle={handle}"),
        )
    submissions = sub_r.json().get("result", [])
    contests    = rating_r.json().get("result", [])
    from analysis.engine import analyze_codeforces
    result = analyze_codeforces(submissions, contests)
    cache.set(key, result, ttl=300)
    return result
