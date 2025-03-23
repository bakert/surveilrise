import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(): Promise<NextResponse> {
  const openApiPath = path.join(process.cwd(), "src/app/api/openapi.yaml");
  const openApiContent = fs.readFileSync(openApiPath, "utf-8");

  return new NextResponse(openApiContent, {
    headers: {
      "Content-Type": "application/yaml",
    },
  });
}
