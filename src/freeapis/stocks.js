const toStooqSymbol = (input) => {
  const sym = input.trim().toLowerCase();
  if (!sym) return "";
  if (sym.includes(".")) return sym;
  return `${sym}.us`;
};

const fromStooqSymbol = (stooq) => stooq.toUpperCase();

const parseStooqDate = (yyyymmdd) => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd || "-";
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
};

const formatNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("en-US") : "-";
};

const fetchSingle = async (symbolRaw) => {
  const stooqSymbol = toStooqSymbol(symbolRaw);
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqSymbol)}&i=d`;
  const data = await fetch(url).then((r) => r.text());
  const line = data.trim();
  if (!line || line.includes("N/D") || line.toLowerCase().includes("no data")) {
    throw new Error(`no data for ${symbolRaw}`);
  }
  const cols = line.split(",").map((x) => x.trim()).filter((x) => x.length > 0);
  if (cols.length < 8) {
    throw new Error(`unexpected response for ${symbolRaw}`);
  }
  return {
    symbol: fromStooqSymbol(cols[0]),
    date: parseStooqDate(cols[1]),
    time: cols[2],
    open: cols[3],
    high: cols[4],
    low: cols[5],
    close: cols[6],
    volume: cols[7]
  };
};

export const getStockQuote = async (symbolsRaw) => {
  const symbols = symbolsRaw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (symbols.length === 0) {
    return "usage: stock: AAPL,MSFT or stock: aapl.us";
  }

  try {
    const rows = [];
    for (const sym of symbols) {
      try {
        rows.push(await fetchSingle(sym));
      } catch (err) {
        rows.push({ symbol: sym.toUpperCase(), error: err.message });
      }
    }

    const lines = rows.map((r) => {
      if (r.error) return `${r.symbol} | error: ${r.error}`;
      return (
        `${r.symbol} | close ${formatNum(r.close)} | ` +
        `open ${formatNum(r.open)} high ${formatNum(r.high)} low ${formatNum(r.low)} | ` +
        `vol ${formatNum(r.volume)} | ${r.date}`
      );
    });

    return `[STOCK]\\n${lines.join("\\n")}\\nNote: source=Stooq daily quotes (free, no-key).`;
  } catch (err) {
    return `[STOCK] failed: ${err.message}`;
  }
};
