import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
// import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { ParlamentarService } from './parlamentar.service';
import { CreateParlamentarDto } from './dto/create-parlamentar.dto';
import { ListParlamentarDto, ParlamentarDetailDto } from './entities/parlamentar.entity';
import { UpdateParlamentarDto } from './dto/update-parlamentar.dto';

@ApiTags('Parlamentar')
@Controller('parlamentar')
export class ParlamentarController {
    constructor(private readonly parlamentarService: ParlamentarService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroOrgao.inserir')
    async create(@Body() dto: CreateParlamentarDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.parlamentarService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListParlamentarDto> {
        return { linhas: await this.parlamentarService.findAll() };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('Projeto.administrar_portfolios', 'Projeto.administrador_no_orgao', ...PROJETO_READONLY_ROLES)
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<ParlamentarDetailDto> {
        return await this.parlamentarService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroOrgao.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateParlamentarDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.parlamentarService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    // @Roles('CadastroOrgao.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.parlamentarService.remove(+params.id, user);
        return '';
    }
}
