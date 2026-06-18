const express =
  require("express");

const router =
  express.Router();

const upload =
  require(
    "../config/multer"
  );

router.post(
  "/",
  upload.single(
    "file"
  ),
  async (
    req,
    res
  ) => {

    try {

      if (
        !req.file
      ) {

        return res
          .status(400)
          .json({
            message:
              "No file uploaded",
          });

      }

      res.json({

        fileUrl:
          `http://localhost:5000/uploads/${req.file.filename}`,

        fileType:
          req.file.mimetype,

      });

    } catch(error){

      console.log(
        error
      );

      res
        .status(500)
        .json({
          message:
            "Upload failed",
        });

    }

  }
);

module.exports =
  router;