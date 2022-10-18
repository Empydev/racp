import { groupBy } from "lodash";
import { Repository } from "../../../lib/repo/Repository";
import { Item, ItemId } from "../item/types";
import { Monster, MonsterId } from "../monster/types";
import { ItemDrop } from "./types";

export type DropRepository = ReturnType<typeof createDropRepository>;

export function createDropRepository({
  monsters,
  items,
}: {
  monsters: Repository<Map<MonsterId, Monster>>;
  items: Repository<Map<ItemId, Item>>;
}) {
  return monsters.and(items).map(([monsters, items]) => {
    const itemsByAegisName = groupBy(
      Array.from(items.values()),
      (item) => item.AegisName
    );

    let dropIdCounter = 0;
    const drops: ItemDrop[] = [];
    for (const monster of monsters.values()) {
      for (const dropMetaData of [...monster.Drops, ...monster.MvpDrops]) {
        for (const item of itemsByAegisName[dropMetaData.Item] ?? []) {
          drops.push({
            ...item,
            ...dropMetaData,
            Id: dropIdCounter++,
            ItemId: item.Id,
            ItemName: item.Name,
            ImageUrl: item.ImageUrl,
            MonsterId: monster.Id,
            MonsterName: monster.Name,
            MonsterImageUrl: monster.ImageUrl,
          });
        }
      }
    }
    return drops;
  });
}
