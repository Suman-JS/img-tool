import { writeFile } from "fs/promises";
import { afterAll, describe, expect, test } from "vitest";

import { cleanup, createTestImage, runCommand } from "./utils";

describe("Error Handling Tests", async () => {
  const testFile = "./test_invalid_dim.png";
  await createTestImage(testFile, 100, 100);
  const corruptedFile = "./corrupted.jpg";
  await writeFile(corruptedFile, "not an image");

  test("handles non-existent input file", async () => {
    const { success, output } = await runCommand(["-i", "nonexistent.jpg"]);
    expect(success).toBe(false);
    expect(output).toContain("no such file or directory");
  });

  test("handles non-existent input directory", async () => {
    const { success, output } = await runCommand(["-i", "./nonexistent_dir"]);
    expect(success).toBe(false);
    expect(output).toContain("no such file or directory");
  });

  test("handles invalid dimension format", async () => {
    const { success, output } = await runCommand([
      "-i",
      testFile,
      "-d",
      "invalidxinvalid",
    ]);
    expect(success).toBe(true);
    expect(output).toContain(
      "Invalid dimension, using input image's dimension.",
    );
  });

  test("handles corrupted image files", async () => {
    const { success, output } = await runCommand(["-i", corruptedFile]);
    console.log(success, output);
    expect(success).toBe(false);
    expect(output).toContain("Failed to process");
  });

  afterAll(async () => {
    await cleanup([testFile, corruptedFile]);
  });
});
