import { Request, Response } from "express";
import { Customer_account } from "../entities/Customer_account";

export const getAllFriends = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const userId = (req as any).user.id;
		const customer = await Customer_account.findOne({
			where: { id: userId },
			relations: ["friends"],
		});

		if (!customer) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.json(customer.friends);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const sendFriendRequest = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const userId = (req as any).user.id;
		const { friendId } = req.body;

		const sender = await Customer_account.findOne({
			where: { id: userId },
			relations: ["sentFriendRequests"],
		});
		const receiver = await Customer_account.findOne({
			where: { id: friendId },
			relations: ["receivedFriendRequests"],
		});

		if (!sender || !receiver) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		if (
			sender.sentFriendRequests.some(
				(fr) => fr.id === receiver.id
			)
		) {
			res.status(400).json({
				message: "Friend request already sent",
			});
			return;
		}

		sender.sentFriendRequests.push(receiver);
		receiver.receivedFriendRequests.push(sender);

		await sender.save();
		await receiver.save();

		res.json({ message: "Friend request sent successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getAllFriendRequests = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const userId = (req as any).user.id;
		const customer = await Customer_account.findOne({
			where: { id: userId },
			relations: ["receivedFriendRequests"],
		});

		if (!customer) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		res.json(customer.receivedFriendRequests);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const acceptFriendRequest = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const userId = (req as any).user.id;
		const { friendId } = req.body;

		const user = await Customer_account.findOne({
			where: { id: userId },
			relations: ["friends", "receivedFriendRequests"],
		});
		const friend = await Customer_account.findOne({
			where: { id: friendId },
			relations: ["friends", "sentFriendRequests"],
		});

		if (!user || !friend) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		user.friends.push(friend);
		friend.friends.push(user);

		user.receivedFriendRequests =
			user.receivedFriendRequests.filter(
				(fr) => fr.id !== friend.id
			);
		friend.sentFriendRequests = friend.sentFriendRequests.filter(
			(fr) => fr.id !== user.id
		);

		await user.save();
		await friend.save();

		res.json({ message: "Friend request accepted" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const rejectFriendRequest = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const userId = (req as any).user.id;
		const { friendId } = req.body;

		const user = await Customer_account.findOne({
			where: { id: userId },
			relations: ["receivedFriendRequests"],
		});
		const friend = await Customer_account.findOne({
			where: { id: friendId },
			relations: ["sentFriendRequests"],
		});

		if (!user || !friend) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		user.receivedFriendRequests =
			user.receivedFriendRequests.filter(
				(fr) => fr.id !== friend.id
			);
		friend.sentFriendRequests = friend.sentFriendRequests.filter(
			(fr) => fr.id !== user.id
		);

		await user.save();
		await friend.save();

		res.json({ message: "Friend request rejected" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const removeFriend = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const userId = (req as any).user.id;
		const { friendId } = req.body;

		const user = await Customer_account.findOne({
			where: { id: userId },
			relations: ["friends"],
		});
		const friend = await Customer_account.findOne({
			where: { id: friendId },
			relations: ["friends"],
		});

		if (!user || !friend) {
			res.status(404).json({ message: "User not found" });
			return;
		}

		user.friends = user.friends.filter((f) => f.id !== friend.id);
		friend.friends = friend.friends.filter((f) => f.id !== user.id);

		await user.save();
		await friend.save();

		res.json({ message: "Friend removed successfully" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getLeaderboard = async (
	req: Request,
	res: Response
): Promise<void> => {
	try {
		const leaderboard = await Customer_account.find({
			select: ["id", "username", "exp"],
			order: { exp: "DESC" },
			take: 10,
		});

		res.json(leaderboard);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Internal server error" });
	}
};
