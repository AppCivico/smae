import responseDownload from '@/helpers/responseDownload';
import { useAlertStore, useAuthStore } from '@/stores';

type Method = 'GET' | 'POST' | 'UPLOAD' | 'PUT' | 'PATCH' | 'DELETE';

function listErrors(r: String[]) {
  let o = '';
  if (typeof r === 'object') {
    r.forEach((rr:String) => {
      o += `${rr.includes('|') ? rr.split('| ')[1] : rr}\r\n`;
    });
    return o;
  }
  return r;
}

async function handleResponse(response: Response) {
  const isJson = response.headers?.get('content-type')?.includes('application/json');
  const isZip = response.headers?.get('content-type')?.includes('application/zip');

  const data = isJson ? await response.json() : true;
  if (!response.ok) {
    if ([204].includes(response.status)) return;
    const alertStore = useAlertStore();
    const { user } = useAuthStore();
    let msgDefault;
    if ([401, 403].includes(response.status) && user) {
      msgDefault = 'Sem permissão para acessar.';
    }
    if ([502].includes(response.status) && user) {
      msgDefault = 'Erro de comunicação do servidor.';
    }
    const error = (data && data.message) ? listErrors(data.message) : msgDefault ?? response.status;
    alertStore.error(error);
    // eslint-disable-next-line consistent-return
    return Promise.reject(error);
  }

  if (isZip) {
    responseDownload(response);
  }

  // eslint-disable-next-line consistent-return
  return data;
}

function userToken(url: RequestInfo | URL): HeadersInit {
  const { token } = useAuthStore();
  const isLoggedIn = !!token;
  const isApiUrl = String(url).startsWith(import.meta.env.VITE_API_URL);
  if (isLoggedIn && isApiUrl) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

function request(method: Method, upload = false) {
  return (url: RequestInfo | URL, params: { [key: string]: any } | undefined) => {
    let urlFinal = url;

    const requestOptions: RequestInit = {
      method,
      headers: userToken(urlFinal),
    };

    switch (method) {
      case 'GET':
        if (params && Object.keys(params).length) {
          Object.keys(params)
            // eslint-disable-next-line no-param-reassign
            .forEach((key) => params[key] === undefined && delete params[key]);

          urlFinal += `?${new URLSearchParams(params).toString()}`;
        }
        break;

      default:
        if (params && !upload) {
          requestOptions.headers = {
            ...requestOptions.headers,
            'Content-Type': 'application/json',
          };
          requestOptions.body = JSON.stringify(params);
        } else {
          // requestOptions.headers['Content-Type'] = 'multipart/form-data';
          requestOptions.body = params as FormData;
        }
        break;
    }

    return fetch(urlFinal, requestOptions).then(handleResponse);
  };
}

export default {
  get: request('GET'),
  post: request('POST'),
  upload: request('POST', true),
  put: request('PUT'),
  patch: request('PATCH'),
  delete: request('DELETE'),
};
