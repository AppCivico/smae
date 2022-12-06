from functools import partial
from .abstract_client import Client


class SofClient:

    host = 'gatewayapi.prodam.sp.gov.br:443'
    base_path = '/financas/orcamento/sof/'
    version = 'v3.0.1'

    def __init__(self, auth_token:str)->None:

        self.base_url = self.__build_base_url()
        self.auth_token = auth_token

        self.get = self.__authorize_get()

    def __build_base_url(self):

        return f'https://{self.host}{self.base_path}{self.version}/'

    def __build_headers(self):

        return {"Authorization" : f"Bearer {self.auth_token}",
                "Accept": "application/json"}

    def __authorize_get(self):

        client = Client(self.base_url)
        headers = self.__build_headers()
        get = partial(client.get, headers=headers)

        return get



