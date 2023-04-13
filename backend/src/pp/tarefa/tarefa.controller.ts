import { Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse, refs } from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { ProjetoService } from '../projeto/projeto.service';
import { CheckDependenciasDto, CreateTarefaDto, FilterPPTarefa } from './dto/create-tarefa.dto';
import { UpdateTarefaDto, UpdateTarefaRealizadoDto } from './dto/update-tarefa.dto';
import { DependenciasDatasDto, ListTarefaDto, TarefaDetailDto } from './entities/tarefa.entity';
import { TarefaService } from './tarefa.service';

const roles: ListaDePrivilegios[] = ['Projeto.administrador', 'SMAE.gestor_de_projeto', 'SMAE.colaborador_de_projeto'];

@Controller('projeto')
@ApiTags('Projeto - Tarefas')
export class TarefaController {
    constructor(
        private readonly tarefaService: TarefaService,
        private readonly projetoService: ProjetoService,
    ) { }

    @Post(':id/tarefa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(@Param() params: FindOneParams, @Body() dto: CreateTarefaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        const projeto = await this.projetoService.findOne(params.id, user, false);

        return await this.tarefaService.create(projeto.id, dto, user);
    }

    @Get(':id/tarefa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findAll(@Param() params: FindOneParams, @Query() filter: FilterPPTarefa, @CurrentUser() user: PessoaFromJwt): Promise<ListTarefaDto> {
        const tarefasProj = await this.tarefaService.findAll(params.id, user, filter);

        return {
            ...tarefasProj,
            portfolio: tarefasProj.projeto.portfolio,
        };
    }

    @Get(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<TarefaDetailDto> {
        const projeto = await this.projetoService.findOne(params.id, user, true);
        return await this.tarefaService.findOne(projeto, params.id2, user);
    }

    @Patch(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiExtraModels(UpdateTarefaDto, UpdateTarefaRealizadoDto)
    @ApiBody({
        schema: { oneOf: refs(UpdateTarefaDto, UpdateTarefaRealizadoDto) },
    })
    async update(@Param() params: FindTwoParams, @Body() dto: UpdateTarefaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        // verificar como fazer o check pro responsavel poder editar o realizado, mesmo depois de não poder
        // mais fazer escritas no projeto em si
        console.log(`before ${JSON.stringify(dto)}`);

        if (dto.atualizacao_do_realizado) {
            console.log(`dto.atualizacao_do_realizado=true`);
            dto = plainToClass(UpdateTarefaRealizadoDto, dto, { excludeExtraneousValues: true });
            console.log(`after plainToClass UpdateTarefaRealizadoDto ${JSON.stringify(dto)}`);
            console.log(dto);

            const projeto = await this.projetoService.findOne(params.id, user, true);

            if (projeto.permissoes.apenas_leitura_planejamento && projeto.permissoes.sou_responsavel == false) {
                throw new HttpException("Não é possível editar o realizado da tarefa, pois o seu acesso é apenas leitura e você não é o responsável do projeto.", 400);
            }

            return await this.tarefaService.update(projeto.id, params.id2, dto, user);
        } else {

            const projeto = await this.projetoService.findOne(params.id, user, false);
            return await this.tarefaService.update(projeto.id, params.id2, dto, user);
        }
    }

    @Delete(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(params.id, user, false);

        await this.tarefaService.remove(projeto.id, params.id2, user);
        return '';
    }

    @Post(':id/dependencias')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async calcula_dependencias_tarefas(@Param() params: FindOneParams, @Body() dto: CheckDependenciasDto, @CurrentUser() user: PessoaFromJwt): Promise<DependenciasDatasDto> {
        const projeto = await this.projetoService.findOne(params.id, user, false);

        const result = await this.tarefaService.calcula_dependencias_tarefas(projeto.id, dto, user);
        if (!result) throw new HttpException('Faltando dependências', 400);

        return result;
    }

}
