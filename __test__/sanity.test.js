const AdvisorModel = require('@uz/mod-models/AdvisorModel');

const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });

// test('init with fromData', async () => {
//   console.log('before sync', instance);
//   console.log('instance', await instance);
// });

// test('direct instance property getter', async () => {
//   console.log('is_active (before)', instance.is_active);
//   console.log('is_active', await instance.is_active);
// });

// test('direct instance property getter', async () => {
//   console.log('is_active (before)', instance.getByPath('is_active'));
//   console.log('is_active', await instance.getByPath('is_active'));
// });


// test('direct instance property subscription', async () => {
//   const subscription = instance.subscribe('is_active');

//   subscription.subscribe(val => {
//     console.log('is_active', val);
//   })
// });

// test('direct instance property setter', async () => {
//   const is_active = await instance.is_active;
//   // set value directly
//   instance.is_active = !is_active;

//   await instance.save();

//   console.log('is_active: (before)', is_active, await instance.is_active);

//   instance.is_active = is_active;
//   await instance.save();
//   console.log('is_active: (after)', await instance.is_active);
// });

// test('direct instance property setByPath', async () => {
//   const is_active = await instance.is_active;
//   await instance.setByPath('is_active', !is_active);
//   await instance.save();

//   console.log('is_active: (before)', is_active, await instance.is_active);
//   await instance.setByPath('is_active', is_active);
//   await instance.save();
//   console.log('is_active: (after)', await instance.is_active);
// });

// test('direct instance method call', async () => {
//   console.log('getClass', instance.getClass())
// });

// test('direct instance method applyByPath', async () => {
//   console.log('getClass', await instance.applyByPath('getClass'));
// });




// const it = async () => {

  // const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });
  // const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });
  // const instance = AdvisorModel.fromData({ id: '1kmOwGBOKUALh1uRladPJE' });

  // console.log('instanceinstance', await instance.is_active);
  // const profile = await instance.profile;

  // const displayName = await instance.getByPath('profile.display_name');
  // console.log('displayNamedisplayName', displayName);

  // const profile = await instance.profile;
  // const id = await instance.getByPath('transactions.0.id');
  // const trans = await instance.getByPath('transactions');
  // const tran = await instance.getByPath('transactions.0');
  // const id = await instance.getByPath('transactions.0.session_id');
  // const tran = await instance.getByPath('transactions.0');
  // const trans = await instance.getByPath('transactions');

  // const tran = await trans.getByPath('0');

  // await tran.sync(['session_id']);
  // const session_id = await tran.session_id;
  // console.log('session_idsession_id', session_id);
  // const user_id = tran.user_id;
  // const user_id = tran.get('user_id');

  // const user_id = await instance.getByPath('transactions.1.user_id');

  // const size = await instance.getByPath('transactions.length');

  // const atran = await instance.getByPath(['transactions', size - 1]);
  // console.log('dmdmmdmd', size, await atran.session_id);
  // console.log('tran', await atran.delete());

  // const newTrac = await instance.applyByPath('transactions.add', {
  //   user_id,
  //   session_id: `session_${Date.now()}`,
  // });

  // // console.log('newTracnewTracnewTrac', newTrac.getContext().get('advisor').id);
  // await newTrac.save();
  // // const id = tran.id;
  // console.log('id', await newTrac.id);

  // console.log('asdmamsdmasdmasd', await instance.getByPath('transactions'))
  // await instance.applyByPath('profile.pingProfile', 'argxxxx', 'arg2');
  // const col = await instance.getByPath('transactions');
  // console.log('colcolcol', col.length);
  
  // const removed = col.splice(10, 50);
  // await Promise.all(removed.map(item => item.delete()));
  // await col.save();

  // console.log('asdmasdmasmd', col[0]);

  // col.setArgs(`limit: 2`);

  // await col.sync();

  // console.log('asdhasdhasdh', await col.getByPath('1.id'));
  // await col.sync();
  // console.log('colcol', col);
  // const removed = col.splice(2, 2);
  // console.log('removedremovedremoved', removed);
  // const res = await Promise.all(removed.map(item => item.delete()));
  // console.log('rererere', res);

  // console.log('colcolcolcol', newTran, await col.save());
  // console.log('currenetnetnet', await _.last(col).save());
  // console.log('dmdmd', await col[post].save());

  // profile.pingProfile();
  // profile.display_name = `xaxaxOhSao_${Date.now()}`;
  // await instance.setByPath('profile.display_name', `OhSao_${Date.now()}`);
  // await instance.applyByPath('profile.save');

  // console.log('gagagag', await instance.getByPath('profile.display_name'))
  // await profile.save();
  // console.log('idididiidid', profile, await profile.id);
  // console.log('dmasdmasdmasdmsa', await profile.display_name);
  // // console.log('dmasdmasdmasdmsa', await instance.profile.display_name);
  // console.log('getetetetet', instance.get())


  // let transactions

  // // const transactions = await instance.transactions.filter({ limit: 10 });
  // console.log('instance.transactions', instance.transactions)
  // instance.transactions.setArgs(`limit: 2`);

  // transactions = await instance.transactions;
  // console.log('transactionstransactions', _.isArray(transactions), transactions);

  // await Promise.all(transactions.map(async (transaction) => {
  //   console.log('transactiontransactiontransaction', transaction.id, await transaction.advisor_id);
  //   const display_name = await getAsync(transaction, 'advisor.profile.display_name');

  //   console.log('display_namedisplay_namedisplay_name', display_name);
  //   // const advisor = await transaction.advisor;
  //   // const profile = await advisor.profile;
  //   // console.log('advisor', profile);
  //   // console.log('transaction.advisor', await profile.display_name);
  // }))
  // transactions.map(item => {
  //   console.log('itemid', item.get('id'));
  // })


  // const tagg = await instance.getByPath('transactions_aggregate');
  // tagg.setArgs({ limit: 10 });
  // await tagg.sync();


  // const aggregate = await tagg.getByPath('aggregate');
  // // aggregate.setArgs({ count: { distinct: true } });
  // aggregate.setArgs([
  //   ['count', `distinct: true, columns: session_id `],
  //   // ['count', session_id],
  // ]);
  // await aggregate.sync();
  // console.log('amsmasmd', aggregate);

  // console.log('tagg', tagg);
  // console.log('count', await tagg.getByPath('aggregate.count'));
  // // console.log('tagg', await tagg.getByPath('nodes.0.session_id'));
  // // const agg = await instance.getByPath('transactions_aggregate.aggregate');
  // // const count = await instance.getByPath('transactions_aggregate.aggregate.count');
  // // console.log('countcountcount', count, agg);

  // // const nodes = await instance.getByPath('transactions_aggregate.nodes');
  // // console.log('nodessss', nodes);

  // // console.log('nodesnodesnodes', nodes[0]);

  // const instAgg = TransactionAggregateModel.fromData({});
  // console.log('instAgg', await instAgg.getByPath('aggregate.count'));

  // const advisors = await AdvisorModel.find(`limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } `);
  // const advisors = await AdvisorModel
  //   .find(
  //     { limit: 5, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } }},
  //     ({ node }) => node.merge(`transactions { id }`),
  //   );

  // const advisor = await advisors.getByPath('0');
  // console.log('advisoradvisoradvisor', await advisor.getByPath('profile.display_name'));
  // // console.log('advisor list', advisors);
  // console.log('advs', await advisors.getByPath('0.profile.display_name'));
  // const transactions = await advisors.getByPath('0.transactions');

  // await transactions.setArgs('limit: 2').sync();
  // console.log('transactionstransactions', transactions.length);
// };

