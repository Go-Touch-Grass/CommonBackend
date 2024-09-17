
/*import { Request, Response } from 'express'; 

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Business_register_business } from '../entities/Business_register_business';
import { Business_account } from '../entities/Business_account';

// For registering their business after the creation of account 
export const registerBusiness = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            entityName,
            location,
            category,
            username,
        } = req.body;

        const isUsernameAlreadyInUse = await Business_register_business.findOneBy({ entityName });

        if (isUsernameAlreadyInUse) {
            res.status(400).json({
                status: 400,
                message: 'Business EntityName already in use'
            });
        }

        // Check if req.file is defined
        if (!req.file) {
            res.status(400).json({
                status: 400,
                message: 'Proof file (image or PDF) is required'
            });
            return; // Exit the function early if no file is provided
        }

        const businessAccount = await Business_account.findOneBy({ username });
        if (!businessAccount) {
            res.status(400).json({
                status: 400,
                message: 'Business Account not found'
            });
            return;
        }

        const registeredBusiness = Business_register_business.create({
            entityName,
            location,
            category,
            proof: req.file.path, // store the file path or URL.
            status: 'pending',
            remarks: "",
            business_account: businessAccount // Link the business_account entity to business_register_business
        });

        await registeredBusiness.save();

        res.json({
            registeredBusiness
        });

    } catch (error) {

        console.log(error);

        res.status(400).json({
            status: 400,
            message: error.message.toString()
        });
    }
};

/* // Admin view proof //
Frontend: 
const BusinessProof = ({ proof }) => {
  const isImage = proof.match(/\.(jpeg|jpg|png)$/);
  
  return (
    <div>
      <h3>Uploaded Proof</h3>
      {isImage ? (
        <img src={`/${proof}`} alt="Business Proof" />
      ) : (
        <a href={`/${proof}`} target="_blank" rel="noopener noreferrer">
          View PDF
        </a>
      )}
    </div>
  );
};

Controller: 
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

// Serve the uploaded proof file (image or PDF) for admin to view
export const viewProof = async (req: Request, res: Response) => {
    const { proofFileName } = req.params;

    const filePath = path.join(__dirname, '../../uploads/', proofFileName);

    fs.exists(filePath, (exists) => {
        if (!exists) {
            return res.status(404).json({ message: 'File not found' });
        }

        return res.sendFile(filePath);
    });
};

Routes: 
// Route for viewing the proof (Admin only)
router.get("/api/business/viewProof/:proofFileName", viewProof);
*/
