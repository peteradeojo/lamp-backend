import { Repository } from "typeorm";

export abstract class EntityService {
  protected appRepository: Repository<any>;
}