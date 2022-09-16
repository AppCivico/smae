import { Injectable } from '@nestjs/common';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import { CreateVariavelDto } from './dto/create-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';

@Injectable()
export class VariavelService {
    create(createVariavelDto: CreateVariavelDto, user: PessoaFromJwt) {

        return { id: 0 };
    }

}
