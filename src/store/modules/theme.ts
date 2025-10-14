import { Locale } from "@/types/them";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State {
  theme: "light" | "dark";
  locale: Locale;
  loading: boolean;
  compact: boolean;
  checkUpdate: boolean;
}

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
const userTheme = localStorage.getItem("theme") as State["theme"];
const compact = () => {
  const compact = localStorage.getItem("compact");
  if (compact === null || compact === undefined) {
    localStorage.setItem("compact", false.toString());
    return false;
  }
  return compact === "true";
};
const update = () => {
  const update = localStorage.getItem("checkUpdate");
  if (update === null || update === undefined) {
    localStorage.setItem("checkUpdate", true.toString());
    return true;
  }
  return update === "true";
};

const initialState: State = {
  theme: userTheme || systemTheme,
  locale: (localStorage.getItem("locale")! || "zh_CN") as unknown as Locale,
  loading: false,
  compact: compact(),
  checkUpdate: update(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Partial<State>>) {
      Object.assign(state, action.payload);
      if (action.payload.compact !== undefined) {
        localStorage.setItem("compact", action.payload.compact.toString());
        state.compact = action.payload.compact;
      }
      if (action.payload.locale !== undefined) {
        localStorage.setItem("locale", action.payload.locale);
        state.locale = action.payload.locale;
      }
      if (action.payload.theme) {
        localStorage.setItem("theme", action.payload.theme);
        const body = document.body;
        if (action.payload.theme === "dark") {
          if (!body.hasAttribute("theme-mode")) {
            body.setAttribute("theme-mode", "dark");
          }
        } else {
          if (body.hasAttribute("theme-mode")) {
            body.removeAttribute("theme-mode");
          }
        }
      }
      if (action.payload.checkUpdate !== undefined) {
        localStorage.setItem(
          "checkUpdate",
          action.payload.checkUpdate.toString()
        );
        state.checkUpdate = action.payload.checkUpdate;
      }
    },
  },
});

const { setTheme } = themeSlice.actions;

export { setTheme };
export default themeSlice.reducer;
