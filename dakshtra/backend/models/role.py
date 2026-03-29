import enum


class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    HR_MANAGER = "HR_MANAGER"
    TEAM_LEAD = "TEAM_LEAD"
    EMPLOYEE = "EMPLOYEE"
