from typing import List, Optional
from pydantic import BaseModel, validator

from .metadados import MetaDados

class ItemBasico(BaseModel):

    codigo: str
    descricao: str

    @validator('codigo', pre=True, always=True)
    def valid_codigo(cls, v):

        return str(v)

class ItemUnidade(BaseModel):

    codigo: str
    descricao: str
    cod_orgao: str

    @validator('cod_orgao', pre=True, always=True)
    def valid_codigo(cls, v):

        return str(v)



class ResultItem(BaseModel):

    data: List[ItemBasico]
    metadados: MetaDados


class AllItems(BaseModel):

    metadados: MetaDados
    orgaos: List[ItemBasico]
    unidades: List[ItemUnidade]
    funcoes: List[ItemBasico]
    subfuncoes: List[ItemBasico]
    programas: List[ItemBasico]
    projetos_atividades: List[ItemBasico]
    categorias: List[ItemBasico]
    grupos: List[ItemBasico]
    modalidades: List[ItemBasico]
    elementos: List[ItemBasico]
    fonte_recursos: List[ItemBasico]