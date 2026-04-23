import multer from "multer";

const allowedTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/mp3",
    "audio/ogg",
    "audio/x-m4a",
    "audio/mp4",
    "audio/aac",
    "audio/webm",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp"
];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './tmp/uploads')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(new Error("Only audio and image files are allowed"), false);
    }
})


export default upload