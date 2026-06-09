from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

CF_API = "https://codeforces.com/api"


@router.get("/{handle}")
async def get_recommendations(handle: str):
    async with httpx.AsyncClient() as client:
        user_r, sub_r = await _fetch_parallel(client, handle)

    user_data = user_r.json()
    sub_data = sub_r.json()

    if user_data["status"] != "OK":
        raise HTTPException(status_code=404, detail="User not found")

    user_rating = user_data["result"][0].get("rating", 1200)
    submissions = sub_data.get("result", [])

    solved_ids = {
        f"{s['problem']['contestId']}-{s['problem']['index']}"
        for s in submissions if s.get("verdict") == "OK"
    }

    from analysis.engine import analyze_codeforces
    analysis = analyze_codeforces(submissions, [])
    weak_tags = [w["tag"] for w in analysis.get("weak_tags", [])[:5]]

    if not weak_tags:
        return {"recommendations": [], "message": "No weak tags found — keep practicing!"}

    target_min = max(800, user_rating - 200)
    target_max = user_rating + 300

    async with httpx.AsyncClient() as client:
        problems = await _fetch_problems_by_tags(client, weak_tags, target_min, target_max, solved_ids)

    return {"recommendations": problems, "weak_tags": weak_tags}


async def _fetch_parallel(client, handle):
    import asyncio
    return await asyncio.gather(
        client.get(f"{CF_API}/user.info?handles={handle}"),
        client.get(f"{CF_API}/user.status?handle={handle}&count=500"),
    )


async def _fetch_problems_by_tags(client, weak_tags, min_rating, max_rating, solved_ids):
    recommendations = []

    for tag in weak_tags[:4]:
        r = await client.get(f"{CF_API}/problemset.problems?tags={tag}")
        data = r.json()
        if data["status"] != "OK":
            continue

        problems = data["result"]["problems"]
        stats = {p["contestId"] * 100 + ord(p["index"][0]): s
                 for p, s in zip(data["result"]["problems"], data["result"]["problemStatistics"])}

        filtered = [
            p for p in problems
            if p.get("rating", 0) >= min_rating
            and p.get("rating", 0) <= max_rating
            and f"{p.get('contestId')}-{p.get('index')}" not in solved_ids
            and p.get("contestId")
        ]

        filtered.sort(key=lambda p: p.get("rating", 0))

        for p in filtered[:2]:
            recommendations.append({
                "tag": tag,
                "name": p["name"],
                "rating": p.get("rating"),
                "contestId": p["contestId"],
                "index": p["index"],
                "url": f"https://codeforces.com/problemset/problem/{p['contestId']}/{p['index']}",
            })

    return recommendations
