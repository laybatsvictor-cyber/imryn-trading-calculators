/* IMRYN calculators: Kelly criterion, position size, CAGR.
 * Browser (window.ImrynCalc) and Node (module.exports). Pure functions, no network.
 */
(function (root) {
  'use strict';

  function num(x, name) {
    var v = typeof x === 'string' ? parseFloat(x.replace(',', '.')) : x;
    if (typeof v !== 'number' || !isFinite(v)) throw new Error(name + ' must be a number');
    return v;
  }

  // Kelly, binary outcome (Kelly 1956; general form f = p/l - q/g).
  // p: win probability (0-1), g: fraction of the stake gained on a win, l: fraction lost on a loss.
  function kellyBinary(p, g, l) {
    p = num(p, 'Win probability'); g = num(g, 'Gain'); l = num(l == null ? 1 : l, 'Loss');
    if (p <= 0 || p >= 1) throw new Error('Win probability must be between 0 and 100 %');
    if (g <= 0) throw new Error('Gain must be above 0');
    if (l <= 0 || l > 1) throw new Error('Loss fraction must be above 0 and at most 100 %');
    var q = 1 - p;
    var f = p / l - q / g;
    var growth = function (frac) {
      if (frac <= 0) return 0;
      if (1 - l * frac <= 0) return -Infinity;
      return p * Math.log(1 + g * frac) + q * Math.log(1 - l * frac);
    };
    var edge = p * g - q * l; // expected gain per unit staked
    return {
      kelly: f, half: f / 2, quarter: f / 4, edge: edge,
      growthFull: growth(f), growthHalf: growth(f / 2), growthQuarter: growth(f / 4),
      growthDouble: growth(2 * f), noEdge: f <= 0
    };
  }

  // Kelly for trading inputs: win rate and payoff ratio R = average win / average loss.
  function kellyTrading(winRate, payoffRatio) {
    return kellyBinary(winRate, num(payoffRatio, 'Win/loss ratio'), 1);
  }

  // Continuous approximation f = (mu - r) / sigma^2 (annual figures, as decimals).
  function kellyContinuous(mu, r, sigma) {
    mu = num(mu, 'Expected return'); r = num(r, 'Risk-free rate'); sigma = num(sigma, 'Volatility');
    if (sigma <= 0) throw new Error('Volatility must be above 0');
    var f = (mu - r) / (sigma * sigma);
    return { kelly: f, half: f / 2, quarter: f / 4, noEdge: f <= 0, leverage: f > 1 };
  }

  // Fixed fractional position size.
  function positionSize(o) {
    var account = num(o.account, 'Account size'), riskPct = num(o.riskPct, 'Risk per trade');
    var entry = num(o.entry, 'Entry price'), stop = num(o.stop, 'Stop price');
    var mult = o.multiplier == null || o.multiplier === '' ? 1 : num(o.multiplier, 'Multiplier');
    var step = o.lotStep == null || o.lotStep === '' ? 1 : num(o.lotStep, 'Unit step');
    if (account <= 0) throw new Error('Account size must be above 0');
    if (riskPct <= 0 || riskPct > 100) throw new Error('Risk per trade must be above 0 and at most 100 %');
    if (entry <= 0 || stop <= 0) throw new Error('Prices must be above 0');
    if (entry === stop) throw new Error('Stop must differ from entry');
    if (mult <= 0 || step <= 0) throw new Error('Multiplier and unit step must be above 0');
    var riskAmount = account * riskPct / 100;
    var perUnit = Math.abs(entry - stop) * mult;
    var raw = riskAmount / perUnit;
    var units = Math.floor(raw / step + 1e-9) * step;
    units = Math.round(units * 1e8) / 1e8;
    var value = units * entry * mult;
    return {
      side: stop < entry ? 'long' : 'short', riskAmount: riskAmount, riskPerUnit: perUnit,
      unitsExact: raw, units: units, positionValue: value, actualRisk: units * perUnit,
      exposurePct: value / account * 100, stopDistancePct: Math.abs(entry - stop) / entry * 100,
      leveraged: value > account
    };
  }

  // Compound annual growth rate.
  function yearsBetween(startIso, endIso) {
    var a = Date.parse(startIso + 'T00:00:00Z'), b = Date.parse(endIso + 'T00:00:00Z');
    if (!isFinite(a) || !isFinite(b)) throw new Error('Dates must be valid');
    if (b <= a) throw new Error('End date must be after start date');
    return (b - a) / 86400000 / 365.25;
  }
  function cagr(start, end, years) {
    start = num(start, 'Start value'); end = num(end, 'End value'); years = num(years, 'Years');
    if (start <= 0) throw new Error('Start value must be above 0');
    if (end < 0) throw new Error('End value cannot be negative');
    if (years <= 0) throw new Error('Period must be above 0');
    var rate = Math.pow(end / start, 1 / years) - 1;
    return { cagr: rate, totalReturn: end / start - 1, multiple: end / start, years: years };
  }
  function futureValue(start, rate, years) {
    return num(start, 'Start value') * Math.pow(1 + num(rate, 'Rate'), num(years, 'Years'));
  }

  var api = { kellyBinary: kellyBinary, kellyTrading: kellyTrading, kellyContinuous: kellyContinuous, positionSize: positionSize, cagr: cagr, yearsBetween: yearsBetween, futureValue: futureValue };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ImrynCalc = api;
})(this);
