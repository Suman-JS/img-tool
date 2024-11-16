type ProcessOptions = {
  dimension?: string;
  quality: number;
  format: SupportedFormat;
};

type ImageMetadata = {
  width: number;
  height: number;
};

type ProcessResult = {
  inputSize: number;
  outputSize: number;
  originalDimensions: { width: number; height: number };
  newDimensions: { width: number; height: number };
};

type SupportedFormat = "jpeg" | "png" | "webp" | "avif";

type CliOptions = {
  input: string;
  output: string;
  format: SupportedFormat;
  dimension?: string;
  quality: number;
};

export type {
  CliOptions,
  ImageMetadata,
  ProcessOptions,
  ProcessResult,
  SupportedFormat,
};
