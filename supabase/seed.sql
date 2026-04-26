insert into public.admin_accounts (
  name,
  email,
  role,
  status,
  must_change_password,
  password_hash,
  created_by_label
)
values
  (
    'RouteGrid Owner',
    'admin@routegrid.local',
    'owner',
    'active',
    false,
    'scrypt:33c0727e50dd98a2da727a1fa3b7fc31:0e9b49b79912f93db67868ac5ca0e73efbb3272b65afb76a23ae97d6b490f8b8ccf91155903ce9d1093b6d9ce7428395ca54e7bc29c8df4060760205777028df',
    'seed'
  )
on conflict (email) do update
set
  name = excluded.name,
  role = excluded.role,
  status = excluded.status,
  must_change_password = excluded.must_change_password,
  password_hash = excluded.password_hash,
  created_by_label = excluded.created_by_label;

insert into public.client_accounts (
  contact_name,
  business_name,
  email,
  phone,
  business_address,
  status,
  must_change_password,
  password_hash
)
values
  (
    'Nadia Ramdial',
    'Niko Auto Parts',
    'ops@nikoautoparts.com',
    '(868) 622-9087',
    '34 Wrightson Road, Port of Spain',
    'active',
    false,
    'scrypt:01010101010101010101010101010101:dad0e57b8b21e62e2bc0c421a2e30f0215a33cc9195ab74c960e7591bbf0e56b2a6f85f9dd87518812724c9769313d1507a2629b72147b323a06d9cda83fcd3f'
  ),
  (
    'Keon Baptiste',
    'Harbor Electronics',
    'warehouse@harborelectronics.co',
    '(868) 760-4041',
    '58 Independence Square, Port of Spain',
    'active',
    false,
    'scrypt:01010101010101010101010101010101:dad0e57b8b21e62e2bc0c421a2e30f0215a33cc9195ab74c960e7591bbf0e56b2a6f85f9dd87518812724c9769313d1507a2629b72147b323a06d9cda83fcd3f'
  )
on conflict (email) do update
set
  contact_name = excluded.contact_name,
  business_name = excluded.business_name,
  phone = excluded.phone,
  business_address = excluded.business_address,
  status = excluded.status,
  must_change_password = excluded.must_change_password,
  password_hash = excluded.password_hash;

insert into public.business_inquiries (
  contact_name,
  business_name,
  phone,
  email,
  business_address,
  notes,
  status
)
values
  (
    'Janelle Singh',
    'Island Kitchen Wholesale',
    '(868) 477-2008',
    'janelle@islandkitchen.tt',
    '22 Endeavour Road, Chaguanas',
    'Needs recurring same-day drop-offs for restaurant accounts.',
    'new'
  ),
  (
    'Marcus Lewis',
    'Northshore Medics',
    '(868) 311-9001',
    'marcus@northshoremedics.com',
    '4 Saddle Road, Maraval',
    'Interested in scheduled pharmacy runs and medical document handling.',
    'qualified'
  )
on conflict do nothing;

insert into public.drivers (
  name,
  phone,
  email,
  zone,
  status,
  access_status,
  must_change_password,
  password_hash,
  current_run,
  today_deliveries,
  cash_on_hand,
  last_login_at
)
values
  (
    'Jalen Ford',
    '(868) 301-1142',
    'jalen@routegrid.local',
    'east',
    'available',
    'active',
    false,
    'scrypt:75caebc761da0424601b9b8b6113d00d:31e7263a7e1c12f1956a133eeac36412e7ae3ed1fe242db37d728386a457a2af93e370344552d26babdfe4900399579883ed641bcaab48be739b6bc702414073',
    'Arima / Sangre Grande',
    0,
    0,
    null
  ),
  (
    'Keri Browne',
    '(868) 332-5411',
    'keri@routegrid.local',
    'west',
    'available',
    'active',
    false,
    'scrypt:75caebc761da0424601b9b8b6113d00d:31e7263a7e1c12f1956a133eeac36412e7ae3ed1fe242db37d728386a457a2af93e370344552d26babdfe4900399579883ed641bcaab48be739b6bc702414073',
    'Port of Spain urban loop',
    0,
    0,
    null
  ),
  (
    'Marlon James',
    '(868) 456-2221',
    'marlon@routegrid.local',
    'north',
    'available',
    'active',
    false,
    'scrypt:75caebc761da0424601b9b8b6113d00d:31e7263a7e1c12f1956a133eeac36412e7ae3ed1fe242db37d728386a457a2af93e370344552d26babdfe4900399579883ed641bcaab48be739b6bc702414073',
    'Tunapuna / St. Augustine',
    0,
    0,
    null
  ),
  (
    'Asha Khan',
    '(868) 785-9930',
    'asha@routegrid.local',
    'south',
    'available',
    'active',
    false,
    'scrypt:75caebc761da0424601b9b8b6113d00d:31e7263a7e1c12f1956a133eeac36412e7ae3ed1fe242db37d728386a457a2af93e370344552d26babdfe4900399579883ed641bcaab48be739b6bc702414073',
    'San Fernando / Penal',
    0,
    0,
    null
  )
on conflict (phone) do update
set
  name = excluded.name,
  email = excluded.email,
  zone = excluded.zone,
  status = excluded.status,
  access_status = excluded.access_status,
  must_change_password = excluded.must_change_password,
  password_hash = excluded.password_hash,
  current_run = excluded.current_run,
  last_login_at = excluded.last_login_at;

insert into public.inventory_items (
  item_name,
  available_units,
  reserved_units,
  reorder_point,
  location,
  health
)
values
  ('Tamper-proof satchels', 128, 24, 60, 'Central depot', 'healthy'),
  ('Insulated food bags', 18, 11, 20, 'Dispatch cage', 'low'),
  ('Barcode labels', 960, 180, 400, 'Printing station', 'healthy'),
  ('Medium parcel boxes', 12, 19, 20, 'Packing lane B', 'critical')
on conflict (item_name) do update
set
  available_units = excluded.available_units,
  reserved_units = excluded.reserved_units,
  reorder_point = excluded.reorder_point,
  location = excluded.location,
  health = excluded.health;
