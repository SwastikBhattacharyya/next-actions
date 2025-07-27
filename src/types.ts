import z from "zod";
import { $ZodType } from "zod/v4/core/schemas.cjs";

export type ActionResult =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

export type ActionFn<InputSchema extends $ZodType, Context extends object> = ({
  params,
  context,
}: {
  params: z.infer<InputSchema>;
  context: Context;
}) => Promise<ActionResult>;
