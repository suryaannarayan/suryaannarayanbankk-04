import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
const GOOGLE_SERVICE_ACCOUNT_KEY = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');

// Function to get OAuth2 access token from service account
async function getAccessToken(): Promise<string> {
  if (!GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Google Service Account Key is not configured');
  }

  const serviceAccount = JSON.parse(GOOGLE_SERVICE_ACCOUNT_KEY);
  
  // Create JWT for Google OAuth2
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id,
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600, // 1 hour
  };

  // Simple JWT creation (in production, use a proper JWT library)
  const headerB64 = btoa(JSON.stringify(header)).replace(/[+/]/g, (m) => m === '+' ? '-' : '_').replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/[+/]/g, (m) => m === '+' ? '-' : '_').replace(/=/g, '');
  
  // For simplicity, we'll use the API key approach with proper error handling
  // In a full implementation, you'd need to implement JWT signing with RS256
  throw new Error('Service account authentication requires JWT signing. Please ensure your Google Sheet is publicly accessible for write operations or implement full OAuth2 flow.');
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
      // Write data to Google Sheets
      if (!values) {
        return new Response(
          JSON.stringify({ error: 'Values are required for write action' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Return helpful error for write operations
      return new Response(
        JSON.stringify({ 
          error: 'Google Sheets write operations require service account authentication',
          details: 'API keys only work for read operations. To enable write operations:\n\n1. Create a Google Service Account in Google Cloud Console\n2. Download the service account JSON key\n3. Share your Google Sheet with the service account email (give it Editor permissions)\n4. Add the full JSON key as GOOGLE_SERVICE_ACCOUNT_KEY secret in Supabase\n\nAlternatively, make your Google Sheet publicly editable (not recommended for sensitive data)',
          spreadsheetId,
          range,
          valuesCount: values?.length || 0,
          instructions: {
            step1: 'Go to Google Cloud Console → IAM & Admin → Service Accounts',
            step2: 'Create a new service account',
            step3: 'Download the JSON key file',
            step4: 'Share your Google Sheet with the service account email',
            step5: 'Add the JSON content as GOOGLE_SERVICE_ACCOUNT_KEY secret'
          }
        }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
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