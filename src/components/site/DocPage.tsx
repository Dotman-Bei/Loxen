import Image from "next/image";
import { SiteNav } from "./SiteNav";

export type DocSection = { id: string; title: string; body: React.ReactNode };
export type DocFigure = { src: string; w: number; h: number; alt: string; caption: string; position?: string; contain?: boolean };

/** Long-form public page: header with a fact tag, contents column, one reading column. */
export function DocPage({
  path,
  title,
  lead,
  updated,
  facts,
  sections,
}: {
  path: string;
  title: string;
  lead: string;
  updated: string;
  facts: { label: string; value: string }[];
  sections: DocSection[];
}) {
  return (
    <>
      <SiteNav current={path} />
      <main className="doc">
        <header className="doc-head">
          <div className="doc-title">
            <h1 className="h-head" data-reveal>{title}</h1>
            <p className="doc-lead" data-reveal style={{ ["--i" as string]: 1 }}>{lead}</p>
            <p className="doc-updated" data-reveal style={{ ["--i" as string]: 2 }}>Last updated {updated}</p>
          </div>
          <dl className="fact-tag tag" data-reveal style={{ ["--i" as string]: 2 }}>
            <span className="tag-hole" />
            {facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="doc-body">
          <nav className="doc-toc" aria-label="On this page">
            <h2>On this page</h2>
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a className="link" href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="doc-content">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="doc-section" aria-labelledby={`${s.id}-h`}>
                <h2 id={`${s.id}-h`} className="doc-h" data-reveal>{s.title}</h2>
                <div className="prose" data-reveal style={{ ["--i" as string]: 1 }}>{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export function DocFigureTag({ fig }: { fig: DocFigure }) {
  return (
    <figure className="doc-fig">
      <div className={`doc-fig-frame tag${fig.contain ? " is-contain" : ""}`}>
        <span className="tag-hole" />
        <Image
          src={fig.src}
          width={fig.w}
          height={fig.h}
          alt={fig.alt}
          sizes="(max-width: 800px) 100vw, 640px"
          style={{ objectPosition: fig.position ?? "50% 30%" }}
        />
      </div>
      <figcaption className="caption">{fig.caption}</figcaption>
    </figure>
  );
}
