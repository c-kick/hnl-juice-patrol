/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,t=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,a=Symbol(),i=new WeakMap;let s=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==a)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const a=this.t;if(t&&void 0===e){const t=void 0!==a&&1===a.length;t&&(e=i.get(a)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&i.set(a,e))}return e}toString(){return this.cssText}};const n=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const a of e.cssRules)t+=a.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,a))(t)})(e):e,{is:r,defineProperty:l,getOwnPropertyDescriptor:o,getOwnPropertyNames:c,getOwnPropertySymbols:d,getPrototypeOf:h}=Object,p=globalThis,u=p.trustedTypes,g=u?u.emptyScript:"",m=p.reactiveElementPolyfillSupport,v=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?g:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let a=e;switch(t){case Boolean:a=null!==e;break;case Number:a=null===e?null:Number(e);break;case Object:case Array:try{a=JSON.parse(e)}catch(e){a=null}}return a}},b=(e,t)=>!r(e,t),_={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:b};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),p.litPropertyMetadata??=new WeakMap;let f=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=_){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const a=Symbol(),i=this.getPropertyDescriptor(e,a,t);void 0!==i&&l(this.prototype,e,i)}}static getPropertyDescriptor(e,t,a){const{get:i,set:s}=o(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:i,set(t){const n=i?.call(this);s?.call(this,t),this.requestUpdate(e,n,a)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??_}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const e=h(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const e=this.properties,t=[...c(e),...d(e)];for(const a of t)this.createProperty(a,e[a])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,a]of t)this.elementProperties.set(e,a)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const a=this._$Eu(e,t);void 0!==a&&this._$Eh.set(a,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const a=new Set(e.flat(1/0).reverse());for(const e of a)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const a=t.attribute;return!1===a?void 0:"string"==typeof a?a:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const a of t.keys())this.hasOwnProperty(a)&&(e.set(a,this[a]),delete this[a]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const a=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((a,i)=>{if(t)a.adoptedStyleSheets=i.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const t of i){const i=document.createElement("style"),s=e.litNonce;void 0!==s&&i.setAttribute("nonce",s),i.textContent=t.cssText,a.appendChild(i)}})(a,this.constructor.elementStyles),a}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,a){this._$AK(e,a)}_$ET(e,t){const a=this.constructor.elementProperties.get(e),i=this.constructor._$Eu(e,a);if(void 0!==i&&!0===a.reflect){const s=(void 0!==a.converter?.toAttribute?a.converter:y).toAttribute(t,a.type);this._$Em=e,null==s?this.removeAttribute(i):this.setAttribute(i,s),this._$Em=null}}_$AK(e,t){const a=this.constructor,i=a._$Eh.get(e);if(void 0!==i&&this._$Em!==i){const e=a.getPropertyOptions(i),s="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=i;const n=s.fromAttribute(t,e.type);this[i]=n??this._$Ej?.get(i)??n,this._$Em=null}}requestUpdate(e,t,a,i=!1,s){if(void 0!==e){const n=this.constructor;if(!1===i&&(s=this[e]),a??=n.getPropertyOptions(e),!((a.hasChanged??b)(s,t)||a.useDefault&&a.reflect&&s===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,a))))return;this.C(e,t,a)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:a,reflect:i,wrapped:s},n){a&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==s||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||a||(t=void 0),this._$AL.set(e,t)),!0===i&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,a]of e){const{wrapped:e}=a,i=this[t];!0!==e||this._$AL.has(t)||void 0===i||this.C(t,void 0,a,i)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};f.elementStyles=[],f.shadowRootOptions={mode:"open"},f[v("elementProperties")]=new Map,f[v("finalized")]=new Map,m?.({ReactiveElement:f}),(p.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const x=globalThis,w=e=>e,$=x.trustedTypes,S=$?$.createPolicy("lit-html",{createHTML:e=>e}):void 0,k="$lit$",R=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+R,A=`<${E}>`,L=document,C=()=>L.createComment(""),T=e=>null===e||"object"!=typeof e&&"function"!=typeof e,D=Array.isArray,j="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,z=/-->/g,H=/>/g,P=RegExp(`>|${j}(?:([^\\s"'>=/]+)(${j}*=${j}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),F=/'/g,V=/"/g,N=/^(?:script|style|textarea|title)$/i,U=(e=>(t,...a)=>({_$litType$:e,strings:t,values:a}))(1),O=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),B=new WeakMap,I=L.createTreeWalker(L,129);function q(e,t){if(!D(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(t):t}const J=(e,t)=>{const a=e.length-1,i=[];let s,n=2===t?"<svg>":3===t?"<math>":"",r=M;for(let t=0;t<a;t++){const a=e[t];let l,o,c=-1,d=0;for(;d<a.length&&(r.lastIndex=d,o=r.exec(a),null!==o);)d=r.lastIndex,r===M?"!--"===o[1]?r=z:void 0!==o[1]?r=H:void 0!==o[2]?(N.test(o[2])&&(s=RegExp("</"+o[2],"g")),r=P):void 0!==o[3]&&(r=P):r===P?">"===o[0]?(r=s??M,c=-1):void 0===o[1]?c=-2:(c=r.lastIndex-o[2].length,l=o[1],r=void 0===o[3]?P:'"'===o[3]?V:F):r===V||r===F?r=P:r===z||r===H?r=M:(r=P,s=void 0);const h=r===P&&e[t+1].startsWith("/>")?" ":"";n+=r===M?a+A:c>=0?(i.push(l),a.slice(0,c)+k+a.slice(c)+R+h):a+R+(-2===c?t:h)}return[q(e,n+(e[a]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),i]};class G{constructor({strings:e,_$litType$:t},a){let i;this.parts=[];let s=0,n=0;const r=e.length-1,l=this.parts,[o,c]=J(e,t);if(this.el=G.createElement(o,a),I.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(i=I.nextNode())&&l.length<r;){if(1===i.nodeType){if(i.hasAttributes())for(const e of i.getAttributeNames())if(e.endsWith(k)){const t=c[n++],a=i.getAttribute(e).split(R),r=/([.?@])?(.*)/.exec(t);l.push({type:1,index:s,name:r[2],strings:a,ctor:"."===r[1]?X:"?"===r[1]?ee:"@"===r[1]?te:Q}),i.removeAttribute(e)}else e.startsWith(R)&&(l.push({type:6,index:s}),i.removeAttribute(e));if(N.test(i.tagName)){const e=i.textContent.split(R),t=e.length-1;if(t>0){i.textContent=$?$.emptyScript:"";for(let a=0;a<t;a++)i.append(e[a],C()),I.nextNode(),l.push({type:2,index:++s});i.append(e[t],C())}}}else if(8===i.nodeType)if(i.data===E)l.push({type:2,index:s});else{let e=-1;for(;-1!==(e=i.data.indexOf(R,e+1));)l.push({type:7,index:s}),e+=R.length-1}s++}}static createElement(e,t){const a=L.createElement("template");return a.innerHTML=e,a}}function Z(e,t,a=e,i){if(t===O)return t;let s=void 0!==i?a._$Co?.[i]:a._$Cl;const n=T(t)?void 0:t._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),void 0===n?s=void 0:(s=new n(e),s._$AT(e,a,i)),void 0!==i?(a._$Co??=[])[i]=s:a._$Cl=s),void 0!==s&&(t=Z(e,s._$AS(e,t.values),s,i)),t}class Y{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:a}=this._$AD,i=(e?.creationScope??L).importNode(t,!0);I.currentNode=i;let s=I.nextNode(),n=0,r=0,l=a[0];for(;void 0!==l;){if(n===l.index){let t;2===l.type?t=new K(s,s.nextSibling,this,e):1===l.type?t=new l.ctor(s,l.name,l.strings,this,e):6===l.type&&(t=new ae(s,this,e)),this._$AV.push(t),l=a[++r]}n!==l?.index&&(s=I.nextNode(),n++)}return I.currentNode=L,i}p(e){let t=0;for(const a of this._$AV)void 0!==a&&(void 0!==a.strings?(a._$AI(e,a,t),t+=a.strings.length-2):a._$AI(e[t])),t++}}class K{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,a,i){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=a,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),T(e)?e===W||null==e||""===e?(this._$AH!==W&&this._$AR(),this._$AH=W):e!==this._$AH&&e!==O&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>D(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==W&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(L.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:a}=e,i="number"==typeof a?this._$AC(e):(void 0===a.el&&(a.el=G.createElement(q(a.h,a.h[0]),this.options)),a);if(this._$AH?._$AD===i)this._$AH.p(t);else{const e=new Y(i,this),a=e.u(this.options);e.p(t),this.T(a),this._$AH=e}}_$AC(e){let t=B.get(e.strings);return void 0===t&&B.set(e.strings,t=new G(e)),t}k(e){D(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let a,i=0;for(const s of e)i===t.length?t.push(a=new K(this.O(C()),this.O(C()),this,this.options)):a=t[i],a._$AI(s),i++;i<t.length&&(this._$AR(a&&a._$AB.nextSibling,i),t.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class Q{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,a,i,s){this.type=1,this._$AH=W,this._$AN=void 0,this.element=e,this.name=t,this._$AM=i,this.options=s,a.length>2||""!==a[0]||""!==a[1]?(this._$AH=Array(a.length-1).fill(new String),this.strings=a):this._$AH=W}_$AI(e,t=this,a,i){const s=this.strings;let n=!1;if(void 0===s)e=Z(this,e,t,0),n=!T(e)||e!==this._$AH&&e!==O,n&&(this._$AH=e);else{const i=e;let r,l;for(e=s[0],r=0;r<s.length-1;r++)l=Z(this,i[a+r],t,r),l===O&&(l=this._$AH[r]),n||=!T(l)||l!==this._$AH[r],l===W?e=W:e!==W&&(e+=(l??"")+s[r+1]),this._$AH[r]=l}n&&!i&&this.j(e)}j(e){e===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class X extends Q{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===W?void 0:e}}class ee extends Q{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==W)}}class te extends Q{constructor(e,t,a,i,s){super(e,t,a,i,s),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??W)===O)return;const a=this._$AH,i=e===W&&a!==W||e.capture!==a.capture||e.once!==a.once||e.passive!==a.passive,s=e!==W&&(a===W||i);i&&this.element.removeEventListener(this.name,this,a),s&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ae{constructor(e,t,a){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=a}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}}const ie=x.litHtmlPolyfillSupport;ie?.(G,K),(x.litHtmlVersions??=[]).push("3.3.2");const se=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ne extends f{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,a)=>{const i=a?.renderBefore??t;let s=i._$litPart$;if(void 0===s){const e=a?.renderBefore??null;i._$litPart$=s=new K(t.insertBefore(C(),e),e,void 0,a??{})}return s._$AI(e),s})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return O}}ne._$litElement$=!0,ne.finalized=!0,se.litElementHydrateSupport?.({LitElement:ne});const re=se.litElementPolyfillSupport;re?.({LitElement:ne}),(se.litElementVersions??=[]).push("4.2.2");const le="font-size:13px;color:var(--secondary-text-color)",oe="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",ce="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z",de=[{key:"auto",label:"Auto"},{key:"1d",label:"1D"},{key:"1w",label:"1W"},{key:"1m",label:"1M"},{key:"3m",label:"3M"},{key:"6m",label:"6M"},{key:"1y",label:"1Y"},{key:"all",label:"All"}];function he(e){const t=pe(e);return null!==t?t+"%":"—"}function pe(e){return null===e?null:Math.ceil(e)}function ue(e,t){return e?.message?.includes("unknown command")?`Restart Home Assistant to enable ${t}`:`${t} failed`}function ge(e){if(e.isRechargeable)return null===e.level?"mdi:battery-unknown":e.level<=10?"mdi:battery-charging-10":e.level<=30?"mdi:battery-charging-30":e.level<=60?"mdi:battery-charging-60":e.level<=90?"mdi:battery-charging-90":"mdi:battery-charging-100";const t=e.level;return null===t?"mdi:battery-unknown":t<=5?"mdi:battery-outline":t<=15?"mdi:battery-10":t<=25?"mdi:battery-20":t<=35?"mdi:battery-30":t<=45?"mdi:battery-40":t<=55?"mdi:battery-50":t<=65?"mdi:battery-60":t<=75?"mdi:battery-70":t<=85?"mdi:battery-80":t<=95?"mdi:battery-90":"mdi:battery"}function me(e,t,a=20){if(null===e)return"var(--disabled-text-color)";const i=t??a;return e<=i/2?"var(--error-color, #db4437)":e<=1.25*i?"var(--warning-color, #ffa726)":"var(--success-color, #43a047)"}function ve(e){return null!==e.dischargeRateHour&&e.dischargeRateHour>=1}function ye(e){const t=e.predictionStatus;if(!t||"normal"===t)return null;return{charging:"Charging",flat:"Flat",idle:"Idle",noisy:"Noisy data",insufficient_data:"Not enough data",single_level:"Single level",insufficient_range:"Tiny range"}[t]||null}function be(e){return{charging:"This battery is currently charging, so no discharge prediction is generated. Once it starts discharging again, a new prediction will be calculated.",flat:"The battery level has been essentially flat — no significant discharge detected. This is normal for devices with very slow drain. A prediction will appear once enough change is observed.",idle:"This rechargeable device is not currently discharging. A discharge prediction will appear once the battery level starts dropping.",noisy:"The battery data is too irregular to fit a reliable trend line. This can happen with sensors that report inconsistent values. The prediction will improve as more stable readings accumulate.",insufficient_data:"There are not enough data points or the observation period is too short to calculate a prediction. Juice Patrol needs at least 3 readings spanning 24 hours.",single_level:"All recorded readings have the same battery level. This typically means the sensor reports a fixed value or hasn't changed since discovery.",insufficient_range:"The battery level has barely changed — the total variation is within one reporting step. More drain needs to occur before a trend can be detected."}[e]||null}function _e(e){if(ve(e))return null!==e.dischargeRateHour?e.dischargeRateHour+"%/h":"—";if(null===e.dischargeRate)return"—";const t=e.dischargeRate;return t<.01?t.toFixed(4)+"%/d":t<1?t.toFixed(2)+"%/d":t.toFixed(1)+"%/d"}function fe(e){return ve(e)&&null!==e.hoursRemaining?e.hoursRemaining<1?Math.round(60*e.hoursRemaining)+"m":e.hoursRemaining+"h":null===e.daysRemaining?"—":e.daysRemaining>3650?"> 10y":e.daysRemaining+"d"}function xe(e,t=!1){if(!e)return"—";try{const a=new Date(e);if(a.getTime()-Date.now()>31536e7)return"—";const i=new Date,s=a.getFullYear()===i.getFullYear();if(t){const e=s?{month:"short",day:"numeric"}:{month:"short",day:"numeric",year:"numeric"};return a.toLocaleDateString(void 0,e)+" "+a.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}return a.toLocaleDateString(void 0,{month:"short",day:"numeric",year:s?void 0:"numeric"})}catch{return"—"}}function we(e){if(!e)return{count:0,type:""};const t=e.match(/^(\d+)\s*[×x]\s*(.+)$/i);return t?{count:parseInt(t[1]),type:t[2].trim()}:{count:1,type:e.trim()}}function $e(e){const t=[],a=pe(e.level),i=pe(e.meanLevel);return null!==i&&null!==a&&a>i+3&&!e.isRechargeable?t.push(`Level is rising (${a}%) without a charge state — not expected for a non-rechargeable battery`):null!==i&&null!==a&&Math.abs(a-i)>5&&t.push(`Current level (${a}%) differs significantly from 7-day average (${i}%)`),null!==e.stabilityCv&&e.stabilityCv>.05&&!e.isRechargeable&&t.push(`High reading variance (CV: ${(100*e.stabilityCv).toFixed(1)}%)`),0===t.length&&t.push("Battery readings show non-monotonic or inconsistent behavior"),t.join(". ")}function Se(e){return e<1?`${Math.round(24*e)}h`:e<30?`${e.toFixed(1)}d`:`${Math.round(e/30)}mo`}function ke(e){const t=[],a=(e.name||"").toLowerCase();e.manufacturer&&!a.includes(e.manufacturer.toLowerCase())&&t.push(e.manufacturer),e.model&&!a.includes(e.model.toLowerCase())&&t.push(e.model);let i=t.join(" ");return i&&e.platform?i+=` · ${e.platform}`:!i&&e.platform&&(i=e.platform),i||null}function Re(e){const t=e.reliability,a=null!==e.daysRemaining||null!==e.hoursRemaining;if(null==t||!a)return"—";const i=t>=70?"var(--success-color, #43a047)":t>=40?"var(--warning-color, #ffa726)":"var(--disabled-text-color, #999)";return U`<span
    style="display:inline-block;font-size:11px;font-weight:500;padding:1px 6px;border-radius:8px;background:color-mix(in srgb, ${i} 15%, transparent);color:${i}"
    title="Prediction reliability: ${t}%"
    >${t}%</span
  >`}function Ee(e,t){e.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:t}}))}const Ae=((e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,a,i)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(a)+e[i+1],e[0]);return new s(i,e,a)})`
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
  .detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  .detail-name-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .detail-header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
  }
  .detail-header-sub {
    font-size: 14px;
    color: var(--secondary-text-color);
    margin-top: 2px;
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
    margin-bottom: 12px;
  }
  .jp-dialog-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--primary-background-color);
    color: var(--primary-text-color);
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
  }
  .jp-dialog-input:focus {
    border-color: var(--primary-color);
  }
  .jp-dialog-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
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
    flex-wrap: wrap;
    gap: 6px;
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--primary-background-color);
    align-items: center;
    margin-bottom: 12px;
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
  .jp-dialog-or {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin: 12px 0 6px;
    text-align: center;
  }
  .jp-rechargeable-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    user-select: none;
  }
  .jp-rechargeable-toggle:hover {
    border-color: var(--primary-color);
  }
  .jp-rechargeable-toggle ha-icon {
    color: var(--secondary-text-color);
  }
  .jp-rechargeable-toggle:has(input:checked) {
    border-color: var(--success-color, #43a047);
    background: color-mix(
      in srgb,
      var(--success-color, #43a047) 8%,
      transparent
    );
  }
  .jp-rechargeable-toggle:has(input:checked) ha-icon {
    color: var(--success-color, #43a047);
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
  .detail-meta {
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--border);
    padding: 16px;
    margin-bottom: 16px;
  }
  .detail-meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
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
  .detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
    .detail-actions {
      flex-wrap: wrap;
    }
  }
`;function Le(e,t,a){return getComputedStyle(e).getPropertyValue(t).trim()||a}function Ce(e){const t=e._settingsValues?.low_threshold??20;return{icon:{title:"",type:"icon",moveable:!1,showNarrow:!0,template:e=>U`
        <ha-icon
          icon=${ge(e)}
          style="color:${me(e.level,e.threshold,t)}"
        ></ha-icon>
      `},name:{title:"Device",main:!0,sortable:!0,filterable:!0,filterKey:"_searchText",direction:"asc",flex:3,showNarrow:!0,template:t=>{const a=function(e,t){const a=[],i=t._settingsValues?.low_threshold??20;e.replacementPending&&a.push({label_id:"replaced",name:e.isRechargeable?"RECHARGED?":"REPLACED?",color:"#FF9800",description:e.isRechargeable?"Battery level jumped significantly — normal recharge cycle?":"Battery level jumped significantly — was the battery replaced?"});if(e.isLow){const t=e.threshold??i;a.push({label_id:"low",name:"LOW",color:"#F44336",description:`Battery is at ${pe(e.level)}%, below the ${t}% threshold`})}e.isStale&&a.push({label_id:"stale",name:"STALE",color:"#FF9800",description:"No battery reading received within the stale timeout period"});"cliff"===e.anomaly?a.push({label_id:"cliff",name:"CLIFF DROP",color:"#F44336",description:`Sudden drop of ${e.dropSize??"?"}% in a single reading interval`}):"rapid"===e.anomaly&&a.push({label_id:"rapid",name:"RAPID",color:"#F44336",description:`Discharge rate significantly higher than average — ${e.dropSize??"?"}% drop`});"erratic"===e.stability&&a.push({label_id:"erratic",name:"ERRATIC",color:"#9C27B0",description:$e(e)});const s=e.isRechargeable?new Set(["flat","charging","idle"]):new Set;e.predictedEmpty||!ye(e)||s.has(e.predictionStatus)||a.push({label_id:"no-pred",name:ye(e),color:"#9E9E9E",description:be(e.predictionStatus)||""});e.isRechargeable&&function(e){return e.isRechargeable&&("charging"===e.chargingState||"charging"===e.predictionStatus)}(e)&&a.push({label_id:"charging",name:"Charging",icon:"mdi:battery-charging",color:"#4CAF50",description:"Currently charging"});if(null!==e.meanLevel&&e.stability&&"stable"!==e.stability&&"insufficient_data"!==e.stability){const t=pe(e.meanLevel),i=pe(e.level);null!==t&&Math.abs(t-(i??0))>2&&a.push({label_id:"avg",name:`avg ${t}%`,color:"#2196F3",description:`7-day average is ${t}% while current reading is ${i??"?"}%`})}return a}(t,e),i=ke(t);return U`
          <div style="overflow:hidden">
            <span>${t.name||t.sourceEntity}</span>
            ${i?U`<div style=${"font-size:11px;color:var(--secondary-text-color);opacity:0.7;margin-top:1px"}>${i}</div>`:W}
            ${a.length?U`<div style=${"display:flex;flex-wrap:wrap;gap:4px;margin-top:4px"}>${a.map(e=>function(e){return U`
    <span title=${e.description||""} style="display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:500;padding:1px 8px;border-radius:10px;white-space:nowrap;background:color-mix(in srgb, ${e.color} 20%, transparent);color:${e.color}">
      ${e.icon?U`<ha-icon icon=${e.icon} style="--mdc-icon-size:14px"></ha-icon>`:W}
      ${e.name}
    </span>
  `}(e))}</div>`:W}
          </div>
        `}},level:{title:"Level",sortable:!0,type:"numeric",valueColumn:"_levelSort",minWidth:"70px",maxWidth:"90px",showNarrow:!0,template:e=>{const a=me(e.level,e.threshold,t);return U`<span style="color:${a};font-weight:500">${he(e.level)}</span>`}},batteryType:{title:"Type",sortable:!0,minWidth:"60px",maxWidth:"90px",template:e=>U`<span
        style="font-size:12px;color:var(--secondary-text-color)"
        title=${e.batteryTypeSource?`Source: ${e.batteryTypeSource}`:""}
      >${e.batteryType||"—"}</span>`},dischargeRate:{title:"Rate",sortable:!0,type:"numeric",minWidth:"70px",maxWidth:"120px",template:e=>U`<span style=${le}>${_e(e)}</span>`},daysRemaining:{title:"Left",sortable:!0,type:"numeric",minWidth:"55px",maxWidth:"80px",template:e=>U`<span style=${le}>${fe(e)}</span>`},reliability:{title:"Reliability",sortable:!0,type:"numeric",minWidth:"45px",maxWidth:"85px",template:e=>Re(e)},predictedEmpty:{title:"Empty by",sortable:!0,minWidth:"80px",maxWidth:"140px",template:e=>U`<span style=${le}>${e.predictedEmpty?xe(e.predictedEmpty,ve(e)):"—"}</span>`},actions:{title:"",type:"overflow-menu",showNarrow:!0,template:t=>U`
        <ha-dropdown
          @wa-select=${a=>e._handleMenuSelect(a,t.sourceEntity)}
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
    </ha-dropdown-item>`:W}
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
      `}}}function Te(e){const t=e._detailEntity,a=e._getDevice(t);if(!a)return U`<div class="empty-state">Device not found</div>`;const i=ke(a);return U`
    <div class="detail-header">
      <ha-icon
        icon=${ge(a)}
        style="color:${me(a.level,a.threshold)};--mdc-icon-size:40px"
      ></ha-icon>
      <div>
        <div class="detail-name-row">
          <h1>${a.name||a.sourceEntity}</h1>
          <ha-icon-button
            .path=${"M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"}
            style="--mdc-icon-button-size:32px;--mdc-icon-size:20px;color:var(--secondary-text-color)"
            title="More info"
            @click=${()=>{e.dispatchEvent(new CustomEvent("hass-more-info",{bubbles:!0,composed:!0,detail:{entityId:t}}))}}
          ></ha-icon-button>
        </div>
        ${i?U`<div class="detail-header-sub">${i}</div>`:W}
      </div>
    </div>
    ${function(e,t){const a=e._chartData,i=a?.prediction||{},s=a?.charge_prediction,n="history-based"===s?.status,r="normal"===i.status&&null!=i.estimated_days_remaining&&i.estimated_days_remaining<=0,l={normal:r?"Depleted":"Normal discharge",charging:"Currently charging",flat:"Flat — no significant discharge detected",idle:"Idle — not currently discharging",noisy:"Noisy — data too irregular for prediction",insufficient_data:"Not enough data for prediction",single_level:"Single level — all readings identical",insufficient_range:"Insufficient range — readings too close together"}[i.status]||i.status||"Unknown",o=me(t.level,t.threshold);return U`
    <div class="detail-meta">
      <div class="detail-meta-grid">
        <div class="detail-meta-item">
          <div class="detail-meta-label">Current Level</div>
          <div class="detail-meta-value" style="color:${o}">
            ${he(t.level)}
          </div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">Battery Type</div>
          <div class="detail-meta-value">${t.batteryType||"—"}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">Discharge Rate</div>
          <div class="detail-meta-value">${_e(t)}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">Time Remaining</div>
          <div class="detail-meta-value">${fe(t)}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">Status</div>
          <div class="detail-meta-value">${l}</div>
        </div>
        <div class="detail-meta-item">
          <div class="detail-meta-label">Confidence</div>
          <div class="detail-meta-value" title="${function(e,t){if(!e)return"";const a=e.confidence,i=e.r_squared,s=e.data_points_used,n=t?.readings,r=n?.length>=2?(n[n.length-1].t-n[0].t)/86400:null,l=e.t0?(Date.now()/1e3-e.t0)/86400:null,o=null!=r&&null!=l&&r>2*l;if("high"===a){const e=["Good trend fit (R² > 0.8), 7+ days of data, 10+ readings"];return o&&e.push(`Based on recent trend (${Se(l)}) after a rate change was detected in ${Se(r)} of history`),e.join(". ")}const c=[];null!=i&&i<=.8&&c.push(`trend fit is ${i<=.3?"weak":"moderate"} (R² ${i.toFixed(2)})`),null!=l&&l<7&&!o&&c.push(`only ${Se(l)} of data (need 7d+)`),null!=s&&s<10&&c.push(`only ${s} readings (need 10+)`);const d="medium"===a?"Medium":"low"===a?"Low":"Insufficient",h=c.length?`: ${c.join(", ")}`:"";return o?`${d} confidence${h}. A rate change was detected — prediction uses the recent ${Se(l)} trend from ${Se(r)} of history.`:"insufficient_data"===a?"Insufficient data: not enough readings or trend too weak to make a prediction":`${d} confidence${h}`}(s||i,a)}">
            ${s?.confidence?U`<span class="confidence-dot ${s.confidence}"></span>${s.confidence}`:U`<span class="confidence-dot ${i.confidence||""}"></span>${i.confidence||"—"}`}
          </div>
        </div>
        ${null!=i.r_squared?U`<div class="detail-meta-item">
              <div class="detail-meta-label" title="How well the trend line fits the data. 1.0 = perfect fit, 0.0 = no pattern. Above 0.7 is a good fit, below 0.3 means the data is too scattered for a reliable prediction.">R\u00b2</div>
              <div class="detail-meta-value">${i.r_squared.toFixed(3)}</div>
            </div>`:W}
        ${null!=i.reliability?U`<div class="detail-meta-item">
              <div class="detail-meta-label">Reliability</div>
              <div class="detail-meta-value">${Re(t)}</div>
            </div>`:W}
        <div class="detail-meta-item">
          <div class="detail-meta-label">Data Points</div>
          <div class="detail-meta-value">
            ${i.data_points_used>0?i.data_points_used:a?.readings?.length??"—"}${a?.session_count?U` <span style="color:var(--secondary-text-color); font-size:0.85em">(${a.session_count} session${1!==a.session_count?"s":""})</span>`:W}
          </div>
        </div>
        ${a?.charge_prediction?.estimated_full_timestamp?U`<div class="detail-meta-item">
              <div class="detail-meta-label">Predicted Full</div>
              <div class="detail-meta-value">
                ${xe(1e3*a.charge_prediction.estimated_full_timestamp,!0)}
              </div>
            </div>`:t.predictedEmpty?U`<div class="detail-meta-item">
              <div class="detail-meta-label">Predicted Empty</div>
              <div class="detail-meta-value">
                ${xe(t.predictedEmpty,ve(t))}
              </div>
            </div>`:r&&i.estimated_empty_timestamp?U`<div class="detail-meta-item">
              <div class="detail-meta-label">Reached Empty</div>
              <div class="detail-meta-value">
                ${xe(1e3*i.estimated_empty_timestamp,!0)}
              </div>
            </div>`:W}
        ${t.lastCalculated?U`<div class="detail-meta-item">
              <div class="detail-meta-label">Last Calculated</div>
              <div class="detail-meta-value">
                ${xe(1e3*t.lastCalculated,!0)}
              </div>
            </div>`:W}
      </div>
      ${r?U`<div class="detail-reason">
            <ha-icon icon="mdi:battery-alert-variant-outline" style="--mdc-icon-size:18px; color:var(--error-color); flex-shrink:0"></ha-icon>
            <div>
              <strong>Battery depleted</strong>
              <div class="detail-reason-text">This battery has reached 0% and needs replacement.</div>
            </div>
          </div>`:t.predictedEmpty||!i.status||"normal"===i.status||"charging"===i.status&&null!=a?.charge_prediction?.segment_start_timestamp&&!n?W:U`<div class="detail-reason">
            <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:18px; color:var(--secondary-text-color); flex-shrink:0"></ha-icon>
            <div>
              <strong>${n?"Charge estimate based on history":"Why is there no prediction?"}</strong>
              <div class="detail-reason-text">${n?"Currently charging. The estimated time to full is based on previous charging cycles since no live charging data is available yet. Once the battery starts reporting increased levels, the estimate will be based on actual charging data.":be(i.status)||"Unknown reason."}</div>
            </div>
          </div>`}
    </div>
  `}(e,a)}
    ${function(e){if(e._chartLoading)return U`
      <div class="detail-chart" id="jp-chart">
        <div class="loading-state">
          <ha-spinner size="small"></ha-spinner>
          <div>Loading chart data\u2026</div>
        </div>
      </div>
    `;const t=e._chartData&&e._chartData.readings&&e._chartData.readings.length>0;if(!t)return U`
      <div class="detail-chart" id="jp-chart">
        <div class="empty-state">Not enough data yet to display a chart.</div>
      </div>
    `;return U`
    <div class="chart-range-bar">
      ${de.map(t=>U`
          <button
            class="range-pill ${e._chartRange===t.key?"active":""}"
            @click=${()=>{e._chartRange=t.key}}
          >${t.label}</button>
        `)}
    </div>
    ${e._chartStale?U`<div class="chart-stale-notice" @click=${()=>e._loadChartData(e._detailEntity)}>
          <ha-icon icon="mdi:refresh" style="--mdc-icon-size:16px"></ha-icon>
          Data updated \u2014 tap to refresh
        </div>`:W}
    <div class="detail-chart" id="jp-chart"></div>
  `}(e)}
    ${function(e){const t=e._detailEntity;if(!t)return W;const a=e._getDevice(t),i=e._chartData,s=i?.replacement_history||[],n=i?.suspected_replacements||[],r=[...[...s].map(e=>({type:"confirmed",timestamp:e})),...n.map(e=>({type:"suspected",timestamp:e.timestamp,old_level:e.old_level,new_level:e.new_level}))].sort((e,t)=>t.timestamp-e.timestamp);return U`
    ${r.length>0?U`
      <ha-card>
        <div class="card-content">
          <div class="detail-meta-label" style="margin-bottom:8px">Replacement History</div>
          <div class="replacement-table">
            <div class="replacement-table-header">
              <span>Date</span>
              <span>Type</span>
              <span></span>
            </div>
            ${r.map(a=>U`
              <div class="replacement-table-row ${a.type}">
                <span>${xe(1e3*a.timestamp,!0)}</span>
                <span>
                  ${"confirmed"===a.type?U`
                    <ha-icon icon="mdi:battery-sync" style="--mdc-icon-size:16px;color:var(--success-color,#4caf50)"></ha-icon>
                    Replaced
                  `:U`
                    <ha-icon icon="mdi:help-circle-outline" style="--mdc-icon-size:16px;color:var(--warning-color,#ff9800)"></ha-icon>
                    Suspected (${Math.round(a.old_level)}% \u2192 ${Math.round(a.new_level)}%)
                  `}
                </span>
                <span>
                  ${"suspected"===a.type?U`
                    <ha-icon-button
                      .path=${oe}
                      style="--mdc-icon-button-size:28px;color:var(--success-color,#4caf50)"
                      title="Confirm replacement"
                      @click=${()=>e._confirmSuspectedReplacement(t,a.timestamp)}
                    ></ha-icon-button>
                    <ha-icon-button
                      .path=${ce}
                      style="--mdc-icon-button-size:28px;color:var(--error-color,#f44336)"
                      title="Not a replacement"
                      @click=${()=>e._denySuspectedReplacement(t,a.timestamp)}
                    ></ha-icon-button>
                  `:U`
                    <ha-icon-button
                      .path=${ce}
                      style="--mdc-icon-button-size:28px;color:var(--secondary-text-color)"
                      title="Remove this replacement"
                      @click=${()=>e._undoReplacementAt(t,a.timestamp)}
                    ></ha-icon-button>
                  `}
                </span>
              </div>
            `)}
          </div>
        </div>
      </ha-card>
    `:W}
    <div class="detail-actions">
      <ha-button
        @click=${()=>e._markReplaced(t)}
      >
        <ha-icon slot="start" icon="mdi:battery-sync"></ha-icon>
        Mark as replaced
      </ha-button>
      <ha-button
        @click=${async()=>{await e._recalculate(t),setTimeout(()=>e._loadChartData(t),500)}}
      >
        <ha-icon slot="start" icon="mdi:calculator-variant"></ha-icon>
        Recalculate
      </ha-button>
      <ha-button
        @click=${()=>e._setBatteryType(t,a?.batteryType)}
      >
        <ha-icon slot="start" icon="mdi:battery-heart-variant"></ha-icon>
        Set battery type
      </ha-button>
      <ha-button
        @click=${()=>e._ignoreDevice(t)}
      >
        <ha-icon slot="start" icon="mdi:eye-off"></ha-icon>
        Ignore device
      </ha-button>
    </div>
  `}(e)}
  `}function De(e){if(e._shoppingLoading)return U`<div class="devices">
      <div class="empty-state">Loading shopping list...</div>
    </div>`;if(!e._shoppingData||!e._shoppingData.groups)return U`<div class="devices">
      <div class="empty-state">
        No shopping data available. Click refresh to load.
      </div>
    </div>`;const{groups:t,total_needed:a}=e._shoppingData;return 0===t.length?U`<div class="devices">
      <div class="empty-state">No battery devices found.</div>
    </div>`:U`
    <div class="shopping-summary">
      <div class="summary-card">
        <div
          class="value"
          style="color:${a>0?"var(--warning-color)":"var(--success-color)"}"
        >
          ${a}
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
      ${t.map(t=>function(e,t){const a="Unknown"===t.battery_type,i=a?"mdi:help-circle-outline":"mdi:battery",s=!!e._expandedGroups[t.battery_type],n=`${t.battery_count} batter${1!==t.battery_count?"ies":"y"} in ${t.device_count} device${1!==t.device_count?"s":""}${t.needs_replacement>0?` — ${t.needs_replacement} need${1!==t.needs_replacement?"":"s"} replacement`:""}`,r=e._settingsValues?.prediction_horizon??7;return U`
    <ha-expansion-panel
      outlined
      .expanded=${s}
      @expanded-changed=${a=>{const i={...e._expandedGroups};a.detail.expanded?i[t.battery_type]=!0:delete i[t.battery_type],e._expandedGroups=i}}
    >
      <ha-icon slot="leading-icon" icon=${i} style="--mdc-icon-size:20px"></ha-icon>
      <span slot="header" class="shopping-type">${t.battery_type}</span>
      <span slot="secondary">
        ${t.needs_replacement>0?U`<span class="shopping-need-badge">${t.needs_replacement}\u00d7</span> `:W}
        ${n}
      </span>
      <div class="shopping-devices-inner">
        ${t.devices.map(e=>{const t=me(e.level,null),a=e.is_low||null!==e.days_remaining&&e.days_remaining<=r,i=e.battery_count>1?` (${e.battery_count}×)`:"";return U`
            <div class="shopping-device ${a?"needs-replacement":""}">
              <span class="shopping-device-name"
                >${e.device_name}${i}</span
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
        </div>`:W}
  `}const je=[{key:"critical",min:0,max:10,label:"0–10%",colorVar:"--error-color",mix:"50%"},{key:"warning",min:11,max:50,label:"10–50%",colorVar:"--warning-color",mix:"45%"},{key:"healthy",min:51,max:100,label:"50–100%",colorVar:"--success-color",mix:"50%"}];function Me(e){if(!e||e.length<2)return{count:e?.length??0,intervals:[],avgDays:null,accelerating:!1};const t=[...e].sort((e,t)=>e-t),a=[];for(let e=1;e<t.length;e++)a.push((t[e]-t[e-1])/86400);const i=Math.round(a.reduce((e,t)=>e+t,0)/a.length),s=a[a.length-1],n=a.length>1?a.slice(0,-1).reduce((e,t)=>e+t,0)/(a.length-1):i,r=a.length>=2&&s<.5*n;return{count:t.length,intervals:a,avgDays:i,accelerating:r}}function ze(e){const t=e._entities||[],a=function(e){const t={};for(const e of je)t[e.key]=0;let a=0,i=0,s=0,n=0;for(const r of e){if(n++,null==r.level){s++;continue}if(r.isStale){i++;continue}if(r.isRechargeable){a++;continue}const e=Math.ceil(r.level);for(const a of je)if(e>=a.min&&e<=a.max){t[a.key]++;break}}return{buckets:t,rechargeable:a,stale:i,unavailable:s,total:n}}(t);e._fleetData=a;const i=function(e){return e.filter(e=>null!=e.level&&!e.isRechargeable&&null!=e.daysRemaining).sort((e,t)=>e.daysRemaining-t.daysRemaining).slice(0,5)}(t),s=function(e,t){const a=t?.replacement_data||{},i=[];for(const t of e){if(null==t.level||t.isRechargeable)continue;let e=0;const s=a[t.sourceEntity],n=s?.replacement_history?.length??0;null!=t.dischargeRate&&Math.abs(t.dischargeRate)>5?e+=30:null!=t.dischargeRate&&Math.abs(t.dischargeRate)>1&&(e+=15),t.isLow?e+=25:t.level<40&&(e+=10),"cliff"===t.anomaly&&(e+=20),"rapid"===t.anomaly&&(e+=25),"erratic"===t.stability&&(e+=15),n>=3?e+=30:n>=2&&(e+=15),null!=t.daysRemaining&&t.daysRemaining<=7?e+=20:null!=t.daysRemaining&&t.daysRemaining<=30&&(e+=10),e>0&&i.push({entity:t,score:e,replCount:n,replData:s})}return i.sort((e,t)=>t.score-e.score),i.slice(0,3)}(t,e._dashboardData),n=function(e){const t={};for(const a of e){if(null==a.level)continue;let e;if(a.isRechargeable)e="Rechargeable";else{const t=a.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);e=t?t[1].trim():a.batteryType||"Unknown"}t[e]||(t[e]={type:e,devices:[],isRechargeable:"Rechargeable"===e}),t[e].devices.push(a)}const a=Object.values(t).sort((e,t)=>t.devices.length-e.devices.length);for(const e of a){e.buckets={};for(const t of je)e.buckets[t.key]=0;for(const t of e.devices){const a=Math.ceil(t.level);for(const t of je)if(a>=t.min&&a<=t.max){e.buckets[t.key]++;break}}}return a}(t);e._healthByTypeData=n;const r=function(e){let t=0,a=0,i=0,s=0;for(const n of e)null!=n.level&&(n.isRechargeable||(a++,i+=n.level,s++,n.isLow||t++));return{readiness:a>0?Math.round(t/a*100):100,aboveThreshold:t,totalDisposable:a,avgLevel:s>0?Math.round(i/s):0}}(t);return U`
    <div class="jp-dashboard">
      ${function(e,t){const a=t.readiness>=80?"var(--success-color, #43a047)":t.readiness>=50?"var(--warning-color, #ffa726)":"var(--error-color, #db4437)";return U`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Overview</span>
        <span class="jp-badge neutral">${e.total} devices</span>
      </div>
      <div id="jp-fleet-chart" style="padding:4px 8px"></div>
      <div class="db-overview-stats">
        <div class="db-stat">
          <span class="db-stat-value" style="color:${a}">${t.readiness}%</span>
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
  `}(a,r)}
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
            ${t.map(t=>{const a=pe(t.level),i=me(t.level,t.threshold??20),s=t.daysRemaining<=1?Math.round(24*t.daysRemaining)+"h":Math.round(10*t.daysRemaining)/10+"d";return U`
                <tr class="att-row" @click=${()=>e._openDetail(t.sourceEntity)}>
                  <td class="name-cell">${t.name}</td>
                  <td>
                    <div class="level-indicator">
                      <span style="color:${i};font-weight:500">${a}%</span>
                      <div class="level-bar">
                        <div class="level-bar-fill" style="width:${a}%;background:${i}"></div>
                      </div>
                    </div>
                  </td>
                  <td class="dim">${s}</td>
                </tr>
              `})}
          </tbody>
        </table>
      </div>
    </ha-card>
  `}(e,i)}
        ${l=n,U`
    <ha-card>
      <div class="db-card-header">
        <span class="db-card-title">Health by Battery Type</span>
        <span class="jp-badge primary">${l.length} type${1!==l.length?"s":""}</span>
      </div>
      <div class="card-content">
        <div class="type-health-list">
          ${l.map(e=>U`
            <div class="type-health-row">
              <span class="th-type" style="color:${e.isRechargeable?"var(--info-color, #039be5)":"var(--primary-color, #03a9f4)"}">${e.type}</span>
              <div id="jp-type-chart-${He(e.type)}" class="th-chart-container"></div>
              <span class="th-count">${e.devices.length}</span>
            </div>
          `)}
        </div>
      </div>
    </ha-card>
  `}
      </div>
      ${s.length?U`
        <div class="db-card-header" style="padding:0;border:none">
          <span class="db-card-title">Requires Attention</span>
          <span class="jp-badge warning">${s.length} device${1!==s.length?"s":""}</span>
        </div>
        <div class="db-mid-row">
          ${s.map(t=>function(e,{entity:t,replCount:a,replData:i}){const s=me(t.level,t.threshold??20),n=pe(t.level),r=ke(t),l=null!=t.dischargeRate?_e(t):"—",o=null!=t.daysRemaining?t.daysRemaining<=1?Math.round(24*t.daysRemaining)+" hours":Math.round(10*t.daysRemaining)/10+" days":null!=t.hoursRemaining?t.hoursRemaining+" hours":"Unknown",c=null!=t.daysRemaining&&t.daysRemaining<=7?"var(--error-color, #db4437)":"";let d=a>0?`${a}×`:"0";const h=i?.replacement_history||[];if(h.length>=2){if(Me(h).avgDays){d=`${a}× in ${Math.round((Date.now()/1e3-h[0])/2592e3)}mo`}}const p=a>=3?"var(--error-color, #db4437)":a>=2?"var(--warning-color, #ffa726)":"",u=null!=t.reliability?`${t.reliability}%`:"—",g=[];t.isLow&&g.push({label:"LOW",cls:"error"});"cliff"===t.anomaly&&g.push({label:"CLIFF DROP",cls:"error"});"rapid"===t.anomaly&&g.push({label:"RAPID",cls:"error"});"erratic"===t.stability&&g.push({label:"ERRATIC",cls:"warning"});"flat"===t.predictionStatus&&g.push({label:"FLAT",cls:"neutral"});"normal"!==t.predictionStatus||t.isLow||"rapid"===t.anomaly||g.push({label:"NORMAL DISCHARGE",cls:"neutral"});const m=function(e,t,a){if("cliff"===e.anomaly)return"Non-linear cliff discharge. Reports stable level until abrupt collapse. Actual remaining life unpredictable — could be days or weeks. Prediction model unreliable for this device.";if("rapid"===e.anomaly&&t>=3){const i=Me(a);return`Eating batteries at an alarming rate. ${t} ${e.batteryType||"battery"} cells consumed${i.accelerating?" with shrinking intervals":""}. Either the device's radio advertising interval is too aggressive or the hardware is defective.`}if("rapid"===e.anomaly)return"Discharge rate is significantly elevated. Investigate hardware, radio environment, or excessive polling interval.";if(e.isLow&&null!=e.daysRemaining){return`At end-of-life. ${e.batteryType||"battery"} replacement needed soon. ${e.daysRemaining<=1?"Less than a day remaining.":`Predicted empty in ${Math.round(e.daysRemaining)} days.`}`}if(e.isLow)return"Battery is below the low threshold. Replacement recommended.";if("erratic"===e.stability)return"Readings fluctuate irregularly. Possible intermittent connectivity or faulty voltage ADC.";if(null!=e.daysRemaining&&e.daysRemaining<=7)return`Predicted to die within ${Math.round(e.daysRemaining)} days. Replace soon.`;return"Warrants monitoring — review the detail chart for discharge pattern."}(t,a,h),v=t.threshold??20;return U`
    <ha-card class="wanted-card" @click=${()=>e._openDetail(t.sourceEntity)}>
      <div class="wanted-top">
        <div class="wanted-identity">
          <div class="wanted-name">${t.name}</div>
          ${r?U`<div class="wanted-sub">${r}</div>`:W}
        </div>
        <div class="wanted-level" style="color:${s}">${n}%</div>
      </div>
      <div class="wanted-stats">
        <div class="ws"><div class="ws-label">Battery</div><div class="ws-value">${t.batteryType||"Unknown"}</div></div>
        <div class="ws"><div class="ws-label">Remaining</div><div class="ws-value" style="color:${c}">${o}</div></div>
        <div class="ws"><div class="ws-label">Drain Rate</div><div class="ws-value">${l}</div></div>
        <div class="ws"><div class="ws-label">Replacements</div><div class="ws-value" style="color:${p}">${d}</div></div>
        <div class="ws"><div class="ws-label">Reliability</div><div class="ws-value">${u}</div></div>
        <div class="ws"><div class="ws-label">Anomaly</div><div class="ws-value"${t.anomaly&&"normal"!==t.anomaly?' style="color:var(--error-color, #db4437)"':""}>${"cliff"===t.anomaly?"Cliff Drop":"rapid"===t.anomaly?"Rapid":"erratic"===t.stability?"Erratic":"None"}</div></div>
      </div>
      <div class="wanted-gauge">
        <div class="gauge-label">Battery Level</div>
        <div class="gauge-track">
          <div class="gauge-fill" style="width:${n}%;background:${n<=v?"var(--error-color, #db4437)":`linear-gradient(90deg, var(--error-color, #db4437), ${s})`}"></div>
          <div class="gauge-threshold" style="left:${v}%"></div>
        </div>
        <div class="gauge-axis"><span>0%</span><span>threshold</span><span>100%</span></div>
      </div>
      ${g.length?U`
        <div class="wanted-badges">
          ${g.map(e=>U`<span class="jp-badge ${e.cls}">${e.label}</span>`)}
        </div>
      `:W}
      <div class="wanted-verdict">
        <strong>Verdict:</strong> ${m}
      </div>
    </ha-card>
  `}(e,t))}
        </div>
      `:W}
    </div>
  `;var l}function He(e){return e.replace(/[^a-z0-9]/gi,"_").toLowerCase()}function Pe(e,t,{categories:a,series:i,total:s,xMax:n,clickHandler:r},l,o){const c=e.shadowRoot?.getElementById(t);if(!c)return;const d=(t,a)=>Le(e,t,a),h=d("--secondary-text-color","#999"),p=d("--ha-card-background",d("--card-background-color","#fff")),u=d("--primary-text-color","#212121"),g={xAxis:{type:"value",show:!1,max:n||"dataMax"},yAxis:{type:"category",show:!1,data:[""]},legend:o?{show:!0,bottom:0,left:"center",textStyle:{color:h,fontSize:11},itemWidth:10,itemHeight:10,itemGap:14,icon:"roundRect",selectedMode:!0}:{show:!1},tooltip:{trigger:"item",backgroundColor:p,borderColor:d("--divider-color","rgba(0,0,0,0.12)"),textStyle:{color:u,fontSize:12},formatter:e=>`${e.seriesName}: ${e.value} device${1!==e.value?"s":""}`},grid:{left:8,right:8,top:6,bottom:o?40:6,containLabel:!1}};let m=e[l];m&&c.contains(m)||(m=document.createElement("ha-chart-base"),c.innerHTML="",c.appendChild(m),e[l]=m),m.hass=e._hass;const v=o?"90px":"32px";m.height=v,m.style.height=v,m.style.display="block",m.style.cursor="pointer",!m._jpClickBound&&r&&(m.addEventListener("chart-click",e=>{const t=e.detail?.seriesName;if(!t)return;const i=a.find(e=>e.name===t);i&&r(i)}),m._jpClickBound=!0),requestAnimationFrame(()=>{m.data=i,m.options=g})}function Fe(e,t,a){const i=(t,a)=>Le(e,t,a),s=i("--primary-text-color","#212121"),n=je.map(e=>{const a=t.buckets[e.key],s=t.isRechargeable?i("--info-color","#039be5"):i(e.colorVar,"#999"),n=t.isRechargeable?.25+e.min/100*.35:parseFloat(e.mix)/100;return{name:e.label,value:a,color:s,opacity:n,levelMin:e.min,levelMax:e.max}}).filter(e=>e.value>0),r=n.map(e=>({name:e.name,type:"bar",stack:"type",data:[e.value],itemStyle:{color:e.color,opacity:e.opacity,borderRadius:0},barWidth:"80%",label:{show:e.value>0,position:"inside",formatter:`${e.value}`,fontSize:10,fontWeight:500,color:s},emphasis:{focus:"series"}}));return{categories:n,series:r,total:t.devices.length,xMax:a,clickHandler:a=>{e._navigateToDevicesWithLevelFilter(a.levelMin,a.levelMax,{batteryType:{value:[t.type]}})}}}const Ve=async function(e){if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(e=>setTimeout(e,100))}catch(e){}if(!customElements.get("ha-chart-base"))return;e._fleetData&&Pe(e,"jp-fleet-chart",function(e){const t=e._fleetData,a=(t,a)=>Le(e,t,a),i=a("--primary-text-color","#212121"),s=[...je.map(e=>({name:e.label,value:t.buckets[e.key],color:a(e.colorVar,"#999"),opacity:parseFloat(e.mix)/100,levelMin:e.min,levelMax:e.max})),{name:"Rechargeable",value:t.rechargeable,color:a("--info-color","#039be5"),opacity:.55,filter:"rechargeable"},{name:"Stale",value:t.stale,color:a("--disabled-text-color","#999"),opacity:.5,filter:"stale"},{name:"Unavailable",value:t.unavailable,color:a("--disabled-text-color","#999"),opacity:.3,filter:"unavailable"}],n=s.map(e=>({name:e.name,type:"bar",stack:"fleet",data:[e.value],itemStyle:{color:e.color,opacity:e.opacity,borderRadius:0},barWidth:"60%",label:{show:e.value>0,position:"inside",formatter:`${e.value}`,fontSize:11,fontWeight:500,color:i},emphasis:{focus:"series"}})),r=t=>{null!=t.levelMin?e._navigateToDevicesWithLevelFilter(t.levelMin,t.levelMax):"rechargeable"===t.filter?e._navigateToDevicesWithLevelFilter(null,null,{battery:{value:["rechargeable"]}}):"stale"===t.filter?e._navigateToDevicesWithLevelFilter(null,null,{status:{value:["stale"]}}):"unavailable"===t.filter&&e._navigateToDevicesWithLevelFilter(null,null,{status:{value:["unavailable"]}})};return{categories:s,series:n,total:t.total,clickHandler:r}}(e),"_fleetChartEl",!0);const t=e._healthByTypeData;if(t&&t.length){const a=Math.max(...t.map(e=>e.devices.length));for(const i of t)Pe(e,`jp-type-chart-${He(i.type)}`,Fe(e,i,a),`_typeChart_${He(i.type)}`,!1)}};function Ne(e,t,{title:a,preamble:i}){const s=document.createElement("ha-dialog");s.open=!0,s.headerTitle=a,e.shadowRoot.appendChild(s);const n=()=>{s.open=!1,s.remove()},r=document.createElement("div");r.innerHTML=`\n    ${i}\n    <ha-expansion-panel outlined style="margin: 8px 0">\n      <span slot="header">Advanced: set custom date</span>\n      <div style="padding: 8px 0">\n        <p style="margin-top:0; color:var(--secondary-text-color); font-size:0.9em">\n          Register a past battery replacement by selecting the date and time it occurred.</p>\n        <input type="datetime-local" class="jp-datetime-input"\n          style="width:100%; padding:8px; border:1px solid var(--divider-color, #ddd);\n                 border-radius:4px; background:var(--card-background-color, #fff);\n                 color:var(--primary-text-color); font-size:14px; box-sizing:border-box" />\n      </div>\n    </ha-expansion-panel>\n    <div class="jp-dialog-actions">\n      <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n      <ha-button class="jp-dialog-confirm">Mark as replaced</ha-button>\n    </div>\n  `,s.appendChild(r),r.querySelector(".jp-dialog-cancel").addEventListener("click",n),r.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{const a=r.querySelector(".jp-datetime-input");let i;a&&a.value&&(i=new Date(a.value).getTime()/1e3),n(),e._doMarkReplaced(t,i)})}function Ue(e,{title:t,bodyHtml:a,onConfirm:i,confirmLabel:s,confirmVariant:n}){const r=document.createElement("ha-dialog");r.open=!0,r.headerTitle=t,e.shadowRoot.appendChild(r);const l=()=>{r.open=!1,r.remove()},o=document.createElement("div");o.innerHTML=`\n    ${a}\n    <div class="jp-dialog-actions">\n      <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n      <ha-button class="jp-dialog-confirm" ${n?`variant="${n}"`:""}>${s||"Confirm"}</ha-button>\n    </div>\n  `,r.appendChild(o),o.querySelector(".jp-dialog-cancel").addEventListener("click",l),o.querySelector(".jp-dialog-confirm").addEventListener("click",()=>{l(),i()})}customElements.define("juice-patrol-panel",class extends ne{static get properties(){return{narrow:{type:Boolean},_entities:{state:!0},_activeView:{state:!0},_settingsOpen:{state:!0},_settingsValues:{state:!0},_settingsDirty:{state:!0},_shoppingData:{state:!0},_shoppingLoading:{state:!0},_detailEntity:{state:!0},_chartData:{state:!0},_chartLoading:{state:!0},_chartStale:{state:!0},_flashGeneration:{state:!0},_refreshing:{state:!0},_ignoredEntities:{state:!0},_chartRange:{state:!0},_filters:{state:!0},_dashboardData:{state:!0},_dashboardLoading:{state:!0}}}constructor(){super(),this._hass=null,this._panel=null,this._hassInitialized=!1,this._entities=[],this._entityList=[],this._entityHash="",this._activeView="devices",this._settingsOpen=!1,this._settingsValues={},this._settingsDirty=!1,this._shoppingData=null,this._shoppingLoading=!1,this._detailEntity=null,this._chartData=null,this._chartLoading=!1,this._chartStale=!1,this._chartEl=null,this._chartLastLevel=null,this._chartLastPredictedEmpty=null,this._flashGeneration=0,this._ignoredEntities=null,this._chartRange="auto",this._filters={status:{value:["active","low"]}},this._dashboardData=null,this._dashboardLoading=!1,this._sorting={column:"level",direction:"asc"},this._flashCleanupTimer=null,this._refreshTimer=null,this._entityMap=new Map,this._prevLevels=new Map,this._recentlyChanged=new Map,this._cachedColumns=null,this._refreshing=!1,this._expandedGroups={}}set hass(e){const t=this._hass?.connection;this._hass=e;const a=!this._hassInitialized,i=!a&&e?.connection&&e.connection!==t;this._processHassUpdate(a||i),this._hassInitialized=!0}get hass(){return this._hass}set panel(e){this._panel=e}get panel(){return this._panel}get _basePath(){return`/${this._panel?.url_path||"juice-patrol"}`}connectedCallback(){super.connectedCallback(),this.requestUpdate(),this._escapeHandler=e=>{"Escape"===e.key&&this._closeOverlays()},window.addEventListener("keydown",this._escapeHandler),this._popstateHandler=()=>{this._syncViewFromUrl()},window.addEventListener("popstate",this._popstateHandler),this._locationChangedHandler=()=>{this._syncViewFromUrl()},window.addEventListener("location-changed",this._locationChangedHandler),this._visibilityHandler=()=>{if("visible"===document.visibilityState&&this._hass){if(this._processHassUpdate(!1),"detail"===this._activeView&&this._detailEntity){const e=3e5,t=this._chartData?.last_calculated?Date.now()-1e3*this._chartData.last_calculated:1/0;this._chartLoading=!1,t>e&&setTimeout(()=>this._loadChartData(this._detailEntity),500)}"shopping"===this._activeView&&this._loadShoppingList(),"dashboard"===this._activeView&&(this._shoppingData||this._loadShoppingList(),this._loadDashboardData())}},document.addEventListener("visibilitychange",this._visibilityHandler)}disconnectedCallback(){super.disconnectedCallback();for(const e of["_flashCleanupTimer","_refreshTimer"])this[e]&&(clearTimeout(this[e]),this[e]=null);this._escapeHandler&&(window.removeEventListener("keydown",this._escapeHandler),this._escapeHandler=null),this._popstateHandler&&(window.removeEventListener("popstate",this._popstateHandler),this._popstateHandler=null),this._locationChangedHandler&&(window.removeEventListener("location-changed",this._locationChangedHandler),this._locationChangedHandler=null),this._visibilityHandler&&(document.removeEventListener("visibilitychange",this._visibilityHandler),this._visibilityHandler=null),this._detachScrollTracker()}firstUpdated(){this._syncViewFromUrl();const e=new URLSearchParams(window.location.search).get("entity");e&&(this._highlightEntity=e)}_syncViewFromUrl(){const e=window.location.pathname,t=`${this._basePath}/detail/`;if(e.startsWith(t)){const a=decodeURIComponent(e.slice(t.length));return a&&a!==this._detailEntity&&(this._detailEntity=a,this._chartData=null,this._chartEl=null,this._loadChartData(a)),void(this._activeView="detail")}return e===this._basePath||e===`${this._basePath}/`||e===`${this._basePath}/dashboard`||e===`${this._basePath}/dashboard/`?("detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null,this._chartRetried=!1),"dashboard"!==this._activeView&&(this._activeView="dashboard",this._shoppingData||this._loadShoppingList(),this._loadDashboardData()),void(this._entities=this._entityList)):e===`${this._basePath}/shopping`||e===`${this._basePath}/shopping/`?("detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null,this._chartRetried=!1),"shopping"!==this._activeView&&(this._activeView="shopping",this._loadShoppingList()),void(this._entities=this._entityList)):("detail"===this._activeView&&(this._detailEntity=null,this._chartData=null,this._chartEl=null,this._chartRetried=!1),this._activeView="devices",void(this._entities=this._entityList))}updated(e){if((e.has("_chartData")||e.has("_chartRange"))&&this._chartData&&requestAnimationFrame(()=>async function(e,t){const a=e.shadowRoot.getElementById("jp-chart");if(!a||!t||!t.readings||0===t.readings.length)return;if(!customElements.get("ha-chart-base"))try{await(window.loadCardHelpers?.()),await new Promise(e=>setTimeout(e,100))}catch(e){console.warn("Juice Patrol: loadCardHelpers failed",e)}if(!customElements.get("ha-chart-base"))return void(a.innerHTML='<div class="empty-state">Chart component not available</div>');const i=(t,a)=>Le(e,t,a),s=i("--primary-color","#03a9f4"),n=i("--warning-color","#ffa726"),r=i("--error-color","#db4437"),l=i("--success-color","#4caf50");i("--secondary-text-color","#999");const o=i("--secondary-text-color","#999"),c=i("--divider-color","rgba(0,0,0,0.12)"),d=i("--ha-card-background",i("--card-background-color","#fff")),h=i("--primary-text-color","#212121"),p=i("--primary-text-color","#212121"),u=t.readings,g=t.all_readings||u,m=t.prediction,v=t.threshold,y=m.t0??t.first_reading_timestamp,b=g.slice().sort((e,t)=>e.t-t.t).filter((e,t,a)=>0===t||e.t>a[t-1].t).map(e=>[1e3*e.t,e.v]),_=t.charge_prediction,f="charging"===t.charging_state?.toLowerCase()||"charging"===t.prediction?.status,x=_&&_.estimated_full_timestamp,w=!new Set(["idle","flat","single_level","insufficient_data","insufficient_range","noisy","charging"]).has(m.status);let $=[];if(w&&m.prediction_curve&&m.prediction_curve.length>=2){const e=!f&&"normal"===m.status,t=Date.now(),a=m.estimated_empty_timestamp&&1e3*m.estimated_empty_timestamp-t<31536e7;for(const[i,s]of m.prediction_curve){if((!e||!a)&&i>t)break;$.push([i,Math.max(0,Math.min(100,s))])}}else if(w&&null!=m.slope_per_day&&null!=m.intercept&&null!=y){const e=e=>{const t=(e-y)/86400;return m.slope_per_day*t+m.intercept},t=u[0].t,a=Date.now()/1e3,i=!f&&"normal"===m.status;let s=a;if(i&&m.slope_per_day<0){const e=y+(0-m.intercept)/m.slope_per_day*86400;e>a&&e-a<31536e4&&(s=Math.min(e,a+31536e3))}for(const n of[t,a,...i?[s]:[]])$.push([1e3*n,Math.max(0,Math.min(100,e(n)))])}const S=1e3*u[0].t,k=b[0]?.[0]||Date.now(),R=S<k?k:S,E=Date.now();let A;if(f&&_&&null!=_.segment_start_timestamp){const e=_.segment_start_level,a=t.level,i=x?_.slope_per_hour:a>e&&E/1e3-_.segment_start_timestamp>0?(a-e)/((E/1e3-_.segment_start_timestamp)/3600):0;if(i>0){const e=x?1e3*_.estimated_full_timestamp:E+(100-a)/i*36e5;A=e+.1*(e-R)}else A=E+.2*(E-R)}else A=f?E+.2*(E-R):$.length?$[$.length-1][0]:b[b.length-1]?.[0]||E;const L={"1d":864e5,"1w":6048e5,"1m":2592e6,"3m":7776e6,"6m":15552e6,"1y":31536e6};let C,T;const D=e._chartRange||"auto";if("auto"===D)C=R,T=A;else if("all"===D){const e=g.length?1e3*g[0].t:R,t=m.estimated_empty_timestamp?1e3*m.estimated_empty_timestamp:null,a=$.length?$[$.length-1][0]:E;C=Math.min(e,R),T=Math.max(a,t||0,A)}else{const e=L[D]||2592e6;C=E-e;const t=$.length?$[$.length-1][0]:E;T=Math.max(E+e,t)}const j=[];if(t.is_rechargeable&&g.length>=3){const e=[];let t=0;for(let a=1;a<g.length;a++){const i=g[a].v-g[a-1].v;i>1?(-1===t&&e.push({type:"min",idx:a-1,t:g[a-1].t,v:g[a-1].v}),t=1):i<-1&&(1===t&&e.push({type:"max",idx:a-1,t:g[a-1].t,v:g[a-1].v}),t=-1)}if(f&&1===t&&g.length>0){const t=g[g.length-1];e.push({type:"max",idx:g.length-1,t:t.t,v:t.v})}for(let t=0;t<e.length-1;t++)"min"===e[t].type&&"max"===e[t+1].type&&e[t+1].v-e[t].v>=10&&j.push([{xAxis:1e3*e[t].t},{xAxis:1e3*e[t+1].t}])}const M=[],z=[];for(let e=0;e<b.length;e++){const[t,a]=b[e],i=a<=v;if(M.push(i?[t,null]:[t,a]),z.push(i?[t,a]:[t,null]),e>0){const[s,n]=b[e-1];if(n<=v!==i){const e=s+(v-n)/(a-n)*(t-s);M.splice(-1,0,[e,v]),z.splice(-1,0,[e,v])}}}const H=b.length<=50,P=[{name:"Battery Level",type:"line",data:M,smooth:!1,symbol:H?"circle":"none",symbolSize:4,connectNulls:!1,lineStyle:{width:2,color:s},itemStyle:{color:s},areaStyle:{color:s,opacity:.07}},{name:"Battery Level",type:"line",data:z,smooth:!1,symbol:H?"circle":"none",symbolSize:4,connectNulls:!1,lineStyle:{width:2,color:r},itemStyle:{color:r},areaStyle:{color:r,opacity:.1}}];if(j.length>0)for(let e=0;e<j.length;e++){const t=j[e][0].xAxis,a=j[e][1].xAxis;P.push({name:0===e?"Charging":`Charging ${e+1}`,type:"line",data:[[t,100],[a,100]],symbol:"none",lineStyle:{width:0},areaStyle:{color:"rgba(76, 175, 80, 0.18)",origin:0},silent:!0,tooltip:{show:!1}})}$.length>0&&P.push({name:"Discharge prediction",type:"line",data:$,smooth:!1,symbol:"none",lineStyle:{width:2,type:"dashed",color:n},itemStyle:{color:n}});const F=(e,t)=>({show:!0,formatter:e,position:"left",fontSize:10,color:t,distance:6,backgroundColor:"rgba(0,0,0,0.6)",borderRadius:3,padding:[3,6]});if(f&&_&&null!=_.segment_start_timestamp){const e=_.segment_start_timestamp,a=_.segment_start_level,i=Date.now()/1e3,s=t.level,n="history-based"===_.status;let r=x?_.slope_per_hour:null;if((null==r||r<=0)&&s>a){const t=(i-e)/3600;t>0&&(r=(s-a)/t)}if(r>0){const t=(100-s)/r,o=x?_.estimated_full_timestamp:i+3600*t,c=t=>r*((t-e)/3600)+a,d=n?[[1e3*i,s],[1e3*o,100]]:[e,i,o].map(e=>[1e3*e,Math.max(0,Math.min(100,c(e)))]),h=new Date(1e3*o).toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"}),p=d[d.length-1];d[d.length-1]={value:p,symbol:"diamond",symbolSize:6,label:F(`Est. full ${h}`,l)},P.push({name:"Charge prediction",type:"line",data:d,smooth:!1,symbol:"none",lineStyle:{width:2,type:n?"dotted":"dashed",color:l},itemStyle:{color:l}})}}let V=null;if("normal"===m.status&&null!=m.estimated_empty_timestamp&&!f)if(m.prediction_curve&&m.prediction_curve.length>=2)for(let e=1;e<m.prediction_curve.length;e++){const[t,a]=m.prediction_curve[e-1],[i,s]=m.prediction_curve[e];if(a>=v&&s<v){V=t+(a-v)/(a-s)*(i-t),V<=Date.now()&&(V=null);break}}else if(null!=m.slope_per_day&&m.slope_per_day<0&&null!=m.intercept&&null!=y){const e=y+(v-m.intercept)/m.slope_per_day*86400;1e3*e>Date.now()&&(V=1e3*e)}if($.length>0&&!m.prediction_curve&&null!=m.slope_per_day&&null!=m.intercept&&null!=y){const e=e=>{const t=(e/1e3-y)/86400;return m.slope_per_day*t+m.intercept},t=m.estimated_empty_timestamp?1e3*m.estimated_empty_timestamp:null,a=$[$.length-1][0];V&&V>a-1&&V<(t||1/0)&&$.push([V,Math.max(0,Math.min(100,e(V)))]),t&&t>a+1&&$.push([t,Math.max(0,e(t))])}if(V){const e=new Date(V),t=(V-Date.now())/36e5<=48?e.toLocaleString(void 0,{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):e.toLocaleDateString(void 0,{day:"numeric",month:"short",year:"numeric"});P.push({name:"Low battery",type:"line",data:[{value:[V,0],symbol:"none",symbolSize:0},{value:[V,v],symbol:"diamond",symbolSize:6,label:F(`Low ${t}`,r)}],lineStyle:{width:1,type:"dotted",color:r},itemStyle:{color:r},tooltip:{show:!1}})}const N=t.replacement_history||[],U=t.suspected_replacements||[],O=i("--success-color","#4caf50"),W=[...N.map(e=>({ts:1e3*e,type:"confirmed"})),...U.map(e=>({ts:1e3*e.timestamp,type:"suspected"}))].sort((e,t)=>e.ts-t.ts);if(W.length>0){const e=.05*((T||W[W.length-1].ts)-(C||W[0].ts)),t=[100,85,70];let a=0;for(let i=0;i<W.length;i++){const{ts:s,type:n}=W[i],r=i>0?W[i-1].ts:null;a=null!=r&&s-r<e?a+1:0;const l=t[a%t.length],o=new Date(s).toLocaleDateString(void 0,{day:"numeric",month:"short"}),c="confirmed"===n,d=c?O:"#ab47bc",h=F(c?`Replaced ${o}`:`Replaced? ${o}`,d);h.position="right",P.push({name:c?0===i?"Replaced":`Replaced ${i+1}`:0===i?"Suspected":`Suspected ${i+1}`,type:"line",data:[{value:[s,0],symbol:"none",symbolSize:0},{value:[s,l],symbol:"diamond",symbolSize:6,label:h}],lineStyle:{width:1,type:c?"dashed":"dotted",color:d},itemStyle:{color:d},tooltip:{show:!1}})}}const B=e.narrow||a.clientWidth<500,I={xAxis:{type:"time",axisLabel:{color:o,fontSize:B?10:12},axisLine:{lineStyle:{color:c}},splitLine:{lineStyle:{color:c}}},yAxis:{type:"value",min:0,max:100,axisLabel:{formatter:"{value}%",color:o},axisLine:{lineStyle:{color:c}},splitLine:{lineStyle:{color:c}}},tooltip:{trigger:"axis",backgroundColor:d,borderColor:c,textStyle:{color:h},formatter:e=>{if(!e||0===e.length)return"";const t=new Date(e[0].value[0]);let a=`<b>${t.toLocaleDateString(void 0,{month:"short",day:"numeric",year:"numeric"})+" "+t.toLocaleTimeString(void 0,{hour:"2-digit",minute:"2-digit"})}</b><br>`;const i=new Set;for(const t of e){if(t.seriesName?.startsWith("Replaced")||"Low battery"===t.seriesName)continue;if(null==t.value[1])continue;if(i.has(t.seriesName))continue;i.add(t.seriesName);const e="number"==typeof t.value[1]?t.value[1].toFixed(1)+"%":"—";a+=`${t.marker} ${t.seriesName}: ${e}<br>`}return a}},legend:{bottom:0,left:"center",data:["Battery Level","Discharge prediction"],textStyle:{color:p,fontSize:B?10:12},itemGap:B?6:12,selected:{"Discharge prediction":!f,"Charge prediction":f}},dataZoom:[{type:"inside",xAxisIndex:0,filterMode:"none",startValue:C,endValue:T}],grid:{left:B?4:12,right:B?4:12,top:8,bottom:B?32:28,containLabel:!0}};let q=e._chartEl;q&&a.contains(q)||(q=document.createElement("ha-chart-base"),a.innerHTML="",a.appendChild(q),e._chartEl=q),q.hass=e._hass,q.height=B?"300px":"400px",requestAnimationFrame(()=>{q.data=P,q.options=I})}(this,this._chartData)),"dashboard"===this._activeView&&this._fleetData&&(e.has("_entities")||e.has("_activeView"))){const t=e.has("_activeView"),a=JSON.stringify(this._fleetData)+JSON.stringify((this._healthByTypeData||[]).map(e=>({type:e.type,n:e.devices.length,b:e.buckets})));(t||a!==this._lastFleetHash)&&(this._lastFleetHash=a,requestAnimationFrame(()=>Ve(this)))}e.has("_entities")&&(!this._highlightApplied&&this._highlightEntity&&this._applyDeepLinkHighlight(),"detail"===this._activeView&&this._detailEntity&&!this._entityMap.get(this._detailEntity)&&this._closeDetail()),e.has("_activeView")&&("devices"===this._activeView?this._attachScrollTracker():this._detachScrollTracker())}_processHassUpdate(e){if(!this._hass)return;const t=this._entityHash;this._updateEntities();if(this._entityHash!==t&&(this._entityMap=new Map(this._entityList.map(e=>[e.sourceEntity,e])),"detail"!==this._activeView&&(this._entities=this._entityList)),e&&(this._loadConfig(),this._loadIgnored()),"detail"===this._activeView&&this._detailEntity&&!this._chartLoading&&this._chartData){const e=this._getDevice(this._detailEntity);if(e&&!e.isStale){const t=e.predictedEmpty?new Date(e.predictedEmpty).getTime():null,a=this._chartLastPredictedEmpty;this._isPredictionSignificantlyChanged(a,t)&&(this._chartStale=!0)}}}_updateEntities(){if(!this._hass)return;const e=this._hass.states,t=new Map;for(const[a,i]of Object.entries(e)){const e=i.attributes||{},s=e.source_entity;if(!s)continue;if(a.includes("lowest_battery")||a.includes("attention_needed"))continue;if(!(a.includes("_discharge_rate")||a.includes("_days_remaining")||a.includes("_predicted_empty")||a.includes("_battery_low")||a.includes("_stale")))continue;t.has(s)||t.set(s,{sourceEntity:s,name:e.source_name||s,level:null,dischargeRate:null,dischargeRateHour:null,daysRemaining:null,hoursRemaining:null,predictedEmpty:null,isLow:!1,isStale:!1,batteryType:null,batteryTypeSource:null,threshold:null,lastReplaced:null,replacementPending:!1,isRechargeable:!1,rechargeableReason:null,chargingState:null,chemistry:null,chemistryOverride:null,anomaly:null,dropSize:null,stability:null,stabilityCv:null,meanLevel:null,predictionStatus:null,reliability:null,lastCalculated:null,manufacturer:null,model:null,platform:null,_searchText:"",_statusFilter:"active"});const n=t.get(s);if(a.includes("_discharge_rate")){const t=parseFloat(i.state);n.dischargeRate=isNaN(t)?null:t,n.dischargeRateHour=e.discharge_rate_hour??null,n.level=null!=e.level?parseFloat(e.level):null,n.batteryType=e.battery_type||null,n.batteryTypeSource=e.battery_type_source||null,n.threshold=null!=e.threshold?parseFloat(e.threshold):null,n.lastReplaced=e.last_replaced??null,n.replacementPending=e.replacement_pending??!1,n.isRechargeable=e.is_rechargeable??!1,n.rechargeableReason=e.rechargeable_reason??null,n.chargingState=e.charging_state??null,n.chemistry=e.chemistry??null,n.chemistryOverride=e.chemistry_override??null,n.anomaly=e.discharge_anomaly??null,n.dropSize=e.drop_size??null,n.stability=e.stability??null,n.stabilityCv=e.stability_cv??null,n.meanLevel=e.mean_level??null,n.lastCalculated=e.last_calculated??null,n.manufacturer=e.manufacturer??null,n.model=e.model??null,n.platform=e.platform??null}else if(a.includes("_days_remaining")){const t=parseFloat(i.state);n.daysRemaining=isNaN(t)?null:t,n.reliability=e.reliability??null,n.predictionStatus=e.status||null,n.hoursRemaining=e.hours_remaining??null}else a.includes("_predicted_empty")?n.predictedEmpty="unknown"!==i.state&&"unavailable"!==i.state?i.state:null:a.includes("_battery_low")?n.isLow="on"===i.state:a.includes("_stale")&&(n.isStale="on"===i.state)}const a=this._ignoredEntities?new Set(this._ignoredEntities):null,i=[];let s=!1;for(const[n,r]of t){if(a&&a.has(n))continue;const t=[r.name,n,r.batteryType,r.manufacturer,r.model,r.platform];r._searchText=t.filter(Boolean).join(" ").toLowerCase(),r._levelSort=null!==r.level?r.level:999,null===r.level||"unavailable"===e[n]?.state?r._statusFilter="unavailable":r.isStale?r._statusFilter="stale":r.isLow?r._statusFilter="low":r._statusFilter="active";const l=this._prevLevels.get(n);void 0!==l&&null!==r.level&&r.level!==l&&(this._recentlyChanged.set(n,Date.now()),s=!0),null!==r.level&&this._prevLevels.set(n,r.level),i.push(r)}s&&(this._flashGeneration++,this._flashCleanupTimer&&clearTimeout(this._flashCleanupTimer),this._flashCleanupTimer=setTimeout(()=>{this._recentlyChanged.clear(),this._flashGeneration++,this._flashCleanupTimer=null},3e3)),this._entityList=i,this._entityHash=i.map(e=>`${e.sourceEntity}:${e.level}:${e.isLow}:${e.isStale}:${e.dischargeRate}:${e.daysRemaining}:${e.predictedEmpty}:${e.replacementPending}:${e.chargingState}:${e.batteryType}:${e.anomaly}:${e.stability}:${e.reliability}`).join("|")}_getFilteredEntities(){const e=this._filters.status?.value||[],t=this._filters.prediction?.value||[],a=this._filters.battery?.value||[],i=this._filters.batteryType?.value||[],s=this._filters.levelRange?.value,n=s&&(null!=s.min||null!=s.max);return 0!==e.length||0!==t.length||0!==a.length||0!==i.length||n?this._entities.filter(r=>{if(e.length>0&&!e.includes(r._statusFilter))return!1;if(t.length>0&&!t.includes(r.predictionStatus||""))return!1;if(a.length>0){const e=r.isRechargeable?"rechargeable":"disposable";if(!a.includes(e))return!1}if(i.length>0){const e=r.isRechargeable?"Rechargeable":(()=>{const e=r.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);return e?e[1].trim():r.batteryType||"Unknown"})();if(!i.includes(e))return!1}if(n){if(null==r.level)return!1;const e=Math.ceil(r.level);if(null!=s.min&&e<s.min)return!1;if(null!=s.max&&e>s.max)return!1}return!0}):this._entities}_navigateToDevicesWithTypeFilter(e){this._filters={batteryType:{value:[e]}},window.history.pushState(null,"",`${this._basePath}/devices`),this._syncViewFromUrl()}_navigateToDevicesWithLevelFilter(e,t,a){const i={levelRange:{value:{min:e,max:t}},...a};this._filters=i,window.history.pushState(null,"",`${this._basePath}/devices`),this._syncViewFromUrl()}_isPredictionSignificantlyChanged(e,t){if(null==e!=(null==t))return!0;if(null==e&&null==t)return!1;const a=Date.now(),i=Math.max(Math.max(e,t)-a,36e5);return Math.abs(t-e)/i>.1}_getDevice(e){return this._entityMap.get(e)}_formatLevel(e){return he(e)}_showToast(e){Ee(this,e)}_applyDeepLinkHighlight(){this._highlightEntity&&!this._highlightApplied&&(this._highlightApplied=!0,this._openDetail(this._highlightEntity))}async _loadConfig(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_settings"});this._configEntry={entry_id:e.entry_id},this._settingsValues={low_threshold:e.low_threshold,stale_timeout:e.stale_timeout,prediction_horizon:e.prediction_horizon}}catch(e){console.warn("Juice Patrol: failed to load config",e)}}async _saveSettings(){if(this._hass&&this._configEntry)try{await this._hass.callWS({type:"juice_patrol/update_settings",...this._settingsValues}),this._settingsDirty=!1,this._settingsOpen=!1,this._invalidateColumns(),this._showToast("Settings saved")}catch(e){this._showToast("Failed to save settings")}}async _markReplaced(e){const t=this._getDevice(e);t?.isRechargeable?function(e,t){Ne(e,t,{title:"Replace rechargeable battery?",preamble:'\n      <p style="margin-top:0">This device is marked as <strong>rechargeable</strong>, which means\n      Juice Patrol expects its battery level to gradually rise and fall as it\n      charges and discharges. Charging is detected automatically — you don\'t\n      need to do anything when you plug it in.</p>\n      <p><strong>"Mark as replaced"</strong> is for when you physically swap the\n      battery pack itself (e.g. a worn-out cell that no longer holds charge).</p>\n      <p>If you just recharged the device, you can ignore this — Juice Patrol\n      already handles that.</p>'})}(this,e):function(e,t){Ne(e,t,{title:"Mark battery as replaced?",preamble:'\n      <p style="margin-top:0">This tells Juice Patrol that you swapped the batteries.\n      A replacement marker will be added to the timeline. All history is preserved\n      for life expectancy tracking.</p>\n      <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n      This can be undone later if needed.</p>'})}(this,e)}async _doMarkReplaced(e,t){try{const a={type:"juice_patrol/mark_replaced",entity_id:e};null!=t&&(a.timestamp=t),await this._hass.callWS(a),this._showToast("Battery marked as replaced"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to mark as replaced")}}_undoReplacement(e){Ue(this,{title:"Undo battery replacement?",bodyHtml:'\n        <p style="margin-top:0">This will remove the most recent replacement marker\n        from the timeline. Battery history is never deleted.</p>\n        <p style="color:var(--secondary-text-color); font-size:0.9em; margin-bottom:0">\n        You can always re-add it later if needed.</p>',confirmLabel:"Undo replacement",confirmVariant:"danger",onConfirm:()=>this._doUndoReplacement(e)})}async _doUndoReplacement(e){try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:e}),this._showToast("Replacement undone"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to undo replacement")}}_undoReplacementAt(e,t){Ue(this,{title:"Remove replacement?",bodyHtml:`<p style="margin-top:0">Remove the replacement marker from <strong>${new Date(1e3*t).toLocaleDateString()}</strong>? Battery history is never deleted.</p>`,confirmLabel:"Remove",confirmVariant:"danger",onConfirm:async()=>{try{await this._hass.callWS({type:"juice_patrol/undo_replacement",entity_id:e,timestamp:t}),this._showToast("Replacement removed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to remove replacement")}}})}async _confirmReplacement(e){try{await this._hass.callWS({type:"juice_patrol/confirm_replacement",entity_id:e}),this._showToast("Replacement confirmed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to confirm")}}async _confirmSuspectedReplacement(e,t){try{await this._hass.callWS({type:"juice_patrol/mark_replaced",entity_id:e,timestamp:t}),this._showToast("Replacement confirmed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to confirm replacement")}}async _denySuspectedReplacement(e,t){try{await this._hass.callWS({type:"juice_patrol/deny_replacement",entity_id:e,timestamp:t}),this._showToast("Suggestion dismissed"),this._detailEntity===e&&setTimeout(()=>this._loadChartData(e),500)}catch(e){this._showToast("Failed to dismiss suggestion")}}async _recalculate(e){try{await this._hass.callWS({type:"juice_patrol/recalculate",entity_id:e}),this._showToast("Prediction recalculated")}catch(e){this._showToast(ue(e,"recalculation"))}}_confirmRefresh(){Ue(this,{title:"Force refresh",bodyHtml:'\n        <p>Juice Patrol automatically updates predictions whenever a battery level changes and runs a full scan every hour.</p>\n        <p>A manual refresh clears all cached recorder data and recalculates every device from scratch. This is only needed if:</p>\n        <ul style="margin:8px 0;padding-left:20px">\n          <li>You changed a battery type or threshold and want immediate results</li>\n          <li>Predictions seem stale or incorrect after a HA restart</li>\n          <li>You imported historical recorder data</li>\n        </ul>\n        <p style="color:var(--secondary-text-color);font-size:13px">This may take a moment depending on the number of devices.</p>\n      ',confirmLabel:"Refresh now",onConfirm:()=>this._refresh()})}async _refresh(){if(!this._refreshing){this._refreshing=!0;try{await this._hass.callWS({type:"juice_patrol/refresh"}),this._showToast("Predictions refreshed"),"shopping"===this._activeView?setTimeout(()=>this._loadShoppingList(),500):"dashboard"===this._activeView?setTimeout(()=>{this._loadShoppingList(),this._loadDashboardData()},500):"detail"===this._activeView&&this._detailEntity&&setTimeout(()=>this._loadChartData(this._detailEntity),500)}catch(e){this._showToast("Refresh failed")}this._refreshTimer=setTimeout(()=>{this._refreshTimer=null,this._refreshing=!1},2e3)}}async _loadIgnored(){if(this._hass)try{const e=await this._hass.callWS({type:"juice_patrol/get_ignored"});this._ignoredEntities=e.ignored||[]}catch(e){console.warn("Juice Patrol: failed to load ignored",e)}}async _ignoreDevice(e){try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!0}),this._showToast("Device ignored"),this._loadIgnored()}catch(e){this._showToast("Failed to ignore device")}}async _unignoreDevice(e){try{await this._hass.callWS({type:"juice_patrol/set_ignored",entity_id:e,ignored:!1}),this._showToast("Device restored"),this._loadIgnored()}catch(e){this._showToast("Failed to unignore device")}}async _loadShoppingList(){if(this._hass){this._shoppingLoading=!0;try{this._shoppingData=await this._hass.callWS({type:"juice_patrol/get_shopping_list"})}catch(e){if(!this._shoppingRetried)return this._shoppingRetried=!0,this._shoppingLoading=!1,void setTimeout(()=>{this._shoppingRetried=!1,this._loadShoppingList()},1e3);this._shoppingRetried=!1,console.error("Juice Patrol: failed to load shopping list",e),this._shoppingData=null}this._shoppingLoading=!1}}async _loadDashboardData(){if(this._hass){this._dashboardLoading=!0;try{this._dashboardData=await this._hass.callWS({type:"juice_patrol/get_dashboard_data"})}catch(e){if(!this._dashboardRetried)return this._dashboardRetried=!0,this._dashboardLoading=!1,void setTimeout(()=>{this._dashboardRetried=!1,this._loadDashboardData()},1e3);this._dashboardRetried=!1,console.error("Juice Patrol: failed to load dashboard data",e),this._dashboardData=null}this._dashboardLoading=!1}}async _loadChartData(e){if(this._hass&&!this._chartLoading){this._chartLoading=!0;try{const t=await this._hass.callWS({type:"juice_patrol/get_entity_chart",entity_id:e});this._chartLastLevel=t?.level??null;const a=t?.prediction?.estimated_empty_timestamp,i=a?1e3*a:null;this._chartLastPredictedEmpty=i&&i-Date.now()<31536e7?i:null,this._chartData=t,this._chartStale=!1}catch(t){if(!this._chartRetried)return this._chartRetried=!0,this._chartLoading=!1,void setTimeout(()=>this._loadChartData(e),1e3);console.error("Juice Patrol: failed to load chart data",t),this._showToast(ue(t,"chart view"))}this._chartLoading=!1}}async _saveBatteryType(e,t){try{await this._hass.callWS({type:"juice_patrol/set_battery_type",entity_id:e,battery_type:t||""}),this._showToast(t?`Battery type set to ${t}`:"Battery type cleared")}catch(e){this._showToast("Failed to set battery type")}}_openDetail(e){this._saveScrollPosition(),this._detailEntity=e,this._chartData=null,this._chartEl=null,this._chartRange="auto",this._activeView="detail";const t=`${this._basePath}/detail/${encodeURIComponent(e)}`;history.pushState({view:"detail",entityId:e},"",t),this._loadChartData(e)}_closeDetail(){history.back()}_getScroller(){const e=this.shadowRoot?.querySelector("hass-tabs-subpage-data-table"),t=e?.shadowRoot?.querySelector("ha-data-table");return t?.shadowRoot?.querySelector(".scroller")||null}_saveScrollPosition(){const e=this._getScroller();if(e){const t={...history.state||{},scrollPosition:e.scrollTop};history.replaceState(t,"")}}_attachScrollTracker(){if(this._scrollTracker)return;let e=0;const t=()=>{const a=this._getScroller();if(!a)return void(++e<20&&requestAnimationFrame(t));if(this._scrollTracker)return;let i=!1;this._scrollTracker=()=>{i||(i=!0,requestAnimationFrame(()=>{this._saveScrollPosition(),i=!1}))},a.addEventListener("scroll",this._scrollTracker,{passive:!0}),this._scrollTrackerTarget=a;const s=history.state?.scrollPosition;if(s>0){let e=0;const t=()=>{a.scrollHeight>a.clientHeight+s?a.scrollTop=s:++e<30&&requestAnimationFrame(t)};requestAnimationFrame(t)}};requestAnimationFrame(t)}_detachScrollTracker(){this._scrollTracker&&this._scrollTrackerTarget&&(this._scrollTrackerTarget.removeEventListener("scroll",this._scrollTracker),this._scrollTracker=null,this._scrollTrackerTarget=null)}_toggleSettings(){this._settingsOpen=!this._settingsOpen,this._settingsOpen&&(this._settingsDirty=!1,this._loadConfig())}_handleSettingInput(e){const t=e.target.dataset.key;this._settingsValues={...this._settingsValues,[t]:parseFloat(e.target.value)},this._settingsDirty=!0}_cancelSettings(){this._settingsOpen=!1,this._loadConfig()}_handleMenuSelect(e,t){const a=e.detail?.item?.value;if(!a||!t)return;const i=this._getDevice(t);"detail"===a?this._openDetail(t):"confirm"===a?this._confirmReplacement(t):"replace"===a?this._markReplaced(t):"recalculate"===a?this._recalculate(t):"type"===a?this._setBatteryType(t,i?.batteryType):"undo-replace"===a?this._undoReplacement(t):"ignore"===a&&this._ignoreDevice(t)}_closeOverlays(){this.shadowRoot.querySelectorAll("ha-dialog").forEach(e=>{e.open=!1,e.remove()})}_handleRowClick(e){const t=e.detail?.id;t&&this._openDetail(t)}_handleSortingChanged(e){this._sorting=e.detail}_setBatteryType(e,t){!function(e,t,a){e.shadowRoot.querySelectorAll("ha-dialog").forEach(e=>{e.open=!1,e.remove()});const i=e._getDevice(t),s=a||i?.batteryType||"",n=we(s),r=["CR2032","CR2450","CR123A","AA","AAA","Li-ion","Built-in"];let l=[],o=null;if(s&&r.includes(n.type)){for(let e=0;e<n.count;e++)l.push(n.type);o=n.type}let c=i?.isRechargeable||!1,d=!1;const h=["alkaline","lithium_primary","NMC","NiMH"],p={alkaline:"Alkaline",lithium_primary:"Lithium",NMC:"Li-ion",NiMH:"NiMH"};let u=i?.chemistryOverride||null,g=!1;const m=document.createElement("ha-dialog");m.open=!0,m.headerTitle="Set battery type",e.shadowRoot.appendChild(m);const v=()=>{m.open=!1,m.remove()},y=e=>{if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML},b=document.createElement("div");m.appendChild(b);const _=()=>{const e=l.length>0?l.map((e,t)=>`<span class="jp-badge-chip" data-idx="${t}" title="Click to remove">${y(e)} ✕</span>`).join(""):'<span class="jp-badge-placeholder">Click a battery type below, or type a custom value</span>';b.innerHTML=`\n      <div class="jp-dialog-desc">${y(i?.name||t)}</div>\n      <div class="jp-badge-field">${e}</div>\n      <div class="jp-dialog-presets">\n        ${r.map(e=>{const t=null!==o&&e!==o;return`<button class="jp-preset${t?" disabled":""}${e===o?" active":""}"\n            data-type="${e}" ${t?"disabled":""}>${e}</button>`}).join("")}\n      </div>\n      <div class="jp-dialog-or">or type a custom value:</div>\n      <input type="text" class="jp-dialog-input" placeholder="e.g. 18650, LR44, custom..."\n             value="${0!==l.length||r.includes(n.type)?"":y(s)}">\n      <ha-button class="jp-autodetect" style="margin-top:8px;width:100%">\n        <ha-icon slot="start" icon="mdi:auto-fix"></ha-icon>\n        Autodetect\n      </ha-button>\n      <label class="jp-rechargeable-toggle">\n        <input type="checkbox" class="jp-rechargeable-cb" ${c?"checked":""}>\n        <ha-icon icon="mdi:power-plug-battery" style="--mdc-icon-size:16px"></ha-icon>\n        Rechargeable battery\n      </label>\n      <ha-expansion-panel outlined style="margin: 8px 0">\n        <span slot="header">Advanced</span>\n        <div style="padding: 8px 0">\n          <div style="font-size:0.9em; font-weight:500; margin-bottom:6px">Chemistry override</div>\n          <div class="jp-dialog-presets jp-chem-presets">\n            ${h.map(e=>`<button class="jp-preset jp-chem-chip${u===e?" active":""}"\n                data-chem="${e}">${p[e]}</button>`).join("")}\n          </div>\n          <div style="font-size:0.8em; color:var(--secondary-text-color); margin-top:6px">\n            Changes the prediction model used for this device. Leave unset to use\n            the default for this battery type.\n          </div>\n          <div class="jp-chem-warning" style="display:${u?"block":"none"};\n            font-size:0.8em; color:var(--warning-color, #ff9800); margin-top:4px">\n            Overriding chemistry will affect prediction accuracy if incorrect.\n          </div>\n        </div>\n      </ha-expansion-panel>\n      <div class="jp-dialog-actions">\n        <ha-button variant="neutral" class="jp-dialog-clear">Clear</ha-button>\n        <ha-button variant="neutral" class="jp-dialog-cancel">Cancel</ha-button>\n        <ha-button class="jp-dialog-save">Save</ha-button>\n      </div>\n    `,f()},f=()=>{b.querySelectorAll(".jp-badge-chip").forEach(e=>{e.addEventListener("click",()=>{l.splice(parseInt(e.dataset.idx),1),0===l.length&&(o=null),_()})}),b.querySelectorAll(".jp-preset[data-type]:not([disabled])").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.type;o=t,l.push(t);const a=b.querySelector(".jp-dialog-input");a&&(a.value=""),_()})}),b.querySelectorAll(".jp-chem-chip").forEach(e=>{e.addEventListener("click",()=>{const t=e.dataset.chem;u=u===t?null:t,g=!0,_()})}),b.querySelector(".jp-autodetect")?.addEventListener("click",async()=>{const a=b.querySelector(".jp-autodetect");a&&(a.disabled=!0,a.textContent="Detecting...");try{const i=await e._hass.callWS({type:"juice_patrol/detect_battery_type",entity_id:t});if(i.battery_type){const t=we(i.battery_type);if(l=[],o=null,r.includes(t.type)){for(let e=0;e<t.count;e++)l.push(t.type);o=t.type}if(_(),!r.includes(t.type)){const e=b.querySelector(".jp-dialog-input");e&&(e.value=i.battery_type)}Ee(e,`Detected: ${i.battery_type} (${i.source})`)}else Ee(e,"Could not auto-detect battery type"),a&&(a.disabled=!1,a.textContent="Autodetect")}catch(t){console.warn("Juice Patrol: auto-detect failed",t),Ee(e,ue(t,"auto-detection")),a&&(a.disabled=!1,a.innerHTML='<ha-icon icon="mdi:auto-fix" style="--mdc-icon-size:16px;vertical-align:middle;margin-right:4px"></ha-icon> Autodetect')}}),b.querySelector(".jp-rechargeable-cb")?.addEventListener("change",e=>{c=e.target.checked,d=!0}),m.addEventListener("closed",v),b.querySelector(".jp-dialog-cancel")?.addEventListener("click",v),b.querySelector(".jp-dialog-clear")?.addEventListener("click",()=>{l=[],o=null;const e=b.querySelector(".jp-dialog-input");e&&(e.value=""),_()}),b.querySelector(".jp-dialog-save")?.addEventListener("click",async()=>{let a;const i=b.querySelector(".jp-dialog-input"),n=i?.value?.trim();var r,h;l.length>0?(r=o,h=l.length,a=r?h>1?`${h}× ${r}`:r:""):a=n||null,v();const p=a!==(s||null);if(d)try{await e._hass.callWS({type:"juice_patrol/set_rechargeable",entity_id:t,is_rechargeable:c})}catch(t){Ee(e,"Failed to update rechargeable state")}if(p&&await e._saveBatteryType(t,a),g)try{await e._hass.callWS({type:"juice_patrol/set_chemistry_override",entity_id:t,chemistry:u})}catch(t){Ee(e,"Failed to update chemistry override")}});const a=b.querySelector(".jp-dialog-input");a?.addEventListener("keydown",e=>{"Enter"===e.key&&b.querySelector(".jp-dialog-save")?.click(),"Escape"===e.key&&v()})};_()}(this,e,t)}_invalidateColumns(){this._cachedColumns=null}get _tabs(){const e=this._basePath;return[{path:`${e}/dashboard`,name:"Dashboard",iconPath:"M13,3V9H21V3M13,21H21V11H13M3,21H11V15H3M3,13H11V3H3V13Z"},{path:`${e}/devices`,name:"Devices",iconPath:"M16.67,4H15V2H9V4H7.33A1.33,1.33 0 0,0 6,5.33V20.67C6,21.4 6.6,22 7.33,22H16.67A1.33,1.33 0 0,0 18,20.67V5.33C18,4.6 17.4,4 16.67,4Z"},{path:`${e}/shopping`,name:"Shopping List",iconPath:"M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,11.97C16.96,12.58 16.3,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7C5.89,17 5,16.1 5,15C5,14.65 5.09,14.32 5.24,14.04L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z"}]}get _route(){return{path:`/${"detail"===this._activeView?"devices":this._activeView}`,prefix:this._basePath}}_renderToolbarIcons(){return U`
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
    `}get _activeFilterCount(){const e=["active","low"];return Object.entries(this._filters).filter(([t,a])=>"levelRange"===t?a.value&&(null!=a.value.min||null!=a.value.max):!(!Array.isArray(a.value)||!a.value.length)&&("status"!==t||a.value.length!==e.length||!a.value.every(t=>e.includes(t)))).length}get _columns(){return this._cachedColumns||(this._cachedColumns=Ce(this)),this._cachedColumns}render(){if(!this._hass)return U`<div class="loading">Loading...</div>`;if("devices"===this._activeView)return this._renderDevicesView();const e="detail"===this._activeView,t="dashboard"===this._activeView;return U`
      <hass-tabs-subpage
        .hass=${this._hass}
        .narrow=${this.narrow}
        .tabs=${this._tabs}
        .route=${this._route}
        ?main-page=${!e}
        .backCallback=${e?()=>this._closeDetail():void 0}
      >
        ${this._renderToolbarIcons()}
        ${e?U`<div id="jp-content">${Te(this)}</div>`:t?U`<div class="jp-padded">${ze(this)}</div>`:U`<div class="jp-padded">${De(this)}</div>`}
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
    `}_renderBatteryTypeFilterPane(){const e=new Map;for(const t of this._entities||[]){if(null==t.level)continue;let a;if(t.isRechargeable)a="Rechargeable";else{const e=t.batteryType?.match(/^(?:\d+\s*[×x]\s*)?(.+)$/i);a=e?e[1].trim():t.batteryType||"Unknown"}e.set(a,(e.get(a)||0)+1)}const t=[...e.entries()].sort((e,t)=>t[1]-e[1]).map(([e,t])=>({value:e,label:`${e} (${t})`}));if(0===t.length)return W;const a=this._filters.batteryType?.value||[];return U`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${a.length>0}
        header="Battery Type">
        <ha-icon slot="leading-icon" icon="mdi:battery-heart-variant" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-filter-list">
          ${t.map(e=>U`
            <label class="jp-filter-item">
              <ha-checkbox
                .checked=${a.includes(e.value)}
                @change=${t=>this._toggleFilter("batteryType",e.value,t.target.checked)}
              ></ha-checkbox>
              <span>${e.label}</span>
            </label>
          `)}
        </div>
      </ha-expansion-panel>
    `}_renderLevelRangeFilterPane(){const e=this._filters.levelRange?.value,t=e&&(null!=e.min||null!=e.max),a=e?.min??0,i=e?.max??100;return U`
      <ha-expansion-panel slot="filter-pane" outlined
        .expanded=${t}
        header="Battery Level">
        <ha-icon slot="leading-icon" icon="mdi:gauge" style="--mdc-icon-size:20px"></ha-icon>
        <div class="jp-level-range">
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Min</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${a}
              pin
              @change=${t=>{const a=parseInt(t.target.value,10);this._setLevelRange(0===a?null:a,e?.max??null)}}
            ></ha-slider>
            <span class="jp-level-value">${a}%</span>
          </div>
          <div class="jp-level-slider-row">
            <span class="jp-level-label">Max</span>
            <ha-slider
              .min=${0} .max=${100} .step=${1}
              .value=${i}
              pin
              @change=${t=>{const a=parseInt(t.target.value,10);this._setLevelRange(e?.min??null,100===a?null:a)}}
            ></ha-slider>
            <span class="jp-level-value">${i}%</span>
          </div>
          ${t?U`
            <div style="padding:0 16px 8px;text-align:right">
              <ha-button @click=${()=>this._setLevelRange(null,null)}>
                Clear
              </ha-button>
            </div>
          `:W}
        </div>
      </ha-expansion-panel>
    `}_setLevelRange(e,t){if(null==e&&null==t){const{levelRange:e,...t}=this._filters;this._filters={...t}}else this._filters={...this._filters,levelRange:{value:{min:e,max:t}}}}_toggleFilter(e,t,a){const i=this._filters[e]?.value||[],s=a?[...i,t]:i.filter(e=>e!==t);this._filters={...this._filters,[e]:{value:s}}}_clearFilters(){this._filters={}}_renderSettings(){const e=this._settingsValues;return U`
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
    `}_renderSettingRow(e,t,a,i,s,n,r){return U`
      <ha-settings-row narrow>
        <span slot="heading">${e}</span>
        <span slot="description">${t}</span>
        <ha-textfield
          type="number"
          .value=${String(i)}
          min=${s}
          max=${n}
          suffix=${r}
          data-key=${a}
          @input=${this._handleSettingInput}
        ></ha-textfield>
      </ha-settings-row>
    `}static get styles(){return Ae}});
