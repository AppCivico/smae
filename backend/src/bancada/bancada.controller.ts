import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { FindOneParams } from '../common/decorators/find-params';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { BancadaService } from './bancada.service';
import { CreateBancadaDto } from './dto/create-bancada.dto';
import { BancadaOneDto, ListBancadaDto } from './entities/bancada.entity';
import { UpdateBancadaDto } from './dto/update-bancada.dto';

@ApiTags('Bancada')
@Controller('bancada')
export class BancadaController {
    constructor(private readonly bancadaService: BancadaService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroBancada.inserir')
    async create(@Body() dto: CreateBancadaDto, @CurrentUser() user: PessoaFromJwt): Promise<RecordWithId> {
        return await this.bancadaService.create(dto, user);
    }

    @ApiBearerAuth('access-token')
    @Get()
    async findAll(): Promise<ListBancadaDto> {
        return { linhas: await this.bancadaService.findAll() };
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroBancada.editar', 'CadastroBancada.inserir')
    async findOne(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<BancadaOneDto> {
        return await this.bancadaService.findOne(params.id, user);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroBancada.editar')
    async update(
        @Param() params: FindOneParams,
        @Body() dto: UpdateBancadaDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        return await this.bancadaService.update(+params.id, dto, user);
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiUnauthorizedResponse()
    @Roles('CadastroBancada.remover')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.ACCEPTED)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt) {
        await this.bancadaService.remove(+params.id, user);
        return  '';
    }
}
