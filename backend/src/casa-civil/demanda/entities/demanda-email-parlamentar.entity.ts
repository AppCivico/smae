import { ApiProperty } from '@nestjs/swagger';
import { PaginatedWithPagesDto } from 'src/common/dto/paginated.dto';

export class DemandaEmailParlamentarCriadorDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    nome_exibicao: string;
}

export class DemandaEmailParlamentarDto {
    @ApiProperty()
    id: number;

    @ApiProperty()
    assunto: string;

    @ApiProperty()
    nomes_parlamentares: string;

    @ApiProperty()
    criado_por: DemandaEmailParlamentarCriadorDto;

    @ApiProperty()
    criado_em: string;
}

export class ListDemandaEmailParlamentarDto extends PaginatedWithPagesDto<DemandaEmailParlamentarDto> {
    @ApiProperty({ type: [DemandaEmailParlamentarDto] })
    declare linhas: DemandaEmailParlamentarDto[];
}
