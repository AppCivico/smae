from fastapi import APIRouter

from core.dao import dao

from core.parsers import UltimaAtualiz
from core.schemas.basic import DataAtualizacao

app = APIRouter()

ultima = UltimaAtualiz(dao)

@app.get("/ultima_atualizacao", response_model=DataAtualizacao, tags=['atualizacao'])
def get_atualiz():

    dados = ultima()
    return dados