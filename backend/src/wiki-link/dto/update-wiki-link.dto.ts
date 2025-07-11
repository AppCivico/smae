import { PickType } from '@nestjs/swagger';
import { CreateWikiLinkDto } from './create-wiki-link.dto';

// se quiser atualizar, todos os campos do CreateWikiLinkDto são obrigatórios, n faz sentido deixar não required o url_wiki
export class UpdateWikiLinkDto extends PickType(CreateWikiLinkDto, ['url_wiki']) {}
