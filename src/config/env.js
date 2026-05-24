import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID,
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  },
  SMTP: {
    HOST: process.env.SMTP_HOST,
    PORT: process.env.SMTP_PORT || 587,
    USER: process.env.SMTP_USER,
    PASS: process.env.SMTP_PASS,
    FROM: process.env.SMTP_FROM,
  },
  WHATSAPP: {
    API_KEY: process.env.WHATSAPP_API_KEY,
    API_URL: process.env.WHATSAPP_API_URL,
  },
  SHIPROCKET: {
    EMAIL: process.env.SHIPROCKET_EMAIL,
    PASSWORD: process.env.SHIPROCKET_PASSWORD,
  },
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL,
};

// Basic validation
const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
for (const v of requiredVars) {
  if (!process.env[v]) {
    console.warn(`Warning: Missing required environment variable ${v}`);
  }
}
