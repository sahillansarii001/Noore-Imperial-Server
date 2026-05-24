import { env } from '../config/env.js';

let shiprocketToken = null;
let tokenExpiry = null;

export const authenticateShiprocket = async () => {
  try {
    if (shiprocketToken && tokenExpiry && new Date() < tokenExpiry) {
      return shiprocketToken;
    }

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: env.SHIPROCKET?.EMAIL || 'dummy@example.com',
        password: env.SHIPROCKET?.PASSWORD || 'dummy'
      })
    });
    
    const data = await response.json();
    
    if (data.token) {
      shiprocketToken = data.token;
      tokenExpiry = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 24h
      return shiprocketToken;
    }
    
    // Fallback for dummy implementation if API keys not provided
    shiprocketToken = 'dummy_token';
    tokenExpiry = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    return shiprocketToken;
  } catch (err) {
    console.error('Shiprocket auth error:', err);
    return 'dummy_token';
  }
};

export const createShipment = async (orderData) => {
  try {
    const token = await authenticateShiprocket();
    
    // Dummy response since we don't have real valid orders
    return {
      shipment_id: `ship_${Math.floor(Math.random() * 1000000)}`,
      awb_code: `awb_${Math.floor(Math.random() * 100000000)}`,
      courier_name: 'Delhivery'
    };
  } catch (err) {
    console.error('Shiprocket create shipment error:', err);
    throw new Error('Failed to create shipment');
  }
};

export const trackShipment = async (awb) => {
  try {
    const token = await authenticateShiprocket();
    
    // Dummy response
    return {
      awb_code: awb,
      current_status: 'In Transit',
      expected_delivery: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)
    };
  } catch (err) {
    console.error('Shiprocket track error:', err);
    throw new Error('Failed to track shipment');
  }
};
