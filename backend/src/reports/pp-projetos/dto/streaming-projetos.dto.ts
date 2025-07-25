import { ApiProperty } from '@nestjs/swagger';
import { PPProjetosRelatorioDto } from '../entities/projetos.entity';

export class PPProjetosStreamingDto {
    @ApiProperty({ description: 'ID do projeto' })
    projeto_id: number;

    @ApiProperty({ description: 'Dados completos do projeto' })
    dados: PPProjetosRelatorioDto;
}
