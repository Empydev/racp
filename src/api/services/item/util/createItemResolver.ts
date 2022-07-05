import { createRAEntityResolver } from "../../../../lib/rathena/RAEntitySystem";
import { itemType } from "../types";

export interface ItemResolverProps {
  tradeScale: number;
}

export function createItemResolver({ tradeScale }: ItemResolverProps) {
  return createRAEntityResolver(itemType, {
    getKey: (o) => o.Id,
    postProcess(item) {
      item.Buy = item.Buy ?? (item.Sell ?? 0) * tradeScale;
      item.Sell = item.Sell ?? (item.Buy ?? 0) / tradeScale;
    },
  });
}