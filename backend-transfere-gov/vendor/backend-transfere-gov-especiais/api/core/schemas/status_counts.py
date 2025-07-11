from pydantic import BaseModel

class StatusCount(BaseModel):
    """
    Model for status counts of action plans.
    """
    situacao: str
    count: int