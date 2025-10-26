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
      await update.downloadAndInstall().then(async () => {
        await relaunch();
      });
    }
  } catch (error) {
    console.error(error);
  }
};
