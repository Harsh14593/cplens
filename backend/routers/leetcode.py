from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

LC_GRAPHQL = "https://leetcode.com/graphql"
LC_HEADERS = {"Content-Type": "application/json", "Referer": "https://leetcode.com"}


async def lc_query(client, query, variables):
    r = await client.post(LC_GRAPHQL, json={"query": query, "variables": variables}, headers=LC_HEADERS)
    return r.json().get("data", {})


@router.get("/user/{username}")
async def get_user(username: str):
    query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submitStats { acSubmissionNum { difficulty count submissions } }
            profile { ranking starRating }
            tagProblemCounts {
                advanced { tagName problemsSolved }
                intermediate { tagName problemsSolved }
                fundamental { tagName problemsSolved }
            }
        }
    }
    """
    async with httpx.AsyncClient(timeout=15) as client:
        data = await lc_query(client, query, {"username": username})
    user = data.get("matchedUser")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/contest/{username}")
async def get_contest_history(username: str):
    query = """
    query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
            attendedContestsCount
            rating
            globalRanking
            totalParticipants
            topPercentage
            badge { name }
        }
        userContestRankingHistory(username: $username) {
            attended
            rating
            ranking
            problemsSolved
            totalProblems
            contest { title startTime }
        }
    }
    """
    async with httpx.AsyncClient(timeout=15) as client:
        data = await lc_query(client, query, {"username": username})
    return {
        "ranking": data.get("userContestRanking"),
        "history": [h for h in (data.get("userContestRankingHistory") or []) if h.get("attended")][-20:],
    }


@router.get("/analyze/{username}")
async def analyze(username: str):
    profile_query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submissionCalendar
            submitStats { acSubmissionNum { difficulty count submissions } }
            profile { ranking starRating }
            tagProblemCounts {
                advanced { tagName problemsSolved }
                intermediate { tagName problemsSolved }
                fundamental { tagName problemsSolved }
            }
        }
        recentAcSubmissionList(username: $username, limit: 10) {
            title titleSlug
        }
    }
    """
    contest_query = """
    query userContestRankingInfo($username: String!) {
        userContestRanking(username: $username) {
            attendedContestsCount rating globalRanking totalParticipants topPercentage
            badge { name }
        }
        userContestRankingHistory(username: $username) {
            attended rating ranking problemsSolved totalProblems
            contest { title startTime }
        }
    }
    """
    async with httpx.AsyncClient(timeout=15) as client:
        profile_data, contest_data = await _fetch_parallel(client, profile_query, contest_query, username)

    user = profile_data.get("matchedUser")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    recent = profile_data.get("recentAcSubmissionList", [])
    contest_ranking = contest_data.get("userContestRanking")
    contest_history = [h for h in (contest_data.get("userContestRankingHistory") or []) if h.get("attended")]

    from analysis.engine import analyze_leetcode
    import json
    from datetime import datetime, timezone

    analysis = analyze_leetcode(user)

    # parse submissionCalendar: JSON string of {unix_ts_str: count}
    lc_activity = {}
    raw_calendar = user.get("submissionCalendar")
    if raw_calendar:
        try:
            cal = json.loads(raw_calendar)
            for ts_str, count in cal.items():
                dt = datetime.fromtimestamp(int(ts_str), tz=timezone.utc)
                lc_activity[dt.strftime("%Y-%m-%d")] = int(count)
        except Exception:
            pass

    # full tag counts for skill map
    tag_data = user.get("tagProblemCounts", {})
    tag_counts = (
        tag_data.get("advanced", []) +
        tag_data.get("intermediate", []) +
        tag_data.get("fundamental", [])
    )

    return {
        **analysis,
        "profile": {
            "ranking": user.get("profile", {}).get("ranking"),
            "ac_stats": user.get("submitStats", {}).get("acSubmissionNum", []),
        },
        "contest_ranking": contest_ranking,
        "contest_history": contest_history[-20:],
        "recent_solved": [r["title"] for r in recent],
        "activity": lc_activity,
        "tag_counts": tag_counts,
    }


async def _fetch_parallel(client, q1, q2, username):
    import asyncio
    results = await asyncio.gather(
        client.post(LC_GRAPHQL, json={"query": q1, "variables": {"username": username}}, headers=LC_HEADERS),
        client.post(LC_GRAPHQL, json={"query": q2, "variables": {"username": username}}, headers=LC_HEADERS),
    )
    return results[0].json().get("data", {}), results[1].json().get("data", {})
