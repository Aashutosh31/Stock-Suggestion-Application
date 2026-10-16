import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../utils/errors.js";
import { sendSuccess } from "../../utils/http.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { routeParam } from "../../utils/params.js";
import * as service from "./watchlist.service.js";

export const watchlistsRouter = Router();
watchlistsRouter.use(requireAuth);

watchlistsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const lists = await service.listWatchlists(req.user!._id);
    const enriched = await Promise.all(lists.map((l) => service.withQuotes(l)));
    sendSuccess(res, { watchlists: enriched });
  }),
);

watchlistsRouter.post(
  "/",
  validate({ body: z.object({ name: z.string().trim().min(1).max(60) }) }),
  asyncHandler(async (req, res) => {
    const list = await service.createWatchlist(req.user!._id, (req.body as { name: string }).name);
    sendSuccess(res, { watchlist: await service.withQuotes(list) }, 201);
  }),
);

watchlistsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const lists = await service.listWatchlists(req.user!._id);
    const list = lists.find((l) => l.id === routeParam(req, "id"));
    if (!list) throw AppError.notFound("Watchlist not found");
    sendSuccess(res, { watchlist: await service.withQuotes(list) });
  }),
);

watchlistsRouter.patch(
  "/:id",
  validate({ body: z.object({ name: z.string().trim().min(1).max(60) }) }),
  asyncHandler(async (req, res) => {
    const list = await service.renameWatchlist(req.user!._id, routeParam(req, "id"), (req.body as { name: string }).name);
    sendSuccess(res, { watchlist: await service.withQuotes(list) });
  }),
);

watchlistsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await service.deleteWatchlist(req.user!._id, routeParam(req, "id"));
    sendSuccess(res, { deleted: true });
  }),
);

watchlistsRouter.post(
  "/:id/items",
  validate({
    body: z.object({ symbol: z.string().trim().min(1).max(32), note: z.string().max(1000).optional() }),
  }),
  asyncHandler(async (req, res) => {
    const { symbol, note } = req.body as { symbol: string; note?: string };
    const list = await service.addItem(req.user!._id, routeParam(req, "id"), symbol, note);
    sendSuccess(res, { watchlist: await service.withQuotes(list) }, 201);
  }),
);

watchlistsRouter.delete(
  "/:id/items/:symbol",
  asyncHandler(async (req, res) => {
    const list = await service.removeItem(req.user!._id, routeParam(req, "id"), routeParam(req, "symbol"));
    sendSuccess(res, { watchlist: await service.withQuotes(list) });
  }),
);

watchlistsRouter.patch(
  "/:id/items/:symbol",
  validate({ body: z.object({ note: z.string().max(1000).nullable() }) }),
  asyncHandler(async (req, res) => {
    const { note } = req.body as { note: string | null };
    const list = await service.updateItemNote(req.user!._id, routeParam(req, "id"), routeParam(req, "symbol"), note);
    sendSuccess(res, { watchlist: await service.withQuotes(list) });
  }),
);

watchlistsRouter.put(
  "/:id/order",
  validate({ body: z.object({ symbols: z.array(z.string().min(1).max(32)).max(500) }) }),
  asyncHandler(async (req, res) => {
    const { symbols } = req.body as { symbols: string[] };
    const list = await service.reorderItems(req.user!._id, routeParam(req, "id"), symbols);
    sendSuccess(res, { watchlist: await service.withQuotes(list) });
  }),
);
