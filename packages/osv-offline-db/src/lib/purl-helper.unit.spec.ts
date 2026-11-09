import { describe, expect, test } from 'vitest';
import type { Ecosystem } from './ecosystem.ts';
import { packageToPurl, purlWithoutQualifiers } from './purl-helper.ts';

describe('packages/osv-offline-db/src/lib/purl-helper.unit', () => {
  describe('test ecosystems', () => {
    test.each`
      ecosystem      | packageName                         | purl
      ${'crates.io'} | ${'libpulse-binding'}               | ${'pkg:cargo/libpulse-binding'}
      ${'Go'}        | ${'github.com/hashicorp/consul'}    | ${'pkg:golang/github.com/hashicorp/consul'}
      ${'Hackage'}   | ${'aeson'}                          | ${'pkg:hackage/aeson'}
      ${'Hex'}       | ${'sweet_xml'}                      | ${'pkg:hex/sweet_xml'}
      ${'Julia'}     | ${'HTTP'}                           | ${'pkg:julia/HTTP'}
      ${'Maven'}     | ${'org.apache.struts:struts2-core'} | ${'pkg:maven/org.apache.struts/struts2-core'}
      ${'npm'}       | ${'@hapi/hoek'}                     | ${'pkg:npm/%40hapi/hoek'}
      ${'NuGet'}     | ${'Microsoft.ChakraCore'}           | ${'pkg:nuget/Microsoft.ChakraCore'}
      ${'Packagist'} | ${'typo3/cms-core'}                 | ${'pkg:composer/typo3/cms-core'}
      ${'Pub'}       | ${'dio'}                            | ${'pkg:pub/dio'}
      ${'PyPI'}      | ${'django'}                         | ${'pkg:pypi/django'}
      ${'RubyGems'}  | ${'rails-html-sanitizer'}           | ${'pkg:gem/rails-html-sanitizer'}
    `('$ecosystem | $packageName', ({ ecosystem, packageName, purl }) => {
      expect(packageToPurl(ecosystem as Ecosystem, packageName as string)).toBe(purl);
    });
  });

  describe('purlWithoutQualifiers', () => {
    test.each`
      purl                                                                              | expected
      ${'pkg:pypi/django'}                                                              | ${'pkg:pypi/django'}
      ${'pkg:composer/drupal/token?repository_url=https:%2F%2Fpackages.drupal.org%2F8'} | ${'pkg:composer/drupal/token'}
      ${'pkg:golang/github.com/hashicorp/consul#api'}                                   | ${'pkg:golang/github.com/hashicorp/consul'}
    `('$purl', ({ purl, expected }) => {
      expect(purlWithoutQualifiers(purl as string)).toBe(expected);
    });
  });
});
