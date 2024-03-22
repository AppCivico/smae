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
    ApiUnauthorizedResponse,
    refs,
} from '@nestjs/swagger';
import { plainToClass } from 'class-transformer';
import { Response } from 'express';
import { GraphvizContentTypeMap } from 'src/graphviz/graphviz.service';
import { TransferenciaService } from './transferencia.service';
import { TarefaService } from 'src/pp/tarefa/tarefa.service';
import { ListTarefaTransferenciaDto } from './entities/transferencia-tarefa.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { FindOneParams, FindTwoParams } from 'src/common/decorators/find-params';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import {
    CreateTarefaDto,
    FilterPPTarefa,
    FilterEAPDto,
    CheckDependenciasDto,
} from 'src/pp/tarefa/dto/create-tarefa.dto';
import { UpdateTarefaDto, UpdateTarefaRealizadoDto } from 'src/pp/tarefa/dto/update-tarefa.dto';
import { TarefaDetailDto, DependenciasDatasDto } from 'src/pp/tarefa/entities/tarefa.entity';

const roles: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    'SMAE.gestor_de_projeto',
    'SMAE.colaborador_de_projeto',
];

@Controller('transferencia-tarefa')
@ApiTags('Transferência')
export class TransferenciaTarefaController {
    constructor(
        private readonly tarefaService: TarefaService,
        private readonly transferenciaService: TransferenciaService
    ) {}

    @Post(':id/tarefa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async create(
        @Param() params: FindOneParams,
        @Body() dto: CreateTarefaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const transferencia = await this.transferenciaService.findOneTransferencia(params.id, user);

        return await this.tarefaService.create({ transferencia_id: transferencia.id }, dto, user);
    }

    @Get(':id/tarefa')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles, 'SMAE.espectador_de_projeto')
    async findAll(
        @Param() params: FindOneParams,
        @Query() filter: FilterPPTarefa,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<ListTarefaTransferenciaDto> {
        const tarefasTransferencias = await this.tarefaService.findAll({ transferencia_id: params.id }, user, filter);

        return {
            linhas: tarefasTransferencias.linhas,
            cabecalho: tarefasTransferencias.cabecalho!,
        };
    }

    @Get(':id/tarefas-eap')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiResponse({ status: 200, description: 'Imagem da EAP' })
    async getEAP(
        @Param() params: FindOneParams,
        @Query() filter: FilterEAPDto,
        @CurrentUser() user: PessoaFromJwt,
        @Res() res: Response
    ): Promise<void> {
        const formato = filter.formato ?? 'png';

        const tarefaCronoId = await this.tarefaService.loadOrCreateByInput({ transferencia_id: params.id }, user);

        const imgStream = await this.tarefaService.getEap(tarefaCronoId, { transferencia_id: params.id }, formato);
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
    @ApiUnauthorizedResponse()
    @Roles(...roles, 'SMAE.espectador_de_projeto')
    @ApiResponse({ status: 200, description: 'Responde com Record<ID_TAREFA, HIERARQUIA_NO_CRONOGRAMA>' })
    async getTarefasHierarquia(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        const tarefaCronoId = await this.tarefaService.loadOrCreateByInput({ transferencia_id: params.id }, user);

        return await this.tarefaService.tarefasHierarquia(tarefaCronoId);
    }

    @Get(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles, 'SMAE.espectador_de_projeto')
    async findOne(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt): Promise<TarefaDetailDto> {
        return await this.tarefaService.findOne({ transferencia_id: params.id }, params.id2, user);
    }

    @Patch(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
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
            const transferencia = await this.transferenciaService.findOneTransferencia(params.id, user);
            console.log(`dto.atualizacao_do_realizado=true`);
            dto = plainToClass(UpdateTarefaRealizadoDto, dto, { excludeExtraneousValues: true });
            console.log(`after plainToClass UpdateTarefaRealizadoDto ${JSON.stringify(dto)}`);
            console.log(dto);

            // if (transferencia.permissoes.apenas_leitura && transferencia.permissoes.sou_responsavel == false) {
            //     throw new HttpException(
            //         'Não é possível editar o realizado da tarefa, pois o seu acesso é apenas leitura e você não é o responsável do projeto.',
            //         400
            //     );
            // }

            return await this.tarefaService.update({ transferencia_id: transferencia.id }, params.id2, dto, user);
        } else {
            const transferencia = await this.transferenciaService.findOneTransferencia(params.id, user);

            return await this.tarefaService.update({ transferencia_id: transferencia.id }, params.id2, dto, user);
        }
    }

    @Delete(':id/tarefa/:id2')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        const transferencia = await this.transferenciaService.findOneTransferencia(params.id, user);

        await this.tarefaService.remove({ transferencia_id: transferencia.id }, params.id2, user);
        return '';
    }

    @Post(':id/dependencias')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles(...roles)
    async calcula_dependencias_tarefas(
        @Param() params: FindOneParams,
        @Body() dto: CheckDependenciasDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<DependenciasDatasDto> {
        const transferencia = await this.transferenciaService.findOneTransferencia(params.id, user);

        const result = await this.tarefaService.calcula_dependencias_tarefas(transferencia.id, dto, user);
        if (!result) throw new HttpException('Faltando dependências', 400);

        return result;
    }
}
