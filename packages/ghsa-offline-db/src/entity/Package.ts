import {
  BaseEntity,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Vulnerability } from './Vulnerability';

@Entity()
export class Package extends BaseEntity {
  @PrimaryColumn()
  ecosystem!: string;

  @PrimaryColumn()
  packageName!: string;

  @OneToMany('Vulnerability', 'package')
  vulnerabilities!: Vulnerability[];
}
