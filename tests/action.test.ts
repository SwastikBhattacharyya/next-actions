import z from "zod";
import { $ZodIssue } from "zod/v4/core";
import { Action } from "../src/action";
import { ActionHandler } from "../src/types";
import { zodValidator } from "../src/validators/zod";

describe("Action", () => {
  const nameInputSchema = z.object({
    name: z.string().min(2, {
      message: "Name must contain at least 2 character(s)",
    }),
  });

  describe("without validators", () => {
    it("passes params and context to the action function", async () => {
      const action = new Action()
        .setInputSchema(nameInputSchema)
        .setActionFn(async ({ params, context }) => {
          expect(params).toEqual({ name: "Dave" });
          expect(context.inputSchema).toEqual(nameInputSchema);
          return { success: true, message: "Successfully submitted" };
        });

      const result = await action({ name: "Dave" });
      expect(result).toEqual({
        success: true,
        message: "Successfully submitted",
      });
    });

    it("executes successfully with valid input", async () => {
      const action = new Action()
        .setInputSchema(nameInputSchema)
        .setActionFn(async () => ({
          success: true,
          message: "Successfully submitted",
        }));

      const result = await action({ name: "Dave" });
      expect(result.success).toBe(true);
    });

    it("returns correct payload from action function", async () => {
      const action = new Action()
        .setInputSchema(nameInputSchema)
        .setActionFn<{ data: string }>(async () => ({
          success: true,
          message: "Successfully submitted",
          payload: { data: "Value" },
        }));

      const result = await action({ name: "Dave" });
      expect(result.success).toBe(true);
      expect(result.payload?.data).toBe("Value");
    });

    it("throws an error if action function is not set", async () => {
      const action = new Action()
        .setInputSchema(nameInputSchema)
        .setActionFn(
          undefined as unknown as ActionHandler<
            typeof nameInputSchema,
            void,
            object,
            object
          >,
        );

      await expect(action({ name: "Dave" })).rejects.toThrow(
        "Action function is undefined",
      );
    });
  });

  describe("with validators", () => {
    const numberInputSchema = z.object({ num: z.number() });

    const actionWithNumericValidators = new Action()
      .setInputSchema(numberInputSchema)
      .addValidator<void, void>(async () => ({ ok: true }))
      .addValidator<void, { firstInvalid: { data: "Data 1" } }>(
        async ({ params }) => {
          return params.num === 1
            ? {
                ok: false,
                errorCode: "firstInvalid",
                payload: { data: "Data 1" },
              }
            : { ok: true };
        },
      )
      .addValidator<void, { secondInvalid: { data: "Data 2" } }>(
        async ({ params }) => {
          return params.num === 2
            ? {
                ok: false,
                errorCode: "secondInvalid",
                payload: { data: "Data 2" },
              }
            : { ok: true };
        },
      )
      .addValidator<void, void>(async () => ({ ok: true }))
      .setActionFn<{ post: "Post" }>(async () => ({
        success: true,
        message: "Hello",
        payload: { post: "Post" },
      }));

    const actionWithZodValidator = new Action()
      .setInputSchema(nameInputSchema)
      .addValidator(async ({ context, params }) =>
        zodValidator(context.inputSchema, params),
      )
      .setActionFn<{ post: "Post" }>(async () => ({
        success: true,
        message: "Hello",
        payload: { post: "Post" },
      }));

    describe("when all validators pass", () => {
      it("executes successfully and returns payload", async () => {
        const resultZod = await actionWithZodValidator({ name: "Dave" });
        const resultNum = await actionWithNumericValidators({ num: 3 });

        expect(resultZod.success).toBe(true);
        expect(resultZod.success && resultZod.payload?.post).toBe("Post");

        expect(resultNum.success).toBe(true);
        expect(resultNum.success && resultNum.payload?.post).toBe("Post");
      });
    });

    describe("when a validator fails", () => {
      describe("returns error with correct code and payload", () => {
        type PayloadType =
          | {
              data: "Data 1";
            }
          | {
              data: "Data 2";
            }
          | {
              issues: $ZodIssue[];
            };
        it.each([
          {
            label: "zod validation error",
            input: () => actionWithZodValidator({ name: "" }),
            expectedCode: "zodValidator_invalidParams",
            expectedPayloadCheck: (payload: PayloadType) =>
              "issues" in payload && !!payload.issues,
          },
          {
            label: "first validator fails (num = 1)",
            input: () => actionWithNumericValidators({ num: 1 }),
            expectedCode: "firstInvalid",
            expectedPayloadCheck: (payload: PayloadType) =>
              "data" in payload && payload.data === "Data 1",
          },
          {
            label: "second validator fails (num = 2)",
            input: () => actionWithNumericValidators({ num: 2 }),
            expectedCode: "secondInvalid",
            expectedPayloadCheck: (payload: PayloadType) =>
              "data" in payload && payload.data === "Data 2",
          },
        ])("$label", async ({ input, expectedCode, expectedPayloadCheck }) => {
          const result = await input();

          expect(result.success).toBe(false);
          expect(!result.success && result.errorCode).toBe(expectedCode);
          expect(
            !result.success &&
              result.errorCode === expectedCode &&
              expectedPayloadCheck(result.errorPayload),
          ).toBeTruthy();
        });
      });
    });
  });
});
