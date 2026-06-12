from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from google import genai
from google.genai import types
import os
import json
import re

router = APIRouter()


class WeakTag(BaseModel):
    tag: str
    accuracy: float
    attempted: int


class StudyPlanRequest(BaseModel):
    cf_rating:          Optional[int]   = None
    cf_rank:            Optional[str]   = None
    cf_max_rating:      Optional[int]   = None
    lc_rating:          Optional[float] = None
    lc_top_percentage:  Optional[float] = None
    lc_problems_solved: Optional[int]   = None
    cc_rating:          Optional[int]   = None
    cc_stars:           Optional[str]   = None
    cp_score:           Optional[int]   = None
    weak_tags_cf:       List[WeakTag]   = []
    weak_tags_lc:       List[str]       = []
    difficulty_breakdown: Optional[dict] = None
    contests_count:     Optional[int]   = None
    streak:             Optional[int]   = None


@router.post("/study-plan")
async def generate_study_plan(req: StudyPlanRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    client = genai.Client(api_key=api_key)
    prompt = _build_prompt(req)

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()
        # strip markdown code fences if present
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        plan = json.loads(text)
        return plan
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _build_prompt(req: StudyPlanRequest) -> str:
    # detect which platforms are active
    active = []
    if req.cf_rating:  active.append("Codeforces")
    if req.lc_rating:  active.append("LeetCode")
    if req.cc_rating:  active.append("CodeChef")
    platforms_str = " + ".join(active) if active else "competitive programming"

    parts = [
        f"You are an expert competitive programming coach. This programmer uses: {platforms_str}.\n"
        f"Generate a personalized 4-week study plan that covers ALL platforms they use, not just Codeforces.\n"
        f"If they only use LeetCode, focus on LeetCode. If they use multiple platforms, split the plan accordingly.\n"
    ]

    parts.append("## Programmer Stats")
    if req.cp_score:       parts.append(f"- Unified CP Score: {req.cp_score}/3000")
    if req.cf_rating:      parts.append(f"- Codeforces: {req.cf_rating} ({req.cf_rank}), max {req.cf_max_rating}")
    if req.lc_rating:      parts.append(f"- LeetCode Contest Rating: {round(req.lc_rating)} (Top {req.lc_top_percentage:.1f}%), {req.lc_problems_solved} problems solved")
    if req.cc_rating:      parts.append(f"- CodeChef: {req.cc_rating} {req.cc_stars}")
    if req.streak:         parts.append(f"- Current solving streak: {req.streak} days")
    if req.contests_count: parts.append(f"- Total contests participated: {req.contests_count}")

    if req.weak_tags_cf:
        parts.append("\n## Weak Topics (Codeforces — low accuracy)")
        for t in req.weak_tags_cf[:6]:
            parts.append(f"- {t.tag}: {round(t.accuracy*100)}% accuracy ({t.attempted} attempts)")

    if req.weak_tags_lc:
        parts.append("\n## Least Practiced Topics (LeetCode)")
        parts.append(", ".join(req.weak_tags_lc[:6]))

    if req.difficulty_breakdown:
        parts.append("\n## Difficulty Accuracy (Codeforces)")
        for bucket, stats in req.difficulty_breakdown.items():
            if bucket == "unrated" or not stats.get("attempted"): continue
            acc = round(stats["solved"] / stats["attempted"] * 100)
            parts.append(f"- {bucket}: {acc}% ({stats['solved']}/{stats['attempted']})")

    # build platform-aware difficulty guidance
    difficulty_note = []
    if req.cf_rating:  difficulty_note.append(f"Codeforces difficulty range appropriate for {req.cf_rating} rating")
    if req.lc_rating:  difficulty_note.append(f"LeetCode difficulty appropriate for {round(req.lc_rating)} contest rating")
    if req.cc_rating:  difficulty_note.append(f"CodeChef difficulty appropriate for {req.cc_rating} rating")

    # build platform-aware target guidance
    target_note = []
    if req.cf_rating:  target_note.append(f"realistic Codeforces rating in 3 months")
    if req.lc_rating:  target_note.append(f"realistic LeetCode contest rating in 3 months")
    if req.cc_rating:  target_note.append(f"realistic CodeChef rating in 3 months")
    target_desc = " and ".join(target_note) if target_note else "realistic rating targets in 3 months"

    parts.append(f"""
## Instructions
Generate a focused 4-week study plan covering {platforms_str}.
- Each week should specify WHICH platform(s) to focus on for that week's problems.
- The difficulty field should reflect the appropriate level for THEIR rating on that platform.
- Do NOT default to Codeforces if they primarily use LeetCode or CodeChef.
- Return ONLY valid JSON, no markdown, no explanation outside the JSON.

{{
  "summary": "2-3 sentence honest assessment covering all their active platforms and biggest cross-platform growth opportunity",
  "weeks": [
    {{
      "week": 1,
      "focus": "Topic name",
      "goal": "Specific measurable goal mentioning which platform(s) to practice on",
      "daily_problems": 3,
      "topics": ["subtopic1", "subtopic2", "subtopic3"],
      "cf_difficulty": "Difficulty range or label appropriate for their level on the relevant platform (e.g. '1200-1500 on CF', 'Medium on LC', 'Div 2 on CC')",
      "tip": "One concrete actionable tip specific to their weakness on their primary platform"
    }}
  ],
  "quick_wins": [
    "Specific action they can take TODAY on one of their platforms",
    "Another quick win on any of their platforms",
    "Another quick win"
  ],
  "biggest_gap": "The single most important thing holding them back, referencing the specific platform where this gap is most visible",
  "target_rating": "{target_desc}"
}}""")

    return "\n".join(parts)
