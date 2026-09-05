import { Router } from "express";
import multer from "multer";
import { getPrisma } from "../prisma.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.resolve(__dirname, "../../uploads");

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

      await mkdir(UPLOAD_DIR, { recursive: true });

      const filesToStore = files.map((file) => {
        const extension = path.extname(file.originalname);
        const storedFileName = `${crypto.randomUUID()}${extension}`;

        return {
          file,
          storedFileName,
        };
      });

      await Promise.all(
        filesToStore.map(({ file, storedFileName }) =>
          writeFile(
            path.join(UPLOAD_DIR, storedFileName),
            file.buffer,
          ),
        ),
      );

      const attachments = await prisma.$transaction(
        filesToStore.map(({ file, storedFileName }) =>
          prisma.attachment.create({
            data: {
              ticketId,
              originalFileName: file.originalname,
              storedFileName,
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


router.get(
  "/:ticketId/attachments/:attachmentId/download",
  async (req, res) => {
    try {
      const ticketId = Number(req.params.ticketId);
      const attachmentId = Number(req.params.attachmentId);
      const requesterId = Number(req.header("X-Requester-Id"));

      if (
        !Number.isInteger(ticketId) ||
        !Number.isInteger(attachmentId) ||
        !Number.isInteger(requesterId)
      ) {
        return res.status(400).json({
          error: "Invalid ticket, attachment, or requester",
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

      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment || attachment.ticketId !== ticketId) {
        return res.status(404).json({
          error: "Attachment not found",
        });
      }

      if (attachment.status !== "ACTIVE") {
        return res.status(404).json({
          error: "Attachment not found",
        });
      }

      const filePath = path.join(
        UPLOAD_DIR,
        attachment.storedFileName,
      );

      res.setHeader("Content-Type", attachment.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(
          attachment.originalFileName,
        )}`,
      );

      return res.sendFile(filePath, (error) => {
        if (error && !res.headersSent) {
          res.status(404).json({
            error: "Attachment file not found",
          });
        }
      });
    } catch (_error) {
      return res.status(500).json({
        error: "Attachment download failed",
      });
    }
  },
);


router.delete(
  "/:ticketId/attachments/:attachmentId",
  async (req, res) => {
    try {
      const ticketId = Number(req.params.ticketId);
      const attachmentId = Number(req.params.attachmentId);
      const requesterId = Number(req.header("X-Requester-Id"));

      if (
        !Number.isInteger(ticketId) ||
        !Number.isInteger(attachmentId) ||
        !Number.isInteger(requesterId)
      ) {
        return res.status(400).json({
          error: "Invalid ticket, attachment, or requester",
        });
      }

      const reason = req.body?.reason;

      if (typeof reason !== "string" || reason.trim().length === 0) {
        return res.status(400).json({
          error: "Removal reason is required",
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

      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment || attachment.ticketId !== ticketId) {
        return res.status(404).json({
          error: "Attachment not found",
        });
      }

      if (attachment.status !== "ACTIVE") {
        return res.status(404).json({
          error: "Attachment not found",
        });
      }

      const removedAttachment = await prisma.attachment.update({
        where: { id: attachmentId },
        data: {
          status: "REMOVED",
          removalReason: reason.trim(),
          removedAt: new Date(),
        },
      });

      return res.status(200).json({
        data: {
          id: removedAttachment.id,
          status: removedAttachment.status,
          removalReason: removedAttachment.removalReason,
          removedAt: removedAttachment.removedAt,
        },
      });
    } catch (_error) {
      return res.status(500).json({
        error: "Attachment removal failed",
      });
    }
  },
);


export default router;
