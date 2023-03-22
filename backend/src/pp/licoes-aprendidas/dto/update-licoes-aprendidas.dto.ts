import { PartialType } from "@nestjs/swagger";
import { CreateLicoesApreendidasDto } from "./create-licoes-aprendidas.dto";

export class UpdateLicoesAprendidasDto extends PartialType(CreateLicoesApreendidasDto) {}
