from pydantic import BaseModel, validator
from typing import List, Optional, Union
from config import GEOM_TYPES

class Geometry(BaseModel):

    type: str
    coordinates: Union[List[float], List[List[float]], List[List[List[float]]]]

    @validator('type')
    def validate_type(cls, value):

        if value not in GEOM_TYPES:
            raise RuntimeError(f'Tipo de geometria inesperada: {str(value)}')
        return value

class Feature(BaseModel):

    type: str='Feature'
    #override properties on inherited class to specify them
    properties: dict
    geometry: Geometry
    bbox: Optional[List[float]]=None
    geometry_name: Optional[str]=None


    @validator('type')
    def type_as_title(cls, value):

        value = str(value)

        return value.title()

class CRSProperty(BaseModel):

    name : str
    
    @validator('name')
    def validate_crs_epsg(cls, value):
        
        value = str(value)
        if not value.lower().startswith('epsg'):
            raise RuntimeError(f'CRS inseperado: {str(value)}')
        
        return value

class CRS(BaseModel):

    type: str='name'
    properties: CRSProperty


class GeoJson(BaseModel):

    type: str='FeatureCollection'
    features: List[Feature]
    crs: CRS
    