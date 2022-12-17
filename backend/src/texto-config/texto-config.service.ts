import { Injectable } from '@nestjs/common';
import { UpdateTextoConfigDto } from './dto/update-texto-config.dto';

@Injectable()
export class TextoConfigService {
    update(id: number, updateTextoConfigDto: UpdateTextoConfigDto) {
        return `This action updates a #${id} textoConfig`;
    }
}
