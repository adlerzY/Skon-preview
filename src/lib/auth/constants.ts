export const AUTH_TOKEN_COOKIE = "a2b_auth_token";
export const REFRESH_TOKEN_COOKIE = "a2b_refresh_token";
export const LOGGED_IN_COOKIE = "a2b_logged_in"; // خواندنی برای UI سمت کلاینت (نه httpOnly)

export const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24; // ۱ روز
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // ۳۰ روز