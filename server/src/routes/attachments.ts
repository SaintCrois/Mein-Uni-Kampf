import { Router } from "express";
import multer from "multer";
import { getPrisma } from "../prisma.js";

const router = Router();

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_FILES,
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      callback(new Error("Unsupported file type"));
      return;
    }

    callback(null, true);
  },
});

router.post(
  "/:ticketId/attachments",
  (req, res, next) => {
    upload.array("files", MAX_FILES)(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Each file must be 5 MiB or smaller",
          });
        }

        if (error.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            error: "A ticket can have a maximum of 5 attachments",
          });
        }

        return res.status(400).json({
          error: "Attachment upload failed",
        });
      }

      if (error) {
        return res.status(400).json({
          error: "Unsupported file type",
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const ticketId = Number(req.params.ticketId);
      const requesterId = Number(req.header("X-Requester-Id"));

      if (!Number.isInteger(ticketId) || !Number.isInteger(requesterId)) {
        return res.status(400).json({
          error: "Invalid ticket or requester",
        });
      }

      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: "At least one file is required",
        });
      }

      const prisma = getPrisma();

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return res.status(404).json({
          error: "Ticket not found",
        });
      }

      if (ticket.requesterId !== requesterId) {
        return res.status(403).json({
          error: "Access denied",
        });
      }

      const existingAttachments = await prisma.attachment.count({
        where: {
          ticketId,
          status: "ACTIVE",
        },
      });

      if (existingAttachments + files.length > MAX_FILES) {
        return res.status(400).json({
          error: "A ticket can have a maximum of 5 attachments",
        });
      }

      const attachments = await prisma.$transaction(
        files.map((file) =>
          prisma.attachment.create({
            data: {
              ticketId,
              originalFileName: file.originalname,
              storedFileName: file.originalname,
              mimeType: file.mimetype,
              fileSize: file.size,
              status: "ACTIVE",
            },
          }),
        ),
      );

      return res.status(201).json({
        data: attachments,
      });
    } catch (_error) {
      return res.status(500).json({
        error: "Attachment upload failed",
      });
    }
  },
);


export default router;
