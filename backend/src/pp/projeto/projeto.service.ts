import { Injectable } from '@nestjs/common';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ProjetoDetailDto, ProjetoDto } from './entities/projeto.entity';

@Injectable()
export class ProjetoService {
    async create(createProjetoDto: CreateProjetoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        throw '...'
    }

    async findAll(user: PessoaFromJwt): Promise<ProjetoDto[]> {
        throw '...'
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<ProjetoDetailDto> {
        throw '...'
    }

    async update(id: number, updateProjetoDto: UpdateProjetoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        throw '...'
    }

    async remove(id: number, user: PessoaFromJwt) {

        return;
    }
}
