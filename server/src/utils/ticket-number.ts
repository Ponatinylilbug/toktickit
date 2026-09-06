/**
 * Generates an official TokTickIT ticket number formatted as TKT-YYYY-XXXXXX
 * BR-01: Must match pattern ^TKT-\d{4}-\d{6}$
 *
 * @param sequenceNumber Optional numeric sequence or identifier to pad. If omitted, generates random 6-digit number.
 * @param date Optional date to extract the year from (defaults to now).
 */
export function generateTicketNumber(sequenceNumber?: number, date: Date = new Date()): string {
  const year = date.getFullYear();
  let numericPart: string;

  if (typeof sequenceNumber === "number" && Number.isInteger(sequenceNumber) && sequenceNumber > 0) {
    numericPart = sequenceNumber.toString().padStart(6, "0");
  } else {
    // Generate a random 6-digit number between 100000 and 999999
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    numericPart = randomNum.toString();
  }

  return `TKT-${year}-${numericPart}`;
}
