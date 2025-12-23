/**
 * Price utilities for formatting and calculations
 * AIDEV-NOTE: Centralized price logic extracted from components
 */

import type { Config } from '@/types/config.types';

export type DiscountType = 'percent' | 'amount';

export interface PriceConfig {
  currencySymbol?: string;
  currencyPosition?: 'left' | 'right';
  decimalSeparator?: string;
}

/**
 * Default price configuration (Brazilian Real)
 */
const DEFAULT_CONFIG: Required<PriceConfig> = {
  currencySymbol: 'R$',
  currencyPosition: 'left',
  decimalSeparator: ',',
};

/**
 * Format a price value with currency symbol
 *
 * @param price - The price value to format
 * @param config - Optional configuration from app config
 * @returns Formatted price string (e.g., "R$ 29,90")
 *
 * @example
 * formatPrice(29.9) // "R$ 29,90"
 * formatPrice(29.9, { currencySymbol: '$', currencyPosition: 'left', decimalSeparator: '.' }) // "$ 29.90"
 */
export function formatPrice(price: number, config?: PriceConfig | Config | null): string {
  // Extract config values, supporting both PriceConfig and full Config
  let symbol = DEFAULT_CONFIG.currencySymbol;
  let position = DEFAULT_CONFIG.currencyPosition;
  let separator = DEFAULT_CONFIG.decimalSeparator;

  if (config) {
    if ('currency_symbol' in config) {
      // Full Config object
      symbol = config.currency_symbol || symbol;
      position = config.currency_symbol_position || position;
    } else if ('currencySymbol' in config) {
      // PriceConfig object
      symbol = config.currencySymbol || symbol;
      position = config.currencyPosition || position;
      separator = config.decimalSeparator || separator;
    }
  }

  const formatted = price.toFixed(2).replace('.', separator);

  return position === 'left' ? `${symbol} ${formatted}` : `${formatted} ${symbol}`;
}

/**
 * Calculate discounted price
 *
 * @param originalPrice - Original price before discount
 * @param discount - Discount value
 * @param discountType - Type of discount ('percent' or 'amount')
 * @returns Final price after discount
 *
 * @example
 * calculateDiscountedPrice(100, 10, 'percent') // 90
 * calculateDiscountedPrice(100, 10, 'amount') // 90
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  discount: number,
  discountType: DiscountType | string
): number {
  if (discount <= 0) {
    return originalPrice;
  }

  if (discountType === 'percent') {
    return originalPrice - (originalPrice * discount) / 100;
  }

  // Amount discount
  return Math.max(0, originalPrice - discount);
}

/**
 * Format discount badge text
 *
 * @param discount - Discount value
 * @param discountType - Type of discount
 * @param config - Optional price config for currency formatting
 * @returns Formatted discount string (e.g., "-10%" or "-R$ 5,00")
 */
export function formatDiscountBadge(
  discount: number,
  discountType: DiscountType | string,
  config?: PriceConfig | Config | null
): string {
  if (discountType === 'percent') {
    return `-${discount}%`;
  }

  return `-${formatPrice(discount, config)}`;
}

/**
 * Calculate savings amount
 *
 * @param originalPrice - Original price
 * @param discount - Discount value
 * @param discountType - Type of discount
 * @returns Amount saved
 */
export function calculateSavings(
  originalPrice: number,
  discount: number,
  discountType: DiscountType | string
): number {
  if (discount <= 0) {
    return 0;
  }

  if (discountType === 'percent') {
    return (originalPrice * discount) / 100;
  }

  return Math.min(discount, originalPrice);
}

/**
 * Check if product has a valid discount
 */
export function hasDiscount(discount: number | undefined | null): boolean {
  return typeof discount === 'number' && discount > 0;
}
