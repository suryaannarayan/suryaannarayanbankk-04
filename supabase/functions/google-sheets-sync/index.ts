import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
const GOOGLE_SERVICE_ACCOUNT_KEY = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

// Helpers for JWT signing and PEM parsing
function base64UrlEncode(input: Uint8Array | string) {
  let str: string;
  if (typeof input === 'string') {
    str = btoa(input);
  } else {
    let binary = '';
    for (let i = 0; i < input.byteLength; i++) {
      binary += String.fromCharCode(input[i]);
    }
    str = btoa(binary);
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '')
    .trim();
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Function to get OAuth2 access token from service account
async function getAccessToken(): Promise<string> {
  if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Google Service Account Key is not configured');
  }

  const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
  
  const header = { alg: 'RS256', typ: 'JWT' };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const encoder = new TextEncoder();
  const headerB64u = base64UrlEncode(JSON.stringify(header));
  const payloadB64u = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${headerB64u}.${payloadB64u}`;
  
  const keyData = pemToArrayBuffer(serviceAccount.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, encoder.encode(unsignedToken))
  );
  const jwt = `${unsignedToken}.${base64UrlEncode(signature)}`;

  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!tokenResp.ok) {
    const errText = await tokenResp.text();
    console.error('Google OAuth token error:', tokenResp.status, errText);
    throw new Error(`Failed to obtain access token: ${tokenResp.status} ${errText}`);
  }

  const tokenJson = await tokenResp.json();
  if (!tokenJson.access_token) {
    throw new Error('No access_token in Google OAuth response');
  }
  return tokenJson.access_token as string;
}

interface GoogleSheetsRequest {
  spreadsheetId: string;
  range: string;
  action: 'read' | 'write';
  values?: any[][];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers));
    
    if (!GOOGLE_SHEETS_API_KEY) {
      console.error('Google Sheets API key is not configured');
      return new Response(
        JSON.stringify({ error: 'Google Sheets API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Check if request has a body
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid content-type. Expected application/json, got:', contentType);
      return new Response(
        JSON.stringify({ error: 'Content-Type must be application/json' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Request body text:', bodyText);
      
      if (!bodyText.trim()) {
        console.error('Empty request body');
        return new Response(
          JSON.stringify({ error: 'Request body cannot be empty' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body:', requestBody);
    } catch (parseError) {
      console.error('Invalid JSON in request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: parseError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { spreadsheetId, range, action, values }: GoogleSheetsRequest = requestBody;

    if (!spreadsheetId || !range || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: spreadsheetId, range, action' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    if (action === 'read') {
      // Read data from Google Sheets
      const response = await fetch(`${baseUrl}?key=${GOOGLE_SHEETS_API_KEY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API Read Error:', response.status, errorText);
        return new Response(
          JSON.stringify({ 
            error: `Google Sheets API Error: ${response.status}`,
            details: errorText,
            spreadsheetId,
            range
          }),
          { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const data = await response.json();
      console.log('Successfully read data from Google Sheets');

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } else if (action === 'write') {
      // Write data to Google Sheets using Service Account OAuth
      if (!values) {
        return new Response(
          JSON.stringify({ error: 'Values are required for write action' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
        return new Response(
          JSON.stringify({
            error: 'Service account required for write operations',
            details: 'Add GOOGLE_SERVICE_ACCOUNT_KEY in Supabase Functions secrets and share the Sheet with that service account (Editor).',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const accessToken = await getAccessToken();
      const response = await fetch(`${baseUrl}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ values }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API Write Error:', response.status, errorText);
        return new Response(
          JSON.stringify({
            error: `Google Sheets API Error: ${response.status}`,
            details: errorText,
            spreadsheetId,
            range,
            valuesCount: values?.length || 0,
          }),
          { status: response.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      const data = await response.json();
      console.log('Successfully wrote data to Google Sheets');

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "read" or "write"' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

  } catch (error: any) {
    console.error('Error in google-sheets-sync function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);