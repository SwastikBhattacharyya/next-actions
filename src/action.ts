import z from "zod";
import { $ZodType } from "zod/v4/core";
import { ActionHandler, ActionResult, ValidationHandler } from "./types";

/**
 * A composable, type-safe action builder for creating a validation and
 * execution pipeline.
 *
 * This class enables step-by-step construction of an action by chaining
 * validators and attaching a final action function. Each validator can inject
 * some context or halt execution with an error. The final action executes only
 * if all validators pass.
 *
 * @template InputSchema - A Zod schema representing the shape of the action
 * input.
 * @template Output - The payload returned on success.
 * @template Context - The accumulated context passed through the pipeline.
 * @template ErrorMap - A map where each key is an error code, and the
 * corresponding value is the payload associated with that specific error.
 */
export class Action<
  InputSchema extends $ZodType,
  Output extends void | object,
  Context extends object,
  ErrorMap extends object,
> {
  private context: Context;
  private validators: ValidationHandler<InputSchema, Context, object, object>[];
  private actionFn?: ActionHandler<InputSchema, Output, Context, ErrorMap>;

  constructor() {
    this.context = {} as Context;
    this.validators = [];
  }

  /**
   * Defines the Zod schema for the action's input.
   *
   * This schema is not enforced automatically. To perform validation, use a
   * validator like `zodValidator`.
   *
   * @param schema - The Zod schema to associate with the action.
   * @returns Same instance with updated schema context.
   */
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

  /**
   * Adds a validator function to the action pipeline.
   *
   * The validator can extend the context and contribute to the combined error
   * map.
   *
   * @param validator - A validation function to run before the action executes.
   * @returns Same instance with extended context and error map.
   */
  addValidator<
    OutputContext extends void | object = void,
    OutputErrorMap extends void | object = void,
  >(
    validator: ValidationHandler<
      InputSchema,
      Context,
      OutputContext,
      OutputErrorMap
    >,
  ) {
    (
      this.validators as unknown as ValidationHandler<
        InputSchema,
        Context,
        OutputContext,
        OutputErrorMap
      >[]
    ).push(validator);
    return this as unknown as Action<
      InputSchema,
      Output,
      Context & (OutputContext extends void ? object : OutputContext),
      ErrorMap & (OutputErrorMap extends void ? object : OutputErrorMap)
    >;
  }

  /**
   * Sets the final action function to execute after all validators succeed.
   *
   * The action function receives the input params and the accumulated context.
   *
   * @param actionFn - The function to execute as the main action.
   * @returns A bound execute function that runs the complete pipeline.
   */
  setActionFn<
    Output extends void | object = void,
    OutputErrorMap extends void | object = void,
  >(actionFn: ActionHandler<InputSchema, Output, Context, OutputErrorMap>) {
    (this.actionFn as unknown as ActionHandler<
      InputSchema,
      Output,
      Context,
      OutputErrorMap
    >) = actionFn;
    return (
      this as unknown as Action<
        InputSchema,
        Output,
        Context,
        ErrorMap & (OutputErrorMap extends void ? object : OutputErrorMap)
      >
    ).execute.bind(this);
  }

  /**
   * Executes the validation pipeline followed by the main action function.
   *
   * If any validator fails, returns a structured error result.
   * Otherwise, runs the action function and returns its result.
   *
   * @param params - The input parameters to validate and pass to the action.
   * @returns A promise resolving to an {@link ActionResult}.
   */
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
