import { deleteUnlessSystemDatabase, indexQueryOf } from './db-utils';

describe('db-utils', () => {

  it('#indexQueryOf should define index with design doc prefix', () => {

    // when
    const query = indexQueryOf('a.b');

    // then
    expect(query).toEqual({ index: { fields: ['a\\.b'] }, ddoc: 'index_a.b' });
  });

  it('#deleteUnlessSystemDatabase should delete user database', async () => {

    // given
    const del = vi.fn().mockResolvedValue('deleted');

    // when
    const result = await deleteUnlessSystemDatabase('db1', del);

    // then
    expect(result).toBe('deleted');
    expect(del).toHaveBeenCalledOnce();
  });

  it('#deleteUnlessSystemDatabase should reject system database', async () => {

    // given
    const del = vi.fn();

    // when
    const deletion = deleteUnlessSystemDatabase('_users', del);

    // then
    await expect(deletion).rejects.toBe('You have no permission to delete the system database _users');
    expect(del).not.toHaveBeenCalled();
  });
});
