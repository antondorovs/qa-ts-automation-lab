import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
    baseUrl: process.env.BASE_URL || '',
    email: process.env.API_EMAIL || '',
    password: process.env.API_PASSWORD || '',
};