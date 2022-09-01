import { useAuthStore, useAlertStore } from '@/stores';

export const requestS = {
    get: request('GET'),
    post: request('POST'),
    put: request('PUT'),
    patch: request('PATCH'),
    delete: request('DELETE')
};

function request(method) {
    return (url, body) => {
        const requestOptions = {
            method,
            headers: userToken(url)
        };
        if (body) {
            requestOptions.headers['Content-Type'] = 'application/json';
            requestOptions.body = JSON.stringify(body);
        }
        return fetch(url, requestOptions).then(handleResponse);
    }
}

function userToken(url) {
    const { token } = useAuthStore();
    const isLoggedIn = !!token;
    const isApiUrl = url.startsWith(import.meta.env.VITE_API_URL);
    if (isLoggedIn && isApiUrl) {
        return { Authorization: `Bearer ${token}` };
    } else {
        return {};
    }
}

function listErrors(r){
    var o = '';
    if(typeof r == 'object'){
        r.forEach(rr=>{
            o+=`${rr.includes('|')?rr.split('| ')[1]:rr}\r\n`;
        });
        return o;
    }
    return r;
}

async function handleResponse(response) {
    const isJson = response.headers?.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        if(response.status == 204){return;}
        const alertStore = useAlertStore();
        const { user } = useAuthStore();
        var msgDefault;
        if ([401, 403].includes(response.status) && user) {
            msgDefault = "Sem permissão para acessar.";
        }
        if ([502].includes(response.status) && user) {
            msgDefault = "Erro de comunicação do servidor.";
        }
        const error = (data && data.message)?listErrors(data.message): msgDefault ?? response.status;
        alertStore.error(error);
        return Promise.reject(error);
    }

    return data;
}
