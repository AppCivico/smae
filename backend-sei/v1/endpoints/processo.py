from fastapi import APIRouter, Depends, HTTPException

from fastapi_pagination import Page, add_pagination, paginate

from typing import List

import core.dao.processos as dao
import core.schemas.processos as schemas
import core.schemas.basic as basic_schemas
from core.parsers.processos import parse_resumo_processo, parse_relatorio_processo

app = APIRouter()

@app.get("/link/", response_model=basic_schemas.Link, tags=['processo'])
def get_link_processo(num_processo:str):

    link_processo = dao.get_link_processo(num_processo)
    return {'link' : link_processo}


@app.get('/resumo', response_model = schemas.ResumoProcesso, tags=['processo'])
def get_resumo_processo(num_processo:str):

    dados_processo = dao.get_resumo_processo(num_processo)
    resumo = parse_resumo_processo(dados_processo)
    return resumo


@app.get('/relatorio', response_model=schemas.RelatorioProcesso, tags=['processo'])
def get_relatorio_processo(num_processo:str):

    dados_processo = dao.get_relatorio_processo(num_processo)
    relatorio = parse_relatorio_processo(dados_processo)

    return relatorio



app = add_pagination(app)
