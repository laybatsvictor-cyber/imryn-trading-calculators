# IMRYN trading calculators

Pure, dependency-free JavaScript functions for three common sizing and performance calculations, with tests. The same file powers the free in-browser calculators on imryn.com:

- [Kelly criterion calculator](https://imryn.com/guides/kelly-criterion-calculator/)
- [Position size calculator](https://imryn.com/guides/position-size-calculator/)
- [CAGR calculator](https://imryn.com/guides/cagr-calculator/)

Educational code, not financial advice. The functions do not know your costs, taxes or the real distribution of your returns.

## Functions

| Function | Formula |
| --- | --- |
| `kellyBinary(p, g, l)` | f = p / l - q / g, with q = 1 - p, g the fraction of the stake gained on a win and l the fraction lost on a loss (Kelly 1956). Also returns half and quarter Kelly and the expected log growth G(f) = p ln(1 + g f) + q ln(1 - l f). |
| `kellyTrading(winRate, payoffRatio)` | Trading form with a full loss of the amount risked: f = p - q / R, with R = average win / average loss. |
| `kellyContinuous(mu, r, sigma)` | Continuous approximation f = (mu - r) / sigma^2 (annual figures as decimals). Flags results above 100 %, which imply leverage. |
| `positionSize({account, riskPct, entry, stop, multiplier, lotStep})` | Units = (account x risk %) / (abs(entry - stop) x multiplier), rounded down to the unit step. Returns side, position value, exposure, actual risk and a leverage flag. |
| `cagr(start, end, years)` | (end / start)^(1 / years) - 1, plus total return and multiple. `yearsBetween(startIso, endIso)` uses days / 365.25. |

## Usage

```js
const c = require('./calc.js');
c.kellyTrading(0.55, 2).kelly;   // 0.325
c.positionSize({ account: 10000, riskPct: 1, entry: 50, stop: 48 }).units; // 50
c.cagr(10000, 20000, 5).cagr;    // 0.1487 (rounded)
```

In a browser, load `calc.js` with a script tag and use `window.ImrynCalc`.

## Tests

```bash
node --test calc.test.mjs
```

## Limits

- Kelly inputs are estimates. An overestimated edge leads to over-betting, and the formulas assume independent repeated bets with known odds.
- A stop is not a guaranteed exit price, and fees, financing and spreads are not included in the position size.
- CAGR is distorted by deposits and withdrawals and says nothing about volatility or drawdowns.

## Sources

- Kelly, J. L. (1956). A New Interpretation of Information Rate. Bell System Technical Journal, 35(4), 917-926. https://doi.org/10.1002/j.1538-7305.1956.tb03809.x
- Kelly criterion, Wikipedia (read 24 October 2026). https://en.wikipedia.org/wiki/Kelly_criterion

## License

MIT. By Victor Laybats for IMRYN, an IVRYN product.
