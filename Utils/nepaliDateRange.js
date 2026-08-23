import NepaliDate from "nepali-date-converter";

// Nepal Standard Time is a fixed UTC+5:45 offset (no DST), so a plain
// constant is correct year-round — no timezone database needed.
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

// NepaliDate.parse(bsString).getAD() only ever does BS<->AD table lookups
// and UTC-safe Date math internally, so this conversion is correct
// regardless of what timezone the server process happens to be running in.
const bsStringToAdParts = (bsDateString) => {
  const { year, month, date } = NepaliDate.parse(bsDateString).getAD();
  return { year, month, date };
};

// UTC instant for 00:00:00.000 Nepal time on the given BS calendar day ("YYYY-MM-DD").
export const nepaliDateToUtcStart = (bsDateString) => {
  const { year, month, date } = bsStringToAdParts(bsDateString);
  return new Date(Date.UTC(year, month, date) - NEPAL_OFFSET_MS);
};

// UTC instant for 23:59:59.999 Nepal time on the given BS calendar day ("YYYY-MM-DD").
export const nepaliDateToUtcEnd = (bsDateString) => {
  const { year, month, date } = bsStringToAdParts(bsDateString);
  return new Date(Date.UTC(year, month, date + 1) - NEPAL_OFFSET_MS - 1);
};

// { startOfDay, endOfDay } UTC instants bracketing "today" in Nepal time, computed
// straight from the current UTC instant (no BS conversion, no dependency on the
// server process's configured timezone).
export const nepaliTodayUtcBounds = () => {
  const nowUtc = Date.now();
  const nepaliLocal = new Date(nowUtc + NEPAL_OFFSET_MS);
  const year = nepaliLocal.getUTCFullYear();
  const month = nepaliLocal.getUTCMonth();
  const date = nepaliLocal.getUTCDate();
  return {
    startOfDay: new Date(Date.UTC(year, month, date) - NEPAL_OFFSET_MS),
    endOfDay: new Date(Date.UTC(year, month, date + 1) - NEPAL_OFFSET_MS - 1),
  };
};
