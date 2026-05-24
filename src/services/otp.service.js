const otpStore = new Map();

export const generateOTP = (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(email, { otp, expiresAt });
  return otp;
};

export const verifyOTP = (email, otpToVerify) => {
  const record = otpStore.get(email);
  if (!record) return false;

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return false;
  }

  if (record.otp === otpToVerify) {
    otpStore.delete(email);
    return true;
  }

  return false;
};
