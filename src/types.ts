import z from "zod";
import { $ZodType } from "zod/v4/core/schemas.cjs";

export type ActionResult<SuccessPayload extends void | object> =
  | (SuccessPayload extends void
      ? {
          success: true;
          message: string;
        }
      : {
          success: true;
          message: string;
          payload: SuccessPayload;
        })
  | {
      success: false;
      message: string;
    };

export type ActionFn<
  InputSchema extends $ZodType,
  Output extends void | object,
  Context extends object,
> = ({
  params,
  context,
}: {
  params: z.infer<InputSchema>;
  context: Context;
}) => Promise<ActionResult<Output>>;
