import { Add, Delete } from "@mui/icons-material";
import { ComponentProps } from "react";
import { CardActions, CardContent, IconButton, Tooltip } from "@mui/material";
import { useStore } from "zustand";
import { CardListItem } from "../../components/CardList";
import { Center } from "../../components/Center";
import { LinkButton } from "../../components/Link";
import { routes } from "../../router";
import { EditableText } from "../../components/EditableText";
import { ItemIdentifierByFilter } from "../../components/ItemIdentifier";
import { Hunt, HuntId, huntStore } from "./huntStore";

export function HuntCard({
  hunt,
  onDelete,
}: {
  hunt: Hunt;
  onDelete?: (hunt: Hunt) => void;
}) {
  const { renameHunt } = useStore(huntStore);
  return (
    <CardListItem sx={{ display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{ flex: 1, pb: 0, overflow: "hidden" }}
        style={{ marginBottom: 2 }}
      >
        <EditableText
          type="text"
          value={hunt.name}
          onChange={(newName) => renameHunt(hunt.id, newName)}
          sx={{ mb: 1 }}
          typographyProps={{ variant: "h5" }}
        />
        <HuntSummary id={hunt.id} />
      </CardContent>
      <CardActions>
        <LinkButton
          to={routes.tools.hunt.view.$({ id: hunt.id })}
          sx={{ mr: "auto" }}
        >
          View
        </LinkButton>
        <Tooltip title={`Delete "${hunt.name}"`}>
          <IconButton onClick={() => onDelete?.(hunt)}>
            <Delete />
          </IconButton>
        </Tooltip>
      </CardActions>
    </CardListItem>
  );
}

export function AddHuntCard({
  sx,
  ...props
}: ComponentProps<typeof CardListItem>) {
  return (
    <CardListItem sx={{ cursor: "pointer", ...sx }} {...props}>
      <Center>
        <Tooltip title="New hunt">
          <Add sx={{ fontSize: 96 }} />
        </Tooltip>
      </Center>
    </CardListItem>
  );
}

function HuntSummary({ id }: { id: HuntId }) {
  const { getRichHunt } = useStore(huntStore);
  const richHunt = getRichHunt(id);
  if (!richHunt) {
    return null;
  }
  const itemIds = richHunt.items.map((i) => i.itemId);
  const monsterIds = richHunt.monsters.map((m) => m.monsterId);
  return (
    <>
      {itemIds.map((itemId) => (
        <ItemIdentifierByFilter
          label={false}
          key={itemId}
          loader=""
          filter={{
            Id: { value: itemId, matcher: "=" },
          }}
        />
      ))}
    </>
  );
}
