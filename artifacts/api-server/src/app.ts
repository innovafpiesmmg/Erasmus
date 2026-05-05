import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieParser from "cookie-parser";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";
import { ogCrawlerMiddleware } from "./middleware/og-crawler";

const app: Express = express();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(UPLOADS_DIR));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(ogCrawlerMiddleware);

app.use("/api", router);

// Resolve relative to this compiled file's location (dist/index.mjs → api-server/dist → api-server → erasmus-web/dist/public)
// This works regardless of the working directory, covering both dev (cwd=api-server/) and
// production (cwd=monorepo root, service launched with absolute path).
const WEB_DIST = path.resolve(import.meta.dirname, "../../erasmus-web/dist/public");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(WEB_DIST));
  app.get(/^(?!\/api\/|\/uploads\/)/, (_req, res) => {
    res.sendFile(path.join(WEB_DIST, "index.html"));
  });
}

export default app;
