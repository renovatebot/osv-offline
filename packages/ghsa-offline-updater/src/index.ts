import * as fs from 'fs/promises';
import { GithubSecurityAdvisory } from './types';
import { packageRepository, vulnerabilityRepository } from 'ghsa-offline-db';
import { GitHub } from './github';
import {
  convertToPackage,
  convertToVulnerability,
  VulnList,
} from './vuln-list';

const dbPath = './ghsa.sqlite';

(async () => {
  try {
    await fs.rm(dbPath);
  } catch (e) {}

  var vulnList = new VulnList();
  await vulnList.clone();
  const files = await vulnList.crawl();

  await Promise.all(
    files.map(
      async (file): Promise<void> => {
        var content = await fs.readFile(file, { encoding: 'utf-8' });
        const ghsa: GithubSecurityAdvisory = JSON.parse(content);

        const p = convertToPackage(ghsa);
        await (await packageRepository).saveIfNotExist(p);
        const v = convertToVulnerability(ghsa);
        await (await vulnerabilityRepository).save(v);
      }
    )
  );

  var gh = new GitHub();
  await gh.uploadDatabase(dbPath);
})();
