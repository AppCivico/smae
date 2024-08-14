
from fastapi import APIRouter, Depends, HTTPException

from fastapi_pagination import Page, add_pagination, paginate

from typing import List

import core.dao.basic as dao
import core.schemas.basic as schemas
from core.parsers.basic import parser_unidade, parse_tipo_doc

app = APIRouter()

@app.get("/unidades", response_model=Page[schemas.Unidade], tags=['categorias'])
def get_unidades():

    unidades = dao.lst_unidades()
    unidades_parsed = [parser_unidade(unidade) for unidade in unidades]
    return paginate(unidades_parsed)

@app.get("/processos/tipos", response_model=Page[schemas.TipoProcesso], tags=['categorias', 'processo'])
def get_tipos_processo():

    tipos = dao.lst_tipos_processo()
    return paginate(tipos)

@app.get("/documentos/tipos", response_model=Page[schemas.TipoDocumento], tags=['categorias', 'documento'])
def get_tipos_doc():

    tipos = dao.lst_tipos_documento()

    tipos_parsed = [parse_tipo_doc(tipo) for tipo in tipos]

    return paginate(tipos_parsed)

app = add_pagination(app)


