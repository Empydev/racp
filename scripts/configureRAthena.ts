import { pick } from "lodash";
import { createLogger } from "../src/lib/logger";
import { readCliArgs } from "../src/api/util/cli";
import { options } from "../src/api/options";
import { createConfigDriver } from "../src/api/rathena/ConfigDriver";
import { resetDatabases } from "./resetDatabases";

/**
 * Updates a clean rathena build with the settings we need to run racp + rathena in CI.
 */
async function configureRAthena() {
  const logger = createLogger(console.log).chain("configureRAthena");
  const args = readCliArgs({
    ...pick(options, "rAthenaPath"),
    MYSQL_HOST: { type: "string", required: true },
    MYSQL_PORT: { type: "number", required: true },
    MYSQL_USER: { type: "string", required: true },
    MYSQL_PASSWORD: { type: "string", required: true },
    MYSQL_DATABASE: { type: "string", required: true },
  });

  logger.log("args", JSON.stringify(args));

  const cfg = createConfigDriver({ ...args, logger });

  logger.log(`Updating ${cfg.presets.dbInfoConfigName}...`);
  const dbInfo = await cfg.load(cfg.presets.dbInfoConfigName);
  dbInfo.update(
    [
      "login_server",
      "char_server",
      "ipban_db",
      "map_server",
      "web_server",
      "log_db",
    ].reduce(
      (record, prefix) => ({
        ...record,
        [`${prefix}_ip`]: args.MYSQL_HOST,
        [`${prefix}_port`]: args.MYSQL_PORT,
        [`${prefix}_id`]: args.MYSQL_USER,
        [`${prefix}_pw`]: args.MYSQL_PASSWORD,
        [`${prefix}_db`]: args.MYSQL_DATABASE,
      }),
      {}
    )
  );

  const success = await resetDatabases({ cfg, logger });
  logger.log("Finished configuring RAthena");
  return success ? 0 : 1;
}

if (require.main === module) {
  configureRAthena().then(process.exit);
}