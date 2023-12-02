import { Elysia, t, NotFoundError } from "elysia";

import { jwt } from "@elysiajs/jwt";

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const app = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "",
      exp: process.env.JWT_EXPIRE || "",
    })
  )
  .get("/", () => "Hello Elysia")
  .post(
    "/register",
    async ({ body }) => {
      await db.user.create({
        data: {
          username: body.username,
          password: Bun.password.hashSync(body.password),
        },
      });

      return {
        success: true,
      };
    },
    {
      error({ code }) {
        switch (code) {
          case "P2002":
            return { code, error: "Username not available" };
        }
      },
      body: t.Object({
        username: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, jwt }) => {
      const isUsernameExist = await db.user.findFirst({
        where: { username: body.username },
      });

      if (!isUsernameExist) {
        throw new Error("Invalid credentials");
      }

      const isPasswordMatch = await Bun.password.verify(
        body.password,
        isUsernameExist.password
      );

      if (!isPasswordMatch) {
        throw new Error("Invalid credentials");
      }

      const token = await jwt.sign({
        username: isUsernameExist.username,
        iss: process.env.JWT_ISSUER || "",
      });

      return { token };
    },
    {
      error({ code, error }) {
        return { error: error.message };
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
