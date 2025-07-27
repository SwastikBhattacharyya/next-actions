import z from "zod";
import { Action } from "../src/action";
import { ActionFn } from "../src/types";

const inputSchema = z.object({
  name: z.string().min(2, {
    message: "Name must contain at least 2 character(s)",
  }),
});

describe("Action", () => {
  it("receives correct params and context", async () => {
    const action = new Action()
      .setInputSchema(inputSchema)
      .setActionFn(async ({ params, context }) => {
        expect(params).toEqual({
          name: "Dave",
        });
        expect(context.inputSchema).toEqual(inputSchema);
        return { success: true, message: "Successfully submitted" };
      });

    const result = await action({ name: "Dave" });
    expect(result.success).toEqual(true);
  });
  it("executes successfully with valid input", async () => {
    const action = new Action()
      .setInputSchema(inputSchema)
      .setActionFn(async () => {
        return { success: true, message: "Successfully submitted" };
      });

    const result = await action({ name: "Dave" });
    expect(result.success).toEqual(true);
  });
  it("throws if action function is not set", async () => {
    const action = new Action()
      .setInputSchema(inputSchema)
      .setActionFn(
        undefined as unknown as ActionFn<typeof inputSchema, object>,
      );

    await expect(action({ name: "Dave" })).rejects.toThrow();
  });
});
