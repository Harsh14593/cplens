from fastapi import APIRouter
import httpx
import asyncio
from datetime import datetime, timezone

router = APIRouter()

CF_API = "https://codeforces.com/api"
LC_API = "https://leetcode.com/graphql"
CC_API = "https://www.codechef.com/api/list/contests/all"


async def _fetch_cf_contests():
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(f"{CF_API}/contest.list?gym=false")
            data = r.json()
        if data["status"] != "OK":
            return []
        now = datetime.now(timezone.utc).timestamp()
        upcoming = [c for c in data["result"] if c.get("phase") == "BEFORE"]
        result = []
        for c in upcoming[:10]:
            start = c.get("startTimeSeconds")
            if not start:
                continue
            result.append({
                "id":       str(c["id"]),
                "name":     c["name"],
                "platform": "Codeforces",
                "color":    "#3b82f6",
                "startTime": start,
                "duration": c.get("durationSeconds", 0),
                "url":      f"https://codeforces.com/contests/{c['id']}",
            })
        return sorted(result, key=lambda x: x["startTime"])
    except Exception:
        return []


async def _fetch_lc_contests():
    query = """{ upcomingContests { title titleSlug startTime duration } }"""
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.post(
                LC_API,
                json={"query": query},
                headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"},
            )
            contests = r.json().get("data", {}).get("upcomingContests", [])
        result = []
        for c in contests:
            result.append({
                "id":        c["titleSlug"],
                "name":      c["title"],
                "platform":  "LeetCode",
                "color":     "#f59e0b",
                "startTime": c["startTime"],
                "duration":  c["duration"],
                "url":       f"https://leetcode.com/contest/{c['titleSlug']}",
            })
        return result
    except Exception:
        return []


async def _fetch_cc_contests():
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(CC_API, headers={"User-Agent": "Mozilla/5.0"})
            data = r.json()
        result = []
        for c in data.get("future_contests", []):
            try:
                start_dt = datetime.strptime(c["contest_start_date"], "%d %b %Y %H:%M:%S")
                start_dt = start_dt.replace(tzinfo=timezone.utc)
                end_dt   = datetime.strptime(c["contest_end_date"],   "%d %b %Y %H:%M:%S")
                end_dt   = end_dt.replace(tzinfo=timezone.utc)
                duration = int((end_dt - start_dt).total_seconds())
                result.append({
                    "id":        c["contest_code"],
                    "name":      c["contest_name"],
                    "platform":  "CodeChef",
                    "color":     "#22c55e",
                    "startTime": int(start_dt.timestamp()),
                    "duration":  duration,
                    "url":       f"https://www.codechef.com/{c['contest_code']}",
                })
            except Exception:
                continue
        return result
    except Exception:
        return []


@router.get("/upcoming")
async def get_upcoming_contests():
    cf, lc, cc = await asyncio.gather(
        _fetch_cf_contests(), _fetch_lc_contests(), _fetch_cc_contests()
    )
    all_contests = cf + lc + cc
    all_contests.sort(key=lambda x: x["startTime"])
    return all_contests
