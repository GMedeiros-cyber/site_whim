import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-background px-6 py-16 text-center">
      <Image
        src="/brand/whim-logo-horizontal.webp"
        alt="Whim Confecção e Estamparia"
        width={1386}
        height={486}
        fetchPriority="high"
        className="h-auto w-full max-w-md"
      />
      <p className="text-lg font-medium text-muted-foreground">
        Site em construção
      </p>
    </main>
  );
}
