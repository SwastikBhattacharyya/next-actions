# Next Actions

Next Actions is a utility library for defining type-safe server actions and
data access layers.

## What is Next Actions?

Next Actions is a lightweight and simple TypeScript utility library for
building type-safe, validated server actions and data access layers using zod
along with clearly defined and structured error responses.

Define an input schema with Zod, add layered validation functions that return
typed error codes with payloads, or context to be used later in the action
execution. The action itself can also return typed errors or a success payload.
Execution gives you a strongly typed result—success or failure, with full type
safety.

```typescript
export const action = new Action()
  .setInputSchema(
    z.object({
      id: z.string(),
      name: z.string().min(2),
    }),
  )
  .addValidator(
    async ({ context: { inputSchema }, params }) =>
      zodValidator(inputSchema, params), // Validator to safely parse arguments by client/form
  )
  .setActionFn(async () => {
    // Your Server Action
    // ...
    return { success: true, message: "Action successful" };
  });
```

## Usage Guide

The following example demonstrates how to create a server action with input
validation with zod, user session validation and user role check. Assume the
action inserts a blog post into the database.

### 1. Define input schema

This schema defines the parameters of the server action.

> **Note: Schema validation is not automatic. You must use the `zodValidator`
> utility from the library, or define your own custom Zod Validator. This
> example will use `zodValidator` for input validation.**

```typescript
const postSchema = z.object({
  title: z.string(),
  description: z.string(),
  content: z.string(),
});
```

### 2. Define Validators for User Session & Role

#### What are Validators?

Before we define the validator, let us know what a Validator actually is.
**Validators** are just functions used to enforce rules before the action
executes. The function must return a `Promise` of a `ValidationResult`. It can
accept their own parameters and perform any logic needed.

The `ValidationResult` type accepts two type arguments:

1. **Injected Context**: Data that will be made available to all subsequent
   validators and the action function if the validation succeeds. For example:
   the user session validator will inject the user id into the execution so
   that the action can later pass the user id to the query to insert into the
   database.
2. **Possible Errors**: An object containing all the error codes the validator
   might return, along with their associated payloads. It helps to distinguish
   which validator actually failed and what error occured. You can handle each
   failure case accordingly.

> **Note**: You can use shortcut types like `ValidationResultWithoutContext`,
> `ValidationResultWithoutError`, or `ValidationResultAny` if your validator
> doesn't inject context, doesn't return errors, or neither.

#### 2.1 User Session Validator

This validator will inject the user id into the context and can return an error
code `userSessionValidator_noSession` if not session was found and a string
containing a message as payload for that error code (as an example, you can
return any payload that might help with error handling).

```typescript
async function userSessionValidator(): Promise<
  ValidationResult<
    { userId: string },
    { userSessionValidator_noSession: { message: string } }
  >
> {
  const cookieStore = await cookies();

  if (!cookieStore.has("userSession"))
    return {
      ok: false,
      errorCode: "userSessionValidator_noSession",
      payload: { message: "User session not found in cookies" },
    };

  const userId = cookieStore.get("userSession")?.value as string;
  return { ok: true, context: { userId } };
}
```

#### 2.2 User Role Validator

This validator will inject the user role into the context and can return two
errors: `userRoleValidator_roleNotFound` and
`userRoleValidator_insufficientPermissions`, but with no payload.

```typescript
async function userRoleValidator(userId: string): Promise<
  ValidationResult<
    { role: "admin" | "editor" },
    {
      userRoleValidator_roleNotFound: null;
      userRoleValidator_insufficientPermissions: null;
    }
  >
> {
  const role = await getUserRole(userId); // Assume this fetches from DB or session

  if (!role) {
    return {
      ok: false,
      errorCode: "userRoleValidator_roleNotFound",
      payload: null,
    };
  }

  if (role !== "admin") {
    return {
      ok: false,
      errorCode: "userRoleValidator_insufficientPermissions",
      payload: null,
    };
  }

  return {
    ok: true,
    context: { role },
  };
}
```

### 3. Build the action with validators

The Action class uses the builder pattern to compose a server action step by
step using the chainable methods `.setInputSchema()`, `.addValidator()`, and
`.setActionFn()`.

> **Note**: If using Next.js, both `.addValidator()` and `.setActionFn()` must
> receive async functions, since server functions must always be asynchronous.

```typescript
export const action = new Action()
  .setInputSchema(postSchema) // injects schema instance into context
  .addValidator(async ({ context: { inputSchema }, params }) =>
    zodValidator(inputSchema, params),
  )
  .addValidator(async () => userSessionValidator()) // injects userId into context
  .addValidator(async () => userRoleValidator()) // injects role into context
  .setActionFn(async ({ context, params }) => {
    // You can now access context.userId, context.role and the validated input in params
    // context also contains the input schema instance if needed. It is injected by .setInputSchema()
    return { success: true, message: "Successfully executed" };
  });
```

### 4. Define the server action

You can now define the actual server action to perform after the validation
steps are successful.

```typescript
export const action = new Action()
  .setInputSchema(postSchema)
  .addValidator(async ({ context: { inputSchema }, params }) =>
    zodValidator(inputSchema, params),
  )
  .addValidator(async () => userSessionValidator())
  .addValidator(async () => userRoleValidator())
  .setActionFn(async ({ context, params }) => {
    const { userId } = context;
    const { title, description, content } = params;

    await db.query(
      `INSERT INTO posts (user_id, title, description, content)
       VALUES (?, ?, ?, ?)`,
      [userId, title, description, content],
    );

    return { success: true, message: "Post created successfully" };
  });
```

#### Action Functions are Just Like Validators!

An action is conceptually similar to a validator — it returns a type called
`ActionResult`, which is structurally the same as `ValidationResult`. That
means an action can either:

- Succeed, and optionally return a success payload (e.g. { id: string })
- Fail, and return a structured error with a code and optional payload
  You can define the types for success and error codes using `.setActionFn<SuccessPayload, ErrorMap>()`.

  ```typescript
  .setActionFn<{ postId: string }, { dbError: { reason: string } }>(
    async ({ context, params }) => {
      // If Error case
      return {
        success: false,
        message: "Failed",
        errorCode: "dbError",
        errorPayload: { reason: "Some Reason" },
      };
      // If success case
      return {
        success: true,
        message: "Successfully executed",
        payload: { postId: "some Id" },
      };
    }
  ```

Just like validators, action logic can be extracted into reusable functions.
Your function should return an `ActionResult`, and you can use any of the shortcut
types:

- `ActionResultWithoutPayload` – for actions with no success payload
- `ActionResultWithoutError` – for actions that never fail
- `ActionResultAny` – for actions with no payloads or errors

For example:

```typescript
async function createPost(
  userId: string,
  input: PostInput
): ActionResult<{ postId: string }, { dbError: null }> {...}
```

```typescript
.setActionFn(async ({context, params}) => createPost(context.userId, params));
```

#### Do You Need to Write Validator Functions?

Not always. You don’t need to extract validators into separate functions
unless you want to reuse them across multiple actions. Validators can be
written inline directly inside .addValidator(...), and still define their own
context and error map via the return type:

```typescript
.addValidator<{ role: string }, { invalidRole: null }>(async (): => {...})
```

### 5. Invoking the actions and handling errors

You can invoke an action just like any async function by calling it with the
required input object. The returned result is strongly typed and will indicate
whether the action succeeded or failed.

Here’s an example of using the `toast.promise` pattern (e.g. from
`react-hot-toast`) to handle the result with loading, success, and error states
while taking advantage of the typed error codes and payloads:

```typescript
const promise = action({
  title: "Post Title",
  description: "Post Description",
  content: "Post Content",
});

toast.promise(
  async () => {
    const res = await promise;

    if (!res.success) {
      switch (res.errorCode) {
        case "dbError":
          throw new Error(res.errorPayload.reason);
        case "zodValidator_invalidParams":
          throw new Error(res.errorPayload.issues[0].message);
      }
    }

    return res;
  },
  {
    loading: "Submitting",
    success: (res) => res.message,
    error: (res: Error) => res.message,
  },
);
```

#### Return Types

<div style="display: flex; flex-direction: column; gap: 2rem;">
    <table>
      <thead>
        <tr>
          <th>Condition</th>
          <th>Structure</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Success (no payload)</td>
          <td><code>{ success: true, message: string }</code></td>
        </tr>
        <tr>
          <td>Success (with payload)</td>
          <td><code>{ success: true, message: string, payload: SuccessPayload }</code></td>
        </tr>
        <tr>
          <td>Failure (from error map)</td>
          <td>
            <code>{ success: false, message: string, errorCode: keyof ErrorMap, errorPayload: ErrorMap[errorCode] }</code>
          </td>
        </tr>
      </tbody>
      <caption><strong>ActionResult&lt;SuccessPayload, ErrorMap&gt;</strong></caption>
    </table>
    <table>
      <thead>
        <tr>
          <th>Condition</th>
          <th>Structure</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Success (no context)</td>
          <td><code>{ ok: true }</code></td>
        </tr>
        <tr>
          <td>Success (with context)</td>
          <td><code>{ ok: true, context: OutputContext }</code></td>
        </tr>
        <tr>
          <td>Failure (from error map)</td>
          <td>
            <code>{ ok: false, errorCode: keyof ErrorMap, payload: ErrorMap[errorCode] }</code>
          </td>
        </tr>
      </tbody>
      <caption><strong>ValidationResult&lt;OutputContext, ErrorMap&gt;</strong></caption>
    </table>

</div>
