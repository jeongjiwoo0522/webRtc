import multer from "multer";
import path from "path"
import fs from "fs";

try { 
  fs.readdirSync("uploads");
} catch(err) {
  fs.mkdirSync("uploads");
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      cb(null, "uploads/");
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 5 },
});

export default upload;