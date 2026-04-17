/**
 * places-photo.js — Netlify Function
 *
 * Proxies Google Places photo requests so the API key
 * never reaches the browser.
 *
 * Usage:  /.netlify/functions/places-photo?ref=places/XXXX/photos/YYYY&maxW=600
 */

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: 'GOOGLE_PLACES_API_KEY not configured' };
  }

  const ref = (event.queryStringParameters || {}).ref || '';
  const maxW = parseInt((event.queryStringParameters || {}).maxW || '600', 10);

  if (!ref) {
    return { statusCode: 400, body: 'Missing ref parameter' };
  }

  try {
    const url = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${maxW}&key=${apiKey}`;
    const res = await fetch(url, { redirect: 'follow' });

    if (!res.ok) {
      console.error('Places photo error:', res.status);
      return { statusCode: 502, body: 'Photo fetch failed' };
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (err) {
    console.error('Places photo network error:', err);
    return { statusCode: 502, body: 'Network error fetching photo' };
  }
};
