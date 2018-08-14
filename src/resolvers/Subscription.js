const Subscription = {
  enquirySubscription: {
    subscribe: (parent, args, ctx, info) => {
      return ctx.db.subscription.enquiry(
        null,
        info,
      )
    },
  },
}

module.exports = { Subscription }
