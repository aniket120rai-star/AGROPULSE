# Return the Time Zone for a Timestamp and Set of Latitude/Longitude Coordinates

The Time Zone API provides time offset data for locations on the surface of the
earth. You request the time zone information for a specific latitude/longitude
pair and date/time. The API returns the name of that time zone, the time offset
from UTC, and the daylight savings offset.

## Endpoint

Construct a Time Zone API request as a URL string in the following format:

```http
GET https://maps.googleapis.com/maps/api/timezone/{outputFormat}?{parameters}
```

### Path Parameters

*   `outputFormat`: Specifies the response format.
    *   `json` (recommended): Indicates output in JavaScript Object Notation
        (JSON).
    *   `xml`: Indicates output in XML, wrapped within a `<TimeZoneResponse>`
        node.

*Note: URLs must be properly encoded to be valid and are limited to 16,384
characters for all web services.*

--------------------------------------------------------------------------------

## Request Parameters

### Required Parameters

*   `location`: A comma-separated `latitude,longitude` tuple (e.g.,
    `location=39.6034810,-119.6822510`) representing the location to look up.
    Time zone data may not be available for locations over water, such as oceans
    or seas.
*   `timestamp`: The intended time as seconds since midnight, January 1, 1970
    UTC. The Time Zone API uses the `timestamp` to determine whether or not
    Daylight Savings should be applied, based on the time zone of the
    `location`.
    *   *Note: The API does not take historical time zones into account. If you
        specify a past timestamp, the API does not take into account the
        possibility that the location was previously in a different time zone.*
*   `key`: Your application's Google Maps Platform API key.

### Optional Parameters

*   `language`: The language in which to return results (e.g., `es`, `fr`,
    `en`). If `language` is not supplied, the API attempts to use the preferred
    language as specified in the `Accept-Language` header.

--------------------------------------------------------------------------------

## Code Examples

When making REST calls, include the usage attribution header
`X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1` (or append
`&solution_id=gmp_git_agentskills_v1` to the URL parameters).

### 1. Standard Time Request (No Daylight Savings)

The following request queries the time zone for a location in Nevada, USA, with
a timestamp set to December 5, 2024 (`1733428634`).

#### cURL

```bash
curl -L -X GET 'https://maps.googleapis.com/maps/api/timezone/json?location=39.6034810,-119.6822510&timestamp=1733428634&key=YOUR_API_KEY' \
  -H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1'
```

#### JSON Response

```json
{
  "dstOffset": 0,
  "rawOffset": -28800,
  "status": "OK",
  "timeZoneId": "America/Los_Angeles",
  "timeZoneName": "Pacific Standard Time"
}
```

### 2. Daylight Savings Time Request

The following request queries the same location in Nevada, USA, with a timestamp
set to March 15, 2024 (`1710547034`), which includes a Daylight Savings Time
offset.

#### cURL

```bash
curl -L -X GET 'https://maps.googleapis.com/maps/api/timezone/json?location=39.6034810,-119.6822510&timestamp=1710547034&key=YOUR_API_KEY' \
  -H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1'
```

#### JSON Response

```json
{
  "dstOffset": 3600,
  "rawOffset": -28800,
  "status": "OK",
  "timeZoneId": "America/Los_Angeles",
  "timeZoneName": "Pacific Daylight Time"
}
```

### 3. Localized Request (Spanish)

The following request adds the `language=es` parameter to localize the
`timeZoneName` field into Spanish.

#### cURL

```bash
curl -L -X GET 'https://maps.googleapis.com/maps/api/timezone/json?location=39.6034810,-119.6822510&timestamp=1710547034&language=es&key=YOUR_API_KEY' \
  -H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1'
```

#### JSON Response

```json
{
  "dstOffset": 3600,
  "rawOffset": -28800,
  "status": "OK",
  "timeZoneId": "America/Los_Angeles",
  "timeZoneName": "hora de verano del Pacífico"
}
```

### 4. JavaScript (`fetch`) Implementation

```javascript
async function getTimeZone(lat, lng, timestamp, apiKey) {
  const url = new URL('https://maps.googleapis.com/maps/api/timezone/json');
  url.searchParams.append('location', `${lat},${lng}`);
  url.searchParams.append('timestamp', timestamp.toString());
  url.searchParams.append('key', apiKey);
  url.searchParams.append('solution_id', 'gmp_git_agentskills_v1');

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'OK') {
      // Calculate local time in seconds
      const localTimestampSeconds = timestamp + data.dstOffset + data.rawOffset;
      const localDate = new Date(localTimestampSeconds * 1000);

      console.log(`Time Zone ID: ${data.timeZoneId}`);
      console.log(`Time Zone Name: ${data.timeZoneName}`);
      console.log(`Local Time (UTC representation): ${localDate.toUTCString()}`);
      return data;
    } else {
      console.error(`Time Zone API Error: ${data.status}`, data.errorMessage || '');
      return null;
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

// Example usage:
// const currentTimestamp = Math.floor(Date.now() / 1000);
// getTimeZone(39.6034810, -119.6822510, currentTimestamp, 'YOUR_API_KEY');
```

--------------------------------------------------------------------------------

## Response Schema & Handling

### `TimeZoneResponse` Fields

Field          | Required     | Type                        | Description
:------------- | :----------- | :-------------------------- | :----------
`status`       | **Required** | `string` (`TimeZoneStatus`) | Indicates the status of the response.
`dstOffset`    | Optional     | `number`                    | The offset for daylight-savings time in seconds. This will be `0` if the time zone is not in Daylight Savings Time during the specified `timestamp`.
`rawOffset`    | Optional     | `number`                    | The offset from UTC (in seconds) for the given location. This does not take into effect daylight savings.
`timeZoneId`   | Optional     | `string`                    | A string containing the ID of the time zone, such as `"America/Los_Angeles"` or `"Australia/Sydney"`. Defined by the Unicode Common Locale Data Repository (CLDR) project.
`timeZoneName` | Optional     | `string`                    | The long form name of the time zone. This field will be localized if the `language` parameter is set (e.g., `"Pacific Daylight Time"`).
`errorMessage` | Optional     | `string`                    | Detailed information about the reasons behind the given status code. Included if `status` is other than `OK`.

### Calculating Local Time

To calculate the local time of a given location, sum the input `timestamp`
parameter with the `dstOffset` and `rawOffset` fields from the response:

```text
Local Time (in seconds) = timestamp + dstOffset + rawOffset
```

### `TimeZoneStatus` Codes

*   `OK`: Indicates that the request was successful.
*   `INVALID_REQUEST`: Indicates that the request was malformed (e.g., missing
    required `location` or `timestamp` parameters, or invalid coordinate
    format).
*   `OVER_DAILY_LIMIT`: Indicates any of the following:
    *   The API key is missing or invalid.
    *   Billing has not been enabled on your account.
    *   A self-imposed usage cap has been exceeded.
    *   The provided method of payment is no longer valid (for example, a credit
        card has expired).
*   `OVER_QUERY_LIMIT`: Indicates the requestor has exceeded quota.
*   `REQUEST_DENIED`: Indicates that the API did not complete the request.
    Confirm that the request was sent over HTTPS instead of HTTP.
*   `UNKNOWN_ERROR`: Indicates an unknown server error. The request may succeed
    if tried again.
*   `ZERO_RESULTS`: Indicates that no time zone data could be found for the
    specified position or time. Confirm that the request is for a location on
    land, and not over water.
