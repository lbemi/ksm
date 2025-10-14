import { emit } from "@tauri-apps/api/event";
import { WindowConfig } from "./index";

export const createWindow = async (args: WindowConfig) => {
  await emit("win-create", args);
};

export const aboutWindow = async () => {
  await createWindow({
    label: "about2",
    title: "关于我们",
    url: "/kubernetes",
    width: 480,
    height: 360,
    x: 100,
    y: 200,
  });
};
