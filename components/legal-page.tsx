"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/language-toggle";

interface LegalPageProps {
  kind: "privacy" | "terms";
}

export function LegalPage({ kind }: LegalPageProps) {
  const { t } = useI18n();
  const doc = t.legal[kind];

  return (
    <main className="screen screen--doc">
      <header className="header header--doc">
        <Link href="/" className="header__logo">
          {t.common.appName}
        </Link>
      </header>

      <article className="prose">
        <h1 className="prose__title">{doc.title}</h1>
        <p className="prose__meta">
          {t.legal.updatedLabel}: {doc.updated}
        </p>
        <p className="prose__lead">{doc.lead}</p>

        {doc.sections.map((section, i) => (
          <Fragment key={i}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph, j) => (
              <p key={j}>{paragraph}</p>
            ))}
            {section.list.length > 0 && (
              <ul>
                {section.list.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
          </Fragment>
        ))}

        <h2>{doc.contact.heading}</h2>
        <p>
          {doc.contact.text}{" "}
          <a href={`mailto:${t.legal.contactEmail}`}>{t.legal.contactEmail}</a>.
        </p>
      </article>

      <footer className="footer">
        <nav className="footer__links" aria-label="Legal">
          <Link href="/privacy" className="footer__link">
            {t.common.privacy}
          </Link>
          <span className="footer__separator" aria-hidden="true">
            ·
          </span>
          <Link href="/terms" className="footer__link">
            {t.common.terms}
          </Link>
        </nav>
        <div className="footer__lang">
          <LanguageToggle />
        </div>
      </footer>
    </main>
  );
}
