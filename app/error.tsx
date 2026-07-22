"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Something went wrong.</h1>
      <button onClick={reset}>Try again</button>
      <pre>{error.message}</pre>
    </main>
  );
}
