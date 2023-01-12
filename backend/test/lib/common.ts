import { INestApplication } from '@nestjs/common';
import { Orgao } from '../../src/orgao/entities/orgao.entity';
import { OrgaoService } from '../../src/orgao/orgao.service';
import { ListPessoa } from '../../src/pessoa/entities/list-pessoa.entity';
import { PessoaService } from '../../src/pessoa/pessoa.service';
import { TipoOrgaoService } from '../../src/tipo-orgao/tipo-orgao.service';

export class TestOrgData {
    sigla: string
    descricao: string
    tipo_orgao_id?: number
}

export class OrganizacaoExpert {
    static async getOrCreateOrg(app: INestApplication, orgData: TestOrgData) {
        let exitingOrg: Orgao | null;

        const orgService = app.get(OrgaoService);

        const findOrg = await orgService.findAll();
        exitingOrg = findOrg.filter(o => o.descricao == orgData.descricao)[0];
        if (!exitingOrg) {
            let tipo_orgao_id = orgData.tipo_orgao_id;
            if (!tipo_orgao_id) {
                const tipoOrgService = app.get(TipoOrgaoService);
                const anyTipoOrgo = (await tipoOrgService.findAll())[0];
                if (anyTipoOrgo) {
                    tipo_orgao_id = anyTipoOrgo.id;
                } else {
                    tipo_orgao_id = (await tipoOrgService.create({ descricao: 'test' })).id;
                }
            }
            const o = await orgService.create({ ...orgData, tipo_orgao_id: tipo_orgao_id });
            exitingOrg = await orgService.findOne(o.id);
            if (exitingOrg == null) throw 'failed to create org';
        }

        console.log(exitingOrg);
        return exitingOrg;
    }
}


export class TestPessoaData {
    email?: string
    perfil_acesso_ids?: number[]
    nome_exibicao?: string
    nome_completo?: string
    orgao_id?: number
}
export class PessoaExpert {
    /**
     *
     * @param app
     * @param cusData
     * @returns a new customer, or existing based on the email parameter
     * no customer data is updated
     */
    static async getOrCreatePessoa(app: INestApplication, cusData: TestPessoaData) {
        let exitingPessoa: ListPessoa | null;

        const pessoaService = app.get(PessoaService);

        const profiles = await pessoaService.listaPerfilAcesso();
        const adminProfile = profiles.filter(p => p.nome.match('Administrador Geral'))[0];
        if (!adminProfile) throw 'nao encontrado perfil do admin';

        const randomStr = Math.random().toString();
        const email = cusData.email ?? ['test', randomStr, '@test.com'].join('');

        const findPessoa = await pessoaService.findAll({
            email: email
        });
        exitingPessoa = findPessoa.filter(o => o.email == email)[0];
        if (!exitingPessoa) {
            await pessoaService.criarPessoa({
                perfil_acesso_ids: cusData.perfil_acesso_ids ?? [adminProfile.id],
                email: email,
                nome_completo: cusData.nome_completo ?? 'nome_completo ' + randomStr,
                nome_exibicao: cusData.nome_exibicao ?? 'nome_exibicao ' + randomStr,
                orgao_id: cusData.orgao_id ?? (await OrganizacaoExpert.getOrCreateOrg(app, { descricao: randomStr, sigla: randomStr })).id,
            });

            const findPessoa = await pessoaService.findAll({
                email: email
            });
            exitingPessoa = findPessoa[0];

        }

        if (!exitingPessoa) throw new Error(`failed to create pessoa`)

        console.log(exitingPessoa);
        return exitingPessoa;
    }
}
