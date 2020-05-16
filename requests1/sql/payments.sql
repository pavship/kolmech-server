SELECT "dateLocal", amount, purpose, P."isIncome", Ac.name, A."rusName", A."isIncome", A."isLoan"
FROM "prisma-mirhosting$prod"."Payment" as P
join "prisma-mirhosting$prod"."_AccountToPayment" as AcP on (P."id" = AcP."B")
join "prisma-mirhosting$prod"."Account" as Ac on (Ac."id" = AcP."A")
join "prisma-mirhosting$prod"."_ArticleToPayment" as AP on (P."id" = AP."B")
join "prisma-mirhosting$prod"."Article" as A on (A."id" = AP."A")