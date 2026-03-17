// utils/logs.js

/**
 * getApiLogs
 *
 * Simple helper to log incoming sync calls (for debugging / audit).
 *
 * Example usage:
 *   getApiLogs(cmp_id, "Account Groups Data");
 *
 * You can later replace console.log with a proper logger (Winston, Pino, etc.).
 */

export const getApiLogs = (cmpId, label = "API Call") => {
  try {
    const timestamp = new Date().toISOString();

    // Basic structured log
    console.log(
      JSON.stringify(
        {
          type: "SYNC_API",
          label,             // e.g. "Account Groups Data"
          cmpId,             // company id
          timestamp,
        },
        null,
        2
      )
    );
  } catch (err) {
    // Last-resort log if something goes wrong in logging itself
    console.error("Error in getApiLogs:", err?.message || err);
  }
};
