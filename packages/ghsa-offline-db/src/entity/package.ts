import { BaseEntity, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Vulnerability } from './vulnerability';

@Entity()
export class Package extends BaseEntity {
  @PrimaryColumn()
  ecosystem!: Ecosystem;

  @PrimaryColumn()
  packageName!: string;

  @OneToMany('Vulnerability', 'package')
  vulnerabilities!: Vulnerability[];
}

export type Ecosystem =
  | 'COMPOSER'
  | 'GO'
  | 'MAVEN'
  | 'NPM'
  | 'NUGET'
  | 'PIP'
  | 'RUBYGEMS'
  | 'RUST';
