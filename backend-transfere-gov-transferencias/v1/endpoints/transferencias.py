from fastapi import APIRouter, Depends, HTTPException
from fastapi_pagination import Page, add_pagination, paginate

from core.dao import dao

from core.parsers import (PropostasVoluntarias, ProponenteEspecifico, 
                          EmendasParlamentares)
from core.schemas.basic import Transferencia

app = APIRouter()

voluntarias = PropostasVoluntarias(dao)
especificas = ProponenteEspecifico(dao)
emendas = EmendasParlamentares(dao)

@app.get("/voluntarias", response_model=Page[Transferencia], tags=['transferencias'])
def get_voluntarias():

    dados = voluntarias()
    return paginate(dados)

@app.get("/especificas", response_model=Page[Transferencia], tags=['transferencias'])
def get_especificas():

    dados = especificas()
    return paginate(dados)


@app.get("/emendas", response_model=Page[Transferencia], tags=['transferencias'])
def get_emendas():

    dados = emendas()
    return paginate(dados)


app = add_pagination(app)