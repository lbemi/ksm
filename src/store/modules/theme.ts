import { Locale } from "@/types/them";
import { get, set } from "@/utils/localStorage";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface State {
  theme: "light" | "dark";
  locale: Locale;
  loading: boolean;
  compact: boolean;
}

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";
const userTheme = get("theme") as State["theme"];
const compact = () => {
  const compact = get("compact");
  if (compact === null || compact === undefined) {
    set("compact", false);
    return false;
  }
  return JSON.parse(compact) as boolean;
};
const initialState: State = {
  theme: userTheme || systemTheme,
  locale: (get("locale")! || "zh_CN") as unknown as Locale,
  loading: false,
  compact: compact(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Partial<State>>) {
      Object.assign(state, action.payload);
      if (action.payload.compact !== undefined) {
        set("compact", action.payload.compact);
        state.compact = action.payload.compact;
      }
      if (action.payload.locale !== undefined) {
        set("locale", action.payload.locale);
        state.locale = action.payload.locale;
      }
      if (action.payload.theme) {
        set("theme", action.payload.theme);
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
    },
  },
});

const { setTheme } = themeSlice.actions;

export { setTheme };
export default themeSlice.reducer;
