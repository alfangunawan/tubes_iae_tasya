/**
 * Date formatting utilities for the frontend application
 * Provides safe date formatting that handles null, undefined, and invalid dates
 */

/**
 * Format a date string safely. Returns '-' for null, undefined, or invalid dates.
 * Handles ISO strings, numeric timestamps, and numeric string timestamps.
 * @param dateInput - ISO date string, timestamp number, numeric string, null, or undefined
 * @param options - Intl.DateTimeFormatOptions for customizing output
 * @returns Formatted date string or '-' if invalid
 */
export function formatDate(
    dateInput: string | number | null | undefined,
    options?: Intl.DateTimeFormatOptions
): string {
    if (!dateInput) return '-';

    try {
        let date: Date;

        // Check if it's a numeric string (timestamp in milliseconds)
        if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
            date = new Date(parseInt(dateInput, 10));
        } else if (typeof dateInput === 'number') {
            date = new Date(dateInput);
        } else {
            date = new Date(dateInput);
        }

        if (isNaN(date.getTime())) return '-';

        const defaultOptions: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        };

        return date.toLocaleDateString('id-ID', options || defaultOptions);
    } catch {
        return '-';
    }
}

/**
 * Format a date with time
 * @param dateInput - ISO date string, timestamp number, numeric string, null, or undefined
 * @returns Formatted date with time or '-' if invalid
 */
export function formatDateTime(dateInput: string | number | null | undefined): string {
    if (!dateInput) return '-';

    try {
        let date: Date;

        // Check if it's a numeric string (timestamp in milliseconds)
        if (typeof dateInput === 'string' && /^\d+$/.test(dateInput)) {
            date = new Date(parseInt(dateInput, 10));
        } else if (typeof dateInput === 'number') {
            date = new Date(dateInput);
        } else {
            date = new Date(dateInput);
        }

        if (isNaN(date.getTime())) return '-';

        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '-';
    }
}
