import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import {
  ActionIcon,
  Button,
  type CSSVariablesResolver,
  MantineProvider,
  createTheme,
} from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./app/App.tsx";

// Grey subtle buttons share one hover color (see --hover-bg).
const isGreySubtle = (props: { variant?: string; color?: string }) =>
  props.variant === "subtle" && props.color === "gray";

const theme = createTheme({
  primaryColor: "blue",
  defaultRadius: "sm",
  components: {
    ActionIcon: ActionIcon.extend({
      vars: (_theme, props) => ({
        root: isGreySubtle(props) ? { "--ai-hover": "var(--hover-bg)" } : {},
      }),
    }),
    Button: Button.extend({
      vars: (_theme, props) => ({
        root: isGreySubtle(props) ? { "--button-hover": "var(--hover-bg)" } : {},
      }),
    }),
  },
});

// App colors that differ between the light and dark schemes.
const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    "--checker-a": "#ffffff",
    "--checker-b": "#d4d4d8",
    // Hover color shared by all grey subtle buttons in the toolbar and status bar.
    "--hover-bg": "var(--mantine-color-gray-1)",
    // The canvas area sits a shade darker than the rest of the app.
    "--canvas-bg": "var(--mantine-color-gray-2)",
  },
  dark: {
    "--checker-a": "#3f3f46",
    "--checker-b": "#27272a",
    "--hover-bg": "var(--mantine-color-dark-5)",
    "--canvas-bg": "var(--mantine-color-dark-8)",
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="auto"
    >
      <App />
    </MantineProvider>
  </StrictMode>,
);
