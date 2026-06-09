from collections import defaultdict


def analyze_codeforces(submissions: list, contests: list) -> dict:
    tag_stats = defaultdict(lambda: {"solved": 0, "attempted": 0})
    time_buckets = defaultdict(lambda: {"solved": 0, "attempted": 0})
    rating_buckets = defaultdict(lambda: {"solved": 0, "attempted": 0})
    verdict_counts = defaultdict(int)

    for sub in submissions:
        verdict = sub.get("verdict", "")
        problem = sub.get("problem", {})
        tags = problem.get("tags", [])
        rating = problem.get("rating", 0)

        verdict_counts[verdict] += 1

        bucket = _rating_bucket(rating)
        time_bucket = _time_bucket(sub.get("relativeTimeSeconds", 0))

        for tag in tags:
            tag_stats[tag]["attempted"] += 1
            if verdict == "OK":
                tag_stats[tag]["solved"] += 1

        rating_buckets[bucket]["attempted"] += 1
        time_buckets[time_bucket]["attempted"] += 1
        if verdict == "OK":
            rating_buckets[bucket]["solved"] += 1
            time_buckets[time_bucket]["solved"] += 1

    weak_tags = _find_weak_tags(tag_stats)
    rating_trend = _rating_trend(contests)

    return {
        "tag_analysis": dict(tag_stats),
        "weak_tags": weak_tags,
        "difficulty_breakdown": dict(rating_buckets),
        "time_pressure_analysis": dict(time_buckets),
        "verdict_summary": dict(verdict_counts),
        "rating_trend": rating_trend,
        "insights": _generate_insights(weak_tags, time_buckets, rating_buckets),
    }


def analyze_leetcode(user: dict) -> dict:
    tag_data = user.get("tagProblemCounts", {})
    all_tags = (
        tag_data.get("advanced", [])
        + tag_data.get("intermediate", [])
        + tag_data.get("fundamental", [])
    )

    sorted_tags = sorted(all_tags, key=lambda x: x["problemsSolved"])
    weak_tags = [t["tagName"] for t in sorted_tags[:5] if t["problemsSolved"] < 5]

    ac_stats = user.get("submitStats", {}).get("acSubmissionNum", [])

    return {
        "weak_tags": weak_tags,
        "acceptance_by_difficulty": ac_stats,
        "insights": [f"You've solved very few '{t}' problems — focus here" for t in weak_tags],
    }


def _rating_bucket(rating: int) -> str:
    if rating == 0:
        return "unrated"
    elif rating < 1200:
        return "800-1199"
    elif rating < 1600:
        return "1200-1599"
    elif rating < 2000:
        return "1600-1999"
    else:
        return "2000+"


def _time_bucket(seconds: int) -> str:
    minutes = seconds // 60
    if minutes < 30:
        return "0-30min"
    elif minutes < 60:
        return "30-60min"
    elif minutes < 90:
        return "60-90min"
    else:
        return "90min+"


def _find_weak_tags(tag_stats: dict) -> list:
    weak = []
    for tag, stats in tag_stats.items():
        attempted = stats["attempted"]
        solved = stats["solved"]
        if attempted >= 3:
            accuracy = solved / attempted
            if accuracy < 0.4:
                weak.append({"tag": tag, "accuracy": round(accuracy, 2), "attempted": attempted})
    return sorted(weak, key=lambda x: x["accuracy"])[:8]


def _rating_trend(contests: list) -> list:
    return [
        {
            "contest": c.get("contestName"),
            "rating": c.get("newRating"),
            "change": c.get("newRating", 0) - c.get("oldRating", 0),
        }
        for c in contests[-20:]
    ]


def _generate_insights(weak_tags, time_buckets, rating_buckets) -> list:
    insights = []

    if weak_tags:
        top_weak = weak_tags[0]["tag"]
        insights.append(f"Your weakest topic is '{top_weak}' — prioritize it this week")

    late_bucket = time_buckets.get("90min+", {})
    if late_bucket.get("attempted", 0) > 5:
        acc = late_bucket["solved"] / late_bucket["attempted"]
        if acc < 0.3:
            insights.append("You struggle significantly in the last 30 mins of contests — practice timed mock contests")

    hard_bucket = rating_buckets.get("1600-1999", {})
    if hard_bucket.get("attempted", 0) > 0:
        acc = hard_bucket["solved"] / hard_bucket["attempted"]
        if acc < 0.2:
            insights.append("Your accuracy on 1600-1999 rated problems is low — spend more time on Div2 C/D problems")

    return insights
