from fastapi import APIRouter, Query
from fastapi.responses import Response
import httpx
import asyncio
import time

router = APIRouter()

# simple in-memory cache: key -> (svg_string, timestamp)
_cache: dict = {}
CACHE_TTL = 3600  # 1 hour

CF_API  = "https://codeforces.com/api"
LC_API  = "https://leetcode.com/graphql"
CC_API  = "https://codechef-api.vercel.app/handle"

TIERS = [
    (2600, "Grandmaster", "#ef4444"),
    (2200, "Master",      "#ff8c00"),
    (1800, "Expert",      "#a855f7"),
    (1400, "Competitor",  "#3b82f6"),
    (900,  "Apprentice",  "#22c55e"),
    (0,    "Beginner",    "#64748b"),
]

CF_RANK_COLORS = {
    "legendary grandmaster": "#ef4444",
    "international grandmaster": "#ef4444",
    "grandmaster": "#ef4444",
    "international master": "#ff8c00",
    "master": "#ff8c00",
    "candidate master": "#a855f7",
    "expert": "#3b82f6",
    "specialist": "#22c55e",
    "pupil": "#22c55e",
    "newbie": "#64748b",
}


def _cp_score(cf_rating, lc_rating, lc_solved, cc_rating):
    cf_norm = min(cf_rating / 3500, 1.0) * 3000 * 0.40 if cf_rating else 0
    lc_r    = min((lc_rating or 0) / 3500, 1.0) * 3000 * 0.25
    lc_s    = min((lc_solved or 0) / 1000, 1.0) * 3000 * 0.15
    cc_norm = min((cc_rating or 0) / 3500, 1.0) * 3000 * 0.20 if cc_rating else 0
    return round(cf_norm + lc_r + lc_s + cc_norm)


def _tier(score):
    for threshold, name, color in TIERS:
        if score >= threshold:
            return name, color
    return "Beginner", "#64748b"


def _cf_rank_color(rank: str) -> str:
    return CF_RANK_COLORS.get((rank or "").lower(), "#64748b")


def _esc(s: str) -> str:
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _build_svg(cf_handle, cf_rating, cf_rank, cf_max,
               lc_username, lc_rating, lc_solved,
               cc_username, cc_rating, cc_stars,
               cp_score, tier_name, tier_color):

    # platform row helper
    def platform_row(y, label, label_color, val1, val1_color, val2, val2_color=""):
        v2 = f'<text x="440" y="{y}" font-size="12" fill="{val2_color or "#64748b"}" text-anchor="end">{_esc(val2)}</text>' if val2 else ""
        return (
            f'<rect x="20" y="{y-13}" width="6" height="16" rx="2" fill="{label_color}"/>'
            f'<text x="34" y="{y}" font-size="12" fill="#94a3b8">{_esc(label)}</text>'
            f'<text x="160" y="{y}" font-size="13" font-weight="600" fill="{val1_color}">{_esc(val1)}</text>'
            f'{v2}'
        )

    cf_disp  = f"{cf_rating}" if cf_rating else "—"
    cf_color = _cf_rank_color(cf_rank)
    cf_sub   = cf_rank.title() if cf_rank else ""

    lc_disp  = f"{round(lc_rating)}" if lc_rating else "—"
    lc_sub   = f"{lc_solved} solved" if lc_solved else ""

    cc_disp  = f"{cc_rating}" if cc_rating else "—"
    cc_sub   = cc_stars if cc_stars else ""

    # progress arc (semi-circle) — score / 3000
    pct    = min(cp_score / 3000, 1.0)
    radius = 38
    cx, cy = 390, 105
    import math
    angle  = pct * 180  # 0-180 degrees across top
    rad    = math.radians(180 - angle)
    end_x  = cx + radius * math.cos(rad)
    end_y  = cy - radius * math.sin(rad)
    large  = 1 if pct > 0.5 else 0
    arc_path = f"M {cx-radius} {cy} A {radius} {radius} 0 {large} 1 {end_x:.1f} {end_y:.1f}"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="480" height="210" viewBox="0 0 480 210">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#161b22"/>
    </linearGradient>
    <linearGradient id="arc_grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{tier_color}" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="{tier_color}"/>
    </linearGradient>
    <clipPath id="card_clip">
      <rect width="480" height="210" rx="12"/>
    </clipPath>
  </defs>

  <!-- background -->
  <rect width="480" height="210" rx="12" fill="url(#bg)" clip-path="url(#card_clip)"/>
  <rect width="480" height="210" rx="12" fill="none" stroke="{tier_color}" stroke-width="1.5" stroke-opacity="0.35"/>

  <!-- top accent bar -->
  <rect width="480" height="3" rx="0" fill="{tier_color}" opacity="0.7"/>

  <!-- branding -->
  <text x="20" y="28" font-family="monospace" font-size="13" font-weight="700" fill="{tier_color}" letter-spacing="2">CP</text>
  <text x="40" y="28" font-family="monospace" font-size="13" font-weight="700" fill="#e2e8f0" letter-spacing="2">LENS</text>
  <text x="80" y="28" font-size="11" fill="#475569">/ {_esc(cf_handle)}</text>

  <!-- divider -->
  <line x1="20" y1="36" x2="460" y2="36" stroke="#21262d" stroke-width="1"/>

  <!-- platform rows -->
  {platform_row(62,  "Codeforces", "#3b82f6", cf_disp,  cf_color,  cf_sub,  "#64748b")}
  {platform_row(92,  "LeetCode",   "#f59e0b", lc_disp,  "#f59e0b", lc_sub,  "#64748b")}
  {platform_row(122, "CodeChef",   "#a855f7", cc_disp,  "#a855f7", cc_sub,  "#64748b")}

  <!-- divider -->
  <line x1="20" y1="140" x2="460" y2="140" stroke="#21262d" stroke-width="1"/>

  <!-- footer -->
  <text x="20" y="162" font-size="11" fill="#475569">cplens.vercel.app</text>
  <text x="20" y="180" font-size="10" fill="#30363d">Updated automatically via API</text>

  <!-- CP Score arc (right side) -->
  <!-- track -->
  <path d="M {cx-radius} {cy} A {radius} {radius} 0 1 1 {cx+radius} {cy}" fill="none" stroke="#21262d" stroke-width="6" stroke-linecap="round"/>
  <!-- filled -->
  <path d="{arc_path}" fill="none" stroke="url(#arc_grad)" stroke-width="6" stroke-linecap="round"/>
  <!-- score text -->
  <text x="{cx}" y="{cy-6}" font-size="22" font-weight="800" fill="{tier_color}" text-anchor="middle">{cp_score}</text>
  <text x="{cx}" y="{cy+12}" font-size="10" fill="#64748b" text-anchor="middle">/ 3000</text>
  <text x="{cx}" y="{cy+28}" font-size="11" font-weight="600" fill="{tier_color}" text-anchor="middle">{_esc(tier_name)}</text>
</svg>"""
    return svg


async def _fetch_cf(handle: str):
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(f"{CF_API}/user.info?handles={handle}")
            d = r.json()
            if d["status"] != "OK":
                return None, None, None
            u = d["result"][0]
            return u.get("rating"), u.get("rank"), u.get("maxRating")
    except Exception:
        return None, None, None


async def _fetch_lc(username: str):
    if not username:
        return None, None
    query = """
    query($u:String!){
      matchedUser(username:$u){
        profile{ranking}
        submitStats{acSubmissionNum{difficulty count}}
        contestBadge{name}
      }
      userContestRanking(username:$u){rating}
    }"""
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.post(LC_API, json={"query": query, "variables": {"u": username}},
                                  headers={"Content-Type": "application/json"})
            d = r.json().get("data", {})
            rating  = (d.get("userContestRanking") or {}).get("rating")
            ac      = (d.get("matchedUser") or {}).get("submitStats", {}).get("acSubmissionNum", [])
            solved  = next((x["count"] for x in ac if x["difficulty"] == "All"), None)
            return rating, solved
    except Exception:
        return None, None


async def _fetch_cc(username: str):
    if not username:
        return None, None
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.get(f"{CC_API}/{username}")
            d = r.json()
            if not d.get("success"):
                return None, None
            return d.get("currentRating"), d.get("stars")
    except Exception:
        return None, None


@router.get("/{cf_handle}", response_class=Response)
async def get_card(
    cf_handle: str,
    lc: str = Query(default=""),
    cc: str = Query(default=""),
):
    cache_key = f"{cf_handle}:{lc}:{cc}"
    now = time.time()
    if cache_key in _cache:
        svg, ts = _cache[cache_key]
        if now - ts < CACHE_TTL:
            return Response(content=svg, media_type="image/svg+xml",
                            headers={"Cache-Control": f"public, max-age={CACHE_TTL}"})

    cf_rating, cf_rank, cf_max, lc_rating, lc_solved, cc_rating, cc_stars = (
        None, None, None, None, None, None, None
    )

    cf_res, lc_res, cc_res = await asyncio.gather(
        _fetch_cf(cf_handle),
        _fetch_lc(lc),
        _fetch_cc(cc),
    )
    cf_rating, cf_rank, cf_max = cf_res
    lc_rating, lc_solved       = lc_res
    cc_rating, cc_stars        = cc_res

    cp_score               = _cp_score(cf_rating, lc_rating, lc_solved, cc_rating)
    tier_name, tier_color  = _tier(cp_score)

    svg = _build_svg(
        cf_handle, cf_rating, cf_rank, cf_max,
        lc, lc_rating, lc_solved,
        cc, cc_rating, cc_stars,
        cp_score, tier_name, tier_color,
    )

    _cache[cache_key] = (svg, now)
    return Response(content=svg, media_type="image/svg+xml",
                    headers={"Cache-Control": f"public, max-age={CACHE_TTL}"})
