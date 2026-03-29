def get_action_from_gap(gap_score: float) -> str:
    if gap_score > 70:
        return "hire"
    if gap_score >= 30:
        return "upskill"
    return "none"


RESOURCE_MAP = {
    "python": [
        {"title": "Python for Everybody", "url": "https://www.coursera.org/specializations/python"},
        {"title": "Python Bootcamp", "url": "https://www.udemy.com/course/complete-python-bootcamp/"},
    ],
    "docker": [
        {"title": "Docker Essentials", "url": "https://www.coursera.org/learn/docker-for-developers"},
        {"title": "Docker Mastery", "url": "https://www.udemy.com/course/docker-mastery/"},
    ],
}


def employee_recommendations(gap_rows: list[dict]):
    cards = []
    for row in gap_rows:
        action = get_action_from_gap(row["gap_percent"])
        cards.append(
            {
                "skill": row["skill_name"],
                "severity": row["risk_level"],
                "action": action,
                "resources": RESOURCE_MAP.get(row["skill_name"].lower(), []),
                "priority": min(10, max(1, int(round(row["gap_percent"] / 10)))),
            }
        )
    return cards
