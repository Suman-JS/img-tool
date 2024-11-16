import { spawn } from "child_process";
import fs, { constants } from "fs/promises";
import sharp from "sharp";

export async function runCommand(
  args: string[],
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve, reject) => {
    try {
      const childProcess = spawn("node", ["dist/main.js", ...args], {
        stdio: ["inherit", "pipe", "pipe"],
        shell: true,
      });

      let stdout = "";
      let stderr = "";

      childProcess.stdout?.on("data", (data: Buffer) => {
        const str = data.toString();
        stdout += str;
      });

      childProcess.stderr?.on("data", (data: Buffer) => {
        const str = data.toString();
        stderr += str;
      });

      childProcess.on("close", (code: number | null) => {
        const output = stderr.trim() || stdout.trim();
        resolve({
          success: code === 0,
          output,
        });
      });

      childProcess.on("error", (err: Error) => {
        resolve({
          success: false,
          output: `Process error: ${err.message}`,
        });
      });
    } catch (error) {
      const err = error as Error;
      reject({
        success: false,
        output: `Failed to spawn process: ${err.message}`,
      });
    }
  });
}

export async function createTestImage(
  path: string,
  width: number,
  height: number,
): Promise<void> {
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    .png()
    .toFile(path);
}

export async function getImageMetadata(path: string) {
  const metadata = await sharp(path).metadata();
  return metadata;
}

export async function cleanup(paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      await fs.rm(path, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup ${path}:`, error);
    }
  }
}

export const doesFileExist = async (path: string) => {
  try {
    await fs.access(path, constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
};
