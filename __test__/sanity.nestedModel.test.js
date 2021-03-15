import _ from 'lodash';
import AdvisorModel from './models/AdvisorModel';

const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });

test('indirect nested model property getter', async () => {
  const profile = await instance.profile;
  console.snapshot('profile', profile);
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


