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
		const { username } = req.body;

		const sender = await Customer_account.findOne({
			where: { id: userId },
			relations: ["sentFriendRequests", "friends", "receivedFriendRequests"],
		});
		const receiver = await Customer_account.findOne({
			where: { username },
			relations: ["receivedFriendRequests", "friends", "sentFriendRequests"],
		});

		if (!sender || !receiver) {
			res.status(404).json({ message: "User not found :(" });
			return;
		}

		// Check if sender is trying to send a request to themselves
		if (sender.id === receiver.id) {
			res.status(400).json({
				message: "You cannot send a friend request to yourself!",
			});
			return;
		}

		// Check if they are already friends
		if (sender.friends.some((friend) => friend.id === receiver.id)) {
			res.status(400).json({
				message: "You are already friends with this user :)",
			});
			return;
		}

		// Check if sender has already sent a request to this receiver
		if (sender.sentFriendRequests.some((fr) => fr.id === receiver.id)) {
			res.status(400).json({
				message: "Friend request already sent to this user.",
			});
			return;
		}

		// Check if there's a pending request from the receiver to the sender
		if (sender.receivedFriendRequests.some((fr) => fr.id === receiver.id)) {
			// Automatically accept the request
			sender.friends.push(receiver);
			receiver.friends.push(sender);

			sender.receivedFriendRequests = sender.receivedFriendRequests.filter(
				(fr) => fr.id !== receiver.id
			);
			receiver.sentFriendRequests = receiver.sentFriendRequests.filter(
				(fr) => fr.id !== sender.id
			);

			await sender.save();
			await receiver.save();

			res.json({ message: "Friend request automatically accepted" });
			return;
		}

		// If all checks pass, send the friend request
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
