import { parseAndValidateImportJson, MAX_IMPORT_MEALS } from '../services/exportSchemaValidator';

describe('exportSchemaValidator', () => {
  it('accepts minimal valid export', () => {
    const json = JSON.stringify({
      version: '1.0.0',
      export_date: new Date().toISOString(),
      meals: [{ id: '1', timestamp: new Date().toISOString(), analysis: {} }],
    });
    const data = parseAndValidateImportJson(json);
    expect((data as { version: string }).version).toBe('1.0.0');
  });

  it('rejects missing version', () => {
    const json = JSON.stringify({
      export_date: new Date().toISOString(),
      meals: [],
    });
    expect(() => parseAndValidateImportJson(json)).toThrow('version');
  });

  it('rejects too many meals', () => {
    const meals = Array.from({ length: MAX_IMPORT_MEALS + 1 }, (_, i) => ({
      id: String(i),
      timestamp: new Date().toISOString(),
    }));
    const json = JSON.stringify({
      version: '1.0.0',
      export_date: new Date().toISOString(),
      meals,
    });
    expect(() => parseAndValidateImportJson(json)).toThrow('too many meals');
  });

  it('rejects invalid JSON', () => {
    expect(() => parseAndValidateImportJson('{')).toThrow('not valid JSON');
  });
});
