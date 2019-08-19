SELECT "dateLocal", amount, purpose, "isIncome", name
FROM "Payment" join "_AccountToPayment" on ("Payment"."id" = "_AccountToPayment"."B")
join "Account" on ("Account"."id" = "_AccountToPayment"."A")