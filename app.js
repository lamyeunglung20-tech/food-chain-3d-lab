import { FoodChainWorld } from './world.js';

const OCEAN = [
  {id:'plant', en:'Water plant', zh:'水草', emoji:'🌿'},
  {id:'fish', en:'Small fish', zh:'小魚', emoji:'🐟'},
  {id:'seal', en:'Seal', zh:'海豹', emoji:'🦭'},
  {id:'orca', en:'Killer whale', zh:'虎鯨', emoji:'🐋'}
];
const LAND = [
  {id:'grass', en:'Grass', zh:'草', emoji:'🌱'},
  {id:'rabbit', en:'Rabbit', zh:'兔子', emoji:'🐇'},
  {id:'snake', en:'Snake', zh:'蛇', emoji:'🐍'},
  {id:'hawk', en:'Hawk', zh:'鷹', emoji:'🦅'}
];
const INITIAL_OCEAN = ['orca','plant','seal','fish'];
const INITIAL_LAND = ['snake','grass','hawk','rabbit'];
const STAGES = [
  {en:'Order the chain',zh:'排列食物鏈'},
  {en:'Living roles',zh:'生物的角色'},
  {en:'Energy flow',zh:'能量流動'},
  {en:'Figure 3 quiz',zh:'圖三小測'}
];
const ENERGY = [
  {en:{title:'Sun → water plant',organism:'water plant',detail:'The water plant uses sunlight for photosynthesis. It makes food and stores energy.',amount:'Most'},zh:{title:'太陽 → 水草',organism:'水草',detail:'水草利用陽光進行光合作用，製造食物並儲存能量。',amount:'最多'},width:'100%'},
  {en:{title:'Water plant → small fish',organism:'small fish',detail:'The small fish eats the water plant. Only some energy reaches the fish; some is lost along the way.',amount:'Less'},zh:{title:'水草 → 小魚',organism:'小魚',detail:'小魚吃水草，只有部分能量傳到小魚；其餘能量在過程中散失。',amount:'較少'},width:'65%'},
  {en:{title:'Small fish → seal',organism:'seal',detail:'The seal eats the small fish. Less energy reaches the seal than the fish.',amount:'Even less'},zh:{title:'小魚 → 海豹',organism:'海豹',detail:'海豹吃小魚，傳到海豹的能量比小魚層級更少。',amount:'更少'},width:'38%'},
  {en:{title:'Seal → killer whale',organism:'killer whale',detail:'The killer whale is at the end of this chain. The least energy reaches it.',amount:'Least'},zh:{title:'海豹 → 虎鯨',organism:'虎鯨',detail:'虎鯨處於這條食物鏈的末端，獲得的能量最少。',amount:'最少'},width:'18%'}
];
const QUIZ = [
  {en:{prompt:'Which order shows the direction of energy flow in Figure 3?',options:['Grass → rabbit → snake → hawk','Hawk → snake → rabbit → grass','Grass → snake → rabbit → hawk'],explain:'The arrows point from food to the animal that eats it: grass → rabbit → snake → hawk.'},zh:{prompt:'圖三中，哪個次序正確顯示能量流動方向？',options:['草 → 兔子 → 蛇 → 鷹','鷹 → 蛇 → 兔子 → 草','草 → 蛇 → 兔子 → 鷹'],explain:'箭嘴由被吃的生物指向進食者：草 → 兔子 → 蛇 → 鷹。'},answer:0},
  {en:{prompt:'Which organism in Figure 3 is the producer?',options:['Grass','Rabbit','Snake','Hawk'],explain:'Grass makes its own food by photosynthesis, so it is the producer.'},zh:{prompt:'圖三中，哪種生物是生產者？',options:['草','兔子','蛇','鷹'],explain:'草能透過光合作用製造食物，因此是生產者。'},answer:0},
  {en:{prompt:'Which organisms in Figure 3 are consumers?',options:['Rabbit, snake and hawk','Grass, rabbit and snake','Grass only'],explain:'The rabbit, snake and hawk eat other organisms. They are consumers.'},zh:{prompt:'圖三中，哪些生物是消費者？',options:['兔子、蛇和鷹','草、兔子和蛇','只有草'],explain:'兔子、蛇和鷹都以其他生物為食，因此是消費者。'},answer:0},
  {en:{prompt:'Which organism receives energy directly from the rabbit in Figure 3?',options:['Grass','Snake','Hawk'],explain:'The snake eats the rabbit, so energy passes directly from the rabbit to the snake.'},zh:{prompt:'圖三中，哪種生物直接從兔子獲得能量？',options:['草','蛇','鷹'],explain:'蛇吃兔子，因此能量會直接由兔子傳到蛇。'},answer:1},
  {en:{prompt:'How does the energy transferred along the food chain change?',options:['It increases','It decreases','It stays the same'],explain:'Some energy is lost at every transfer, so less energy reaches each later organism.'},zh:{prompt:'沿着食物鏈傳遞到生物的能量會怎樣變化？',options:['逐漸增加','逐漸減少','維持不變'],explain:'每次傳遞都有部分能量散失，因此越往後可用的能量越少。'},answer:1},
  {en:{prompt:'Which statement correctly describes where energy goes?',options:['Some is released as heat during respiration; some remains in waste or uneaten parts','Energy disappears inside the organism','All energy reaches the next organism'],explain:'Respiration releases energy as heat. Energy in waste and uneaten parts also does not reach the next organism.'},zh:{prompt:'哪項正確描述能量未能傳到下一環的原因？',options:['呼吸作用以熱形式散失；部分留在排泄物或未被吃掉的部分','能量在生物體內憑空消失','所有能量都完整傳到下一種生物'],explain:'呼吸作用會以熱形式散失能量；排泄物及未被吃掉的部分也不會把能量傳到下一環。'},answer:0}
];

const el = id => document.getElementById(id);
const activityEl = el('activity');
const state = {lang:'en',stage:0,unlocked:0,chain:[],chainChecked:false,rolePart:0,producer:null,consumers:[],roleChecked:false,energyStep:0,energySeen:false,playing:false,quizIndex:0,quizSelected:null,quizAnswers:[],quizSubmitted:false,finished:false,sound:false};
const world = new FoodChainWorld(el('scene'));
if(!world.available) el('sceneFallback').hidden=false;
let playTimer=null, audioContext=null;
const t=(en,zh)=>state.lang==='en'?en:zh;
const local=obj=>obj[state.lang];
const item=id=>[...OCEAN,...LAND].find(x=>x.id===id);
const name=x=>x[state.lang];
const chain=items=>items.map(name).join(' → ');

function sound(freq=480){if(!state.sound)return;try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.23,audioContext.currentTime+.11);g.gain.setValueAtTime(.035,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.17);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+.18)}catch{}}
function stopPlay(){clearInterval(playTimer);playTimer=null;state.playing=false;world.setEnergyPlaying(false)}
function unlockNext(){state.unlocked=Math.max(state.unlocked,Math.min(3,state.stage+1))}
function goStage(n){if(n>state.unlocked)return;stopPlay();state.stage=n;render();window.scrollTo({top:0,behavior:'smooth'})}
function feedback(text,type='good'){return `<div class="feedback ${type==='error'?'error':type==='neutral'?'neutral':''}" role="status">${text}</div>`}
function button(label,action,disabled=false,secondary=false){return `<button type="button" class="${secondary?'secondary':'primary'}" data-action="${action}" ${disabled?'disabled':''}>${label}</button>`}
function renderStatic(){
  document.documentElement.lang=state.lang==='en'?'en':'zh-Hant';
  document.title=t('Food Chain 3D Lab','食物鏈立體探索室');
  document.querySelector('meta[name="description"]').content=t('Explore food chains in 3D through sorting, energy flow and a six-question quiz.','透過立體模型、食物鏈排序、能量流動及六題小測探索生態。');
  el('brandLink').setAttribute('aria-label',t('Food Chain Lab home','食物鏈探索室首頁'));
  el('brandTitle').textContent=t('FOOD CHAIN','食物鏈');
  el('brandSubtitle').textContent=t('3D Ecology Lab','立體生態探索室');
  el('headerEyebrow').textContent=t('INTERACTIVE SCIENCE','互動科學');
  el('languageLabel').textContent=t('Language','語言');
  el('languageSelect').setAttribute('aria-label',t('Language','語言'));
  el('languageSelect').options[0].textContent=t('English','英文');
  el('languageSelect').options[1].textContent=t('Chinese','中文');
  el('languageSelect').value=state.lang;
  el('soundToggle').setAttribute('aria-label',state.sound?t('Turn off sound','關閉音效'):t('Turn on sound','開啟音效'));
  el('soundToggle').innerHTML=`♪ <span>${state.sound?t('Sound on','音效開啟'):t('Sound off','音效關閉')}</span>`;
  el('heroKicker').textContent=t('FOLLOW THE FLOW OF ENERGY','探索能量的旅程');
  el('heroTitle').innerHTML=t('From one water plant to a <span>food chain</span>','由一株水草走進<span>食物鏈</span>');
  el('chapterPill').innerHTML=`<span class="dot"></span> ${t('4 interactive stages','四個互動關卡')} <span class="pill-divider"></span> ${t('About 5 minutes','約五分鐘')}`;
  el('steps').setAttribute('aria-label',t('Learning progress','學習進度'));
  el('sceneCard').setAttribute('aria-label',t('3D food chain scene','立體食物鏈場景'));
  el('scene').setAttribute('aria-label',t('Drag to rotate the 3D organisms','拖曳以旋轉立體生物模型'));
  el('sceneFallback').textContent=t('Your device cannot display the 3D scene. You can still complete every activity.','你的裝置暫時無法顯示立體模型，但仍可完成所有學習活動。');
  el('liveChipText').textContent=t('INTERACTIVE 3D','互動立體');
  el('dragHint').textContent=t('↔ Drag to rotate','↔ 拖曳旋轉');
  el('footerText').innerHTML=t('FOOD CHAIN 3D LAB <span>·</span> Learn by observing, thinking and trying','食物鏈立體探索室 <span>·</span> 透過觀察、思考和嘗試學習科學');
}
function renderSteps(){el('steps').innerHTML=STAGES.map((x,i)=>`<button type="button" class="step ${i===state.stage?'active':i<state.unlocked?'done':''}" data-stage="${i}" ${i>state.unlocked?'disabled':''} aria-current="${i===state.stage?'step':'false'}"><span class="step-num">${i<state.unlocked?'✓':String(i+1).padStart(2,'0')}</span><strong>${name(x)}</strong></button>`).join('')}
function renderLabels(order){el('sceneLabels').innerHTML=order.map(id=>{const x=item(id);return `<div class="scene-label ${state.stage===0&&state.chain.includes(id)?'selected':''}"><strong>${name(x)}</strong></div>`}).join('')}
function sceneUpdate(){
  const land=state.stage===3;
  const order=land?(state.quizIndex===0&&!state.quizSubmitted?INITIAL_LAND:LAND.map(x=>x.id)):(state.stage===0&&!state.chainChecked?[...state.chain,...INITIAL_OCEAN.filter(x=>!state.chain.includes(x))]:OCEAN.map(x=>x.id));
  world.setMode(land?'land':'ocean');world.setOrder(order);world.setEnergyStep(state.stage===2?state.energyStep:land&&(state.quizIndex>0||state.quizSubmitted||state.finished)?3:-1);world.setEnergyPlaying(state.stage===2&&state.playing);world.setHighlight(state.stage===0?state.chain.at(-1):state.stage===1?state.producer:null);
  renderLabels(order);
  el('sceneTag').textContent=land?t('GRASSLAND ECOSYSTEM','草地生態系'):t('OCEAN ECOSYSTEM','海洋生態系');
  el('sceneHint').textContent=state.stage===2?t('Watch the glowing energy particles move','觀看發光粒子的能量傳遞'):state.stage===3?t('Observe the grassland chain and answer','觀察草地食物鏈並回答問題'):t('Choose the organisms to build the chain','選擇生物，建立食物鏈');
}
function renderChain(){
  const selected=new Set(state.chain);
  activityEl.innerHTML=`<div class="activity-header"><span class="question-id">${t('STAGE 01 / DISCOVER','第一關／探索')}</span><span class="stage-count">01 — 04</span></div><h2 class="activity-title">${t('Who eats whom?','誰吃誰？排列食物鏈')}</h2><p class="activity-sub">${t('Choose the organisms in “food → eater” order to build the ocean food chain in Figure 2.','按「食物 → 進食者」的方向選擇生物，建立圖二的水中食物鏈。')}</p><p class="card-kicker">${t('YOUR FOOD CHAIN','你的食物鏈')}</p><div class="chain-slots">${[0,1,2,3].map((_,i)=>`<div class="slot-wrap"><button type="button" class="slot ${state.chain[i]?'filled':''}" data-action="remove-slot" data-index="${i}" aria-label="${state.chain[i]?t('Remove ','移除')+name(item(state.chain[i])):t(`Empty position ${i+1}`,`第 ${i+1} 個空格`)}"><span class="slot-emoji">${state.chain[i]?item(state.chain[i]).emoji:'＋'}</span><span>${state.chain[i]?name(item(state.chain[i])):t(`Position ${i+1}`,`第 ${i+1} 格`)}</span></button>${i<3?'<span class="slot-arrow" aria-hidden="true">→</span>':''}</div>`).join('')}</div><p class="card-kicker">${t('CHOOSE THE NEXT ORGANISM','選擇下一個生物')}</p><div class="selection-grid">${INITIAL_OCEAN.map(id=>{const x=item(id);return `<button type="button" class="choice ${selected.has(id)?'chosen':''}" data-action="add-chain" data-id="${id}" ${selected.has(id)||state.chainChecked?'disabled':''}><span class="emoji">${x.emoji}</span><strong>${name(x)}</strong></button>`}).join('')}</div>${state.chainChecked?feedback(t(`Well done! Energy flows through ${chain(OCEAN)}.`,`做得好！能量沿着${chain(OCEAN)}傳遞。`)):state.chain.length===4?feedback(t('All four organisms are placed. Check the direction of each arrow.','四種生物已排好，檢查每個箭嘴的方向。'),'neutral'):''}<div class="activity-bottom"><div class="action-row">${state.chainChecked?button(t('Next: living roles →','下一關：生物的角色 →'),'next'):button(t('Check order','檢查次序'),'check-chain',state.chain.length!==4)}${!state.chainChecked?button(t('Start over','重新排列'),'reset-chain',state.chain.length===0,true):''}</div></div>`;
}
function renderRoles(){
  const producer=state.rolePart===0,selected=producer?[state.producer]:state.consumers;
  activityEl.innerHTML=`<div class="activity-header"><span class="question-id">${t('STAGE 02 / IDENTIFY','第二關／辨認')}</span><span class="stage-count">02 — 04</span></div><h2 class="activity-title">${t('What is each organism’s role?','每種生物有甚麼角色？')}</h2><p class="activity-sub">${t('A producer makes its own food. A consumer gets food and energy by eating other organisms.','生產者能自己製造食物；消費者透過進食其他生物獲得食物和能量。')}</p><div class="progress-inline"><span>${producer?'1 / 2':'2 / 2'}</span><i style="--pct:${producer?'50%':'100%'}"></i></div><p class="prompt">${producer?t('Which one is the producer? Choose one.','哪一種生物是生產者？請選一項。'):t('Which ones are consumers? Choose all that apply.','哪些生物是消費者？可選多項。')}</p><div class="selection-grid role-grid">${OCEAN.map(x=>`<button type="button" class="choice ${selected.includes(x.id)?'chosen':''}" data-action="select-role" data-id="${x.id}" ${state.roleChecked?'disabled':''}><span class="emoji">${x.emoji}</span><strong>${name(x)}</strong></button>`).join('')}</div>${state.roleChecked?feedback(producer?t('Correct! The water plant makes food by photosynthesis.','正確！水草透過光合作用製造食物。'):t('Correct! The small fish, seal and killer whale are all consumers.','正確！小魚、海豹和虎鯨都是消費者。')):''}<div class="activity-bottom"><div class="action-row">${state.roleChecked?button(producer?t('Next question →','下一題 →'):t('Next: energy flow →','下一關：能量流動 →'),'role-next'):button(t('Check answer','檢查答案'),'check-role',producer?!state.producer:state.consumers.length===0)}</div></div>`;
}
function renderEnergy(){
  const e=ENERGY[state.energyStep],v=local(e);
  activityEl.innerHTML=`<div class="activity-header"><span class="question-id">${t('STAGE 03 / OBSERVE','第三關／觀察')}</span><span class="stage-count">03 — 04</span></div><h2 class="activity-title">${t('Follow the energy','跟隨能量的足跡')}</h2><p class="activity-sub">${t('Press play. Watch energy move from the producer to each consumer. Pink particles show energy lost during transfer.','按下播放，觀察能量由生產者流向消費者。粉紅色光點表示傳遞過程中散失的能量。')}</p><div class="energy-card"><span class="mini-label">${t('ENERGY FLOW','能量流動')} · ${state.energyStep+1} / 4</span><div class="energy-stats"><div class="energy-stat"><strong>${v.title}</strong><span>${t('Current transfer','目前的能量路線')}</span></div><div class="energy-arrow">↗</div><div class="energy-stat"><strong>${v.amount}</strong><span>${t(`Energy reaching the ${v.organism}`,`傳到${v.organism}的能量`)}</span></div></div><div class="energy-track" style="--energy-width:${e.width}"><div></div></div><div class="mini-label energy-caption">${t('The bar compares relative amounts, not measured percentages.','能量條只比較相對多少，並非實測百分比。')}</div></div><div class="energy-controls">${button(state.playing?t('Pause animation','暫停動畫'):t('Play energy flow','播放能量流動'),state.playing?'pause-energy':'play-energy')}${button(t('Replay from start','從頭播放'),'restart-energy',false,true)}</div><p class="energy-explain">${v.detail}</p>${state.energySeen?feedback(t('Observation complete: less energy reaches each later organism.','觀察完成：越往後，傳到生物的能量越少。')):feedback(t('Play through to the killer whale to unlock the quiz.','播放至虎鯨，便可進入小測。'),'neutral')}<div class="activity-bottom"><div class="action-row">${button(t('Next: Figure 3 quiz →','下一關：圖三小測 →'),'next',!state.energySeen)}</div></div>`;
}
function renderQuiz(){
  if(state.finished){const score=state.quizAnswers.filter((x,i)=>x===QUIZ[i].answer).length;activityEl.innerHTML=`<div class="activity-header"><span class="question-id">${t('MISSION COMPLETE','挑戰完成')}</span><span class="stage-count">04 — 04</span></div><div class="score-badge">${score}/${QUIZ.length}</div><h2 class="activity-title result-title">${score===QUIZ.length?t('Excellent! A perfect score!','太棒了，全部答對！'):t('Food chain challenge complete!','食物鏈挑戰完成！')}</h2><p class="result-copy">${t('You completed the food chain, living roles, energy flow and the Figure 3 quiz.','你已完成食物鏈排序、生物角色、能量流動和圖三小測。')}</p><p class="card-kicker result-review">${t('KEY IDEAS','重點回顧')}</p><ul class="quiz-list"><li><span class="tick">✓</span>${chain(LAND)}</li><li><span class="tick">✓</span>${t('Grass is the producer; rabbit, snake and hawk are consumers.','草是生產者；兔子、蛇和鷹是消費者。')}</li><li><span class="tick">✓</span>${t('Less energy reaches each later organism.','傳到下一環的能量逐漸減少。')}</li><li><span class="tick">✓</span>${t('Heat from respiration, waste and uneaten parts reduce energy transfer.','呼吸散熱、排泄物及未被吃掉的部分使能量未能傳到下一環。')}</li></ul><div class="activity-bottom"><div class="action-row">${button(t('Play again','再玩一次'),'restart-all')}${button(t('Retry the quiz','重做小測'),'retry-quiz',false,true)}</div></div>`;return}
  const q=QUIZ[state.quizIndex],v=local(q);
  activityEl.innerHTML=`<div class="activity-header"><span class="question-id">${t('STAGE 04 / CHALLENGE','第四關／挑戰')}</span><span class="stage-count">04 — 04</span></div><h2 class="activity-title">${t('Figure 3: grassland quiz','圖三：草地食物鏈小測')}</h2><p class="activity-sub">${t('Observe the grass, rabbit, snake and hawk. Answer all six questions.','觀察草、兔子、蛇和鷹，回答全部六道題目。')}</p><div class="progress-inline"><span>${t('Question','題目')} ${state.quizIndex+1} / ${QUIZ.length}</span><i style="--pct:${((state.quizIndex+1)/QUIZ.length)*100}%"></i></div><p class="prompt">${v.prompt}</p><div>${v.options.map((option,i)=>`<button type="button" class="quiz-option ${state.quizSelected===i?'selected':''} ${state.quizSubmitted&&i===q.answer?'correct':''} ${state.quizSubmitted&&state.quizSelected===i&&i!==q.answer?'wrong':''}" data-action="quiz-select" data-index="${i}" ${state.quizSubmitted?'disabled':''}>${state.lang==='en'?String.fromCharCode(65+i)+'.':['甲、','乙、','丙、','丁、'][i]} ${option}</button>`).join('')}</div>${state.quizSubmitted?feedback(`${state.quizSelected===q.answer?t('Correct! ','答對了！'):t('Remember: ','記住：')}${v.explain}`,state.quizSelected===q.answer?'good':'neutral'):''}<div class="activity-bottom"><div class="action-row">${state.quizSubmitted?button(state.quizIndex===QUIZ.length-1?t('See my score','查看成績'):t('Next question →','下一題 →'),'quiz-next'):button(t('Submit answer','提交答案'),'quiz-submit',state.quizSelected===null)}</div></div>`;
}
function renderNote(){const notes=[
  t('The arrow points to the organism receiving energy: from food to eater.','箭嘴指向獲得能量的生物，即由食物指向進食者。'),
  t('Producers make food using sunlight. Consumers eat other organisms.','生產者利用陽光製造食物；消費者需要吃其他生物。'),
  t('Energy does not disappear. Some is released as heat or remains in waste and uneaten parts.','能量不會憑空消失；部分以熱形式散失，或留在排泄物及未被吃掉的部分。'),
  t('Follow the arrows, then think about energy lost at each transfer.','先看箭嘴方向，再想每次能量傳遞有甚麼損失。')
];el('learningNote').innerHTML=`<span class="note-icon">✦</span><p><strong>${t('TIP','提示')}</strong>${t(': ','：')}${notes[state.stage]}</p>`}
function render(){renderStatic();renderSteps();sceneUpdate();if(state.stage===0)renderChain();if(state.stage===1)renderRoles();if(state.stage===2)renderEnergy();if(state.stage===3)renderQuiz();renderNote()}
function checkChain(){if(state.chain.length!==4)return;if(state.chain.join(',')===OCEAN.map(x=>x.id).join(',')){state.chainChecked=true;unlockNext();sound(630);render()}else{state.chain=[];sound(240);render();activityEl.querySelector('.selection-grid').insertAdjacentHTML('beforebegin',feedback(t('Not quite. Start with the organism that makes its own food, then ask who eats whom.','次序尚未正確。先找出能自己製造食物的生物，再想誰吃誰。'),'error'))}}
function checkRole(){const producer=state.rolePart===0,okay=producer?state.producer==='plant':state.consumers.length===3&&['fish','seal','orca'].every(x=>state.consumers.includes(x));if(okay){state.roleChecked=true;if(!producer)unlockNext();sound(620);render()}else{sound(240);render();activityEl.querySelector('.activity-bottom').insertAdjacentHTML('beforebegin',feedback(producer?t('Which organism uses sunlight to make its own food?','哪種生物能利用陽光自己製造食物？'):t('All three animals that eat other organisms are consumers.','三種以其他生物為食的動物都是消費者。'),'error'))}}
function playEnergy(){stopPlay();state.playing=true;world.setEnergyPlaying(true);render();playTimer=setInterval(()=>{if(state.energyStep<3){state.energyStep++;sound(400+state.energyStep*70);render()}else{stopPlay();state.energySeen=true;unlockNext();sound(700);render()}},1550)}
function resetAll(){stopPlay();Object.assign(state,{stage:0,unlocked:0,chain:[],chainChecked:false,rolePart:0,producer:null,consumers:[],roleChecked:false,energyStep:0,energySeen:false,playing:false,quizIndex:0,quizSelected:null,quizAnswers:[],quizSubmitted:false,finished:false});render()}

document.addEventListener('click',event=>{
  const stageButton=event.target.closest('[data-stage]');if(stageButton){goStage(Number(stageButton.dataset.stage));return}
  const b=event.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
  if(a==='add-chain'&&!state.chainChecked&&state.chain.length<4&&!state.chain.includes(id)){state.chain.push(id);sound(440);render()}
  else if(a==='remove-slot'&&!state.chainChecked&&state.chain[Number(b.dataset.index)]){state.chain.splice(Number(b.dataset.index),1);render()}
  else if(a==='reset-chain'){state.chain=[];render()}
  else if(a==='check-chain')checkChain()
  else if(a==='next')goStage(state.stage+1)
  else if(a==='select-role'&&!state.roleChecked){if(state.rolePart===0)state.producer=id;else state.consumers=state.consumers.includes(id)?state.consumers.filter(x=>x!==id):[...state.consumers,id];sound(430);render()}
  else if(a==='check-role')checkRole()
  else if(a==='role-next'){if(state.rolePart===0){state.rolePart=1;state.roleChecked=false;render()}else goStage(2)}
  else if(a==='play-energy')playEnergy()
  else if(a==='pause-energy'){stopPlay();render()}
  else if(a==='restart-energy'){stopPlay();state.energyStep=0;playEnergy()}
  else if(a==='quiz-select'&&!state.quizSubmitted){state.quizSelected=Number(b.dataset.index);sound(420);render()}
  else if(a==='quiz-submit'&&state.quizSelected!==null){state.quizAnswers[state.quizIndex]=state.quizSelected;state.quizSubmitted=true;sound(state.quizSelected===QUIZ[state.quizIndex].answer?660:240);render()}
  else if(a==='quiz-next'){if(state.quizIndex===QUIZ.length-1)state.finished=true;else{state.quizIndex++;state.quizSelected=null;state.quizSubmitted=false}render()}
  else if(a==='retry-quiz'){state.quizIndex=0;state.quizSelected=null;state.quizAnswers=[];state.quizSubmitted=false;state.finished=false;render()}
  else if(a==='restart-all')resetAll()
});
el('languageSelect').addEventListener('change',event=>{state.lang=event.target.value==='zh'?'zh':'en';render()});
el('soundToggle').addEventListener('click',()=>{state.sound=!state.sound;el('soundToggle').setAttribute('aria-pressed',String(state.sound));sound(520);renderStatic()});
render();
