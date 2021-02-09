import { EntityRepository, Repository } from 'typeorm';
import { Package } from '../entity/Package';

@EntityRepository(Package)
export class PackageRepository extends Repository<Package> {
  async saveIfNotExist(p: Partial<Package>): Promise<void> {
    const existing = await this.findOne({
      ecosystem: p.ecosystem,
      packageName: p.packageName,
    });
    if (existing === undefined) {
      await this.save(p);
    }
  }
}
