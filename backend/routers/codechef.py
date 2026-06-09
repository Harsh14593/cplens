from fastapi import APIRouter, HTTPException
import httpx
from bs4 import BeautifulSoup
import re
import json

router = APIRouter()

CC_BASE = "https://www.codechef.com"
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}


@router.get("/user/{username}")
async def get_user(username: str):
    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        r = await client.get(f"{CC_BASE}/users/{username}", headers=HEADERS)
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")
    soup = BeautifulSoup(r.text, "html.parser")
    return _parse_profile(soup, username)


@router.get("/analyze/{username}")
async def analyze(username: str):
    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        r = await client.get(f"{CC_BASE}/users/{username}", headers=HEADERS)
    if r.status_code == 404:
        raise HTTPException(status_code=404, detail="User not found")

    soup = BeautifulSoup(r.text, "html.parser")
    profile = _parse_profile(soup, username)
    rating_history = _parse_rating_history(r.text)

    insights = []
    if profile.get("stars"):
        insights.append(f"You are a {profile['stars']} on CodeChef — keep solving to reach the next star")
    if profile.get("global_rank"):
        insights.append(f"Your global rank is {profile['global_rank']} — top percentile performance")

    return {**profile, "rating_history": rating_history, "insights": insights}


def _parse_profile(soup, username: str) -> dict:
    result = {"username": username}

    rating_el = soup.select_one(".rating-number")
    if rating_el:
        result["rating"] = int(rating_el.text.strip())

    stars_el = soup.select_one(".rating-star")
    if stars_el:
        result["stars"] = stars_el.text.strip()

    rank_els = soup.select(".rating-ranks strong")
    if len(rank_els) >= 1:
        result["global_rank"] = rank_els[0].text.strip()
    if len(rank_els) >= 2:
        result["country_rank"] = rank_els[1].text.strip()

    for el in soup.select("section h3, .problems-solved h5, .rating-data-section h5"):
        match = re.search(r"(\d+)\s*(?:problems?|question)", el.text, re.IGNORECASE)
        if match:
            result["problems_solved"] = int(match.group(1))
            break

    if "problems_solved" not in result:
        match = re.search(r"(\d+)\s*(?:fully\s+)?solved", soup.get_text(), re.IGNORECASE)
        if match:
            result["problems_solved"] = int(match.group(1))

    # contests participated
    contest_els = soup.select(".contest-participated-count b")
    if contest_els:
        try:
            result["contests_participated"] = int(contest_els[0].text.strip())
        except ValueError:
            pass

    return result


def _parse_rating_history(html: str) -> list:
    # CodeChef embeds rating history as a JS variable in the page
    match = re.search(r"var\s+all_rating\s*=\s*(\[.*?\]);", html, re.DOTALL)
    if not match:
        # try alternate pattern
        match = re.search(r'"all_rating"\s*:\s*(\[.*?\])', html, re.DOTALL)
    if not match:
        return []

    try:
        data = json.loads(match.group(1))
        return [
            {
                "contest": d.get("name", ""),
                "rating": int(d.get("rating", 0)),
                "rank": int(d.get("rank", 0)),
                "date": f"{d.get('getyear','')}-{d.get('getmonth','').zfill(2)}-{d.get('getday','').zfill(2)}",
            }
            for d in data if d.get("rating")
        ]
    except Exception:
        return []
