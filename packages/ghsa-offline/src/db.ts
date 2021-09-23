import { packageRepository } from '@jamiemagee/ghsa-offline-db';

export const getComposerPackage = (packageName: string) =>
  packageRepository.then((packageRepository) => {
    return packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem: 'COMPOSER' })
      .where('p.packageName = :packageName', { packageName: packageName })
      .getOne();
  });

export const getGoPackage = (packageName: string) =>
  packageRepository.then((packageRepository) => {
    return packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem: 'GO' })
      .where('p.packageName = :packageName', { packageName: packageName })
      .getOne();
  });

export const getMavenPackage = (packageName: string) =>
  packageRepository.then((packageRepository) => {
    return packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem: 'MAVEN' })
      .where('p.packageName = :packageName', { packageName: packageName })
      .getOne();
  });

export const getNpmPackage = (packageName: string) =>
  packageRepository.then((packageRepository) => {
    return packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem: 'NPM' })
      .where('p.packageName = :packageName', { packageName: packageName })
      .getOne();
  });

export const getNugetPackage = (packageName: string) =>
  packageRepository.then((packageRepository) => {
    return packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem: 'NUGET' })
      .where('p.packageName = :packageName', { packageName: packageName })
      .getOne();
  });

export const getPipPackage = (packageName: string) =>
  packageRepository.then((packageRepository) => {
    return packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem: 'PIP' })
      .where('p.packageName = :packageName', { packageName: packageName })
      .getOne();
  });

export const getRubyGemsPackage = (packageName: string) =>
  packageRepository.then((packageRepository) => {
    return packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem: 'RUBYGEMS' })
      .where('p.packageName = :packageName', { packageName: packageName })
      .getOne();
  });

export const getRustPackage = (packageName: string) =>
  packageRepository.then((packageRepository) => {
    return packageRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.vulnerabilities', 'v')
      .where('p.ecosystem = :ecosystem', { ecosystem: 'RUST' })
      .where('p.packageName = :packageName', { packageName: packageName })
      .getOne();
  });
