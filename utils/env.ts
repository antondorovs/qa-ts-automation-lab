import * as dotenv from 'dotenv';

dotenv.config();

export const env = {
    baseUrl: process.env.BASE_URL || 'https://reqres.in',
    email: process.env.API_EMAIL || 'eve.holt@reqres.in',
    password: process.env.API_PASSWORD || 'cityslicka',
};
