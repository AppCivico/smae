import { BadRequestException } from '@nestjs/common';
import { ModuloSistema, RelatorioVisibilidade } from '@prisma/client';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { RestricaoAcesso } from './reports.contexto';

/**
 * Escopos de visibilidade de relatórios expostos ao usuário. A chave é persistida em
 * `relatorio.visibilidade_tipo` e resolvida no enum de trabalho `visibilidade` + no JSON
 * `restrito_para` no momento da criação.
 *
 * Escopos:
 * - `publico`   : visível a todos que conseguem listar a `fonte` deste relatório.
 * - `privado`   : visível apenas ao criador.
 * - `meu_orgao` : restrito às pessoas do órgão do criador. A parte "precisa ter acesso à
 *                 funcionalidade de relatórios" já é garantida de graça pelo filtro por fonte/
 *                 privilégio aplicado em ReportsService.findAll — então este escopo só precisa
 *                 adicionar a restrição por órgão via o escalar `restrito_para.orgao_id` (indexado).
 *                 `portfolio_orgao_ids` fica reservado aos relatórios gerados pelo sistema (legado).
 */
export type VisibilidadeTipo = 'publico' | 'privado' | 'meu_orgao';

export type VisibilidadeTemplateMeta = {
    tipo: VisibilidadeTipo;
    label: string;
    requer_confirmacao: boolean;
    mensagem_confirmacao: string | null;
};

export type VisibilidadeResolvida = {
    visibilidade: RelatorioVisibilidade;
    restrito_para: RestricaoAcesso | null;
};

export const VISIBILIDADE_TEMPLATES: Record<VisibilidadeTipo, VisibilidadeTemplateMeta> = {
    publico: {
        tipo: 'publico',
        label: 'Público',
        requer_confirmacao: true,
        mensagem_confirmacao:
            'Todas as pessoas com acesso à funcionalidade de relatórios desse módulo terão acesso ' +
            'a esse relatório, confirma que o relatório deve ser público?',
    },
    privado: {
        tipo: 'privado',
        label: 'Privado',
        requer_confirmacao: false,
        mensagem_confirmacao: null,
    },
    meu_orgao: {
        tipo: 'meu_orgao',
        label: 'Restrito ao órgão',
        requer_confirmacao: false,
        mensagem_confirmacao: null,
    },
};

export const VISIBILIDADE_TIPOS = Object.keys(VISIBILIDADE_TEMPLATES) as VisibilidadeTipo[];

/**
 * Label legível de um `visibilidade_tipo` para exibição (ex.: badge na listagem), evitando que o
 * frontend precise do endpoint de tipos só para mapear tipo → label. Retorna null quando não há
 * tipo definido (ex.: relatórios Restrito gerados pelo sistema, sem template).
 */
export function getVisibilidadeLabel(tipo: VisibilidadeTipo | null | undefined): string | null {
    if (!tipo) return null;
    return VISIBILIDADE_TEMPLATES[tipo]?.label ?? null;
}

/**
 * Resolve um `visibilidade_tipo` no concreto `{ visibilidade, restrito_para }` que será persistido
 * no relatório. `sistema`/`fonte` são recebidos para que escopos futuros possam montar restrições
 * dependentes da fonte sem mudar o ponto de chamada.
 */
export function montarVisibilidade(
    tipo: VisibilidadeTipo,
    user: PessoaFromJwt | null,
    _sistema: ModuloSistema,
    _fonte: string
): VisibilidadeResolvida {
    switch (tipo) {
        case 'publico':
            return { visibilidade: 'Publico', restrito_para: null };
        case 'privado':
            return { visibilidade: 'Privado', restrito_para: null };
        case 'meu_orgao': {
            if (!user?.orgao_id) {
                throw new BadRequestException(
                    'Usuário sem órgão associado não pode criar relatório restrito ao órgão.'
                );
            }
            return {
                visibilidade: 'Restrito',
                restrito_para: { orgao_id: user.orgao_id },
            };
        }
        default:
            tipo satisfies never;
            throw new BadRequestException(`Tipo de visibilidade inválido: ${tipo}`);
    }
}

/**
 * Retorna os escopos de visibilidade disponíveis para um módulo. Hoje todos valem para todos os
 * módulos; o parâmetro `sistema` existe para que a filtragem por-módulo possa ser adicionada
 * depois sem mudar a API.
 */
export function getTemplatesDisponiveis(_sistema: ModuloSistema): VisibilidadeTemplateMeta[] {
    return VISIBILIDADE_TIPOS.map((tipo) => VISIBILIDADE_TEMPLATES[tipo]);
}
