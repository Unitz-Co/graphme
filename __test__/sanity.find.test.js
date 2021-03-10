const AdvisorModel = require('@uz/mod-models/AdvisorModel');


test('init with find gql string', async () => {
  const advisors = await AdvisorModel.find(`limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } `);

  const advisor = await advisors.getByPath('0');
  console.snapshot('advisor.0.profile.display_name', await advisor.getByPath('profile.display_name'));
  console.snapshot('advisor list', advisors);
  console.snapshot('advs', await advisors.getByPath('0.profile.display_name'));
  const transactions = await advisors.getByPath('0.transactions');

  await transactions.setArgs('limit: 2').sync();
  console.snapshot('transactionstransactions', transactions.length);

});


test('init with find gql object', async () => {
  const advisors = await AdvisorModel
    .find(
      { limit: 5, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } }},
      ({ node }) => node.merge(`transactions { id }`),
    );

  const advisor = await advisors.getByPath('0');
  console.snapshot('advisor.0.profile.display_name', await advisor.getByPath('profile.display_name'));
  console.snapshot('advisor list', advisors);
  console.snapshot('advs', await advisors.getByPath('0.profile.display_name'));
  const transactions = await advisors.getByPath('0.transactions');

  await transactions.setArgs('limit: 2').sync();
  console.snapshot('transactions.length', transactions.length);

});


