from functools import partial
from .abstract_client import Client
import json


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
                "Accept": "application/json",
                "User-Agent": "smae, version 0.1"}

    def __authorize_get(self):

        client = Client(self.base_url)
        headers = self.__build_headers()
        get = partial(client.get, headers=headers)

        def debug_get(*args, **kwargs):
            print(f"Request made with headers: {headers}")
            print(f"URL: {self.base_url}")
            response = get(*args, **kwargs)
            size = len(json.dumps(response))  # Get the size of response (serialized)
            print(f"Response size: {size}")
            print(f"Full response: {response}")
            return response

        return debug_get