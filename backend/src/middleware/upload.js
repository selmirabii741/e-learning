import multer from 'multer';


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
    }
};

export const uploadPDF = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 },
});
