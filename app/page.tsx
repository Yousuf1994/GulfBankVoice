export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Gulf Demo Bank: voice agent demo
        </h1>
        <p className="max-w-md text-zinc-600 dark:text-zinc-400">
          Noor, a multilingual banking voice agent, is coming to this page in
          a later phase.
        </p>
      </main>
    </div>
  );
}
