import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import swaggerUi from "swagger-ui-express";
import logger from "../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

let swaggerDocument = {};
try {
  const swaggerYamlPath = path.join(__dirname, "docs", "swagger.yaml");
  const fileContents = fs.readFileSync(swaggerYamlPath, "utf8");
  swaggerDocument = yaml.load(fileContents);
} catch (error) {
  logger.error("Gagal memuat file swagger.yaml", { error: error.stack });
}

// Custom Swagger UI options for a modern, responsive interface
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { background-color: #1e1b4b; border-bottom: 2px solid #6366f1; }
    .swagger-ui .topbar img { content: url('https://cdn-icons-png.flaticon.com/512/3135/3135715.png'); height: 38px; width: auto; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #1e1b4b; font-family: system-ui, -apple-system, sans-serif; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .swagger-ui .opblock { border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  `,
  customSiteTitle: "SIPASN API Documentation — OpenAPI 3.0",
  customfavIcon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: "list",
  },
};

// Endpoint untuk download / render JSON spec
router.get("/json", (req, res) => {
  res.json(swaggerDocument);
});

// Setup Swagger UI route
router.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

export { swaggerDocument, swaggerOptions };
export default router;
