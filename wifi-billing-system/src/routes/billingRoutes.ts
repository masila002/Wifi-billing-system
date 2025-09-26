import { Router } from 'express';
import { initiateStkPush } from '../mpesaService';
import { Payment } from '../models/paymentModel';
import { User } from '../models/userModel';

export function setBillingRoutes(app: any) {
    const router = Router();

    // Initiate payment
    router.post('/pay', async (req, res) => {
        const { phone, amount, packageType } = req.body; // Accept packageType from client
        // Add this log to see what the frontend is sending
        console.log('Received payment request:', req.body);
        try {
            const result = await initiateStkPush(phone, amount);
            // Optionally, save the intended packageType somewhere (e.g., in a pending payments collection)
            res.json(result);
        } catch (error: any) {
            // Add this log to see the actual error
            console.error('Payment initiation error:', error);
            res.status(500).json({ error: 'Payment initiation failed', details: error.message });
        }
    });

    // M-Pesa callback endpoint
    router.post('/payment/callback', async (req, res) => {
        console.log('M-Pesa Callback:', req.body);

        // Extract payment details from callback
        const callback = req.body;
        let paymentData = {
            phone: '',
            amount: 0,
            mpesaReceiptNumber: '',
            transactionDate: '',
            status: 'FAILED',
            raw: callback
        };

        try {
            const stkCallback = callback.Body.stkCallback;
            if (stkCallback.ResultCode === 0) {
                const meta = stkCallback.CallbackMetadata.Item;
                paymentData = {
                    phone: meta.find((i: any) => i.Name === 'PhoneNumber')?.Value || '',
                    amount: meta.find((i: any) => i.Name === 'Amount')?.Value || 0,
                    mpesaReceiptNumber: meta.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value || '',
                    transactionDate: meta.find((i: any) => i.Name === 'TransactionDate')?.Value || '',
                    status: 'SUCCESS',
                    raw: callback
                };
            }
            await Payment.create(paymentData);

            // Determine packageType based on amount (or retrieve from pending payments)
            let packageType: '24hr' | '1week' | '1month' = '24hr';
            if (paymentData.amount >= 1000) packageType = '1month';
            else if (paymentData.amount >= 300) packageType = '1week';
            else packageType = '24hr';

            // Calculate expiry
            let expiry = new Date();
            if (packageType === '24hr') expiry.setHours(expiry.getHours() + 24);
            else if (packageType === '1week') expiry.setDate(expiry.getDate() + 7);
            else if (packageType === '1month') expiry.setMonth(expiry.getMonth() + 1);

            // Update user access based on payment
            if (paymentData.status === 'SUCCESS' && paymentData.phone) {
                await User.findOneAndUpdate(
                    { phone: paymentData.phone },
                    {
                        lastPaymentDate: new Date(),
                        accessGranted: true,
                        packageType,
                        accessExpiry: expiry
                    },
                    { upsert: true, new: true }
                );
            }
        } catch (err) {
            console.error('Error saving payment:', err);
        }

        res.json({ ResultCode: 0, ResultDesc: 'Received successfully' });
    });

    // Check user access
    router.get('/access/:phone', async (req, res) => {
        const { phone } = req.params;
        const user = await User.findOne({ phone });
        const now = new Date();
        if (user && user.accessGranted && user.accessExpiry && user.accessExpiry > now) {
            res.json({ access: true, packageType: user.packageType, expires: user.accessExpiry });
        } else {
            // Optionally, revoke access if expired
            if (user && user.accessGranted) {
                user.accessGranted = false;
                await user.save();
            }
            res.json({ access: false });
        }
    });

    app.use('/api/billing', router);
}