/* global process, console */
import { Client } from 'pg';

const config = { host: '127.0.0.1', port: Number(process.env.REVIEW_PG_PORT), user: 'postgres', password: process.env.REVIEW_PG_PASSWORD, database: process.env.REVIEW_PG_DATABASE };
const org = '66666666-6666-4666-8666-666666666666';
const sku = '11111111-1111-4111-8111-111111111111';
const policy = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const quote = (id, currency, from, to, primary) => ({ text: `INSERT INTO catalog.price_policy (id, organization_id, sku_id, currency, unit_price, valid_from, valid_to, version, is_primary, risk_buffer_bps) VALUES ($1,$2,$3,$4,10.0000,$5,$6,1,$7,25)`, values: [id, org, sku, currency, from, to, primary] });
const clients = [new Client(config), new Client(config)];
for (const client of clients) await client.connect();
try {
  await clients[0].query('UPDATE catalog.price_policy SET is_primary = false, version = 2 WHERE id = $1 AND version = 1', [policy]);
  const stale = await clients[0].query('UPDATE catalog.price_policy SET risk_buffer_bps = 30, version = version + 1 WHERE id = $1 AND version = 1', [policy]);
  if (stale.rowCount !== 0) throw new Error('stale canonical policy writer unexpectedly updated a row');
  const current = await clients[0].query('UPDATE catalog.price_policy SET risk_buffer_bps = 30, version = version + 1 WHERE id = $1 AND version = 2', [policy]);
  if (current.rowCount !== 1) throw new Error('current canonical policy writer did not bump version');

  const adjacent1 = await clients[0].query(quote('21212121-2121-4212-8212-212121212121', 'EUR', '2027-01-01T00:00:00Z', '2027-02-01T00:00:00Z', false));
  const adjacent2 = await clients[0].query(quote('22222222-2222-4222-8222-222222222222', 'EUR', '2027-02-01T00:00:00Z', '2027-03-01T00:00:00Z', false));
  if (adjacent1.rowCount !== 1 || adjacent2.rowCount !== 1) throw new Error('half-open adjacent policy windows did not both apply');
  let overlapRejected = false;
  try { await clients[0].query(quote('23232323-2323-4232-8232-232323232323', 'EUR', '2027-01-15T00:00:00Z', '2027-01-20T00:00:00Z', false)); } catch { overlapRejected = true; }
  if (!overlapRejected) throw new Error('same-currency overlapping policy was accepted');

  await Promise.all(clients.map((client) => client.query('BEGIN')));
  const first = clients[0].query(quote('24242424-2424-4242-8242-242424242424', 'EUR', '2028-01-01T00:00:00Z', '2028-02-01T00:00:00Z', true));
  const second = clients[1].query(quote('25252525-2525-4252-8252-252525252525', 'GBP', '2028-01-01T00:00:00Z', '2028-02-01T00:00:00Z', true));
  const firstResult = await Promise.allSettled([first]);
  await clients[0].query('COMMIT');
  const concurrent = [...firstResult, await Promise.allSettled([second]).then((results) => results[0])];
  const applied = concurrent.filter((result) => result.status === 'fulfilled').length;
  const rejected = concurrent.filter((result) => result.status === 'rejected').length;
  await clients[1].query('ROLLBACK');
  if (applied !== 1 || rejected !== 1) throw new Error(`concurrent primary policy result was applied=${applied} rejected=${rejected}`);
  console.log(`POLICY_LIFECYCLE exit=0 staleRows=${stale.rowCount} currentRows=${current.rowCount} adjacent=2 overlapRejected=1 concurrentPrimary=1-applied/1-rejected lock=organization+sku canonicalVersion=3`);
} finally {
  for (const client of clients) await client.end();
}
