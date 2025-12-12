/**
 * Admin API Helper Utilities
 * Provides reusable functions for admin API routes
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * Verify admin authentication
 * @returns {Promise<{authorized: boolean, session: any, response?: NextResponse}>}
 */
export async function verifyAdminAuth() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return {
      authorized: false,
      session: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Admin access required.",
        },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Convert Mongoose Decimal128 to number
 * @param {Decimal128} decimal - Mongoose Decimal128 value
 * @returns {number} Converted number value
 */
export function decimalToNumber(decimal) {
  if (!decimal) return 0;
  return parseFloat(decimal.toString());
}

/**
 * Validate numeric ID
 * @param {string|number} id - ID to validate
 * @param {string} fieldName - Field name for error message
 * @returns {{valid: boolean, value?: number, error?: string}}
 */
export function validateNumericId(id, fieldName = "ID") {
  const numId = parseInt(id);

  if (isNaN(numId) || numId <= 0) {
    return {
      valid: false,
      error: `Invalid ${fieldName}. Must be a positive number.`,
    };
  }

  return {
    valid: true,
    value: numId,
  };
}

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {any} details - Optional error details
 * @returns {NextResponse}
 */
export function errorResponse(message, status = 500, details = null) {
  const responseBody = {
    success: false,
    error: message,
  };

  if (details) {
    responseBody.details = details;
  }

  return NextResponse.json(responseBody, { status });
}

/**
 * Create standardized success response
 * @param {any} data - Response data
 * @param {string} message - Optional success message
 * @param {number} status - HTTP status code
 * @returns {NextResponse}
 */
export function successResponse(data, message = null, status = 200) {
  const responseBody = {
    success: true,
    data,
  };

  if (message) {
    responseBody.message = message;
  }

  return NextResponse.json(responseBody, { status });
}

/**
 * Format date for consistent API responses
 * @param {Date} date - Date to format
 * @returns {string} ISO string or null
 */
export function formatDate(date) {
  return date ? new Date(date).toISOString() : null;
}

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
export function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get date range for monthly comparison
 * @returns {{currentMonthStart: Date, currentMonthEnd: Date, lastMonthStart: Date, lastMonthEnd: Date}}
 */
export function getMonthlyDateRanges() {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    currentMonthStart,
    currentMonthEnd,
    lastMonthStart,
    lastMonthEnd,
  };
}
