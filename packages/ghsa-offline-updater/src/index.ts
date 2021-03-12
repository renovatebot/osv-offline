import fs from 'fs-extra';
import { GithubSecurityAdvisory } from './types';
import {
  dbPath,
  packageRepository,
  vulnerabilityRepository,
} from 'ghsa-offline-db';
import { GitHub } from './github';
import {
  convertToPackage,
  convertToVulnerability,
  VulnList,
} from './vuln-list';
import signale from 'signale';

(async () => {
  try {
    await fs.remove(dbPath);
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
        signale.success(`${p.packageName}: ${v.id}`);
      }
    )
  );

  var gh = new GitHub();
  await gh.uploadDatabase(dbPath);
})();
