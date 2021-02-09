import { createConnection } from 'typeorm';
import { Package } from './entity/Package';
import { Vulnerability } from './entity/Vulnerability';
import { PackageRepository } from './repository/PackageRepository';

const connection = createConnection({
  type: 'better-sqlite3',
  database: 'ghsa.sqlite',
  logging: true,
  synchronize: true,
  entities: [Package, Vulnerability],
});
export const packageRepository = connection.then((connection) =>
  connection.getCustomRepository(PackageRepository)
);
export const vulnerabilityRepository = connection.then((connection) =>
  connection.getRepository(Vulnerability)
);

export { Package } from './entity/Package';
export { Vulnerability } from './entity/Vulnerability';
