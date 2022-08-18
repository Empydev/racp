import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { Header } from "../layout/Header";

import { ErrorMessage } from "../components/ErrorMessage";
import { GrfBrowser } from "../../lib/GrfBrowser";
import { defined } from "../../lib/defined";
import {
  useCountMapImagesQuery,
  useUploadMapImagesMutation,
} from "../state/client";
import { fromBrowserFile } from "../../lib/rpc/RpcFile";
import { FileUploader } from "../components/FileUploader";

export default function AdminMapImagesPage() {
  const { data: mapImageCount = 0 } = useCountMapImagesQuery();
  const [isLoadingMapImages, setIsLoadingMapImages] = useState(false);
  const [uploadCount, setUploadCount] = useState<number>(0);
  const [uploadMapImages, { isLoading: isUploading, error: uploadError }] =
    useUploadMapImagesMutation();
  const isLoading = isUploading || isLoadingMapImages;

  async function onFileSelectedForUpload(file: File) {
    setIsLoadingMapImages(true);
    const files = await loadMapImages(file);
    setIsLoadingMapImages(false);
    setUploadCount(files.length);
    await uploadMapImages(files);
  }

  return (
    <>
      <Header>Maps</Header>
      <Typography paragraph>
        Database currently contain {mapImageCount} map images.
      </Typography>
      <FileUploader
        value={[]}
        sx={{ maxWidth: 380, margin: "0 auto" }}
        accept=".grf"
        isLoading={isLoading}
        onChange={([file]) => onFileSelectedForUpload(file)}
        maxFiles={1}
        title="Select your data.grf file to upload new map images."
      />
      <ErrorMessage sx={{ textAlign: "center", mt: 1 }} error={uploadError} />
      <Box sx={{ margin: "0 auto" }}>
        {isUploading && (
          <Typography>Uploading {uploadCount} map images...</Typography>
        )}
        {isLoadingMapImages && <Typography>Loading GRF file...</Typography>}
      </Box>
    </>
  );
}

async function loadMapImages(file: File) {
  const grf = new GrfBrowser(file);
  await grf.load();

  const mapImages = await Promise.allSettled(
    grf
      .dir(`data\\texture\\à¯àúàîåíæäàì½º\\map\\`)
      .map((file) => grf.getFileObject(file, "image/bmp"))
  );

  const successfullyLoadedMapImages = defined(
    mapImages.map((res) => (res.status === "fulfilled" ? res.value : undefined))
  );

  const rpcFiles = await Promise.all(
    successfullyLoadedMapImages.map(fromBrowserFile)
  );

  return rpcFiles;
}