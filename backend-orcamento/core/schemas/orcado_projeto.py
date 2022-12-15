from typing import List
from pydantic import BaseModel

from .metadados import MetaDados


class RetornoOrcado(BaseModel):

    val_orcado_inicial: float
    val_orcado_atualizado: float
    saldo_disponivel: float


class OrcadoProjeto(BaseModel):

    metadados: MetaDados
    data: List[RetornoOrcado]