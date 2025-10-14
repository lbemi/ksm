import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export const checkUpdate = async () => {
  try {
    const update = await check();
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
    const update = await check();
    if (update) {
      let downloaded = 0;
      let contentLength = 0;
      // alternatively we could also call update.download() and update.install() separately

      try {
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength || 0;
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              break;
            case "Finished":
              console.log("download finished");
              break;
          }
        });
        //   .then(async () => {
        //     await relaunch();
        //   });
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error(error);
  }
};
