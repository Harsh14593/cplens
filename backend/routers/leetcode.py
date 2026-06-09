from fastapi import APIRouter, HTTPException
import httpx

router = APIRouter()

LC_GRAPHQL = "https://leetcode.com/graphql"

@router.get("/user/{username}")
async def get_user(username: str):
    query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submitStats {
                acSubmissionNum { difficulty count }
            }
            profile { ranking }
            tagProblemCounts {
                advanced { tagName problemsSolved }
                intermediate { tagName problemsSolved }
                fundamental { tagName problemsSolved }
            }
        }
    }
    """
    async with httpx.AsyncClient() as client:
        r = await client.post(
            LC_GRAPHQL,
            json={"query": query, "variables": {"username": username}},
            headers={"Content-Type": "application/json"},
        )
    data = r.json()
    user = data.get("data", {}).get("matchedUser")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/analyze/{username}")
async def analyze(username: str):
    query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            submitStats {
                acSubmissionNum { difficulty count }
            }
            tagProblemCounts {
                advanced { tagName problemsSolved }
                intermediate { tagName problemsSolved }
                fundamental { tagName problemsSolved }
            }
        }
    }
    """
    async with httpx.AsyncClient() as client:
        r = await client.post(
            LC_GRAPHQL,
            json={"query": query, "variables": {"username": username}},
            headers={"Content-Type": "application/json"},
        )
    user = r.json().get("data", {}).get("matchedUser")
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from analysis.engine import analyze_leetcode
    return analyze_leetcode(user)
