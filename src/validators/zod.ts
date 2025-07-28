import z, { safeParse } from "zod";
import { $ZodIssue, $ZodType } from "zod/v4/core";
import { ValidationResultWithoutContext } from "../types";

/**
 * A validator that checks input against a given Zod schema.
 *
 * If parsing fails, it returns a validation result containing the list of
 * Zod issues under the error code `"zodValidator_invalidParams"`.
 *
 * @template Schema - The Zod schema used to validate the input.
 * @param schema - The Zod schema instance.
 * @param params - The parameters to validate.
 * @returns A promise resolving to a ValidationResult. If parsing fails then
 * the result contains the error code `"zodValidator_invalidParams` along with
 * the list of Zod issues.
 */
export async function zodValidator<Schema extends $ZodType>(
  schema: Schema,
  params: z.infer<Schema>,
): ValidationResultWithoutContext<{
  zodValidator_invalidParams: { issues: $ZodIssue[] };
}> {
  const result = safeParse(schema, params);
  if (!result.success)
    return {
      ok: false,
      errorCode: "zodValidator_invalidParams",
      payload: {
        issues: result.error.issues,
      },
    };
  else
    return {
      ok: true,
    };
}
