import Link from "next/link";
import { SITE } from "@/data/site";

export function Footer() {
  return (
    <footer className="bg-coffee-900 text-cream-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-serif text-xl text-cream-50">Case 3corações · por {SITE.author}</p>
          <p className="mt-2 text-sm text-cream-200/80">{SITE.role}</p>
          <p className="mt-1 text-sm text-cream-200/80">{SITE.program}</p>
          <p className="mt-6 max-w-md text-xs leading-relaxed text-cream-200/70">
            Estudo de caso e simulador de autoria própria. Não é um site oficial do Grupo
            3corações e não utiliza marcas ou logotipos oficiais. Todos os números são
            fictícios, simulados a partir das premissas do enunciado do case.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-caramel-200">Contato</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a className="underline-offset-4 hover:text-cream-50 hover:underline" href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </li>
            <li>
              <a className="underline-offset-4 hover:text-cream-50 hover:underline" href={SITE.github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a className="underline-offset-4 hover:text-cream-50 hover:underline" href={SITE.youtube} target="_blank" rel="noopener noreferrer">
                Vídeo de apresentação (YouTube)
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-caramel-200">Transparência</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link className="underline-offset-4 hover:text-cream-50 hover:underline" href="/metodologia">
                Metodologia e premissas
              </Link>
            </li>
            <li>
              <Link className="underline-offset-4 hover:text-cream-50 hover:underline" href="/#simulador">
                Simulador
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream-200/10">
        <p className="mx-auto max-w-7xl px-5 py-5 pb-16 text-xs text-cream-200/60 sm:px-8 sm:pb-5">
          Proteger a margem não é repassar mais. É decidir melhor onde, como e quanto.
        </p>
      </div>
    </footer>
  );
}
