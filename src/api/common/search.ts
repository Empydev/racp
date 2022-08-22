import * as zod from "zod";
import { ZodType } from "zod";
import { clamp, get } from "lodash";
import { Path, zodPath } from "../../lib/zod/zodPath";

export const sortDirectionType = zod.union([
  zod.literal("asc"),
  zod.literal("desc"),
]);

export type SortDirection = zod.infer<typeof sortDirectionType>;

export interface SearchQuery<T, F> {
  filter?: F;
  sort?: SearchSort<T>;
  offset?: number;
  limit?: number;
}

export type SearchSort<T> = Array<{
  field: Path<T>;
  sort: SortDirection;
}>;

export interface SearchResult<T> {
  total: number;
  entities: T[];
}

export function createSearchTypes<ET extends ZodType, FT extends ZodType>(
  entityType: ET,
  filterType: FT
) {
  type Entity = zod.infer<ET>;
  type Filter = zod.infer<FT>;

  const pathType = zodPath(entityType);

  const sortType: ZodType<SearchSort<Entity>> = zod.array(
    zod.object({
      field: pathType,
      sort: sortDirectionType,
    })
  );

  const queryType: ZodType<SearchQuery<Entity, Filter>> = zod.object({
    filter: filterType.optional(),
    sort: sortType.optional(),
    offset: zod.number().optional(),
    limit: zod.number().optional(),
  });

  const resultType: ZodType<SearchResult<Entity>> = zod.object({
    total: zod.number(),
    entities: zod.array(entityType),
  });

  return [queryType, resultType] as const;
}

export function createSearchController<Entity, Filter>(
  getEntities: () => Promise<Entity[]>,
  isMatch: (item: Entity, filter: Filter) => boolean,
  limitCap = 50
) {
  return async ({
    filter,
    sort,
    offset = 0,
    limit = limitCap,
  }: SearchQuery<Entity, Filter>): Promise<SearchResult<Entity>> => {
    const entities = await getEntities();
    const matches = filter
      ? entities.filter((entity) => isMatch(entity, filter))
      : entities.slice();

    if (sort) {
      matches.sort(createCompareFn(sort));
    }

    limit = clamp(limit, 0, limitCap);
    offset = clamp(offset, 0, matches.length);
    const sliceEnd = offset + limit;
    const slice = matches.slice(offset, sliceEnd);
    return {
      entities: slice,
      total: matches.length,
    };
  };
}

function createCompareFn<T>(list: SearchSort<T>) {
  return (a: T, b: T): number => {
    for (const { field, sort } of list) {
      const multi = sort === "asc" ? 1 : -1;
      const aVal = get(a, field);
      const bVal = get(b, field);
      const diff = compareTo(aVal, bVal) * multi;
      if (diff !== 0) {
        return diff;
      }
    }
    return 0;
  };
}

function compareTo<T>(a?: T, b?: T): number {
  if (a === b) return 0;
  if (a === undefined) return -1;
  if (b === undefined) return 1;
  if (typeof a === "string" || typeof b === "string")
    return `${a}`.localeCompare(`${b}`);
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
}