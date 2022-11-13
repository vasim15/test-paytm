import dotenv from 'dotenv'
dotenv.config();

export const {
     PORT,
     PAYTM_MIG,
     PAYTM_MERCHANT_KEY,
     PAYTM_WEBSITE,
     PAYTM_CHANNEL_ID,
} = process.env
