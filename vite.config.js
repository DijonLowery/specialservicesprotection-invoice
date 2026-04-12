import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { paychexRouteHandlers } from "./server/paychexRoutes.js";
import { crmSourcingRouteHandlers } from "./server/crmSourcingRoutes.js";
import { linkedInRouteHandlers } from "./server/linkedinRoutes.js";

function sspApiPlugin() {
  return {
    name: "ssp-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
        const handler =
          paychexRouteHandlers.get(pathname) ||
          crmSourcingRouteHandlers.get(pathname) ||
          linkedInRouteHandlers.get(pathname);

        if (!handler) {
          next();
          return;
        }

        await handler(req, res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), sspApiPlugin()],
});
