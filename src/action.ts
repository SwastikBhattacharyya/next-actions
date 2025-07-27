import z from "zod";
import { $ZodType } from "zod/v4/core/schemas.cjs";
import { ActionFn, ActionResult } from "./types";

export class Action<InputSchema extends $ZodType> {
  private inputSchema?: InputSchema;
  private actionFn?: ActionFn<InputSchema>;

  setInputSchema<Schema extends $ZodType>(schema: Schema) {
    (this.inputSchema as unknown as Schema) = schema;
    return this as unknown as Action<Schema>;
  }

  setActionFn(actionFn: ActionFn<InputSchema>) {
    this.actionFn = actionFn;
    return this.execute.bind(this);
  }

  private async execute(params: z.infer<InputSchema>): Promise<ActionResult> {
    if (!this.actionFn) throw new Error("Action function is undefined");
    return this.actionFn({ params });
  }
}
