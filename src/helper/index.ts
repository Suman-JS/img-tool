import chalk from "chalk";
import fs from "fs/promises";
import { glob } from "glob";
import ora from "ora";
import path from "path";
import type { FormatEnum } from "sharp";
import sharp from "sharp";

import {
  calculateReduction,
  delay,
  formatFileSize,
  getErrorMessage,
  isValidDimension,
  isValidFormat,
  isValidQuality,
  SUPPORTED_FORMATS,
  SUPPORTED_INPUT_FORMATS,
} from "../lib/utils";
import type {
  CliOptions,
  ImageMetadata,
  ProcessOptions,
  ProcessResult,
  SupportedFormat,
} from "../types";

/**
 * Parse image dimensions from string input
 */
const parseImageDimensions = (
  dimensionString: string,
  _originalMetadata: ImageMetadata,
): { width: number; height: number } | null => {
  let dimensions: string[] = [];
  if (typeof dimensionString !== "string") {
    dimensions.push(dimensionString);
  } else {
    dimensions = dimensionString.toLowerCase().split("x");
  }

  try {
    if (dimensions.length === 2) {
      const [width, height] = dimensions.map(Number);
      if (width === undefined && height === undefined)
        return { height: 0, width: 0 };
      if (!isNaN(width!) && !isNaN(height!)) return { width: 0, height: 0 };
    } else if (dimensions.length === 1) {
      const size = Number(dimensions[0]);
      if (!isNaN(size)) return { width: size, height: size };
    }
  } catch {
    return null;
  }

  return null;
};

/**
 * Get a unique file path by appending a counter if file exists
 */
const getUniqueFilePath = async (basePath: string): Promise<string> => {
  const dir = path.dirname(basePath);
  const ext = path.extname(basePath);
  const baseFilename = path.basename(basePath, ext);

  for (let counter = 0; ; counter++) {
    const filePath =
      counter === 0
        ? basePath
        : path.join(dir, `${baseFilename}(${counter})${ext}`);

    try {
      await fs.access(filePath);
    } catch (error: any) {
      if (error.code === "ENOENT") return filePath;
      throw error;
    }
  }
};

/**
 * Process a single image file with loading indicator
 */
const processImage = async (
  inputPath: string,
  outputPath: string,
  options: ProcessOptions,
): Promise<ProcessResult | null> => {
  const spinner = ora({
    text: `Processing image...`,
    color: "cyan",
  }).start();

  await delay();

  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  const finalOutputPath = await getUniqueFilePath(outputPath);

  try {
    const inputBuffer = await fs.readFile(inputPath);
    const inputSize = inputBuffer.length;

    let img = sharp(inputBuffer);
    const metadata = await img.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Unable to read image metadata");
    }

    const originalDimensions = {
      width: metadata.width,
      height: metadata.height,
    };

    let newDimensions = originalDimensions;

    if (options.dimension) {
      const parsedDimensions = parseImageDimensions(options.dimension, {
        width: metadata.width,
        height: metadata.height,
      });

      if (parsedDimensions) {
        newDimensions = parsedDimensions;
        img = img.resize(newDimensions.width, newDimensions.height, {
          fit: "contain",
          withoutEnlargement: true,
        });
      } else {
        spinner.warn(
          `Invalid dimension format. Using original dimensions: ${metadata.width}x${metadata.height}`,
        );

        await delay();
      }
    }

    const format = options.format as keyof FormatEnum;

    await img
      .toFormat(format, { quality: options.quality })
      .toFile(finalOutputPath);

    const outputStats = await fs.stat(finalOutputPath);
    const outputSize = outputStats.size;

    const result: ProcessResult = {
      inputSize,
      outputSize,
      originalDimensions,
      newDimensions,
    };

    spinner.succeed(
      `${path.basename(inputPath)} → ${path.basename(finalOutputPath)} ` +
        `(${formatFileSize(inputSize)} → ${formatFileSize(outputSize)}, ` +
        `${calculateReduction(inputSize, outputSize)}% reduction)`,
    );

    return result;
  } catch (error) {
    spinner.fail(
      `Failed to process ${path.basename(inputPath)}: ${getErrorMessage(error)}`,
    );
    process.exit(1);
  }
};

/**
 * Process input path (file or directory)
 */
const processInputPath = async (
  inputPath: string,
  outputBase: string,
  outputFormat: SupportedFormat,
  options: ProcessOptions,
): Promise<void> => {
  const folderSpinner = ora().start();

  try {
    const stats = await fs.stat(inputPath);
    const outputHasExt = !!path.extname(outputBase);

    let totalInputSize = 0;
    let totalOutputSize = 0;
    let fileCount = 0;

    if (stats.isFile()) {
      folderSpinner.stop();
      const inputExt = path.extname(inputPath);
      const inputBasename = path.basename(inputPath, inputExt);
      const outputPath = outputHasExt
        ? outputBase
        : path.join(outputBase, `${inputBasename}.${outputFormat}`);

      const result = await processImage(inputPath, outputPath, options);
      if (result) {
        totalInputSize += result.inputSize;
        totalOutputSize += result.outputSize;
        fileCount++;
      }
    } else if (stats.isDirectory()) {
      if (outputHasExt) {
        folderSpinner.fail(
          "Cannot specify output filename when input is a directory",
        );
        throw new Error(
          "Cannot specify output filename when input is a directory",
        );
      }

      folderSpinner.text = `Scanning directory: ${inputPath}`;
      await delay();

      const extensions = Array.from(SUPPORTED_INPUT_FORMATS).map((ext) =>
        ext.replace(".", ""),
      );
      const pattern = `${inputPath}/**/*.{${extensions.join(",")}}`;

      const files = await glob(pattern);

      if (files.length === 0) {
        folderSpinner.warn("No supported image files found");
        console.log(
          "\nSupported formats:",
          Array.from(SUPPORTED_INPUT_FORMATS).join(", "),
        );

        return;
      }

      folderSpinner.stop();

      for (const filePath of files) {
        const inputExt = path.extname(filePath);
        const inputBasename = path.basename(filePath, inputExt);
        const relativePath = path.relative(inputPath, path.dirname(filePath));
        const outputPath = path.join(
          outputBase,
          relativePath,
          `${inputBasename}.${outputFormat}`,
        );

        const result = await processImage(filePath, outputPath, options);
        if (result) {
          totalInputSize += result.inputSize;
          totalOutputSize += result.outputSize;
          fileCount++;
        }
      }

      if (fileCount > 0) {
        const summarySpinner = ora({
          text: "Generating summary...",
          color: "green",
        }).succeed(
          `Processed ${fileCount} files, ` +
            `Total: ${formatFileSize(totalInputSize)} → ${formatFileSize(
              totalOutputSize,
            )}, ` +
            `Overall Reduction: ${calculateReduction(
              totalInputSize,
              totalOutputSize,
            )}%`,
        );
        await delay(300);
      } else {
        ora().fail("No files were successfully processed");
      }
    }
  } catch (error) {
    folderSpinner.fail(`Error: ${getErrorMessage(error)}`);
    throw error;
  }
};

const showHelp = (): void => {
  console.log(`
Usage: img-tool -i <input> [options]

Options:
  -i, --input      Input file or directory path (required)
  -o, --output     Output path (default: ./output)
  -d, --dimension  Resize dimension (e.g., "100x100" or "100" for square)
  -q, --quality    Output quality (1-100, default: 50)
  -f, --format     Output format (${SUPPORTED_FORMATS.join("|")}, default: webp)
  -h, --help       Show this help message
  -v, --version    Show version
`);
};

const validateOptions = (rawOptions: any): CliOptions => {
  if (!rawOptions.input) {
    console.error("\nInput path is required");
    process.exit(1);
  }
  const checkFormat = isValidFormat(rawOptions.format);
  if (!checkFormat) {
    console.error(
      `\nInvalid format. Supported formats: ${SUPPORTED_FORMATS.join(", ")}`,
    );
    process.exit(1);
  }

  const quality = parseInt(rawOptions.quality, 10);
  if (isNaN(quality) || !isValidQuality(quality)) {
    console.error("\nQuality must be a number between 1 and 100");
    process.exit(1);
  }

  let dimension: string | undefined;
  if (rawOptions.dimension) {
    const isValid = isValidDimension(rawOptions.dimension);
    if (isValid) {
      dimension = rawOptions.dimension;
    } else {
      console.warn(
        chalk.yellowBright(
          "\nInvalid dimension, using input image's dimension.",
        ),
      );
    }
  }

  const validatedOptions: CliOptions = {
    input: path.resolve(rawOptions.input),
    output: path.resolve(rawOptions.output),
    format: rawOptions.format as SupportedFormat,
    quality,
    ...(dimension && { dimension }),
  };

  return validatedOptions;
};

export {
  getUniqueFilePath,
  parseImageDimensions,
  processImage,
  processInputPath,
  showHelp,
  validateOptions,
};
