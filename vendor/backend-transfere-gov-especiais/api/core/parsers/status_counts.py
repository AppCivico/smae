from core.schemas.status_counts import StatusCount
from typing import List


def parse_status_counts(status_counts: dict) -> List[StatusCount]:
    """
    Parse a list of status counts into a list of StatusCount Pydantic models.
    
    Args:
        status_counts (List[dict]): List of dictionaries containing status counts.
        
    Returns:
        List[StatusCount]: List of StatusCount Pydantic models.
    """
    parsed = []
    for key, value in status_counts.items():
        parsed.append(StatusCount(situacao=key, count=value))
    return parsed