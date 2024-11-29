import time
from .camadas_search import ListCamadas
from config import NAMES_CAMADAS_TTL_SECONDS
from typing import List

class NamesCamadas:

    def __init__(self, ttl=NAMES_CAMADAS_TTL_SECONDS):

        self.ttl = float(ttl)
        self.listar_camadas = ListCamadas()
        self.set_camada_names()

    def gen_set_camadas(self, list_camadas:list)->set:

        return {camada['layer_name'] for camada in list_camadas}
    
    def set_camada_names(self)->None:

        self.camada_names = self.gen_set_camadas(self.listar_camadas())
        self.last_update:float = time.time()
    
    def ttl_check(self):

        now = time.time()
        print(self.ttl)
        if (now - self.last_update) > self.ttl:
            return False
        return True
    
    def check_camada_name_ttl(self, camada_name:str)->bool:

        if self.ttl_check():
            return camada_name in self.camada_names
        else:
            self.set_camada_names()
            return camada_name in self.camada_names


    def __contains__(self, camada_name:str):

        return self.check_camada_name_ttl(camada_name)

    @property
    def camadas(self)->List[str]:

        return list(self.camada_names)