import { ApiProperty } from '@nestjs/swagger';
import { PainelConteudoTipoDetalhe, Periodicidade, Periodo } from '@prisma/client';
import { IsDateYMD } from '../../auth/decorators/date.decorator';

export class PainelConteudo {
    id: number;
    meta_id: number;
    indicador_id: number | null;
    mostrar_planejado: boolean;
    mostrar_acumulado: boolean;
    mostrar_indicador: boolean;
    mostrar_acumulado_periodo: boolean;
    @ApiProperty({ enum: Periodicidade })
    periodicidade: Periodicidade;
    @ApiProperty({ enum: Periodo })
    periodo: Periodo | null;
    @IsDateYMD({ nullable: true })
    periodo_fim: string | null;
    @IsDateYMD({ nullable: true })
    periodo_inicio: string | null;
    periodo_valor: number | null;

    detalhes: PainelConteudoDetalhes[] | null;
}
export class PainelConteudoDetalhes {
    @ApiProperty({ enum: PainelConteudoTipoDetalhe })
    tipo: PainelConteudoTipoDetalhe;
    mostrar_indicador: boolean;
    id: number;

    variavel: RowWithIdTitle | null;
    iniciativa: RowWithIdTitle | null;
    filhos: FirstLevelChildren[] | null;
}

export class RowWithIdTitle {
    id: number;
    titulo: string;
}

export class FirstLevelChildren {
    @ApiProperty({ enum: PainelConteudoTipoDetalhe })
    tipo: PainelConteudoTipoDetalhe;
    mostrar_indicador: boolean;
    id: number;

    variavel: RowWithIdTitle | null;
    atividade: RowWithIdTitle | null;
    filhos: SecondLevelChildren[] | null;
}

export class SecondLevelChildren {
    @ApiProperty({ enum: PainelConteudoTipoDetalhe })
    tipo: PainelConteudoTipoDetalhe;
    mostrar_indicador: boolean;
    id: number;

    variavel: RowWithIdTitle | null;
}
