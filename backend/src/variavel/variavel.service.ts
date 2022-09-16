import { Injectable } from '@nestjs/common';
import { CreateVariavelDto } from './dto/create-variavel.dto';
import { UpdateVariavelDto } from './dto/update-variavel.dto';

@Injectable()
export class VariavelService {
    create(createVariavelDto: CreateVariavelDto) {
        return 'This action adds a new variavel';
    }

    findAll() {
        return `This action returns all variavel`;
    }

    findOne(id: number) {
        return `This action returns a #${id} variavel`;
    }

    update(id: number, updateVariavelDto: UpdateVariavelDto) {
        return `This action updates a #${id} variavel`;
    }

    remove(id: number) {
        return `This action removes a #${id} variavel`;
    }
}
