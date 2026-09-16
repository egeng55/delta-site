export default function Loading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto min-h-[60vh] max-w-4xl px-6 py-32"
    >
      <p role="status">Loading Delta...</p>
    </main>
  );
}
