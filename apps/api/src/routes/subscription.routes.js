import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';

import QRCode from 'qrcode';

const router = Router();

router.get('/qr', authenticate, async (req, res, next) => {
  try {
    const { plan } = req.query;
    if (!['weekly', 'monthly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid subscription plan.' });
    }
    const amount = plan === 'weekly' ? '120.00' : '400.00';
    const planName = plan === 'weekly' ? 'Weekly Pro' : 'Monthly Pro';
    
    const upiLink = `upi://pay?pa=tharaneshtharanesh431@okhdfcbank&pn=Tharaneesh&am=${amount}&cu=INR&tn=Cloploy%20${encodeURIComponent(planName)}`;
    const qrDataUrl = await QRCode.toDataURL(upiLink, {
      margin: 2,
      width: 250
    });
    
    res.json({ qrCode: qrDataUrl });
  } catch (error) {
    next(error);
  }
});

router.post('/subscribe', authenticate, async (req, res, next) => {
  try {
    const { plan, paymentReference } = req.body;
    if (!['weekly', 'monthly'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid subscription plan.' });
    }
    if (!paymentReference) {
      return res.status(400).json({ message: 'Payment reference is required.' });
    }
    if (!/^\d{12}$/.test(paymentReference)) {
      return res.status(400).json({ message: 'Invalid reference code. Must be a 12-digit numeric transaction ID.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const daysToAdd = plan === 'weekly' ? 7 : 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    user.subscription = {
      status: 'active',
      plan,
      expiresAt,
      paymentReference
    };

    await user.save();
    res.json({ message: 'Subscription activated successfully!', user });
  } catch (error) {
    next(error);
  }
});

router.get('/status', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ subscription: user.subscription || { status: 'free', plan: 'free' } });
  } catch (error) {
    next(error);
  }
});

export default router;
