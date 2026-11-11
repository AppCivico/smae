import { DateYMD } from '../../common/date2ymd';
import { MonitoramentoFaseLeituraDto } from '../../pdm-ciclo/entities/ps-ciclo-fase.entity';
import { RelPsMonitoramentoMensalFasesCsvRow } from './entities/ps-monitoramento-mensal-csv.entity';

export type MetaComFases = {
    meta_id: number;
    meta_codigo: string | null;
    meta_titulo: string | null;
    data_ciclo: DateYMD;
    ciclo_fechado: boolean;
    fases: MonitoramentoFaseLeituraDto[];
};

export function montaLinhasFasesCsv(metas: MetaComFases[]): RelPsMonitoramentoMensalFasesCsvRow[] {
    const out: RelPsMonitoramentoMensalFasesCsvRow[] = [];
    for (const meta of metas) {
        for (const fase of meta.fases) {
            const revisao = fase.revisao;
            const base = {
                meta_id: meta.meta_id,
                meta_codigo: meta.meta_codigo,
                meta_titulo: meta.meta_titulo,
                data_ciclo: meta.data_ciclo,
                ciclo_fechado: meta.ciclo_fechado ? 'Sim' : 'Não',
                fase_ordem: fase.config.ordem,
                fase_rotulo: fase.config.rotulo,
                revisao_id: revisao?.id ?? null,
                referencia_data: revisao?.referencia_data ?? null,
                criado_em: revisao?.criado_em.toISOString() ?? null,
                criador: revisao?.criador.nome_exibicao ?? null,
                reaberto_em: revisao?.reaberto_em?.toISOString() ?? null,
                tags: revisao?.tags.length ? revisao.tags.map((t) => t.descricao).join('; ') : null,
                documentos_qtde: fase.documentos.length,
            };

            const blocos = fase.config.aceita_tags ? [] : fase.config.blocos;
            if (!blocos.length) {
                out.push({ ...base, bloco_ordem: null, bloco_rotulo: null, conteudo: null });
                continue;
            }
            for (const bloco of blocos) {
                const conteudo = revisao?.blocos.find((b) => b.bloco_id === bloco.id)?.conteudo_texto;
                out.push({
                    ...base,
                    bloco_ordem: bloco.ordem,
                    bloco_rotulo: bloco.rotulo,
                    conteudo: conteudo || null,
                });
            }
        }
    }
    return out;
}
