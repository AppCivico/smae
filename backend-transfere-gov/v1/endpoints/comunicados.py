from fastapi import APIRouter

from core import dao
import core.schemas.comunicados as schemas

app = APIRouter()

@app.get('/gerais', response_model=schemas.Page, tags=['comunicados'])
def get_gerais():

    data = dao.gerais()

    return data

@app.get('/individuais', response_model=schemas.Page, tags=['comunicados'])
def get_individuais():

    data = dao.individuais()

    return data

@app.get('/especiais', response_model=schemas.Page, tags=['comunicados'])
def get_especiais():

    data = dao.especiais()

    return data

@app.get('/bancada', response_model=schemas.Page, tags=['comunicados'])
def get_bancada():

    data = dao.bancada()

    return data