"use client";

import { CitationTooltip, type CitationSource } from "./CitationTooltip";

interface Source extends CitationSource {
  url: string;
  author: string | null;
  source_type: "primary" | "secondary" | "tertiary" | null;
  excerpt: string | null;
}

interface NarrativeSectionProps {
  narrative: string;
  sources: Source[];
}

function parseNarrativeWithCitations(
  narrative: string,
  sources: Source[],
  onCitationClick: (index: number) => void
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(narrative)) !== null) {
    // Add text before the citation
    if (match.index > lastIndex) {
      parts.push(narrative.slice(lastIndex, match.index));
    }

    const citationNumber = parseInt(match[1], 10);
    const sourceIndex = citationNumber - 1;
    const source = sources[sourceIndex];

    if (source) {
      parts.push(
        <CitationTooltip
          key={`citation-${match.index}-${citationNumber}`}
          source={source}
          citationNumber={citationNumber}
          onCitationClick={() => onCitationClick(citationNumber)}
        />
      );
    } else {
      // If source not found, just render the citation as text
      parts.push(
        <sup key={`citation-${match.index}`} className="text-xs text-muted-foreground">
          [{citationNumber}]
        </sup>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last citation
  if (lastIndex < narrative.length) {
    parts.push(narrative.slice(lastIndex));
  }

  return parts;
}

export function NarrativeSection({ narrative, sources }: NarrativeSectionProps) {
  const handleCitationClick = (citationNumber: number) => {
    const sourceElement = document.getElementById(`source-${citationNumber}`);
    if (sourceElement) {
      sourceElement.scrollIntoView({ behavior: "smooth", block: "center" });
      // Flash highlight effect
      sourceElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        sourceElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }
  };

  const paragraphs = narrative.split("\n\n");

  return (
    <div className="prose prose-clarity" style={{ maxWidth: "65ch" }}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4 text-base leading-relaxed">
          {parseNarrativeWithCitations(paragraph, sources, handleCitationClick)}
        </p>
      ))}
    </div>
  );
}
