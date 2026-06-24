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
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { TipoProjeto } from '@prisma/client';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PROJETO_READONLY_ROLES, PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';
import { CreateContratoAditivoDto } from './dto/create-contrato-aditivo.dto';
import { ListContratoAditivoDto } from './entities/contrato-aditivo.entity';
import { UpdateContratoAditivoDto } from './dto/update-contrato-aditivo.dto';
import { ContratoAditivoService } from './contrato-aditivo.service';
import { ProjetoGetPermissionSet, ProjetoService } from '../projeto/projeto.service';
import { PrismaService } from '../../prisma/prisma.service';

const roles: ListaDePrivilegios[] = [
    'Projeto.administrador',
    'Projeto.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES,
];
const rolesMDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES_MDO,
];

@Controller('contrato-pp')
@ApiTags('Projeto - Contrato Aditivo PP')
export class ContratoAditivoPPController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,
        private readonly contratoAditivoService: ContratoAditivoService
    ) {}

    @Post(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async create(
        @Param() params: FindOneParams,
        @Body() createContratoAditivoDto: CreateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await assertAcessoAoContrato(this.prisma, this.projetoService, 'PP', params.id, user, true);
        return await this.contratoAditivoService.create(+params.id, createContratoAditivoDto, user);
    }

    @Get(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListContratoAditivoDto> {
        await assertAcessoAoContrato(this.prisma, this.projetoService, 'PP', params.id, user, false);
        return {
            linhas: await this.contratoAditivoService.findAll(+params.id, user),
        };
    }

    @Patch(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await assertAcessoAoContrato(this.prisma, this.projetoService, 'PP', params.id, user, true);
        return await this.contratoAditivoService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await assertAcessoAoContrato(this.prisma, this.projetoService, 'PP', params.id, user, true);
        await this.contratoAditivoService.remove(+params.id, +params.id2, user);
        return '';
    }
}

@Controller('contrato-mdo')
@ApiTags('Projeto - Contrato Aditivo MDO')
export class ContratoAditivoMDOController {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,
        private readonly contratoAditivoService: ContratoAditivoService
    ) {}

    @Post(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Param() params: FindOneParams,
        @Body() createContratoAditivoDto: CreateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await assertAcessoAoContrato(this.prisma, this.projetoService, 'MDO', params.id, user, true);
        return await this.contratoAditivoService.create(+params.id, createContratoAditivoDto, user);
    }

    @Get(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListContratoAditivoDto> {
        await assertAcessoAoContrato(this.prisma, this.projetoService, 'MDO', params.id, user, false);
        return {
            linhas: await this.contratoAditivoService.findAll(+params.id, user),
        };
    }

    @Patch(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async update(
        @Param() params: FindTwoParams,
        @Body() dto: UpdateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        await assertAcessoAoContrato(this.prisma, this.projetoService, 'MDO', params.id, user, true);
        return await this.contratoAditivoService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await assertAcessoAoContrato(this.prisma, this.projetoService, 'MDO', params.id, user, true);
        await this.contratoAditivoService.remove(+params.id, +params.id2, user);
        return '';
    }
}

/**
 * Gate de permissão para operar sobre um contrato (possivelmente compartilhado entre vários projetos/obras).
 *
 * 1. Coleta os projetos/obras VINCULADOS ao contrato que o usuário enxerga, usando o mesmo conjunto de
 *    permissão (`ProjetoGetPermissionSet`) das listagens. Se nenhum vínculo visível existir -> "não encontrado".
 * 2. Leitura (`precisaEscrita = false`): visibilidade já basta, retorna.
 * 3. Escrita (`precisaEscrita = true`): exige permissão de ESCRITA em ALGUM dos projetos vinculados. Como o
 *    cálculo de escrita do `projetoService.findOne(..., 'ReadWriteTeam')` é imperativo (não é um filtro Prisma),
 *    tentamos cada projeto vinculado até um passar; se nenhum passar, nega. Assim, um contrato compartilhado é
 *    editável por quem tem escrita em qualquer obra/projeto a que ele pertence — sem depender de qual vínculo
 *    foi escolhido nem exigir parâmetro extra do front.
 */
async function assertAcessoAoContrato(
    prisma: PrismaService,
    projetoService: ProjetoService,
    tipo: TipoProjeto,
    contrato_id: number,
    user: PessoaFromJwt,
    precisaEscrita: boolean
): Promise<void> {
    const permissionsSet = await ProjetoGetPermissionSet(tipo, user);

    const vinculos = await prisma.contratoProjeto.findMany({
        where: {
            contrato_id: contrato_id,
            removido_em: null,
            contrato: { removido_em: null },
            // só vínculos cujo projeto o usuário pode ver (já inclui tipo, removido_em e portfólio)
            projeto: { AND: permissionsSet },
        },
        orderBy: { projeto_id: 'asc' },
        distinct: ['projeto_id'],
        select: { projeto_id: true },
    });
    if (vinculos.length === 0) throw new HttpException('Contrato não encontrado', 404);

    // Leitura: visibilidade sobre algum vínculo já é suficiente.
    if (!precisaEscrita) return;

    // Escrita: precisa ter permissão de escrita em ALGUM projeto/obra vinculado.
    for (const v of vinculos) {
        try {
            await projetoService.findOne(tipo, v.projeto_id, user, 'ReadWriteTeam');
            return;
        } catch {
            // sem escrita neste vínculo; tenta o próximo
        }
    }
    throw new HttpException(
        'Você não tem permissão de escrita em nenhuma obra/projeto vinculada a este contrato',
        400
    );
}
