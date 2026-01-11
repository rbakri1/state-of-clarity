import type { Metadata } from "next";
import BriefPageClient from "./BriefPageClient";

// Import sample briefs for metadata generation
import briefUK4Day from "@/sample-briefs/uk-four-day-week.json";
import briefWhatIsState from "@/sample-briefs/what-is-a-state.json";

const briefs: { [key: string]: any } = {
  "uk-four-day-week": briefUK4Day,
  "what-is-a-state": briefWhatIsState,
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const brief = briefs[id] || briefUK4Day;

  const title = brief.question;
  const description =
    brief.summaries.standard?.slice(0, 155) +
    (brief.summaries.standard?.length > 155 ? "..." : "");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://stateofclarity.com";
  const canonicalUrl = `${siteUrl}/brief/${id}`;
  const defaultImage = `${siteUrl}/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: "State of Clarity",
      images: [
        {
          url: defaultImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [defaultImage],
    },
  };
}

export default function BriefPage() {
  return <BriefPageClient />;
}
