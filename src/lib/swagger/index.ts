import { swaggerConfig } from "./config";
import { apiPaths } from "./paths";

export function getSwaggerSpec() {
  return {
    ...swaggerConfig,
    paths: apiPaths,
  };
}

export { swaggerConfig, apiPaths };
