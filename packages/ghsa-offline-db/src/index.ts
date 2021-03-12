import { tmpdir } from 'os';
import path from 'path';
import { createConnection } from 'typeorm';
import { Package } from './entity/Package';
import { Vulnerability } from './entity/Vulnerability';
import { PackageRepository } from './repository/PackageRepository';

export const dbFileName = 'ghsa.sqlite';
export const dbDirectory = path.join(tmpdir(), 'ghsa-offline');
export const dbPath = path.join(dbDirectory, 'ghsa.sqlite');

const connection = createConnection({
  type: 'better-sqlite3',
  synchronize: true,
  database: dbPath,
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
