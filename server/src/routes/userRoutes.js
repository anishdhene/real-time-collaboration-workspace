const express =
  require("express");

const router =
  express.Router();

const User =
  require(
    "../models/User"
  );

const authMiddleware =
  require(
    "../middleware/authMiddleware"
  );

router.get(
  "/profile",

  authMiddleware,

  async (req,res)=>{

    try {

      const user =
        await User
          .findById(
            req.user.id
          )
          .select(
            "-password"
          );

      res.json(
        user
      );

    } catch(error){

      console.log(
        error
      );

      res
        .status(500)
        .json({

          message:
            "Server Error",

        });

    }

  }
);

router.put(
  "/profile",

  authMiddleware,

  async (req,res)=>{

    try {

      const {
        username,
        avatar,
      } = req.body;

      const user =
        await User.findById(
          req.user.id
        );

      if (!user){

        return res
          .status(404)
          .json({

            message:
              "User not found",

          });

      }

      user.username =

        username ||
        user.username;

      user.avatar =

        avatar ||
        user.avatar;

      await user.save();

      res.json({

        message:
          "Profile Updated",

        user,

      });

    } catch(error){

      console.log(
        error
      );

      res
        .status(500)
        .json({

          message:
            "Server Error",

        });

    }

  }
);

module.exports =
  router;