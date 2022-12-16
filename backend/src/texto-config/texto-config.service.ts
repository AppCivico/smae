import { Injectable } from '@nestjs/common';
import { CreateTextoConfigDto } from './dto/create-texto-config.dto';
import { UpdateTextoConfigDto } from './dto/update-texto-config.dto';

@Injectable()
export class TextoConfigService {
  create(createTextoConfigDto: CreateTextoConfigDto) {
    return 'This action adds a new textoConfig';
  }

  findAll() {
    return `This action returns all textoConfig`;
  }

  findOne(id: number) {
    return `This action returns a #${id} textoConfig`;
  }

  update(id: number, updateTextoConfigDto: UpdateTextoConfigDto) {
    return `This action updates a #${id} textoConfig`;
  }

  remove(id: number) {
    return `This action removes a #${id} textoConfig`;
  }
}
