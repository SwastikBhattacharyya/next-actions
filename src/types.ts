import z from "zod";
import { $ZodType } from "zod/v4/core";

export type ActionResult<
  SuccessPayload extends void | object,
  ErrorMap extends void | object,
> =
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
  | ({
      success: false;
      message: string;
    } & {
      [K in keyof ErrorMap]: {
        errorCode: K;
        errorPayload: ErrorMap[K];
      };
    }[keyof ErrorMap]);

export type ActionResultWithoutPayload<ErrorMap extends void | object> =
  Promise<ActionResult<void, ErrorMap>>;

export type ActionResultWithoutError<SuccessPayload extends void | object> =
  Promise<ActionResult<SuccessPayload, void>>;

export type ActionResultAny = Promise<ActionResult<void, void>>;

export type ValidationResult<
  OutputContext extends void | object,
  ErrorMap extends void | object,
> =
  | (OutputContext extends object
      ? {
          ok: true;
          context: OutputContext;
        }
      : {
          ok: true;
        })
  | (ErrorMap extends object
      ? {
          ok: false;
          errorCode: keyof ErrorMap;
          payload: ErrorMap[keyof ErrorMap];
        }
      : {
          ok: false;
        });

export type ValidationResultWithoutContext<ErrorMap extends void | object> =
  Promise<ValidationResult<void, ErrorMap>>;

export type ValidationResultWithoutError<OutputContext extends void | object> =
  Promise<ValidationResult<OutputContext, void>>;

export type ValidationResultAny = Promise<ValidationResult<void, void>>;

export type ActionHandler<
  InputSchema extends $ZodType,
  Output extends void | object,
  Context extends object,
  ErrorMap extends void | object,
> = ({
  params,
  context,
}: {
  params: z.infer<InputSchema>;
  context: Context;
}) => Promise<ActionResult<Output, ErrorMap>>;

export type ValidationHandler<
  InputSchema extends $ZodType,
  Context extends object,
  OutputContext extends void | object,
  ErrorMap extends void | object,
> = ({
  params,
  context,
}: {
  params: z.infer<InputSchema>;
  context: Context;
}) => Promise<ValidationResult<OutputContext, ErrorMap>>;
