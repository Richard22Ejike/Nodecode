import Handlebars from "handlebars";
import { NonRetriableError } from "inngest";

Handlebars.registerHelper("json", (context) => {
  try {
    const jsonString = JSON.stringify(context, null, 2);
    return new Handlebars.SafeString(jsonString);
  } catch (error) {
    throw new Error(
      `Failed to serialize context to JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
});

// Convert JS-style array indexing inside {{expressions}} to Handlebars segment
// syntax, e.g. {{search.results[0].url}} -> {{search.results.[0].url}}.
// LLM-generated templates frequently use the JS style, which Handlebars rejects.
export function normalizeTemplate(template: string): string {
  return template.replace(
    /\{\{([^{}]*)\}\}/g,
    (_match, inner: string) =>
      `{{${inner.replace(/([\w\]])\[(\d+)\]/g, "$1.[$2]")}}}`,
  );
}

export function compileTemplate(
  template: string,
  context: Record<string, unknown>,
  errorPrefix: string,
): string {
  try {
    // noEscape: values are used as URLs, queries and prompts, not HTML —
    // default escaping would turn e.g. "&" in URLs into "&amp;"
    const result = Handlebars.compile(normalizeTemplate(template), {
      noEscape: true,
    })(context);
    if (!result || typeof result !== "string") {
      const availableVariables = Object.keys(context)
        .filter((key) => !key.startsWith("_"))
        .join(", ");
      throw new Error(
        `Template "${template}" resolved to an empty string. ` +
          `Available variables from previous nodes: ${availableVariables || "none (is this node connected after the node it references?)"}`,
      );
    }
    return result;
  } catch (error) {
    throw new NonRetriableError(
      `${errorPrefix}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
