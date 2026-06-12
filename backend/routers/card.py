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
    import math

    F  = "font-family=\"'Segoe UI',system-ui,-apple-system,sans-serif\""
    FM = "font-family=\"'Courier New',monospace\""

    cf_disp  = f"{cf_rating}" if cf_rating else "—"
    cf_color = _cf_rank_color(cf_rank)
    cf_sub   = cf_rank.title() if cf_rank else "Unrated"

    lc_disp  = f"{round(lc_rating)}" if lc_rating else "—"
    lc_sub   = f"{lc_solved} solved" if lc_solved else "—"

    cc_disp  = f"{cc_rating}" if cc_rating else "—"
    cc_sub   = cc_stars if cc_stars else "—"

    # CP Score progress bar
    W      = 455   # card inner width (20..475)
    bar_w  = 300
    bar_x  = 20
    bar_y  = 128
    bar_h  = 10
    filled = round(bar_w * min(cp_score / 3000, 1.0))

    # stat column — everything centered on cx
    def stat_col(cx, platform, p_color, value, val_color, sub):
        sub_el = (f'<text x="{cx}" y="108" {F} font-size="10" fill="#4b5563"'
                  f' text-anchor="middle">{_esc(sub)}</text>') if sub and sub != "—" else ""
        return (
            # colored platform label
            f'<text x="{cx}" y="57" {F} font-size="11" font-weight="500"'
            f' fill="{p_color}" text-anchor="middle" letter-spacing="0.3">{_esc(platform)}</text>'
            # big value
            f'<text x="{cx}" y="91" {F} font-size="24" font-weight="800"'
            f' fill="{val_color}" text-anchor="middle">{_esc(value)}</text>'
            # sub label (only if real data)
            f'{sub_el}'
        )

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="495" height="185" viewBox="0 0 495 185">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="185" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#161b22"/>
    </linearGradient>
    <linearGradient id="bar" x1="{bar_x}" y1="0" x2="{bar_x+bar_w}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="{tier_color}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="{tier_color}"/>
    </linearGradient>
    <clipPath id="clip"><rect width="495" height="185" rx="12"/></clipPath>
    <clipPath id="bar_clip"><rect x="{bar_x}" y="{bar_y}" width="{filled}" height="{bar_h}" rx="{bar_h//2}"/></clipPath>
  </defs>

  <rect width="495" height="185" rx="12" fill="url(#bg)" clip-path="url(#clip)"/>
  <rect width="495" height="185" rx="12" fill="none" stroke="{tier_color}" stroke-width="1" stroke-opacity="0.2"/>
  <rect width="495" height="3" fill="{tier_color}" clip-path="url(#clip)"/>

  <!-- HEADER -->
  <text x="20" y="27" {FM} font-size="14" font-weight="700">
    <tspan fill="{tier_color}">CP</tspan><tspan fill="#e2e8f0">LENS</tspan>
  </text>
  <text x="72" y="27" {F} font-size="12" fill="#4b5563">/ {_esc(cf_handle)}</text>
  <!-- tier badge top-right -->
  <rect x="385" y="14" width="90" height="18" rx="9" fill="{tier_color}" opacity="0.15"/>
  <text x="430" y="26" {F} font-size="10" font-weight="600" fill="{tier_color}" text-anchor="middle" letter-spacing="0.5">{_esc(tier_name.upper())}</text>

  <line x1="20" y1="35" x2="475" y2="35" stroke="#21262d" stroke-width="1"/>

  <!-- STAT COLUMNS -->
  {stat_col(96,  "Codeforces", "#3b82f6", cf_disp, cf_color,  cf_sub)}
  <line x1="183" y1="42" x2="183" y2="118" stroke="#2d3748" stroke-width="1"/>
  {stat_col(248, "LeetCode",   "#f59e0b", lc_disp, "#f59e0b", lc_sub)}
  <line x1="335" y1="42" x2="335" y2="118" stroke="#2d3748" stroke-width="1"/>
  {stat_col(400, "CodeChef",   "#a855f7", cc_disp, "#a855f7", cc_sub)}

  <line x1="20" y1="118" x2="475" y2="118" stroke="#21262d" stroke-width="1"/>

  <!-- CP SCORE BAR -->
  <text x="20" y="{bar_y+8}" {F} font-size="10" fill="#4b5563" dominant-baseline="middle">CP SCORE</text>
  <!-- bar track -->
  <rect x="{bar_x+80}" y="{bar_y}" width="{bar_w-80}" height="{bar_h}" rx="{bar_h//2}" fill="#1f2937"/>
  <!-- bar fill -->
  <rect x="{bar_x+80}" y="{bar_y}" width="{max(0, filled-80)}" height="{bar_h}" rx="{bar_h//2}" fill="url(#bar)"/>
  <!-- score text -->
  <text x="385" y="{bar_y+8}" {F} font-size="13" font-weight="700" fill="{tier_color}" dominant-baseline="middle" text-anchor="start">{cp_score} <tspan fill="#4b5563" font-weight="400">/ 3000</tspan></text>

  <!-- FOOTER -->
  <line x1="20" y1="168" x2="475" y2="168" stroke="#1f2937" stroke-width="1"/>
  <text x="20"  y="180" {F} font-size="10" fill="#30363d">cplens.vercel.app</text>
  <text x="475" y="180" {F} font-size="10" fill="#30363d" text-anchor="end">Auto-updated · 1h cache</text>
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
