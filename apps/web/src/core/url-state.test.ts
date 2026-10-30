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

  it.each([
    { state: { tab: 'person@example.test' }, key: 'tab' },
    { state: { sort: 'contact name' }, key: 'sort' },
    { state: { cursor: 'cursor@example.test' }, key: 'cursor' },
    { state: { cursor: 'x'.repeat(257) }, key: 'cursor' },
    { state: { filter: { status: 'secret filename.pdf' } }, key: 'filter[status]' },
    { state: { filter: { type: 'contact@example.test' } }, key: 'filter[type]' },
    { state: { filter: { state: 'free text with spaces' } }, key: 'filter[state]' },
    { state: { filter: { ownerId: 'person@example.test' } }, key: 'filter[ownerId]' },
  ])('drops unsafe values for $key instead of persisting them', ({ state, key }) => {
    const query = serializeUrlState(state);
    expect(query.has(key)).toBe(false);
    expect(query.toString()).not.toMatch(/@|filename|contact|secret|%20|\+/i);
  });

  it('fails closed when parsing values outside the route codecs', () => {
    const state = parseUrlState(new URLSearchParams([
      ['tab', 'customer@example.test'],
      ['sort', 'free text'],
      ['cursor', 'cursor@example.test'],
      ['filter[status]', 'secret filename.pdf'],
      ['filter[ownerId]', 'not-a-uuid'],
    ]));

    expect(state).toEqual({});
  });
});
