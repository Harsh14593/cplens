from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

CF_API = "https://codeforces.com/api"
LC_GRAPHQL = "https://leetcode.com/graphql"
LC_HEADERS = {"Content-Type": "application/json", "Referer": "https://leetcode.com"}

LC_TAG_SLUG_MAP = {
    "dynamic programming": "dynamic-programming",
    "arrays": "array",
    "array": "array",
    "hash table": "hash-table",
    "math": "math",
    "string": "string",
    "strings": "string",
    "greedy": "greedy",
    "depth-first search": "depth-first-search",
    "breadth-first search": "breadth-first-search",
    "binary search": "binary-search",
    "tree": "tree",
    "graph": "graph",
    "sorting": "sorting",
    "two pointers": "two-pointers",
    "linked list": "linked-list",
    "recursion": "recursion",
    "stack": "stack",
    "queue": "queue",
    "heap": "heap-priority-queue",
    "bit manipulation": "bit-manipulation",
    "backtracking": "backtracking",
    "sliding window": "sliding-window",
    "divide and conquer": "divide-and-conquer",
    "union find": "union-find",
    "trie": "trie",
    "segment tree": "segment-tree",
}


@router.get("/codeforces/{handle}")
async def get_cf_recommendations(handle: str):
    async with httpx.AsyncClient() as client:
        user_r, sub_r = await _cf_fetch_parallel(client, handle)

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
        return {"recommendations": [], "message": "No weak tags found"}

    target_min = max(800, user_rating - 200)
    target_max = user_rating + 300

    async with httpx.AsyncClient() as client:
        problems = await _fetch_cf_problems(client, weak_tags, target_min, target_max, solved_ids)

    return {"recommendations": problems, "weak_tags": weak_tags, "platform": "codeforces"}


@router.get("/leetcode/{username}")
async def get_lc_recommendations(username: str):
    profile_query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            tagProblemCounts {
                advanced { tagName problemsSolved }
                intermediate { tagName problemsSolved }
                fundamental { tagName problemsSolved }
            }
        }
    }
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(LC_GRAPHQL, json={"query": profile_query, "variables": {"username": username}}, headers=LC_HEADERS)
    user = r.json().get("data", {}).get("matchedUser")
    if not user:
        raise HTTPException(status_code=404, detail="LC user not found")

    tag_data = user.get("tagProblemCounts", {})
    all_tags = tag_data.get("advanced", []) + tag_data.get("intermediate", []) + tag_data.get("fundamental", [])
    weak_tags = [t["tagName"] for t in sorted(all_tags, key=lambda x: x["problemsSolved"]) if t["problemsSolved"] < 10][:5]

    if not weak_tags:
        return {"recommendations": [], "message": "No weak tags found", "platform": "leetcode"}

    problems = []
    async with httpx.AsyncClient(timeout=15) as client:
        for tag in weak_tags[:4]:
            slug = LC_TAG_SLUG_MAP.get(tag.lower(), tag.lower().replace(" ", "-"))
            fetched = await _fetch_lc_problems(client, slug, tag)
            problems.extend(fetched[:2])

    return {"recommendations": problems, "weak_tags": weak_tags, "platform": "leetcode"}


@router.get("/codechef/{username}")
async def get_cc_recommendations(username: str):
    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        r = await client.get(f"https://www.codechef.com/users/{username}", headers={"User-Agent": "Mozilla/5.0"})

    from bs4 import BeautifulSoup
    import re
    soup = BeautifulSoup(r.text, "html.parser")

    rating = 1500
    rating_el = soup.select_one(".rating-number")
    if rating_el:
        rating = int(rating_el.text.strip())

    difficulty = "school" if rating < 1400 else "easy" if rating < 1600 else "medium" if rating < 1800 else "hard"

    topics = [
        {"tag": "Data Structures", "url": f"https://www.codechef.com/practice/data-structures"},
        {"tag": "Algorithms", "url": f"https://www.codechef.com/practice/algorithms"},
        {"tag": "Dynamic Programming", "url": f"https://www.codechef.com/practice/dynamic-programming"},
        {"tag": "Mathematics", "url": f"https://www.codechef.com/practice/mathematics"},
    ]

    recommendations = [
        {
            "tag": t["tag"],
            "name": f"Practice {t['tag']} ({difficulty} level)",
            "url": t["url"],
            "rating": rating,
            "platform": "codechef",
        }
        for t in topics
    ]

    return {"recommendations": recommendations, "platform": "codechef", "difficulty": difficulty}


# keep old endpoint for backwards compat
@router.get("/{handle}")
async def get_recommendations(handle: str):
    return await get_cf_recommendations(handle)


async def _cf_fetch_parallel(client, handle):
    import asyncio
    return await asyncio.gather(
        client.get(f"{CF_API}/user.info?handles={handle}"),
        client.get(f"{CF_API}/user.status?handle={handle}&count=500"),
    )


async def _fetch_cf_problems(client, weak_tags, min_rating, max_rating, solved_ids):
    recommendations = []
    for tag in weak_tags[:4]:
        r = await client.get(f"{CF_API}/problemset.problems?tags={tag}")
        data = r.json()
        if data["status"] != "OK":
            continue
        problems = data["result"]["problems"]
        filtered = [
            p for p in problems
            if min_rating <= p.get("rating", 0) <= max_rating
            and f"{p.get('contestId')}-{p.get('index')}" not in solved_ids
            and p.get("contestId")
        ]
        filtered.sort(key=lambda p: p.get("rating", 0))
        for p in filtered[:2]:
            recommendations.append({
                "tag": tag,
                "name": p["name"],
                "rating": p.get("rating"),
                "url": f"https://codeforces.com/problemset/problem/{p['contestId']}/{p['index']}",
                "platform": "codeforces",
            })
    return recommendations


async def _fetch_lc_problems(client, tag_slug, display_tag):
    query = """
    query problemsetQuestionList($filters: QuestionListFilterInput, $limit: Int) {
        problemsetQuestionList: questionList(
            categorySlug: ""
            limit: $limit
            skip: 0
            filters: $filters
        ) {
            questions: data {
                title titleSlug difficulty acRate
                topicTags { name }
            }
        }
    }
    """
    try:
        r = await client.post(
            LC_GRAPHQL,
            json={"query": query, "variables": {"filters": {"tags": [tag_slug]}, "limit": 10}},
            headers=LC_HEADERS,
        )
        questions = r.json().get("data", {}).get("problemsetQuestionList", {}).get("questions", [])
        return [
            {
                "tag": display_tag,
                "name": q["title"],
                "difficulty": q["difficulty"],
                "url": f"https://leetcode.com/problems/{q['titleSlug']}/",
                "platform": "leetcode",
                "rating": {"Easy": "Easy", "Medium": "Medium", "Hard": "Hard"}.get(q["difficulty"], "Medium"),
            }
            for q in questions[:2]
        ]
    except Exception:
        return []
