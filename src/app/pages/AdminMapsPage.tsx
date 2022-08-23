import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { ExpandMore } from "@mui/icons-material";
import { Header } from "../layout/Header";

import { ErrorMessage } from "../components/ErrorMessage";
import {
  useCountMapBoundsQuery,
  useCountMapImagesQuery,
  useCountMapInfoQuery,
  useGetMissingMapDataQuery,
  useUpdateMapBoundsMutation,
  useUploadMapImagesMutation,
  useUploadMapInfoMutation,
} from "../state/client";
import { fromBrowserFile } from "../../lib/rpc/RpcFile";
import { FileUploader } from "../components/FileUploader";
import { LinkBase } from "../components/Link";
import { cropSurroundingColors, RGB } from "../../lib/cropSurroundingColors";
import { loadMapDataFromGRFs, readBoundsFromGATs } from "../../lib/grf/utils";

export default function AdminMapsPage() {
  const { data: mapImageCount = 0 } = useCountMapImagesQuery();
  const { data: mapInfoCount = 0 } = useCountMapInfoQuery();
  const { data: mapBoundsCount = 0 } = useCountMapBoundsQuery();
  const { data: missingMapData } = useGetMissingMapDataQuery();

  const [isPreparingUpload, setIsPreparingUpload] = useState(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [uploadMapImages, imageUpload] = useUploadMapImagesMutation();
  const [uploadMapInfo, infoUpload] = useUploadMapInfoMutation();
  const [updateMapBounds, boundsUpdate] = useUpdateMapBoundsMutation();

  const parseError =
    infoUpload.data?.length === 0
      ? { message: "Invalid lub file." }
      : undefined;

  const isUploading =
    imageUpload.isLoading ||
    isPreparingUpload ||
    infoUpload.isLoading ||
    boundsUpdate.isLoading;

  const error =
    imageUpload.error || infoUpload.error || parseError || boundsUpdate.error;

  async function onFilesSelectedForUpload(files: File[]) {
    const lubFiles = files.filter((file) => file.name.endsWith(".lub"));
    const grfFiles = files.filter((file) => file.name.endsWith(".grf"));
    const gatFiles = files.filter((file) => file.name.endsWith(".gat"));
    const imageFiles = files.filter((file) => isImage(file.name));

    if (lubFiles.length) {
      Promise.all(lubFiles.map(fromBrowserFile)).then(uploadMapInfo);
    }

    if (grfFiles.length) {
      setIsPreparingUpload(true);
      const grfResult = await loadMapDataFromGRFs(grfFiles);
      imageFiles.push(...grfResult.imageFiles);
      gatFiles.push(...grfResult.gatFiles);
      setIsPreparingUpload(false);
    }

    if (gatFiles.length) {
      setIsPreparingUpload(true);
      const bounds = await readBoundsFromGATs(gatFiles);
      setIsPreparingUpload(false);
      updateMapBounds(bounds);
    }

    if (imageFiles.length) {
      setUploadCount(imageFiles.length);
      setIsPreparingUpload(true);
      const croppedImages = await Promise.all(imageFiles.map(cropMapImage));
      const rpcFiles = await Promise.all(croppedImages.map(fromBrowserFile));
      setIsPreparingUpload(false);
      uploadMapImages(rpcFiles);
    }
  }

  return (
    <>
      <Header>Maps</Header>
      <Typography paragraph>
        Map database currently contain {mapInfoCount} info entries,{" "}
        {mapImageCount} images and {mapBoundsCount} bounds.
      </Typography>

      <FileUploader
        value={[]}
        sx={{ maxWidth: 380, margin: "0 auto" }}
        accept={[".grf", ".lub", ".gat", ...imageExtensions]}
        isLoading={isUploading}
        onChange={onFilesSelectedForUpload}
        title={"Select or drop files here"}
      />

      <ErrorMessage sx={{ textAlign: "center", mt: 1 }} error={error} />

      <Box sx={{ margin: "0 auto", marginBottom: 2 }}>
        {infoUpload.isLoading && <Typography>Updating item info...</Typography>}
        {isPreparingUpload && <Typography>Loading map data...</Typography>}
        {imageUpload.isLoading && (
          <Typography>Uploading {uploadCount} map images...</Typography>
        )}
        {boundsUpdate.isLoading && (
          <Typography>Updating {uploadCount} map bounds...</Typography>
        )}
      </Box>

      {missingMapData && missingMapData.images.length > 0 && (
        <Accordion sx={{ [`&&`]: { marginTop: 0 } }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>
              {missingMapData.images.length} missing map images:
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
              {missingMapData.bounds.length} missing map bounds:
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ maxHeight: 300, overflowY: "auto" }}>
              {missingMapData.bounds.join(", ")}
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}

      <Typography variant="caption" sx={{ marginTop: 4, maxWidth: 600 }}>
        <strong>Instructions:</strong>
        <br />
        - Upload a mapInfo.lub file to update the map info database.
        <br />
        - Upload a data.grf file to update the database with all map images and
        bounds in the GRF file.
        <br /> - Upload an image file to manually update the map image database
        (using file name as map id).
        <br /> - Upload a .gat file to manually update the map bounds database
        (using file name as map id).
        <br /> - If any map data is missing, their map ids will be listed above
        (once you've uploaded map info).
        <br />
        <br />
        <strong>
          Why are manual image/.gat file uploads necessary when a GRF file
          upload is available?
        </strong>
        <br /> Sometimes GRF files won't contain all required data, or our
        browser based GRF reader might fail at extracting some entries. In this
        case you can produce the required files yourself and manually upload
        them above. It's highly recommended to use a{" "}
        <LinkBase
          href="https://www.google.com/search?q=grf+editor"
          target="_blank"
        >
          GRF Editor
        </LinkBase>{" "}
        to easily extract any data you need.
      </Typography>
    </>
  );
}

const imageExtensions = [".png", ".jpg", ".jpeg", ".bmp", ".tga"];
const isImage = (fileName: string) =>
  imageExtensions.some((ext) => fileName.endsWith(ext));

const magenta: RGB = [255, 0, 255];
async function cropMapImage(file: File) {
  return cropSurroundingColors(file, [magenta]);
}
