import cron from "node-cron";
import { checkExpiringSubscription } from "../controllers/business"; // Adjust the import to your folder structure

// Schedule the job to run once a day at 9 AM. 0 9 * * *
// * * * * *: checks every minute for demo
// */5 * * * *: checks every 5 minute for demo
// adjust to adjust email sending frequency
cron.schedule('*/3 * * * *', async () => {
    try {
        console.log('Running subscription expiry check every minute for demo...');
        console.log('Email sent every minute for demo... ');
        await checkExpiringSubscription();

    } catch (error) {
        console.error('Error in subscription expiry check:', error);
    }
});

//console.log('currently scheduled tasks:', cron.getTasks());