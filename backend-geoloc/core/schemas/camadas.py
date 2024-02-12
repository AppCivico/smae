from pydantic import BaseModel, validator
from typing import List, Optional, Union
from config import GEOM_TYPES


class CamadaBasico(BaseModel):

    layer_name: str
    title: str
    abstract: Optional[str]=None
    crs: str

    @validator('crs')
    def validate_crs_epsg(cls, value):
        
        value = str(value)
        if not value.lower().startswith('epsg'):
            raise RuntimeError(f'CRS inseperado: {str(value)}')
        
        return value
    
    @validator('layer_name')
    def remove_geoportal(cls, value):

        value = str(value)
        if value.startswith('geoportal:'):
            value = value.replace(r'geoportal:', '')
        
        return value
    
class PropertyCamada(BaseModel):

    name: str
    nillable: bool
    type: str
    is_geom: bool
    
class DetalhesCamada(BaseModel):

    layer_name: str
    properties: List[PropertyCamada]
    geom_col: str
    geom_type: str

    @validator('geom_type')
    def validate_type(cls, value):

        if value not in GEOM_TYPES:
            raise RuntimeError(f'Tipo de geometria inesperada: {str(value)}')
        return value
