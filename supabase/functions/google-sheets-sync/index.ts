import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');

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
    if (!GOOGLE_SHEETS_API_KEY) {
      throw new Error('Google Sheets API key is not configured');
    }

    const { spreadsheetId, range, action, values }: GoogleSheetsRequest = await req.json();

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
        console.error('Google Sheets API Error:', errorText);
        throw new Error(`Google Sheets API Error: ${response.status} ${errorText}`);
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

      const response = await fetch(`${baseUrl}?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API Error:', errorText);
        throw new Error(`Google Sheets API Error: ${response.status} ${errorText}`);
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