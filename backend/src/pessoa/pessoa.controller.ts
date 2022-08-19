import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { PessoaService } from './pessoa.service';

@ApiTags('pessoas')
@Controller('pessoa')
export class PessoaController {
    constructor(private readonly pessoaService: PessoaService) { }

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPessoa.inserir')
    create(@Body() createPessoaDto: CreatePessoaDto) {
        return this.pessoaService.criarPessoa(createPessoaDto);
    }
}
