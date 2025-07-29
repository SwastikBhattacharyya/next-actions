/**
 * Core utility types used for defining type-safe actions, validation steps,
 * and error handling.
 */

import z from "zod";
import { $ZodType } from "zod/v4/core";

/**
 * Represents the result of an action.
 *
 * If the action was successful, it includes a message and an optional payload.
 * If the action was unsuccessful, it includes a message, an error code and its
 * corresponding payload as defined in `ErrorMap`.
 *
 * @template SuccessPayload - The payload on success, or `void`.
 * @template ErrorMap - A map where each key is an error code, and the
 * corresponding value is the payload associated with that specific error.
 */
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

/**
 * A shortcut type for a {@link ActionResult} that returns no payload but may
 * return errors.
 *
 * @template ErrorMap - A map where each key is an error code, and the
 * corresponding value is the payload associated with that specific error.
 */
export type ActionResultWithoutPayload<ErrorMap extends void | object> =
  ActionResult<void, ErrorMap>;

/**
 * A shortcut type for a {@link ActionResult} that returns a payload but no
 * errors.
 *
 * @template SuccessPayload - The payload to return.
 */
export type ActionResultWithoutError<SuccessPayload extends void | object> =
  ActionResult<SuccessPayload, void>;

/**
 * A shortcut type for a generic {@link ActionResult} (no payload or errors).
 */
export type ActionResultAny = ActionResult<void, void>;

/**
 * Represents the result of a validation step.
 *
 * If validation succeeds, it returns `ok: true` and optionally includes
 * additional context.
 * If it fails, it returns `ok: false` along with an error code and payload as
 * defined in `ErrorMap`.
 *
 * @template OutputContext - Additional context injected into execution on
 * success.
 * @template ErrorMap - A map where each key is an error code, and the
 * corresponding value is the payload associated with that specific error.
 */
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

/**
 * A shortcut type for a {@link ValidationResult} that does not inject
 * additional context but may return errors.
 *
 * @template ErrorMap - A map where each key is an error code, and the
 * corresponding value is the payload associated with that specific error.
 */
export type ValidationResultWithoutContext<ErrorMap extends void | object> =
  ValidationResult<void, ErrorMap>;

/**
 * A shortcut type for {@link ValidationResult} that injects additional context
 * but does not return errors.
 *
 * @template OutputContext - Additional context injected into execution on
 * success.
 */
export type ValidationResultWithoutError<OutputContext extends void | object> =
  ValidationResult<OutputContext, void>;

/**
 * A shortcut type for a generic {@link ValidationResult} (no injected context
 * or errors).
 */
export type ValidationResultAny = ValidationResult<void, void>;

/**
 * Function that performs the main action after all validators have succeeded.
 *
 * @template InputSchema - A Zod schema used to define the shape of the action
 * parameters.
 * Note: The schema is not validated automatically. Use a validator like
 * `zodValidator` to enforce it.
 * @template Output - The payload returned on success.
 * @template Context - Shared context passed from all previous validators.
 * @template ErrorMap - A map where each key is an error code, and the
 * corresponding value is the payload associated with that specific error.
 */
export type ActionHandler<
  InputSchema extends $ZodType,
  Output extends void | object,
  Context extends object,
  ErrorMap extends void | object,
> = ({
  params,
  context,
}: {
  /**
   * @param params - The input parameters for the action, shaped by the
   * `InputSchema`.
   * @param context - Context accumulated from previous validators.
   */
  params: z.infer<InputSchema>;
  context: Context;
}) => Promise<ActionResult<Output, ErrorMap>>;

/**
 * A function that performs validation before the action is executed.
 *
 * @template InputSchema - A Zod schema used to define the shape of the action
 * parameters.
 * Note: The schema is not validated automatically, use a validator like
 * `zodValidator` to enforce it.
 * @template Context - The context available to this validator.
 * @template OutputContext - Optional context to inject into the execution on
 * success.
 * @template ErrorMap - A map where each key is an error code, and the
 * corresponding value is the payload associated with that specific error.
 */
export type ValidationHandler<
  InputSchema extends $ZodType,
  Context extends object,
  OutputContext extends void | object,
  ErrorMap extends void | object,
> = ({
  params,
  context,
}: {
  /**
   * @param params - The input parameters for the action, shaped by the
   * `InputSchema`.
   * @param context - Context accumulated from previous validators.
   */
  params: z.infer<InputSchema>;
  context: Context;
}) => Promise<ValidationResult<OutputContext, ErrorMap>>;
