import fs from "fs/promises";
import { join } from "path";
import { afterAll, describe, expect, test } from "vitest";

import {
  cleanup,
  createTestImage,
  doesFileExist,
  getImageMetadata,
  runCommand,
} from "./utils";

describe("Single File Processing Tests", async () => {
  const testDir = "./test_files";
  const inputFile = join(testDir, "test.png");
  const outputDir = join(testDir, "output");

  await fs.mkdir(testDir, { recursive: true });
  await createTestImage(inputFile, 100, 100);

  test("processes single file with default settings", async () => {
    const { success } = await runCommand(["-i", inputFile]);
    expect(success).toBe(true);
    const file = await doesFileExist(join("output", "test.webp"));
    expect(file).toBeTruthy();
    const metadata = await getImageMetadata(join("output", "test.webp"));
    expect(metadata.width).toBe(100);
    expect(metadata.height).toBe(100);
  });

  test("processes single file with custom output directory", async () => {
    const { success } = await runCommand(["-i", inputFile, "-o", outputDir]);
    expect(success).toBe(true);
    const file = await doesFileExist(join(outputDir, "test.webp"));
    expect(doesFileExist).toBeTruthy();
  });

  test("processes single file with custom filename", async () => {
    const { success } = await runCommand([
      "-i",
      inputFile,
      "-o",
      join(outputDir, "custom.webp"),
    ]);
    expect(success).toBe(true);
    const file = await doesFileExist(join(outputDir, "custom.webp"));
    expect(file).toBeTruthy();
  });

  test("handles duplicate filenames correctly", async () => {
    await runCommand([
      "-i",
      inputFile,
      "-o",
      join(outputDir, "duplicate.webp"),
    ]);
    const { success } = await runCommand([
      "-i",
      inputFile,
      "-o",
      join(outputDir, "duplicate.webp"),
    ]);
    expect(success).toBe(true);
    const file = await doesFileExist(join(outputDir, "duplicate(1).webp"));
    expect(file).toBeTruthy();
  });

  test("resizes image with dimensions", async () => {
    await createTestImage("./resize.png", 40, 50);
    const { success } = await runCommand([
      "-i",
      "./resize.png",
      "-o",
      testDir,
      "-d",
      "40x50",
    ]);
    expect(success).toBe(true);
    const metadata = await getImageMetadata(join(testDir, "resize.webp"));

    expect(metadata.width).toBe(40);
    expect(metadata.height).toBe(50);
  });

  test("handles square dimension format", async () => {
    const { success } = await runCommand([
      "-i",
      inputFile,
      "-o",
      testDir,
      "-d",
      "75",
    ]);
    expect(success).toBe(true);
    const metadata = await getImageMetadata(join(testDir, "test.webp"));

    expect(metadata.width).toBe(75);
    expect(metadata.height).toBe(75);
  });

  test("converts to different format", async () => {
    const { success } = await runCommand([
      "-i",
      inputFile,
      "-o",
      outputDir,
      "-f",
      "png",
    ]);
    expect(success).toBe(true);
    const file = await doesFileExist(join(outputDir, "test.png"));
    expect(file).toBe(true);
  });

  test("applies quality setting", async () => {
    const { success } = await runCommand([
      "-i",
      inputFile,
      "-o",
      outputDir,
      "-q",
      "10",
    ]);
    expect(success).toBe(true);

    const originalStats = await fs.stat(inputFile);
    const processedStats = await fs.stat(join(outputDir, "test.webp"));
    expect(processedStats.size).toBeLessThan(originalStats.size);
  });

  afterAll(async () => {
    await cleanup([testDir, "output", "resize.png", "test.png"]);
  });
});
