import { Injectable } from '@nestjs/common';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';

@Injectable()
export class ProjetoService {
  create(createProjetoDto: CreateProjetoDto) {
    return 'This action adds a new projeto';
  }

  findAll() {
    return `This action returns all projeto`;
  }

  findOne(id: number) {
    return `This action returns a #${id} projeto`;
  }

  update(id: number, updateProjetoDto: UpdateProjetoDto) {
    return `This action updates a #${id} projeto`;
  }

  remove(id: number) {
    return `This action removes a #${id} projeto`;
  }
}
