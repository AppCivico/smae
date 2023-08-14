from functools import partial
from .abstract_client import Client
from config import SOF_API_HOST, SOF_API_VERSION


class SofClient:

    host = SOF_API_HOST
    version = SOF_API_VERSION

    def __init__(self, auth_token:str)->None:

        self.base_url = self.__build_base_url()
        self.auth_token = auth_token

        self.get = self.__authorize_get()

    def __build_base_url(self):

        return f'https://{self.host}/{self.version}/'

    def __build_headers(self):

        return {"Authorization" : f"Bearer {self.auth_token}",
                "Accept": "application/json"}

    def __authorize_get(self):

        client = Client(self.base_url)
        headers = self.__build_headers()
        get = partial(client.get, headers=headers)

        return get



