import CurrencyRate from "../models/currencyRate.js";

// Hardcoded GBP rates as fallback (same as frontend)
const GBP_RATES = {
  GBP: 1,
  USD: 1.35,
  CNY: 9.71,
  VND: 35364.06,
  TRY: 54.72,
  EUR: 1.15,
  INR: 116.79,
};

/**
 * Convert amount from one currency to another using GBP as base
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    // Try to get rates from database first
    const fromRate = await CurrencyRate.findOne({ code: fromCurrency.toUpperCase() });
    const toRate = await CurrencyRate.findOne({ code: toCurrency.toUpperCase() });
    
    if (fromRate && toRate) {
      // Use database rates
      const fromRateValue = parseFloat(fromRate.rate.toString());
      const toRateValue = parseFloat(toRate.rate.toString());
      
      // Convert from 'from' to GBP, then GBP to 'to'
      const amountInGbp = amount / fromRateValue;
      return amountInGbp * toRateValue;
    } else {
      // Fallback to hardcoded rates
      const rateFrom = GBP_RATES[fromCurrency.toUpperCase()];
      const rateTo = GBP_RATES[toCurrency.toUpperCase()];
      
      if (!rateFrom || !rateTo) {
        throw new Error(`Currency conversion not available for ${fromCurrency} to ${toCurrency}`);
      }
      
      // Convert from 'from' to GBP, then GBP to 'to'
      const amountInGbp = amount / rateFrom;
      return amountInGbp * rateTo;
    }
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error(`Currency conversion failed: ${error.message}`);
  }
};

/**
 * Validate bid amount against reserve price with currency conversion
 * @param {number} bidAmount - Bid amount
 * @param {string} bidCurrency - Bid currency
 * @param {number} reservePrice - Reserve price
 * @param {string} reserveCurrency - Reserve price currency
 * @returns {Object} Validation result with converted values
 */
export const validateBidAgainstReservePrice = async (bidAmount, bidCurrency, reservePrice, reserveCurrency) => {
  try {
    let convertedReservePrice = reservePrice;
    let reservePriceCurrency = reserveCurrency;
    
    // Convert reserve price to bid currency if different
    if (bidCurrency !== reserveCurrency) {
      convertedReservePrice = await convertCurrency(reservePrice, reserveCurrency, bidCurrency);
      reservePriceCurrency = bidCurrency;
    }
    
    const isValid = bidAmount <= convertedReservePrice;
    
    return {
      isValid,
      convertedReservePrice,
      reservePriceCurrency,
      originalReservePrice: reservePrice,
      originalReserveCurrency: reserveCurrency,
      bidAmount,
      bidCurrency
    };
  } catch (error) {
    console.error('Bid validation error:', error);
    throw new Error(`Bid validation failed: ${error.message}`);
  }
}; 