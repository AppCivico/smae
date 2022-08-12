import { Body, Controller, Post } from '@nestjs/common';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { PessoaService } from './pessoa.service';

@Controller('pessoa')
export class PessoaController {
    constructor(private readonly pessoaService: PessoaService) { }

    @Post()
    create(@Body() createPessoaDto: CreatePessoaDto) {
        return this.pessoaService.create(createPessoaDto);
    }
}
