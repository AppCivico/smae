import { HttpException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Serie } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { Date2YMD } from '../../common/date2ymd';
import { MfSerieValorNomimal, VariavelAnaliseQualitativaDto } from '../metas/dto/mf-meta.dto';
import { MetasService } from '../metas/metas.service';
import { MfService } from '../mf.service';
import { AutoPreencherValorDto, EnviarParaCpDto } from './dto/auxiliar.dto';
import { RetryPromise } from 'src/common/retryPromise';
import { CheckArrayContains } from '../../common/helpers/CheckArrayContains';

type VariavelParaEnviar = {
    data_valor: Date;
    variavel_id: number;
};

@Injectable()
export class AuxiliarService {
    private readonly logger = new Logger(AuxiliarService.name);
    constructor(
        @Inject(forwardRef(() => MetasService)) private readonly metasService: MetasService,
        @Inject(forwardRef(() => MfService)) private readonly mfService: MfService
    ) {}

    async auto_preencher(dto: AutoPreencherValorDto, user: PessoaFromJwt) {
        const meta_id = dto.meta_id;
        const config = await this.mfService.pessoaAcessoPdm(user);
        if (!CheckArrayContains(meta_id, config.metas_variaveis))
            throw new HttpException(
                `Meta ID=${meta_id} não faz parte do seu perfil.\nConfiguração Atual: ${JSON.stringify(config)}`,
                404
            );

        // talvez isso vire parâmetros e ao buscar os ciclos antigos não precisa calcular os status
        // todo encontrar uma maneira de listar o passado sem um ciclo ativo
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();
        const dados = await this.metasService.metaVariaveis(dto.meta_id, config, cicloFisicoAtivo, user, false);

        // só deixa enviar direto pra CP se for um ponto_focal, se não, fica false
        // mas não causa exception, pra facilitar um pouco
        let enviar_cp = false;
        if (dto.enviar_cp && config.perfil === 'ponto_focal') enviar_cp = true;

        const ordem_series = Object.fromEntries(dados.ordem_series.map((k, i) => [k, i])) as Record<Serie, number>;

        const saves: VariavelAnaliseQualitativaDto[] = [];
        for (const v of dados.meta.variaveis) {
            for (const mes_serie of v.series) {
                if (!mes_serie.eh_corrente) continue;

                const ref = mes_serie.series.at(ordem_series.Realizado);

                if (ref && mes_serie.nao_preenchida && mes_serie.pode_editar)
                    saves.push(
                        cria_auto_preencher(
                            dto.valor_realizado,
                            dto.valor_realizado_acumulado,
                            v.variavel.id,
                            ref,
                            enviar_cp
                        )
                    );
            }
        }

        // mesmo loop, só que pra cada iniciativa
        for (const ini of dados.meta.iniciativas) {
            for (const v of ini.variaveis) {
                for (const mes_serie of v.series) {
                    if (!mes_serie.eh_corrente) continue;
                    const ref = mes_serie.series.at(ordem_series.Realizado);
                    if (ref && mes_serie.nao_preenchida && mes_serie.pode_editar)
                        saves.push(
                            cria_auto_preencher(
                                dto.valor_realizado,
                                dto.valor_realizado_acumulado,
                                v.variavel.id,
                                ref,
                                enviar_cp
                            )
                        );
                }
            }

            // mesmo loop, só que pra cada atividade
            for (const atividade of ini.atividades) {
                for (const v of atividade.variaveis) {
                    for (const mes_serie of v.series) {
                        if (!mes_serie.eh_corrente) continue;

                        const ref = mes_serie.series.at(ordem_series.Realizado);

                        if (ref && mes_serie.nao_preenchida && mes_serie.pode_editar)
                            saves.push(
                                cria_auto_preencher(
                                    dto.valor_realizado,
                                    dto.valor_realizado_acumulado,
                                    v.variavel.id,
                                    ref,
                                    enviar_cp
                                )
                            );
                    }
                }
            }
        }

        // quando fiz em chama tudo em paralelo, deu muito erro de lock, pq a tx é serialize
        // então vamos só 1x e fazer os retry sozinho
        for (const save of saves) {
            await RetryPromise(() => this.metasService.addMetaVariavelAnaliseQualitativa(save, config, user));
        }
    }

    async enviar_cp(dto: EnviarParaCpDto, user: PessoaFromJwt) {
        const meta_id = dto.meta_id;
        const config = await this.mfService.pessoaAcessoPdm(user);
        if (!CheckArrayContains(meta_id, config.metas_variaveis))
            throw new HttpException(
                `Meta ID=${meta_id} não faz parte do seu perfil.\nConfiguração Atual: ${JSON.stringify(config)}`,
                404
            );

        // talvez isso vire parâmetros e ao buscar os ciclos antigos não precisa calcular os status
        // todo encontrar uma maneira de listar o passado sem um ciclo ativo
        const cicloFisicoAtivo = await this.mfService.cicloFisicoAtivo();

        let ehPontoFocal = config.perfil == 'ponto_focal';

        // se nao é o ponto_focal, pode simular virar um
        if (!ehPontoFocal && dto.simular_ponto_focal) {
            ehPontoFocal = true;
        }

        if (!ehPontoFocal) {
            throw new HttpException(
                `Não é possível enviar para cp, pois o seu perfil é ${config.perfil}, e os valores já entram conferidos.`,
                400
            );
        }

        this.logger.debug('Buscando valores correntes...');
        const dados = await this.metasService.metaVariaveis(dto.meta_id, config, cicloFisicoAtivo, user, false);
        const ordem_series = Object.fromEntries(dados.ordem_series.map((k, i) => [k, i])) as Record<Serie, number>;

        const variaveisParaEnviar: VariavelParaEnviar[] = [];
        for (const v of dados.meta.variaveis) {
            for (const mes_serie of v.series) {
                // filtra só pelas que falta enviar
                if (!mes_serie.nao_enviada) continue;

                const ref = mes_serie.series.at(ordem_series.Realizado);
                if (ref && ref.valor_nominal !== '' && mes_serie.pode_editar)
                    variaveisParaEnviar.push(cria_enviar_cp(v.variavel.id, dto.simular_ponto_focal, ref));
            }
        }

        // mesmo loop, só que pra cada iniciativa
        for (const ini of dados.meta.iniciativas) {
            for (const v of ini.variaveis) {
                for (const mes_serie of v.series) {
                    // filtra só pelas que falta enviar
                    if (!mes_serie.nao_enviada) continue;

                    const ref = mes_serie.series.at(ordem_series.Realizado);
                    if (ref && ref.valor_nominal !== '' && mes_serie.pode_editar)
                        variaveisParaEnviar.push(cria_enviar_cp(v.variavel.id, dto.simular_ponto_focal, ref));
                }
            }

            // mesmo loop, só que pra cada atividade
            for (const atividade of ini.atividades) {
                for (const v of atividade.variaveis) {
                    for (const mes_serie of v.series) {
                        // filtra só pelas que falta enviar
                        if (!mes_serie.nao_enviada) continue;

                        const ref = mes_serie.series.at(ordem_series.Realizado);
                        if (ref && ref.valor_nominal !== '' && mes_serie.pode_editar)
                            variaveisParaEnviar.push(cria_enviar_cp(v.variavel.id, dto.simular_ponto_focal, ref));
                    }
                }
            }
        }

        this.logger.verbose(JSON.stringify(variaveisParaEnviar));
        this.logger.debug('Carregando analise quáli correntes...');

        const analisesQuali = await Promise.all(
            variaveisParaEnviar.map((envio) => {
                return RetryPromise(() =>
                    this.metasService.getMetaVariavelAnaliseQualitativa(
                        {
                            data_valor: envio.data_valor,
                            variavel_id: envio.variavel_id,
                            apenas_ultima_revisao: true,
                        },
                        user,
                        true // não precisamos do arquivos, nem de nada, só os valores da série
                    )
                );
            })
        );

        this.logger.verbose(JSON.stringify(analisesQuali));

        this.logger.debug('Submetendo para CP...');
        for (const quali of analisesQuali) {
            const analise = quali.analises[0];
            if (!analise) {
                this.logger.warn(`Pulando quáli ${JSON.stringify(quali)} pois está sem analise[0]`);
                continue;
            }

            const ordem_series = Object.fromEntries(quali.ordem_series.map((k, i) => [k, i])) as Record<Serie, number>;

            const serie_realizado = quali.series.at(ordem_series.Realizado);
            const serie_realizadoAcc = quali.series.at(ordem_series.RealizadoAcumulado);

            const skip = !serie_realizado || !serie_realizadoAcc;

            if (skip) {
                this.logger.warn(
                    `Pulando quáli ${JSON.stringify(quali)} pois está sem serie_realizado | serie_realizadoAcc`
                );
                continue;
            }

            await RetryPromise(() =>
                this.metasService.addMetaVariavelAnaliseQualitativa(
                    {
                        data_valor: Date2YMD.fromString(serie_realizado.data_valor),
                        simular_ponto_focal: dto.simular_ponto_focal,
                        variavel_id: quali.variavel.id,
                        analise_qualitativa: analise.analise_qualitativa,
                        valor_realizado: serie_realizado.valor_nominal,
                        valor_realizado_acumulado: serie_realizadoAcc.valor_nominal,
                        enviar_para_cp: true,
                    },
                    config,
                    user
                )
            );
        }
    }
}

function cria_auto_preencher(
    valor_realizado: string,
    valor_realizado_acumulado: string | undefined,
    variavel_id: number,
    ref: MfSerieValorNomimal,
    enviar_cp: boolean
): VariavelAnaliseQualitativaDto {
    return {
        data_valor: Date2YMD.fromString(ref.data_valor),
        simular_ponto_focal: false,
        valor_realizado: valor_realizado,
        valor_realizado_acumulado: valor_realizado_acumulado,
        variavel_id,
        enviar_para_cp: enviar_cp,
    };
}

function cria_enviar_cp(
    variavel_id: number,
    simular_ponto_focal: boolean,
    ref: MfSerieValorNomimal
): VariavelParaEnviar {
    return {
        data_valor: Date2YMD.fromString(ref.data_valor),
        variavel_id,
    };
}
