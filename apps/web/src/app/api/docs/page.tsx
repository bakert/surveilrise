"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
  ),
});

export default function ApiDocs(): JSX.Element {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">API Documentation</h1>
      <div className="bg-white rounded-lg p-4">
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 rounded-lg h-96"></div>
          }
        >
          <SwaggerUI url="/api/openapi" />
        </Suspense>
      </div>
    </div>
  );
}
