const Stripe = require('stripe');
const { recordRevenue, getRevenueData } = require('./database');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Revenue sharing configuration
 * 70% Web Owner, 15% Rapid Tech, 15% Store commission
 */
const REVENUE_SPLIT = {
  WEB_OWNER: 0.70,
  RAPID_TECH: 0.15,
  STORE_COMMISSION: 0.15
};

/**
 * Create Stripe customer
 */
const createCustomer = async (userDetails) => {
  try {
    const customer = await stripe.customers.create({
      email: userDetails.email,
      name: userDetails.name,
      metadata: {
        userId: userDetails.userId,
        userType: userDetails.userType || 'developer'
      }
    });

    return {
      success: true,
      customerId: customer.id,
      customer
    };
  } catch (error) {
    console.error('Create Customer Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create payment intent for app purchase
 */
const createPaymentIntent = async (options) => {
  const {
    amount, // in cents
    currency = 'usd',
    customerId,
    appId,
    description,
    metadata = {}
  } = options;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      description,
      metadata: {
        appId,
        type: 'app_purchase',
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Create Payment Intent Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create subscription for recurring payments
 */
const createSubscription = async (options) => {
  const {
    customerId,
    priceId,
    appId,
    metadata = {}
  } = options;

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        appId,
        type: 'app_subscription',
        ...metadata
      },
      expand: ['latest_invoice.payment_intent']
    });

    return {
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscription
    };
  } catch (error) {
    console.error('Create Subscription Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process revenue sharing after successful payment
 */
const processRevenueSharing = async (paymentData) => {
  const {
    amount, // total amount in cents
    appId,
    ownerId,
    paymentIntentId,
    subscriptionId,
    currency = 'usd'
  } = paymentData;

  try {
    // Calculate revenue splits
    const totalAmount = amount / 100; // Convert to dollars
    const webOwnerShare = totalAmount * REVENUE_SPLIT.WEB_OWNER;
    const rapidTechShare = totalAmount * REVENUE_SPLIT.RAPID_TECH;
    const storeCommission = totalAmount * REVENUE_SPLIT.STORE_COMMISSION;

    // Record revenue transaction
    const revenueRecord = {
      appId,
      ownerId,
      paymentIntentId,
      subscriptionId,
      totalAmount,
      webOwnerShare,
      rapidTechShare,
      storeCommission,
      currency,
      status: 'completed',
      processedAt: new Date().toISOString()
    };

    // Save to database
    await recordRevenue(revenueRecord);

    // Create transfers (in production, you'd create actual Stripe transfers)
    const transfers = {
      webOwner: {
        amount: Math.round(webOwnerShare * 100), // Convert back to cents
        recipient: ownerId,
        description: `Revenue share for app ${appId}`,
        metadata: {
          appId,
          shareType: 'web_owner',
          percentage: REVENUE_SPLIT.WEB_OWNER * 100
        }
      },
      rapidTech: {
        amount: Math.round(rapidTechShare * 100),
        recipient: 'rapid_tech_account',
        description: `Platform fee for app ${appId}`,
        metadata: {
          appId,
          shareType: 'platform_fee',
          percentage: REVENUE_SPLIT.RAPID_TECH * 100
        }
      }
    };

    return {
      success: true,
      revenueRecord,
      transfers,
      splits: {
        webOwner: webOwnerShare,
        rapidTech: rapidTechShare,
        storeCommission
      }
    };

  } catch (error) {
    console.error('Revenue Sharing Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle webhook events from Stripe
 */
const handleWebhook = async (event) => {
  try {
    switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
        
      if (paymentIntent.metadata.type === 'app_purchase') {
        await processRevenueSharing({
          amount: paymentIntent.amount,
          appId: paymentIntent.metadata.appId,
          ownerId: paymentIntent.metadata.ownerId,
          paymentIntentId: paymentIntent.id,
          currency: paymentIntent.currency
        });
      }
      break;

    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
        
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          
        if (subscription.metadata.type === 'app_subscription') {
          await processRevenueSharing({
            amount: invoice.amount_paid,
            appId: subscription.metadata.appId,
            ownerId: subscription.metadata.ownerId,
            subscriptionId: subscription.id,
            paymentIntentId: invoice.payment_intent,
            currency: invoice.currency
          });
        }
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('Subscription cancelled:', deletedSubscription.id);
      // Handle subscription cancellation
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create product and pricing for app
 */
const createAppProduct = async (appDetails) => {
  const {
    appId,
    appName,
    description,
    pricing
  } = appDetails;

  try {
    // Create product
    const product = await stripe.products.create({
      name: appName,
      description,
      metadata: {
        appId,
        type: 'mobile_app'
      }
    });

    const prices = [];

    // Create pricing options
    for (const priceOption of pricing) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: priceOption.amount, // in cents
        currency: priceOption.currency || 'usd',
        recurring: priceOption.recurring || null,
        metadata: {
          appId,
          priceType: priceOption.type || 'one_time'
        }
      });
      
      prices.push(price);
    }

    return {
      success: true,
      product,
      prices
    };
  } catch (error) {
    console.error('Create App Product Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get revenue analytics for dashboard
 */
const getRevenueAnalytics = async (options) => {
  const {
    ownerId,
    appId,
    startDate,
    endDate,
    groupBy = 'day'
  } = options;

  try {
    // Get revenue data from database
    const revenueData = await getRevenueData({
      ownerId,
      appId,
      startDate,
      endDate
    });

    // Calculate analytics
    const analytics = {
      totalRevenue: 0,
      webOwnerRevenue: 0,
      rapidTechRevenue: 0,
      storeCommission: 0,
      transactionCount: revenueData.length,
      averageTransaction: 0,
      revenueByPeriod: {},
      topApps: [],
      recentTransactions: revenueData.slice(0, 10)
    };

    // Process revenue data
    revenueData.forEach(transaction => {
      analytics.totalRevenue += transaction.totalAmount;
      analytics.webOwnerRevenue += transaction.webOwnerShare;
      analytics.rapidTechRevenue += transaction.rapidTechShare;
      analytics.storeCommission += transaction.storeCommission;

      // Group by period
      const period = new Date(transaction.processedAt).toISOString().split('T')[0];
      if (!analytics.revenueByPeriod[period]) {
        analytics.revenueByPeriod[period] = 0;
      }
      analytics.revenueByPeriod[period] += transaction.totalAmount;
    });

    analytics.averageTransaction = analytics.transactionCount > 0 
      ? analytics.totalRevenue / analytics.transactionCount 
      : 0;

    return {
      success: true,
      analytics
    };
  } catch (error) {
    console.error('Revenue Analytics Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process refund
 */
const processRefund = async (options) => {
  const {
    paymentIntentId,
    amount, // optional, for partial refunds
    reason = 'requested_by_customer'
  } = options;

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason,
      metadata: {
        processedAt: new Date().toISOString()
      }
    });

    return {
      success: true,
      refund
    };
  } catch (error) {
    console.error('Refund Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get payment methods for customer
 */
const getPaymentMethods = async (customerId) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card'
    });

    return {
      success: true,
      paymentMethods: paymentMethods.data
    };
  } catch (error) {
    console.error('Get Payment Methods Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create setup intent for saving payment method
 */
const createSetupIntent = async (customerId) => {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    return {
      success: true,
      clientSecret: setupIntent.client_secret
    };
  } catch (error) {
    console.error('Create Setup Intent Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createCustomer,
  createPaymentIntent,
  createSubscription,
  processRevenueSharing,
  handleWebhook,
  createAppProduct,
  getRevenueAnalytics,
  processRefund,
  getPaymentMethods,
  createSetupIntent,
  REVENUE_SPLIT
};