import { Router } from 'express';
import { renewSubscription } from '../controllers/business_renew_subscription';

const router = Router();

router.put('/api/business/renew_subscription', renewSubscription);

export { router as businessRenewSubscription };
