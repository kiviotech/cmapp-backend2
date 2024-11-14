// 'use strict';

// /**
//  * order controller
//  */

// const { createCoreController } = require('@strapi/strapi').factories;

// module.exports = createCoreController('api::order.order');

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const Razorpay = require('razorpay'); // Import Razorpay

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
  async create(ctx) {
    // Log the incoming request body
    console.log('Received data:', ctx.request.body);

    const { totalAmount, currency = 'INR' } = ctx.request.body; // Get total amount and currency from the request body

    // Ensure totalAmount is provided
    if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
      return ctx.badRequest('Invalid or missing totalAmount');
    }

    // Initialize Razorpay instance with your key and secret
    const razorpay = new Razorpay({
      key_id: 'rzp_test_X9YfY2bGPwua8A', // Your Razorpay key
      key_secret: 'your_razorpay_key_secret', // Your Razorpay secret
    });

    try {
      // Create a Razorpay order
      const options = {
        amount: totalAmount * 100, // Total amount in paisa (1 INR = 100 paisa)
        currency: currency,
        receipt: `order_rcptid_${Math.floor(Math.random() * 1000)}`, // Unique receipt ID
      };

      const order = await razorpay.orders.create(options);

      // Log the Razorpay order for debugging
      console.log('Razorpay Order:', order);

      // Return the Razorpay order ID to the frontend
      return ctx.send({
        orderId: order.id,
        amount: totalAmount,
        currency: currency,
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      return ctx.badRequest('Failed to create Razorpay order');
    }
  },
}));



// const { createCoreController } = require('@strapi/strapi').factories;
// const razorpayService = require('../services/razorpay');

// module.exports = createCoreController('api::order.order', ({ strapi }) => ({
//   async create(ctx) {
//     // First, create the order detail
//     const { data, meta } = await super.create(ctx);
    
//     // Then, create a Razorpay order
//     const razorpayOrder = await razorpayService.createRazorpayOrder(data.attributes.total);
    
//     // Update the order detail with the Razorpay order ID
//     const updatedEntity = await strapi.entityService.update('api::order.order', data.id, {
//       data: {
//         razorpayOrderId: razorpayOrder.id
//       }
//     });

//     return { data: updatedEntity, meta };
//   },

//   async updatePayment(ctx) {
//     const { id } = ctx.params;
//     const { razorpayPaymentId, razorpaySignature } = ctx.request.body;

//     const entity = await strapi.entityService.findOne('api::order.order', id);

//     if (!entity) {
//       return ctx.throw(404, 'Order not found');
//     }

//     const isValid = razorpayService.verifyRazorpayPayment(
//       entity.razorpayOrderId,
//       razorpayPaymentId,
//       razorpaySignature
//     );

//     if (!isValid) {
//       return ctx.throw(400, 'Invalid payment');
//     }

//     const updatedEntity = await strapi.entityService.update('api::order.order', id, {
//       data: {
//         razorpayPaymentId,
//         razorpaySignature,
//       }
//     });

//     return this.transformResponse(updatedEntity);
//   },
// }));
