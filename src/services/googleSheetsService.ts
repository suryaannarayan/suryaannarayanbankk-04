import { supabase } from "@/integrations/supabase/client";

export interface GoogleSheetsData {
  spreadsheetId: string;
  range: string;
  action: 'read' | 'write';
  values?: any[][];
}

export class GoogleSheetsService {
  /**
   * Read data from Google Sheets
   */
  static async readSheet(spreadsheetId: string, range: string) {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: {
          spreadsheetId,
          range,
          action: 'read'
        }
      });

      if (error) {
        console.error('Error reading from Google Sheets:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Google Sheets read error:', error);
      throw error;
    }
  }

  /**
   * Write data to Google Sheets
   */
  static async writeSheet(spreadsheetId: string, range: string, values: any[][]) {
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-sync', {
        body: {
          spreadsheetId,
          range,
          action: 'write',
          values
        }
      });

      if (error) {
        console.error('Error writing to Google Sheets:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Google Sheets write error:', error);
      throw error;
    }
  }

  /**
   * Append data to Google Sheets
   */
  static async appendToSheet(spreadsheetId: string, range: string, values: any[][]) {
    try {
      // For append operation, you might want to first read the sheet to find the next empty row
      // or use Google Sheets API's append endpoint (requires additional implementation)
      return await this.writeSheet(spreadsheetId, range, values);
    } catch (error) {
      console.error('Google Sheets append error:', error);
      throw error;
    }
  }
}

// Utility functions for common Google Sheets operations
export const GoogleSheetsUtils = {
  /**
   * Convert array of objects to 2D array for Google Sheets
   */
  objectsToSheetValues(objects: Record<string, any>[]): any[][] {
    if (objects.length === 0) return [];
    
    const headers = Object.keys(objects[0]);
    const values = [headers];
    
    objects.forEach(obj => {
      const row = headers.map(header => obj[header] || '');
      values.push(row);
    });
    
    return values;
  },

  /**
   * Convert 2D array from Google Sheets to array of objects
   */
  sheetValuesToObjects(values: any[][]): Record<string, any>[] {
    if (values.length === 0) return [];
    
    const headers = values[0];
    const objects: Record<string, any>[] = [];
    
    for (let i = 1; i < values.length; i++) {
      const obj: Record<string, any> = {};
      headers.forEach((header: string, index: number) => {
        obj[header] = values[i][index] || '';
      });
      objects.push(obj);
    }
    
    return objects;
  },

  /**
   * Generate A1 notation range
   */
  generateRange(sheetName: string, startRow: number = 1, endRow?: number, startCol: string = 'A', endCol?: string): string {
    let range = `${sheetName}!${startCol}${startRow}`;
    if (endCol && endRow) {
      range += `:${endCol}${endRow}`;
    } else if (endCol) {
      range += `:${endCol}`;
    }
    return range;
  }
};