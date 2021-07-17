import AdvisorModel from './models/AdvisorModel';

const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });

test('init with fromData', async () => {
  console.snapshot('before sync', instance.toObject());
  console.snapshot('instance', await instance);
  console.snapshot('instance.id', instance.id);
  console.snapshot('instance.created_at', instance.created_at);
});

test('direct instance property getter', async () => {
  const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });
  console.snapshot('is_active (before)', instance.is_active);
  console.snapshot('is_active', await instance.is_active);
});

test('direct instance property getter', async () => {
  const instance = AdvisorModel.fromData({ id: 'PdOJWFBgNPUEMhX1JlsDm7zWy012' });
  console.snapshot('is_active (before)', instance.getByPath('is_active'));
  console.snapshot('is_active', await instance.getByPath('is_active'));
});

test('direct instance property subscription', async () => {
  console.log('running');
  const observer = instance.observe('is_active');
  const subs = observer.subscribe((val) => {
    console.snapshot('is_active', val);
  });
  await sleep(1000);
  instance.is_active = false;
  await instance.save();
  await sleep(1000);
  subs.unsubscribe();
  instance.is_active = true;
  await instance.save();
});

test('direct instance property setter', async () => {
  const is_active = await instance.is_active;
  // set value directly
  instance.is_active = !is_active;

  await instance.save();

  console.snapshot('is_active: (before)', is_active, await instance.is_active);

  instance.is_active = is_active;
  await instance.save();
  console.snapshot('is_active: (after)', await instance.is_active);
});

test('direct instance property setByPath', async () => {
  const is_active = await instance.is_active;
  await instance.setByPath('is_active', !is_active);
  await instance.save();

  console.snapshot('is_active: (before)', is_active, await instance.is_active);
  await instance.setByPath('is_active', is_active);
  await instance.save();
  console.snapshot('is_active: (after)', await instance.is_active);
});

test('direct instance method call', async () => {
  console.snapshot('getClass', instance.getClass());
});

test('direct instance method applyByPath', async () => {
  console.snapshot('getClass', await instance.applyByPath('getClass'));
});
