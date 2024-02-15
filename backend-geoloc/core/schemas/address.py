from pydantic import BaseModel, validator
from typing import List, Dict, Optional

from .geojson import GeoJson, Feature

class EnderecoProperties(BaseModel):

    rua: str
    numero: Optional[str]=None
    cidade: str
    estado: str
    pais: str
    codigo_pais: str
    string_endereco: str
    osm_type: str

class Endereco(Feature):

    properties: EnderecoProperties

class GeoJsonEndereco(GeoJson):

    features: List[Endereco]

class AdressSearch(BaseModel):

    endereco: GeoJson
    camadas_geosampa: Dict[str, GeoJson]

class CamadaParam(BaseModel):

    alias: str
    layer_name: str

    @validator('layer_name')
    def validar_layer_name(cls, value)->str:

        value = str(value)
        if not value.startswith('geoportal:'):
            value = f'geoportal:{value}'
        
        return value

class AdressSearchParameters(BaseModel):

    endereco: str
    camadas: Optional[List[CamadaParam]]=None
    convert_to_wgs_84: Optional[bool]=True

    