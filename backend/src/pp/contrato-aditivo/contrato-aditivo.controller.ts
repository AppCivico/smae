import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { ListaDePrivilegios } from 'src/common/ListaDePrivilegios';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { FindOneParams, FindTwoParams } from '../../common/decorators/find-params';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PROJETO_READONLY_ROLES_MDO } from '../projeto/projeto.controller';
import { CreateContratoAditivoDto } from './dto/create-contrato-aditivo.dto';
import { ListContratoAditivoDto } from './entities/contrato-aditivo.entity';
import { UpdateContratoAditivoDto } from './dto/update-contrato-aditivo.dto';
import { ContratoAditivoService } from './contrato-aditivo.service';

const rolesMDO: ListaDePrivilegios[] = [
    'ProjetoMDO.administrador',
    'ProjetoMDO.administrador_no_orgao',
    ...PROJETO_READONLY_ROLES_MDO,
];

@Controller('contrato')
@ApiTags('Projeto - Contrato Aditivo MDO')
export class ContratoAditivoMDOController {
    constructor(private readonly contratoAditivoService: ContratoAditivoService) {}

    @Post(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async create(
        @Param() params: FindOneParams,
        @Body() createContratoAditivoDto: CreateContratoAditivoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.contratoAditivoService.create(+params.id, createContratoAditivoDto, user);
    }

    @Get(':id/aditivo')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    async findAll(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ListContratoAditivoDto> {
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
        return await this.contratoAditivoService.update(+params.id, +params.id2, dto, user);
    }

    @Delete(':id/aditivo/:id2')
    @ApiBearerAuth('access-token')
    @Roles([...rolesMDO])
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindTwoParams, @CurrentUser() user: PessoaFromJwt) {
        await this.contratoAditivoService.remove(+params.id, +params.id2, user);
        return '';
    }
}
