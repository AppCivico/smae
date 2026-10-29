import { ApiProperty } from '@nestjs/swagger';
import { ParlamentarCargo } from '@prisma/client';
import { IsDateYMD } from 'src/auth/decorators/date.decorator';
import { IdSiglaDescricao } from 'src/common/dto/IdSigla.dto';
import { EleicaoDto } from 'src/eleicao/entity/eleicao.entity';
import { PartidoDto } from 'src/partido/entities/partido.entity';
import { RepresentatividadeDto } from 'src/parlamentar/entities/parlamentar.entity';

export class PainelParlamentarMandatoDto {
    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    cargo: ParlamentarCargo;
    eleicao: EleicaoDto;
    partido_candidatura: PartidoDto;
    partido_atual: PartidoDto;
    votos_estado: number | null;
    votos_capital: number | null;
    votos_interior: number | null;
    atuacao: string | null;
    biografia: string | null;
}

export class PainelParlamentarPerfilDto {
    id: number;
    @ApiProperty({ description: 'Nome civil' })
    nome: string;
    nome_popular: string | null;
    @IsDateYMD({ nullable: true })
    nascimento: string | null;
    telefone: string | null;
    email: string | null;
    @ApiProperty({ description: 'Token de download da foto', type: String, nullable: true })
    foto: string | null;
    mandato_atual: PainelParlamentarMandatoDto | null;
    representatividade_capital: RepresentatividadeDto[];
    representatividade_interior: RepresentatividadeDto[];
}

export class PainelParlamentarTransferenciasKpiDto {
    total: number;
    @ApiProperty({ description: 'Transferências com workflow ainda não finalizado' })
    em_andamento: number;
}

export class PainelParlamentarRecursoDto {
    @ApiProperty({ description: 'Soma de transferencia_parlamentar.valor' })
    valor_disponibilizado: number;
    @ApiProperty({ description: 'Soma de distribuicao_parlamentar.valor nas distribuições contabilizadas' })
    valor_utilizado: number;
    @ApiProperty({ description: 'valor_utilizado / valor_disponibilizado, em %' })
    pct_utilizado: number;
}

export class PainelParlamentarParticipacaoDto {
    @ApiProperty({ description: 'Valor do parlamentar nas transferências em andamento' })
    valor_parlamentar: number;
    @ApiProperty({ description: 'Valor de todos os parlamentares nas transferências em andamento' })
    valor_total: number;
    pct: number;
}

export class PainelParlamentarPorSecretariaDto {
    @ApiProperty({ type: IdSiglaDescricao, nullable: true, description: 'Nulo na linha "Outros"' })
    orgao: IdSiglaDescricao | null;
    rotulo: string;
    @ApiProperty({ description: 'true na linha que agrupa o restante do top 5' })
    outros: boolean;
    valor: number;
    @ApiProperty({ description: 'Participação no valor_utilizado, em %' })
    pct: number;
}

export class PainelParlamentarPartidoRefDto {
    id: number;
    sigla: string;
    nome: string;
}

export class PainelParlamentarPorPartidoDto {
    @ApiProperty({ type: PainelParlamentarPartidoRefDto, nullable: true, description: 'Nulo em "Outros"' })
    partido: PainelParlamentarPartidoRefDto | null;
    rotulo: string;
    @ApiProperty({ description: 'true na linha que agrupa o restante do top 5' })
    outros: boolean;
    valor: number;
    @ApiProperty({ description: 'Participação no valor_disponibilizado, em %' })
    pct: number;
}

export class PainelParlamentarDto {
    parlamentar: PainelParlamentarPerfilDto;
    transferencias: PainelParlamentarTransferenciasKpiDto;
    recurso: PainelParlamentarRecursoDto;
    participacao_municipio: PainelParlamentarParticipacaoDto;
    por_secretaria: PainelParlamentarPorSecretariaDto[];
    por_partido: PainelParlamentarPorPartidoDto[];
}

export class PainelParlamentarDistribuicaoDto {
    id: number;
    nome: string | null;
    objeto: string;
    orgao: IdSiglaDescricao;
    @ApiProperty({ description: 'Nome do status atual da distribuição' })
    situacao: string | null;
    @ApiProperty({ description: 'false para distribuições que não contam (canceladas etc.)' })
    contabilizada: boolean;
    valor: number;
    valor_parlamentar: number;
    @ApiProperty({ description: 'valor_parlamentar / valor, em %' })
    pct_parlamentar: number;
}

export class PainelParlamentarTransferenciaDto {
    @ApiProperty({ description: 'ID da transferência, para o link interno' })
    id: number;
    identificador: string;
    objeto: string;
    valor_repasse: number;
    @ApiProperty({ description: 'Soma das distribuições contabilizadas' })
    valor_distribuido: number;
    valor_parlamentar: number;
    etapa: string | null;
    fase: string | null;
    fase_status: string | null;
    distribuicoes: PainelParlamentarDistribuicaoDto[];
}
