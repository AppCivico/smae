export { strict as assert } from 'node:assert';
export { bootApp, getApp, prisma } from './app';
export { api, assertStatus, ApiOpts, Requisicao, Resposta, Sistema } from './api';
export {
    criarPessoaComPrivilegios,
    criarPessoaSemPrivilegios,
    criarToken,
    loginAsSuperAdmin,
    PRIVILEGIO_INOFENSIVO,
    Sessao,
    SUPERADMIN_EMAIL,
} from './auth';
export { criarOrgao, criarPdmAntigo, criarPlanoSetorial, criarTipoOrgao, uniq } from './factories';
