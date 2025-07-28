import z from "zod";
import { $ZodType } from "zod/v4/core";

export type ActionResult<
  SuccessPayload extends void | object,
  ErrorMap extends unknown | object,
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

export type ActionResultSuccess<SuccessPayload extends void | object> = Promise<
  ActionResult<SuccessPayload, void>
>;

export type ActionResultSimple = Promise<ActionResult<void, void>>;

export type ValidationResult<
  OutputContext extends void | object,
  ErrorMap extends unknown | object,
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

export type ValidationResultWithContext<
  OutputContext extends void | object,
  ErrorMap extends unknown | object,
> = Promise<ValidationResult<OutputContext, ErrorMap>>;

export type ValidationResultWithoutContext<ErrorMap extends unknown | object> =
  Promise<ValidationResult<void, ErrorMap>>;

export type ValidationResultWithoutError<OutputContext extends void | object> =
  Promise<ValidationResult<OutputContext, unknown>>;

export type ValidationResultAny = Promise<ValidationResult<void, unknown>>;

export type ActionHandler<
  InputSchema extends $ZodType,
  Output extends void | object,
  Context extends object,
  ErrorMap extends unknown | object,
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
  ErrorMap extends unknown | object,
> = ({
  params,
  context,
}: {
  params: z.infer<InputSchema>;
  context: Context;
}) => ValidationResultWithContext<OutputContext, ErrorMap>;
