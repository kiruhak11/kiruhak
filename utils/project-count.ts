/** Formats a confirmed project count with correct Russian case endings. */
export function formatConfirmedCaseCount(count: number): string {
  const absoluteCount = Math.abs(Math.trunc(count));
  const lastTwoDigits = absoluteCount % 100;
  const lastDigit = absoluteCount % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} подтверждённых кейсов`;
  }
  if (lastDigit === 1) return `${count} подтверждённый кейс`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} подтверждённых кейса`;
  return `${count} подтверждённых кейсов`;
}
