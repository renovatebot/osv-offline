import { downloadDb } from './download';
import * as db from './db';
import { Package } from 'ghsa-offline-db';

export class GhsaOffline {
  private constructor() {}

  static async create() {
    const instance = new GhsaOffline();
    await instance.initialize();
    return instance;
  }

  private async initialize() {
    await downloadDb();
  }

  getComposerPackage(packageName: string): Promise<Package | undefined> {
    return db.getComposerPackage(packageName);
  }

  getMavenPackage(packageName: string): Promise<Package | undefined> {
    return db.getMavenPackage(packageName);
  }

  getNpmPackage(packageName: string): Promise<Package | undefined> {
    return db.getNpmPackage(packageName);
  }

  getNugetPackage(packageName: string): Promise<Package | undefined> {
    return db.getNugetPackage(packageName);
  }

  getPipPackage(packageName: string): Promise<Package | undefined> {
    return db.getPipPackage(packageName);
  }

  getRubyGemsPackage(packageName: string): Promise<Package | undefined> {
    return db.getRubyGemsPackage(packageName);
  }
}
