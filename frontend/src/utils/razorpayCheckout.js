/**
 * Utility to load Razorpay Checkout SDK dynamically and process Test Mode payments
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const FALLBACK_KEY_ID = 'rzp_test_TPhnZafPBvwuwk';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initiates Razorpay Payment Flow:
 * 1. Creates order via backend
 * 2. Opens Razorpay Checkout modal
 * 3. Verifies signature on backend
 * 4. Triggers onSuccess or onFailure callback
 */
export const openRazorpayCheckout = async ({
  amount,
  planName = 'VaultCare Payment',
  description = 'Medical Consultation / Plan Subscription',
  prefill = {},
  notes = {},
  onSuccess = () => {},
  onFailure = () => {},
  onCancel = () => {}
}) => {
  try {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      const err = new Error('Razorpay SDK failed to load. Please check your internet connection.');
      if (onFailure) onFailure(err);
      return;
    }

    // 1. Create Order on Backend
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    const orderRes = await fetch(`${backendUrl}/api/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: 'INR',
        receipt: 'rcpt_' + Date.now(),
        notes: { planName, ...notes }
      })
    });

    const orderData = await orderRes.json();

    if (!orderData || !orderData.id) {
      throw new Error(orderData?.error || 'Failed to create payment order from server.');
    }

    const razorpayKey = orderData.keyId || FALLBACK_KEY_ID;

    // 2. Configure Razorpay Checkout Options
    const options = {
      key: razorpayKey,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'VaultCare AI',
      description: description,
      order_id: orderData.id,
      handler: async function (response) {
        try {
          // 3. Secure Server-Side Signature Verification
          const verifyRes = await fetch(`${backendUrl}/api/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyData && (verifyData.verified === true || verifyData.success === true)) {
            if (onSuccess) {
              onSuccess({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: amount,
                planName: planName,
                verifyData
              });
            }
          } else {
            const verifyErr = new Error(verifyData?.error || 'Razorpay payment signature verification failed on server.');
            if (onFailure) onFailure(verifyErr);
          }
        } catch (vErr) {
          if (onFailure) onFailure(vErr);
        }
      },
      modal: {
        ondismiss: function () {
          if (onCancel) onCancel();
        }
      },
      prefill: {
        name: prefill.name || 'Patient',
        email: prefill.email || 'patient@vaultcare.ai',
        contact: prefill.contact || '9999999999'
      },
      theme: {
        color: '#1A1A1A'
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (resp) {
        if (onFailure) onFailure(new Error(resp.error?.description || 'Razorpay payment failed.'));
    });
    rzp.open();
  } catch (err) {
    if (onFailure) onFailure(err);
 }
};
