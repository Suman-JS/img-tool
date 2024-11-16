#!/usr/bin/env node

import { Command } from "commander";
import ora from "ora";

import { processInputPath, showHelp, validateOptions } from "./helper";
import { appName, VERSION } from "./lib/const";
import { delay, SUPPORTED_FORMATS } from "./lib/utils";

const program = new Command();

program.showHelpAfterError(true);
program.exitOverride();

program
  .name("image-tool")
  .description("CLI tool for image manipulation")
  .version(VERSION);

program
  .option("-i, --input <path>", "input image file or directory path")
  .option("-o, --output <path>", "output path", "./output")
  .option(
    "-f, --format <format>",
    `output image format (${SUPPORTED_FORMATS.join("|")})`,
    "webp",
  )
  .option(
    "-d, --dimension <dimension>",
    "resize dimension (e.g., '100x100' or '100' for square)",
  )
  .option("-q, --quality <quality>", "output quality (1-100)", "50");

const mainSpinner = ora("Starting optimization...");

const main = async (): Promise<void> => {
  console.log(appName);

  try {
    program.parse(process.argv);

    if (process.argv.length <= 2) {
      showHelp();
      process.exit(0);
    }

    mainSpinner.start();
    await delay();

    const rawOptions = program.opts();
    const options = validateOptions(rawOptions);

    await processInputPath(
      options.input,
      options.output,
      options.format,
      options,
    );

    mainSpinner.succeed("Optimization complete.");
  } catch (error: any) {
    if (error.code === "commander.help") {
      process.exit(0);
    }

    if (error.code === "commander.version") {
      process.exit(0);
    }

    if (error instanceof Error) {
    } else {
      mainSpinner.fail("An unknown error occurred");
    }
    process.exit(1);
  }
};

main();
