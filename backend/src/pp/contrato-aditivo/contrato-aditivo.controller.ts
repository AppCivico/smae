import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
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
        await this.projetoService.findOne('PP', await this.buscaContrato(params.id, user), user, 'ReadWriteTeam');
        return await this.contratoAditivoService.create(+params.id, createContratoAditivoDto, user);
    }

    @Get(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListContratoAditivoDto> {
        await this.projetoService.findOne('PP', await this.buscaContrato(params.id, user), user, 'ReadOnly');
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
        await this.projetoService.findOne('PP', await this.buscaContrato(params.id, user), user, 'ReadWriteTeam');
        return await this.contratoAditivoService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...roles])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('PP', await this.buscaContrato(params.id, user), user, 'ReadWriteTeam');
        await this.contratoAditivoService.remove(+params.id, +params.id2, user);
        return '';
    }

    private async buscaContrato(id: number, user: PessoaFromJwt): Promise<number> {
        return buscaProjetoDoContrato(this.prisma, 'PP', id, user);
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
        await this.projetoService.findOne('MDO', await this.buscaContrato(params.id, user), user, 'ReadWriteTeam');
        return await this.contratoAditivoService.create(+params.id, createContratoAditivoDto, user);
    }

    @Get(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListContratoAditivoDto> {
        await this.projetoService.findOne('MDO', await this.buscaContrato(params.id, user), user, 'ReadOnly');
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
        await this.projetoService.findOne('MDO', await this.buscaContrato(params.id, user), user, 'ReadWriteTeam');
        return await this.contratoAditivoService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.projetoService.findOne('MDO', await this.buscaContrato(params.id, user), user, 'ReadWriteTeam');
        await this.contratoAditivoService.remove(+params.id, +params.id2, user);
        return '';
    }

    private async buscaContrato(id: number, user: PessoaFromJwt): Promise<number> {
        return buscaProjetoDoContrato(this.prisma, 'MDO', id, user);
    }
}

/**
 * Resolve qual projeto/obra usar para a checagem de permissão de um contrato (possivelmente compartilhado).
 *
 * Em vez de pegar um vínculo arbitrário, restringe a busca aos projetos VISÍVEIS ao usuário — usando o mesmo
 * conjunto de permissão (`ProjetoGetPermissionSet`) das listagens. Assim, para um contrato compartilhado entre
 * vários projetos, a permissão é verificada contra um projeto que o usuário realmente enxerga, e não contra um
 * projeto qualquer (que poderia negar indevidamente quem tem acesso por outro vínculo). Sem novos parâmetros.
 *
 * Observação: o conjunto reflete VISIBILIDADE; a permissão de escrita ('ReadWriteTeam') continua sendo validada
 * pelo `projetoService.findOne` no controller, sobre o projeto retornado aqui.
 */
async function buscaProjetoDoContrato(
    prisma: PrismaService,
    tipo: TipoProjeto,
    contrato_id: number,
    user: PessoaFromJwt
): Promise<number> {
    const permissionsSet = await ProjetoGetPermissionSet(tipo, user);

    const vinculo = await prisma.contratoProjeto.findFirst({
        where: {
            contrato_id: contrato_id,
            removido_em: null,
            contrato: { removido_em: null },
            // só vínculos cujo projeto o usuário pode ver (já inclui tipo, removido_em e portfólio)
            projeto: { AND: permissionsSet },
        },
        orderBy: { id: 'asc' },
        select: { projeto_id: true },
    });
    if (!vinculo) throw new Error('Contrato não encontrado');
    return vinculo.projeto_id;
}
