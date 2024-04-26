from pydantic import BaseModel, model_validator
from typing import List, Dict, Optional
from core.utils.geo import within_sao_paulo_bbox
from .geojson import GeoJson
from .camadas import CamadaParam

class Point(BaseModel):

    x: float
    y: float


class PointSearch(BaseModel):

    point: Point
    camadas: List[CamadaParam]

class PointResponse(BaseModel):

    point: GeoJson
    camadas_geosampa: Dict[str, GeoJson]