# Date & Time Handling

There are two different things to keep in mind. Don't mix them together:

- **Timezone** — The app uses Nepal Time (NPT), which is UTC+5:45. Nepal does not use daylight saving time.
- **Calendar** — The app shows dates in Bikram Sambat (BS) instead of the normal Gregorian (AD) calendar.

So, getting the Nepal time correct does not automatically give you the correct BS date. The BS conversion is a separate step.

| Problem | Solution |
|---|---|
| Making the server use Nepal time | `TZ=Asia/Kathmandu` in `.env` and `Dockerfile` |
| Converting a normal UTC date into a BS date | `nepali-date-converter` v3.3.1 |

## Database: `createdAt` is the main date

Every Mongoose model uses `timestamps: true`, which automatically creates a `createdAt` field.

Use `createdAt` for all date filtering and queries.

⚠️ **Never use `createdDate`.** It was an old manually-created string field and has been removed.

Using strings for dates can cause incorrect comparisons. For example, comparing `"2"` and `"10"` as strings does not work the way date/number comparisons do.


## `dateInfo`: Only for dashboard charts

Each record also has:

```js
dateInfo: {
  year,
  month,
  day
}
```

This is automatically created when a record is saved using a Mongoose `pre('save')` hook and `new NepaliDate()`.

The important thing is that this depends on:

```
TZ=Asia/Kathmandu
```

Without the correct timezone, records saved around midnight could get the wrong BS day.

### Why do we need `dateInfo`?

MongoDB's `$month` and `$dayOfMonth` work with the Gregorian calendar, not Bikram Sambat.

Therefore, dashboard charts use the pre-calculated:

- `dateInfo.year`
- `dateInfo.month`
- `dateInfo.day`

to group data by BS dates.

Don't remove `dateInfo` and start calculating the dashboard dates directly from `createdAt`, because that could make the dashboard use Gregorian months/days instead of BS.

## Converting BS dates for database filtering

Use:

```
Utils/nepaliDateRange.js
```

whenever you need to convert a BS date into a database date range.

It provides:

- `nepaliDateToUtcStart(bsDateString)` → start of that BS day, converted to UTC
- `nepaliDateToUtcEnd(bsDateString)` → end of that BS day, converted to UTC
- `nepaliTodayUtcBounds()` → today's Nepal-time range, expressed in UTC

For example, if the user selects a BS date, don't manually calculate JavaScript `Date` objects. Use these helpers.

They convert the Nepal date/time into the correct UTC range and allow you to query:

```js
{
  createdAt: {
    $gte: start,
    $lte: end
  }
}
```

This approach is also more reliable if the server's timezone configuration is accidentally wrong.

These helpers are currently used by:

- `transactionController.js`
- `expenseController.js`

## Frontend: Use one calendar library

The frontend uses:

```
nepali-date-converter
```

version 3.3.1.

The old jQuery calendar plugin (`other.min.js`) has been completely removed. Don't bring it back.

### Important frontend files

**`NepaliDatePicker.jsx`**

The main BS date picker.

It is rendered directly into `document.body` using a React portal so that it doesn't get hidden inside modals.


**`ConvertEnglishDate.jsx`**

Used to convert a stored UTC timestamp into a BS date.

Main functions:

- `convertDate()`
- `bsDateOnly()`

**`todayNepaliDate.jsx`**

Returns today's BS date as:

```
YYYY-MM-DD
```

## Invoice dates

There are two different invoice dates:

**Creation Date**

The invoice creation date comes from:

```
createdAt
```

It is converted to BS when displayed.

It is not stored separately.

**Due Date**

The due date is different.

It is a real, editable field stored in the database.

## Quick Reference

| What you're trying to do | What to use |
|---|---|
| Filter records by a BS date | Convert BS → UTC using `nepaliDateToUtcStart` / `nepaliDateToUtcEnd`, then filter `createdAt` |
| Get today's Nepal date range | `nepaliTodayUtcBounds()` |
| Display a stored UTC timestamp as BS | `convertDate()` / `bsDateOnly()` |
| Group dashboard data by BS month/day | `dateInfo.month` / `dateInfo.day` |
| Add a new date filter | Follow `transactionController.js`: BS → UTC bounds → query `createdAt` |

## The main rule

Store/query using `createdAt` (UTC), display using BS, and use `dateInfo` only where BS-based dashboard grouping is required.

Never create another string-based date field for filtering.