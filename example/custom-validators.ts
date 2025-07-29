import { Action } from "../src/action";
import { ValidationResult, ValidationResultWithoutContext } from "../src/types";

/* eslint-disable @typescript-eslint/no-unused-vars */

// Simulates fetching a user session (50% chance of returning a session)
async function getSession(): Promise<{ userId: string } | null> {
  await new Promise((r) => setTimeout(r, 50));
  const hasSession = Math.random() > 0.5;
  return hasSession ? { userId: "user_123" } : null;
}

// Validator to ensure a user session exists
async function userSessionValidator(): Promise<
  ValidationResult<
    { userId: string },
    {
      noSession: {
        reason: string;
      };
    }
  >
> {
  const userSession = await getSession();

  if (!userSession) {
    return {
      ok: false,
      errorCode: "noSession",
      payload: {
        reason: "You must be logged in.",
      },
    };
  }

  return {
    ok: true,
    context: {
      userId: userSession.userId,
    },
  };
}

// Simulates role lookup for a user (50% chance of being 'admin')
async function getUserRole(userId: string): Promise<"admin" | "user"> {
  await new Promise((r) => setTimeout(r, 50));
  return Math.random() > 0.5 ? "admin" : "user";
}

// Validator to ensure the user has an 'admin' role
async function checkAdminRoleValidator(
  userId: string,
): ValidationResultWithoutContext<{
  notAdmin: {
    reason: string;
  };
}> {
  const isAdmin = await getUserRole(userId);

  if (!isAdmin) {
    return {
      ok: false,
      errorCode: "notAdmin",
      payload: {
        reason: "Only admins can perform this action.",
      },
    };
  }

  return { ok: true };
}

// Create an action with session and role validation
const action = new Action()
  .addValidator(() => userSessionValidator()) // Ensure the user is logged in
  .addValidator(({ context }) => checkAdminRoleValidator(context.userId)) // Ensure the user is an admin
  .setActionFn(async ({ context }) => {
    // Action logic goes here
    return { success: true, message: "Successful" };
  });
