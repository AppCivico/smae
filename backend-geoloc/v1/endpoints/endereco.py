from fastapi import APIRouter, Query, HTTPException

from typing import List
from core.exceptions import AtributeNotFound
from core.dao import buscar_endereco, buscar_endereco_simples, nomes_camadas
from core.schemas.address import AdressSearch, AdressSearchParameters, GeoJsonEndereco



app = APIRouter()

def check_camada_exists(layer_name:str)->None:

    if layer_name not in nomes_camadas:
        raise HTTPException(status_code=404, detail=f"Camada {layer_name.replace('geoportal:', '')} não encontrada")

@app.post('/geolocalizar_endereco', tags=['geolocalizacao'])
async def geolocalizar_endereco(search_endereco:AdressSearchParameters)->List[AdressSearch]:
    '''Realiza a busca do endereço (geolocalização). Permite a integração com o GeoSampa por meio do parâmetro 'camadas_geosampa'.
    Para cada uma das camadas selecionadas, a ferramenta irá identificar o(s) objeto(s) da camada que intersectam o ponto que representa o 
    endereço, conforme retornado pela geolocalização'''

    endereco = search_endereco.endereco
    camadas = search_endereco.camadas
    convert = search_endereco.convert_to_wgs_84

    if camadas:
        camadas_geosampa = {}
        for camada in camadas:
            check_camada_exists(camada.layer_name)
            camadas_geosampa[camada.alias] = camada.layer_name
    else:
        camadas_geosampa={}
    try:
        data = buscar_endereco(endereco, convert, **camadas_geosampa)
    except AtributeNotFound as e:
        raise HTTPException(status_code=500, detail=str(e))

    return data

@app.get('/geolocalizar_endereco_simples/{endereco}', tags=['geolocalizacao'])
async def geolocalizar_endereco_simples(endereco:str)->GeoJsonEndereco:
    '''Realiza a geolicalização do endereço apenas, sem integração com o GeoSampa.'''

    endereco = buscar_endereco_simples(endereco)

    return endereco