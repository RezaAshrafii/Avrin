import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

const root = path.resolve(process.argv[2] || '..');
const out = path.resolve('src/data');
const media = path.resolve('public/media');
const source = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const hashFile = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.mkdirSync(out, { recursive: true }); fs.mkdirSync(media, { recursive: true });

const business = source('02-source-data/business_data.json');
const menu = source('02-source-data/restaurant_menu.json');
const imageManifest = source('02-source-data/image_manifest.json');
const photoAudit = new Map(fs.readFileSync(path.join(root, '02-source-data/menu_photo_audit.csv'), 'utf8').split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
  const m = line.match(/^"?(\d+)"?,"?([^",]*)"?,"?([^",]*)"?,"?([^",]*)"?,"?(True|False)"?,"?([^",]*)"?,"?([^",]*)"?,"?([^",]*)"?$/);
  if (m) return [Number(m[1]), { status: m[4], allowed: m[5] === 'True', local: m[6], sha: m[7] }];
  const cols = line.split(','); return [Number(cols[0]), { status: cols[3], allowed: cols[4] === 'True', local: cols[5], sha: cols[6] }];
}));

const approvedSiteFiles = new Set([
  'Testing-bd64be88ddcf.jpg','اسلاید-یک-ce8cb1d115e5.jpg','اسلاید-دو-f87a6ea57a4e.jpg','اسلاید-سه-f256a37c6451.jpg',
  'هتل-اورین-aeb631025bfa.jpg','اتاق-یک-تخته-2b45afb94058.jpg','اتاق-یک-تخته-82ab123eb7f9.jpg','اتاق-یک-تخته-81792e81244a.jpg','اتاق-یک-تخته-b92249c931a3.jpg','اتاق-یک-تخته-b6384978e328.jpg',
  'دو-تخته-برای-یک-نفر-e7b0ba50a09e.jpg','دو-تخته-توئین-7b7e40c607cb.jpg','دو-تخته-توئین-2556e8b9f76c.jpg','اتاق-دوتخته-دبل-acace6e4360b.jpg','اتاق-دوتخته-دبل-4e1c0e16d801.jpg','اتاق-دوتخته-دبل-4ee657f7797b.jpg','اتاق-دوتخته-دبل-56d6915863ce.jpg','اتاق-سه-تخته-8fc2404d64e8.jpg','اتاق-سه-تخته-8a46b5b00d7c.jpg','اتاق-سه-تخته-96eda4a85ecc.jpg','اتاق-سه-تخته-c78d457213ea.jpg','اتاق-سه-تخته-vip-21cdb0228206.jpg','اتاق-سه-تخته-vip-78a938888296.jpg','اتاق-سه-تخته-vip-f0a3a99ef378.jpg','اتاق-سه-تخته-vip-1d8af415e5ea.jpg','دو-تخته-توئین-vip-1d2f430a5782.jpg','دو-تخته-توئین-vip-a288e704f220.jpg','دو-تخته-توئین-vip-c84016485f61.jpg','دو-تخته-توئین-vip-d53a0b1d4e4c.jpg','اتاق-دوتخته-دبل-vip-ee7824a40383.jpg','اتاق-دوتخته-دبل-vip-cb2d409e6313.jpg','اتاق-دوتخته-دبل-vip-3c579668a413.jpg','اتاق-دوتخته-دبل-vip-24c6f3e8b0fb.jpg',
  'کافه-و-رستوران-اورین-79f0634778ba.jpg','کافه-و-رستوران-اورین-146051e67e1b.jpg','کافه-و-رستوران-اورین-03d4a25278b8.jpg','کافه-و-رستوران-اورین-81f6e7118889.jpg','کافه-و-رستوران-اورین-fe52c6946c05.jpg','رستوران-های-هتل-اورین-78207b2b8b66.jpg','رستوران-های-هتل-اورین-0b53d4a44f14.jpg','بوفه-سلف-سرویس-صبحانه-ee72df8a0d47.jpg','بوفه-سلف-سرویس-صبحانه-e65190344d0e.jpg','بوفه-سلف-سرویس-صبحانه-d65f0d7c33e2.jpg','بوفه-سلف-سرویس-صبحانه-88ffbca9438f.jpg','بوفه-سلف-سرویس-صبحانه-6b5dc297e344.jpg','بوفه-سلف-سرویس-صبحانه-6666cc5e3b59.jpg',
  'عکس-یک-e866fd6386ee.jpg','عکس-دو-5272491cb00f.jpg','عکس-سه-da8d66533755.jpg','عکس-چهار-098bcdc96125.jpg','عکس-پنج-1f39a82c2d75.jpg','عکس-شش-97f8f795d083.jpg','عکس-هفت-f51a40e8375a.jpg',
  'امکانات-91448003ab2e.jpg','تماس-97441ae2608e.jpg','سوالات-متداول-2127451759a0.jpeg','وبلاگ-e8b406669301.png'
]);
const roleAlt = new Map([
 ['Testing-bd64be88ddcf.jpg',['hotelHero','پذیرش هتل اورین']],['اسلاید-یک-ce8cb1d115e5.jpg',['stayHero','فضای یکی از اتاق‌های هتل اورین']],
 ['هتل-اورین-aeb631025bfa.jpg',['arrival','ورودی هتل اورین']],['کافه-و-رستوران-اورین-79f0634778ba.jpg',['restaurantHero','فضای داخلی کافه و رستوران اورین']],
 ['کافه-و-رستوران-اورین-146051e67e1b.jpg',['terrace','فضای باز مجموعهٔ اورین']],['بوفه-سلف-سرویس-صبحانه-ee72df8a0d47.jpg',['breakfast','بوفهٔ صبحانهٔ اورین']],
]);
const assets = [];
const copied = new Map();
async function addAsset(src, target, alt, fit='cover', limit=1800) {
  if (!fs.existsSync(src)) throw new Error(`Missing approved asset: ${src}`);
  const key = hashFile(src); const cacheKey=`${target}:${key}`; if (copied.has(cacheKey)) return copied.get(cacheKey);
  const dest = path.join(media, target); fs.mkdirSync(path.dirname(dest), { recursive: true });
  await sharp(src).rotate().resize({ width: limit, height: limit, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(dest);
  const meta = await sharp(src).metadata(); const base=path.basename(target,'.webp'); const a={ id:base,src:`/media/${target.replaceAll('\\','/')}`,alt,width:meta.width||0,height:meta.height||0,fit,sha256:key };
  copied.set(cacheKey,a); assets.push(a); return a;
}
const siteAssets = new Map();
for (const entry of imageManifest) {
  if (!entry.local_file || !approvedSiteFiles.has(path.basename(entry.local_file))) continue;
  const file=path.basename(entry.local_file); const [role,alt]=roleAlt.get(file)||['gallery','فضای داخلی هتل اورین'];
  const token=file.match(/-([a-f0-9]{12})\./i)?.[1]||crypto.createHash('sha1').update(file).digest('hex').slice(0,12);
  const dest=`hotel/site-${token}-1600.webp`;
  siteAssets.set(file, await addAsset(entry.local_file,dest,alt,'cover',role==='hotelHero'?2000:1600));
}
const roomRows = [
 ['single-room','اتاق یک‌تخته','standard',1,'یک تخت تک‌نفره','avrin-2b45afb94058',['avrin-82ab123eb7f9','avrin-81792e81244a','avrin-b92249c931a3','avrin-b6384978e328']],
 ['twin-bed-for-one-person','دوتخته برای یک نفر','standard',1,'اتاق دوتخته با استفادهٔ یک نفر؛ نوع نهایی تخت با پذیرش هماهنگ شود','avrin-e7b0ba50a09e',['avrin-e7b0ba50a09e']],
 ['twinbeds-room','دوتخته توئین','standard',2,'دو تخت تک‌نفره','avrin-7b7e40c607cb',['avrin-7b7e40c607cb','avrin-2556e8b9f76c']],
 ['double-room','دوتخته دبل','standard',2,'یک تخت دونفره','avrin-acace6e4360b',['avrin-acace6e4360b','avrin-4e1c0e16d801','avrin-4ee657f7797b','avrin-56d6915863ce']],
 ['triple-room','سه‌تخته','standard',3,'یک تخت دونفره و یک تخت تک‌نفره','avrin-8fc2404d64e8',['avrin-8fc2404d64e8','avrin-8a46b5b00d7c','avrin-96eda4a85ecc']],
 ['twinbedsvip-room','دوتخته توئین VIP','vip',2,'دو تخت تک‌نفره','avrin-1d2f430a5782',['avrin-1d2f430a5782','avrin-d53a0b1d4e4c','avrin-c84016485f61']],
 ['doublevip-room','دوتخته دبل VIP','vip',2,'یک تخت دونفره','avrin-ee7824a40383',['avrin-ee7824a40383','avrin-cb2d409e6313','avrin-3c579668a413','avrin-24c6f3e8b0fb']],
 ['triplevip-room','سه‌تخته VIP','vip',3,'یک تخت دونفره و یک تخت تک‌نفره','avrin-21cdb0228206',['avrin-21cdb0228206','avrin-78a938888296','avrin-f0a3a99ef378','avrin-1d8af415e5ea']],
];
const roomFiles = new Map();
for(const e of imageManifest){ if(!e.local_file)continue; const n=path.basename(e.local_file); const m=n.match(/-([a-f0-9]{12})\./i); if(m)roomFiles.set(`avrin-${m[1]}`,e.local_file); }
const roomAssets=new Map();
for(const [slug,name,tier,capacity,bedText,heroId,ids] of roomRows){
 const gal=[]; for(const id of ids){const file=roomFiles.get(id);if(!file)continue;gal.push(await addAsset(file,`rooms/${id}.webp`,`${name}، نمای ${gal.length+1}`,'cover',1600));}
 roomAssets.set(slug,{slug,name,tier,capacity,bedText,description:`${name} در مجموعهٔ اتاق‌های هتل اورین. برای هماهنگی جزئیات اقامت و نرخ با پذیرش تماس بگیرید.`,heroAssetId:heroId,gallery:gal,nightlyPrice:null,sourceUrl:`https://hotelavrin.ir/fa/rooms/${slug}`,contentStatus:'source_snapshot'});
}
const products=[];
for(let index=0;index<menu.products.length;index++){
 const p=menu.products[index]; const audit=photoAudit.get(Number(p.id))||{status:p.image_demo_status,allowed:p.use_image_in_demo,local:p.image_files?.[0],sha:''};
 let image=null;
 if(p.use_image_in_demo===true&&p.image_demo_status==='real_product_photo'&&audit.allowed&&audit.local&&fs.existsSync(audit.local)){
   const sha=hashFile(audit.local); if(sha==='7bad8283e602e2d7dd6e7252db6d9160abcab07e85bd7ec3472c13ca4363ed19')throw new Error(`Placeholder hash reached approved item ${p.id}`);
   image=await addAsset(audit.local,`food/food-${p.id}.webp`,p.name,'contain',1200);
 }
 products.push({id:Number(p.id),sourceName:p.name,displayName:p.id===97812774?'پاستا آلفردو':p.name,sourceCategoryId:Number(p.category_id),categoryName:p.category,description:p.description||'',priceToman:Number.isFinite(Number(p.price))?Math.round(Number(p.price)):null,visibility:p.category==='غذای پرسنلی'||p.category==='اضافات'&&String(p.id)==='192576724'||p.category==='بدون دسته بندی'?'review':'public',image,photoStatus:p.image_demo_status,sourceOrder:index+1});
}
const names = { 'بیرون بر':['takeaway','رستوران'],'غذای اصلی':['main-course','رستوران'],'کبابها':['kebabs','رستوران'],'چلوها':['rice','رستوران'],'خوراک ها':['stews','رستوران'],'دریایی':['seafood','رستوران'],'سالادها':['salads','رستوران'],'پیش غذا':['starters','رستوران'],'سوپ ها':['soups','رستوران'],'غذای روز':['daily','رستوران'],'پیتزاها':['pizza','رستوران'],'بشقاب ها':['plates','رستوران'],'پنینی ها':['panini','رستوران'],'پاستا ها':['pasta','رستوران'],'ساندویج ها':['sandwiches','رستوران'],'سیب زمینی':['fries','رستوران'],'برگرها':['burgers','رستوران'],'چای و دمنوش':['tea','کافه'],'نوشیدنی ها':['beverages','کافه'],'اسموتی وماکتل':['smoothies-mocktails','کافه'],'قهوه گرم نرمال و اسپشیال':['hot-coffee','کافه'],'قهوه سرد':['cold-coffee','کافه'],'شیک ها':['shakes','کافه'],'کیک ها':['cakes','کافه'],'غذای پرسنلی':['staff-meals','بازبینی'],'قلیان':['hookah','سایر'],'اضافات':['extras','بازبینی'],'شربت ها':['syrups','کافه'],'منو ویژه رستوران':['restaurant-special','رستوران'],'منو ویژه کافه':['cafe-special','کافه'],'بدون دسته بندی':['uncategorized','بازبینی'] };
const excludedNames=new Set(['غذای پرسنلی','بدون دسته بندی']);
const categories=menu.categories.map((c,i)=>{
 const [slug,group]=names[c.name]||[`category-${c.id}`,'سایر']; const productsIn=products.filter(p=>p.sourceCategoryId===Number(c.id));
 const isExtraReview=c.name==='اضافات';
 return {id:Number(c.id),name:c.name,slug,group,sourceOrder:i+1,visibility:excludedNames.has(c.name)?'review':isExtraReview?'review':'public',count:productsIn.length};
});
const publicProducts=products.filter(p=>p.visibility==='public');
const publicCategoryIds=new Set(publicProducts.map(p=>p.sourceCategoryId));
const publicCategories=categories.filter(c=>publicCategoryIds.has(c.id)&&c.visibility==='public');
const data={asOf:menu.as_of,hotel:{name:'هتل اورین تهران',shortName:'اورین',address:business.address_fa,phoneDisplay:business.hotel_phone_display,phoneTel:'+982166431661',mobileDisplay:business.hotel_phone_alt,mobileTel:'+989913264098',email:business.hotel_email,restaurantPhone:'66591059',restaurantPhoneVerified:false,coordinates:{lat:35.70206906079886,lon:51.39048134973817},mapsUrl:business.google_maps_url,instagram:'https://instagram.com/avrincafe',breakfastHours:'۷:۰۰ تا ۱۰:۳۰',restaurantHours:'۷:۰۰ تا ۲۳:۰۰'},assets,rooms:[...roomAssets.values()],products,categories,publicProducts,publicCategories};
fs.writeFileSync(path.join(out,'site-data.json'),JSON.stringify(data,null,2));
const report={source:{rooms:roomRows.length,categories:categories.length,products:products.length,mainSiteImages:imageManifest.length},runtime:{publicProducts:publicProducts.length,publicCategories:publicCategories.length,eligibleProductImages:publicProducts.filter(p=>p.image).length,reviewProducts:products.filter(p=>p.visibility==='review').length,assets:assets.length},placeholderHashBlocked:true,sourceRoot:root,asOf:menu.as_of};
fs.writeFileSync(path.join(out,'import-report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));

