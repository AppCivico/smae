import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Res,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiExtraModels,
    ApiNoContentResponse,
    ApiResponse,
    ApiTags,
    refs,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ProjetoService } from '../projeto/projeto.service';
import { CheckDependenciasDto, CreateTarefaDto, FilterEAPDto, FilterPPTarefa } from './dto/create-tarefa.dto';
import { UpdateTarefaDto, UpdateTarefaRealizadoDto } from './dto/update-tarefa.dto';
import { DependenciasDatasDto, ListTarefaProjetoDto, TarefaDetailDto } from './entities/tarefa.entity';
import { TarefaService } from './tarefa.service';
import { GraphvizContentTypeMap } from 'src/graphviz/graphviz.service';

const roles: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    'SMAE.gestor_de_projeto',
    'SMAE.colaborador_de_projeto',
];

const rolesMDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
    'MDO.gestor_de_projeto',
    'MDO.colaborador_de_projeto',
];

@Controller('projeto')
@ApiTags('Projeto - Tarefas')
export class TarefaController {
    constructor(
        private readonly tarefaService: TarefaService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/tarefa')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreateTarefaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadWrite');

        return await this.tarefaService.create({ projeto_id: projeto.id }, dto, user);
    }

    @Get(':id/tarefa')
    @ApiBearerAuth('access-token')
    @Roles([...roles, 'SMAE.espectador_de_projeto'])
    async findAll(
        @Param() params: FindOneParams,
        @Query() filter: FilterPPTarefa,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListTarefaProjetoDto> {
        const tarefasProj = await this.tarefaService.findAll({ projeto_id: params.id }, user, filter);

        return {
            linhas: tarefasProj.linhas,
            projeto: tarefasProj.projeto!,
            portfolio: tarefasProj.projeto!.portfolio,
        };
    }

    @Get(':id/tarefas-eap')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiResponse({ status: 200, description: 'Imagem da EAP' })
    async getEAP(
        @Param() params: FindOneParams,
        @Query() filter: FilterEAPDto,
        @CurrentUser() user: PessoaFromJwt,
        @Res() res: Response
    ): Promise<void> {
        const formato = filter.formato ?? 'png';

        const tarefaCronoId = await this.tarefaService.loadOrCreateByInput({ projeto_id: params.id }, user);

        const imgStream = await this.tarefaService.getEap(tarefaCronoId, { projeto_id: params.id }, formato);
        res.type(GraphvizContentTypeMap[formato]);

        if (formato == 'pdf' || formato == 'svg')
            res.set({
                'Content-Disposition': `attachment; filename="eap-projeto-${params.id}.${formato}"`,
                'Access-Control-Expose-Headers': 'content-disposition',
            });

        imgStream.pipe(res);
    }

    @Get(':id/tarefas-hierarquia')
    @ApiBearerAuth('access-token')
    @Roles([...roles, 'SMAE.espectador_de_projeto'])
    @ApiResponse({ status: 200, description: 'Responde com Record<ID_TAREFA, HIERARQUIA_NO_CRONOGRAMA>' })
    async getTarefasHierarquia(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');

        const tarefaCronoId = await this.tarefaService.loadOrCreateByInput({ projeto_id: params.id }, user);

        return await this.tarefaService.tarefasHierarquia(tarefaCronoId);
    }

    @Get(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles, 'SMAE.espectador_de_projeto'])
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<TarefaDetailDto> {
        return await this.tarefaService.findOne({ projeto_id: params.id }, params.id2, user);
    }

    @Patch(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiExtraModels(UpdateTarefaDto, UpdateTarefaRealizadoDto)
    @ApiBody({
        schema: { oneOf: refs(UpdateTarefaDto, UpdateTarefaRealizadoDto) },
    })
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateTarefaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        if (dto.atualizacao_do_realizado) {
            // acessa como read-only pra personalizar a mensagem de erro, caso aconteça
            const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');
            console.log(`dto.atualizacao_do_realizado=true`);
            dto = plainToClass(UpdateTarefaRealizadoDto, dto, { excludeExtraneousValues: true });
            console.log(`after plainToClass UpdateTarefaRealizadoDto ${JSON.stringify(dto)}`);
            console.log(dto);

            if (projeto.permissoes.apenas_leitura && projeto.permissoes.sou_responsavel == false) {
                throw new HttpException(
                    'Não é possível editar o realizado da tarefa, pois o seu acesso é apenas leitura e você não é o responsável do projeto.',
                    400
                );
            }

            return await this.tarefaService.update({ projeto_id: projeto.id }, params.id2, dto, user);
        } else {
            const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadWrite');

            return await this.tarefaService.update({ projeto_id: projeto.id }, params.id2, dto, user);
        }
    }

    @Delete(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadWrite');

        await this.tarefaService.remove({ projeto_id: projeto.id }, params.id2, user);
        return '';
    }

    @Post(':id/dependencias')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async calcula_dependencias_tarefas(
        @Param() params: FindOneParams,
        @Body() dto: CheckDependenciasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DependenciasDatasDto> {
        const projeto = await this.projetoService.findOne('PP', params.id, user, 'ReadWrite');

        const result = await this.tarefaService.calcula_dependencias_tarefas(projeto.id, dto, user);
        if (!result) throw new HttpException('Faltando dependências', 400);

        return result;
    }
}

@Controller('projeto-mdo')
@ApiTags('Projeto de obras - Tarefas')
export class TarefaMDOController {
    constructor(
        private readonly tarefaService: TarefaService,
        private readonly projetoService: ProjetoService
    ) {}

    @Post(':id/tarefa')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreateTarefaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        return await this.tarefaService.create({ projeto_id: projeto.id }, dto, user);
    }

    @Get(':id/tarefa')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO, 'MDO.espectador_de_projeto'])
    async findAll(
        @Param() params: FindOneParams,
        @Query() filter: FilterPPTarefa,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListTarefaProjetoDto> {
        const tarefasProj = await this.tarefaService.findAll({ projeto_id: params.id }, user, filter);

        return {
            linhas: tarefasProj.linhas,
            projeto: tarefasProj.projeto!,
            portfolio: tarefasProj.projeto!.portfolio,
        };
    }

    @Get(':id/tarefas-eap')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiResponse({ status: 200, description: 'Imagem da EAP' })
    async getEAP(
        @Param() params: FindOneParams,
        @Query() filter: FilterEAPDto,
        @CurrentUser() user: PessoaFromJwt,
        @Res() res: Response
    ): Promise<void> {
        const formato = filter.formato ?? 'png';

        const tarefaCronoId = await this.tarefaService.loadOrCreateByInput({ projeto_id: params.id }, user);

        const imgStream = await this.tarefaService.getEap(tarefaCronoId, { projeto_id: params.id }, formato);
        res.type(GraphvizContentTypeMap[formato]);

        if (formato == 'pdf' || formato == 'svg')
            res.set({
                'Content-Disposition': `attachment; filename="eap-projeto-${params.id}.${formato}"`,
                'Access-Control-Expose-Headers': 'content-disposition',
            });

        imgStream.pipe(res);
    }

    @Get(':id/tarefas-hierarquia')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO, 'MDO.espectador_de_projeto'])
    @ApiResponse({ status: 200, description: 'Responde com Record<ID_TAREFA, HIERARQUIA_NO_CRONOGRAMA>' })
    async getTarefasHierarquia(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('PP', params.id, user, 'ReadOnly');

        const tarefaCronoId = await this.tarefaService.loadOrCreateByInput({ projeto_id: params.id }, user);

        return await this.tarefaService.tarefasHierarquia(tarefaCronoId);
    }

    @Get(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO, 'MDO.espectador_de_projeto'])
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<TarefaDetailDto> {
        return await this.tarefaService.findOne({ projeto_id: params.id }, params.id2, user);
    }

    @Patch(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiExtraModels(UpdateTarefaDto, UpdateTarefaRealizadoDto)
    @ApiBody({
        schema: { oneOf: refs(UpdateTarefaDto, UpdateTarefaRealizadoDto) },
    })
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateTarefaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        if (dto.atualizacao_do_realizado) {
            // acessa como read-only pra personalizar a mensagem de erro, caso aconteça
            const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadOnly');
            console.log(`dto.atualizacao_do_realizado=true`);
            dto = plainToClass(UpdateTarefaRealizadoDto, dto, { excludeExtraneousValues: true });
            console.log(`after plainToClass UpdateTarefaRealizadoDto ${JSON.stringify(dto)}`);
            console.log(dto);

            if (projeto.permissoes.apenas_leitura && projeto.permissoes.sou_responsavel == false) {
                throw new HttpException(
                    'Não é possível editar o realizado da tarefa, pois o seu acesso é apenas leitura e você não é o responsável do projeto.',
                    400
                );
            }

            return await this.tarefaService.update({ projeto_id: projeto.id }, params.id2, dto, user);
        } else {
            const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

            return await this.tarefaService.update({ projeto_id: projeto.id }, params.id2, dto, user);
        }
    }

    @Delete(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        await this.tarefaService.remove({ projeto_id: projeto.id }, params.id2, user);
        return '';
    }

    @Post(':id/dependencias')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async calcula_dependencias_tarefas(
        @Param() params: FindOneParams,
        @Body() dto: CheckDependenciasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DependenciasDatasDto> {
        const projeto = await this.projetoService.findOne('MDO', params.id, user, 'ReadWrite');

        const result = await this.tarefaService.calcula_dependencias_tarefas(projeto.id, dto, user);
        if (!result) throw new HttpException('Faltando dependências', 400);

        return result;
    }
}
