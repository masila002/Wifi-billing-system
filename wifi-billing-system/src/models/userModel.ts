import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    phone: { type: String, unique: true },
    lastPaymentDate: Date,
    accessGranted: { type: Boolean, default: false },
    packageType: { type: String, enum: ['24hr', '1week', '1month'], default: '24hr' },
    accessExpiry: Date
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);