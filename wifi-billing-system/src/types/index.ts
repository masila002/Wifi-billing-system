export interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Bill {
    id: string;
    userId: string;
    amount: number;
    status: 'paid' | 'unpaid';
    createdAt: Date;
    updatedAt: Date;
}