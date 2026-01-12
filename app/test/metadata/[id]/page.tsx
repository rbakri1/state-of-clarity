"use client";

/**
 * Metadata Test Page
 *
 * Development tool for testing and debugging social sharing metadata.
 * Visit /test/metadata/[brief-id] to see what metadata will be generated.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface MetadataResponse {
  briefId: string;
  timestamp: string;
  metadata: any;
  error: string | null;
  warnings: string[];
  ogImageCheck: {
    url: string;
    urlEncoded: string;
  };
}

export default function MetadataTestPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<MetadataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch(`/api/brief-metadata/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching metadata:", err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Metadata Test Page</h1>
          <p>Loading metadata for brief: {id}...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Metadata Test Page</h1>
          <p className="text-red-600">Failed to load metadata</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Metadata Test Page</h1>
          <p className="text-gray-600">Testing social sharing metadata for brief: <code className="bg-gray-200 px-2 py-1 rounded">{id}</code></p>
        </div>

        {/* Warnings */}
        {data.warnings && data.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Warnings</h2>
            <ul className="list-disc list-inside text-yellow-700">
              {data.warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Error */}
        {data.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h2>
            <p className="text-red-700">{data.error}</p>
          </div>
        )}

        {/* Metadata Info */}
        {data.metadata && (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">ℹ️ Metadata Source</h2>
              <div className="text-blue-700">
                <p><strong>Source:</strong> {data.metadata.source}</p>
                <p><strong>Using Fallback:</strong> {data.metadata.usingFallback ? "Yes" : "No"}</p>
                <p><strong>Clarity Score:</strong> {data.metadata.clarityScore ?? "N/A"}</p>
              </div>
            </div>

            {/* HTML Meta Tags */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">HTML Meta Tags</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">&lt;title&gt;</span>
                  <span className="text-gray-800">{data.metadata.html.title}</span>
                  <span className="text-gray-500">&lt;/title&gt;</span>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">&lt;meta name="description" content="</span>
                  <span className="text-gray-800">{data.metadata.html.description}</span>
                  <span className="text-gray-500">" /&gt;</span>
                </div>
              </div>
            </div>

            {/* Open Graph Tags */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Open Graph Tags (Facebook, LinkedIn, WhatsApp)</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="bg-gray-50 p-2 rounded break-all">
                  <span className="text-gray-500">og:title = </span>
                  <span className="text-gray-800">{data.metadata.openGraph.title}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded break-all">
                  <span className="text-gray-500">og:description = </span>
                  <span className="text-gray-800">{data.metadata.openGraph.description}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded break-all">
                  <span className="text-gray-500">og:url = </span>
                  <a href={data.metadata.openGraph.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {data.metadata.openGraph.url}
                  </a>
                </div>
                <div className="bg-gray-50 p-2 rounded break-all">
                  <span className="text-gray-500">og:image = </span>
                  <a href={data.metadata.openGraph.image.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {data.metadata.openGraph.image.url}
                  </a>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">og:type = </span>
                  <span className="text-gray-800">{data.metadata.openGraph.type}</span>
                </div>
              </div>
            </div>

            {/* Twitter Card Tags */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Twitter Card Tags</h2>
              <div className="space-y-2 font-mono text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">twitter:card = </span>
                  <span className="text-gray-800">{data.metadata.twitter.card}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded break-all">
                  <span className="text-gray-500">twitter:title = </span>
                  <span className="text-gray-800">{data.metadata.twitter.title}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded break-all">
                  <span className="text-gray-500">twitter:description = </span>
                  <span className="text-gray-800">{data.metadata.twitter.description}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded break-all">
                  <span className="text-gray-500">twitter:image = </span>
                  <a href={data.metadata.twitter.image} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {data.metadata.twitter.image}
                  </a>
                </div>
              </div>
            </div>

            {/* OG Image Preview */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">OG Image Preview</h2>
              <p className="text-sm text-gray-600 mb-3">This is the image that will appear when sharing on social media:</p>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={data.metadata.openGraph.image.url}
                  alt="OG Preview"
                  className="w-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'%3E%3Crect width='1200' height='630' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%23666'%3EFailed to load image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 break-all">
                {data.ogImageCheck.urlEncoded}
              </p>
            </div>

            {/* Testing Tools */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-green-800 mb-3">🧪 Test in Social Media Validators</h2>
              <div className="space-y-2">
                <a
                  href={`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(data.metadata.openGraph.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  → Test in Facebook Sharing Debugger
                </a>
                <a
                  href={`https://cards-dev.twitter.com/validator`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  → Test in Twitter Card Validator
                </a>
                <a
                  href={`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(data.metadata.openGraph.url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  → Test in LinkedIn Post Inspector
                </a>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                Note: If you see old/cached data in these tools, use the "Fetch new scrape information" or "Scrape again" button to clear the cache.
              </p>
            </div>
          </>
        )}

        {/* Raw JSON */}
        <details className="bg-white border border-gray-200 rounded-lg p-4">
          <summary className="font-semibold cursor-pointer">View Raw JSON Response</summary>
          <pre className="mt-3 bg-gray-50 p-3 rounded text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
