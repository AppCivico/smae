import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { FindOneParams } from '../common/decorators/find-params';
import { DiretorioDto, FilterDiretorioDto, ListDiretorioDto } from './dto/diretorio.dto';
import { UploadDiretorioService } from './upload.diretorio.service';

@Controller('diretorio')
@ApiTags('Upload')
export class UploadDiretorioController {
    constructor(private readonly diretorioService: UploadDiretorioService) {}

    @Patch('')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async create(@Body() dto: DiretorioDto): Promise<void> {
        return await this.diretorioService.create(dto);
    }

    @Get('')
    @ApiBearerAuth('access-token')
    async get(@Query() filters: FilterDiretorioDto): Promise<ListDiretorioDto> {
        return { linhas: await this.diretorioService.listAll(filters) };
    }

    @Delete(':id')
    @ApiBearerAuth('access-token')
    @ApiNoContentResponse()
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param() params: FindOneParams): Promise<void> {
        await this.diretorioService.remove(params.id);
    }
}
