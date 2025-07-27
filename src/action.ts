import z from "zod";
import { $ZodType } from "zod/v4/core/schemas.cjs";
import { ActionFn, ActionResult, ValidationFn } from "./types";

export class Action<
  InputSchema extends $ZodType,
  Output extends void | object,
  Context extends object,
  ErrorMap extends object,
> {
  private context: Context;
  private validators: ValidationFn<InputSchema, Context, object, object>[];
  private actionFn?: ActionFn<InputSchema, Output, Context, ErrorMap>;

  constructor() {
    this.context = {} as Context;
    this.validators = [];
  }

  setInputSchema<Schema extends $ZodType>(schema: Schema) {
    Object.assign(this.context, {
      inputSchema: schema,
    });
    return this as unknown as Action<
      Schema,
      Output,
      Context & { inputSchema: Schema },
      ErrorMap
    >;
  }

  addValidator<
    OutputContext extends void | object = void,
    OutputErrorMap extends void | object = void,
  >(
    validator: ValidationFn<
      InputSchema,
      Context,
      OutputContext,
      OutputErrorMap
    >,
  ) {
    (
      this.validators as ValidationFn<
        InputSchema,
        Context,
        OutputContext,
        OutputErrorMap
      >[]
    ).push(validator);
    return this as unknown as Action<
      InputSchema,
      Output,
      Context & OutputContext,
      ErrorMap & OutputErrorMap
    >;
  }

  setActionFn<Output extends void | object = void>(
    actionFn: ActionFn<InputSchema, Output, Context, ErrorMap>,
  ) {
    (this.actionFn as unknown as ActionFn<
      InputSchema,
      Output,
      Context,
      ErrorMap
    >) = actionFn;
    return (
      this as unknown as Action<InputSchema, Output, Context, ErrorMap>
    ).execute.bind(this);
  }

  private async execute(
    params: z.infer<InputSchema>,
  ): Promise<ActionResult<Output, ErrorMap>> {
    if (!this.actionFn) throw new Error("Action function is undefined");
    for (const validator of this.validators) {
      const result = await validator({ params, context: this.context });
      if (!result.ok)
        return {
          success: false,
          message: "Validation failed",
          errorCode: result.errorCode,
          errorPayload: result.payload,
        };
      else Object.assign(this.context, result.context);
    }
    return this.actionFn({ params, context: this.context });
  }
}
