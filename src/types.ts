import z from "zod";
import { $ZodType } from "zod/v4/core/schemas.cjs";

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
  | {
      success: false;
      message: string;
      errorCode: keyof ErrorMap;
      errorPayload: ErrorMap[keyof ErrorMap];
    };

export type ActionFn<
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

export type ValidatorReturn<
  OutputContext extends void | object,
  ErrorMap extends unknown | object,
> = Promise<ValidationResult<OutputContext, ErrorMap>>;

export type ValidatorReturnNoContext<ErrorMap extends unknown | object> =
  Promise<ValidationResult<void, ErrorMap>>;

export type ValidatorReturnNoError<OutputContext extends void | object> =
  Promise<ValidationResult<OutputContext, unknown>>;

export type ValidatorReturnAny<> = Promise<ValidationResult<void, unknown>>;

export type ValidationFn<
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
}) => ValidatorReturn<OutputContext, ErrorMap>;
