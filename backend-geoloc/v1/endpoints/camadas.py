from fastapi import APIRouter, Query, HTTPException

from typing import List

from core.dao import listar_camadas, detalhar_camada
from core.dao import lat_long_geosampa, nomes_camadas
from core.schemas.point import PointResponse, PointSearch
from core.schemas.camadas import CamadaBasico, DetalhesCamada, CamadaParam

from core.exceptions import OutofBounds



app = APIRouter()

def check_camada_exists(layer_name:str)->None:

    if layer_name not in nomes_camadas:
        raise HTTPException(status_code=404, detail=f"Camada {layer_name.replace('geoportal:', '')} não encontrada")

@app.get('/camadas_geosampa', tags=['geosampa'])
async def list_camadas()->List[CamadaBasico]:
    '''Lista as camadas disponíveis para integração com o GeoSampa.'''

    camadas = listar_camadas()

    return camadas

@app.get('/camadas_geosampa/{layer_name}', tags=['geosampa'])
async def detalhes_camada(layer_name:str)->DetalhesCamada:
    '''Apresenta o schema (propriedades e tipos de dado) da camada selecionada,
    além de identificar o tipo de geometria e qual o nome do atributo que contém a geometria.'''

    return detalhar_camada(layer_name)

@app.post('/integracao_geosampa/', tags=['geosampa'])
async def integracao_geosampa_point(search_point:PointSearch)->PointResponse:
    
    x = search_point.point.x
    y = search_point.point.y
    camadas = search_point.camadas
    if camadas:
        camadas_geosampa = {}
        for camada in camadas:
            check_camada_exists(camada.layer_name)
            camadas_geosampa[camada.alias] = camada
    try:
        return lat_long_geosampa(x, y, **camadas_geosampa)
    except OutofBounds as e:
        raise HTTPException(status_code=400, detail=str(e))


