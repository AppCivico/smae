import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { PessoaService } from './pessoa.service';

@ApiTags('pessoas')
@Controller('pessoa')
export class PessoaController {
    constructor(private readonly pessoaService: PessoaService) { }

    @Post()
    create(@Body() createPessoaDto: CreatePessoaDto) {
        return this.pessoaService.create(createPessoaDto);
    }
}
