import { defineConfig } from "tsup";

export default defineConfig({
  treeshake: true,
  minify: true,
  clean: true,
  format: "esm",
});
