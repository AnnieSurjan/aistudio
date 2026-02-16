import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Paddle.js types
declare global {
  interface Window {
    Paddle?: {
      Initialize: (config: { token: string; environment?: string }) => void;
      Checkout: {
        open: (config: PaddleCheckoutConfig) => void;
      };
      Environment: {
        set: (env: string) => void;
      };
    };
  }
}

interface PaddleCheckoutConfig {
  items: Array<{ priceId: string; quantity?: number }>;
  customer?: { email?: string };
  customData?: Record<string, string>;
  settings?: {
    displayMode?: 'overlay' | 'inline';
    theme?: 'light' | 'dark';
    locale?: string;
    successUrl?: string;
    allowLogout?: boolean;
  };
}

interface PaddleConfig {
  clientToken: string;
  environment: string;
  prices: {
    Starter: string;
    Professional: string;
    Enterprise: string;
  };
}

interface PaymentGatewayProps {
  planName: string;
  price: string;
  onClose: () => void;
  onSuccess: () => void;
  userEmail?: string;
  userId?: string;
}

const BACKEND_URL = window.location.origin;

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  planName,
  price,
  onClose,
  onSuccess,
  userEmail,
  userId
}) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const paddleInitialized = useRef(false);
  const configRef = useRef<PaddleConfig | null>(null);

  // Load Paddle.js script
  const loadPaddleScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Already loaded
      if (window.Paddle) {
        resolve();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="paddle.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Paddle.js')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paddle.js'));
      document.head.appendChild(script);
    });
  }, []);

  // Fetch Paddle config from backend
  const fetchConfig = useCallback(async (): Promise<PaddleConfig> => {
    const response = await fetch(`${BACKEND_URL}/api/paddle/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch Paddle configuration');
    }
    return response.json();
  }, []);

  // Initialize Paddle and open checkout
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Step 1: Fetch config from backend
        const config = await fetchConfig();
        configRef.current = config;

        if (cancelled) return;

        if (!config.clientToken || config.clientToken === 'your_paddle_client_token_here') {
          throw new Error(
            'Paddle is not configured. Please set PADDLE_CLIENT_TOKEN in your server environment variables.'
          );
        }

        const priceId = config.prices[planName as keyof typeof config.prices];
        if (!priceId || priceId.startsWith('pri_') && priceId.includes('monthly') && !priceId.startsWith('pri_0')) {
          // Price IDs like pri_starter_monthly are placeholders
          // Real Paddle price IDs look like pri_01h... (with actual UUIDs)
        }

        // Step 2: Load Paddle.js
        await loadPaddleScript();

        if (cancelled) return;

        // Step 3: Initialize Paddle (only once)
        if (!paddleInitialized.current && window.Paddle) {
          window.Paddle.Initialize({
            token: config.clientToken,
            environment: config.environment === 'sandbox' ? 'sandbox' : undefined,
          });
          paddleInitialized.current = true;
        }

        if (cancelled) return;
        setStatus('ready');

        // Step 4: Open Paddle Checkout overlay
        if (window.Paddle) {
          window.Paddle.Checkout.open({
            items: [{ priceId, quantity: 1 }],
            customer: userEmail ? { email: userEmail } : undefined,
            customData: userId ? { user_id: userId } : undefined,
            settings: {
              displayMode: 'overlay',
              theme: 'light',
              allowLogout: !userEmail,
            },
          });
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[PaymentGateway] Initialization error:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Failed to initialize payment');
        setStatus('error');
      }
    };

    init();

    // Listen for Paddle checkout events
    const handlePaddleEvent = (event: MessageEvent) => {
      if (event.data?.type === 'checkout.completed' || event.data?.event === 'checkout.completed') {
        setStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
      if (event.data?.type === 'checkout.closed' || event.data?.event === 'checkout.closed') {
        if (status !== 'success') {
          onClose();
        }
      }
    };

    window.addEventListener('message', handlePaddleEvent);

    return () => {
      cancelled = true;
      window.removeEventListener('message', handlePaddleEvent);
    };
  }, [planName, userEmail, userId, fetchConfig, loadPaddleScript, onSuccess, onClose]);

  // Paddle fires events on the eventCallback, but we also listen for checkout.completed
  // via the Paddle event system. When checkout completes, Paddle sends a webhook to the backend.

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-50"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          {/* Loading state - while Paddle.js loads */}
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-slate-800">Loading Checkout</h3>
              <p className="text-sm text-slate-500 mt-2">
                Preparing {planName} Plan (${price}/mo)...
              </p>
            </div>
          )}

          {/* Ready state - Paddle overlay is open on top */}
          {status === 'ready' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Paddle Checkout Open</h3>
              <p className="text-sm text-slate-500 mt-2 text-center">
                Complete your payment in the Paddle checkout overlay.
              </p>
              <p className="text-xs text-slate-400 mt-4">
                {planName} Plan - ${price}/month
              </p>
            </div>
          )}

          {/* Success state */}
          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Payment Successful!</h3>
              <p className="text-slate-600 mt-2 text-sm text-center max-w-xs">
                Your {planName} subscription has been activated. You'll receive a receipt from Paddle.
              </p>
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Checkout Unavailable</h3>
              <p className="text-slate-500 mt-2 text-sm text-center max-w-sm">
                {errorMessage}
              </p>
              <div className="mt-6 space-y-3 w-full">
                <button
                  onClick={() => {
                    setStatus('loading');
                    setErrorMessage('');
                    // Re-trigger by re-mounting (parent can handle this)
                    window.location.reload();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
