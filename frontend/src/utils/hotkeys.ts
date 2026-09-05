export const isKey = (event: KeyboardEvent, ...codes: string[]): boolean => {
  return codes.includes(event.code);
};
