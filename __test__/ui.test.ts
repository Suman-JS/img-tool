import fs from "fs/promises";
import { join } from "path";
import { afterAll, describe, expect, test } from "vitest";

import { VERSION } from "../src/lib/const";
import { cleanup, createTestImage, runCommand } from "./utils";

describe("Command Line Interface Tests", async () => {
  const testDir = "./test_img";
  const inputFile = join(testDir, "test.png");

  await fs.mkdir(testDir, { recursive: true });
  await createTestImage(inputFile, 100, 100);

  test("shows help when no arguments provided", async () => {
    const { success, output } = await runCommand([]);
    expect(success).toBe(true);
    expect(output).toContain("Usage: img-tool -i <input> [options]");
  });

  test("shows help with -h flag", async () => {
    const { success, output } = await runCommand(["-h"]);

    expect(success).toBe(false);
    expect(output).toContain("Usage: image-tool [options]");
  });

  test("shows version with -v flag", async () => {
    const { success, output } = await runCommand(["-V"]);
    expect(success).toBe(true);
    expect(output).toContain(VERSION);
  });

  test("shows error for invalid format", async () => {
    const { success, output } = await runCommand([
      "-i",
      inputFile,
      "-f",
      "invalid",
    ]);
    expect(success).toBe(false);
    expect(output).toContain(
      "Invalid format. Supported formats: jpeg, png, webp, avif",
    );
  });

  afterAll(async () => {
    await cleanup([testDir, "output", "test.png"]);
  });
});
