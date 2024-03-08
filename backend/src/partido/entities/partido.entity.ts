import { ApiProperty } from '@nestjs/swagger';
import { BancadaDto } from 'src/bancada/entities/bancada.entity';

export class PartidoOneDto {
    @ApiProperty({ description: 'ID do Partido' })
    id: number;

    @ApiProperty({ description: 'Sigla do partido' })
    sigla: string;

    @ApiProperty({ description: 'Nome do partido' })
    nome: string;

    @ApiProperty({ description: 'Número do partido' })
    numero: number;

    @ApiProperty({ description: 'Observações sobre partido' })
    observacao: string | null;

    @ApiProperty({ description: 'Data de fundacao do partido' })
    fundacao: Date | null;

    @ApiProperty({ description: 'Data de encerramento do partido' })
    encerramento: Date | null;
}

export class PartidoDto {
    @ApiProperty({ description: 'ID do Partido' })
    id: number;

    @ApiProperty({ description: 'Sigla do partido' })
    sigla: string;

    @ApiProperty({ description: 'Nome do partido' })
    nome: string;

    @ApiProperty({ description: 'Número do partido' })
    numero: number;

    // bancadas: BancadaDto[] | null
}

export class ListPartidoDto {
    linhas: PartidoDto[]
}