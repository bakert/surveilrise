import { defineConfig } from "tsup";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  clean: true,
  dts: true,
  entry: ["src/index.ts", "src/test-query.ts"],
  format: ["cjs", "esm"],
  minify: isProduction,
  sourcemap: true,
});