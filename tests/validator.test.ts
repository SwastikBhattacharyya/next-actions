import z from "zod";
import { Action } from "../src/action";
import { zodValidator } from "../src/validators/zod";

const inputSchema = z.object({
  name: z.string().min(2, {
    message: "Name must contain at least 2 character(s)",
  }),
});

const action = new Action()
  .setInputSchema(inputSchema)
  .addValidator(async ({ context, params }) =>
    zodValidator(context.inputSchema, params),
  )
  .setActionFn<{ post: string }>(async () => {
    return {
      success: true,
      message: "Hello",
      payload: {
        post: "Post",
      },
    };
  });

describe("Validator", () => {
  it("executes successfully with valid input and returns correct payload", async () => {
    const result = await action({ name: "Dave" });
    expect(result.success && result.payload.post === "Post").toEqual(true);
  });
  it("returns error with correct error code and payload on validation failure", async () => {
    const result = await action({ name: "" });
    expect(
      !result.success && result.errorCode === "zodValidator_invalidParams",
    ).toBe(true);
    expect(
      !result.success &&
        result.errorCode === "zodValidator_invalidParams" &&
        result.errorPayload,
    ).toBeTruthy();
  });
});
