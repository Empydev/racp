import * as zod from "zod";
import { createRpcDefinition } from "../../util/rpc";
import {
  loginPayloadType,
  userAccessLevelType,
  userProfileMutationType,
  userProfileType,
  userRegisterPayloadType,
} from "./types";

const myProfileTag = "MY_PROFILE";

export const authDefinition = createRpcDefinition({
  tagTypes: [myProfileTag],
  entries: (builder) =>
    builder
      .mutation("register", userRegisterPayloadType, zod.boolean())
      .mutation(
        "login",
        loginPayloadType,
        zod.object({
          token: zod.string(),
          access: userAccessLevelType,
        }),
        { tags: [myProfileTag] }
      )
      .query("getMyProfile", zod.void(), userProfileType.optional(), {
        tags: [myProfileTag],
      })
      .mutation("updateMyProfile", userProfileMutationType, zod.boolean(), {
        tags: (success) => (success ? [myProfileTag] : []),
      }),
});
