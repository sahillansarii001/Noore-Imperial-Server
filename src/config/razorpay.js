import Razorpay from 'razorpay';
import { env } from './env.js';

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY.KEY_ID,
  key_secret: env.RAZORPAY.KEY_SECRET,
});
