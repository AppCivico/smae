import { ApiProperty } from '@nestjs/swagger';
import { ListPessoa } from 'src/pessoa/entities/list-pessoa.entity';

export class ListPessoaDto {
    @ApiProperty({ description: 'Lista de Pessoas', })
    linhas: ListPessoa[];
}
