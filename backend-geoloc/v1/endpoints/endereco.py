from fastapi import APIRouter, Query, HTTPException

from typing import List
from core.exceptions import AtributeNotFound, OutofBounds
from core.dao import buscar_endereco, buscar_endereco_simples, buscar_cep, nomes_camadas, gelocalizacao_reversa
from core.schemas.address import AdressSearch, AdressSearchParameters, CepSearchParameters, GeoJsonEndereco
from core.utils.misc import check_camada_exists


app = APIRouter()


@app.post('/geolocalizar_endereco', tags=['geolocalizacao'])
async def geolocalizar_endereco(search_endereco:AdressSearchParameters)->List[AdressSearch]:
    '''Realiza a busca do endereço (geolocalização). Permite a integração com o GeoSampa por meio do parâmetro 'camadas_geosampa'.
    Para cada uma das camadas selecionadas, a ferramenta irá identificar o(s) objeto(s) da camada que intersectam o ponto que representa o 
    endereço, conforme retornado pela geolocalização. Caso selecione a opção convert_to_wgs_84, o resultado da integração com o GeoSampa 
    será reprojetado, e as coordenadas serão reorientadas para long, lat.'''

    endereco = search_endereco.endereco
    camadas = search_endereco.camadas
    convert = search_endereco.convert_to_wgs_84

    if camadas:
        camadas_geosampa = {}
        for camada in camadas:
            check_camada_exists(camada.layer_name, nomes_camadas)
            camadas_geosampa[camada.alias] = camada
    else:
        camadas_geosampa={}
    try:
        data = buscar_endereco(endereco, convert, **camadas_geosampa)
    except AtributeNotFound as e:
        raise HTTPException(status_code=500, detail=str(e))

    return data

@app.post('/geolocalizar_cep', tags=['geolocalizacao'])
async def geolocalizar_endereco(search_cep:CepSearchParameters)->List[AdressSearch]:
    '''Realiza a busca do CEP (geolocalização). Permite a integração com o GeoSampa por meio do parâmetro 'camadas_geosampa'.
    Para cada uma das camadas selecionadas, a ferramenta irá identificar o(s) objeto(s) da camada que intersectam o ponto que representa o 
    endereço, conforme retornado pela geolocalização. Caso selecione a opção convert_to_wgs_84, o resultado da integração com o GeoSampa 
    será reprojetado, e as coordenadas serão reorientadas para long, lat.'''

    cep = search_cep.cep
    camadas = search_cep.camadas
    convert = search_cep.convert_to_wgs_84

    if camadas:
        camadas_geosampa = {}
        for camada in camadas:
            check_camada_exists(camada.layer_name, nomes_camadas)
            camadas_geosampa[camada.alias] = camada
    else:
        camadas_geosampa={}
    try:
        data = buscar_cep(cep, convert, **camadas_geosampa)
    except AtributeNotFound as e:
        raise HTTPException(status_code=500, detail=str(e))

    return data

@app.get('/geolocalizar_endereco_simples/{endereco}', tags=['geolocalizacao'])
async def geolocalizar_endereco_simples(endereco:str)->GeoJsonEndereco:
    '''Realiza a geolicalização do endereço apenas, sem integração com o GeoSampa.'''

    try:
        endereco = buscar_endereco_simples(endereco)
    except AtributeNotFound as e:
        raise HTTPException(status_code=500, detail=str(e))
    return endereco

@app.get('/geolocalizacao_reversa/{x},{y}', tags=['geolocalizacao', 'reversa'])
async def gelocalizar_endereco_por_x_y(x:float, y:float)->GeoJsonEndereco:
    '''Realiza a geolocalização reversa de coordenadas WGS84 no formato long (x) e lat (y)'''

    try:
        endereco  = gelocalizacao_reversa(x, y)
    except OutofBounds as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AtributeNotFound as e:
        raise HTTPException(status_code=500, detail=str(e))
    return endereco