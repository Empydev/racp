import * as http from "http";
import * as express from "express";
import cors = require("cors");
import { Request as JWTRequest } from "express-jwt";
import { createRpcMiddlewareFactory } from "../lib/rpc/createRpcMiddleware";
import { configDefinition } from "./services/config/config.definition";
import { createConfigHandlers } from "./services/config/config.handlers";
import { createAuthenticator } from "./util/authenticator";
import { usersFixture } from "./fixtures/users";
import { authDefinition } from "./services/auth/auth.definition";
import { createAuthHandlers } from "./services/auth/auth.handlers";
import { itemDefinition } from "./services/item/item.definition";
import { createItemHandlers } from "./services/item/item.handlers";
import { createRAES } from "./util/raes";
import { parseArgs } from "./args";

const args = parseArgs(process.argv.slice(2), process.env);
const app = express();
const auth = createAuthenticator({ secret: args.jwtSecret });
const raes = createRAES(args);
const rpc = createRpcMiddlewareFactory((req: JWTRequest) => !!req.auth);
const users = usersFixture(auth, args.adminPassword);

app.use(auth.middleware);
app.use(cors());
app.use(rpc(configDefinition.entries, createConfigHandlers(args.rAthenaPath)));
app.use(rpc(authDefinition.entries, createAuthHandlers(users, auth)));
app.use(rpc(itemDefinition.entries, createItemHandlers({ raes, ...args })));

http.createServer(app).listen(args.port, () => {
  console.log(`API is running on port ${args.port}`);
});
