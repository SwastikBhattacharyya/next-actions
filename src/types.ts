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

export type ActionFn<InputSchema extends $ZodType> = ({
  params,
}: {
  params: z.infer<InputSchema>;
}) => Promise<ActionResult>;
