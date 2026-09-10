const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const REQUEST_TIMEOUT_MS = 20000;
const MAX_RESUME_CONTENT_LENGTH = 12000;
const MAX_OUTPUT_TOKENS = 2000;
const RETRY_MAX_OUTPUT_TOKENS = 4000;
const reviewFields = ["overall_assessment", "strengths", "improvement_suggestions", "missing_sections", "keyword_suggestions", "ats_considerations"];

export class AiResumeReviewError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const reviewSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "overall_assessment",
    "strengths",
    "improvement_suggestions",
    "missing_sections",
    "keyword_suggestions",
    "ats_considerations",
  ],
  properties: {
    overall_assessment: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvement_suggestions: { type: "array", items: { type: "string" } },
    missing_sections: { type: "array", items: { type: "string" } },
    keyword_suggestions: { type: "array", items: { type: "string" } },
    ats_considerations: { type: "array", items: { type: "string" } },
  },
};

const normalizeList = (value) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new AiResumeReviewError(502, "AI review returned an invalid response. Please try again.");
  }
  return value.map((item) => item.trim()).filter(Boolean);
};

const outputContentTypes = (payload) => Array.isArray(payload?.output)
  ? payload.output.flatMap((item) => Array.isArray(item?.content) ? item.content.map((content) => content?.type).filter(Boolean) : [])
  : [];

const logResponseDiagnostic = (event, payload) => {
  console.warn("[AI resume review]", event, {
    responseId: typeof payload?.id === "string" ? payload.id : null,
    model: typeof payload?.model === "string" ? payload.model : null,
    status: typeof payload?.status === "string" ? payload.status : null,
    incompleteReason: typeof payload?.incomplete_details?.reason === "string" ? payload.incomplete_details.reason : null,
    hasOutputText: typeof payload?.output_text === "string" && Boolean(payload.output_text.trim()),
    outputContentTypes: outputContentTypes(payload),
    errorType: typeof payload?.error?.type === "string" ? payload.error.type : null,
  });
};

export const parseResumeReview = (outputText) => {
  let review;
  try {
    review = JSON.parse(outputText);
  } catch {
    throw new AiResumeReviewError(502, "AI review returned an invalid response. Please try again.");
  }

  if (!review || typeof review !== "object" || Array.isArray(review) || typeof review.overall_assessment !== "string" || !review.overall_assessment.trim()) {
    throw new AiResumeReviewError(502, "AI review returned an invalid response. Please try again.");
  }

  if (Object.keys(review).some((field) => !reviewFields.includes(field))) {
    throw new AiResumeReviewError(502, "AI review returned an invalid response. Please try again.");
  }

  return {
    overall_assessment: review.overall_assessment.trim(),
    strengths: normalizeList(review.strengths),
    improvement_suggestions: normalizeList(review.improvement_suggestions),
    missing_sections: normalizeList(review.missing_sections),
    keyword_suggestions: normalizeList(review.keyword_suggestions),
    ats_considerations: normalizeList(review.ats_considerations),
  };
};

const outputTextFrom = (payload) => {
  if (payload?.status === "incomplete") {
    throw new AiResumeReviewError(502, "AI review was incomplete. Please try again.");
  }

  const refusal = Array.isArray(payload?.output)
    ? payload.output.flatMap((item) => Array.isArray(item?.content) ? item.content : []).find((item) => item?.type === "refusal")
    : null;
  if (refusal) {
    throw new AiResumeReviewError(502, "AI review could not be completed for this resume. Please try again.");
  }

  if (typeof payload?.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  const text = payload?.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (typeof text === "string" && text.trim()) return text;
  throw new AiResumeReviewError(502, "AI review returned no structured output. Please try again.");
};

export const reviewResumeContent = async ({ title, content }) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new AiResumeReviewError(503, "AI resume review is not configured yet.");
  }

  try {
    const requestReview = async (maxOutputTokens) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(OPENAI_RESPONSES_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-5-mini",
            store: false,
            max_output_tokens: maxOutputTokens,
            text: { format: { type: "json_schema", name: "resume_review", strict: true, schema: reviewSchema } },
            input: [
              {
                role: "system",
                content: [{ type: "input_text", text: "Review only the supplied resume title and content. Do not invent qualifications, experience, education, projects, or skills. Identify missing information rather than assuming it exists. Give practical, career-oriented guidance. ATS considerations are suggestions, not guarantees, and this is not a hiring decision. Return only the requested JSON." }],
              },
              {
                role: "user",
                content: [{ type: "input_text", text: `Resume title:\n${title}\n\nResume content:\n${content.slice(0, MAX_RESUME_CONTENT_LENGTH)}` }],
              },
            ],
          }),
        });

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          logResponseDiagnostic(`OpenAI request failed with HTTP ${response.status}`, errorPayload);
          if (response.status === 429) throw new AiResumeReviewError(429, "AI resume review is temporarily rate-limited. Please try again later.");
          throw new AiResumeReviewError(502, "AI resume review is currently unavailable. Please try again later.");
        }

        return response.json();
      } finally {
        clearTimeout(timeout);
      }
    };

    let payload = await requestReview(MAX_OUTPUT_TOKENS);
    if (payload?.status === "incomplete" && payload?.incomplete_details?.reason === "max_output_tokens") {
      logResponseDiagnostic("AI review reached the output limit; retrying once with a larger budget", payload);
      payload = await requestReview(RETRY_MAX_OUTPUT_TOKENS);
    }

    try {
      return parseResumeReview(outputTextFrom(payload));
    } catch (error) {
      logResponseDiagnostic(error instanceof AiResumeReviewError ? error.message : "AI review parsing failed", payload);
      throw error;
    }
  } catch (error) {
    if (error instanceof AiResumeReviewError) throw error;
    if (error?.name === "AbortError") throw new AiResumeReviewError(504, "AI resume review timed out. Please try again.");
    throw new AiResumeReviewError(502, "AI resume review is currently unavailable. Please try again later.");
  }
};
