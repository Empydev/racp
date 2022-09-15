import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  LinearProgress,
  Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { Header } from "../layout/Header";

import { ErrorMessage } from "../components/ErrorMessage";
import {
  useCountItemInfoQuery,
  useCountMapBoundsQuery,
  useCountMapImagesQuery,
  useCountMapInfoQuery,
  useGetMissingMapDataQuery,
  useGetMonstersMissingImagesQuery,
} from "../state/client";
import { FileUploader } from "../components/FileUploader";
import { useAssetUploader } from "../hooks/useAssetUploader";
import { useBlockNavigation } from "../../lib/useBlockNavigation";
import { MonsterGrid } from "../grids/MonsterGrid";

export default function AdminAssetsPage() {
  const { data: mapImageCount = 0 } = useCountMapImagesQuery();
  const { data: mapInfoCount = 0 } = useCountMapInfoQuery();
  const { data: mapBoundsCount = 0 } = useCountMapBoundsQuery();
  const { data: missingMapData } = useGetMissingMapDataQuery();
  const { data: itemInfoCount = 0 } = useCountItemInfoQuery();
  const { data: idsOfMonstersMissingImages = [] } =
    useGetMonstersMissingImagesQuery();

  const uploader = useAssetUploader();

  useBlockNavigation(
    uploader.isPending,
    "Data is still being uploaded. If you leave this page, data may be lost."
  );

  return (
    <>
      <Header>Assets</Header>
      <Typography paragraph>
        This page is for uploading assets required to properly display items,
        monsters, maps, etc. <br />
        This is a necessary step because rAthena does not provide these as asset
        files only reside in the game client.
      </Typography>

      <Typography paragraph>
        - Map database currently contain {mapInfoCount} info entries,{" "}
        {mapImageCount} images and {mapBoundsCount} bounds.
        <br />- Item database currently contain {itemInfoCount} item info
        entries.
      </Typography>

      <FileUploader
        value={[]}
        sx={{ maxWidth: 380, margin: "0 auto" }}
        accept={uploader.fileExtensions}
        isLoading={uploader.isPending}
        onChange={uploader.upload}
        title={`
          Select your mapInfo.lub, itemInfo.lub and data.grf files. 
          GRF files will be extracted locally and cherry pick and upload the
          necessary data to reduce network load.
          `}
      />

      {uploader.isPending && (
        <LinearProgress
          variant="determinate"
          value={uploader.progress * 100}
          sx={{ width: "50%", margin: "0 auto", marginBottom: 2 }}
        />
      )}

      {uploader.isPending && (
        <Typography
          sx={{
            margin: "0 auto",
            marginBottom: 2,
            whiteSpace: "pre-wrap",
            textAlign: "center",
          }}
        >
          {uploader.currentActivities.join("\n")}
        </Typography>
      )}

      {uploader.errors.length > 0 && (
        <Accordion sx={{ [`&&`]: { marginTop: 0, marginBottom: 2 } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>
              Errors during upload ({uploader.errors.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {uploader.errors.map((error, index) => (
              <ErrorMessage key={`error${index}`} error={error} />
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      <Typography paragraph>Any missing data will be listed below.</Typography>

      {idsOfMonstersMissingImages.length > 0 && (
        <Accordion sx={{ [`&&`]: { marginTop: 0 } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>
              Missing monster images ({idsOfMonstersMissingImages.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <MonsterGrid
              sx={{ height: "383px" }}
              filter={{
                Id: {
                  value: idsOfMonstersMissingImages,
                  matcher: "oneOfN",
                },
              }}
            />
          </AccordionDetails>
        </Accordion>
      )}

      {missingMapData && missingMapData.images.length > 0 && (
        <Accordion sx={{ [`&&`]: { marginTop: 0 } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>
              Missing map images ({missingMapData.images.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ maxHeight: 300, overflowY: "auto" }}>
              {missingMapData.images.join(", ")}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      {missingMapData && missingMapData.bounds.length > 0 && (
        <Accordion sx={{ [`&&`]: { marginTop: 0 } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>
              Missing map bounds ({missingMapData.bounds.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ maxHeight: 300, overflowY: "auto" }}>
              {missingMapData.bounds.join(", ")}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      <Typography variant="caption">
        <br />
        Missing data is possible since rAthena and your RO client could have
        mismatching data.
        <br />
        If it's missing here, it's likely missing in the game too (Not always.
        Some data is missing due to RACP not having a perfect GRF importer)
        <br />
        You can resolve this issue by updating your client files and then
        re-uploading them to RACP.
      </Typography>
    </>
  );
}