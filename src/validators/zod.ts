import z, { safeParse } from "zod";
import { $ZodIssue } from "zod/v4/core/errors.cjs";
import { $ZodType } from "zod/v4/core/schemas.cjs";
import { ValidatorReturnNoContext } from "../types";

type ZodValidatorError = {
  zodValidator_invalidParams: { issues: $ZodIssue[] };
};

export async function zodValidator<Schema extends $ZodType>(
  schema: Schema,
  params: z.infer<Schema>,
): ValidatorReturnNoContext<ZodValidatorError> {
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
