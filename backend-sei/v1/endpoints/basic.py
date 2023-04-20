
from fastapi import APIRouter, Depends, HTTPException

from fastapi_pagination import Page, add_pagination, paginate

from typing import List

import core.dao.basic as dao
import core.schemas.basic as schemas


app = APIRouter()

@app.get("/unidades", response_model=Page[schemas.Unidade], tags=['parametros_do_processo'])
def get_unidades():

    unidades = dao.lst_unidades()
    return paginate(unidades)

@app.get("/processo/tipos", response_model=Page[schemas.TipoProcesso], tags=['parametros_do_processo'])
def get_tipos_processo():

    tipos = dao.lst_tipos_processo()
    return paginate(tipos)

@app.get("/documento/tipos", response_model=Page[schemas.TipoDocumento], tags=['parametros_do_processo'])
def get_tipos_doc():

    tipos = dao.lst_tipos_documento()
    return paginate(tipos)

app = add_pagination(app)

@app.get("/documento/hipoteses_legais_acesso_restrito", response_model=Page[schemas.HipoteseLegal], tags=['parametros_do_processo'])
def get_tipos_doc():

    hipoteses = dao.lst_hipoteses_legais_acesso_restrito()
    return paginate(hipoteses)

app = add_pagination(app)


