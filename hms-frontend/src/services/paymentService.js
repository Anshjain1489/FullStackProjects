import api from './api';

// Helper to dynamically load the Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const paymentService = {
  // 1. Generate Razorpay Order
  createOrder: (billingId) => api.post(`/billing/${billingId}/payment-order`),

  // 2. Verify Razorpay Payment Signature
  verifyPayment: (payload) => api.post('/billing/payment-verify', payload),

  // 3. Initiate checkout workflow
  checkout: async (billingId, onSuccess, onFailure) => {
    try {
      // Step A: Load script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you offline?');
      }

      // Step B: Create Order on Backend
      const response = await paymentService.createOrder(billingId);
      const order = response.data.data;

      // Step C: Setup Razorpay Options
      const options = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: '🏥 Apex Hospital',
        description: `Payment for Invoice #${billingId}`,
        order_id: order.razorpayOrderId,
        handler: async (paymentResponse) => {
          try {
            // Step D: Verify payment signature
            const verifyPayload = {
              billingId: order.billingId,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            };
            const verifyRes = await paymentService.verifyPayment(verifyPayload);
            if (verifyRes.data.success) {
              onSuccess(verifyRes.data);
            } else {
              onFailure('Payment verification failed.');
            }
          } catch (err) {
            onFailure(err.response?.data?.message || 'Verification request failed.');
          }
        },
        prefill: {
          name: order.patientName || '',
          email: order.patientEmail || '',
          contact: order.patientPhone || '',
        },
        theme: {
          color: '#3b82f6', // Match our primary theme color
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        onFailure(response.error.description || 'Payment failed.');
      });
      rzp.open();

    } catch (err) {
      onFailure(err.message || err.response?.data?.message || 'Payment initiation failed.');
    }
  }
};
