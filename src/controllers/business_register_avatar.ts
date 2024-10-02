import { Request, Response } from "express";
import { Business_account } from "../entities/Business_account";
import { Business_avatar_request } from "../entities/Business_register_avatar";

export const registerAvatar = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { business_id, avatarFile } = req.body;

    if (!avatarFile) {
      res.status(400).json({
        status: 400,
        message: "Avatar file is required",
      });
      return;
    }

    const businessAccount = await Business_account.findOneBy({ business_id });
    if (!businessAccount) {
      res.status(400).json({
        status: 400,
        message: "Business Account not found",
      });
      return;
    }

    const avatarRequest = Business_avatar_request.create({
      business_id,
      avatarFile,
    });

    await avatarRequest.save();

    res.json({
      avatarRequest,
    });
  } catch (error) {
    console.log(error);

    res.status(400).json({
      status: 400,
      message: error.message.toString(),
    });
  }
};
