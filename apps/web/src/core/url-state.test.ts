import { parseUrlState, serializeUrlState } from './url-state';

describe('URL state privacy boundary', () => {
  it('serializes only allowlisted non-sensitive filter state', () => {
    const query = serializeUrlState({
      tab: 'orders',
      sort: 'updatedAt',
      cursor: 'cursor-2',
      filter: {
        status: 'OPEN',
        type: 'export',
        q: 'private contact@example.test',
        filename: 'secret.pdf',
      },
    });

    expect(query.toString()).toBe(
      'tab=orders&sort=updatedAt&cursor=cursor-2&filter%5Bstatus%5D=OPEN&filter%5Btype%5D=export',
    );
    expect(query.toString()).not.toContain('private');
    expect(query.toString()).not.toContain('secret.pdf');
    expect(window.history.length).toBe(1);
  });

  it('ignores unknown and sensitive query keys when reading state', () => {
    const state = parseUrlState(
      new URLSearchParams(
        'tab=orders&sort=updatedAt&filter%5Bstatus%5D=OPEN&filter%5Bq%5D=private&contact=person@example.test',
      ),
    );

    expect(state).toEqual({
      tab: 'orders',
      sort: 'updatedAt',
      filter: { status: 'OPEN' },
    });
  });
});
