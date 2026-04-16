/**
 * places-proxy.js — Netlify Function
 *
 * Proxies Google Places API (New) requests so the API key
 * never leaves the server.  The frontend calls this function
 * instead of hitting googleapis.com directly.
 *
 * Environment variable required in Netlify Dashboard:
 *   GOOGLE_PLACES_API_KEY — a server-unrestricted (or Netlify-domain-restricted) key
 *                           with "Places API (New)" enabled in Google Cloud Console.
 *
 * Supported actions
 * ─────────────────
 *   autocomplete  — place predictions for the search bar
 *   details       — full place details by placeId  (for future enrichment)
 */

function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

exports.handler = async (event) => {
  /* ── CORS preflight ────────────────────────────────────── */
  if (event.httpMethod === 'OPTIONS') return json({}, 204);
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  /* ── API key from env ──────────────────────────────────── */
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return json({ error: 'GOOGLE_PLACES_API_KEY is not configured in Netlify environment variables.' }, 500);
  }

  /* ── Parse request ─────────────────────────────────────── */
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const action = body.action;

  /* ────────────────────────────────────────────────────────
   *  ACTION: autocomplete
   * ──────────────────────────────────────────────────────── */
  if (action === 'autocomplete') {
    const input = (body.input || '').trim();
    if (!input || input.length < 2) {
      return json({ suggestions: [] });
    }

    const requestBody = {
      input,
      includedPrimaryTypes: [
        'restaurant', 'tourist_attraction', 'lodging',
        'museum', 'cafe', 'park', 'shopping_mall',
        'airport', 'train_station'
      ]
    };

    // Optional: bias results to a region when the frontend knows which country page is active
    if (body.regionCode) {
      requestBody.regionCode = body.regionCode;
    }

    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': [
            'suggestions.placePrediction.place',
            'suggestions.placePrediction.placeId',
            'suggestions.placePrediction.text',
            'suggestions.placePrediction.structuredFormat'
          ].join(',')
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Google Places autocomplete error:', res.status, errText);
        return json({ error: 'Places API request failed', status: res.status }, 502);
      }

      const data = await res.json();
      return json(data);
    } catch (err) {
      console.error('Places autocomplete network error:', err);
      return json({ error: 'Network error contacting Places API' }, 502);
    }
  }

  /* ────────────────────────────────────────────────────────
   *  ACTION: details
   * ──────────────────────────────────────────────────────── */
  if (action === 'details') {
    const placeId = (body.placeId || '').trim();
    if (!placeId) return json({ error: 'Missing placeId' }, 400);

    const fieldMask = body.fieldMask || [
      'displayName', 'rating', 'userRatingCount',
      'formattedAddress', 'currentOpeningHours',
      'websiteUri', 'nationalPhoneNumber',
      'googleMapsUri', 'photos', 'priceLevel', 'reviews'
    ].join(',');

    try {
      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask
        }
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Google Places details error:', res.status, errText);
        return json({ error: 'Places details request failed', status: res.status }, 502);
      }

      const data = await res.json();
      return json(data);
    } catch (err) {
      console.error('Places details network error:', err);
      return json({ error: 'Network error contacting Places API' }, 502);
    }
  }

  /* ────────────────────────────────────────────────────────
   *  ACTION: searchText  (for "Discover More" nearby places)
   * ──────────────────────────────────────────────────────── */
  if (action === 'searchText') {
    const textQuery = (body.textQuery || '').trim();
    if (!textQuery) return json({ error: 'Missing textQuery' }, 400);

    const requestBody = {
      textQuery,
      maxResultCount: body.maxResults || 5
    };

    if (body.regionCode) {
      requestBody.regionCode = body.regionCode;
    }

    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': [
            'places.id', 'places.displayName', 'places.rating',
            'places.formattedAddress', 'places.photos',
            'places.userRatingCount', 'places.priceLevel'
          ].join(',')
        },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Google Places searchText error:', res.status, errText);
        return json({ error: 'Places text search failed', status: res.status }, 502);
      }

      const data = await res.json();
      return json(data);
    } catch (err) {
      console.error('Places searchText network error:', err);
      return json({ error: 'Network error contacting Places API' }, 502);
    }
  }

  return json({ error: 'Unknown action. Supported: autocomplete, details, searchText' }, 400);
};
