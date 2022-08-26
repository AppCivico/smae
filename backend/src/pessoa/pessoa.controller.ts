import { Body, Controller, Get, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListPessoaDto } from 'src/pessoa/dto/list-pessoa.dto';
import { UpdatePessoaDto } from 'src/pessoa/dto/update-pessoa.dto';
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
    create(@Body() createPessoaDto: CreatePessoaDto, @CurrentUser() user: PessoaFromJwt) {
        return this.pessoaService.criarPessoa(createPessoaDto, user);
    }


    @ApiBearerAuth('access-token')
    @Get()
    @Roles('CadastroPessoa.inserir', 'CadastroPessoa.editar', 'CadastroPessoa.inativar')
    async findAll(): Promise<ListPessoaDto> {
        return { 'linhas': await this.pessoaService.findAll() };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPessoa.editar')
    async update(@Param('id') id: string, @Body() updatePessoaDto: UpdatePessoaDto, @CurrentUser() user: PessoaFromJwt) {
        return await this.pessoaService.update(+id, updatePessoaDto, user);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroPessoa.inserir', 'CadastroPessoa.editar', 'CadastroPessoa.inativar')
    async get(@Param('id') id: string, @CurrentUser() user: PessoaFromJwt) {
        return await this.pessoaService.getDetail(+id, user);
    }

}
