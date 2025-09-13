import { GoogleSheetsBankService } from '@/services/googleSheetsBankService';
import { GoogleSheetsService } from '@/services/googleSheetsService';

const SPREADSHEET_ID = '1aQ03-kaMJeQyyqVICBOLZO0UZxBOf4vbPLuc_9SnpO8';

/**
 * Utility class for syncing data to Google Sheets
 */
export class DataSyncUtils {
  /**
   * Save coupon data to Google Sheets
   */
  static async saveCouponToSheets(coupon: any): Promise<void> {
    try {
      const couponsRange = 'Coupons!A1:H1';
      const headersData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, couponsRange);
      
      if (!headersData?.values || headersData.values.length === 0) {
        const headers = [['Code', 'Type', 'Discount', 'Value', 'ExpiryDate', 'UserId', 'CreatedAt', 'Fee']];
        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, couponsRange, headers);
      }

      const existingData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'Coupons!A:H');
      const nextRow = (existingData?.values?.length || 1) + 1;
      
      const couponRow = [
        coupon.code,
        coupon.type || 'discount',
        coupon.discount || '',
        coupon.value || '',
        coupon.expiryDate,
        coupon.userId,
        coupon.createdAt,
        coupon.fee || 0
      ];
      
      await GoogleSheetsService.writeSheet(SPREADSHEET_ID, `Coupons!A${nextRow}:H${nextRow}`, [couponRow]);
    } catch (error) {
      console.error('Error saving coupon to sheets:', error);
      throw error;
    }
  }

  /**
   * Save premium application to Google Sheets
   */
  static async savePremiumApplicationToSheets(application: any): Promise<void> {
    try {
      const applicationsRange = 'PremiumApplications!A1:J1';
      const headersData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, applicationsRange);
      
      if (!headersData?.values || headersData.values.length === 0) {
        const headers = [['ID', 'UserId', 'Username', 'AccountNumber', 'CustomCard', 'CustomCardNumber', 'CustomCVV', 'FeesPaid', 'Status', 'AppliedAt']];
        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, applicationsRange, headers);
      }

      const existingData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'PremiumApplications!A:J');
      const nextRow = (existingData?.values?.length || 1) + 1;
      
      const applicationRow = [
        application.id,
        application.userId,
        application.username,
        application.accountNumber,
        application.customCard || false,
        application.customCardNumber || '',
        application.customCVV || '',
        application.feesPaid || 0,
        application.status || 'pending',
        application.appliedAt
      ];
      
      await GoogleSheetsService.writeSheet(SPREADSHEET_ID, `PremiumApplications!A${nextRow}:J${nextRow}`, [applicationRow]);
    } catch (error) {
      console.error('Error saving premium application to sheets:', error);
      throw error;
    }
  }

  /**
   * Save credit card to Google Sheets
   */
  static async saveCreditCardToSheets(creditCard: any): Promise<void> {
    try {
      const creditCardsRange = 'CreditCards!A1:M1';
      const headersData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, creditCardsRange);
      
      if (!headersData?.values || headersData.values.length === 0) {
        const headers = [['ID', 'UserId', 'CardNumber', 'CardholderName', 'CVV', 'ExpiryDate', 'PIN', 'IsActive', 'IsBlocked', 'FailedAttempts', 'PermanentlyBlocked', 'ValidityYears', 'IsPremium']];
        await GoogleSheetsService.writeSheet(SPREADSHEET_ID, creditCardsRange, headers);
      }

      const existingData = await GoogleSheetsService.readSheet(SPREADSHEET_ID, 'CreditCards!A:M');
      const nextRow = (existingData?.values?.length || 1) + 1;
      
      const cardRow = [
        creditCard.id,
        creditCard.userId,
        creditCard.cardNumber,
        creditCard.cardholderName,
        creditCard.cvv,
        new Date(creditCard.expiryDate).toISOString(),
        creditCard.pin,
        creditCard.isActive.toString(),
        creditCard.isBlocked.toString(),
        creditCard.failedAttempts.toString(),
        creditCard.permanentlyBlocked.toString(),
        creditCard.validityYears.toString(),
        (creditCard.isPremium || false).toString()
      ];
      
      await GoogleSheetsService.writeSheet(SPREADSHEET_ID, `CreditCards!A${nextRow}:M${nextRow}`, [cardRow]);
    } catch (error) {
      console.error('Error saving credit card to sheets:', error);
      throw error;
    }
  }

  /**
   * Perform a complete data sync of all application data to Google Sheets
   */
  static async performCompleteSync(): Promise<void> {
    try {
      await GoogleSheetsBankService.fullDataSync();
    } catch (error) {
      console.error('Complete sync failed:', error);
      throw error;
    }
  }
}

// Export individual functions for backward compatibility
export const saveCouponToSheets = DataSyncUtils.saveCouponToSheets;
export const savePremiumApplicationToSheets = DataSyncUtils.savePremiumApplicationToSheets;
export const saveCreditCardToSheets = DataSyncUtils.saveCreditCardToSheets;