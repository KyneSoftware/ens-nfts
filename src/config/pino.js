import pino from "pino";
import ecsFormat from "@elastic/ecs-pino-format"; // Optional

export const logger = pino({
  ...ecsFormat(), // Optional
  level: process.env.LOG_LEVEL || "info",
  prettyPrint:
    process.env.NODE_ENV !== "production" ||
    process.env.LOG_PRETTY_PRINT === "true",
});