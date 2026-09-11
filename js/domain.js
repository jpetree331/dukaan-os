/* Pure versioned contracts. No DOM, persistence, clock or authentication access. */
(function (root, factory) {
  'use strict';
  const domain = factory();
  if (typeof module === 'object' && module.exports) module.exports = domain;
  else (root.App = root.App || {}).domain = domain;
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const CALCULATION_VERSION = 'exclusive-paise-v1';
  const QUANTITY_SCALE = 10000;
  function finite(n, label, min=0, max=1e9) {
    if (typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw new Error(label + ' is outside the supported range.');
    return n;
  }
  function paise(n) {
    finite(n,'Money',0,Number.MAX_SAFE_INTEGER/100);
    const value=Math.round((n+Number.EPSILON)*100);
    if(!Number.isSafeInteger(value)) throw new Error('Money exceeds safe precision.');
    return value;
  }
  function quantityUnits(n) {
    finite(n,'Quantity');
    const units=Math.round(n*QUANTITY_SCALE);
    if(Math.abs(n-units/QUANTITY_SCALE)>1e-10) throw new Error('Quantity supports at most four decimal places.');
    return units;
  }
  // Arithmetic normalizes representational noise, not new user inputs.
  const quantity = n => Math.round(n*QUANTITY_SCALE)/QUANTITY_SCALE;
  function sum(values) {
    const n=values.reduce((a,b)=>a+b,0);
    if(!Number.isSafeInteger(n)) throw new Error('Money exceeds safe precision.');
    return n;
  }
  function sale({lines, discount=0, redeem=0, points=0, loyaltyValue=1}) {
    if(!Array.isArray(lines)) throw new Error('Sale lines must be an array.');
    finite(discount,'Discount');finite(redeem,'Redemption');finite(points,'Points',-1e9);finite(loyaltyValue,'Loyalty value',0.00000001);
    const gross=lines.map(l=>{
      finite(l.price,'Price');quantityUnits(l.qty);finite(l.gst,'GST',0,100);
      // Preserve historical line-first rounding, including fractional-unit prices.
      return paise(l.price*l.qty);
    });
    const subtotal=sum(gross),disc=Math.min(paise(discount),subtotal);
    const redeemed=Math.min(paise(redeem),subtotal-disc,paise(Math.max(0,points)*loyaltyValue));
    const net=subtotal-disc-redeemed;
    const bases=gross.map(g=>subtotal ? Number((BigInt(g)*BigInt(net)*2n+BigInt(subtotal))/(BigInt(subtotal)*2n)) : 0);
    // Retain last-line residual allocation, with bounded backwards allocation
    // when many tiny lines would otherwise make the final base negative.
    let residue=net-sum(bases);
    for(let i=bases.length-1;i>=0 && residue;i--) {
      const change=Math.max(-bases[i],Math.min(gross[i]-bases[i],residue));
      bases[i]+=change;residue-=change;
    }
    if(residue) throw new Error('Could not allocate the sale discount.');
    const taxes=bases.map((base,i)=>({gst:lines[i].gst,taxable:base/100,tax:Math.round((base*lines[i].gst/100)+Number.EPSILON)/100}));
    const tax=sum(taxes.map(t=>paise(t.tax)));
    return {sub:subtotal/100,disc:disc/100,redeem:redeemed/100,tax:tax/100,taxes,total:sum([net,tax])/100};
  }
  function snapshot(value) {
    const copy=JSON.parse(JSON.stringify(value));
    const freeze=x=>{if(x && typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
    return freeze(copy);
  }
  function command({id,accountId,actorId,storeId,kind,at,corrects=null}) {
    for(const value of [id,accountId,actorId,storeId,kind]) {
      if(typeof value!=='string' || !/^[A-Za-z0-9_-]{1,100}$/.test(value)) throw new Error('Invalid command identity.');
    }
    if(corrects!==null && (typeof corrects!=='string' || !/^[A-Za-z0-9_-]{1,100}$/.test(corrects))) throw new Error('Invalid correction link.');
    if(!Number.isSafeInteger(at) || at<0 || at>8640000000000000) throw new Error('Invalid command timestamp.');
    return snapshot({version:1,id,accountId,actorId,storeId,kind,at,corrects});
  }
  return Object.freeze({CALCULATION_VERSION,QUANTITY_SCALE,paise,quantityUnits,quantity,sale,snapshot,command});
});
