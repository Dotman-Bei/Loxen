import Image from "next/image";
import Link from "next/link";
import { TagMark } from "@/components/site/TagMark";
import { HeroStage } from "@/components/home/HeroStage";
import { LensShowcase } from "@/components/home/LensShowcase";
import { DigestTool } from "@/components/home/DigestTool";
import { FaqCards } from "@/components/home/FaqCards";
import { StartDialog } from "@/components/home/StartDialog";
import { StatusMark } from "@/components/StatusMark";
import { coverage } from "@/lib/providers";

const STAGES = [
  { name: "Frame the question", time: "About a minute", share: 8, text: "First, name the asset, the horizon and the one lens you read it through." },
  { name: "Gather the evidence", time: "Most of the work", share: 50, text: "Then enter or fetch each value, with its source and the time you read it." },
  { name: "Write the invalidation", time: "Ten minutes", share: 26, text: "Next, say what would prove the view wrong and what data that needs." },
  { name: "Save, export, or record", time: "One signature", share: 16, text: "Last, keep it here, export it, or commit its digest to BOT Chain." },
];

function Scallop({ edge }: { edge: "top" | "bottom" }) {
  const id = `scallop-${edge}`;
  return (
    <svg className={`sheet-scallop ${edge}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="24" height="12" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="12" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill={`url(#${id})`} />
    </svg>
  );
}

export default function Home() {
  return (
    <main>
      {/* Hero: the printed card beside the tag stage */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-card">
          <div className="stripe" aria-hidden="true">
            {Array.from({ length: 40 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <header className="hero-nav">
            <Link href="/" className="wordmark" aria-label="Loxen, home">
              <TagMark size={20} />
              <span>Loxen</span>
            </Link>
            <nav aria-label="Main">
              <ul>
                <li><Link className="link" href="/registry">Registry</Link></li>
                <li><Link className="link" href="/history">History</Link></li>
                <li><Link className="link" href="/methodology">Methodology</Link></li>
              </ul>
            </nav>
          </header>
          <div className="hero-body">
            <h1 id="hero-title" className="h-display hero-title">
              Market briefs that show their&nbsp;gaps
            </h1>
            <p className="hero-lead">
              Loxen is a workspace for one market question at a time. Every value carries its source, timestamp and
              status, and anything missing stays marked as missing.
            </p>
            <div className="hero-actions">
              <Link href="/workbench" className="btn">Open the workbench</Link>
              <Link href="/methodology" className="link link-strong">How Loxen handles evidence</Link>
            </div>
          </div>
        </div>
        <HeroStage />
      </section>

      <LensShowcase />

      {/* Stages as one bar */}
      <section className="stages" aria-labelledby="stages-title">
        <h2 id="stages-title" className="h-head" data-reveal>Where the time goes</h2>
        <ol className="stage-bar" data-ui>
          {STAGES.map((s, i) => (
            <li key={s.name} className={`stage stage-${i}`} style={{ flexGrow: s.share, ["--i" as string]: i }} data-reveal>
              <div className="stage-fill">
                <span className="stage-time">{s.time}</span>
              </div>
              <div className="stage-text">
                <h3>{s.name}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="stages-note" data-reveal>Widths are a rough share of the work in a typical brief, not a measurement.</p>
      </section>

      {/* Close-ups on a board: the six states */}
      <section className="board" aria-labelledby="states-title">
        <div className="tile t-head" data-reveal>
          <h2 id="states-title" className="h-head">Six honest states</h2>
        </div>
        <div className="tile t-kinds" data-reveal style={{ ["--i" as string]: 1 }}>
          <ul className="tile-ui kinds-ui" data-ui aria-hidden="true">
            <li>Source data</li>
            <li>Calculation</li>
            <li>Interpretation</li>
            <li>Assumption</li>
          </ul>
          <div className="tile-cap">
            <h3>Four kinds of content</h3>
            <p>Source data, calculation, model interpretation and your assumptions each carry their own label.</p>
          </div>
        </div>
        <div className="tile t-unavailable" data-reveal>
          <div className="tile-ui" data-ui aria-hidden="true">
            <span className="big-row"><span className="big-metric">Spot price</span><span className="big-dash">—</span></span>
            <StatusMark status="unavailable" />
          </div>
          <div className="tile-cap">
            <h3>Unavailable</h3>
            <p>The provider is not configured or did not answer. The row stays, with a dash and the reason, never a zero.</p>
          </div>
        </div>
        <div className="tile t-conflicting" data-reveal style={{ ["--i" as string]: 1 }}>
          <div className="tile-ui" data-ui aria-hidden="true">
            <span className="big-pair num">412<br />455</span>
            <StatusMark status="conflicting" />
          </div>
          <div className="tile-cap">
            <h3>Conflicting</h3>
            <p>Two sources disagree past the threshold. Both are shown; neither is chosen for you.</p>
          </div>
        </div>
        <div className="tile t-stale" data-reveal style={{ ["--i" as string]: 2 }}>
          <div className="tile-ui" data-ui aria-hidden="true">
            <StatusMark status="stale" detail="31 h old" />
          </div>
          <div className="tile-cap">
            <h3>Stale</h3>
            <p>Older than the horizon allows. It keeps its real timestamp.</p>
          </div>
        </div>
        <div className="tile t-user" data-reveal style={{ ["--i" as string]: 3 }}>
          <div className="tile-ui" data-ui aria-hidden="true">
            <StatusMark status="user" />
          </div>
          <div className="tile-cap">
            <h3>User supplied</h3>
            <p>Typed in by you, with the source you name.</p>
          </div>
        </div>
        <div className="tile t-live" data-reveal>
          <div className="tile-ui" data-ui aria-hidden="true">
            <StatusMark status="live" detail="provider time 13:58:04" />
          </div>
          <div className="tile-cap">
            <h3>Live</h3>
            <p>Fetched from a configured provider for this brief, with the provider’s own timestamp.</p>
          </div>
        </div>
        <div className="tile t-cached" data-reveal style={{ ["--i" as string]: 1 }}>
          <div className="tile-ui" data-ui aria-hidden="true">
            <StatusMark status="cached" detail="read 14 min ago" />
          </div>
          <div className="tile-cap">
            <h3>Cached</h3>
            <p>Read earlier from a provider whose terms allow it. Never labelled live.</p>
          </div>
        </div>
      </section>

      {/* The one full-width picture band */}
      <section className="band" aria-labelledby="band-title">
        <h2 id="band-title" className="visually-hidden">Inflated values</h2>
        <figure className="band-fig tag" data-reveal>
          <span className="tag-hole" />
          <Image
            src="/archive/keppler-bubbles-1901.jpg"
            width={1920}
            height={1296}
            sizes="100vw"
            alt="Puck cartoon: a bull in a checked waistcoat blows soap bubbles marked Inflated Values towards a crowd reaching for them"
            className="band-img"
          />
        </figure>
        <div className="band-text">
          <p className="statement" data-reveal>
            A confident paragraph is cheap. Loxen keeps each claim beside the value it rests on, and marks the model’s
            words as the model’s.
          </p>
          <p className="caption" data-reveal style={{ ["--i" as string]: 1 }}>
            “Wall Street Bubbles: Always the Same”, Udo Keppler for Puck, 1901.
          </p>
        </div>
      </section>

      {/* The printed sheet: source coverage, rendered from the provider config */}
      <section className="coverage" aria-labelledby="coverage-title">
        <figure className="coverage-ground">
          <Image
            src="/archive/daumier-quotations-1865.jpg"
            width={3402}
            height={3516}
            sizes="(max-width: 800px) 100vw, 60vw"
            alt="Daumier lithograph: two men read the stock prices in a newspaper beside a café table"
            className="coverage-img"
          />
          <figcaption className="caption coverage-cap">
            Daumier, Croquis parisiens, 1865. “Look at the stock prices… are our shares going up?” “At the moment
            only the barometer is.”
          </figcaption>
        </figure>
        <div className="sheet" data-reveal>
          <Scallop edge="top" />
          <Scallop edge="bottom" />
          <h2 id="coverage-title" className="sheet-title">Source coverage</h2>
          <p className="sheet-note">What this build can read for you today, and what you enter by hand.</p>
          {coverage().map((g) => (
            <div key={g.lens} className="sheet-group">
              <h3>{g.title}</h3>
              <ul>
                {g.rows.map((r) => (
                  <li key={r.metric}>
                    <span>{r.metric}</span>
                    <span className={`sheet-state s-${r.state}`}>{r.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="sheet-foot">
            Live rows fill in when you give a BOT Chain contract address. The rest you enter by hand.
            <br />
            A provider is added only after its terms, limits and attribution are checked.
          </p>
        </div>
      </section>

      {/* The live thing: what goes on-chain */}
      <section className="receipt" aria-labelledby="receipt-title">
        <div className="receipt-main">
          <h2 id="receipt-title" className="h-head" data-reveal>What goes on-chain</h2>
          <p className="receipt-lead" data-reveal style={{ ["--i" as string]: 1 }}>
            A receipt records that your wallet committed a digest at a block. It does not record your brief, and it does
            not make the brief true.
          </p>
          <div data-reveal style={{ ["--i" as string]: 2 }}>
            <DigestTool />
          </div>
          <p className="receipt-after" data-reveal style={{ ["--i" as string]: 3 }}>
            Download the receipt package (brief, salt, schema and receipt fields) and anyone can check the digest against
            the brief you choose to show them.
          </p>
        </div>
        <div className="receipt-pics">
          <figure className="receipt-fig tag" data-reveal style={{ ["--i" as string]: 1 }}>
            <span className="tag-hole" />
            <Image
              src="/archive/telegraph-receipt-1882.jpg"
              width={1920}
              height={1938}
              sizes="(max-width: 800px) 100vw, 40vw"
              alt="Front and back of an 1882 Indian Telegraph receipt, stamped AKYAB 23-4-82, with its printed rules"
              className="receipt-img"
            />
          </figure>
          <p className="caption" data-reveal style={{ ["--i" as string]: 2 }}>
            Receipt for an inland telegram, Akyab, 1882. Rule I on the back: “The accuracy of messages is not
            guaranteed.”
          </p>
          <figure className="receipt-video tag" data-reveal style={{ ["--i" as string]: 3 }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/archive/teleprinter-poster.jpg"
              width={854}
              height={480}
              aria-hidden="true"
              className="tele-video"
            >
              <source src="/archive/teleprinter.webm" type="video/webm" />
            </video>
          </figure>
        </div>
      </section>

      {/* Tabbed index cards */}
      <section className="faq" aria-labelledby="faq-title">
        <h2 id="faq-title" className="h-head" data-reveal>Before you start</h2>
        <FaqCards />
      </section>

      {/* First step, already open */}
      <section className="cta" aria-labelledby="cta-title">
        <div className="cta-text">
          <h2 id="cta-title" className="h-display cta-title" data-reveal>Start with the question</h2>
          <p data-reveal style={{ ["--i" as string]: 1 }}>
            The workbench opens with your question and horizon filled in. Nothing is sent anywhere until you choose to.
          </p>
        </div>
        <div className="cta-dialog" data-reveal style={{ ["--i" as string]: 2 }}>
          <StartDialog />
        </div>
      </section>
    </main>
  );
}
