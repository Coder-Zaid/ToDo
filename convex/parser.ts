import * as chrono from "chrono-node";

export interface ParsedTask {
  title: string;
  deadline: number | null;
}

export function parseTaskFromText(rawText: string): ParsedTask {
  let text = rawText.trim();
  if (!text) {
    return { title: "", deadline: null };
  }

  // Strip prefixes like "!todo ", "todo: ", "add: "
  text = text.replace(/^(todo[:\s-]*|task[:\s-]*|add[:\s-]*)/i, "").trim();

  // Normalize recurring/relative patterns
  const recurringRegex = /\bevery\s+(\d+)?\s*(day|week|month|year)s?\b/gi;
  text = text.replace(recurringRegex, "tomorrow");

  const beforeMonthRegex =
    /\bbefore\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\b/gi;
  text = text.replace(beforeMonthRegex, "1 $1");

  const underRegex = /\bunder\s+(\d+)\s+(day|week|month)s?\b/gi;
  text = text.replace(underRegex, "in $1 $2s");

  // Parse natural language date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed = (chrono as any).en.GB.parse(text, new Date(), {
    forwardDate: true,
  });
  let deadline: number | null = null;
  let cleanTitle = text;

  if (parsed.length > 0) {
    const result = parsed[0];
    const date = result.start.date();

    // Default to end-of-day (23:59:59) if no specific time was set
    if (!result.start.isCertain("hour") && !result.start.isCertain("minute")) {
      date.setHours(23, 59, 59, 999);
    }
    deadline = date.getTime();

    // Strip date string from title
    const beforeDate = text.slice(0, result.index).trim();
    const afterDate = text.slice(result.index + result.text.length).trim();
    cleanTitle = `${beforeDate} ${afterDate}`.replace(/\s+/g, " ").trim();

    // Remove dangling prepositions
    cleanTitle = cleanTitle.replace(/\b(by|at|on|for|due)\s*$/i, "").trim();
  }

  if (!cleanTitle && text) {
    cleanTitle = text;
  }

  return {
    title: cleanTitle || "Untitled Task",
    deadline,
  };
}
