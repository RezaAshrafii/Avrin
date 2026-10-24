import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.AVRIN_DEMO_URL || 'http://127.0.0.1:3000';
const out = path.resolve('artifacts/screenshots');
fs.mkdirSync(out,{recursive:true});
const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const findings={createdAt:new Date().toISOString(),base,scenarios:[],consoleErrors:[],pageErrors:[],externalRequests:[],interactionChecks:[]};
const ctx=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const page=await ctx.newPage();
page.on('console',m=>{if(m.type()==='error'&&!(new URL(page.url()).pathname==='/fa/not-a-real-page'&&m.text().includes('404')))findings.consoleErrors.push({url:page.url(),message:m.text()})});
page.on('pageerror',e=>findings.pageErrors.push({url:page.url(),message:e.message}));
page.on('request',r=>{const u=new URL(r.url());if(!['localhost','127.0.0.1'].includes(u.hostname))findings.externalRequests.push(r.url())});page.on('response',r=>{if(r.status()>=400&&!(r.status()===404&&new URL(r.url()).pathname==='/fa/not-a-real-page'))findings.failedResponses=(findings.failedResponses||[]).concat([{status:r.status(),url:r.url()}])});
async function visit(name,route,{mobile=false,fullPage=true,assertions=[]}={}){
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
 const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});
 await page.evaluate(async()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>undefined))),new Promise(resolve=>setTimeout(resolve,9000))]);await document.fonts.ready});
 const evidence=await page.evaluate(()=>({title:document.title,h1:document.querySelector('h1')?.textContent?.trim()||'',dir:document.documentElement.dir,lang:document.documentElement.lang,viewport:innerWidth,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.currentSrc),images:document.images.length,dialogImages:document.querySelectorAll('[role="dialog"] img').length,dialogText:document.querySelector('[role="dialog"]')?.innerText||''}));
 const checks={status:response?.status()||0,noHorizontalOverflow:evidence.docWidth<=evidence.viewport&&evidence.bodyWidth<=evidence.viewport,rtl:evidence.dir==='rtl'&&evidence.lang==='fa',imagesLoad:evidence.brokenImages.length===0,...Object.fromEntries(assertions.map(([key,fn])=>[key,fn(evidence)]))};
 await page.screenshot({path:path.join(out,`${name}${mobile?'-mobile':''}.png`),fullPage,animations:'disabled'});
 findings.scenarios.push({name,route,mobile,...evidence,checks});
 return checks;
}
await visit('home','/fa',{fullPage:true,assertions:[['homeH1',e=>e.h1.includes('اقامت در اورین')]]});
await visit('home','/fa',{mobile:true,fullPage:false});
await page.setViewportSize({width:1440,height:1000});
await page.goto(base+'/fa',{waitUntil:'domcontentloaded'});
await page.locator('.stayDateField').nth(0).getByRole('button').click();
const homeCalendarVisible=await page.getByRole('dialog',{name:'انتخاب ورود'}).isVisible();
const homeHasNativeDate=await page.locator('.stayBar input[type="date"]').count()>0;
await page.screenshot({path:path.join(out,'home-calendar.png'),fullPage:false,animations:'disabled'});
await page.locator('.calendarPopover .calendarGrid button:not(:disabled)').first().click();
await page.locator('.stayDateField').nth(1).getByRole('button').click();
const checkInIso=await page.locator('input[name="checkIn"]').inputValue();
const checkoutSameDayDisabled=await page.locator('.calendarPopover .calendarGrid button[disabled]').count()>0;
await page.locator('.calendarPopover .calendarGrid button:not(:disabled)').first().click();
const checkOutIso=await page.locator('input[name="checkOut"]').inputValue();
await page.screenshot({path:path.join(out,'home-calendar-selected.png'),fullPage:false,animations:'disabled'});
await page.locator('.stayBar > button').click();
await page.waitForURL('**/fa/book**',{timeout:10000});
const homeDateSubmit=new URL(page.url());
findings.scenarios.push({name:'home-jalali-calendar',checks:{calendarVisible:homeCalendarVisible,noNativeDateInput:!homeHasNativeDate,datesSelected:!!checkInIso&&!!checkOutIso&&checkOutIso>checkInIso,checkoutCannotEqualCheckin:checkoutSameDayDisabled,formPassesDates:homeDateSubmit.searchParams.get('checkIn')===checkInIso&&homeDateSubmit.searchParams.get('checkOut')===checkOutIso}});
await page.setViewportSize({width:390,height:844});
await page.goto(base+'/fa',{waitUntil:'domcontentloaded'});
await page.locator('.stayDateField').nth(0).getByRole('button').click();
const mobileCalendarOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
await page.screenshot({path:path.join(out,'home-calendar-mobile.png'),fullPage:false,animations:'disabled'});
findings.scenarios.push({name:'home-jalali-calendar-mobile',checks:{noHorizontalOverflow:!mobileCalendarOverflow,calendarVisible:await page.getByRole('dialog',{name:'انتخاب ورود'}).isVisible()}});
await visit('rooms','/fa/rooms',{fullPage:true});
await visit('room-vip','/fa/rooms/doublevip-room',{fullPage:true});
await visit('restaurant','/fa/restaurant',{fullPage:true});
await visit('menu-steak','/fa/restaurant/menu?category=plates&product=97818111',{fullPage:false,assertions:[['steakPhoto',e=>e.dialogImages===1&&e.dialogText.includes('۷۸۰٬۰۰۰ تومان')]]});
await visit('menu-mezze-no-photo','/fa/restaurant/menu?category=plates&product=195061748',{fullPage:false,assertions:[['mezzeHasNoPhoto',e=>e.dialogImages===0&&e.dialogText.includes('تصویر واقعی برای این قلم')]]});
await visit('booking','/fa/book?room=single-room',{fullPage:false});
await visit('contact','/fa/contact',{fullPage:true});
await visit('contact','/fa/contact',{mobile:true,fullPage:false});

await page.goto(base+'/fa/restaurant/menu?category=plates&product=97818111',{waitUntil:'domcontentloaded',timeout:30000});
const add=page.getByRole('button',{name:'افزودن به سبد نمونه'});
await add.click();
const addFeedbackVisible=await page.getByRole('status').getByText('به سبد نمونه اضافه شد').isVisible();
const cartActionVisible=await page.getByRole('link',{name:/مشاهدهٔ سبد/}).isVisible();
await page.getByRole('button',{name:'ادامهٔ خرید'}).click();
findings.interactionChecks.push({name:'cart-add-feedback',checks:{addFeedbackVisible,cartActionVisible,continueShoppingCloses:await page.getByRole('dialog').count()===0}});
await page.goto(base+'/fa/restaurant/menu?category=pasta&product=97812774',{waitUntil:'domcontentloaded',timeout:30000});
await page.getByRole('button',{name:'افزودن به سبد نمونه'}).click();
const cartResponse=await page.goto(base+'/fa/restaurant/cart',{waitUntil:'domcontentloaded',timeout:30000});
await page.evaluate(async()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>undefined))),new Promise(resolve=>setTimeout(resolve,9000))]);await document.fonts.ready});
const cartEvidence=await page.evaluate(()=>({title:document.title,h1:document.querySelector('h1')?.textContent?.trim()||'',dir:document.documentElement.dir,lang:document.documentElement.lang,viewport:innerWidth,docWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,bodyText:document.body.innerText}));
await page.screenshot({path:path.join(out,'cart.png'),fullPage:true,animations:'disabled'});
findings.scenarios.push({name:'cart',route:'/fa/restaurant/cart',...cartEvidence,checks:{status:cartResponse?.status()||0,noHorizontalOverflow:cartEvidence.docWidth<=cartEvidence.viewport&&cartEvidence.bodyWidth<=cartEvidence.viewport,rtl:cartEvidence.dir==='rtl'&&cartEvidence.lang==='fa',correctTotal:cartEvidence.bodyText.includes('۱٬۴۳۰٬۰۰۰ تومان'),realItems:cartEvidence.bodyText.includes('استیک مرغ')&&cartEvidence.bodyText.includes('پاستا آلفردو')}});
await page.goto(base+'/fa/restaurant/order-preview',{waitUntil:'domcontentloaded',timeout:30000});
await page.screenshot({path:path.join(out,'order-preview.png'),fullPage:true,animations:'disabled'});
const orderText=await page.locator('body').innerText();
findings.scenarios.push({name:'order-preview',route:'/fa/restaurant/order-preview',checks:{demoNotice:orderText.includes('این صفحه رسید پرداخت یا تأیید ثبت سفارش نیست'),neverClaimsPlaced:!orderText.includes('سفارش شما ثبت شد')}});
await page.goto(base+'/fa/restaurant/cart',{waitUntil:'domcontentloaded'});
const removeButton=page.getByRole('button',{name:/حذف استیک مرغ از سبد/});
const removeVisible=await removeButton.isVisible();
await removeButton.click();
const removalWorked=await page.locator('.cartLine').count()===1;
findings.interactionChecks.push({name:'cart-remove-item',checks:{removeVisible,removalWorked}});

await page.goto(base+'/fa/book?room=single-room&checkIn=2030-01-01&checkOut=2030-01-02&adults=3',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'بازبینی برنامهٔ نمونه'}).click();
const capacityError=await page.locator('.errorText').innerText();
await page.goto(base+'/fa/book?room=single-room&checkIn=2030-01-01&checkOut=2030-01-02&adults=1',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'بازبینی برنامهٔ نمونه'}).click();
const reviewVisible=await page.getByRole('heading',{name:'بازبینی برنامه'}).isVisible();
await page.getByRole('button',{name:'نمایش نتیجهٔ آزمایشی'}).click();
await page.waitForURL('**/fa/book/confirmation',{timeout:10000});
const stayResult=await page.locator('body').innerText();
await page.screenshot({path:path.join(out,'booking-confirmation.png'),fullPage:true,animations:'disabled'});
findings.scenarios.push({name:'booking-flow',route:'/fa/book',checks:{capacityRejected:capacityError.includes('ظرفیت'),reviewStep:reviewVisible,demoResult:new URL(page.url()).pathname==='/fa/book/confirmation'&&stayResult.includes('ثبت رزرو واقعی نیست')}});

await page.evaluate(()=>sessionStorage.removeItem('avrin-demo.stay.v1'));
const moreRoutes=[['gallery','/fa/gallery'],['about','/fa/about'],['facilities','/fa/facilities'],['faq','/fa/faq'],['policy','/fa/policy'],['privacy','/fa/privacy'],['booking-confirmation-empty','/fa/book/confirmation'],['menu-hidden-review','/fa/restaurant/menu?product=192576724'],['not-found','/fa/not-a-real-page']];
for(const [name,route] of moreRoutes){
 const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});
 const data=await page.evaluate(()=>({h1:document.querySelector('h1')?.textContent?.trim()||'',width:document.documentElement.scrollWidth,viewport:innerWidth,productDialog:!!document.querySelector('[role="dialog"]')}));
 await page.screenshot({path:path.join(out,`${name}.png`),fullPage:true,animations:'disabled'});
 const checks={status:response?.status()===(name==='not-found'?404:200),noHorizontalOverflow:data.width<=data.viewport};
 if(name==='menu-hidden-review')checks.hiddenFromDirectProductLink=!data.productDialog;
 if(name==='booking-confirmation-empty')checks.safeDirectEntry=data.h1.includes('هنوز برنامه‌ای');
 if(name==='not-found')checks.notFoundStatus=response?.status()===404;
 findings.scenarios.push({name,route,...data,checks});
}
const roomRoutes=['single-room','twin-bed-for-one-person','twinbeds-room','double-room','triple-room','twinbedsvip-room','doublevip-room','triplevip-room'];
findings.roomDetails=[];
for(const slug of roomRoutes){const response=await page.goto(`${base}/fa/rooms/${slug}`,{waitUntil:'domcontentloaded',timeout:30000});const headline=await page.locator('h1').first().textContent();findings.roomDetails.push({slug,status:response?.status()||0,headline,passed:response?.status()===200&&!!headline?.trim()})}

findings.responsiveChecks=[];
await page.setViewportSize({width:360,height:800});
for(const route of ['/fa','/fa/restaurant','/fa/restaurant/menu?category=plates&product=195061748','/fa/book','/fa/contact']){
 await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});
 const check=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth}));
 findings.responsiveChecks.push({route,...check,passed:check.width<=check.viewport});
}

await page.setViewportSize({width:390,height:844});
const homeRoute=await page.goto(base+'/fa',{waitUntil:'domcontentloaded',timeout:30000});
const homeLinks=await page.locator('a[href]').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
await page.screenshot({path:path.join(out,'home-mobile-last.png'),fullPage:false,animations:'disabled'});
findings.redirects=[];
for(const [route,target] of [['/','/fa'],['/fa/facalities','/fa/facilities'],['/fa/blog','/fa/about'],['/en','/fa'],['/virtual/index.htm','/fa/gallery']]){
 const resp=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000}); findings.redirects.push({route,status:resp?.status()||0,finalUrl:new URL(page.url()).pathname,expected:target,passed:new URL(page.url()).pathname===target});
}
findings.homeStatus=homeRoute?.status()||0;findings.homeLinks=homeLinks;

await page.setViewportSize({width:1440,height:1000});
await page.goto(base+'/fa/rooms',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'VIP',exact:true}).click();
const vipRows=await page.locator('.roomRow').count();
await page.locator('.filters select').selectOption('2');
const vipDoubleRows=await page.locator('.roomRow').count();
findings.interactionChecks.push({name:'room-filters',checks:{vipFilter:vipRows===3,capacityFilter:vipDoubleRows===2}});
await page.goto(base+'/fa/gallery',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'رستوران و کافه'}).click();
findings.interactionChecks.push({name:'gallery-filter',checks:{filtersGallery:await page.locator('.galleryGrid .galleryItem').count()>0}});
await page.locator('.galleryGrid .galleryItem').first().click();
const lightboxOpened=await page.getByRole('dialog').isVisible();
await page.keyboard.press('Escape');
findings.interactionChecks.push({name:'gallery-lightbox',checks:{opens:lightboxOpened,escapeCloses:await page.getByRole('dialog').count()===0}});
await page.goto(base+'/fa/faq',{waitUntil:'domcontentloaded'});
await page.locator('.faqItem button').first().click();
findings.interactionChecks.push({name:'faq-accordion',checks:{expands:await page.locator('.faqItem button').first().getAttribute('aria-expanded')==='true',answerVisible:await page.locator('.faqItem p').first().isVisible()}});
await page.goto(base+'/fa/restaurant/menu?category=plates&product=97818111',{waitUntil:'domcontentloaded'});
const productDialogOpened=await page.getByRole('dialog').isVisible();
await page.keyboard.press('Escape');
findings.interactionChecks.push({name:'product-dialog',checks:{queryOpens:productDialogOpened,escapeCloses:await page.getByRole('dialog').count()===0}});
await page.goto(base+'/fa/restaurant/menu',{waitUntil:'domcontentloaded'});
const categoryCount=await page.locator('.menuCategories .categoryButton').count();
const menuScroll=await page.evaluate(()=>({sidebarOverflow:getComputedStyle(document.querySelector('.menuSidebar')).overflowY,resultsOverflow:getComputedStyle(document.querySelector('.menuResults')).overflowY}));
await page.getByRole('button',{name:/غذاهای ایرانی و کباب/}).click();
const categoryChanged=await page.locator('.menuResultsHead h2').innerText()==='غذاهای ایرانی و کباب';
findings.interactionChecks.push({name:'menu-category-layout',checks:{compactCategories:categoryCount===10,categoriesDoNotScroll:menuScroll.sidebarOverflow==='visible',productsScroll:menuScroll.resultsOverflow==='auto',categoryFilterWorks:categoryChanged}});
await page.setViewportSize({width:390,height:844});
await page.goto(base+'/fa',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'بازکردن منو'}).click();
const mobileNavOpen=await page.locator('.mainNav').evaluate(el=>el.classList.contains('navOpen'));
await page.locator('.mainNav a').filter({hasText:'کافه و رستوران'}).click();
await page.waitForURL('**/fa/restaurant');
findings.interactionChecks.push({name:'mobile-navigation',checks:{opens:mobileNavOpen,navigates:new URL(page.url()).pathname==='/fa/restaurant'}});
await ctx.grantPermissions(['clipboard-read','clipboard-write'],{origin:new URL(base).origin});
await page.goto(base+'/fa/contact',{waitUntil:'domcontentloaded'});
await page.getByRole('button',{name:'کپی آدرس'}).click();
let copyWorked=false;try{await page.getByRole('button',{name:'آدرس کپی شد'}).waitFor({state:'visible',timeout:3000});copyWorked=true}catch{}
const copyFailedClearly=await page.getByRole('button',{name:'کپی انجام نشد'}).isVisible().catch(()=>false);
findings.interactionChecks.push({name:'copy-address',checks:{successMessage:copyWorked,clearFallbackMessage:copyWorked||copyFailedClearly}});
findings.linkChecks=[];
const pagesToAudit=['/fa','/fa/rooms','/fa/restaurant','/fa/restaurant/menu','/fa/restaurant/cart','/fa/book','/fa/gallery','/fa/about','/fa/facilities','/fa/contact','/fa/faq','/fa/policy','/fa/privacy'];
const internalHrefs=new Set();
for(const route of pagesToAudit){await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});for(const href of await page.locator('a[href]').evaluateAll(es=>es.map(e=>e.getAttribute('href')))){if(href?.startsWith('/'))internalHrefs.add(href)}}
for(const href of [...internalHrefs].sort()){const response=await ctx.request.get(base+href,{timeout:20000,maxRedirects:5});findings.linkChecks.push({href,status:response.status(),finalUrl:response.url(),passed:response.status()<400});}
findings.passed=findings.scenarios.every(s=>Object.values(s.checks||{}).every(Boolean))&&findings.interactionChecks.every(s=>Object.values(s.checks||{}).every(Boolean))&&findings.linkChecks.every(x=>x.passed)&&findings.redirects.every(r=>r.passed)&&findings.roomDetails.every(r=>r.passed)&&findings.responsiveChecks.every(r=>r.passed)&&findings.consoleErrors.length===0&&findings.pageErrors.length===0&&findings.externalRequests.length===0&&(findings.failedResponses||[]).length===0;
fs.writeFileSync(path.join(out,'browser-review.json'),JSON.stringify(findings,null,2));
await browser.close();
console.log(JSON.stringify({passed:findings.passed,screenshots:fs.readdirSync(out).filter(x=>x.endsWith('.png')),scenarios:findings.scenarios.map(s=>({name:s.name,checks:s.checks})),interactionChecks:findings.interactionChecks,linkChecks:findings.linkChecks,roomDetails:findings.roomDetails,responsiveChecks:findings.responsiveChecks,consoleErrors:findings.consoleErrors,pageErrors:findings.pageErrors,externalRequests:findings.externalRequests,failedResponses:findings.failedResponses||[],redirects:findings.redirects},null,2));
if(!findings.passed)process.exitCode=1;




