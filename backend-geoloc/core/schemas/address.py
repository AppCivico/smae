from pydantic import BaseModel, validator, field_validator
from typing import List, Dict, Optional

from core.utils.misc import check_cep
from .geojson import GeoJson, Feature
from .camadas import CamadaParam

class EnderecoProperties(BaseModel):

    rua: Optional[str]=None
    numero: Optional[str]=None
    cidade: str
    bairro: Optional[str]=None
    estado: str
    pais: str
    codigo_pais: str
    string_endereco: str
    cep: Optional[str]=None
    osm_type: str

class Endereco(Feature):

    properties: EnderecoProperties

class GeoJsonEndereco(GeoJson):

    features: List[Endereco]

class AdressSearch(BaseModel):

    endereco: GeoJsonEndereco
    camadas_geosampa: Dict[str, GeoJson]


class AdressSearchParameters(BaseModel):

    endereco: str
    camadas: Optional[List[CamadaParam]]=None
    convert_to_wgs_84: Optional[bool]=True

class CepSearchParameters(BaseModel):

    cep: str
    camadas: Optional[List[CamadaParam]]=None
    convert_to_wgs_84: Optional[bool]=True

    @field_validator('cep')
    def check_cep(cls, value):

        value = str(value)
        check_cep(value)

        return value

    