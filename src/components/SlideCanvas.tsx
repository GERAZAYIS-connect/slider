import React from "react";
import type { CSSProperties } from "react";
import type { Slide, ThemeId } from "../types";
import { getTheme, type ThemePalette } from "../data/themes";

interface SlideCanvasProps {
  slide: Slide;
  themeId: ThemeId;
  scale?: number;
  className?: string;
  index?: number;
}

export function SlideCanvas({ slide, themeId, scale = 1, className, index = 0 }: SlideCanvasProps) {
  const theme = getTheme(themeId);
  return (
    <div
      className={className}
      style={{ width: 1280 * scale, height: 720 * scale, flexShrink: 0, position: "relative" }}
    >
      <div
        className="slide-canvas"
        style={{
          background: theme.background,
          color: theme.ink,
          fontFamily: theme.fontBody,
          transform: scale === 1 ? undefined : `scale(${scale})`,
        }}
      >
        <Decoration theme={theme} />
        <SlideContent slide={slide} theme={theme} />
        {theme.layout.sectionNumber && <SectionNumber theme={theme} index={index} />}
      </div>
    </div>
  );
}

const M = 72;

function kickerText(theme: ThemePalette, text?: string): string | undefined {
  if (!text) return undefined;
  return theme.uppercaseKickers ? text.toUpperCase() : text;
}

function Decoration({ theme }: { theme: ThemePalette }) {
  const d = theme.layout.decoration;
  if (d === "grid") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `linear-gradient(${theme.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          pointerEvents: "none",
        }}
      />
    );
  }
  if (d === "diagonal") {
    return (
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -140,
            width: 560,
            height: 560,
            background: theme.accent,
            opacity: 0.08,
            transform: "rotate(28deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -120,
            width: 520,
            height: 520,
            background: theme.ink,
            opacity: 0.05,
            transform: "rotate(28deg)",
          }}
        />
      </div>
    );
  }
  if (d === "scanline") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.02) 100%)",
          pointerEvents: "none",
        }}
      />
    );
  }
  if (d === "hairline") {
    return (
      <>
        <div style={{ position: "absolute", top: 0, left: M, right: M, height: 1, background: theme.border, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: M, right: M, height: 1, background: theme.border, pointerEvents: "none" }} />
      </>
    );
  }
  return null;
}

function SectionNumber({ theme, index }: { theme: ThemePalette; index: number }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 40,
        bottom: 0,
        fontSize: 240,
        lineHeight: 1,
        fontWeight: 900,
        color: theme.accent,
        opacity: 0.1,
        fontFamily: theme.fontHeading,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {String(index + 1).padStart(2, "0")}
    </div>
  );
}

function Kicker({ theme, text }: { theme: ThemePalette; text: string }) {
  const t = kickerText(theme, text);
  const s = theme.layout.kickerStyle;
  const base: CSSProperties = {
    color: theme.accent,
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: 3,
    fontFamily: theme.fontMono,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  };
  const box: CSSProperties = { width: 9, height: 9, background: theme.accent, flexShrink: 0 };
  switch (s) {
    case "line":
      return <div style={base}><span style={{ width: 26, height: 2, background: theme.accent, flexShrink: 0 }} />{t}</div>;
    case "dot":
      return <div style={base}><span style={{ ...box, borderRadius: "50%" }} />{t}</div>;
    case "prompt":
      return <div style={base}><span>{">"}</span>{t}</div>;
    case "diamond":
      return <div style={base}><span style={{ ...box, transform: "rotate(45deg)" }} />{t}</div>;
    case "bracket":
      return <div style={base}>[ {t} ]</div>;
    case "dash":
      return <div style={base}><span style={{ width: 22, height: 3, background: theme.accent, flexShrink: 0 }} />{t}</div>;
    case "square":
    default:
      return <div style={base}><span style={box} />{t}</div>;
  }
}

function BulletMarker({ theme }: { theme: ThemePalette }) {
  const s = theme.layout.bulletStyle;
  const accent = theme.accent;
  const box: CSSProperties = { minWidth: 14, height: 14, marginTop: 9, background: accent, flexShrink: 0, borderRadius: theme.radius >= 12 ? 4 : 0 };
  switch (s) {
    case "circle":
      return <div style={{ ...box, borderRadius: "50%" }} />;
    case "dash":
      return <div style={{ minWidth: 24, width: 24, height: 2, marginTop: 14, background: theme.ink, flexShrink: 0 }} />;
    case "diamond":
      return <div style={{ ...box, transform: "rotate(45deg)" }} />;
    case "chevron":
      return <div style={{ color: accent, fontWeight: 800, fontSize: 22, lineHeight: 1.1, marginTop: 4, fontFamily: theme.fontMono, flexShrink: 0 }}>▸</div>;
    case "prompt":
      return <div style={{ color: accent, fontWeight: 700, fontSize: 22, lineHeight: 1.1, marginTop: 4, fontFamily: theme.fontMono, flexShrink: 0 }}>$</div>;
    case "square":
    default:
      return <div style={box} />;
  }
}

function TitleText({ theme, text, style }: { theme: ThemePalette; text: string; style?: CSSProperties }) {
  if (theme.layout.keywordAccent) {
    const words = text.trim().split(/\s+/);
    if (words.length > 1) {
      const last = words[words.length - 1];
      const rest = words.slice(0, -1).join(" ");
      return (
        <span style={style}>
          {rest}{" "}
          <em style={{ color: theme.accent, fontStyle: "italic" }}>{last}</em>
        </span>
      );
    }
  }
  return <span style={{ ...style, fontStyle: theme.layout.titleItalic ? "italic" : undefined }}>{text}</span>;
}

function imageGrayscale(theme: ThemePalette): boolean {
  const s = theme.layout.imageStyle;
  return s === "grayscale" || s === "duotone" || s === "glitch";
}

function ImageOverlays({ theme }: { theme: ThemePalette }) {
  const s = theme.layout.imageStyle;
  if (s === "duotone" || s === "glitch") {
    return (
      <>
        <div style={{ position: "absolute", inset: 0, background: theme.accent, opacity: 0.32 }} />
        {s === "glitch" && (
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.02) 60%)" }} />
        )}
      </>
    );
  }
  if (s === "terminal") {
    return <div style={{ position: "absolute", inset: 0, border: `3px solid ${theme.border}` }} />;
  }
  return null;
}

function Placeholder({ theme }: { theme: ThemePalette }) {
  return (
    <div style={{ width: "100%", height: "100%", background: theme.surface, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -46, right: -40, width: 190, height: 190, borderRadius: "50%", border: `2px solid ${theme.accent}`, opacity: 0.5 }} />
      <div style={{ position: "absolute", top: 14, right: 28, width: 112, height: 112, borderRadius: "50%", border: `2px solid ${theme.accent}`, opacity: 0.32 }} />
      <div style={{ position: "absolute", left: 40, bottom: 34, width: 128, height: 40, background: theme.accent, opacity: 0.85 }} />
      <div style={{ position: "absolute", left: -20, top: 92, width: 440, height: 2, background: theme.border, opacity: 0.28, transform: "rotate(-4deg)" }} />
      <div style={{ position: "absolute", left: -20, bottom: 88, width: 440, height: 2, background: theme.accent, opacity: 0.22, transform: "rotate(3deg)" }} />
    </div>
  );
}

function TreatedImage({ theme, src }: { theme: ThemePalette; src: string | undefined }) {
  if (!src) return <Placeholder theme={theme} />;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img
        src={src}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: imageGrayscale(theme) ? "grayscale(1) contrast(1.05)" : undefined }}
      />
      <ImageOverlays theme={theme} />
    </div>
  );
}

function SlideContent({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  switch (slide.type) {
    case "title":
      return <TitleSlide slide={slide} theme={theme} />;
    case "bullets":
      return <BulletsSlide slide={slide} theme={theme} />;
    case "problem-solution":
      return <ProblemSolutionSlide slide={slide} theme={theme} />;
    case "cards":
      return <CardsSlide slide={slide} theme={theme} />;
    case "metrics":
      return <MetricsSlide slide={slide} theme={theme} />;
    case "definition":
      return <DefinitionSlide slide={slide} theme={theme} />;
    case "lab":
      return <LabSlide slide={slide} theme={theme} />;
    case "workflow":
      return <WorkflowSlide slide={slide} theme={theme} />;
    case "comparison":
      return <ComparisonSlide slide={slide} theme={theme} />;
    case "timeline":
      return <TimelineSlide slide={slide} theme={theme} />;
    case "conclusion":
      return <ConclusionSlide slide={slide} theme={theme} />;
    default:
      return <BulletsSlide slide={slide} theme={theme} />;
  }
}

function Header({ slide, theme, size = 40 }: { slide: Slide; theme: ThemePalette; size?: number }) {
  const center = theme.layout.headerAlign === "center";
  return (
    <div style={{ padding: "44px 72px 0", textAlign: center ? "center" : "left" }}>
      {slide.kicker && <Kicker theme={theme} text={slide.kicker} />}
      <div
        style={{
          color: theme.ink,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.08,
          letterSpacing: -0.5,
          fontFamily: theme.fontHeading,
        }}
      >
        <TitleText theme={theme} text={slide.title} />
      </div>
      {slide.subtitle && (
        <div style={{ color: theme.muted, fontSize: 20, marginTop: 12, maxWidth: center ? 900 : 920, marginLeft: center ? "auto" : 0, marginRight: center ? "auto" : 0 }}>
          {slide.subtitle}
        </div>
      )}
      {theme.layout.headerRule && (
        <div style={{ width: center ? 84 : 64, height: 3, background: theme.accent, margin: center ? "16px auto 0" : "16px 0 0" }} />
      )}
    </div>
  );
}

function TitleSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const center = theme.layout.headerAlign === "center";
  const fullbleed = theme.layout.imageStyle === "fullbleed" && !!slide.image;

  if (fullbleed) {
    return (
      <div style={{ position: "absolute", inset: 0 }}>
        <img src={slide.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.15) 100%)" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 90px" }}>
          {slide.kicker && <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 22, letterSpacing: 4, marginBottom: 18, fontFamily: theme.fontMono }}>{kickerText(theme, slide.kicker)}</div>}
          <div style={{ color: "#FFFFFF", fontWeight: 800, fontSize: 72, lineHeight: 1.02, letterSpacing: -1.5, fontFamily: theme.fontHeading, maxWidth: 980 }}>
            {slide.title}
          </div>
          {slide.subtitle && <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 26, marginTop: 26, maxWidth: 720, lineHeight: 1.4 }}>{slide.subtitle}</div>}
        </div>
      </div>
    );
  }

  const side = !center && theme.layout.imageStyle !== "fullbleed";
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: center ? 0 : 12, background: theme.accent }} />
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1, padding: center ? "0 120px" : "80px 72px" }}>
          {slide.kicker && <Kicker theme={theme} text={slide.kicker} />}
          <div style={{ color: theme.ink, fontWeight: 800, fontSize: 72, lineHeight: 1.02, letterSpacing: -1.5, fontFamily: theme.fontHeading, maxWidth: 900 }}>
            <TitleText theme={theme} text={slide.title} />
          </div>
          {slide.subtitle && <div style={{ color: theme.muted, fontSize: 26, marginTop: 26, maxWidth: 680, lineHeight: 1.4 }}>{slide.subtitle}</div>}
          {slide.bullets && slide.bullets.length > 0 && (
            <div style={{ display: "flex", gap: 20, marginTop: 30 }}>
              {slide.bullets.slice(0, 3).map((b, i) => (
                <div key={i} style={{ color: theme.muted, fontSize: 16, fontWeight: 500 }}>{b}</div>
              ))}
            </div>
          )}
        </div>
        {side && (
          <div style={{ width: 460, height: "100%", flexShrink: 0, position: "relative", borderLeft: `1px solid ${theme.border}` }}>
            <TreatedImage theme={theme} src={slide.image} />
          </div>
        )}
      </div>
      <div style={{ position: "absolute", bottom: 54, left: 72, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 6, background: theme.accent }} />
      </div>
    </div>
  );
}

function BulletsSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const items = slide.bullets ?? [];
  const withImage = !!slide.image && theme.layout.imageStyle !== "fullbleed";
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} />
      <div style={{ flex: 1, display: "flex", padding: "28px 72px 60px", gap: 40 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 22, justifyContent: "center" }}>
          {items.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              <BulletMarker theme={theme} />
              <div style={{ color: theme.ink, fontSize: 24, lineHeight: 1.35, fontWeight: 500 }}>{b}</div>
            </div>
          ))}
        </div>
        {withImage && (
          <div style={{ width: 420, flexShrink: 0, position: "relative", border: `1px solid ${theme.border}`, overflow: "hidden", alignSelf: "center", height: "72%" }}>
            <TreatedImage theme={theme} src={slide.image} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProblemSolutionSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const left = slide.left ?? { title: "Problème", points: [] };
  const right = slide.right ?? { title: "Solution", points: [] };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} />
      <div style={{ flex: 1, display: "flex", gap: 40, padding: "36px 72px 60px" }}>
        <Column title={left.title} points={left.points} color="#D64545" theme={theme} />
        <Column title={right.title} points={right.points} color={theme.accent} theme={theme} />
      </div>
    </div>
  );
}

function Column({ title, points, color, theme }: { title: string; points: string[]; color: string; theme: ThemePalette }) {
  const soft = theme.layout.cardStyle === "soft";
  return (
    <div
      style={{
        flex: 1,
        background: theme.surface,
        border: theme.layout.cardStyle === "borderless" ? "none" : `1px solid ${theme.border}`,
        borderRadius: soft ? theme.radius : 0,
        padding: "34px 34px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: color }} />
      <div style={{ color: theme.ink, fontWeight: 800, fontSize: 30, fontFamily: theme.fontHeading, marginBottom: 24 }}>{title}</div>
      {points.map((p, i) => (
        <div key={i} style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
          <div style={{ color, fontWeight: 800, fontSize: 22, lineHeight: 1 }}>—</div>
          <div style={{ color: theme.ink, fontSize: 20, lineHeight: 1.4 }}>{p}</div>
        </div>
      ))}
    </div>
  );
}

function CardsSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const cards = slide.cards ?? [];
  const cols = cards.length <= 3 ? Math.max(1, cards.length) : 3;
  const style = theme.layout.cardStyle;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} size={38} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 28, padding: "30px 72px 60px" }}>
        {cards.map((c, i) => (
          <Card key={c.id} title={c.title} body={c.body} index={i} theme={theme} />
        ))}
      </div>
    </div>
  );
}

function Card({ title, body, index, theme }: { title: string; body: string; index: number; theme: ThemePalette }) {
  const style = theme.layout.cardStyle;
  const soft = style === "soft";
  const base: CSSProperties = {
    background: theme.surface,
    borderRadius: soft ? theme.radius : 0,
    padding: "30px 28px",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  };

  if (style === "borderless") {
    return (
      <div style={{ ...base, background: "transparent", padding: "12px 0" }}>
        <div style={{ color: theme.muted, fontSize: 14, fontFamily: theme.fontMono, marginBottom: 8 }}>{String(index + 1).padStart(2, "0")}</div>
        <div style={{ color: theme.ink, fontWeight: 700, fontSize: 24, fontFamily: theme.fontHeading, marginBottom: 14 }}>{title}</div>
        <div style={{ color: theme.muted, fontSize: 18, lineHeight: 1.45 }}>{body}</div>
      </div>
    );
  }

  if (style === "ascii") {
    return (
      <div style={{ ...base, border: `1px solid ${theme.border}`, fontFamily: theme.fontMono, borderRadius: 0 }}>
        <div style={{ color: theme.accent, fontFamily: theme.fontMono, marginBottom: 10 }}>┌── {String(index + 1).padStart(2, "0")} ──┐</div>
        <div style={{ color: theme.ink, fontWeight: 700, fontSize: 22, marginBottom: 14 }}>{title}</div>
        <div style={{ color: theme.muted, fontSize: 16, lineHeight: 1.45 }}>{body}</div>
      </div>
    );
  }

  if (style === "neon") {
    return (
      <div style={{ ...base, border: `1px solid ${theme.accent}`, borderRadius: 0, background: theme.surface }}>
        <div style={{ position: "absolute", top: 8, left: 8, width: 10, height: 10, borderTop: `2px solid ${theme.accent}`, borderLeft: `2px solid ${theme.accent}` }} />
        <div style={{ position: "absolute", bottom: 8, right: 8, width: 10, height: 10, borderBottom: `2px solid ${theme.accent}`, borderRight: `2px solid ${theme.accent}` }} />
        <div style={{ color: theme.accent, fontFamily: theme.fontMono, fontSize: 13, marginBottom: 10 }}>{String(index + 1).padStart(2, "0")}</div>
        <div style={{ color: theme.ink, fontWeight: 700, fontSize: 23, fontFamily: theme.fontHeading, marginBottom: 14 }}>{title}</div>
        <div style={{ color: theme.muted, fontSize: 17, lineHeight: 1.45 }}>{body}</div>
      </div>
    );
  }

  if (style === "image-led") {
    return (
      <div style={{ display: "flex", flexDirection: "column", position: "relative", background: "transparent", overflow: "hidden" }}>
        <div style={{ height: 150, width: "100%", position: "relative", overflow: "hidden", marginBottom: 18, border: `1px solid ${theme.border}` }}>
          <Placeholder theme={theme} />
        </div>
        <div style={{ color: theme.accent, fontFamily: theme.fontMono, fontSize: 13, marginBottom: 6 }}>{String(index + 1).padStart(2, "0")}</div>
        <div style={{ color: theme.ink, fontWeight: 700, fontSize: 26, fontFamily: theme.fontHeading, fontStyle: "italic", marginBottom: 10 }}>{title}</div>
        <div style={{ color: theme.muted, fontSize: 17, lineHeight: 1.5 }}>{body}</div>
      </div>
    );
  }

  // hard / soft / line
  const hasTopBar = style === "hard";
  return (
    <div style={{ ...base, border: `1px solid ${style === "line" ? theme.border : theme.border}` }}>
      {hasTopBar && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: theme.accent }} />}
      {style === "line" && <div style={{ position: "absolute", top: 0, left: 0, width: 40, height: 3, background: theme.accent }} />}
      <div style={{ color: theme.ink, fontWeight: 700, fontSize: 24, fontFamily: theme.fontHeading, marginBottom: 14, marginTop: hasTopBar ? 6 : 0 }}>{title}</div>
      <div style={{ color: theme.muted, fontSize: 18, lineHeight: 1.45 }}>{body}</div>
    </div>
  );
}

function MetricsSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const metrics = slide.metrics ?? [];
  const style = theme.layout.metricStyle;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 36, padding: "0 72px 40px" }}>
        {metrics.map((m, i) => (
          <Metric key={m.id} value={m.value} label={m.label} index={i} theme={theme} style={style} />
        ))}
      </div>
    </div>
  );
}

function Metric({ value, label, index, theme, style }: { value: string; label: string; index: number; theme: ThemePalette; style: ThemePalette["layout"]["metricStyle"] }) {
  if (style === "plain") {
    return (
      <div style={{ flex: 1, textAlign: "center", maxWidth: 320 }}>
        <div style={{ color: theme.accent, fontWeight: 800, fontSize: 64, fontFamily: theme.fontHeading, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
        <div style={{ width: 40, height: 3, background: theme.accent, margin: "18px auto" }} />
        <div style={{ color: theme.muted, fontSize: 18 }}>{label}</div>
      </div>
    );
  }
  if (style === "serif") {
    return (
      <div style={{ flex: 1, textAlign: "center", maxWidth: 340 }}>
        <div style={{ color: theme.ink, fontWeight: 700, fontSize: 84, fontFamily: theme.fontHeading, lineHeight: 1 }}>{value}</div>
        <div style={{ color: theme.muted, fontSize: 17, marginTop: 14, fontFamily: theme.fontHeading, fontStyle: "italic" }}>{label}</div>
      </div>
    );
  }
  if (style === "mono") {
    return (
      <div style={{ flex: 1, maxWidth: 340, borderLeft: index === 0 ? "none" : `1px solid ${theme.border}`, padding: "0 30px", fontFamily: theme.fontMono }}>
        <div style={{ color: theme.accent, fontFamily: theme.fontMono, fontSize: 13, marginBottom: 10 }}>{String(index + 1).padStart(2, "0")}</div>
        <div style={{ color: theme.ink, fontWeight: 700, fontSize: 52, lineHeight: 1 }}>{value}</div>
        <div style={{ color: theme.muted, fontSize: 15, marginTop: 12 }}>{label}</div>
      </div>
    );
  }
  if (style === "neon") {
    return (
      <div style={{ flex: 1, textAlign: "center", maxWidth: 340, position: "relative" }}>
        <div style={{ color: theme.accent, fontWeight: 800, fontSize: 68, fontFamily: theme.fontMono, lineHeight: 1 }}>{value}</div>
        <div style={{ color: theme.muted, fontSize: 17, marginTop: 14 }}>{label}</div>
      </div>
    );
  }
  // box
  return (
    <div style={{ flex: 1, background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: theme.radius >= 12 ? 16 : 0, padding: "42px 28px", textAlign: "center", maxWidth: 340 }}>
      <div style={{ color: theme.accent, fontWeight: 800, fontSize: 64, fontFamily: theme.fontHeading, letterSpacing: -1, lineHeight: 1 }}>{value}</div>
      <div style={{ width: 56, height: 3, background: theme.accent, margin: "20px auto" }} />
      <div style={{ color: theme.muted, fontSize: 19, lineHeight: 1.35 }}>{label}</div>
    </div>
  );
}

function DefinitionSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const d = slide.definition;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} size={36} />
      <div style={{ flex: 1, padding: "24px 72px 60px", display: "flex", flexDirection: "column", gap: 22 }}>
        {d && (
          <>
            <div style={{ border: `2px solid ${theme.accent}`, borderRadius: theme.radius >= 12 ? 12 : 0, padding: "22px 28px", background: theme.surface }}>
              <div style={{ color: theme.ink, fontWeight: 800, fontSize: 28, fontFamily: theme.fontHeading }}>{d.term}</div>
              <div style={{ color: theme.muted, fontSize: 20, marginTop: 8, lineHeight: 1.4 }}>{d.statement}</div>
            </div>
            {d.formula && (
              <div style={{ background: theme.id === "luxe" || theme.id === "terminal" || theme.id === "cyberpunk" ? "#000000" : "#0E0E10", color: "#FFFFFF", borderRadius: theme.radius >= 12 ? 10 : 0, padding: "18px 28px", fontFamily: theme.fontMono, fontSize: 26, textAlign: "center", letterSpacing: 1 }}>
                {d.formula}
              </div>
            )}
            <div style={{ display: "flex", gap: 32 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.accent, fontWeight: 700, fontSize: 20, marginBottom: 12, letterSpacing: 1 }}>EXEMPLES</div>
                {d.examples.map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                    <span style={{ color: theme.accent, fontWeight: 800 }}>✓</span>
                    <span style={{ color: theme.ink, fontSize: 18 }}>{e}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#D64545", fontWeight: 700, fontSize: 20, marginBottom: 12, letterSpacing: 1 }}>CONTRE-EXEMPLES</div>
                {d.counterExamples.map((e, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                    <span style={{ color: "#D64545", fontWeight: 800 }}>✗</span>
                    <span style={{ color: theme.ink, fontSize: 18 }}>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LabSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const step = slide.steps?.[0];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} size={34} />
      <div style={{ flex: 1, padding: "20px 72px 56px", display: "flex", flexDirection: "column", gap: 16 }}>
        {step && (
          <>
            {slide.steps!.length > 1 && (
              <div style={{ color: theme.muted, fontSize: 16, fontFamily: theme.fontMono, letterSpacing: 1 }}>
                {slide.steps!.map((s, i) => `Étape ${i + 1}`).join("  ·  ")}
              </div>
            )}
            <div style={{ color: theme.accent, fontWeight: 700, fontSize: 22, fontFamily: theme.fontMono }}>{kickerText(theme, step.title)}</div>
            <div style={{ color: theme.ink, fontSize: 21, lineHeight: 1.4 }}>{step.body}</div>
            {step.command && (
              <div>
                <div style={{ color: theme.muted, fontSize: 13, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 8 }}>COMMANDE</div>
                <div style={{ background: theme.id === "luxe" || theme.id === "terminal" || theme.id === "cyberpunk" ? "#000000" : "#0E0E10", color: "#3FB950", fontFamily: theme.fontMono, fontSize: 22, padding: "16px 24px", borderRadius: theme.radius >= 12 ? 10 : 0 }}>
                  <span style={{ color: "#8B949E" }}>$ </span>
                  {step.command}
                </div>
              </div>
            )}
            {step.output && (
              <div>
                <div style={{ color: theme.muted, fontSize: 13, fontFamily: theme.fontMono, letterSpacing: 2, marginBottom: 8 }}>SORTIE ATTENDUE</div>
                <div style={{ background: theme.id === "luxe" || theme.id === "terminal" || theme.id === "cyberpunk" ? "#0B0D1C" : "#1B1F24", color: "#E6EDF3", fontFamily: theme.fontMono, fontSize: 18, padding: "16px 24px", borderRadius: theme.radius >= 12 ? 10 : 0, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {step.output}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WorkflowSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const steps = slide.steps ?? [];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} size={36} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 72px 60px" }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div style={{ flex: 1, textAlign: "center", padding: "0 8px" }}>
              <div style={{ width: 56, height: 56, borderRadius: theme.radius >= 12 ? "50%" : 0, background: theme.accent, color: theme.accentInk, fontWeight: 800, fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", fontFamily: theme.fontHeading }}>
                {i + 1}
              </div>
              <div style={{ color: theme.ink, fontWeight: 700, fontSize: 22, fontFamily: theme.fontHeading, marginBottom: 10 }}>{s.title}</div>
              <div style={{ color: theme.muted, fontSize: 16, lineHeight: 1.4 }}>{s.body}</div>
            </div>
            {i < steps.length - 1 && <div style={{ width: 48, height: 3, background: theme.accent, flexShrink: 0, marginTop: -28 }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function ComparisonSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const comp = slide.comparison;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} size={36} />
      <div style={{ flex: 1, padding: "24px 72px 60px" }}>
        {comp && (
          <div style={{ display: "flex", flexDirection: "column", borderRadius: theme.radius >= 12 ? 12 : 0, overflow: "hidden", border: `1px solid ${theme.border}` }}>
            <div style={{ display: "flex" }}>
              <div style={{ width: 220, background: theme.ink, color: theme.background, padding: "14px 20px", fontWeight: 700, fontSize: 16 }} />
              <div style={{ flex: 1, background: theme.accent, color: theme.accentInk, padding: "14px 20px", fontWeight: 700, fontSize: 20, textAlign: "center" }}>{comp.leftTitle}</div>
              <div style={{ flex: 1, background: theme.accent, color: theme.accentInk, padding: "14px 20px", fontWeight: 700, fontSize: 20, textAlign: "center" }}>{comp.rightTitle}</div>
            </div>
            {comp.rows.map((r, i) => (
              <div key={r.id} style={{ display: "flex", borderTop: `1px solid ${theme.border}`, background: i % 2 ? theme.surface : theme.background }}>
                <div style={{ width: 220, padding: "14px 20px", fontWeight: 700, fontSize: 17, color: theme.ink, display: "flex", alignItems: "center" }}>{r.label}</div>
                <div style={{ flex: 1, padding: "14px 20px", fontSize: 18, color: theme.ink, display: "flex", alignItems: "center" }}>{r.left}</div>
                <div style={{ flex: 1, padding: "14px 20px", fontSize: 18, color: theme.ink, display: "flex", alignItems: "center", borderLeft: `1px solid ${theme.border}` }}>{r.right}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const items = slide.timeline ?? [];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      <Header slide={slide} theme={theme} size={36} />
      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", padding: "80px 72px 60px" }}>
        {items.map((it, i) => (
          <div key={it.id} style={{ flex: 1, position: "relative", paddingRight: 24 }}>
            <div style={{ position: "absolute", top: 8, left: 0, right: 24, height: 3, background: theme.accent, opacity: 0.35 }} />
            <div style={{ position: "relative", width: 20, height: 20, borderRadius: theme.radius >= 12 ? "50%" : 0, background: theme.accent, marginBottom: 18 }} />
            <div style={{ color: theme.accent, fontWeight: 800, fontSize: 20, fontFamily: theme.fontMono, marginBottom: 8 }}>{it.date}</div>
            <div style={{ color: theme.ink, fontWeight: 700, fontSize: 22, fontFamily: theme.fontHeading, marginBottom: 10 }}>{it.title}</div>
            <div style={{ color: theme.muted, fontSize: 16, lineHeight: 1.45 }}>{it.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConclusionSlide({ slide, theme }: { slide: Slide; theme: ThemePalette }) {
  const center = theme.layout.headerAlign === "center";
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: center ? "center" : "left", padding: "0 160px" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 10, background: theme.accent }} />
      {slide.kicker && <Kicker theme={theme} text={slide.kicker} />}
      <div style={{ color: theme.ink, fontWeight: 800, fontSize: 56, lineHeight: 1.05, fontFamily: theme.fontHeading, letterSpacing: -1 }}>
        <TitleText theme={theme} text={slide.title} />
      </div>
      {slide.conclusion && <div style={{ color: theme.muted, fontSize: 24, marginTop: 26, maxWidth: 820, lineHeight: 1.5 }}>{slide.conclusion}</div>}
      <div style={{ width: 80, height: 6, background: theme.accent, margin: "34px 0" }} />
      {(slide.bullets ?? []).map((b, i) => (
        <div key={i} style={{ color: theme.ink, fontSize: 20, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <BulletMarker theme={theme} />
          {b}
        </div>
      ))}
    </div>
  );
}
