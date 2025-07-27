import z from "zod";
import { $ZodType } from "zod/v4/core/schemas.cjs";
import { ActionFn, ActionResult } from "./types";

export class Action<InputSchema extends $ZodType, Context extends object> {
  private context: Context;
  private actionFn?: ActionFn<InputSchema, Context>;

  constructor() {
    this.context = {} as Context;
  }

  setInputSchema<Schema extends $ZodType>(schema: Schema) {
    Object.assign(this.context, {
      inputSchema: schema,
    });
    return this as unknown as Action<Schema, Context & { inputSchema: Schema }>;
  }

  setActionFn(actionFn: ActionFn<InputSchema, Context>) {
    this.actionFn = actionFn;
    return this.execute.bind(this);
  }

  private async execute(params: z.infer<InputSchema>): Promise<ActionResult> {
    if (!this.actionFn) throw new Error("Action function is undefined");
    return this.actionFn({ params, context: this.context });
  }
}
