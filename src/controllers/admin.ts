import { Request, Response } from 'express';
import { Admin } from '../entities/Admin';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Business_account } from '../entities/Business_account';
import { Business_register_business, statusEnum } from '../entities/Business_register_business';
import { Customer_account } from '../entities/Customer_account';

export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;

        const admin = await Admin.findOneBy({ username });

        if (!admin) {
            res.status(400).json({
                status: 400,
                message: 'Invalid username or password'
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            res.status(400).json({
                status: 400,
                message: 'Invalid username or password'
            });
            return;
        }

        const token = jwt.sign(
            { id: admin.admin_id, username: admin.username, role: admin.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        res.json({
            admin,
            token
        });

    } catch (error) {

        console.log(error);

        res.status(400).json({
            status: 400,
            message: error.message.toString()
        });
    }
}

// Business-related business logic below

export const getAllBusinesses = async (req: Request, res: Response): Promise<void> => {
    try {
        const businesses = await Business_account.find(); // Fetch all businesses
        res.status(200).json(businesses);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch businesses'
        });
    }
}

export const getOneBusiness = async (req: Request, res: Response): Promise<void> => {
    try {
        const { business_id } = req.params;
        const id = parseInt(business_id);
        const business = await Business_account.findOneBy({ business_id: id }); // Fetch one business
        res.status(200).json(business);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch business'
        });
    }
}

export const getAllPendingBusinessRegistrations = async (req: Request, res: Response): Promise<void> => {
    try {
        const pendingBusinessRegistrations = await Business_register_business.find({ 
            where: { status: 'pending' }, // Fetch all pending businesses
        });
        res.status(200).json(pendingBusinessRegistrations);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch pending businesses'
        });
    }
}

export const getPendingBusinessRegistrationByRegistrationId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { registration_id } = req.params;
        const id = parseInt(registration_id);
        const pendingBusinessRegistration = await Business_register_business.findOneBy({ registration_id: id }); // Fetch one pending business
        res.status(200).json(pendingBusinessRegistration);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch pending business'
        });
    }
}

export const reviewPendingBusinessRegistrationByRegistrationId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { registration_id } = req.params;
        const id = parseInt(registration_id);
        const { status, remarks } = req.body;
        const pendingBusinessRegistration = await Business_register_business.findOneBy({ registration_id: id }); // Fetch one pending business

        if (!pendingBusinessRegistration) {
            res.status(400).json({
                status: 400,
                message: 'Business registration not found'
            });
            return;
        }

        pendingBusinessRegistration.status = status;
        pendingBusinessRegistration.remarks = remarks;

        await pendingBusinessRegistration.save();

        res.status(200).json(pendingBusinessRegistration);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to update business registration'
        });
    }
}

export const getBusinessTransactionsByBusinessId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { business_id } = req.params;
        const id = parseInt(business_id);
        const business = await Business_account.findOne({
            where: { business_id: id },
            relations: ['transactions']  // Ensure transactions are loaded
        });

        if (!business) {
            res.status(400).json({
                status: 400,
                message: 'Business not found'
            });
            return;
        }

        const businessTransactions = await business.transactions;

        res.status(200).json(businessTransactions);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch business transactions'
        });
    }
}

// Customer-related business logic below

export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
    try {
        const customers = await Customer_account.find(); // Fetch all customers
        res.status(200).json(customers);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch customers'
        });
    }
}

export const getCustomerByCustomerId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customer_id } = req.params;
        const id = parseInt(customer_id);
        const customer = await Customer_account.findOneBy({ id: id }); // Fetch one customer
        res.status(200).json(customer);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch customer'
        });
    }
}

export const getCustomerTransactionsByCustomerId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { customer_id } = req.params;
        const id = parseInt(customer_id);
        const customer = await Customer_account.findOne({
            where: { id: id },
            relations: ['transactions']  // Ensure transactions are loaded
        });

        if (!customer) {
            res.status(400).json({
                status: 400,
                message: 'Customer not found'
            });
            return;
        }

        const customerTransactions = await customer.transactions;

        res.status(200).json(customerTransactions);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: 500,
            message: 'Failed to fetch customer transactions'
        });
    }
}