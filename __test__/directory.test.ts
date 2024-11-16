import { promises as fs } from "fs";
import { join } from "path";
import { afterAll, describe, expect, test } from "vitest";

import { cleanup, createTestImage, doesFileExist, runCommand } from "./utils";

describe("Directory Processing Tests", async () => {
  const testDir = "./test_dir";
  const inputDir = join(testDir, "input");
  const outputDir = join(testDir, "output");

  await fs.mkdir(inputDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });

  await createTestImage(join(inputDir, "test1.png"), 100, 100);
  await createTestImage(join(inputDir, "test2.png"), 200, 200);
  await createTestImage(join(inputDir, "test3.jpg"), 300, 300);

  test("processes all supported files in directory", async () => {
    const { success } = await runCommand(["-i", inputDir, "-o", outputDir]);
    expect(success).toBe(true);
    expect(await doesFileExist(join(outputDir, "test1.webp"))).toBe(true);
    expect(await doesFileExist(join(outputDir, "test2.webp"))).toBe(true);
    expect(await doesFileExist(join(outputDir, "test3.webp"))).toBe(true);
  });

  test("handles directory with duplicate filenames", async () => {
    await createTestImage(join(inputDir, "duplicate.png"), 100, 100);
    await createTestImage(join(inputDir, "duplicate.jpg"), 200, 200);

    const { success } = await runCommand(["-i", inputDir, "-o", outputDir]);
    expect(success).toBe(true);
    expect(await doesFileExist(join(outputDir, "duplicate.webp"))).toBe(true);
    expect(await doesFileExist(join(outputDir, "duplicate(1).webp"))).toBe(
      true,
    );
  });

  test("skips unsupported file formats", async () => {
    const filePath = join(inputDir, "test.txt");
    await fs.writeFile(filePath, "not an image");
    const { success } = await runCommand(["-i", inputDir, "-o", outputDir]);
    expect(success).toBe(true);
    expect(await doesFileExist(join(outputDir, "test.webp"))).toBe(false);
  });

  test("prevents specifying output filename for directory input", async () => {
    const { success, output } = await runCommand([
      "-i",
      inputDir,
      "-o",
      join(outputDir, "test.webp"),
    ]);
    expect(success).toBe(false);
    expect(
      output.includes(
        "Cannot specify output filename when input is a directory",
      ),
    );
  });

  afterAll(async () => {
    await cleanup([testDir, inputDir, outputDir]);
  });
});
