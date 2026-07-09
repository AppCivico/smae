import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { EleicaoService } from './eleicao.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateEleicaoDto } from './dto/create-eleicao.dto';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { FilterEleicaoDto } from './dto/filter-eleicao.dto';
import { Eleicao } from '@prisma/client';
import { FindOneParams } from 'src/common/decorators/find-params';
import { UpdateEleicaoDto } from './dto/update-eleicao.dto';
import { Logger } from '@nestjs/common';
import { ListEleicaoDto } from './entity/eleicao.entity';

@ApiTags('Eleição')
@Controller('eleicao')
export class EleicaoController {
    constructor(private readonly eleicaoService: EleicaoService) {}

    @Post()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async create(
        @Body() createEleicaoDto: CreateEleicaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const created = await this.eleicaoService.create(createEleicaoDto, user);
        return { id: created.id };
    }

    @Get()
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async findAll(@Query() filters: FilterEleicaoDto): Promise<ListEleicaoDto[]> {
        return this.eleicaoService.findAll(filters);
    }

    @Get(':id')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async findOne(@Param() params: FindOneParams): Promise<Eleicao> {
        return this.eleicaoService.findOne(params.id);
    }

    @Patch(':id')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    async update(
        @Param() params: FindOneParams,
        @Body() updateEleicaoDto: UpdateEleicaoDto,
        @CurrentUser() user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const updated = await this.eleicaoService.update(params.id, updateEleicaoDto, user);
        return { id: updated.id };
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @Roles(['SMAE.superadmin'])
    @HttpCode(204)
    async remove(@Param() params: FindOneParams, @CurrentUser() user: PessoaFromJwt): Promise<void> {
        await this.eleicaoService.remove(params.id, user);
    }
}
