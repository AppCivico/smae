import { PartialType } from '@nestjs/swagger';
import { CreatePessoaDto } from './create-pessoa.dto';

export class UpdatePessoaDto extends PartialType(CreatePessoaDto) { }
