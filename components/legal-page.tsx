import Link from "next/link";

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <main className="screen screen--doc">
      <header className="header header--doc">
        <Link href="/" className="header__logo">
          JustADrop
        </Link>
      </header>

      <article className="prose">
        <h1 className="prose__title">{title}</h1>
        <p className="prose__meta">Última actualización: {updated}</p>
        {children}
      </article>

      <footer className="footer">
        <nav className="footer__links" aria-label="Legal">
          <Link href="/privacy" className="footer__link">
            Privacidad
          </Link>
          <span className="footer__separator" aria-hidden="true">
            ·
          </span>
          <Link href="/terms" className="footer__link">
            Términos
          </Link>
        </nav>
      </footer>
    </main>
  );
}
