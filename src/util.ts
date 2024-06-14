export function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getRangeValues(
  targetMin: number,
  targetMax: number,
  validMin: number,
  validMax: number,
  defaultMin: number,
  defaultMax: number,
): number[] {
  let minValue = targetMin,
    maxValue = targetMax;
  if (!Number.isFinite(minValue) || minValue < validMin) {
    minValue = defaultMin;
  }

  if (!Number.isFinite(maxValue) || validMax < maxValue) {
    maxValue = defaultMax;
  }

  if (maxValue <= minValue) {
    minValue = defaultMin;
    maxValue = defaultMax;
  }

  return [minValue, maxValue];
}

export function getValueInRange(
  targetValue: number,
  validMin: number,
  validMax: number,
  defaultValue: number,
): number {
  if (
    !Number.isFinite(targetValue) ||
    targetValue < validMin ||
    validMax < targetValue
  ) {
    return defaultValue;
  }

  return targetValue;
}

export function getLimitedValueInRange(
  targetValue: number,
  validMin: number,
  validMax: number,
  defaultValue: number
): number {
  if (!Number.isFinite(targetValue)) {
    return defaultValue;
  } else if (validMax < targetValue) {
    return validMax;
  } else if(targetValue < validMin) {
    return validMin;
  }

  return targetValue;
}

export function getValueInEnum(
  targetValue: number,
  enumType,
  defaultValue: number,
): number {
  if (Object.values(enumType).includes(targetValue)) {
    return targetValue;
  }

  return defaultValue;
}
