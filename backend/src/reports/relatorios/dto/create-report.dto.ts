import { ApiProperty, refs } from '@nestjs/swagger';
import { FonteRelatorio } from 'src/generated/prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CreateRelObrasDto } from 'src/reports/pp-obras/dto/create-obras.dto';
import { CreateRelProjetosDto } from 'src/reports/pp-projetos/dto/create-projetos.dto';
import { CreateRelObraStatusDto, CreateRelProjetoStatusDto } from 'src/reports/pp-status/dto/create-projeto-status.dto';
import { CreateRelPrevisaoCustoDto } from 'src/reports/previsao-custo/dto/create-previsao-custo.dto';
import {
    CreateRelObrasOrcamentoDto,
    CreateRelProjetoOrcamentoDto,
} from 'src/reports/projeto-orcamento/dto/create-projeto-orcamento.dto';
import {
    CreateRelObrasPrevisaoCustoDto,
    CreateRelProjetoPrevisaoCustoDto,
} from 'src/reports/projeto-previsao-custo/dto/create-projeto-previsao-custo.dto';
import { CreateCasaCivilAtividadesPendentesFilterDto } from '../../casa-civil-atividades-pendentes/dto/create-casa-civil-atv-pend-filter.dto';
import { CreateRelIndicadorDto } from '../../indicadores/dto/create-indicadores.dto';
import { CreateRelMonitoramentoMensalDto } from '../../monitoramento-mensal/dto/create-monitoramento-mensal.dto';
import { PdmCreateOrcamentoExecutadoDto } from '../../orcamento/dto/create-orcamento-executado.dto';
import { CreateRelProjetoDto } from '../../pp-projeto/dto/create-previsao-custo.dto';
import { CreatePsMonitoramentoMensalFilterDto } from '../../ps-monitoramento-mensal/dto/create-ps-monitoramento-mensal-filter.dto';
import { ReportValidatorOf } from '../report-validator-of';
import { CreateRelTribunalDeContasDto } from 'src/reports/tribunal-de-contas/dto/create-tribunal-de-contas.dto';

export class CreateReportDto {
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte: FonteRelatorio;

    /**
     * Parâmetros para o relatório escolhido
     *
     * @example "{}"
     */
    @ReportValidatorOf('fonte')
    @ApiProperty({
        oneOf: refs(
            PdmCreateOrcamentoExecutadoDto,
            CreateRelProjetoOrcamentoDto,
            CreateRelObrasOrcamentoDto,
            CreateRelIndicadorDto,
            CreateRelMonitoramentoMensalDto,
            CreateRelPrevisaoCustoDto,
            CreateRelObrasPrevisaoCustoDto,
            CreateRelProjetoDto,
            CreateRelProjetosDto,
            CreateRelProjetoStatusDto,
            CreateRelObraStatusDto,
            CreateRelObrasDto,
            CreateRelProjetoPrevisaoCustoDto,
            CreatePsMonitoramentoMensalFilterDto,
            CreateCasaCivilAtividadesPendentesFilterDto,
            CreateRelTribunalDeContasDto
        ),
    })
    parametros: any;

    @IsOptional()
    @IsBoolean()
    eh_publico?: boolean;
}
