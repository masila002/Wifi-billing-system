import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    phone: String,
    amount: Number,
    mpesaReceiptNumber: String,
    transactionDate: String,
    status: String,
    raw: Object, // Store the full callback for reference
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);