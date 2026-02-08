import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const stripeWebhooks = async (request, response) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const sig = request.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log("Webhook received:", event.type);
    } catch (error) {
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {

        switch (event.type) {

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;

                // get checkout session from payment_intent
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                });

                const session = sessionList.data[0];
                const { transactionId, appId } = session.metadata ;

                if (appId === "quickgpt") {

                    const transaction = await Transaction.findOne({
                        _id: transactionId,
                        isPaid: false
                    });

                    // Update user credits
                    await User.updateOne(
                        { _id: transaction.userId },
                        { $inc: { credits: transaction.credits } }
                    );

                    // Update credits Payment status
                    transaction.isPaid = true;
                    await transaction.save();

                } else {
                    return response.json({
                        received: true,
                        message: "Ignored event: Invalid app"
                    });
                }

                break;
            }

            default:
                console.log("Unhandled event type:", event.type);
                break;
        }

        response.json({ received: true });

    } catch (error) {
        console.error("Error processing webhook:", error);
        response.status(500).send("Internal Server Error");
    }
};
