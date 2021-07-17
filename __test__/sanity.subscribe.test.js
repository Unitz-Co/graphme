import _ from 'lodash';
import AdvisorModel from './models/AdvisorModel';

const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });

test('model props subscription 1', async () => {
  const advisors = await AdvisorModel.find('limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } ');

  const advisor = await advisors.getByPath('0');

  const subscription = advisor.observe('is_active');

  let count = 0;
  const obs = subscription.subscribe((is_active) => {
    console.snapshot('subscribe.is_active', count++, is_active);
  });
  await sleep(2000);

  const changeIsActive = async () => {
    // const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });
    const instance = advisor;
    const is_active = await instance.is_active;
    // set value directly
    instance.is_active = !is_active;

    await sleep(2000);
    // await instance.save();

    instance.is_active = is_active;
    await sleep(2000);
    // await instance.save();
  };

  await changeIsActive();

  await sleep(1000);

  console.snapshot('unsubscribe changes');
  obs.unsubscribe();

  await changeIsActive();
});

test('subscribe without field prop', async () => {
  const advisors = await AdvisorModel.find('limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } ');

  const advisor = _.first(advisors);

  const profile = await advisor.profile;

  const subscription = profile.observe();

  let count = 0;
  const obs = subscription.subscribe((data) => {
    console.snapshot('subscribe.profile', count++, data);
  });

  await sleep(1000);

  const display_name = await instance.getByPath('profile.display_name');
  await instance.setByPath('profile.display_name', 'new_displayName');
  await instance.applyByPath('profile.save');

  console.snapshot('instance.profile.display_name', await instance.getByPath('profile.display_name'));

  await sleep(1000);

  console.snapshot('unsubscribe changes');
  obs.unsubscribe();
  await instance.setByPath('profile.display_name', display_name);
});

test('subscribe with field prop', async () => {
  const advisors = await AdvisorModel.find('limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } ');

  const advisor = _.first(advisors);

  const profile = await advisor.profile;

  const subscription = profile.observe('display_name');

  let count = 0;
  const obs = subscription.subscribe((data) => {
    console.snapshot('subscribe.profile.display_name', count++, data);
  });

  await sleep(1000);

  const display_name = await instance.getByPath('profile.display_name');
  await instance.setByPath('profile.display_name', 'new_displayName');
  await instance.applyByPath('profile.save');

  console.snapshot('instance.profile.display_name', await instance.getByPath('profile.display_name'));

  await sleep(1000);

  console.snapshot('unsubscribe changes');
  obs.unsubscribe();
  await instance.setByPath('profile.display_name', display_name);
});

test('subscribe to field of nested model', async () => {
  const advisors = await AdvisorModel.find('limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } ');

  const advisor = _.first(advisors);

  const subscription = await advisor.observe('profile.display_name');

  let count = 0;
  const obs = subscription.subscribe((data) => {
    console.snapshot('subscribe.profile.display_name', count++, data);
  });

  await sleep(1000);

  const display_name = await instance.getByPath('profile.display_name');
  await instance.setByPath('profile.display_name', 'new_displayName');
  await instance.applyByPath('profile.save');

  console.snapshot('instance.profile.display_name', await instance.getByPath('profile.display_name'));

  await sleep(1000);

  console.snapshot('unsubscribe changes');
  obs.unsubscribe();
  await instance.setByPath('profile.display_name', display_name);
});

test('subscribe to collection', async () => {
  const advisors = await AdvisorModel.find('limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } ');

  const advisor = _.first(advisors);

  advisor.setSelections('transactions { id }');

  advisor.setArgs([['transactions', 'limit: 5, order_by: {created_at: desc}']]);

  const transactions = await advisor.transactions;

  const subscription = transactions.observe();

  let count = 0;
  const obs = subscription.subscribe((data) => {
    console.snapshot('subscribe.transactions', count++, _.map(data, 'id'));
  });

  await sleep(1000);

  // const user_id = await instance.getByPath('transactions.0.user_id');
  const user_id = '9KGhxtVGdPMD4VRIuZw25Iwo8x33';
  console.snapshot('user_iduser_iduser_id', user_id);

  const iTrans = await instance.transactions;
  iTrans.push({
    user_id,
    session_id: 'new_session',
  });

  await iTrans.save();

  await sleep(1000);

  console.snapshot('unsubscribe changes');

  obs.unsubscribe();
});

test('nested model props subscription', async () => {
  const advisors = await AdvisorModel.find('limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } ');

  const advisor = _.first(advisors);

  advisor.setSelections('transactions { id }');

  advisor.setArgs([['transactions', 'limit: 5, order_by: {created_at: desc}']]);

  const subscription = advisor.observe('transactions');

  let count = 0;
  const obs = subscription.subscribe((data) => {
    console.snapshot('subscribe.transactions', count++, data);
  });

  // const user_id = await instance.getByPath('transactions.0.user_id');
  const user_id = '9KGhxtVGdPMD4VRIuZw25Iwo8x33';
  console.snapshot('user_iduser_iduser_id', user_id);

  await sleep(1000);

  const iTrans = await instance.transactions;

  iTrans.push({
    user_id,
    session_id: 'new_session',
  });

  await iTrans.save();

  await sleep(1000);

  console.snapshot('unsubscribe changes');

  obs.unsubscribe();
});

test('nested model props subscription', async () => {
  const advisors = await AdvisorModel.find('limit: 1, where: { id: { _eq: "PdOJWFBgNPUEMhX1JlsDm7zWy012" } } ');

  const advisor = _.first(advisors);

  advisor.setSelections('transactions { id }');

  // advisor.setArgs([['transactions', 'limit: 5']])

  const transactions = await advisor.transactions;

  const subscription = transactions.observe('length');

  let count = 0;
  const obs = subscription.subscribe((data) => {
    console.snapshot('subscribe.transaction.length', count++, data);
  });

  const user_id = '9KGhxtVGdPMD4VRIuZw25Iwo8x33';
  // const user_id = await instance.getByPath('transactions.0.user_id');

  const iTrans = await instance.transactions;

  iTrans.push({
    user_id,
    session_id: 'new_session',
  });

  await iTrans.save();

  await sleep(1000);

  console.snapshot('unsubscribe changes');

  obs.unsubscribe();
});
