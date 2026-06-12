from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import google.generativeai as genai
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

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = _build_prompt(req)

    try:
        response = model.generate_content(prompt)
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
    parts = ["You are an expert competitive programming coach. Analyze this programmer's stats and generate a personalized 4-week study plan.\n"]

    parts.append("## Programmer Stats")
    if req.cp_score:       parts.append(f"- Unified CP Score: {req.cp_score}/3000")
    if req.cf_rating:      parts.append(f"- Codeforces: {req.cf_rating} ({req.cf_rank}), max {req.cf_max_rating}")
    if req.lc_rating:      parts.append(f"- LeetCode Contest: {round(req.lc_rating)} (Top {req.lc_top_percentage:.1f}%), {req.lc_problems_solved} problems solved")
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

    parts.append("""
## Instructions
Generate a focused 4-week study plan. Return ONLY valid JSON, no markdown, no explanation outside the JSON.

{
  "summary": "2-3 sentence honest assessment of where this programmer stands and their biggest growth opportunity",
  "weeks": [
    {
      "week": 1,
      "focus": "Topic name",
      "goal": "Specific measurable goal for this week",
      "daily_problems": 3,
      "topics": ["subtopic1", "subtopic2", "subtopic3"],
      "cf_difficulty": "800-1200",
      "tip": "One concrete actionable tip specific to their weakness"
    }
  ],
  "quick_wins": [
    "Specific action they can take TODAY that will have immediate impact",
    "Another quick win",
    "Another quick win"
  ],
  "biggest_gap": "The single most important thing holding them back from the next rating tier",
  "target_rating": "Realistic Codeforces rating target in 3 months if they follow this plan"
}""")

    return "\n".join(parts)
