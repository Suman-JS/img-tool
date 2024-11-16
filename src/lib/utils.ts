export const SUPPORTED_FORMATS = ["jpeg", "png", "webp", "avif"] as const;

export const SUPPORTED_INPUT_FORMATS: string[] = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
] as const;

const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const calculateReduction = (originalSize: number, newSize: number): string => {
  const reduction = ((originalSize - newSize) / originalSize) * 100;
  return reduction.toFixed(1);
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error)
    return String(error.message);
  if (typeof error === "string") return error;
  return "Something went wrong";
};

const delay = (ms: number = 500) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isValidFormat = (format: string): boolean => {
  const lowerCaseFormat = format.toLowerCase();

  if (
    SUPPORTED_FORMATS.includes(
      lowerCaseFormat as (typeof SUPPORTED_FORMATS)[number],
    )
  ) {
    return true;
  }
  return false;
};

const isValidQuality = (quality: number): boolean => {
  return quality >= 1 && quality <= 100;
};

const isValidDimension = (dimension: string): boolean => {
  const singleNumberRegex = /^\d+$/;
  const dimensionRegex = /^\d+x\d+$/;
  return singleNumberRegex.test(dimension) || dimensionRegex.test(dimension);
};

export {
  calculateReduction,
  delay,
  formatFileSize,
  getErrorMessage,
  isValidDimension,
  isValidFormat,
  isValidQuality,
};
