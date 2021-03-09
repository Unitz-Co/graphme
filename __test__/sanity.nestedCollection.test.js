const AdvisorModel = require('@uz/mod-models/AdvisorModel');
const _ = require('lodash');

const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });

// test('nested collection getter', async () => {
//   const transactions = await instance.transactions;
//   console.log('transactions', transactions);
// });

// test('nested collection getter', async () => {
//   const transactions = await instance.transactions;
//   await transactions.setArgs('limit: 2').sync();
//   console.log('transactions', transactions);

//   await transactions.setArgs('limit: 2, order_by: {advisor_id: asc}').sync();
//   console.log('transactions', transactions);

//   // await transactions.setArgs({ limit: 2, where: {id: { _in: ["123"] } } }).sync();
//   // console.log('transactions', transactions);

// });

// test('nested collection getter', async () => {
//   const instances = await AdvisorModel.find({ where: {id: { _eq: 'PdOJWFBgNPUEMhX1JlsDm7zWy012'}} }, `
//     id
//     created_at
//     profile {
//       id
//       display_name
//     }
//     transactions(limit: 2, order_by: {advisor_id: asc}) {
//       id
//       advisor_id
//       user_id
//       session_id
//     }
//   `);
//   console.log('instances', instances);
//   const instance = _.first(instances);
//   // const instnace = instances.getByPath('0');

//   // support?
//   // instance.with('transactions').setArgs('limit: 2');
//    @ALTER: another option to set nested node args
//   instance.setArgs(['transactions', 'limit: 2']);
//   instance.updateArgs(['transactions', 'limit: 2']);


//   const transactions = await instance.transactions;
//   await transactions.setArgs('limit: 2').sync();
//   console.log('transactions', transactions);

//   await transactions.setArgs('limit: 2, order_by: {advisor_id: asc}').sync();
//   console.log('transactions', transactions);

//   await transactions.setArgs({ limit: 2, where: {id: { _in: ["123"] } } }).sync();
//   console.log('transactions', transactions);

// });

// test('nested collection index access', async () => {
//   const transactions = await instance.transactions;
//   console.log('transactions', transactions[0]);
//   console.log('advisor_id', transactions[0].advisor_id);
//   console.log('user_id', await transactions[0].user_id);
//   console.log('session_id', await transactions[0].getByPath('session_id'));
// });




// test('nested collection mutations', async () => {
//   const transactions = await instance.transactions;

//   const firstTran = _.first(transactions);
//   const user_id = await firstTran.user_id;
//   transactions.push({
//     user_id,
//     session_id: 'session_1',
//   });

//   transactions.push({
//     user_id,
//     session_id: 'session_1',
//   });

//   transactions.push({
//     user_id,
//     session_id: 'session_1',
//   });

//   transactions.push({
//     user_id,
//     session_id: 'session_last',
//   });

//   await instance.applyByPath('transactions.push', {
//     user_id,
//     session_id: 'session_last',
//   });

//   await transactions.save();

//   console.log('len', await transactions, transactions.length);

//   const lastTran = _.last(transactions);
//   console.log('lastTran', await lastTran.session_id);


//   const removedTrans = transactions.splice(10, 1000);

//   console.log('removedTrans', removedTrans);

//   await Promise.all(removedTrans.map(item => item.delete()));

// });


// test('indirect nested model property getter', async () => {
//   const profile = await instance.transactions;
//   console.log('profile.display_name (indirect)', await profile.display_name);
// });

// test('direct nested instance property getter', async () => {
//   console.log('profile.display_name (direct)', await instance.getByPath('profile.display_name'));
// });

// test('direct nested model property setter', async () => {
//   const profile = await instance.profile;
//   const oldName = await profile.display_name;

//   console.log('profile.display_name: (before)', oldName);
//   const newName = `newVal_${Date.now()}`;

//   profile.display_name = newName;
//   await profile.save();

//   console.log('profile.display_name: (change)', newName, await instance.getByPath('profile.display_name'));
//   profile.display_name = oldName;
//   await profile.save();

//   console.log('profile.display_name: (after)', await instance.getByPath('profile.display_name'));
// });


// test('direct nested model property setByPath', async () => {
//   const oldName = await instance.getByPath('profile.display_name');
//   console.log('profile.display_name: (before)', oldName);
//   const newName = `newVal_${Date.now()}`;

//   await instance.setByPath('profile.display_name', newName);
//   await instance.applyByPath('profile.save');

//   console.log('profile.display_name: (change)', newName, await instance.getByPath('profile.display_name'));
//   await instance.setByPath('profile.display_name', oldName);
//   await instance.applyByPath('profile.save');

//   console.log('profile.display_name: (after)', await instance.getByPath('profile.display_name'));
// });

// test('direct nested model method call', async () => {
//   const profile = await instance.profile;
//   console.log('getClass', profile.getClass());
// });

// test('direct nested model method applyByPath', async () => {
//   console.log('getClass', await instance.applyByPath('profile.getClass'));
// });


