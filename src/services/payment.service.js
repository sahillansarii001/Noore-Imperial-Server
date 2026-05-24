import crypto from 'crypto';
import { razorpay } from '../config/razorpay.js';
import { env } from '../config/env.js';

export const createRazorpayOrder = async (amount, currency = 'INR', receipt) => {
  const options = {
    amount: amount, // amount in the smallest currency unit
    currency: currency,
    receipt: receipt,
  };
  
  const order = await razorpay.orders.create(options);
  return order;
};

export const verifySignature = (orderId, paymentId, signature) => {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY.KEY_SECRET)
    .update(body.toString())
    .digest('hex');
    
  return expectedSignature === signature;
};

export const createRefund = async (paymentId, amount) => {
  const refund = await razorpay.payments.refund(paymentId, {
    amount: amount,
  });
  return refund;
};
