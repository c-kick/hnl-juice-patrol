/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),a=new WeakMap;let n=class{constructor(e,t,a){if(this._$cssResult$=!0,a!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const i=this.t;if(t&&void 0===e){const t=void 0!==i&&1===i.length;t&&(e=a.get(i)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&a.set(i,e))}return e}toString(){return this.cssText}};const s=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new n("string"==typeof e?e:e+"",void 0,i))(t)})(e):e,{is:r,defineProperty:o,getOwnPropertyDescriptor:l,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:h}=Object,p=globalThis,u=p.trustedTypes,g=u?u.emptyScript:"",m=p.reactiveElementPolyfillSupport,v=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?g:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},b=(e,t)=>!r(e,t),f={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:b};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let _=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=f){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),a=this.getPropertyDescriptor(e,i,t);void 0!==a&&o(this.prototype,e,a)}}static getPropertyDescriptor(e,t,i){const{get:a,set:n}=l(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:a,set(t){const s=a?.call(this);n?.call(this,t),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??f}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const e=h(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const e=this.properties,t=[...c(e),...d(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(s(e))}else void 0!==e&&t.push(s(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const i=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((i,a)=>{if(t)i.adoptedStyleSheets=a.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of a){const a=document.createElement("style"),n=e.litNonce;void 0!==n&&a.setAttribute("nonce",n),a.textContent=t.cssText,i.appendChild(a)}})(i,this.constructor.elementStyles),i}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),a=this.constructor._$Eu(e,i);if(void 0!==a&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(t,i.type);this._$Em=e,null==n?this.removeAttribute(a):this.setAttribute(a,n),this._$Em=null}}_$AK(e,t){const i=this.constructor,a=i._$Eh.get(e);if(void 0!==a&&this._$Em!==a){const e=i.getPropertyOptions(a),n="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=a;const s=n.fromAttribute(t,e.type);this[a]=s??this._$Ej?.get(a)??s,this._$Em=null}}requestUpdate(e,t,i,a=!1,n){if(void 0!==e){const s=this.constructor;if(!1===a&&(n=this[e]),i??=s.getPropertyOptions(e),!((i.hasChanged??b)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:a,wrapped:n},s){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==n||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===a&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,a=this[t];!0!==e||this._$AL.has(t)||void 0===a||this.C(t,void 0,i,a)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};_.elementStyles=[],_.shadowRootOptions={mode:"open"},_[v("elementProperties")]=new Map,_[v("finalized")]=new Map,m?.({ReactiveElement:_}),(p.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const x=globalThis,w=e=>e,$=x.trustedTypes,k=$?$.createPolicy("lit-html",{createHTML:e=>e}):void 0,S="$lit$",R=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+R,L=`<${E}>`,C=document,A=()=>C.createComment(""),T=e=>null===e||"object"!=typeof e&&"function"!=typeof e,j=Array.isArray,D="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,z=/-->/g,H=/>/g,P=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),F=/'/g,V=/"/g,N=/^(?:script|style|textarea|title)$/i,U=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),O=Symbol.for("lit-noChange"),I=Symbol.for("lit-nothing"),W=new WeakMap,B=C.createTreeWalker(C,129);function q(e,t){if(!j(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,a=[];let n,s=2===t?"<svg>":3===t?"<math>":"",r=M;for(let t=0;t<i;t++){const i=e[t];let o,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===M?"!--"===l[1]?r=z:void 0!==l[1]?r=H:void 0!==l[2]?(N.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=P):void 0!==l[3]&&(r=P):r===P?">"===l[0]?(r=n??M,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,o=l[1],r=void 0===l[3]?P:'"'===l[3]?V:F):r===V||r===F?r=P:r===z||r===H?r=M:(r=P,n=void 0);const h=r===P&&e[t+1].startsWith("/>")?" ":"";s+=r===M?i+L:c>=0?(a.push(o),i.slice(0,c)+S+i.slice(c)+R+h):i+R+(-2===c?t:h)}return[q(e,s+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),a]};class G{constructor({strings:e,_$litType$:t},i){let a;this.parts=[];let n=0,s=0;const r=e.length-1,o=this.parts,[l,c]=J(e,t);if(this.el=G.createElement(l,i),B.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(a=B.nextNode())&&o.length<r;){if(1===a.nodeType){if(a.hasAttributes())for(const e of a.getAttributeNames())if(e.endsWith(S)){const t=c[s++],i=a.getAttribute(e).split(R),r=/([.?@])?(.*)/.exec(t);o.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?X:"?"===r[1]?ee:"@"===r[1]?te:Q}),a.removeAttribute(e)}else e.startsWith(R)&&(o.push({type:6,index:n}),a.removeAttribute(e));if(N.test(a.tagName)){const e=a.textContent.split(R),t=e.length-1;if(t>0){a.textContent=$?$.emptyScript:"";for(let i=0;i<t;i++)a.append(e[i],A()),B.nextNode(),o.push({type:2,index:++n});a.append(e[t],A())}}}else if(8===a.nodeType)if(a.data===E)o.push({type:2,index:n});else{let e=-1;for(;-1!==(e=a.data.indexOf(R,e+1));)o.push({type:7,index:n}),e+=R.length-1}n++}}static createElement(e,t){const i=C.createElement("template");return i.innerHTML=e,i}}function Z(e,t,i=e,a){if(t===O)return t;let n=void 0!==a?i._$Co?.[a]:i._$Cl;const s=T(t)?void 0:t._$litDirective$;return n?.constructor!==s&&(n?._$AO?.(!1),void 0===s?n=void 0:(n=new s(e),n._$AT(e,i,a)),void 0!==a?(i._$Co??=[])[a]=n:i._$Cl=n),void 0!==n&&(t=Z(e,n._$AS(e,t.values),n,a)),t}class Y{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,a=(e?.creationScope??C).importNode(t,!0);B.currentNode=a;let n=B.nextNode(),s=0,r=0,o=i[0];for(;void 0!==o;){if(s===o.index){let t;2===o.type?t=new K(n,n.nextSibling,this,e):1===o.type?t=new o.ctor(n,o.name,o.strings,this,e):6===o.type&&(t=new ie(n,this,e)),this._$AV.push(t),o=i[++r]}s!==o?.index&&(n=B.nextNode(),s++)}return B.currentNode=C,a}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class K{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,a){this.type=2,this._$AH=I,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=a,this._$Cv=a?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),T(e)?e===I||null==e||""===e?(this._$AH!==I&&this._$AR(),this._$AH=I):e!==this._$AH&&e!==O&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>j(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==I&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(C.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,a="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=G.createElement(q(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===a)this._$AH.p(t);else{const e=new Y(a,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=W.get(e.strings);return void 0===t&&W.set(e.strings,t=new G(e)),t}k(e){j(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,a=0;for(const n of e)a===t.length?t.push(i=new K(this.O(A()),this.O(A()),this,this.options)):i=t[a],i._$AI(n),a++;a<t.length&&(this._$AR(i&&i._$AB.nextSibling,a),t.length=a)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Q{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,a,n){this.type=1,this._$AH=I,this._$AN=void 0,this.element=e,this.name=t,this._$AM=a,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=I}_$AI(e,t=this,i,a){const n=this.strings;let s=!1;if(void 0===n)e=Z(this,e,t,0),s=!T(e)||e!==this._$AH&&e!==O,s&&(this._$AH=e);else{const a=e;let r,o;for(e=n[0],r=0;r<n.length-1;r++)o=Z(this,a[i+r],t,r),o===O&&(o=this._$AH[r]),s||=!T(o)||o!==this._$AH[r],o===I?e=I:e!==I&&(e+=(o??"")+n[r+1]),this._$AH[r]=o}s&&!a&&this.j(e)}j(e){e===I?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class X extends Q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===I?void 0:e}}class ee extends Q{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==I)}}class te extends Q{constructor(e,t,i,a,n){super(e,t,i,a,n),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??I)===O)return;const i=this._$AH,a=e===I&&i!==I||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==I&&(i===I||a);a&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ie{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}}const ae=x.litHtmlPolyfillSupport;ae?.(G,K),(x.litHtmlVersions??=[]).push("3.3.2");const ne=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class se extends _{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const a=i?.renderBefore??t;let n=a._$litPart$;if(void 0===n){const e=i?.renderBefore??null;a._$litPart$=n=new K(t.insertBefore(A(),e),e,void 0,i??{})}return n._$AI(e),n})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return O}}se._$litElement$=!0,se.finalized=!0,ne.litElementHydrateSupport?.({LitElement:se});const re=ne.litElementPolyfillSupport;re?.({LitElement:se}),(ne.litElementVersions??=[]).push("4.2.2");const oe="font-size:13px;color:var(--secondary-text-color)",le="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",ce="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",de=[{key:"auto",label:"Auto"},{key:"1d",label:"1D"},{key:"1w",label:"1W"},{key:"1m",label:"1M"},{key:"3m",label:"3M"},{key:"6m",label:"6M"},{key:"1y",label:"1Y"},{key:"all",label:"All"}];function he(e){const t=pe(e);return null!==t?t+"%":"—"}function pe(e){return null===e?null:Math.ceil(e)}function ue(e,t){return e?.message?.includes("unknown command")?`Restart Home Assistant to enable ${t}`:`${t} failed`}function ge(e,t,i=20){if(null===e)return"var(--disabled-text-color)";const a=t??i;return e<=a/2?"var(--error-color, #db4437)":e<=1.25*a?"var(--warning-color, #ffa726)":"var(--success-color, #43a047)"}function me(e){return null!==e.dischargeRateHour&&e.dischargeRateHour>=1}function ve(e){const t=e.predictionStatus;if(!t||"normal"===t)return null;return{charging:"Charging",flat:"Flat",idle:"Idle",noisy:"Noisy data",insufficient_data:"Not enough data",single_level:"Single level",insufficient_range:"Tiny range"}[t]||null}function ye(e){return{charging:"This battery is currently charging, so no discharge prediction is generated. Once it starts discharging again, a new prediction will be calculated.",flat:"The battery level has been essentially flat — no significant discharge detected. This is normal for devices with very slow drain. A prediction will appear once enough change is observed.",idle:"This rechargeable device is not currently discharging. A discharge prediction will appear once the battery level starts dropping.",noisy:"The battery data is too irregular to fit a reliable trend line. This can happen with sensors that report inconsistent values. The prediction will improve as more stable readings accumulate.",insufficient_data:"There are not enough data points or the observation period is too short to calculate a prediction. Juice Patrol needs at least 3 readings spanning 24 hours.",single_level:"All recorded readings have the same battery level. This typically means the sensor reports a fixed value or hasn't changed since discovery.",insufficient_range:"The battery level has barely changed — the total variation is within one reporting step. More drain needs to occur before a trend can be detected."}[e]||null}function be(e){if(me(e))return null!==e.dischargeRateHour?e.dischargeRateHour+"%/h":"—";if(null===e.dischargeRate)return"—";const t=e.dischargeRate;return t<.01?t.toFixed(4)+"%/d":t<1?t.toFixed(2)+"%/d":t.toFixed(1)+"%/d"}function fe(e,t=!1){if(!e)return"—";try{const i=new Date(e);if(i.getTime()-Date.now()>31536e7)return"—";const a=new Date,n=i.getFullYear()===a.getFullYear();if(t){const e=n?{month:"short",day:"numeric"}:{month:"short",day:"numeric",year:"numeric"};return i.toLocaleDateString(void 0,e)+" "+i.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}return i.toLocaleDateString(void 0,{month:"short",day:"numeric",year:n?void 0:"numeric"})}catch{return"—"}}function _e(e){if(!e)return{count:0,type:""};const t=e.match(/^(\d+)\s*[×x]\s*(.+)$/i);return t?{count:parseInt(t[1]),type:t[2].trim()}:{count:1,type:e.trim()}}function xe(e){const t=[],i=pe(e.level),a=pe(e.meanLevel);return null!==a&&null!==i&&i>a+3&&!e.isRechargeable?t.push(`Level is rising (${i}%) without a charge state — not expected for a non-rechargeable battery`):null!==a&&null!==i&&Math.abs(i-a)>5&&t.push(`Current level (${i}%) differs significantly from 7-day average (${a}%)`),null!==e.stabilityCv&&e.stabilityCv>.05&&!e.isRechargeable&&t.push(`High reading variance (CV: ${(100*e.stabilityCv).toFixed(1)}%)`),0===t.length&&t.push("Battery readings show non-monotonic or inconsistent behavior"),t.join(". ")}function we(e,t){if(!e)return"";const i=e.confidence,a=e.r_squared,n=e.data_points_used,s=t?.chemistry;if("history-based"===i)return"Estimated from previous charging cycles. The time-to-full estimate will become more accurate as more charging data is collected during this session.";const r=t?.readings,o=r?.length>=2?(r[r.length-1].t-r[0].t)/86400:null,l=e.t0?(Date.now()/1e3-e.t0)/86400:null,c=null!=o&&null!=l&&o>2*l;if("high"===i){const e=["Good trend fit (R² > 0.8), 7+ days of data, 10+ readings"];return c&&e.push(`Based on recent trend (${$e(l)}) after a rate change was detected in ${$e(o)} of history`),e.join(". ")}const d=[];if(null!=a&&a<=.8&&d.push(`trend fit is ${a<=.3?"weak":"moderate"} (R² ${a.toFixed(2)})`),null!=l&&l<7&&!c&&d.push(`only ${$e(l)} of data (need 7d+)`),null!=n&&n<10&&d.push(`only ${n} readings (need 10+)`),r?.length>=5){const e=r.slice(-5).map(e=>e.v),t=Math.min(...e),i=Math.max(...e),a=e.slice().sort((e,t)=>e-t)[2];i-t<=1&&a<=30&&d.push(`battery stuck at ${Math.round(a)}% — readings have flatlined near end-of-life`)}("coin_cell"===s||"lithium_primary"===s)&&"medium"===i&&null!=a&&a>.75&&null!=l&&l>=7&&null!=n&&n>=10&&d.push(`flat-curve battery chemistry (${"coin_cell"===s?"coin cell":"lithium primary"}) caps confidence at medium due to coarse SoC steps`);const h="medium"===i?"Medium":"low"===i?"Low":"Insufficient",p=d.length?`: ${d.join(". ")}`:"";return c?`${h} confidence${p}. A rate change was detected — prediction uses the recent ${$e(l)} trend from ${$e(o)} of history.`:"insufficient_data"===i?"Insufficient data: not enough readings or trend too weak to make a prediction":d.length?`${h} confidence: ${d.join(". ")}.`:`${h} confidence`}function $e(e){return e<1?`${Math.round(24*e)}h`:e<30?`${e.toFixed(1)}d`:`${Math.round(e/30)}mo`}function ke(e){const t=[],i=(e.name||"").toLowerCase();e.manufacturer&&!i.includes(e.manufacturer.toLowerCase())&&t.push(e.manufacturer),e.model&&!i.includes(e.model.toLowerCase())&&t.push(e.model);let a=t.join(" ");return a&&e.platform?a+=` · ${e.platform}`:!a&&e.platform&&(a=e.platform),a||null}function Se(e,t){e.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:t}}))}const Re=((e,...t)=>{const a=1===e.length?e[0]:t.reduce((t,i,a)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[a+1],e[0]);return new n(a,e,i)})`
  :host {
    display: block;
    font-family: var(--primary-font-family, Roboto, sans-serif);
    color: var(--primary-text-color);
    background: var(--primary-background-color);
    --card-bg: var(--ha-card-background, var(--card-background-color, #fff));
    --border: var(--divider-color, rgba(0, 0, 0, 0.12));
    height: 100%;
    overflow: hidden;
  }
  /* Toolbar is provided by hass-tabs-subpage */
  ha-icon-button[slot="toolbar-icon"] {
    color: var(--sidebar-icon-color);
  }
  #jp-content,
  .jp-padded {
    padding: 16px;
  }
  /* Hero card */
  .hero-row { display: flex; align-items: stretch; }
  .hero-left {
    flex-shrink: 0; padding: 20px 24px; text-align: center;
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-width: 130px;
  }
  .hero-big { font-size: 42px; font-weight: 800; line-height: 1; letter-spacing: -1.5px; }
  .hero-unit { font-size: 12px; color: var(--secondary-text-color); margin-top: 3px; font-weight: 500; }
  .hero-right {
    flex: 1; padding: 16px; display: flex; flex-direction: column;
    justify-content: center; min-width: 0;
  }
  .hero-name-row { display: flex; align-items: center; gap: 4px; }
  .hero-name { font-size: 17px; font-weight: 600; line-height: 1.3; }
  .hero-sub { font-size: 12px; color: var(--secondary-text-color); margin-top: 2px; }
  .hero-bar-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
  .hero-bar {
    flex: 1; height: 8px;
    background: color-mix(in srgb, var(--secondary-text-color) 18%, transparent);
    border-radius: 4px; overflow: hidden;
  }
  .hero-bar-fill { height: 100%; border-radius: 4px; }
  .hero-bar-pct { font-size: 13px; font-weight: 600; min-width: 36px; }
  .hero-stats { display: flex; border-top: 1px solid var(--border); }
  .hero-stat { flex: 1; padding: 10px 12px; text-align: center; }
  .hero-stat + .hero-stat { border-left: 1px solid var(--border); }
  .hero-stat-label {
    font-size: 11px; color: var(--secondary-text-color);
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .hero-stat-val { font-size: 14px; font-weight: 500; margin-top: 2px; }

  /* Hero responsive */
  @container hero (max-width: 480px) {
    .hero-row { flex-direction: column; }
    .hero-left {
      border-right: none; border-bottom: 1px solid var(--border);
      padding: 14px 16px; flex-direction: row; gap: 8px;
      min-width: unset; justify-content: flex-start; align-items: baseline;
    }
    .hero-big { font-size: 32px; }
    .hero-unit { margin-top: 0; }
    .hero-right { padding: 12px 16px; }
    .hero-name { font-size: 15px; }
    .hero-bar-row { margin-top: 8px; }
    .hero-stats { flex-wrap: wrap; }
    .hero-stat { flex: 1 1 calc(50% - 1px); padding: 8px 10px; }
    .hero-stat:nth-child(odd):not(:first-child) { border-left: none; }
    .hero-stat:nth-child(1), .hero-stat:nth-child(2) {
      border-bottom: 1px solid var(--border);
    }
  }

  /* Chart card header */
  .chart-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
  }
  .chart-card-title { font-size: 14px; font-weight: 500; }

  /* Prediction details grid (inside expansion panel) */
  .pred-detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 14px; padding: 8px 8px 16px;
  }
  /* Replacement history table inside expansion panel */
  .expansion-content {
    padding: 8px 8px 16px;
  }
  .summary-card {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 16px 20px;
    min-width: 120px;
    border: 1px solid var(--border);
  }
  .summary-card .value {
    font-size: 28px;
    font-weight: 500;
  }
  .summary-card .label {
    font-size: 13px;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }
  .settings-card {
    margin-bottom: 20px;
  }
  .settings-card ha-textfield {
    --text-field-padding: 0 8px;
  }
  hass-tabs-subpage-data-table {
    --data-table-row-height: 60px;
    --ha-dropdown-font-size: 14px;
  }
  .jp-filter-list {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
  }
  .jp-filter-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 16px;
    cursor: pointer;
    font-size: 14px;
  }
  .jp-filter-item:hover {
    background: var(--secondary-background-color);
  }
  .jp-level-range {
    padding: 4px 0;
  }
  .jp-level-slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 2px 16px;
  }
  .jp-level-label {
    font-size: 13px;
    color: var(--secondary-text-color);
    width: 28px;
    flex-shrink: 0;
  }
  .jp-level-slider-row ha-slider {
    flex: 1;
  }
  .jp-level-value {
    font-size: 12px;
    font-weight: 500;
    width: 36px;
    text-align: right;
    flex-shrink: 0;
  }
  .devices {
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .confidence-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
  }
  .confidence-dot.high { background: var(--success-color); }
  .confidence-dot.medium { background: var(--warning-color); }
  .confidence-dot.low { background: var(--error-color); }
  .confidence-dot.history-based { background: var(--disabled-text-color, #999); }
  .empty-state {
    padding: 40px;
    text-align: center;
    color: var(--secondary-text-color);
  }
  .loading-state {
    padding: 32px;
    text-align: center;
    color: var(--secondary-text-color);
  }
  .loading-state ha-spinner {
    margin-bottom: 8px;
  }
  .jp-dialog-desc {
    font-size: 13px;
    color: var(--secondary-text-color);
    flex: 1;
  }
  .jp-overflow-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    z-index: 20;
    min-width: 160px;
    background: var(--card-background-color, #1e1e1e);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .jp-overflow-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 14px;
    cursor: pointer;
    outline: none;
    text-align: left;
    font-family: inherit;
    transition: background-color 0.1s;
  }
  .jp-overflow-menu-item:hover {
    background: var(--secondary-background-color);
  }
  .jp-rechargeable-section {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 8px 0;
    cursor: pointer;
  }
  .jp-rechargeable-section ha-switch {
    flex-shrink: 0;
    margin-top: 2px;
  }
  .jp-rechargeable-labels {
    flex: 1;
  }
  .jp-batteries-heading {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 4px;
  }
  .jp-count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--primary-color);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    box-sizing: border-box;
    margin-left: 8px;
  }
  .jp-batteries-section {
    transition: opacity 0.25s;
  }
  .jp-batteries-section.jp-disabled-overlay {
    opacity: 0.3;
    pointer-events: none;
    position: relative;
  }
  .jp-unknown-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 16px;
    border: 1px dashed var(--disabled-text-color, #999);
    color: var(--disabled-text-color, #999);
    font-size: 13px;
    font-weight: 500;
    font-style: italic;
    cursor: default;
  }
  .jp-unknown-chip ha-icon {
    color: var(--disabled-text-color, #999);
  }
  .jp-custom-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 14px;
    border-radius: 16px;
    border: 1px dashed color-mix(in srgb, var(--primary-color) 55%, transparent);
    background: transparent;
    color: var(--primary-color);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }
  .jp-custom-trigger:hover:not([disabled]) {
    border-color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  }
  .jp-custom-trigger.active {
    border-style: solid;
    border-color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
  }
  .jp-custom-trigger.disabled {
    opacity: 0.35;
    cursor: default;
  }
  .jp-custom-popover {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    z-index: 10;
    width: 240px;
    background: var(--card-background-color, #1e1e1e);
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }
  .jp-custom-popover-input {
    padding: 8px 12px;
    border-bottom: 1px solid var(--divider-color);
  }
  .jp-custom-input {
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
  }
  .jp-custom-suggestion {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    color: var(--primary-text-color);
    font-size: 14px;
    cursor: pointer;
    outline: none;
    text-align: left;
    font-family: inherit;
    transition: background-color 0.1s;
  }
  .jp-custom-suggestion:hover {
    background: var(--secondary-background-color);
  }
  .jp-autodetect-btn {
    flex-shrink: 0;
    color: var(--primary-color);
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 20px;
  }
  .jp-dialog-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
    align-items: center;
  }
  .jp-preset {
    padding: 4px 10px;
    border: 1px solid var(--border);
    border-radius: 16px;
    background: var(--secondary-background-color);
    color: var(--primary-text-color);
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
  }
  .jp-preset:hover:not([disabled]) {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  .jp-preset.active {
    border-color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
  }
  .jp-preset.disabled {
    opacity: 0.35;
    cursor: default;
  }
  .jp-badge-field {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--secondary-background-color);
    margin-bottom: 10px;
  }
  .jp-badge-field-chips {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .jp-badge-chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 13px;
    font-weight: 500;
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
    cursor: pointer;
    user-select: none;
    border: 1px solid color-mix(in srgb, var(--primary-color) 30%, transparent);
  }
  .jp-badge-chip:hover {
    background: color-mix(in srgb, var(--error-color) 15%, transparent);
    color: var(--error-color);
    border-color: color-mix(in srgb, var(--error-color) 30%, transparent);
  }
  .jp-badge-placeholder {
    color: var(--secondary-text-color);
    font-size: 13px;
    font-style: italic;
  }
  .jp-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
  @keyframes jp-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  ha-icon-button.spinning ha-icon {
    animation: jp-spin 1s linear infinite;
  }
  .shopping-summary {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  .shopping-groups {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .shopping-type {
    font-size: 16px;
    font-weight: 500;
  }
  .shopping-devices-inner {
    padding: 0 8px;
  }
  .shopping-device {
    display: grid;
    grid-template-columns: 1fr 60px 60px;
    padding: 8px 0;
    border-top: 1px solid var(--border);
    font-size: 13px;
    align-items: center;
  }
  .shopping-device.needs-replacement {
    color: var(--error-color);
  }
  .shopping-device-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .shopping-device-level {
    text-align: right;
    font-weight: 500;
  }
  .shopping-device-days {
    text-align: right;
    color: var(--secondary-text-color);
  }
  .shopping-need-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 24px;
    padding: 0 6px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    background: color-mix(
      in srgb,
      var(--error-color, #db4437) 15%,
      transparent
    );
    color: var(--error-color, #db4437);
  }
  .shopping-need-card {
    min-width: 80px;
    text-align: center;
  }
  .shopping-need-card .value {
    font-size: 22px;
  }
  .shopping-need-card .label {
    font-size: 11px;
  }
  .shopping-hint {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 12px 16px;
    background: color-mix(in srgb, var(--info-color, #039be5) 10%, transparent);
    border-radius: 8px;
    font-size: 13px;
    color: var(--secondary-text-color);
  }
  .detail-meta-label {
    font-size: 12px;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .detail-meta-value {
    font-size: 15px;
    font-weight: 500;
  }
  .detail-reason {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    margin-top: 12px;
    padding: 12px 14px;
    background: color-mix(in srgb, var(--info-color, #039be5) 8%, transparent);
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.5;
  }
  .detail-reason strong {
    display: block;
    margin-bottom: 2px;
  }
  .detail-reason-text {
    color: var(--secondary-text-color);
  }
  .chart-range-bar {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .range-pill {
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    background: transparent;
    color: var(--primary-text-color);
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;
    line-height: 1.4;
  }
  .range-pill:hover {
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    border-color: var(--primary-color);
  }
  .range-pill.active {
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border-color: var(--primary-color);
  }
  .chart-stale-notice {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    color: var(--primary-color);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .chart-stale-notice:hover {
    background: color-mix(in srgb, var(--primary-color) 18%, transparent);
  }
  .detail-chart {
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border);
    padding: 8px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .detail-chart ha-chart-base {
    width: 100%;
  }
  .replacement-table {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 0;
    font-size: 0.9em;
  }
  .replacement-table-header {
    display: contents;
  }
  .replacement-table-header > span {
    padding: 6px 12px 6px 0;
    font-size: 0.8em;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--secondary-text-color);
    border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.12));
  }
  .replacement-table-row {
    display: contents;
  }
  .replacement-table-row > span {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px 8px 0;
    border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.06));
  }
  .replacement-table-row.suspected > span {
    background: rgba(255, 152, 0, 0.05);
  }
  /* ══════════════════════════════
     DASHBOARD
     ══════════════════════════════ */
  .jp-dashboard {
    max-width: 1240px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Status badges ── */
  .jp-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 8px;
  }
  .jp-badge.error {
    background: color-mix(in srgb, var(--error-color) 15%, transparent);
    color: var(--error-color);
  }
  .jp-badge.warning {
    background: color-mix(in srgb, var(--warning-color) 15%, transparent);
    color: var(--warning-color);
  }
  .jp-badge.success {
    background: color-mix(in srgb, var(--success-color) 15%, transparent);
    color: var(--success-color);
  }
  .jp-badge.info {
    background: color-mix(in srgb, var(--info-color) 15%, transparent);
    color: var(--info-color);
  }
  .jp-badge.primary {
    background: color-mix(in srgb, var(--primary-color) 15%, transparent);
    color: var(--primary-color);
  }
  .jp-badge.neutral {
    background: color-mix(in srgb, var(--secondary-text-color) 12%, transparent);
    color: var(--secondary-text-color);
  }

  /* ── Dashboard shared card header ── */
  .db-card-header {
    padding: 14px 16px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
  }
  .db-card-title {
    font-size: 16px;
    font-weight: 500;
  }

  /* ── Dashboard layout grids ── */
  .db-top-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .db-mid-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .db-bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  /* ── Attention table ── */
  .att-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  .att-table th {
    font-size: 11px;
    color: var(--disabled-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    padding: 4px 8px 8px;
    font-weight: 400;
  }
  .att-table td {
    padding: 8px;
    border-top: 1px solid var(--border);
    vertical-align: middle;
  }
  .att-table .name-cell {
    font-weight: 500;
  }
  .att-table .dim {
    font-size: 12px;
    color: var(--secondary-text-color);
  }
  .att-row {
    cursor: pointer;
  }
  .att-row:hover {
    background: var(--secondary-background-color);
  }
  .level-indicator {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .level-bar {
    width: 40px;
    height: 5px;
    background: var(--border);
    border-radius: 3px;
    overflow: hidden;
  }
  .level-bar-fill {
    height: 100%;
    border-radius: 3px;
  }

  /* ── Most Wanted cards ── */
  .wanted-card {
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }
  .wanted-card:hover {
    opacity: 0.92;
  }
  .wanted-top {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--border);
  }
  .wanted-identity {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .wanted-name {
    font-size: 15px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wanted-sub {
    font-size: 12px;
    color: var(--secondary-text-color);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .wanted-level {
    font-size: 28px;
    font-weight: 500;
    line-height: 1;
    flex-shrink: 0;
    margin-left: 12px;
  }
  .wanted-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    border-bottom: 1px solid var(--border);
  }
  .ws {
    padding: 10px 14px;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .ws:nth-child(2n) { border-right: none; }
  .ws:nth-last-child(-n+2) { border-bottom: none; }
  .ws-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--disabled-text-color);
    margin-bottom: 2px;
  }
  .ws-value {
    font-size: 14px;
    font-weight: 500;
  }
  .wanted-gauge {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
  }
  .gauge-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--disabled-text-color);
    margin-bottom: 6px;
  }
  .gauge-track {
    height: 8px;
    background: var(--secondary-background-color);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }
  .gauge-fill {
    height: 100%;
    border-radius: 4px;
  }
  .gauge-threshold {
    position: absolute;
    top: -2px;
    height: 12px;
    width: 2px;
    border-radius: 1px;
    background: var(--primary-text-color);
    opacity: 0.3;
  }
  .gauge-axis {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    color: var(--disabled-text-color);
    margin-top: 3px;
  }
  .wanted-badges {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    padding: 10px 16px 12px;
  }
  .wanted-verdict {
    padding: 12px 16px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--secondary-text-color);
    flex: 1;
  }
  .wanted-verdict strong {
    color: var(--primary-text-color);
    font-weight: 500;
  }

  /* ── Overview stats (inside Overview card) ── */
  .db-overview-stats {
    display: flex;
    border-top: 1px solid var(--border);
  }
  .db-stat {
    flex: 1;
    padding: 12px 16px;
    text-align: center;
  }
  .db-stat + .db-stat {
    border-left: 1px solid var(--border);
  }
  .db-stat-value {
    font-size: 28px;
    font-weight: 500;
    line-height: 1;
    display: block;
  }
  .db-stat-label {
    font-size: 12px;
    color: var(--secondary-text-color);
    display: block;
    margin-top: 4px;
  }
  .db-stat-sub {
    font-size: 10px;
    color: var(--disabled-text-color);
    display: block;
    margin-top: 2px;
  }

  /* ── Health by Battery Type ── */
  .type-health-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .type-health-row {
    display: grid;
    grid-template-columns: 80px 1fr 36px;
    gap: 8px;
    align-items: center;
  }
  .th-type {
    font-size: 13px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .th-chart-container {
    height: 32px;
    min-width: 0;
  }
  .th-count {
    font-size: 12px;
    color: var(--secondary-text-color);
    text-align: right;
  }

  @media (max-width: 1060px) {
    .db-bottom-row { grid-template-columns: 1fr; }
    .db-mid-row { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .db-card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
  }
  @media (max-width: 500px) {
    #jp-content,
    .jp-padded {
      padding: 10px;
    }
    .shopping-summary {
      flex-wrap: wrap;
      gap: 8px;
    }
    .shopping-summary .summary-card {
      min-width: 60px;
    }
    .detail-chart {
      padding: 4px;
    }
    .range-pill {
      padding: 3px 9px;
      font-size: 11px;
    }
  }
`;function Ee(e,t,i){return getComputedStyle(e).getPropertyValue(t).trim()||i}function Le(e){const t=e._settingsValues?.low_threshold??20;return{icon:{title:"",type:"icon",moveable:!1,showNarrow:!0,template:e=>U`
        <ha-icon
          icon=${function(e){if(e.isRechargeable)return null===e.level?"mdi:battery-unknown":e.level<=10?"mdi:battery-charging-10":e.level<=30?"mdi:battery-charging-30":e.level<=60?"mdi:battery-charging-60":e.level<=90?"mdi:battery-charging-90":"mdi:battery-charging-100";const t=e.level;return null===t?"mdi:battery-unknown":t<=5?"mdi:battery-outline":t<=15?"mdi:battery-10":t<=25?"mdi:battery-20":t<=35?"mdi:battery-30":t<=45?"mdi:battery-40":t<=55?"mdi:battery-50":t<=65?"mdi:battery-60":t<=75?"mdi:battery-70":t<=85?"mdi:battery-80":t<=95?"mdi:battery-90":"mdi:battery"}(e)}
          style="color:${ge(e.level,e.threshold,t)}"
        ></ha-icon>
      `},name:{title:"Device",main:!0,sortable:!0,filterable:!0,filterKey:"_searchText",direction:"asc",flex:3,showNarrow:!0,template:t=>{const i=function(e,t){const i=[],a=t._settingsValues?.low_threshold??20;e.replacementPending&&i.push({label_id:"replaced",name:e.isRechargeable?"RECHARGED?":"REPLACED?",color:"#FF9800",description:e.isRechargeable?"Battery level jumped significantly — normal recharge cycle?":"Battery level jumped significantly — was the battery replaced?"});if(e.isLow){const t=e.threshold??a;i.push({label_id:"low",name:"LOW",color:"#F44336",description:`Battery is at ${pe(e.level)}%, below the ${t}% threshold`})}e.isStale&&i.push({label_id:"stale",name:"STALE",color:"#FF9800",description:"No battery reading received within the stale timeout period"});"cliff"===e.anomaly?i.push({label_id:"cliff",name:"CLIFF DROP",color:"#F44336",description:`Sudden drop of ${e.dropSize??"?"}% in a single reading interval`}):"rapid"===e.anomaly&&i.push({label_id:"rapid",name:"RAPID",color:"#F44336",description:`Discharge rate significantly higher than average — ${e.dropSize??"?"}% drop`});"erratic"===e.stability&&i.push({label_id:"erratic",name:"ERRATIC",color:"#9C27B0",description:xe(e)});const n=e.isRechargeable?new Set(["flat","charging","idle"]):new Set;e.predictedEmpty||!ve(e)||n.has(e.predictionStatus)||i.push({label_id:"no-pred",name:ve(e),color:"#9E9E9E",description:ye(e.predictionStatus)||""});e.isRechargeable&&function(e){return e.isRechargeable&&("charging"===e.chargingState||"charging"===e.predictionStatus)}(e)&&i.push({label_id:"charging",name:"Charging",icon:"mdi:battery-charging",color:"#4CAF50",description:"Currently charging"});if(null!==e.meanLevel&&e.stability&&"stable"!==e.stability&&"insufficient_data"!==e.stability){const t=pe(e.meanLevel),a=pe(e.level);null!==t&&Math.abs(t-(a??0))>2&&i.push({label_id:"avg",name:`avg ${t}%`,color:"#2196F3",description:`7-day average is ${t}% while current reading is ${a??"?"}%`})}return i}(t,e),a=ke(t);return U`
          <div style="overflow:hidden">
            <span>${t.name||t.sourceEntity}</span>
            ${a?U`<div style=${"font-size:11px;color:var(--secondary-text-color);opacity:0.7;margin-top:1px"}>${a}</div>`:I}
            ${i.length?U`<div style=${"display:flex;flex-wrap:wrap;gap:4px;margin-top:4px"}>${i.map(e=>function(e){return U`
    <span title=${e.description||""} style="display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:500;padding:1px 8px;border-radius:10px;white-space:nowrap;background:color-mix(in srgb, ${e.color} 20%, transparent);color:${e.color}">
      ${e.icon?U`<ha-icon icon=${e.icon} style="--mdc-icon-size:14px"></ha-icon>`:I}
      ${e.name}
    </span>
  `}(e))}</div>`:I}
          </div>
        `}},level:{title:"Level",sortable:!0,type:"numeric",valueColumn:"_levelSort",minWidth:"70px",maxWidth:"90px",showNarrow:!0,template:e=>{const i=ge(e.level,e.threshold,t);return U`<span style="color:${i};font-weight:500">${he(e.level)}</span>`}},batteryType:{title:"Type",sortable:!0,minWidth:"60px",maxWidth:"90px",template:e=>U`<span
        style="font-size:12px;color:var(--secondary-text-color)"
        title=${e.batteryTypeSource?`Source: ${e.batteryTypeSource}`:""}
      >${e.batteryType||"—"}</span>`},dischargeRate:{title:"Rate",sortable:!0,type:"numeric",minWidth:"70px",maxWidth:"120px",template:e=>U`<span style=${oe}>${be(e)}</span>`},daysRemaining:{title:"Left",sortable:!0,type:"numeric",minWidth:"55px",maxWidth:"80px",template:e=>U`<span style=${oe}>${function(e){return me(e)&&null!==e.hoursRemaining?e.hoursRemaining<1?Math.round(60*e.hoursRemaining)+"m":e.hoursRemaining+"h":null===e.daysRemaining?"—":e.daysRemaining>3650?"> 10y":e.daysRemaining+"d"}(e)}</span>`},reliability:{title:"Reliability",sortable:!0,type:"numeric",minWidth:"45px",maxWidth:"85px",template:e=>function(e){const t=e.reliability,i=null!==e.daysRemaining||null!==e.hoursRemaining;if(null==t||!i)return"—";const a=t>=70?"var(--success-color, #43a047)":t>=40?"var(--warning-color, #ffa726)":"var(--disabled-text-color, #999)";return U`<span
    style="display:inline-block;font-size:11px;font-weight:500;padding:1px 6px;border-radius:8px;background:color-mix(in srgb, ${a} 15%, transparent);color:${a}"
    title="Prediction reliability: ${t}%"
    >${t}%</span
  >`}(e)},predictedEmpty:{title:"Empty by",sortable:!0,minWidth:"80px",maxWidth:"140px",template:e=>U`<span style=${oe}>${e.predictedEmpty?fe(e.predictedEmpty,me(e)):"—"}</span>`},actions:{title:"",type:"overflow-menu",showNarrow:!0,template:t=>U`
        <ha-dropdown
          @wa-select=${i=>{i.stopPropagation(),e._handleMenuSelect(i,t.sourceEntity)}}
          @click=${e=>e.stopPropagation()}
        >
          <ha-icon-button
            slot="trigger"
            @click=${e=>{e.stopPropagation();const t=e.currentTarget.closest("ha-dropdown");t&&(t.open?t.hideMenu():t.showMenu())}}
          >
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          ${function(e){return U`
    <ha-dropdown-item value="detail">
      <ha-icon slot="icon" icon="mdi:information-outline"></ha-icon>
      More info
    </ha-dropdown-item>
    <wa-divider></wa-divider>
    ${e?.replacementPending?U`
    <ha-dropdown-item value="confirm">
      <ha-icon slot="icon" icon="mdi:check-circle-outline"></ha-icon>
      Confirm replacement
    </ha-dropdown-item>`:I}
    <ha-dropdown-item value="replace">
      <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
      Mark as replaced
    </ha-dropdown-item>
    <ha-dropdown-item value="recalculate">
      <ha-icon slot="icon" icon="mdi:calculator-variant"></ha-icon>
      Recalculate
    </ha-dropdown-item>
    <ha-dropdown-item value="type">
      <ha-icon slot="icon" icon="mdi:battery-heart-variant"></ha-icon>
      Set battery type${e?.batteryType?` (${e.batteryType})`:""}
    </ha-dropdown-item>
    <wa-divider></wa-divider>
    <ha-dropdown-item value="ignore">
      <ha-icon slot="icon" icon="mdi:eye-off"></ha-icon>
      Ignore device
    </ha-dropdown-item>
  `}(t)}
        </ha-dropdown>
      `}}}const Ce={alkaline:"Alkaline",lithium_primary:"Lithium (primary)",coin_cell:"Lithium (coin cell)",NMC:"Li-ion (NMC)",LFP:"LiFePO4 (LFP)",NiMH:"NiMH",LCO:"Li-ion (LCO)",unknown:"Unknown"};function Ae(e){const t=e._detailEntity,i=e._getDevice(t);return i?U`
    ${function(e,t){const i=e._detailEntity,a=null!=t.predictedEmpty,n=ge(t.level,t.threshold),s=ke(t),r=a?function(e){const t=e.daysRemaining;return null==t?"—":t<=1?Math.round(24*t)+"h":(Math.round(10*t)/10).toString()}(t):he(t.level),o=a?"days remaining":"battery level",l=null!=t.level?Math.max(0,Math.min(100,Math.ceil(t.level))):0,c=a?he(t.level):"no prediction",d=a?n:"var(--disabled-text-color)",h=e._chartData,p=h?.prediction||{},u=h?.charge_prediction,g={normal:"Normal",charging:"Charging",flat:"Flat",idle:"Idle",noisy:"Noisy",insufficient_data:"Insufficient data",single_level:"Single level",insufficient_range:"Insufficient range"},m="normal"===p.status&&null!=p.estimated_days_remaining&&p.estimated_days_remaining<=0,v=m?"Depleted":g[p.status]||p.status||"—",y=u?.estimated_full_timestamp?fe(1e3*u.estimated_full_timestamp,!0):t.predictedEmpty?fe(t.predictedEmpty,me(t)):m&&p.estimated_empty_timestamp?fe(1e3*p.estimated_empty_timestamp,!0):"—",b=u?.estimated_full_timestamp?"Full by":m?"Reached empty":"Empty by",f=u?.confidence||p.confidence,_={high:"High",medium:"Medium",low:"Low",insufficient_data:"Insufficient","history-based":"History"},x=f?_[f]||f:"—";return U`
    <ha-card style="container-type:inline-size;container-name:hero;margin-bottom:16px">
      <div class="hero-row">
        <div class="hero-left">
          <div class="hero-big" style="color:${n}">${r}</div>
          <div class="hero-unit">${o}</div>
        </div>
        <div class="hero-right">
          <div class="hero-name-row">
            <div class="hero-name">${t.name||t.sourceEntity}</div>
            <ha-icon-button
              .path=${"M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"}
              style="--mdc-icon-button-size:32px;--mdc-icon-size:20px;color:var(--secondary-text-color)"
              title="More info"
              @click=${()=>{e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:i}}))}}
            ></ha-icon-button>
          </div>
          ${s?U`<div class="hero-sub">${s}</div>`:I}
          <div class="hero-bar-row">
            <div class="hero-bar">
              <div class="hero-bar-fill" style="width:${l}%;background:${n}"></div>
            </div>
            <div class="hero-bar-pct" style="color:${d}">${c}</div>
          </div>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat">
          <div class="hero-stat-label">Rate</div>
          <div class="hero-stat-val">${be(t)}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">${b}</div>
          <div class="hero-stat-val">${y}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Status</div>
          <div class="hero-stat-val">${v}</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-label">Confidence</div>
          <div class="hero-stat-val" title="${we(u||p,h)}">
            <span class="confidence-dot ${u?.confidence||p.confidence||""}"></span>${x}
          </div>
        </div>
      </div>
    </ha-card>
  `}(e,i)}
    ${function(e,t){const i=e._chartData,a=i?.prediction||{},n=i?.charge_prediction,s="history-based"===n?.status;if("normal"===a.status&&null!=a.estimated_days_remaining&&a.estimated_days_remaining<=0){const t=e._detailEntity;return U`<ha-alert alert-type="error" title="Battery depleted" style="display:block;margin-bottom:16px">
      This battery has reached 0% and needs replacement.
      <ha-button variant="danger" appearance="outlined" slot="action" style="white-space:nowrap;min-width:max-content" @click=${()=>e._markReplaced(t)}>
        Mark as replaced
      </ha-button>
    </ha-alert>`}if(!t.predictedEmpty&&a.status&&"normal"!==a.status&&("charging"!==a.status||null==i?.charge_prediction?.segment_start_timestamp||s))return U`<ha-alert alert-type="info" title="${s?"Charge estimate based on history":"Why is there no prediction?"}" style="display:block;margin-bottom:16px">
      ${s?"Currently charging. The estimated time to full is based on previous charging cycles since no live charging data is available yet. Once the battery starts reporting increased levels, the estimate will be based on actual charging data.":ye(a.status)||"Unknown reason."}
    </ha-alert>`;return I}(e,i)}
    ${function(e){if(e._chartLoading)return U`
      <ha-card style="margin-bottom:16px">
        <div class="chart-card-header">
          <div class="chart-card-title">Discharge History</div>
        </div>
        <div class="detail-chart" id="jp-chart" style="border:none;border-radius:0;margin:0 16px 16px">
          <div class="loading-state">
            <ha-spinner size="small"></ha-spinner>
            <div>Loading chart data\u2026</div>
          </div>
        </div>
      </ha-card>
    `;const t=e._chartData&&e._chartData.readings&&e._chartData.readings.length>0;if(!t)return U`
      <ha-card style="margin-bottom:16px">
        <div class="chart-card-header">
          <div class="chart-card-title">Discharge History</div>
        </div>
        <div class="detail-chart" id="jp-chart" style="border:none;border-radius:0;margin:0 16px 16px">
          <div class="empty-state">Not enough data yet to display a chart.</div>
        </div>
      </ha-card>
    `;return U`
    <ha-card style="margin-bottom:16px">
      <div class="chart-card-header">
        <div class="chart-card-title">Discharge History</div>
        <div class="chart-range-bar" style="margin-bottom:0">
          ${de.map(t=>U`
              <button
                class="range-pill ${e._chartRange===t.key?"active":""}"
                @click=${()=>{e._chartRange=t.key}}
              >${t.label}</button>
            `)}
        </div>
      </div>
      ${e._chartStale?U`<div class="chart-stale-notice" style="margin:0 16px 8px" @click=${()=>e._loadChartData(e._detailEntity)}>
            <ha-icon icon="mdi:refresh" style="--mdc-icon-size:16px"></ha-icon>
            Data updated \u2014 tap to refresh
          </div>`:I}
      <div class="detail-chart" id="jp-chart" style="border:none;border-radius:0;margin:0 16px 16px"></div>
    </ha-card>
  `}(e)}
    ${function(e,t){const i=e._chartData,a=i?.prediction||{},n=i?.charge_prediction,s=n?.confidence||a.confidence,r={high:"High confidence",medium:"Medium confidence",low:"Low confidence",insufficient_data:"Insufficient data","history-based":"History-based"},o=s?r[s]||`${s} confidence`:"insufficient_data"===a.status?"Insufficient data":a.status||"—";return U`
    <ha-expansion-panel outlined style="margin-bottom:16px">
      <div slot="header" style="display:flex;align-items:center;gap:8px;width:100%">
        <ha-icon icon="mdi:chart-line" style="--mdc-icon-size:20px;color:var(--secondary-text-color)"></ha-icon>
        <span style="flex:1;font-weight:500">Prediction Details</span>
        <span class="jp-badge ${"high"===s?"success":"medium"===s?"warning":"low"===s?"error":"neutral"}">${o}</span>
      </div>
      <div class="pred-detail-grid">
        ${s?U`
          <div title="${we(n||a,i)}">
            <div class="detail-meta-label">Confidence</div>
            <div class="detail-meta-value">
              <span class="confidence-dot ${s}"></span>${r[s]?.replace(" confidence","")||s}
            </div>
          </div>
        `:I}
        ${null!=a.r_squared?U`
          <div title="How well the trend line fits the data. 1.0 = perfect fit, 0.0 = no pattern. Above 0.7 is good, below 0.3 means data is too scattered.">
            <div class="detail-meta-label">R\u00b2</div>
            <div class="detail-meta-value">${a.r_squared.toFixed(3)}</div>
          </div>
        `:I}
        ${null!=a.reliability?(()=>{const e=t.reliability,i=null!==t.daysRemaining||null!==t.hoursRemaining;if(null==e||!i)return I;return U`
            <div title="Prediction reliability: ${e}%. Based on how consistent the discharge pattern has been across recent observations.">
              <div class="detail-meta-label">Reliability</div>
              <div class="detail-meta-value">
                <span class="confidence-dot ${e>=70?"high":e>=40?"medium":"low"}"></span>${e}%
              </div>
            </div>`})():I}
        <div>
          <div class="detail-meta-label">Data Points</div>
          <div class="detail-meta-value">
            ${a.data_points_used>0?a.data_points_used:i?.readings?.length??"—"}${i?.session_count?U` <span style="color:var(--secondary-text-color);font-size:0.85em">(${i.session_count} session${1!==i.session_count?"s":""})</span>`:I}
          </div>
        </div>
        ${t.lastCalculated?U`
          <div>
            <div class="detail-meta-label">Last Calculated</div>
            <div class="detail-meta-value">${fe(1e3*t.lastCalculated,!0)}</div>
          </div>
        `:I}
        ${i?.chemistry?U`
          <div>
            <div class="detail-meta-label">Chemistry</div>
            <div class="detail-meta-value">${Ce[i.chemistry]||i.chemistry}</div>
          </div>
        `:I}
        ${n?.estimated_full_timestamp?U`
          <div>
            <div class="detail-meta-label">Predicted Full</div>
            <div class="detail-meta-value">${fe(1e3*n.estimated_full_timestamp,!0)}</div>
          </div>
        `:t.predictedEmpty?U`
          <div>
            <div class="detail-meta-label">Predicted Empty</div>
            <div class="detail-meta-value">${fe(t.predictedEmpty,me(t))}</div>
          </div>
        `:I}
      </div>
    </ha-expansion-panel>
  `}(e,i)}
    ${function(e){const t=e._detailEntity;if(!t)return I;const i=e._chartData,a=i?.replacement_history||[],n=i?.suspected_replacements||[],s=[...[...a].map(e=>({type:"confirmed",timestamp:e})),...n.map(e=>({type:"suspected",timestamp:e.timestamp,old_level:e.old_level,new_level:e.new_level}))].sort((e,t)=>t.timestamp-e.timestamp);return 0===s.length?I:U`
    <ha-expansion-panel outlined style="margin-bottom:16px">
      <div slot="header" style="display:flex;align-items:center;gap:8px;width:100%">
        <ha-icon icon="mdi:history" style="--mdc-icon-size:20px;color:var(--secondary-text-color)"></ha-icon>
        <span style="flex:1;font-weight:500">Replacement History</span>
        <span class="jp-badge neutral">${s.length}</span>
      </div>
      <div class="expansion-content"><div class="replacement-table">
        <div class="replacement-table-header">
          <span>Date</span>
          <span>Type</span>
          <span></span>
        </div>
        ${s.map(i=>U`
          <div class="replacement-table-row ${i.type}">
            <span>${fe(1e3*i.timestamp,!0)}</span>
            <span>
              ${"confirmed"===i.type?U`
                <ha-icon icon="mdi:battery-sync" style="--mdc-icon-size:16px;color:var(--success-color,#4caf50)"></ha-icon>
                Replaced
              `:U`
                <ha-icon icon="mdi:help-circle-outline" style="--mdc-icon-size:16px;color:var(--warning-color,#ff9800)"></ha-icon>
                Suspected (${Math.round(i.old_level)}% \u2192 ${Math.round(i.new_level)}%)
              `}
            </span>
            <span>
              ${"suspected"===i.type?U`
                <ha-icon-button
                  .path=${le}
                  style="--mdc-icon-button-size:28px;color:var(--success-color,#4caf50)"
                  title="Confirm replacement"
                  @click=${()=>e._confirmSuspectedReplacement(t,i.timestamp)}
                ></ha-icon-button>
                <ha-icon-button
                  .path=${ce}
                  style="--mdc-icon-button-size:28px;color:var(--error-color,#f44336)"
                  title="Not a replacement"
                  @click=${()=>e._denySuspectedReplacement(t,i.timestamp)}
                ></ha-icon-button>
              `:U`
                <ha-icon-button
                  .path=${ce}
                  style="--mdc-icon-button-size:28px;color:var(--secondary-text-color)"
                  title="Remove this replacement"
                  @click=${()=>e._undoReplacementAt(t,i.timestamp)}
                ></ha-icon-button>
              `}
            </span>
          </div>
        `)}
      </div></div>
    </ha-expansion-panel>
  `}(e)}
  `:U`<div class="empty-state">Device not found</div>`}function Te(e){if(e._shoppingLoading)return U`<div class="devices">
      <div class="empty-state">Loading shopping list...</div>
    </div>`;if(!e._shoppingData||!e._shoppingData.groups)return U`<div class="devices">
      <div class="empty-state">
        No shopping data available. Click refresh to load.
      </div>
    </div>`;const{groups:t,total_needed:i}=e._shoppingData;return 0===t.length?U`<div class="devices">
      <div class="empty-state">No battery devices found.</div>
    </div>`:U`
    <div class="shopping-summary">
      <div class="summary-card">
        <div
          class="value"
          style="color:${i>0?"var(--warning-color)":"var(--success-color)"}"
        >
          ${i}
        </div>
        <div class="label">Batteries needed</div>
      </div>
      ${t.filter(e=>e.needs_replacement>0&&"Unknown"!==e.battery_type).map(e=>U`
            <div class="summary-card shopping-need-card">
              <div class="value">${e.needs_replacement}</div>
              <div class="label">${e.battery_type}</div>
            </div>
          `)}
    </div>
    <div class="shopping-groups">
      ${t.map(t=>function(e,t){const i="Unknown"===t.battery_type,a=i?"mdi:help-circle-outline":"mdi:battery",n=!!e._expandedGroups[t.battery_type],s=`${t.battery_count} batter${1!==t.battery_count?"ies":"y"} in ${t.device_count} device${1!==t.device_count?"s":""}${t.needs_replacement>0?` — ${t.needs_replacement} need${1!==t.needs_replacement?"":"s"} replacement`:""}`,r=e._settingsValues?.prediction_horizon??7;return U`
    <ha-expansion-panel
      outlined
      .expanded=${n}
      @expanded-changed=${i=>{const a={...e._expandedGroups};i.detail.expanded?a[t.battery_type]=!0:delete a[t.battery_type],e._expandedGroups=a}}
    >
      <ha-icon slot="leading-icon" icon=${a} style="--mdc-icon-size:20px"></ha-icon>
      <span slot="header" class="shopping-type">${t.battery_type}</span>
      <span slot="secondary">
        ${t.needs_replacement>0?U`<span class="shopping-need-badge">${t.needs_replacement}\u00d7</span> `:I}
        ${s}
      </span>
      <div class="shopping-devices-inner">
        ${t.devices.map(e=>{const t=ge(e.level,null),i=e.is_low||null!==e.days_remaining&&e.days_remaining<=r,a=e.battery_count>1?` (${e.battery_count}×)`:"";return U`
            <div class="shopping-device ${i?"needs-replacement":""}">
              <span class="shopping-device-name"
                >${e.device_name}${a}</span
              >
              <span class="shopping-device-level" style="color:${t}">
                ${he(e.level)}
              </span>
              <span class="shopping-device-days">
                ${null!==e.days_remaining?e.days_remaining+"d":"—"}
              </span>
            </div>
          `})}
      </div>
    </ha-expansion-panel>
  `}(e,t))}
    </div>
    ${t.some(e=>"Unknown"===e.battery_type)?U`<div class="shopping-hint">
          <ha-icon
            icon="mdi:information-outline"
            style="--mdc-icon-size:16px"
          ></ha-icon>
          Devices with unknown battery type can be configured from the Devices tab.
        </div>`:I}
  `}const je=[{key:"critical",min:0,max:10,label:"0–10%",colorVar:"--error-color",mix:"80%"},{key:"warning",min:11,max:50,label:"10–50%",colorVar:"--warning-color",mix:"80%"},{key:"healthy",min:51,max:100,label:"50–100%",colorVar:"--success-color",mix:"80%"}];function De(e){if(!e||e.length<2)return{count:e?.length??0,intervals:[],avgDays:null,accelerating:!1};const t=[...e].sort((e,t)=>e-t),i=[];for(let e=1;e<t.length;e++)i.push((t[e]-t[e-1])/86400);const a=Math.round(i.reduce((e,t)=>e+t,0)/i.length),n=i[i.length-1],s=i.length>1?i.slice(0,-1).reduce((e,t)=>e+t,0)/(i.length-1):a,r=i.length>=2&&n<.5*s;return{count:t.length,intervals:i,avgDays:a,accelerating:r}}function Me(e){const t=e._entities||[],i=function(e){const t={};for(const e of je)t[e.key]=0;let i=0,a=0,n=0,s=0;for(const r of e){if(s++,null==r.level){n++;continue}if(r.isStale){a++;continue}if(r.isRechargeable){i++;continue}const e=Math.ceil(r.level);for(const i of je)if(e>=i.min&&e<=i.max){t[i.key]++;break}}return{buckets:t,rechargeable:i,stale:a,unavailable:n,total:s}}(t);e._fleetData=i;const a=function(e){return e.filter(e=>null!=e.level&&!e.isRechargeable&&null!=e.daysRemaining).sort((e,t)=>e.daysRemaining-t.daysRemaining).slice(0,5)}(t),n=function(e,t){const i=t?.replacement_data||{},a=[];for(const t of e){if(null==t.level||t.isRechargeable)continue;let e=0;const n=i[t.sourceEntity],s=n?.replacement_history?.length??0;null!=t.dischargeRate&&Math.abs(t.dischargeRate)>5?e+=30:null!=t.dischargeRate&&Math.abs(t.dischargeRate)>1&&(e+=15),t.isLow?e+=25:t.level<40&&(e+=10),"cliff"===t.anomaly&&(e+=20),"rapid"===t.anomaly&&(e+=25),"erratic"===t.stability&&(e+=15),s>=3?e+=30:s>=2&&(e+=15),null!=t.daysRemaining&&t.daysRemaining<=7?e+=20:null!=t.daysRemaining&&t.daysRemaining<=30&&(e+=10),e>0&&a.push({entity:t,score:e,replCount:s,replData:n})}return a.sort((e,t)=>t.score-e.score),a.slice(0,3)}(t,e._dashboardData),s=function(e){const t={};for(const i of e){if(null==i.level)continue;let e;if(i.isRechargeable)e="Rechargeable";else{const t=i.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);e=t?t[1].trim():i.batteryType||"Unknown"}t[e]||(t[e]={type:e,devices:[],isRechargeable:"Rechargeable"===e}),t[e].devices.push(i)}const i=Object.values(t).sort((e,t)=>t.devices.length-e.devices.length);for(const e of i){e.buckets={};for(const t of je)e.buckets[t.key]=0;for(const t of e.devices){const i=Math.ceil(t.level);for(const t of je)if(i>=t.min&&i<=t.max){e.buckets[t.key]++;break}}}return i}(t);e._healthByTypeData=s;const r=function(e){let t=0,i=0,a=0,n=0;for(const s of e)null!=s.level&&(s.isRechargeable||(i++,a+=s.level,n++,s.isLow||t++));return{readiness:i>0?Math.round(t/i*100):100,aboveThreshold:t,totalDisposable:i,avgLevel:n>0?Math.round(a/n):0}}(t);return U`
    <div class="jp-dashboard">
      ${function(e,t){const i=t.readiness>=80?"var(--success-color, #43a047)":t.readiness>=50?"var(--warning-color, #ffa726)":"var(--error-color, #db4437)";return U`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Overview</span>
        <span class="jp-badge neutral">${e.total} devices</span>
      </div>
      <div id="jp-fleet-chart" style="padding:4px 8px"></div>
      <div class="db-overview-stats">
        <div class="db-stat">
          <span class="db-stat-value" style="color:${i}">${t.readiness}%</span>
          <span class="db-stat-label">Fleet Readiness</span>
          <span class="db-stat-sub">${t.aboveThreshold} of ${t.totalDisposable} disposable above threshold</span>
        </div>
        <div class="db-stat">
          <span class="db-stat-value" style="color:${t.avgLevel<=10?"var(--error-color, #db4437)":t.avgLevel<=50?"var(--warning-color, #ffa726)":"var(--success-color, #43a047)"}">${t.avgLevel}%</span>
          <span class="db-stat-label">Average Level</span>
          <span class="db-stat-sub">Across all disposable devices</span>
        </div>
      </div>
    </ha-card>
  `}(i,r)}
      <div class="db-bottom-row">
        ${function(e,t){if(!t.length)return U`
      <ha-card>
        <div class="db-card-header">
          <span class="db-card-title">Shortest Life Remaining</span>
          <span class="jp-badge neutral">No predictions yet</span>
        </div>
        <div class="empty-state" style="padding:24px">No devices have discharge predictions yet.</div>
      </ha-card>
    `;return U`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Shortest Life Remaining</span>
      </div>
      <div class="card-content" style="padding-top:0">
        <table class="att-table">
          <thead><tr><th>Device</th><th>Level</th><th>Remaining</th></tr></thead>
          <tbody>
            ${t.map(t=>{const i=pe(t.level),a=ge(t.level,t.threshold??20),n=t.daysRemaining<=1?Math.round(24*t.daysRemaining)+"h":Math.round(10*t.daysRemaining)/10+"d";return U`
                <tr class="att-row" @click=${()=>e._openDetail(t.sourceEntity)}>
                  <td class="name-cell">${t.name}</td>
                  <td>
                    <div class="level-indicator">
                      <span style="color:${a};font-weight:500">${i}%</span>
                      <div class="level-bar">
                        <div class="level-bar-fill" style="width:${i}%;background:${a}"></div>
                      </div>
                    </div>
                  </td>
                  <td class="dim">${n}</td>
                </tr>
              `})}
          </tbody>
        </table>
      </div>
    </ha-card>
  `}(e,a)}
        ${o=s,U`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Health by Battery Type</span>
        <span class="jp-badge primary">${o.length} type${1!==o.length?"s":""}</span>
      </div>
      <div class="card-content">
        <div class="type-health-list">
          ${o.map(e=>U`
            <div class="type-health-row">
              <span class="th-type" style="color:${e.isRechargeable?"var(--info-color, #039be5)":"var(--primary-color, #03a9f4)"}">${e.type}</span>
              <div id="jp-type-chart-${ze(e.type)}" class="th-chart-container"></div>
              <span class="th-count">${e.devices.length}</span>
            </div>
          `)}
        </div>
      </div>
    </ha-card>
  `}
      </div>
      ${n.length?U`
        <div class="db-card-header" style="padding:0;border:none">
          <span class="db-card-title">Requires Attention</span>
          <span class="jp-badge warning">${n.length} device${1!==n.length?"s":""}</span>
        </div>
        <div class="db-mid-row">
          ${n.map(t=>function(e,{entity:t,replCount:i,replData:a}){const n=ge(t.level,t.threshold??20),s=pe(t.level),r=ke(t),o=null!=t.dischargeRate?be(t):"—",l=null!=t.daysRemaining?t.daysRemaining<=1?Math.round(24*t.daysRemaining)+" hours":Math.round(10*t.daysRemaining)/10+" days":null!=t.hoursRemaining?t.hoursRemaining+" hours":"Unknown",c=null!=t.daysRemaining&&t.daysRemaining<=7?"var(--error-color, #db4437)":"";let d=i>0?`${i}×`:"0";const h=a?.replacement_history||[];if(h.length>=2){if(De(h).avgDays){d=`${i}× in ${Math.round((Date.now()/1e3-h[0])/2592e3)}mo`}}const p=i>=3?"var(--error-color, #db4437)":i>=2?"var(--warning-color, #ffa726)":"",u=null!=t.reliability?`${t.reliability}%`:"—",g=[];t.isLow&&g.push({label:"LOW",cls:"error"});"cliff"===t.anomaly&&g.push({label:"CLIFF DROP",cls:"error"});"rapid"===t.anomaly&&g.push({label:"RAPID",cls:"error"});"erratic"===t.stability&&g.push({label:"ERRATIC",cls:"warning"});"flat"===t.predictionStatus&&g.push({label:"FLAT",cls:"neutral"});"normal"!==t.predictionStatus||t.isLow||"rapid"===t.anomaly||g.push({label:"NORMAL DISCHARGE",cls:"neutral"});const m=function(e,t,i){if("cliff"===e.anomaly)return"Non-linear cliff discharge. Reports stable level until abrupt collapse. Actual remaining life unpredictable — could be days or weeks. Prediction model unreliable for this device.";if("rapid"===e.anomaly&&t>=3){const a=De(i);return`Eating batteries at an alarming rate. ${t} ${e.batteryType||"battery"} cells consumed${a.accelerating?" with shrinking intervals":""}. Either the device's radio advertising interval is too aggressive or the hardware is defective.`}if("rapid"===e.anomaly)return"Discharge rate is significantly elevated. Investigate hardware, radio environment, or excessive polling interval.";if(e.isLow&&null!=e.daysRemaining){return`At end-of-life. ${e.batteryType||"battery"} replacement needed soon. ${e.daysRemaining<=1?"Less than a day remaining.":`Predicted empty in ${Math.round(e.daysRemaining)} days.`}`}if(e.isLow)return"Battery is below the low threshold. Replacement recommended.";if("erratic"===e.stability)return"Readings fluctuate irregularly. Possible intermittent connectivity or faulty voltage ADC.";if(null!=e.daysRemaining&&e.daysRemaining<=7)return`Predicted to die within ${Math.round(e.daysRemaining)} days. Replace soon.`;return"Warrants monitoring — review the detail chart for discharge pattern."}(t,i,h),v=t.threshold??20;return U`
    <ha-card class="wanted-card" @click=${()=>e._openDetail(t.sourceEntity)}>
      <div class="wanted-top">
        <div class="wanted-identity">
          <div class="wanted-name">${t.name}</div>
          ${r?U`<div class="wanted-sub">${r}</div>`:I}
        </div>
        <div class="wanted-level" style="color:${n}">${s}%</div>
      </div>
      <div class="wanted-stats">
        <div class="ws"><div class="ws-label">Battery</div><div class="ws-value">${t.batteryType||"Unknown"}</div></div>
        <div class="ws"><div class="ws-label">Remaining</div><div class="ws-value" style="color:${c}">${l}</div></div>
        <div class="ws"><div class="ws-label">Drain Rate</div><div class="ws-value">${o}</div></div>
        <div class="ws"><div class="ws-label">Replacements</div><div class="ws-value" style="color:${p}">${d}</div></div>
        <div class="ws"><div class="ws-label">Reliability</div><div class="ws-value">${u}</div></div>
        <div class="ws"><div class="ws-label">Anomaly</div><div class="ws-value"${t.anomaly&&"normal"!==t.anomaly?' style="color:var(--error-color, #db4437)"':""}>${"cliff"===t.anomaly?"Cliff Drop":"rapid"===t.anomaly?"Rapid":"erratic"===t.stability?"Erratic":"None"}</div></div>
      </div>
      <div class="wanted-gauge">
        <div class="gauge-label">Battery Level</div>
        <div class="gauge-track">
          <div class="gauge-fill" style="width:${s}%;background:${s<=v?"var(--error-color, #db4437)":`linear-gradient(90deg, var(--error-color, #db4437), ${n})`}"></div>
          <div class="gauge-threshold" style="left:${v}%"></div>
        </div>
        <div class="gauge-axis"><span>0%</span><span>threshold</span><span>100%</span></div>
      </div>
      ${g.length?U`
        <div class="wanted-badges">
          ${g.map(e=>U`<span class="jp-badge ${e.cls}">${e.label}</span>`)}
        </div>
      `:I}
      <div class="wanted-verdict">
        <strong>Verdict:</strong> ${m}
      </div>
    </ha-card>
  `}(e,t))}
        </div>
      `:I}
    </div>
  `;var o}function ze(e){return e.replace(/[^a-z0-9]/gi,"_").toLowerCase()}function He(e,t,{categories:i,series:a,total:n,xMax:s,clickHandler:r},o,l){const c=e.shadowRoot?.getElementById(t);if(!c)return;const d=(t,i)=>Ee(e,t,i),h=d("--secondary-text-color","#999"),p=d("--ha-card-background",d("--card-background-color","#fff")),u=d("--primary-text-color","#212121"),g={xAxis:{type:"value",show:!1,max:s||"dataMax"},yAxis:{type:"category",show:!1,data:[""]},legend:l?{show:!0,bottom:0,left:"center",textStyle:{color:h,fontSize:11},itemWidth:10,itemHeight:10,itemGap:14,icon:"roundRect",selectedMode:!0}:{show:!1},tooltip:{trigger:"item",backgroundColor:p,borderColor:d("--divider-color","rgba(0,0,0,0.12)"),textStyle:{color:u,fontSize:12},formatter:e=>`${e.seriesName}: ${e.value} device${1!==e.value?"s":""}`},grid:{left:8,right:8,top:6,bottom:l?40:6,containLabel:!1}};let m=e[o];m&&c.contains(m)||(m=document.createElement("ha-chart-base"),c.innerHTML="",c.appendChild(m),e[o]=m),m.hass=e._hass;const v=l?"90px":"32px";m.height=v,m.style.height=v,m.style.display="block",m.style.cursor="pointer",!m._jpClickBound&&r&&(m.addEventListener("chart-click",e=>{const t=e.detail?.seriesName;if(!t)return;const a=i.find(e=>e.name===t);a&&r(a)}),m._jpClickBound=!0),requestAnimationFrame(()=>{m.data=a,m.options=g})}function Pe(e,t,i){const a=(t,i)=>Ee(e,t,i),n=a("--primary-text-color","#212121"),s=je.map(e=>{const i=t.buckets[e.key],n=t.isRechargeable?a("--info-color","#039be5"):a(e.colorVar,"#999"),s=t.isRechargeable?.25+e.min/100*.35:parseFloat(e.mix)/100;return{name:e.label,value:i,color:n,opacity:s,levelMin:e.min,levelMax:e.max}}).filter(e=>e.value>0),r=s.map(e=>({name:e.name,type:"bar",stack:"type",data:[e.value],itemStyle:{color:e.color,opacity:e.opacity,borderRadius:0},barWidth:"80%",label:{show:e.value>0,position:"inside",formatter:`${e.value}`,fontSize:10,fontWeight:500,color:n},emphasis:{focus:"series"}}));return{categories:s,series:r,total:t.devices.length,xMax:i,clickHandler:i=>{e._navigateToDevicesWithLevelFilter(i.levelMin,i.levelMax,{batteryType:{value:[t.type]}})}}}const Fe=async function(e){if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(e=>setTimeout(e,100))}catch(e){}if(!customElements.get("ha-chart-base"))return;e._fleetData&&He(e,"jp-fleet-chart",function(e){const t=e._fleetData,i=(t,i)=>Ee(e,t,i),a=i("--primary-text-color","#212121"),n=[...je.map(e=>({name:e.label,value:t.buckets[e.key],color:i(e.colorVar,"#999"),opacity:parseFloat(e.mix)/100,levelMin:e.min,levelMax:e.max})),{name:"Rechargeable",value:t.rechargeable,color:i("--info-color","#039be5"),opacity:.55,filter:"rechargeable"},{name:"Stale",value:t.stale,color:i("--disabled-text-color","#999"),opacity:.5,filter:"stale"},{name:"Unavailable",value:t.unavailable,color:i("--disabled-text-color","#999"),opacity:.3,filter:"unavailable"}],s=n.map(e=>({name:e.name,type:"bar",stack:"fleet",data:[e.value],itemStyle:{color:e.color,opacity:e.opacity,borderRadius:0},barWidth:"60%",label:{show:e.value>0,position:"inside",formatter:`${e.value}`,fontSize:11,fontWeight:500,color:a},emphasis:{focus:"series"}})),r=t=>{null!=t.levelMin?e._navigateToDevicesWithLevelFilter(t.levelMin,t.levelMax):"rechargeable"===t.filter?e._navigateToDevicesWithLevelFilter(null,null,{battery:{value:["rechargeable"]}}):"stale"===t.filter?e._navigateToDevicesWithLevelFilter(null,null,{status:{value:["stale"]}}):"unavailable"===t.filter&&e._navigateToDevicesWithLevelFilter(null,null,{status:{value:["unavailable"]}})};return{categories:n,series:s,total:t.total,clickHandler:r}}(e),"_fleetChartEl",!0);const t=e._healthByTypeData;if(t&&t.length){const i=Math.max(...t.map(e=>e.devices.length));for(const a of t)He(e,`jp-type-chart-${ze(a.type)}`,Pe(e,a,i),`_typeChart_${ze(a.type)}`,!1)}};function Ve(e,t,{title:i,preamble:a}){const n=document.createElement("ha-dialog");n.open=!0,n.headerTitle=i,e.shadowRoot.appendChild(n);const s=()=>{n.open=!1,n.remove()},r=document.createElement("div");r.innerHTML=`\n    ${a}\n    <ha-expansion-panel outlined style="margin: 8px 0">\n      <span slot="header">Advanced: set custom date</span>\n      <div style="padding: 8px 0">\n        <p style="margin-top:0; color:var(--secondary-text-color); font-size:0.9em">\n          Register a past battery replacement by selecting the date and time it occurred.</p>\n        <input type="datetime-local" class="jp-datetime-input"\n          style="width:100%; padding:8px; border:1px solid var(--divider-color, #ddd);\n                 border-radius:4px; background:var(--card-background-color, #fff);\n                 color:var(--primary-text-color); font-size:14px; box-sizing:border-box" />\n      </div>\n    </ha-expansion-panel>\n    <div class="jp-dialog-actions">\n      <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n      <ha-button class="jp-dialog-confirm">Mark as replaced</ha-button>\n    </div>\n  `,n.appendChild(r),r.querySelector(".jp-dialog-cancel").addEventListener("click",s),r.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{const i=r.querySelector(".jp-datetime-input");let a;i&&i.value&&(a=new Date(i.value).getTime()/1e3),s(),e._doMarkReplaced(t,a)})}function Ne(e,{title:t,bodyHtml:i,onConfirm:a,confirmLabel:n,confirmVariant:s}){const r=document.createElement("ha-dialog");r.open=!0,r.headerTitle=t,e.shadowRoot.appendChild(r);const o=()=>{r.open=!1,r.remove()},l=document.createElement("div");l.innerHTML=`\n    ${i}\n    <div class="jp-dialog-actions">\n      <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n      <ha-button class="jp-dialog-confirm" ${s?`variant="${s}"`:""}>${n||"Confirm"}</ha-button>\n    </div>\n  `,r.appendChild(l),l.querySelector(".jp-dialog-cancel").addEventListener("click",o),l.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{o(),a()})}customElements.define("juice-patrol-panel",class extends se{static get properties(){return{narrow:{type:Boolean},_entities:{state:!0},_activeView:{state:!0},_settingsOpen:{state:!0},_settingsValues:{state:!0},_settingsDirty:{state:!0},_shoppingData:{state:!0},_shoppingLoading:{state:!0},_detailEntity:{state:!0},_chartData:{state:!0},_chartLoading:{state:!0},_chartStale:{state:!0},_flashGeneration:{state:!0},_refreshing:{state:!0},_ignoredEntities:{state:!0},_chartRange:{state:!0},_filters:{state:!0},_dashboardData:{state:!0},_dashboardLoading:{state:!0}}}constructor(){super(),this._hass=null,this._panel=null,this._hassInitialized=!1,this._entities=[],this._entityList=[],this._entityHash="",this._activeView="devices",this._settingsOpen=!1,this._settingsValues={},this._settingsDirty=!1,this._shoppingData=null,this._shoppingLoading=!1,this._detailEntity=null,this._chartData=null,this._chartLoading=!1,this._chartStale=!1,this._chartEl=null,this._chartLastLevel=null,this._chartLastPredictedEmpty=null,this._flashGeneration=0,this._ignoredEntities=null,this._chartRange="auto",this._filters={status:{value:["active","low"]}},this._dashboardData=null,this._dashboardLoading=!1,this._sorting={column:"level",direction:"asc"},this._flashCleanupTimer=null,this._refreshTimer=null,this._entityMap=new Map,this._prevLevels=new Map,this._recentlyChanged=new Map,this._cachedColumns=null,this._refreshing=!1,this._expandedGroups={}}set hass(e){const t=this._hass?.connection;this._hass=e;const i=!this._hassInitialized,a=!i&&e?.connection&&e.connection!==t;this._processHassUpdate(i||a),this._hassInitialized=!0}get hass(){return this._hass}set panel(e){this._panel=e}get panel(){return this._panel}get _basePath(){return`/${this._panel?.url_path||"juice-patrol"}`}connectedCallback(){super.connectedCallback(),this.requestUpdate(),this._escapeHandler=e=>{"Escape"===e.key&&this._closeOverlays()},window.addEventListener("keydown",this._escapeHandler),this._popstateHandler=()=>{this._syncViewFromUrl()},window.addEventListener("popstate",this._popstateHandler),this._locationChangedHandler=()=>{this._syncViewFromUrl()},window.addEventListener("location-changed",this._locationChangedHandler),this._visibilityHandler=()=>{if("visible"===document.visibilityState&&this._hass){if(this._processHassUpdate(!1),"detail"===this._activeView&&this._detailEntity){const e=3e5,t=this._chartData?.last_calculated?Date.now()-1e3*this._chartData.last_calculated:1/0;this._chartLoading=!1,t>e&&setTimeout(()=>this._loadChartData(this._detailEntity),500)}"shopping"===this._activeView&&this._loadShoppingList(),"dashboard"===this._activeView&&(this._shoppingData||this._loadShoppingList(),this._loadDashboardData())}},document.addEventListener("visibilitychange",this._visibilityHandler)}disconnectedCallback(){super.disconnectedCallback();for(const e of["_flashCleanupTimer","_refreshTimer"])this[e]&&(clearTimeout(this[e]),this[e]=null);this._escapeHandler&&(window.removeEventListener("keydown",this._escapeHandler),this._escapeHandler=null),this._popstateHandler&&(window.removeEventListener("popstate",this._popstateHandler),this._popstateHandler=null),this._locationChangedHandler&&(window.removeEventListener("location-changed",this._locationChangedHandler),this._locationChangedHandler=null),this._visibilityHandler&&(document.removeEventListener("visibilitychange",this._visibilityHandler),this._visibilityHandler=null),this._detachScrollTracker()}firstUpdated(){this._syncViewFromUrl();const e=new URLSearchParams(window.location.search).get("entity");e&&(this._highlightEntity=e)}_syncViewFromUrl(){const e=window.location.pathname,t=`${this._basePath}/detail/`;if(e.startsWith(t)){const i=decodeURIComponent(e.slice(t.length));return i&&i!==this._detailEntity&&(this._detailEntity=i,this._chartData=null,this._chartEl=null,this._loadChartData(i)),void(this._activeView="detail")}return e===this._basePath||e===`${this._basePath}/`||e===`${this._basePath}/dashboard`||e===`${this._basePath}/dashboard/`?("detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null,this._chartRetried=!1),"dashboard"!==this._activeView&&(this._activeView="dashboard",this._shoppingData||this._loadShoppingList(),this._loadDashboardData()),void(this._entities=this._entityList)):e===`${this._basePath}/shopping`||e===`${this._basePath}/shopping/`?("detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null,this._chartRetried=!1),"shopping"!==this._activeView&&(this._activeView="shopping",this._loadShoppingList()),void(this._entities=this._entityList)):("detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null,this._chartRetried=!1),this._activeView="devices",void(this._entities=this._entityList))}updated(e){if((e.has("_chartData")||e.has("_chartRange"))&&this._chartData&&requestAnimationFrame(()=>async function(e,t){const i=e.shadowRoot.getElementById("jp-chart");if(!i||!t||!t.readings||0===t.readings.length)return;if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(e=>setTimeout(e,100))}catch(e){console.warn("Juice Patrol: loadCardHelpers failed",e)}if(!customElements.get("ha-chart-base"))return void(i.innerHTML='<div class="empty-state">Chart component not available</div>');const a=(t,i)=>Ee(e,t,i),n=a("--primary-color","#03a9f4"),s=a("--warning-color","#ffa726"),r=a("--error-color","#db4437"),o=a("--success-color","#4caf50");a("--secondary-text-color","#999");const l=a("--secondary-text-color","#999"),c=a("--divider-color","rgba(0,0,0,0.12)"),d=a("--ha-card-background",a("--card-background-color","#fff")),h=a("--primary-text-color","#212121"),p=a("--primary-text-color","#212121"),u=t.readings,g=t.all_readings||u,m=t.prediction,v=t.threshold,y=m.t0??t.first_reading_timestamp,b=g.slice().sort((e,t)=>e.t-t.t).filter((e,t,i)=>0===t||e.t>i[t-1].t).map(e=>[1e3*e.t,e.v]),f=t.charge_prediction,_="charging"===t.charging_state?.toLowerCase()||"charging"===t.prediction?.status,x=f&&f.estimated_full_timestamp,w=!new Set(["idle","flat","single_level","insufficient_data","insufficient_range","noisy","charging"]).has(m.status);let $=[];if(w&&m.prediction_curve&&m.prediction_curve.length>=2){const e=!_&&"normal"===m.status,t=Date.now(),i=m.estimated_empty_timestamp&&1e3*m.estimated_empty_timestamp-t<31536e7;for(const[a,n]of m.prediction_curve){if((!e||!i)&&a>t)break;$.push([a,Math.max(0,Math.min(100,n))])}}else if(w&&null!=m.slope_per_day&&null!=m.intercept&&null!=y){const e=e=>{const t=(e-y)/86400;return m.slope_per_day*t+m.intercept},t=u[0].t,i=Date.now()/1e3,a=!_&&"normal"===m.status;let n=i;if(a&&m.slope_per_day<0){const e=y+(0-m.intercept)/m.slope_per_day*86400;e>i&&e-i<31536e4&&(n=Math.min(e,i+31536e3))}for(const s of[t,i,...a?[n]:[]])$.push([1e3*s,Math.max(0,Math.min(100,e(s)))])}const k=1e3*u[0].t,S=b[0]?.[0]||Date.now(),R=k<S?S:k,E=Date.now();let L;if(_&&f&&null!=f.segment_start_timestamp){const e=f.segment_start_level,i=t.level,a=x?f.slope_per_hour:i>e&&E/1e3-f.segment_start_timestamp>0?(i-e)/((E/1e3-f.segment_start_timestamp)/3600):0;if(a>0){const e=x?1e3*f.estimated_full_timestamp:E+(100-i)/a*36e5;L=e+.1*(e-R)}else L=E+.2*(E-R)}else L=_?E+.2*(E-R):$.length?$[$.length-1][0]:b[b.length-1]?.[0]||E;const C={"1d":864e5,"1w":6048e5,"1m":2592e6,"3m":7776e6,"6m":15552e6,"1y":31536e6};let A,T;const j=e._chartRange||"auto";if("auto"===j)A=R,T=L;else if("all"===j){const e=g.length?1e3*g[0].t:R,t=m.estimated_empty_timestamp?1e3*m.estimated_empty_timestamp:null,i=$.length?$[$.length-1][0]:E;A=Math.min(e,R),T=Math.max(i,t||0,L)}else{const e=C[j]||2592e6;A=E-e;const t=$.length?$[$.length-1][0]:E;T=Math.max(E+e,t)}const D=[];if(t.is_rechargeable&&g.length>=3){const e=[];let t=0;for(let i=1;i<g.length;i++){const a=g[i].v-g[i-1].v;a>1?(-1===t&&e.push({type:"min",idx:i-1,t:g[i-1].t,v:g[i-1].v}),t=1):a<-1&&(1===t&&e.push({type:"max",idx:i-1,t:g[i-1].t,v:g[i-1].v}),t=-1)}if(_&&1===t&&g.length>0){const t=g[g.length-1];e.push({type:"max",idx:g.length-1,t:t.t,v:t.v})}for(let t=0;t<e.length-1;t++)"min"===e[t].type&&"max"===e[t+1].type&&e[t+1].v-e[t].v>=10&&D.push([{xAxis:1e3*e[t].t},{xAxis:1e3*e[t+1].t}])}const M=[],z=[];for(let e=0;e<b.length;e++){const[t,i]=b[e],a=i<=v;if(M.push(a?[t,null]:[t,i]),z.push(a?[t,i]:[t,null]),e>0){const[n,s]=b[e-1];if(s<=v!==a){const e=n+(v-s)/(i-s)*(t-n);M.splice(-1,0,[e,v]),z.splice(-1,0,[e,v])}}}const H=b.length<=50,P=[{name:"Battery Level",type:"line",data:M,smooth:!1,symbol:H?"circle":"none",symbolSize:4,connectNulls:!1,lineStyle:{width:2,color:n},itemStyle:{color:n},areaStyle:{color:n,opacity:.07}},{name:"Battery Level",type:"line",data:z,smooth:!1,symbol:H?"circle":"none",symbolSize:4,connectNulls:!1,lineStyle:{width:2,color:r},itemStyle:{color:r},areaStyle:{color:r,opacity:.1}}];if(D.length>0)for(let e=0;e<D.length;e++){const t=D[e][0].xAxis,i=D[e][1].xAxis;P.push({name:0===e?"Charging":`Charging ${e+1}`,type:"line",data:[[t,100],[i,100]],symbol:"none",lineStyle:{width:0},areaStyle:{color:"rgba(76, 175, 80, 0.18)",origin:0},silent:!0,tooltip:{show:!1}})}$.length>0&&P.push({name:"Discharge prediction",type:"line",data:$,smooth:!1,symbol:"none",lineStyle:{width:2,type:"dashed",color:s},itemStyle:{color:s}});const F=(e,t)=>({show:!0,formatter:e,position:"left",fontSize:10,color:t,distance:6,backgroundColor:"rgba(0,0,0,0.6)",borderRadius:3,padding:[3,6]});if(_&&f&&null!=f.segment_start_timestamp){const e=f.segment_start_timestamp,i=f.segment_start_level,a=Date.now()/1e3,n=t.level,s="history-based"===f.status;let r=x?f.slope_per_hour:null;if((null==r||r<=0)&&n>i){const t=(a-e)/3600;t>0&&(r=(n-i)/t)}if(r>0){const t=(100-n)/r,l=x?f.estimated_full_timestamp:a+3600*t,c=t=>r*((t-e)/3600)+i,d=s?[[1e3*a,n],[1e3*l,100]]:[e,a,l].map(e=>[1e3*e,Math.max(0,Math.min(100,c(e)))]),h=new Date(1e3*l).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"}),p=d[d.length-1];d[d.length-1]={value:p,symbol:"diamond",symbolSize:6,label:F(`Est. full ${h}`,o)},P.push({name:"Charge prediction",type:"line",data:d,smooth:!1,symbol:"none",lineStyle:{width:2,type:s?"dotted":"dashed",color:o},itemStyle:{color:o}})}}let V=null;if("normal"===m.status&&null!=m.estimated_empty_timestamp&&!_)if(m.prediction_curve&&m.prediction_curve.length>=2)for(let e=1;e<m.prediction_curve.length;e++){const[t,i]=m.prediction_curve[e-1],[a,n]=m.prediction_curve[e];if(i>=v&&n<v){V=t+(i-v)/(i-n)*(a-t),V<=Date.now()&&(V=null);break}}else if(null!=m.slope_per_day&&m.slope_per_day<0&&null!=m.intercept&&null!=y){const e=y+(v-m.intercept)/m.slope_per_day*86400;1e3*e>Date.now()&&(V=1e3*e)}if($.length>0&&!m.prediction_curve&&null!=m.slope_per_day&&null!=m.intercept&&null!=y){const e=e=>{const t=(e/1e3-y)/86400;return m.slope_per_day*t+m.intercept},t=m.estimated_empty_timestamp?1e3*m.estimated_empty_timestamp:null,i=$[$.length-1][0];V&&V>i-1&&V<(t||1/0)&&$.push([V,Math.max(0,Math.min(100,e(V)))]),t&&t>i+1&&$.push([t,Math.max(0,e(t))])}if(V){const e=new Date(V),t=(V-Date.now())/36e5<=48?e.toLocaleString(void 0,{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):e.toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"});P.push({name:"Low battery",type:"line",data:[{value:[V,0],symbol:"none",symbolSize:0},{value:[V,v],symbol:"diamond",symbolSize:6,label:F(`Low ${t}`,r)}],lineStyle:{width:1,type:"dotted",color:r},itemStyle:{color:r},tooltip:{show:!1}})}const N=t.replacement_history||[],U=t.suspected_replacements||[],O=a("--success-color","#4caf50"),I=[...N.map(e=>({ts:1e3*e,type:"confirmed"})),...U.map(e=>({ts:1e3*e.timestamp,type:"suspected"}))].sort((e,t)=>e.ts-t.ts);if(I.length>0){const e=.05*((T||I[I.length-1].ts)-(A||I[0].ts)),t=[100,85,70];let i=0;for(let a=0;a<I.length;a++){const{ts:n,type:s}=I[a],r=a>0?I[a-1].ts:null;i=null!=r&&n-r<e?i+1:0;const o=t[i%t.length],l=new Date(n).toLocaleDateString(void 0,{day:"numeric",month:"short"}),c="confirmed"===s,d=c?O:"#ab47bc",h=F(c?`Replaced ${l}`:`Replaced? ${l}`,d);h.position="right",P.push({name:c?0===a?"Replaced":`Replaced ${a+1}`:0===a?"Suspected":`Suspected ${a+1}`,type:"line",data:[{value:[n,0],symbol:"none",symbolSize:0},{value:[n,o],symbol:"diamond",symbolSize:6,label:h}],lineStyle:{width:1,type:c?"dashed":"dotted",color:d},itemStyle:{color:d},tooltip:{show:!1}})}}const W=e.narrow||i.clientWidth<500,B={xAxis:{type:"time",axisLabel:{color:l,fontSize:W?10:12},axisLine:{lineStyle:{color:c}},splitLine:{lineStyle:{color:c}}},yAxis:{type:"value",min:0,max:100,axisLabel:{formatter:"{value}%",color:l},axisLine:{lineStyle:{color:c}},splitLine:{lineStyle:{color:c}}},tooltip:{trigger:"axis",backgroundColor:d,borderColor:c,textStyle:{color:h},formatter:e=>{if(!e||0===e.length)return"";const t=new Date(e[0].value[0]);let i=`<b>${t.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})+" "+t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</b><br>`;const a=new Set;for(const t of e){if(t.seriesName?.startsWith("Replaced")||"Low battery"===t.seriesName)continue;if(null==t.value[1])continue;if(a.has(t.seriesName))continue;a.add(t.seriesName);const e="number"==typeof t.value[1]?t.value[1].toFixed(1)+"%":"—";i+=`${t.marker} ${t.seriesName}: ${e}<br>`}return i}},legend:{bottom:0,left:"center",data:["Battery Level","Discharge prediction"],textStyle:{color:p,fontSize:W?10:12},itemGap:W?6:12,selected:{"Discharge prediction":!_,"Charge prediction":_}},dataZoom:[{type:"inside",xAxisIndex:0,filterMode:"weakFilter",startValue:A,endValue:T}],grid:{left:W?4:12,right:W?4:12,top:8,bottom:W?32:28,containLabel:!0}};let q=e._chartEl;q&&i.contains(q)||(q=document.createElement("ha-chart-base"),i.innerHTML="",i.appendChild(q),e._chartEl=q),q.hass=e._hass,q.height=W?"300px":"400px",requestAnimationFrame(()=>{q.data=P,q.options=B})}(this,this._chartData)),"dashboard"===this._activeView&&this._fleetData&&(e.has("_entities")||e.has("_activeView"))){const t=e.has("_activeView"),i=JSON.stringify(this._fleetData)+JSON.stringify((this._healthByTypeData||[]).map(e=>({type:e.type,n:e.devices.length,b:e.buckets})));(t||i!==this._lastFleetHash)&&(this._lastFleetHash=i,requestAnimationFrame(()=>Fe(this)))}e.has("_entities")&&(!this._highlightApplied&&this._highlightEntity&&this._applyDeepLinkHighlight(),"detail"===this._activeView&&this._detailEntity&&!this._entityMap.get(this._detailEntity)&&this._closeDetail()),e.has("_activeView")&&("devices"===this._activeView?this._attachScrollTracker():this._detachScrollTracker())}_processHassUpdate(e){if(!this._hass)return;const t=this._entityHash;this._updateEntities();if(this._entityHash!==t&&(this._entityMap=new Map(this._entityList.map(e=>[e.sourceEntity,e])),"detail"!==this._activeView&&(this._entities=this._entityList)),e&&(this._loadConfig(),this._loadIgnored()),"detail"===this._activeView&&this._detailEntity&&!this._chartLoading&&this._chartData){const e=this._getDevice(this._detailEntity);if(e&&!e.isStale){const t=e.predictedEmpty?new Date(e.predictedEmpty).getTime():null,i=this._chartLastPredictedEmpty;this._isPredictionSignificantlyChanged(i,t)&&(this._chartStale=!0)}}}_updateEntities(){if(!this._hass)return;const e=this._hass.states,t=new Map;for(const[i,a]of Object.entries(e)){const e=a.attributes||{},n=e.source_entity;if(!n)continue;if(i.includes("lowest_battery")||i.includes("attention_needed"))continue;if(!(i.includes("_discharge_rate")||i.includes("_days_remaining")||i.includes("_predicted_empty")||i.includes("_battery_low")||i.includes("_stale")))continue;t.has(n)||t.set(n,{sourceEntity:n,name:e.source_name||n,level:null,dischargeRate:null,dischargeRateHour:null,daysRemaining:null,hoursRemaining:null,predictedEmpty:null,isLow:!1,isStale:!1,batteryType:null,batteryTypeSource:null,threshold:null,lastReplaced:null,replacementPending:!1,isRechargeable:!1,rechargeableReason:null,chargingState:null,chemistry:null,chemistryOverride:null,anomaly:null,dropSize:null,stability:null,stabilityCv:null,meanLevel:null,predictionStatus:null,reliability:null,lastCalculated:null,manufacturer:null,model:null,platform:null,_searchText:"",_statusFilter:"active"});const s=t.get(n);if(i.includes("_discharge_rate")){const t=parseFloat(a.state);s.dischargeRate=isNaN(t)?null:t,s.dischargeRateHour=e.discharge_rate_hour??null,s.level=null!=e.level?parseFloat(e.level):null,s.batteryType=e.battery_type||null,s.batteryTypeSource=e.battery_type_source||null,s.threshold=null!=e.threshold?parseFloat(e.threshold):null,s.lastReplaced=e.last_replaced??null,s.replacementPending=e.replacement_pending??!1,s.isRechargeable=e.is_rechargeable??!1,s.rechargeableReason=e.rechargeable_reason??null,s.chargingState=e.charging_state??null,s.chemistry=e.chemistry??null,s.chemistryOverride=e.chemistry_override??null,s.anomaly=e.discharge_anomaly??null,s.dropSize=e.drop_size??null,s.stability=e.stability??null,s.stabilityCv=e.stability_cv??null,s.meanLevel=e.mean_level??null,s.lastCalculated=e.last_calculated??null,s.manufacturer=e.manufacturer??null,s.model=e.model??null,s.platform=e.platform??null}else if(i.includes("_days_remaining")){const t=parseFloat(a.state);s.daysRemaining=isNaN(t)?null:t,s.reliability=e.reliability??null,s.predictionStatus=e.status||null,s.hoursRemaining=e.hours_remaining??null}else i.includes("_predicted_empty")?s.predictedEmpty="unknown"!==a.state&&"unavailable"!==a.state?a.state:null:i.includes("_battery_low")?s.isLow="on"===a.state:i.includes("_stale")&&(s.isStale="on"===a.state)}const i=this._ignoredEntities?new Set(this._ignoredEntities):null,a=[];let n=!1;for(const[s,r]of t){if(i&&i.has(s))continue;const t=[r.name,s,r.batteryType,r.manufacturer,r.model,r.platform];r._searchText=t.filter(Boolean).join(" ").toLowerCase(),r._levelSort=null!==r.level?r.level:999,null===r.level||"unavailable"===e[s]?.state?r._statusFilter="unavailable":r.isStale?r._statusFilter="stale":r.isLow?r._statusFilter="low":r._statusFilter="active";const o=this._prevLevels.get(s);void 0!==o&&null!==r.level&&r.level!==o&&(this._recentlyChanged.set(s,Date.now()),n=!0),null!==r.level&&this._prevLevels.set(s,r.level),a.push(r)}n&&(this._flashGeneration++,this._flashCleanupTimer&&clearTimeout(this._flashCleanupTimer),this._flashCleanupTimer=setTimeout(()=>{this._recentlyChanged.clear(),this._flashGeneration++,this._flashCleanupTimer=null},3e3)),this._entityList=a,this._entityHash=a.map(e=>`${e.sourceEntity}:${e.level}:${e.isLow}:${e.isStale}:${e.dischargeRate}:${e.daysRemaining}:${e.predictedEmpty}:${e.replacementPending}:${e.chargingState}:${e.batteryType}:${e.anomaly}:${e.stability}:${e.reliability}`).join("|")}_getFilteredEntities(){const e=this._filters.status?.value||[],t=this._filters.prediction?.value||[],i=this._filters.battery?.value||[],a=this._filters.batteryType?.value||[],n=this._filters.levelRange?.value,s=n&&(null!=n.min||null!=n.max);return 0!==e.length||0!==t.length||0!==i.length||0!==a.length||s?this._entities.filter(r=>{if(e.length>0&&!e.includes(r._statusFilter))return!1;if(t.length>0&&!t.includes(r.predictionStatus||""))return!1;if(i.length>0){const e=r.isRechargeable?"rechargeable":"disposable";if(!i.includes(e))return!1}if(a.length>0){const e=r.isRechargeable?"Rechargeable":(()=>{const e=r.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);return e?e[1].trim():r.batteryType||"Unknown"})();if(!a.includes(e))return!1}if(s){if(null==r.level)return!1;const e=Math.ceil(r.level);if(null!=n.min&&e<n.min)return!1;if(null!=n.max&&e>n.max)return!1}return!0}):this._entities}_navigateToDevicesWithTypeFilter(e){this._filters={batteryType:{value:[e]}},window.history.pushState(null,"",`${this._basePath}/devices`),this._syncViewFromUrl()}_navigateToDevicesWithLevelFilter(e,t,i){const a={levelRange:{value:{min:e,max:t}},...i};this._filters=a,window.history.pushState(null,"",`${this._basePath}/devices`),this._syncViewFromUrl()}_isPredictionSignificantlyChanged(e,t){if(null==e!=(null==t))return!0;if(null==e&&null==t)return!1;const i=Date.now(),a=Math.max(Math.max(e,t)-i,36e5);return Math.abs(t-e)/a>.1}_getDevice(e){return this._entityMap.get(e)}_formatLevel(e){return he(e)}_showToast(e){Se(this,e)}_applyDeepLinkHighlight(){this._highlightEntity&&!this._highlightApplied&&(this._highlightApplied=!0,this._openDetail(this._highlightEntity))}async _loadConfig(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_settings"});this._configEntry={entry_id:e.entry_id},this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout,prediction_horizon:e.prediction_horizon}}catch(e){console.warn("Juice Patrol: failed to load config",e)}}async _saveSettings(){if(this._hass&&this._configEntry)try{await this._hass.callWS({type:"juice_patrol/update_settings",...this._settingsValues}),this._settingsDirty=!1,this._settingsOpen=!1,this._invalidateColumns(),this._showToast("Settings saved")}catch(e){this._showToast("Failed to save settings")}}async _markReplaced(e){const t=this._getDevice(e);t?.isRechargeable?function(e,t){Ve(e,t,{title:"Replace rechargeable battery?",preamble:'\n      <p style="margin-top:0">This device is marked as <strong>rechargeable</strong>, which means\n      Juice Patrol expects its battery level to gradually rise and fall as it\n      charges and discharges. Charging is detected automatically — you don\'t\n      need to do anything when you plug it in.</p>\n      <p><strong>"Mark as replaced"</strong> is for when you physically swap the\n      battery pack itself (e.g. a worn-out cell that no longer holds charge).</p>\n      <p>If you just recharged the device, you can ignore this — Juice Patrol\n      already handles that.</p>'})}(this,e):function(e,t){Ve(e,t,{title:"Mark battery as replaced?",preamble:'\n      <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.\n      A replacement marker will be added to the timeline. All history is preserved\n      for life expectancy tracking.</p>\n      <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n      This can be undone later if needed.</p>'})}(this,e)}async _doMarkReplaced(e,t){try{const i={type:"juice_patrol/mark_replaced",entity_id:e};null!=t&&(i.timestamp=t),await this._hass.callWS(i),this._showToast("Battery marked as replaced"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to mark as replaced")}}_undoReplacement(e){Ne(this,{title:"Undo battery replacement?",bodyHtml:'\n        <p style="margin-top:0">This will remove the most recent replacement marker\n        from the timeline. Battery history is never deleted.</p>\n        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n        You can always re-add it later if needed.</p>',confirmLabel:"Undo replacement",confirmVariant:"danger",onConfirm:()=>this._doUndoReplacement(e)})}async _doUndoReplacement(e){try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:e}),this._showToast("Replacement undone"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to undo replacement")}}_undoReplacementAt(e,t){Ne(this,{title:"Remove replacement?",bodyHtml:`<p style="margin-top:0">Remove the replacement marker from <strong>${new Date(1e3*t).toLocaleDateString()}</strong>? Battery history is never deleted.</p>`,confirmLabel:"Remove",confirmVariant:"danger",onConfirm:async()=>{try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:e,timestamp:t}),this._showToast("Replacement removed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to remove replacement")}}})}async _confirmReplacement(e){try{await this._hass.callWS({type:"juice_patrol/confirm_replacement",entity_id:e}),this._showToast("Replacement confirmed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to confirm")}}async _confirmSuspectedReplacement(e,t){try{await this._hass.callWS({type:"juice_patrol/mark_replaced",entity_id:e,timestamp:t}),this._showToast("Replacement confirmed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to confirm replacement")}}async _denySuspectedReplacement(e,t){try{await this._hass.callWS({type:"juice_patrol/deny_replacement",entity_id:e,timestamp:t}),this._showToast("Suggestion dismissed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to dismiss suggestion")}}async _recalculate(e){try{await this._hass.callWS({type:"juice_patrol/recalculate",entity_id:e}),this._showToast("Prediction recalculated")}catch(e){this._showToast(ue(e,"recalculation"))}}_confirmRefresh(){Ne(this,{title:"Force refresh",bodyHtml:'\n        <p>Juice Patrol automatically updates predictions whenever a battery level changes and runs a full scan every hour.</p>\n        <p>A manual refresh clears all cached recorder data and recalculates every device from scratch. This is only needed if:</p>\n        <ul style="margin:8px 0;padding-left:20px">\n          <li>You changed a battery type or threshold and want immediate results</li>\n          <li>Predictions seem stale or incorrect after a HA restart</li>\n          <li>You imported historical recorder data</li>\n        </ul>\n        <p style="color:var(--secondary-text-color);font-size:13px">This may take a moment depending on the number of devices.</p>\n      ',confirmLabel:"Refresh now",onConfirm:()=>this._refresh()})}async _refresh(){if(!this._refreshing){this._refreshing=!0;try{await this._hass.callWS({type:"juice_patrol/refresh"}),this._showToast("Predictions refreshed"),"shopping"===this._activeView?setTimeout(()=>this._loadShoppingList(),500):"dashboard"===this._activeView?setTimeout(()=>{this._loadShoppingList(),this._loadDashboardData()},500):"detail"===this._activeView&&this._detailEntity&&setTimeout(()=>this._loadChartData(this._detailEntity),500)}catch(e){this._showToast("Refresh failed")}this._refreshTimer=setTimeout(()=>{this._refreshTimer=null,this._refreshing=!1},2e3)}}async _loadIgnored(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_ignored"});this._ignoredEntities=e.ignored||[]}catch(e){console.warn("Juice Patrol: failed to load ignored",e)}}async _ignoreDevice(e){try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!0}),this._showToast("Device ignored"),this._loadIgnored()}catch(e){this._showToast("Failed to ignore device")}}async _unignoreDevice(e){try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!1}),this._showToast("Device restored"),this._loadIgnored()}catch(e){this._showToast("Failed to unignore device")}}async _loadShoppingList(){if(this._hass){this._shoppingLoading=!0;try{this._shoppingData=await this._hass.callWS({type:"juice_patrol/get_shopping_list"})}catch(e){if(!this._shoppingRetried)return this._shoppingRetried=!0,this._shoppingLoading=!1,void setTimeout(()=>{this._shoppingRetried=!1,this._loadShoppingList()},1e3);this._shoppingRetried=!1,console.error("Juice Patrol: failed to load shopping list",e),this._shoppingData=null}this._shoppingLoading=!1}}async _loadDashboardData(){if(this._hass){this._dashboardLoading=!0;try{this._dashboardData=await this._hass.callWS({type:"juice_patrol/get_dashboard_data"})}catch(e){if(!this._dashboardRetried)return this._dashboardRetried=!0,this._dashboardLoading=!1,void setTimeout(()=>{this._dashboardRetried=!1,this._loadDashboardData()},1e3);this._dashboardRetried=!1,console.error("Juice Patrol: failed to load dashboard data",e),this._dashboardData=null}this._dashboardLoading=!1}}async _loadChartData(e){if(this._hass&&!this._chartLoading){this._chartLoading=!0;try{const t=await this._hass.callWS({type:"juice_patrol/get_entity_chart",entity_id:e});this._chartLastLevel=t?.level??null;const i=this._getDevice(e);this._chartLastPredictedEmpty=i?.predictedEmpty?new Date(i.predictedEmpty).getTime():null,this._chartData=t,this._chartStale=!1}catch(t){if(!this._chartRetried)return this._chartRetried=!0,this._chartLoading=!1,void setTimeout(()=>this._loadChartData(e),1e3);console.error("Juice Patrol: failed to load chart data",t),this._showToast(ue(t,"chart view"))}this._chartLoading=!1}}async _saveBatteryType(e,t){try{await this._hass.callWS({type:"juice_patrol/set_battery_type",entity_id:e,battery_type:t||""}),this._showToast(t?`Battery type set to ${t}`:"Battery type cleared")}catch(e){this._showToast("Failed to set battery type")}}_openDetail(e){this._saveScrollPosition(),this._detailEntity=e,this._chartData=null,this._chartEl=null,this._chartRange="auto",this._activeView="detail";const t=`${this._basePath}/detail/${encodeURIComponent(e)}`;history.pushState({view:"detail",entityId:e},"",t),this._loadChartData(e)}_closeDetail(){history.back()}_getScroller(){const e=this.shadowRoot?.querySelector("hass-tabs-subpage-data-table"),t=e?.shadowRoot?.querySelector("ha-data-table");return t?.shadowRoot?.querySelector(".scroller")||null}_saveScrollPosition(){const e=this._getScroller();if(e){const t={...history.state||{},scrollPosition:e.scrollTop};history.replaceState(t,"")}}_attachScrollTracker(){if(this._scrollTracker)return;let e=0;const t=()=>{const i=this._getScroller();if(!i)return void(++e<20&&requestAnimationFrame(t));if(this._scrollTracker)return;let a=!1;this._scrollTracker=()=>{a||(a=!0,requestAnimationFrame(()=>{this._saveScrollPosition(),a=!1}))},i.addEventListener("scroll",this._scrollTracker,{passive:!0}),this._scrollTrackerTarget=i;const n=history.state?.scrollPosition;if(n>0){let e=0;const t=()=>{i.scrollHeight>i.clientHeight+n?i.scrollTop=n:++e<30&&requestAnimationFrame(t)};requestAnimationFrame(t)}};requestAnimationFrame(t)}_detachScrollTracker(){this._scrollTracker&&this._scrollTrackerTarget&&(this._scrollTrackerTarget.removeEventListener("scroll",this._scrollTracker),this._scrollTracker=null,this._scrollTrackerTarget=null)}_toggleSettings(){this._settingsOpen=!this._settingsOpen,this._settingsOpen&&(this._settingsDirty=!1,this._loadConfig())}_handleSettingInput(e){const t=e.target.dataset.key;this._settingsValues={...this._settingsValues,[t]:parseFloat(e.target.value)},this._settingsDirty=!0}_cancelSettings(){this._settingsOpen=!1,this._loadConfig()}_handleMenuSelect(e,t){const i=e.detail?.item?.value;if(!i||!t)return;const a=this._getDevice(t);"detail"===i?this._openDetail(t):"confirm"===i?this._confirmReplacement(t):"replace"===i?this._markReplaced(t):"recalculate"===i?this._recalculate(t):"type"===i?this._setBatteryType(t,a?.batteryType):"undo-replace"===i?this._undoReplacement(t):"ignore"===i&&this._ignoreDevice(t)}_closeOverlays(){this.shadowRoot.querySelectorAll("ha-dialog").forEach(e=>{e.open=!1,e.remove()})}_handleRowClick(e){const t=e.detail?.id;t&&this._openDetail(t)}_handleSortingChanged(e){this._sorting=e.detail}_setBatteryType(e,t){!function(e,t,i){e.shadowRoot.querySelectorAll("ha-dialog").forEach(e=>{e.open=!1,e.remove()});const a=e._getDevice(t),n=i||a?.batteryType||"",s=_e(n),r=["CR2032","CR2450","CR123A","AA","AAA"],o=["18650","LR44","CR1632","CR1616","CR2025","9V"];let l=[],c=null;const d=n&&!r.includes(s.type)&&s.type;if(n&&r.includes(s.type)){for(let e=0;e<s.count;e++)l.push(s.type);c=s.type}else if(d){for(let e=0;e<s.count;e++)l.push(s.type);c=s.type}let h=a?.isRechargeable||!1,p=!1,u=null,g=null;const m=["alkaline","lithium_primary","NMC","NiMH"],v={alkaline:"Alkaline",lithium_primary:"Lithium",NMC:"Li-ion",NiMH:"NiMH"};let y=a?.chemistryOverride||null,b=!1,f=!1,_="",x=!1;const w=document.createElement("ha-dialog");w.open=!0,w.headerTitle="Set battery type",e.shadowRoot.appendChild(w);const $=document.createElement("div");$.slot="headerActionItems",$.style.position="relative";const k=document.createElement("ha-icon-button"),S=document.createElement("ha-icon");S.icon="mdi:dots-vertical",k.appendChild(S),$.appendChild(k);let R=!1;const E=document.createElement("div");E.className="jp-overflow-menu",E.style.display="none",E.innerHTML='\n    <button class="jp-overflow-menu-item">\n      <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color)"></ha-icon>\n      Information\n    </button>\n  ',$.appendChild(E),w.appendChild($),k.addEventListener("click",e=>{e.stopPropagation(),R=!R,E.style.display=R?"block":"none"}),E.querySelector(".jp-overflow-menu-item").addEventListener("click",()=>{R=!1,E.style.display="none",L(),e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}),document.addEventListener("mousedown",e=>{const t=e.composedPath();!R||t.includes(E)||t.includes(k)||(R=!1,E.style.display="none")});const L=()=>{document.removeEventListener("mousedown",j),w.open=!1,w.remove()},C=e=>{if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML},A=()=>null!==c&&r.includes(c),T=document.createElement("div");w.appendChild(T);const j=e=>{if(!f)return;const t=T.querySelector(".jp-custom-popover"),i=T.querySelector(".jp-custom-trigger"),a=e.composedPath();t&&!a.includes(t)&&i&&!a.includes(i)&&(f=!1,D())};document.addEventListener("mousedown",j);const D=()=>{const e=l.length>0&&!r.includes(l[0]);l.length;const i=l.length>0?l.map((e,t)=>`<span class="jp-badge-chip" data-idx="${t}" title="Click to remove">${C(e)} ✕</span>`).join(""):'<span class="jp-unknown-chip">\n           <ha-icon icon="mdi:battery" style="--mdc-icon-size:14px"></ha-icon>\n           Unknown\n         </span>',n=l.length>0?`<span class="jp-count-badge">${l.length}</span>`:"",s=f?`<div class="jp-custom-popover">\n           <div class="jp-custom-popover-input">\n             <div style="color:var(--primary-color); font-size:11px; font-weight:500; margin-bottom:4px">Custom type</div>\n             <input type="text" class="jp-custom-input" placeholder="e.g. 18650, LR44…"\n                    value="${C(_)}">\n             <div style="height:2px; background:var(--primary-color); border-radius:1px; margin-top:4px"></div>\n           </div>\n           ${o.map(e=>`<button class="jp-custom-suggestion" data-suggestion="${C(e)}">\n                <ha-icon icon="mdi:battery" style="--mdc-icon-size:16px; color:var(--secondary-text-color)"></ha-icon>\n                ${C(e)}\n              </button>`).join("")}\n         </div>`:"";T.innerHTML=`\n      <div class="jp-dialog-desc">${C(a?.name||t)}</div>\n\n      <div class="jp-rechargeable-section">\n        <ha-switch class="jp-rechargeable-sw" ${h?"checked":""}></ha-switch>\n        <div class="jp-rechargeable-labels">\n          <div style="font-size:14px; font-weight:500">Rechargeable device</div>\n          <div style="font-size:12px; color:var(--secondary-text-color); margin-top:2px">\n            Device with an internal, non-removable rechargeable battery</div>\n        </div>\n      </div>\n\n      <hr style="border:none; border-top:1px solid var(--divider-color); margin:12px 0">\n\n      <div class="jp-batteries-section${h?" jp-disabled-overlay":""}">\n        <div class="jp-batteries-heading">\n          <span style="font-size:14px; font-weight:500">Batteries</span>\n          ${n}\n        </div>\n        <div style="font-size:12px; color:var(--secondary-text-color); margin-bottom:10px; line-height:16px">\n          Select the type of battery used by this device. Click the type again to add more &mdash; one click per battery in the device.\n        </div>\n\n        <div class="jp-badge-field">\n          <div class="jp-badge-field-chips">${i}</div>\n          <ha-icon-button class="jp-autodetect-btn${x?" spinning":""}"\n            title="Autodetect battery type" ${x?"disabled":""}>\n            <ha-icon icon="mdi:auto-fix"></ha-icon>\n          </ha-icon-button>\n        </div>\n\n        <div class="jp-dialog-presets" style="position:relative">\n          ${r.map(t=>{const i=null!==c&&t!==c||e;return`<button class="jp-preset${i?" disabled":""}${t===c?" active":""}"\n              data-type="${t}" ${i?"disabled":""}>${t}</button>`}).join("")}\n          <button class="jp-custom-trigger${A()?" disabled":""}${f?" active":""}"\n            ${A()?"disabled":""}>\n            <span style="font-size:15px; line-height:1">+</span> Custom type…\n          </button>\n          ${s}\n        </div>\n      </div>\n\n      <ha-expansion-panel outlined style="margin: 12px 0 0">\n        <span slot="header">Advanced</span>\n        <div style="padding: 8px 0">\n          <div style="font-size:13px; font-weight:500; margin-bottom:8px">Chemistry override</div>\n          <div class="jp-dialog-presets jp-chem-presets">\n            ${m.map(e=>`<button class="jp-preset jp-chem-chip${y===e?" active":""}"\n                data-chem="${e}">${v[e]}</button>`).join("")}\n          </div>\n          <div style="font-size:12px; color:var(--secondary-text-color); margin-top:8px; line-height:16px">\n            Changes the prediction model used for this device. Leave unset to use\n            the default for this battery type.\n          </div>\n        </div>\n      </ha-expansion-panel>\n\n      <div class="jp-dialog-actions">\n        <ha-button variant="neutral" class="jp-dialog-clear">Clear</ha-button>\n        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n        <ha-button class="jp-dialog-save">Save</ha-button>\n      </div>\n    `,M()},M=()=>{T.querySelectorAll(".jp-badge-chip").forEach(e=>{e.addEventListener("click",()=>{h||(l.splice(parseInt(e.dataset.idx),1),0===l.length&&(c=null),D())})}),T.querySelectorAll(".jp-preset[data-type]:not([disabled])").forEach(e=>{e.addEventListener("click",()=>{if(h)return;const t=e.dataset.type;c=t,l.push(t),D()})}),T.querySelectorAll(".jp-chem-chip").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.chem;y=y===t?null:t,b=!0,D()})});const i=T.querySelector(".jp-rechargeable-sw");i&&i.addEventListener("change",()=>{h=i.checked,p=!0,h?(u=[...l],g=c,f=!1,_=""):u&&(l=u,c=g,u=null,g=null),D()}),T.querySelector(".jp-autodetect-btn")?.addEventListener("click",async()=>{if(!x&&!h){x=!0,D();try{const i=await e._hass.callWS({type:"juice_patrol/detect_battery_type",entity_id:t});if(i.battery_type){const t=_e(i.battery_type);if(l=[],c=null,r.includes(t.type)){for(let e=0;e<t.count;e++)l.push(t.type);c=t.type}else{for(let e=0;e<t.count;e++)l.push(t.type);c=t.type}Se(e,`Detected: ${i.battery_type} (${i.source})`)}else Se(e,"Could not auto-detect battery type")}catch(t){console.warn("Juice Patrol: auto-detect failed",t),Se(e,ue(t,"auto-detection"))}x=!1,D()}}),T.querySelector(".jp-custom-trigger:not([disabled])")?.addEventListener("click",()=>{h||(f=!f,D(),f&&requestAnimationFrame(()=>{T.querySelector(".jp-custom-input")?.focus()}))});const a=T.querySelector(".jp-custom-input");a&&(a.addEventListener("input",e=>{_=e.target.value}),a.addEventListener("keydown",e=>{"Enter"===e.key&&_.trim()&&(l=[_.trim()],c=_.trim(),f=!1,_="",D()),"Escape"===e.key&&(f=!1,D())})),T.querySelectorAll(".jp-custom-suggestion").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.suggestion;l=[t],c=t,f=!1,_="",D()})}),w.addEventListener("closed",L),T.querySelector(".jp-dialog-cancel")?.addEventListener("click",L),T.querySelector(".jp-dialog-clear")?.addEventListener("click",()=>{l=[],c=null,f=!1,_="",y=null,b=!0,D()}),T.querySelector(".jp-dialog-save")?.addEventListener("click",async()=>{let i;var a,s;l.length>0?(a=c,s=l.length,i=a?s>1?`${s}× ${a}`:a:""):i=null,L();const r=i!==(n||null);if(p)try{await e._hass.callWS({type:"juice_patrol/set_rechargeable",entity_id:t,is_rechargeable:h})}catch(t){Se(e,"Failed to update rechargeable state")}if(r&&await e._saveBatteryType(t,i),b)try{await e._hass.callWS({type:"juice_patrol/set_chemistry_override",entity_id:t,chemistry:y})}catch(t){Se(e,"Failed to update chemistry override")}})};D()}(this,e,t)}_invalidateColumns(){this._cachedColumns=null}get _tabs(){const e=this._basePath;return[{path:`${e}/dashboard`,name:"Dashboard",iconPath:"M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"},{path:`${e}/devices`,name:"Devices",iconPath:"M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z"},{path:`${e}/shopping`,name:"Shopping List",iconPath:"M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z"}]}get _route(){return{path:`/${"detail"===this._activeView?"devices":this._activeView}`,prefix:this._basePath}}_renderToolbarIcons(){return"detail"===this._activeView?this._renderDetailToolbarIcons():U`
      <div slot="toolbar-icon" style="display:flex">
        <ha-icon-button
          id="refreshBtn"
          class=${this._refreshing?"spinning":""}
          title="Force refresh"
          .disabled=${this._refreshing}
          @click=${this._confirmRefresh}
        >
          <ha-icon icon="mdi:refresh"></ha-icon>
        </ha-icon-button>
      </div>
    `}_renderDetailToolbarIcons(){const e=this._detailEntity,t=this._getDevice(e);return U`
      <div slot="toolbar-icon" style="display:flex">
        <ha-dropdown
          @wa-select=${i=>{const a=i.detail?.item?.value;a&&e&&("replace"===a?this._markReplaced(e):"recalculate"===a?(this._recalculate(e),setTimeout(()=>this._loadChartData(e),500)):"type"===a?this._setBatteryType(e,t?.batteryType):"ignore"===a&&this._ignoreDevice(e))}}
        >
          <ha-icon-button slot="trigger">
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </ha-icon-button>
          <ha-dropdown-item value="replace">
            <ha-icon slot="icon" icon="mdi:battery-sync"></ha-icon>
            Mark as replaced
          </ha-dropdown-item>
          <ha-dropdown-item value="recalculate">
            <ha-icon slot="icon" icon="mdi:calculator-variant"></ha-icon>
            Recalculate
          </ha-dropdown-item>
          <ha-dropdown-item value="type">
            <ha-icon slot="icon" icon="mdi:battery-heart-variant"></ha-icon>
            Set battery type
          </ha-dropdown-item>
          <wa-divider></wa-divider>
          <ha-dropdown-item value="ignore">
            <ha-icon slot="icon" icon="mdi:eye-off"></ha-icon>
            Ignore device
          </ha-dropdown-item>
        </ha-dropdown>
      </div>
    `}get _activeFilterCount(){const e=["active","low"];return Object.entries(this._filters).filter(([t,i])=>"levelRange"===t?i.value&&(null!=i.value.min||null!=i.value.max):!(!Array.isArray(i.value)||!i.value.length)&&("status"!==t||i.value.length!==e.length||!i.value.every(t=>e.includes(t)))).length}get _columns(){return this._cachedColumns||(this._cachedColumns=Le(this)),this._cachedColumns}render(){if(!this._hass)return U`<div class="loading">Loading...</div>`;if("devices"===this._activeView)return this._renderDevicesView();const e="detail"===this._activeView,t="dashboard"===this._activeView;return U`
      <hass-tabs-subpage
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        ?main-page=${!e}
        .backCallback=${e?()=>this._closeDetail():void 0}
      >
        ${this._renderToolbarIcons()}
        ${e?U`<div id="jp-content">${Ae(this)}</div>`:t?U`<div class="jp-padded">${Me(this)}</div>`:U`<div class="jp-padded">${Te(this)}</div>`}
      </hass-tabs-subpage>
    `}_renderDevicesView(){const e=this._getFilteredEntities();return U`
      <hass-tabs-subpage-data-table
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        main-page
        .columns=${this._columns}
        .data=${e}
        .id=${"sourceEntity"}
        .searchLabel=${"Search "+e.length+" devices"}
        .noDataText=${"No devices match the current filter."}
        clickable
        .initialSorting=${this._sorting}
        has-filters
        .filters=${this._activeFilterCount}
        @row-click=${this._handleRowClick}
        @sorting-changed=${this._handleSortingChanged}
        @clear-filter=${this._clearFilters}
      >
        ${this._renderToolbarIcons()}
        ${this._renderFilterPane()}
      </hass-tabs-subpage-data-table>
    `}_renderFilterPane(){const e=this._filters.status?.value||[],t=this._filters.prediction?.value||[];return U`
      <ha-expansion-panel slot="filter-pane" outlined expanded header="Status">
        <ha-icon slot="leading-icon" icon="mdi:list-status" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[{value:"active",label:"Active",icon:"mdi:check-circle"},{value:"low",label:"Low battery",icon:"mdi:battery-alert"},{value:"stale",label:"Stale",icon:"mdi:clock-alert-outline"},{value:"unavailable",label:"Unavailable",icon:"mdi:help-circle-outline"}].map(t=>U`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${e.includes(t.value)}
                @change=${e=>this._toggleFilter("status",t.value,e.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${t.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${t.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
      <ha-expansion-panel slot="filter-pane" outlined header="Battery">
        <ha-icon slot="leading-icon" icon="mdi:battery" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[{value:"disposable",label:"Disposable",icon:"mdi:battery"},{value:"rechargeable",label:"Rechargeable",icon:"mdi:battery-charging"}].map(e=>U`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${(this._filters.battery?.value||[]).includes(e.value)}
                @change=${t=>this._toggleFilter("battery",e.value,t.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${e.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${e.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
      ${this._renderBatteryTypeFilterPane()}
      ${this._renderLevelRangeFilterPane()}
      <ha-expansion-panel slot="filter-pane" outlined header="Prediction">
        <ha-icon slot="leading-icon" icon="mdi:crystal-ball" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${[{value:"normal",label:"Normal discharge",icon:"mdi:trending-down"},{value:"flat",label:"Flat",icon:"mdi:minus"},{value:"idle",label:"Idle",icon:"mdi:sleep"},{value:"charging",label:"Charging",icon:"mdi:battery-charging"},{value:"insufficient_data",label:"Not enough data",icon:"mdi:database-off-outline"},{value:"single_level",label:"Single level",icon:"mdi:equal"},{value:"insufficient_range",label:"Tiny range",icon:"mdi:approximately-equal"},{value:"noisy",label:"Noisy data",icon:"mdi:chart-scatter-plot"}].map(e=>U`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${t.includes(e.value)}
                @change=${t=>this._toggleFilter("prediction",e.value,t.target.checked)}
              ></ha-checkbox>
              <ha-icon icon=${e.icon} style="--mdc-icon-size:18px"></ha-icon>
              <span>${e.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
    `}_renderBatteryTypeFilterPane(){const e=new Map;for(const t of this._entities||[]){if(null==t.level)continue;let i;if(t.isRechargeable)i="Rechargeable";else{const e=t.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);i=e?e[1].trim():t.batteryType||"Unknown"}e.set(i,(e.get(i)||0)+1)}const t=[...e.entries()].sort((e,t)=>t[1]-e[1]).map(([e,t])=>({value:e,label:`${e} (${t})`}));if(0===t.length)return I;const i=this._filters.batteryType?.value||[];return U`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${i.length>0}
        header="Battery Type">
        <ha-icon slot="leading-icon" icon="mdi:battery-heart-variant" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${t.map(e=>U`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${i.includes(e.value)}
                @change=${t=>this._toggleFilter("batteryType",e.value,t.target.checked)}
              ></ha-checkbox>
              <span>${e.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
    `}_renderLevelRangeFilterPane(){const e=this._filters.levelRange?.value,t=e&&(null!=e.min||null!=e.max),i=e?.min??0,a=e?.max??100;return U`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${t}
        header="Battery Level">
        <ha-icon slot="leading-icon" icon="mdi:gauge" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-level-range">
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Min</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${i}
              pin
              @change=${t=>{const i=parseInt(t.target.value,10);this._setLevelRange(0===i?null:i,e?.max??null)}}
            ></ha-slider>
            <span class="jp-level-value">${i}%</span>
          </div>
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Max</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${a}
              pin
              @change=${t=>{const i=parseInt(t.target.value,10);this._setLevelRange(e?.min??null,100===i?null:i)}}
            ></ha-slider>
            <span class="jp-level-value">${a}%</span>
          </div>
          ${t?U`
            <div style="padding:0 16px 8px;text-align:right">
              <ha-button @click=${()=>this._setLevelRange(null,null)}>
                Clear
              </ha-button>
            </div>
          `:I}
        </div>
      </ha-expansion-panel>
    `}_setLevelRange(e,t){if(null==e&&null==t){const{levelRange:e,...t}=this._filters;this._filters={...t}}else this._filters={...this._filters,levelRange:{value:{min:e,max:t}}}}_toggleFilter(e,t,i){const a=this._filters[e]?.value||[],n=i?[...a,t]:a.filter(e=>e!==t);this._filters={...this._filters,[e]:{value:n}}}_clearFilters(){this._filters={}}_renderSettings(){const e=this._settingsValues;return U`
      <ha-card header="Settings" class="settings-card">
        <div class="card-content">
          ${this._renderSettingRow("Low battery threshold","Devices below this level trigger a juice_patrol_battery_low event.","low_threshold",e.low_threshold??20,1,99,"%")}
          ${this._renderSettingRow("Stale device timeout","Devices not reporting within this period are marked stale.","stale_timeout",e.stale_timeout??48,1,720,"hrs")}
          ${this._renderSettingRow("Prediction alert horizon","Alert when a device is predicted to die within this many days.","prediction_horizon",e.prediction_horizon??7,1,90,"days")}
        </div>
        <div class="card-actions">
          <ha-button variant="neutral" @click=${this._cancelSettings}>Cancel</ha-button>
          <ha-button
            .disabled=${!this._settingsDirty}
            @click=${this._saveSettings}
          >
            Save
          </ha-button>
        </div>
      </ha-card>
    `}_renderSettingRow(e,t,i,a,n,s,r){return U`
      <ha-settings-row narrow>
        <span slot="heading">${e}</span>
        <span slot="description">${t}</span>
        <ha-textfield
          type="number"
          .value=${String(a)}
          min=${n}
          max=${s}
          suffix=${r}
          data-key=${i}
          @input=${this._handleSettingInput}
        ></ha-textfield>
      </ha-settings-row>
    `}static get styles(){return Re}});
