import { ApiProperty } from '@nestjs/swagger';
import { ListPessoa } from './../entities/list-pessoa.entity';

export class ListPessoaDto {
    @ApiProperty({ description: 'Lista de Pessoas' })
    linhas: ListPessoa[];
}
