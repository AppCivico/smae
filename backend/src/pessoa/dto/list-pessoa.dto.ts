import { ApiProperty, PickType } from '@nestjs/swagger';
import { ListPessoa } from './../entities/list-pessoa.entity';

export class ListPessoaDto {
    @ApiProperty({ description: 'Lista de Pessoas' })
    linhas: ListPessoa[];
}

export class ListPessoaReduced extends PickType(ListPessoa, ['id', 'nome_exibicao', 'orgao_id']) {}

export class ListPessoaReducedDto {
    @ApiProperty({ description: 'Lista de Pessoas com apenas id + nome + órgão' })
    linhas: ListPessoaReduced[];
}
