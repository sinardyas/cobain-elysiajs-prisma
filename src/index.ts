import { Elysia, t } from "elysia";

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .post(
    "/register",
    async ({ body }) => {
      await db.user.create({ data: body });
      return {
        success: true,
      };
    },
    {
      error({ code }) {
        switch (code) {
          case "VALIDATION":
            return { error: "Username must be unique" };

          default:
            break;
        }
      },
      body: t.Object({
        username: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
