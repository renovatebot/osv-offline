import { packageToPurl } from './purl-helper';
import type { Ecosystem } from './ecosystem';
import { describe, expect, test } from 'vitest';

describe('packages/osv-offline-db/src/lib/purl-helper.unit', () => {
  describe('test ecosystems', () => {
    test.each`
      ecosystem      | packageName                         | purl
      ${'crates.io'} | ${'libpulse-binding'}               | ${'pkg:cargo/libpulse-binding'}
      ${'Go'}        | ${'github.com/hashicorp/consul'}    | ${'pkg:golang/github.com/hashicorp/consul'}
      ${'Hackage'}   | ${'aeson'}                          | ${'pkg:hackage/aeson'}
      ${'Hex'}       | ${'sweet_xml'}                      | ${'pkg:hex/sweet_xml'}
      ${'Maven'}     | ${'org.apache.struts:struts2-core'} | ${'pkg:maven/org.apache.struts/struts2-core'}
      ${'npm'}       | ${'@hapi/hoek'}                     | ${'pkg:npm/%40hapi/hoek'}
      ${'NuGet'}     | ${'Microsoft.ChakraCore'}           | ${'pkg:nuget/Microsoft.ChakraCore'}
      ${'Packagist'} | ${'typo3/cms-core'}                 | ${'pkg:composer/typo3/cms-core'}
      ${'Pub'}       | ${'dio'}                            | ${'pkg:pub/dio'}
      ${'PyPI'}      | ${'django'}                         | ${'pkg:pypi/django'}
      ${'RubyGems'}  | ${'rails-html-sanitizer'}           | ${'pkg:gem/rails-html-sanitizer'}
    `('$ecosystem | $packageName', ({ ecosystem, packageName, purl }) => {
      expect(packageToPurl(ecosystem as Ecosystem, packageName as string)).toBe(
        purl
      );
    });
  });
});
