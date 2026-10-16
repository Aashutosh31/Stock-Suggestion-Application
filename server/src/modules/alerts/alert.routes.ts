import { Router } from "express";
import { z } from "zod";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { routeParam } from "../../utils/params.js";
import { ALERT_TYPES } from "./alert.model.js";
import { isMailEnabled } from "../notifications/mail.service.js";
import * as service from "./alert.service.js";

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

alertsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const alerts = await service.listAlerts(req.user!._id);
    sendSuccess(res, { alerts, emailEnabled: isMailEnabled() });
  }),
);

alertsRouter.post(
  "/",
  validate({
    body: z.object({
      symbol: z.string().trim().min(1).max(32),
      type: z.enum(ALERT_TYPES as [string, ...string[]]),
      threshold: z.coerce.number().finite(),
      note: z.string().max(500).nullable().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const alert = await service.createAlert(req.user!._id, req.body as never);
    sendSuccess(res, { alert }, 201);
  }),
);

alertsRouter.patch(
  "/:id",
  validate({
    body: z.object({
      threshold: z.coerce.number().finite().optional(),
      status: z.enum(["active", "paused", "triggered"]).optional(),
      note: z.string().max(500).nullable().optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const alert = await service.updateAlert(req.user!._id, routeParam(req, "id"), req.body as never);
    sendSuccess(res, { alert });
  }),
);

alertsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await service.deleteAlert(req.user!._id, routeParam(req, "id"));
    sendSuccess(res, { deleted: true });
  }),
);

alertsRouter.post(
  "/evaluate",
  asyncHandler(async (req, res) => {
    const result = await service.evaluateAlerts(req.user!._id);
    sendSuccess(res, result);
  }),
);
