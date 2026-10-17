import "@mantine/core/styles.css";
import "@mantine/dropzone/styles.css";
import "./index.css";
import { ActionIcon, Button, MantineProvider, createTheme } from "@mantine/core";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";

// Grey subtle buttons hover with the same color as Menubar items (see --hover-bg).
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>,
);
