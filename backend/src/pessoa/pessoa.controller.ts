import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ListPessoaDto } from 'src/pessoa/dto/list-pessoa.dto';
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


    @ApiBearerAuth('access-token')
    @Get()
    @Roles('CadastroPessoa.inserir')
    async findAll(): Promise<ListPessoaDto> {
        return { 'linhas': await this.pessoaService.findAll() };
    }


}
