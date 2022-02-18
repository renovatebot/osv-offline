import fs from 'fs-extra';
import type { GithubSecurityAdvisory } from './types';
import { GhsaOfflineDb, dbPath } from '@jamiemagee/ghsa-offline-db';
import { GitHub } from './github';
import {
  VulnList,
  convertToPackage,
  convertToVulnerability,
} from './vuln-list';
import signale from 'signale';

// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
  try {
    await fs.remove(dbPath);
    signale.info('Deleted existing database');
  } catch (e) {
    signale.info('No existing database found');
  }

  const vulnList = new VulnList();
  await vulnList.clone();
  const files = await vulnList.crawl();
  signale.info(`found ${files.length} vulnerabilities`);

  const ghsaOfflineDb = await GhsaOfflineDb.create();

  await Promise.all(
    files.map(async (file): Promise<void> => {
      const content = await fs.readFile(file, { encoding: 'utf-8' });
      const ghsa: GithubSecurityAdvisory = JSON.parse(content);

      const p = convertToPackage(ghsa);
      await ghsaOfflineDb.packageRepository.saveIfNotExist(p);
      const v = convertToVulnerability(ghsa);
      await ghsaOfflineDb.vulnerabilityRepository.save(v);
      signale.info(`${p.ecosystem}-${p.packageName}-${v.identifiers[0]}`);
    })
  );

  if (process.env.GITHUB_TOKEN) {
    signale.info('Uploading database');
    const gh = new GitHub();
    await gh.uploadDatabase(dbPath);
  } else {
    signale.warn('Skipping upload');
  }
})();
