from requests import session
from http import HTTPStatus
from requests.exceptions import HTTPError
import time

from core.exceptions import UpstreamError

RETRY_CODES = [
    HTTPStatus.TOO_MANY_REQUESTS,
    HTTPStatus.INTERNAL_SERVER_ERROR,
    HTTPStatus.BAD_GATEWAY,
    HTTPStatus.SERVICE_UNAVAILABLE,
    HTTPStatus.GATEWAY_TIMEOUT,
]

MAX_RETRIES=3


def max_retries_bytes_request(session:session, url:str, max_retries:int)->bytes:

    for n in range(max_retries):
            try:
                with session.get(url) as response:
                    response.raise_for_status()
                    return response.content
            except HTTPError as exc:
                code = exc.response.status_code
                
                if code in RETRY_CODES:
                    # retry after n seconds
                    time.sleep(n)
                    continue
                raise
    else:
        raise UpstreamError(f'Max retries exceeded for url: {url}. HTTP Exception: {exc}. Status code: {code}')
    

class UrlBuildeR:
    '''Builds url for request.'''


    def __init__(self, domain: str, https:bool=True)->None:

        self.domain = self.slash_ending(domain)
        self.https = https
        if not domain.startswith('http'):
            self.domain = self.add_protocol(domain)

    def add_protocol(self, domain:str)->str:

        if self.https:
            return 'https://' + domain
        return 'http://'+domain

    def slash_ending(self, slug : str)->str:

        if not slug.endswith('/'):
            slug = slug + '/'

        return slug

    def build_params(self, params: dict)->str:
    
        params = [f'{key}={val}' for key, val in params.items()]
        
        params = '&'.join(params)
        
        return '?'+params


    def build_url(self, namespace: str, endpoint: str, **params)->str:
        
        #apenas o namespace precisa de slash, o endpoint nao
        namespace = self.slash_ending(namespace)

        url = self.domain + namespace + endpoint
        
        if params:
            params = self.build_params(params)
            url = url + params
        
        return url

    def __call__(self, namespace, endpoint, **params):

        return self.build_url(namespace, endpoint, **params)

