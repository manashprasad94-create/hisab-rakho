import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

function harness(secure = true) {
  const elements = new Map(), requests = [];
  const element = id => {
    if (!elements.has(id)) elements.set(id, {value:id==='confidence'?'40':'test-code', style:{},
      classList:{toggle(){}}, handlers:{}, addEventListener(name, handler){this.handlers[name]=handler;},
      getContext(){return {};}, textContent:'', disabled:false});
    return elements.get(id);
  };
  const context = vm.createContext({document:{getElementById:element,createElement:()=>element('frame'),addEventListener(){}},
    window:{isSecureContext:secure,addEventListener(){}},navigator:{mediaDevices:{getUserMedia:()=>new Promise((resolve,reject)=>requests.push({resolve,reject}))}},
    fetch:async()=>({ok:true,json:async()=>({device:'Test device'})}),AbortController,setTimeout,clearTimeout,performance});
  vm.runInContext(readFileSync(new URL('./app.js',import.meta.url),'utf8'),context);
  return {element, requests, start:()=>element('controls').handlers.submit({preventDefault(){}}),stop:()=>element('stop').handlers.click()};
}

test('stop releases pending permission request; stale completion cannot unlock a newer run', async()=>{
  const h=harness(); let released=0;
  const oldRun=h.start(); assert.equal(h.requests.length,1);
  h.stop(); const newRun=h.start(); assert.equal(h.requests.length,2);
  h.requests[0].resolve({getTracks:()=>[{stop(){released++;}}]}); await oldRun;
  assert.equal(released,1); assert.equal(h.element('start').disabled,true);
  await h.start(); assert.equal(h.requests.length,2);
  h.requests[1].reject(Object.assign(new Error(),{name:'NotAllowedError'})); await newRun;
  assert.equal(h.element('start').disabled,false);
  assert.match(h.element('status').textContent,/denied/);
});

test('insecure phone origins explain HTTPS without requesting the camera',async()=>{
  const h=harness(false); await Promise.resolve(); await Promise.resolve(); await h.start();
  assert.equal(h.requests.length,0); assert.match(h.element('status').textContent,/HTTPS/);
});

test('a cancelled camera play promise cannot update a newer run',async()=>{
  const h=harness(); let finishPlay;
  h.element('video').play=()=>new Promise(resolve=>{finishPlay=resolve;});
  const oldRun=h.start();
  h.requests[0].resolve({getTracks:()=>[{stop(){},addEventListener(){}}]});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(typeof finishPlay,'function');
  h.stop(); const newRun=h.start(); finishPlay(); await oldRun;
  assert.equal(h.element('mode').textContent,'Camera off');
  assert.equal(h.element('start').disabled,true);
  h.requests[1].reject(new Error('test cancelled')); await newRun;
});
