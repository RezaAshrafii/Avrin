import {describe,it} from 'node:test';
import assert from 'node:assert/strict';
import {allowedPhoto,PLACEHOLDER_SHA} from '../src/lib/asset-policy';
import {money} from '../src/lib/format';
import {dayNumber,nights,toIso,fromIso,addJ} from '../src/lib/dates';
import {cartTotal,sanitizeLines} from '../src/lib/cart';
import snapshot from '../src/data/site-data.json';

describe('photo gate',()=>{
 it('accepts only real approved photos whose file exists',()=>{
  const valid={use_image_in_demo:true,image_demo_status:'real_product_photo',image_files:['food.jpg']};
  assert.equal(allowedPhoto(valid,()=>true),true);assert.equal(allowedPhoto(valid,()=>false),false);
  assert.equal(allowedPhoto({...valid,image_demo_status:'shared_generic_placeholder_do_not_use'},()=>true),false);
  assert.equal(allowedPhoto({...valid,use_image_in_demo:false},()=>true),false);
 });
 it('keeps the generic placeholder fingerprint explicit',()=>assert.equal(PLACEHOLDER_SHA.length,64));
});
describe('currency snapshot',()=>{
 it('formats integer toman and never applies a rial multiplier',()=>{
  assert.equal(money(780000),'۷۸۰٬۰۰۰ تومان');assert.equal(money(null),'برای هماهنگی با پذیرش تماس بگیرید');
 });
});
describe('calendar day arithmetic',()=>{
 it('counts adjacent ISO calendar dates as one night without timezone drift',()=>assert.equal(nights('2026-03-20','2026-03-21'),1));
 it('rejects same-day checkout as zero nights',()=>assert.equal(nights('2026-03-20','2026-03-20'),0));
 it('converts Jalaali dates to stable ISO day strings',()=>{
  const iso=toIso({jy:1405,jm:1,jd:1});assert.equal(fromIso(iso)?.jy,1405);assert.equal(fromIso(iso)?.jm,1);assert.equal(fromIso(iso)?.jd,1);
  assert.equal(addJ({jy:1405,jm:1,jd:1},1).jd,2);
 });
 it('uses UTC day ordinals only for pure calendar day comparisons',()=>assert.equal(dayNumber('2026-03-21')-dayNumber('2026-03-20'),1));
});
describe('cart validation',()=>{
 it('drops tampered IDs and quantities and caps duplicate lines',()=>{
  assert.deepEqual(sanitizeLines([{id:1,quantity:2},{id:1,quantity:30},{id:999,quantity:1},{id:2,quantity:-1},{id:3,quantity:1.2}],new Set([1,2,3])),[{id:1,quantity:20}]);
 });
 it('recalculates totals only from local authoritative prices',()=>assert.equal(cartTotal([{id:97818111,quantity:2},{id:97812774,quantity:1}],new Map([[97818111,780000],[97812774,650000]])),2210000));
});
describe('Avrin source snapshot and published media',()=>{
 it('keeps source and customer-menu totals separate',()=>{
  assert.equal(snapshot.products.length,244);assert.equal(snapshot.categories.length,31);
  assert.equal(snapshot.publicProducts.length,234);assert.equal(snapshot.publicCategories.length,28);
  assert.equal(snapshot.products.filter(p=>p.visibility==='review').length,10);
 });
 it('publishes only the exact food images approved by the source audit',()=>{
  const steak=snapshot.publicProducts.find(p=>p.id===97818111)!;
  const mezze=snapshot.products.find(p=>p.id===195061748)!;
  const shared=snapshot.products.find(p=>p.id===97818500)!;
  assert.equal(steak.image?.id,'food-97818111');assert.equal(mezze.image,null);assert.equal(shared.image,null);
  assert.equal(snapshot.publicProducts.filter(p=>p.image).length,68);
  assert.equal(snapshot.assets.some(a=>a.sha256===PLACEHOLDER_SHA),false);
  assert.equal(JSON.stringify(snapshot).includes('C:\\Users\\Reza\\Desktop'),false);
 });
 it('contains all eight named rooms with no nightly rates',()=>{
  assert.equal(snapshot.rooms.length,8);assert(snapshot.rooms.every(r=>r.nightlyPrice===null&&r.gallery.length>0));
 });
});
