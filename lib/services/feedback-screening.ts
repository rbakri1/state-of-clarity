import Anthropic from "@anthropic-ai/sdk";

export type FeedbackType = "source_suggestion" | "error_report" | "edit_proposal";

export interface ScreeningResult {
  approved: boolean;
  flagged: boolean;
  reason?: string;
  confidence: number;
}

interface FeedbackContent {
  url?: string;
  notes?: string;
  error_type?: string;
  description?: string;
  original_text?: string;
  proposed_text?: string;
  rationale?: string;
}

function buildPrompt(type: FeedbackType, content: FeedbackContent): string {
  const baseInstructions = `You are a content moderation AI for a political news briefing platform.
Your job is to screen user-submitted feedback for spam, abuse, off-topic content, and low-effort submissions.

Analyze the following ${type.replace("_", " ")} and determine:
1. Should it be APPROVED for admin review? (legitimate, constructive feedback)
2. Should it be FLAGGED for immediate rejection? (spam, abuse, hate speech, completely off-topic)

Return a JSON object with this exact structure:
{
  "approved": true/false,
  "flagged": true/false,
  "reason": "Brief explanation of your decision",
  "confidence": 0.0-1.0
}

Guidelines:
- APPROVE legitimate feedback even if you disagree with the content
- Only FLAG clear violations: spam, abuse, hate speech, personal attacks, completely unrelated content
- Low-effort but on-topic submissions should be approved with lower confidence
- Political disagreement is NOT a reason to flag
- Be lenient - when in doubt, approve for human review

`;

  switch (type) {
    case "source_suggestion":
      return `${baseInstructions}
SOURCE SUGGESTION:
URL: ${content.url || "Not provided"}
Notes: ${content.notes || "None"}

Evaluate if this is a legitimate source suggestion for a news brief.
Flag only if: spam URL, abusive notes, or completely unrelated.`;

    case "error_report":
      return `${baseInstructions}
ERROR REPORT:
Type: ${content.error_type || "Not specified"}
Description: ${content.description || "Not provided"}

Evaluate if this is a legitimate error report about a news brief.
Flag only if: abusive language, spam, or completely nonsensical.`;

    case "edit_proposal":
      return `${baseInstructions}
EDIT PROPOSAL:
Original Text: ${content.original_text || "Not provided"}
Proposed Text: ${content.proposed_text || "Not provided"}
Rationale: ${content.rationale || "Not provided"}

Evaluate if this is a legitimate edit proposal to improve a news brief.
Flag only if: abusive content, spam, or vandalism attempt.`;
  }
}

export async function screenFeedback(
  type: FeedbackType,
  content: FeedbackContent
): Promise<ScreeningResult> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = buildPrompt(type, content);

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from Claude screening response");
      return defaultPendingResult();
    }

    const result = JSON.parse(jsonMatch[0]) as ScreeningResult;

    if (
      typeof result.approved !== "boolean" ||
      typeof result.flagged !== "boolean" ||
      typeof result.confidence !== "number"
    ) {
      console.error("Invalid screening result structure");
      return defaultPendingResult();
    }

    return {
      approved: result.approved,
      flagged: result.flagged,
      reason: result.reason,
      confidence: Math.max(0, Math.min(1, result.confidence)),
    };
  } catch (error) {
    console.error("AI screening error:", error);
    return defaultPendingResult();
  }
}

function defaultPendingResult(): ScreeningResult {
  return {
    approved: false,
    flagged: false,
    reason: "AI screening unavailable - pending manual review",
    confidence: 0,
  };
}
