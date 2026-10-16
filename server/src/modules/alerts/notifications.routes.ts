import { Router } from "express";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { routeParam } from "../../utils/params.js";
import { Notification } from "./alert.model.js";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const [items, unread] = await Promise.all([
      Notification.find({ userId: req.user!._id }).sort({ createdAt: -1 }).limit(100),
      Notification.countDocuments({ userId: req.user!._id, read: false }),
    ]);
    sendSuccess(res, { notifications: items, unread });
  }),
);

notificationsRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    await Notification.updateOne({ _id: routeParam(req, "id"), userId: req.user!._id }, { $set: { read: true } });
    sendSuccess(res, { read: true });
  }),
);

notificationsRouter.post(
  "/read-all",
  asyncHandler(async (req, res) => {
    const result = await Notification.updateMany({ userId: req.user!._id, read: false }, { $set: { read: true } });
    sendSuccess(res, { updated: result.modifiedCount });
  }),
);

notificationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await Notification.deleteOne({ _id: routeParam(req, "id"), userId: req.user!._id });
    sendSuccess(res, { deleted: true });
  }),
);
