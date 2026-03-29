from backend.services import gap_service

COURSE_MAP = {
    "python": "https://www.coursera.org/learn/python",
    "sql": "https://www.udemy.com/topic/sql/",
    "cloud": "https://www.coursera.org/professional-certificates/aws-cloud-solutions-architect",
}


def _resource_for_skill(skill: str) -> str:
    key = skill.lower()
    for token, url in COURSE_MAP.items():
        if token in key:
            return url
    return "https://www.coursera.org"


def recommendation_for_gap(skill: str, gap_percent: float) -> dict:
    if gap_percent > 70:
        action = "hire"
    elif gap_percent >= 30:
        action = "train"
    else:
        action = "none"
    return {
        "skill": skill,
        "gap_percent": gap_percent,
        "action": action,
        "resource": _resource_for_skill(skill),
        "priority": min(10, max(1, int(round(gap_percent / 10)))),
    }


def org_recommendations(db):
    report = gap_service.org_gap_analysis(db)
    return [recommendation_for_gap(item["skill"], item["gap_percent"]) for item in report["items"]]
