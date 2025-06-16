from pydantic import BaseModel
from .plano_acao import PlanoAcaoBase, PlanoAcaoDetailed

class BasePage(BaseModel):
    """
    Model for paginated responses.
    """
    total: int
    skip: int
    limit: int
    data: list[BaseModel]

class PlanoBasePage(BasePage):
    """
    Model for paginated response of action plans.
    """
    data: list[PlanoAcaoBase]

class PlanoDetailedPage(BasePage):
    """
    Model for paginated response of detailed action plans.
    """
    data: list[PlanoAcaoDetailed]
    