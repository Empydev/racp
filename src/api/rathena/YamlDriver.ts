import * as path from "path";
import * as zod from "zod";
import { ZodType } from "zod";
import * as yaml from "yaml";
import { isPlainObject } from "lodash";
import { typedKeys } from "../../lib/std/typedKeys";
import { Logger } from "../../lib/logger";
import { gfs } from "../gfs";

export type YamlDriver = ReturnType<typeof createYamlDriver>;

export function createYamlDriver({
  rAthenaPath,
  rAthenaMode,
  logger: parentLogger,
}: {
  rAthenaPath: string;
  rAthenaMode: string;
  logger: Logger;
}) {
  const logger = parentLogger.chain("yaml");

  async function loadNode(file: string): Promise<DBNode | undefined> {
    const filePath = path.resolve(rAthenaPath, file);
    let content: string;
    try {
      content = await gfs.readFile(filePath, "utf-8");
    } catch (e) {
      return;
    }
    const unknownObject = yaml.parse(content);
    filterNulls(unknownObject);
    const result = dbNode.safeParse(unknownObject);
    if (!result.success) {
      logger.error(
        "Ignoring node. Unexpected YAML structure. Error info: ",
        JSON.stringify({ file, issues: result.error.issues }, null, 2)
      );
      return;
    }
    return result.data;
  }

  const resolve = logger.wrap(async function resolve<ET extends ZodType, Key>(
    file: string,
    { entityType, getKey, postProcess = noop }: YamlResolver<ET, Key>
  ): Promise<Map<Key, zod.infer<ET>>> {
    const imports: ImportNode[] = [{ Path: file, Mode: rAthenaMode }];
    const entities = new Map<Key, zod.infer<ET>>();

    while (imports.length) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const imp = imports.shift()!;
      if (!imp.Mode || imp.Mode === rAthenaMode) {
        const res = await loadNode(imp.Path);
        if (!res) {
          continue;
        }
        const { Body, Footer } = res;
        for (const raw of Body ?? []) {
          const entity = entityType.parse(raw);
          entities.set(getKey(entity), entity);
        }
        imports.push(...(Footer?.Imports ?? []));
      }
    }

    Array.from(entities.values()).map((entity) =>
      postProcess(entity, entities)
    );

    return entities;
  });

  return {
    resolve,
  };
}

export interface YamlResolver<ET extends ZodType, Key> {
  entityType: ET;
  getKey: (entity: zod.infer<ET>) => Key;
  postProcess?: (
    entity: zod.infer<ET>,
    registry: Map<Key, zod.infer<ET>>
  ) => void;
}

export function createYamlResolver<ET extends ZodType, Key>(
  entityType: ET,
  rest: Omit<YamlResolver<ET, Key>, "entityType">
): YamlResolver<ET, Key> {
  return {
    entityType,
    ...rest,
  };
}

const headerNode = zod.object({
  Type: zod.string(),
  Version: zod.number(),
});

type ImportNode = zod.infer<typeof importNode>;
const importNode = zod.object({
  Path: zod.string(),
  Mode: zod.string().optional(),
});

const footerNode = zod.object({
  Imports: zod.array(importNode),
});

const bodyNode = zod.array(zod.unknown());

type DBNode = zod.infer<typeof dbNode>;
const dbNode = zod.object({
  Header: headerNode.optional(),
  Body: bodyNode.optional(),
  Footer: footerNode.optional(),
});

function filterNulls(value: unknown) {
  if (Array.isArray(value)) {
    for (const item of value) {
      filterNulls(item);
    }
  } else if (isPlainObject(value)) {
    for (const key of typedKeys(value as object)) {
      if ((value as object)[key] === null) {
        delete (value as object)[key];
      } else {
        filterNulls((value as object)[key]);
      }
    }
  }
}

const noop = () => undefined;
