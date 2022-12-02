import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DotacaoService } from './dotacao.service';
import { ValidateDotacaoDto } from './dto/dotacao.dto';

@ApiTags('Orçamento')
@Controller('dotacao')
export class DotacaoController {
    constructor(private readonly dotacaoService: DotacaoService) { }

    @Patch('validar')
    @ApiBearerAuth('access-token')
    validate(@Body() createDotacaoDto: ValidateDotacaoDto) {
        return this.dotacaoService.validate(createDotacaoDto);
    }

}
