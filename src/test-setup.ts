import { installJQueryPlugins, resetTestDoubles } from 'app/shared/test/test-environment';

beforeAll(() => installJQueryPlugins(globalThis as unknown as Record<string, unknown>));
afterEach(resetTestDoubles);
