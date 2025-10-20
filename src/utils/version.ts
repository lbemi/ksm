import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export const checkUpdate = async () => {
  try {
    const update = await check({
      timeout: 3000,
      headers: {
        "X-AccessKey": "UPLnf4u3fyanTLeB6z8xEg", // UpgradeLink的AccessKey
      },
    });
    console.log(update);
    if (update) {
      return update.version;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const installUpdate = async () => {
  try {
    const update = await check({
      timeout: 3000,
      headers: {
        "X-AccessKey": "UPLnf4u3fyanTLeB6z8xEg", // UpgradeLink的AccessKey
      },
    });
    if (update) {
      let downloaded = 0;
      let contentLength = 0;
      await update
        .downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength || 0;
              console.log(`started downloading ${contentLength} bytes`);
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              const percentage = Math.round((downloaded / 1000) * 100);
              console.log(`下载进度: ${percentage}%`);
              break;
            case "Finished":
              console.log("download finished");
              break;
          }
        })
        .then(async () => {
          await relaunch();
        });
    }
  } catch (error) {
    console.error(error);
  }
};
