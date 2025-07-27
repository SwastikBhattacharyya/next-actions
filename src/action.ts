import z from "zod";
import { $ZodType } from "zod/v4/core/schemas.cjs";
import { ActionFn, ActionResult } from "./types";

export class Action<
  InputSchema extends $ZodType,
  Output extends void | object,
  Context extends object,
> {
  private context: Context;
  private actionFn?: ActionFn<InputSchema, Output, Context>;

  constructor() {
    this.context = {} as Context;
  }

  setInputSchema<Schema extends $ZodType>(schema: Schema) {
    Object.assign(this.context, {
      inputSchema: schema,
    });
    return this as unknown as Action<
      Schema,
      Output,
      Context & { inputSchema: Schema }
    >;
  }

  setActionFn<Output extends void | object = void>(
    actionFn: ActionFn<InputSchema, Output, Context>,
  ) {
    (this.actionFn as unknown as ActionFn<InputSchema, Output, Context>) =
      actionFn;
    return (
      this as unknown as Action<InputSchema, Output, Context>
    ).execute.bind(this);
  }

  private async execute(
    params: z.infer<InputSchema>,
  ): Promise<ActionResult<Output>> {
    if (!this.actionFn) throw new Error("Action function is undefined");
    return this.actionFn({ params, context: this.context });
  }
}
