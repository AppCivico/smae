import { ApiProperty, refs } from '@nestjs/swagger';
import { FonteRelatorio } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { CreateRelPrevisaoCustoDto } from 'src/reports/previsao-custo/dto/create-previsao-custo.dto';
import { CreateRelIndicadorDto } from '../../indicadores/dto/create-indicadore.dto';
import { CreateRelMonitoramentoMensalDto } from '../../monitoramento-mensal/dto/create-monitoramento-mensal.dto';
import { CreateOrcamentoExecutadoDto } from '../../orcamento/dto/create-orcamento-executado.dto';
import { CreateRelProjetoDto } from '../../pp-projeto/dto/create-previsao-custo.dto';
import { ReportValidatorOf } from '../report-validator-of';
import { CreateRelProjetosDto } from 'src/reports/pp-projetos/dto/create-projetos.dto';
import { CreateRelProjetoStatusDto } from 'src/reports/pp-status/dto/create-projeto-status.dto';

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
            CreateOrcamentoExecutadoDto,
            CreateRelIndicadorDto,
            CreateRelMonitoramentoMensalDto,
            CreateRelPrevisaoCustoDto,
            CreateRelProjetoDto,
            CreateRelProjetosDto,
            CreateRelProjetoStatusDto
        )
    })
    parametros: any;

    @IsOptional()
    @IsBoolean()
    salvar_arquivo?: boolean;
}
