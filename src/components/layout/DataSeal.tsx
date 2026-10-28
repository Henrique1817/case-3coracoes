import Link from "next/link";

/** Selo permanente: todos os números são simulados. */
export function DataSeal() {
  return (
    <Link
      href="/metodologia"
      className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full border border-caramel-200 bg-cream-50/95 px-3.5 py-1.5 text-xs font-medium text-coffee-700 shadow-soft backdrop-blur transition hover:border-caramel-400 hover:text-coffee-800"
      aria-label="Dados simulados a partir das premissas do case. Ver metodologia e premissas."
    >
      <span aria-hidden className="h-2 w-2 rounded-full bg-caramel-400" />
      Dados simulados · premissas do case
    </Link>
  );
}
