from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

# CodeChef public profile scraping (no official API for free tier)
CC_BASE = "https://www.codechef.com"

@router.get("/user/{username}")
async def get_user(username: str):
    async with httpx.AsyncClient(follow_redirects=True) as client:
        r = await client.get(
            f"{CC_BASE}/users/{username}",
            headers={"User-Agent": "Mozilla/5.0"},
        )
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")
    return {"username": username, "status": "profile fetched", "note": "Full parsing coming soon"}
