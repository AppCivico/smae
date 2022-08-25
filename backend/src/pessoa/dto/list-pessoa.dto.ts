import { ApiProperty } from '@nestjs/swagger';
import { Pessoa } from 'src/pessoa/entities/pessoa.entity';

export class ListPessoaDto {
    @ApiProperty({ description: 'Lista de Pessoas', })
    linhas: Pessoa[];
}
