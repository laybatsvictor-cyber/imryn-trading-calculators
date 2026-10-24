import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const c = createRequire(import.meta.url)('./calc.js');
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('Kelly for an even-money bet is 2p - 1', () => {
  near(c.kellyTrading(0.6, 1).kelly, 0.2);
  near(c.kellyTrading(0.55, 1).kelly, 0.1);
});
test('Kelly with a payoff ratio: f = p - q / R', () => {
  near(c.kellyTrading(0.55, 2).kelly, 0.325);
  near(c.kellyTrading(0.4, 2).kelly, 0.1);
  assert.equal(c.kellyTrading(0.3, 2).noEdge, true);
});
test('general binary Kelly f = p / l - q / g and log growth', () => {
  near(c.kellyBinary(0.5, 1, 0.5).kelly, 0.5);
  const k = c.kellyBinary(0.6, 1, 1);
  near(k.growthFull, 0.6 * Math.log(1.2) + 0.4 * Math.log(0.8));
  assert.ok(k.growthHalf > 0 && k.growthHalf < k.growthFull);
  // Betting twice Kelly gives zero growth to first order and is worse than full Kelly.
  assert.ok(k.growthDouble < k.growthFull);
});
test('continuous Kelly (mu - r) / sigma^2', () => {
  near(c.kellyContinuous(0.08, 0.03, 0.2).kelly, 1.25);
  assert.equal(c.kellyContinuous(0.08, 0.03, 0.2).leverage, true);
});
test('position size from account risk and stop distance', () => {
  const p = c.positionSize({ account: 10000, riskPct: 1, entry: 50, stop: 48 });
  assert.equal(p.units, 50); near(p.positionValue, 2500); near(p.exposurePct, 25); assert.equal(p.side, 'long');
  const s = c.positionSize({ account: 25000, riskPct: 0.5, entry: 100, stop: 103 });
  assert.equal(s.units, 41); assert.equal(s.side, 'short'); near(s.actualRisk, 123);
  const f = c.positionSize({ account: 10000, riskPct: 2, entry: 4500, stop: 4480, multiplier: 5 });
  assert.equal(f.units, 2);
  const crypto = c.positionSize({ account: 1000, riskPct: 1, entry: 60000, stop: 58500, lotStep: 0.0001 });
  near(crypto.units, 0.0066);
  assert.throws(() => c.positionSize({ account: 1000, riskPct: 1, entry: 10, stop: 10 }), /differ/);
});
test('CAGR', () => {
  near(c.cagr(10000, 20000, 5).cagr, Math.pow(2, 0.2) - 1);
  near(c.cagr(100, 100, 3).cagr, 0);
  near(c.cagr(1000, 500, 2).cagr, Math.sqrt(0.5) - 1);
  near(c.yearsBetween('2020-01-01', '2024-01-01'), 1461 / 365.25);
  near(c.futureValue(1000, 0.1, 2), 1210, 1e-9);
});
