import _ from 'lodash';
import AdvisorModel from './models/AdvisorModel';

const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });

test('nested collection getter', async () => {
  const transactions = await instance.transactions;
  console.snapshot('transactions', transactions.toObject());
});

test('nested collection getter', async () => {
  const transactions = await instance.transactions;
  await transactions.setArgs('limit: 2').sync();
  console.snapshot('transactions', transactions);

  await transactions.setArgs('limit: 2, order_by: {advisor_id: asc}').sync();
  console.snapshot('transactions', transactions);

  // await transactions.setArgs({ limit: 2, where: {id: { _in: ["123"] } } }).sync();
  // console.snapshot('transactions', transactions);

});

test('nested collection getter from find', async () => {
  const instances = await AdvisorModel.find({ where: {id: { _eq: 'PdOJWFBgNPUEMhX1JlsDm7zWy012'}} }, `
    id
    created_at
    profile {
      id
      display_name
    }
    transactions(limit: 2, order_by: {advisor_id: asc}) {
      id
      advisor_id
      user_id
      session_id
    }
  `);
  console.snapshot('instances', instances);
  const instance = _.first(instances);
  // const instnace = instances.getByPath('0');

  await instance.transactions.setArgs('limit: 2').sync();


  const transactions = await instance.transactions;
  await transactions.setArgs('limit: 2').sync();
  console.snapshot('transactions', transactions);

  await transactions.setArgs('limit: 2, order_by: {advisor_id: asc}').sync();
  console.snapshot('transactions', transactions);

  // await transactions.setArgs({ limit: 2, where: {id: { _in: ["123"] } } }).sync();
  // console.snapshot('transactions', transactions);

});

test('nested collection index access', async () => {
  const transactions = await instance.transactions;
  console.snapshot('transactions', transactions[0]);
  console.snapshot('advisor_id', await transactions[0].advisor_id);
  console.snapshot('user_id', await transactions[0].user_id);
  console.snapshot('session_id', await transactions[0].getByPath('session_id'));
});


test('nested collection mutations', async () => {
  const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });
  const transactions = await instance.transactions;

  const firstTran = _.first(transactions);
  const user_id = await firstTran.user_id;
  transactions.push({
    user_id,
    session_id: 'session_1',
  });

  transactions.push({
    user_id,
    session_id: 'session_1',
  });

  transactions.push({
    user_id,
    session_id: 'session_1',
  });

  transactions.push({
    user_id,
    session_id: 'session_last',
  });

  await instance.applyByPath('transactions.push', {
    user_id,
    session_id: 'session_last',
  });

  await transactions.save();

  console.snapshot('len', await transactions, transactions.length);

  const lastTran = _.last(transactions);
  console.snapshot('lastTran', await lastTran.session_id);


  const removedTrans = transactions.splice(10, 1000);

  console.snapshot('removedTrans.len', removedTrans.len);

  await Promise.all(removedTrans.map(item => item.delete()));

});


test('indirect nested model property getter', async () => {
  const profile = await instance.transactions;
  console.snapshot('profile.display_name (indirect)', await profile.display_name);
});

test('direct nested instance property getter', async () => {
  console.snapshot('profile.display_name (direct)', await instance.getByPath('profile.display_name'));
});

test('direct nested model property setter', async () => {
  const profile = await instance.profile;
  const oldName = await profile.display_name;

  console.snapshot('profile.display_name: (before)', oldName);
  const newName = `newVal_newName`;

  profile.display_name = newName;
  await profile.save();

  console.snapshot('profile.display_name: (change)', newName, await instance.getByPath('profile.display_name'));
  profile.display_name = oldName;
  await profile.save();

  console.snapshot('profile.display_name: (after)', await instance.getByPath('profile.display_name'));
});


test('direct nested model property setByPath', async () => {
  const oldName = await instance.getByPath('profile.display_name');
  console.snapshot('profile.display_name: (before)', oldName);
  const newName = `newVal_newName`;

  await instance.setByPath('profile.display_name', newName);
  await instance.applyByPath('profile.save');

  console.snapshot('profile.display_name: (change)', newName, await instance.getByPath('profile.display_name'));
  await instance.setByPath('profile.display_name', oldName);
  await instance.applyByPath('profile.save');

  console.snapshot('profile.display_name: (after)', await instance.getByPath('profile.display_name'));
});

test('direct nested model method call', async () => {
  const profile = await instance.profile;
  console.snapshot('getClass', profile.getClass());
});

test('direct nested model method applyByPath', async () => {
  console.snapshot('getClass', await instance.applyByPath('profile.getClass'));
});


