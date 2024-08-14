from fastapi import APIRouter, Depends, HTTPException

from fastapi_pagination import Page, add_pagination, paginate

from typing import List

import core.dao.documentos as dao
import core.schemas.documentos as schemas
import core.schemas.basic as basic_schemas
from core.parsers.documentos import (parse_link_documento, parse_resumo_documento,
                                    parse_relatorio_documento)

app = APIRouter()

@app.get("/link/", response_model=basic_schemas.Link, tags=['documento'])
def get_link_doc(num_doc:str):

    dados_doc = dao.get_resumo_documento(num_doc)
    
    return parse_link_documento(dados_doc)



@app.get('/resumo', response_model=schemas.ResumoDocumento, tags=['documento'])
def get_resumo_doc(num_doc:str):

    dados_doc = dao.get_resumo_documento(num_doc)
    
    return parse_resumo_documento(dados_doc)


@app.get('/relatorio', response_model=schemas.RelatorioDocumento, tags=['documento'])
def get_resumo_doc(num_doc:str):

    dados_doc = dao.get_relatorio_documento(num_doc)
    
    return parse_relatorio_documento(dados_doc)


app = add_pagination(app)
