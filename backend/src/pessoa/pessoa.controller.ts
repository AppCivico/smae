import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { DetalhePessoaDto } from './dto/detalhe-pessoa.dto';
import { FilterPessoaDto } from './dto/filter-pessoa.dto';
import { ListPessoaDto, ListPessoaReducedDto } from './dto/list-pessoa.dto';
import {
    BuscaResponsabilidades,
    DetalheResponsabilidadeDto,
    ExecutaTransferenciaResponsabilidades,
} from './dto/responsabilidade-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { PessoaService } from './pessoa.service';
import { PROJETO_READONLY_ROLES, PROJETO_READONLY_ROLES_MDO } from '../pp/projeto/projeto.controller';

@ApiTags('Pessoa')
@Controller('pessoa')
export class PessoaController {
    constructor(private readonly pessoaService: PessoaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPessoa.inserir', 'CadastroPessoa.administrador.MDO'])
    create(@Body() createPessoaDto: CreatePessoaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return this.pessoaService.criarPessoa(createPessoaDto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    @Roles([
        'CadastroPessoa.inserir',
        'CadastroPessoa.editar',
        'CadastroPessoa.inativar',
        'PDM.admin_cp',
        'PDM.tecnico_cp',
        'PDM.ponto_focal',
        'SMAE.colaborador_de_projeto',
        'SMAE.gestor_de_projeto',
        'Projeto.administrador',
        'Projeto.administrador_no_orgao',
        'ProjetoMDO.administrador',
        'ProjetoMDO.administrador_no_orgao',
        'CadastroPS.administrador_no_orgao',
        'CadastroPS.administrador',
        'SMAE.GrupoVariavel.participante', // entrando no lugar de 'PS.admin_cp'/PS.tecnico_cp'/PS.ponto_focal'
        'CadastroMetaPS.listar',
        'CadastroMetaPDM.listar',
        'CadastroPessoa.administrador.MDO',
    ])
    async findAll(@Query() filters: FilterPessoaDto, @CurrentUser() user: PessoaFromJwt): Promise<ListPessoaDto> {
        return { linhas: await this.pessoaService.findAll(filters, user) };
    }

    @ApiBearerAuth('access-token')
    @Get('reduzido')
    @Roles([
        'CadastroPessoa.inserir',
        'CadastroPessoa.editar',
        'CadastroPessoa.inativar',
        'PDM.admin_cp',
        'PDM.tecnico_cp',
        'PDM.ponto_focal',
        'SMAE.colaborador_de_projeto',
        'SMAE.gestor_de_projeto',
        'SMAE.espectador_de_projeto',
        'Projeto.administrador',
        'Projeto.administrador_no_orgao',
        'ProjetoMDO.administrador',
        'ProjetoMDO.administrador_no_orgao',
        'CadastroGrupoPortfolio.administrador',
        'CadastroGrupoPortfolio.administrador_no_orgao',
        'CadastroPessoa.editar_responsabilidade',
        'CadastroTransferencia.listar',
        'CadastroPS.administrador_no_orgao',
        'CadastroPS.administrador',
        'SMAE.GrupoVariavel.participante', // entrando no lugar de 'PS.admin_cp'/PS.tecnico_cp'/PS.ponto_focal'
        'CadastroMetaPS.listar',
        'CadastroMetaPDM.listar',
        'CadastroPessoa.administrador.MDO',
        ...PROJETO_READONLY_ROLES,
        ...PROJETO_READONLY_ROLES_MDO,
    ])
    async findAllReduced(
        @Query() filters: FilterPessoaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListPessoaReducedDto> {
        const list = await this.pessoaService.findAll(filters, user);

        return {
            linhas: list.map((r) => {
                return {
                    id: r.id,
                    nome_exibicao: r.nome_exibicao,
                    orgao_id: r.orgao_id,
                };
            }),
        };
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPessoa.editar', 'CadastroPessoa.administrador.MDO'])
    async update(
        @Param() params: FindOneParams,
        @Body() updatePessoaDto: UpdatePessoaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.pessoaService.update(+params.id, updatePessoaDto, user);
    }

    @Get('responsabilidades')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPessoa.editar_responsabilidade', 'CadastroPessoa.administrador.MDO'])
    async getResponsabilidades(
        @Query() dto: BuscaResponsabilidades,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DetalheResponsabilidadeDto> {
        return await this.pessoaService.getResponsabilidades(dto, user);
    }

    @Post('responsabilidades')
    @ApiBearerAuth('access-token')
    @Roles(['CadastroPessoa.editar_responsabilidade', 'CadastroPessoa.administrador.MDO'])
    async executaTransferenciaResponsabilidades(
        @Body() dto: ExecutaTransferenciaResponsabilidades,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<void> {
        await this.pessoaService.executaTransferenciaResponsabilidades(dto, user);
        return;
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles([
        'CadastroPessoa.inserir',
        'CadastroPessoa.editar',
        'CadastroPessoa.inativar',
        'CadastroPessoa.editar_responsabilidade',
        'CadastroPessoa.administrador.MDO',
    ])
    async get(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<DetalhePessoaDto> {
        return await this.pessoaService.getDetail(+params.id, user);
    }
}
