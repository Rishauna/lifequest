import React, { useEffect, useMemo, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Activity, Award, BookOpen, BriefcaseBusiness, CalendarDays, Check, CheckCircle2,
  ChevronRight, CircleHelp, Coins, Flower2, Heart, Home, Leaf, ListTodo, LogIn,
  LogOut, Plus, Settings2, ShieldCheck, Sparkles, Star, Target, Trash2, Trophy,
  Wallet, X, Zap
} from 'lucide-react';

type Category = 'Career and learning' | 'Health and fitness' | 'Personal life' | 'Business and projects' | 'Home and chores' | 'Faith and spiritual growth' | 'Money management';
type Quest = { id: string; title: string; category: Category; difficulty: 'Easy'|'Medium'|'Hard'|'Major'; due: string; repeat: 'Once'|'Daily'|'Weekly'; completed: boolean; completedDate?: string };
type Reward = { id: string; title: string; description: string; cost: number; emoji: string };
type SaveData = { quests: Quest[]; rewards: Reward[]; coins: number; xp: number; completedIds: string[]; redeemedIds: string[]; name: string; avatar: string; lastActive: string; streak: number };
const categories: {name: Category; icon: typeof BookOpen; color: string}[] = [
  {name:'Career and learning', icon:BookOpen, color:'#dce9d9'},
  {name:'Health and fitness', icon:Activity, color:'#f5ddd4'},
  {name:'Personal life', icon:Heart, color:'#f3dfeb'},
  {name:'Business and projects', icon:BriefcaseBusiness, color:'#e1e5f6'},
  {name:'Home and chores', icon:Home, color:'#f5e8c9'},
  {name:'Faith and spiritual growth', icon:Flower2, color:'#e9e0f7'},
  {name:'Money management', icon:Wallet, color:'#d7ece4'}
];
const rewardsSeed: Reward[] = [
  {id:'r1', title:'A guilt-free rest hour', description:'Take a proper break and recharge.', cost:50, emoji:'☕'},
  {id:'r2', title:'Movie or show night', description:'Enjoy a favorite movie or series.', cost:100, emoji:'🍿'},
  {id:'r3', title:'A little treat', description:'Choose a small treat within your budget.', cost:150, emoji:'🍰'}
];
const questSeed: Quest[] = [
  {id:'q1',title:'Plan my top 3 priorities',category:'Personal life',difficulty:'Easy',due:today(),repeat:'Daily',completed:false},
  {id:'q2',title:'Study or practice for 25 minutes',category:'Career and learning',difficulty:'Medium',due:today(),repeat:'Daily',completed:false},
  {id:'q3',title:'Move my body in a way that feels good',category:'Health and fitness',difficulty:'Medium',due:today(),repeat:'Daily',completed:false},
  {id:'q4',title:'Tidy one small area',category:'Home and chores',difficulty:'Easy',due:today(),repeat:'Daily',completed:false}
];
function today(){return new Date().toISOString().slice(0,10)}
function newId(){return Math.random().toString(36).slice(2,10)}
function xpFor(d: Quest['difficulty']) { return ({Easy:10,Medium:25,Hard:50,Major:100})[d]; }
function coinsFor(d: Quest['difficulty']) { return ({Easy:5,Medium:10,Hard:20,Major:40})[d]; }
function levelFor(xp:number){let level=1, remaining=xp; while(remaining >= level*100){remaining-=level*100;level++;} return {level, current:remaining, needed:level*100};}
function freshSave(): SaveData {return {quests:questSeed.map(q=>({...q})), rewards:rewardsSeed.map(r=>({...r})), coins:0,xp:0,completedIds:[],redeemedIds:[],name:'Player',avatar:'🌿',lastActive:today(),streak:1};}
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string|undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string|undefined;
const cloudReady = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR-PROJECT') && !supabaseKey.includes('YOUR_SUPABASE'));
let supabase: SupabaseClient | null = cloudReady ? createClient(supabaseUrl!,supabaseKey!) : null;

export default function App(){
  const [data,setData] = useState<SaveData>(() => {
    try {const raw=localStorage.getItem('lifequest-save-v1'); return raw ? {...freshSave(),...JSON.parse(raw)} : freshSave();} catch {return freshSave();}
  });
  const [tab,setTab] = useState<'Today'|'Quests'|'Rewards'|'Progress'>('Today');
  const [filter,setFilter] = useState<Category|'All'>('All');
  const [showAdd,setShowAdd] = useState(false);
  const [showReward,setShowReward] = useState(false);
  const [showSettings,setShowSettings] = useState(false);
  const [questTitle,setQuestTitle] = useState('');
  const [questCategory,setQuestCategory] = useState<Category>('Career and learning');
  const [difficulty,setDifficulty] = useState<Quest['difficulty']>('Medium');
  const [repeat,setRepeat] = useState<Quest['repeat']>('Once');
  const [due,setDue] = useState(today());
  const [rewardTitle,setRewardTitle] = useState('');
  const [rewardCost,setRewardCost] = useState('100');
  const [rewardEmoji,setRewardEmoji] = useState('🎁');
  const [profileName,setProfileName] = useState(data.name);
  const [avatar,setAvatar] = useState(data.avatar);
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [userEmail,setUserEmail] = useState<string|null>(null);
  const [authMessage,setAuthMessage] = useState('');
  const [syncMessage,setSyncMessage] = useState(cloudReady?'Cloud sync ready when you sign in.':'Saved on this device. Add Supabase settings to enable cloud sync.');
  const [busy,setBusy] = useState(false);

  useEffect(()=>{localStorage.setItem('lifequest-save-v1',JSON.stringify(data));},[data]);
  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data:{session}})=>{if(session?.user){setUserEmail(session.user.email ?? null);loadCloud(session.user.id);}});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{setUserEmail(session?.user.email ?? null);if(session?.user)loadCloud(session.user.id);});
    return ()=>subscription.unsubscribe();
  },[]);
  async function loadCloud(uid:string){
    if(!supabase)return;
    const {data:row,error}=await supabase.from('lifequest_saves').select('save_data').eq('user_id',uid).maybeSingle();
    if(error){setSyncMessage('Cloud read issue: '+error.message);return;}
    if(row?.save_data){setData({...freshSave(),...row.save_data});setSyncMessage('Synced from your cloud save.');}
    else setSyncMessage('Account connected. Your current save will sync shortly.');
  }
  useEffect(()=>{
    if(!supabase || !userEmail)return;
    const timer=window.setTimeout(async()=>{
      setSyncMessage('Syncing…');
      const {data:{user}}=await supabase!.auth.getUser();
      if(!user)return;
      const {error}=await supabase!.from('lifequest_saves').upsert({user_id:user.id,save_data:data,updated_at:new Date().toISOString()});
      setSyncMessage(error?'Cloud sync issue: '+error.message:'Saved to cloud.');
    },900);
    return ()=>window.clearTimeout(timer);
  },[data,userEmail]);

  const level=levelFor(data.xp);
  const doneToday=data.quests.filter(q=>q.completed && q.completedDate===today()).length;
  const todayQuests=data.quests.filter(q=>q.due===today() || (q.repeat==='Daily' && q.due<=today()));
  const visibleQuests=(tab==='Today'?todayQuests:data.quests).filter(q=>filter==='All'||q.category===filter);
  const completionRate= data.quests.length ? Math.round(data.quests.filter(q=>q.completed).length/data.quests.length*100):0;
  const byCategory=useMemo(()=>categories.map(c=>({name:c.name,count:data.quests.filter(q=>q.category===c.name&&q.completed).length,total:data.quests.filter(q=>q.category===c.name).length})),[data.quests]);
  function completeQuest(q:Quest){
    if(q.completed)return;
    const xp=xpFor(q.difficulty), coins=coinsFor(q.difficulty);
    setData(old=>({...old,xp:old.xp+xp,coins:old.coins+coins,completedIds:[...old.completedIds,q.id],quests:old.quests.map(item=>item.id===q.id?{...item,completed:true,completedDate:today()}:item),lastActive:today(),streak:old.lastActive===today()?old.streak:old.streak+1}));
  }
  function addQuest(e:React.FormEvent){
    e.preventDefault();if(!questTitle.trim())return;
    setData(old=>({...old,quests:[{id:newId(),title:questTitle.trim(),category:questCategory,difficulty,due,repeat,completed:false},...old.quests]}));
    setQuestTitle('');setShowAdd(false);setTab('Quests');
  }
  function addReward(e:React.FormEvent){
    e.preventDefault();if(!rewardTitle.trim())return;
    setData(old=>({...old,rewards:[{id:newId(),title:rewardTitle.trim(),description:'A reward you chose for yourself.',cost:Math.max(1,Number(rewardCost)||1),emoji:rewardEmoji},...old.rewards]}));
    setRewardTitle('');setShowReward(false);
  }
  function redeemReward(r:Reward){
    if(data.coins<r.cost)return;
    if(!confirm(`Redeem "${r.title}" for ${r.cost} coins?`))return;
    setData(old=>({...old,coins:old.coins-r.cost,redeemedIds:[...old.redeemedIds,r.id+'-'+Date.now()]}));
  }
  async function signIn(e:React.FormEvent){
    e.preventDefault();if(!supabase){setAuthMessage('Cloud sync is not configured yet. Follow the README setup steps first.');return;}
    setBusy(true);setAuthMessage('');
    const {error}=await supabase.auth.signInWithPassword({email,password});
    if(error)setAuthMessage(error.message);else setAuthMessage('Signed in. Your save will sync.');
    setBusy(false);
  }
  async function signUp(){
    if(!supabase){setAuthMessage('Cloud sync is not configured yet. Follow the README setup steps first.');return;}
    if(!email||!password){setAuthMessage('Enter an email and password first.');return;}
    setBusy(true);const {error}=await supabase.auth.signUp({email,password});
    setAuthMessage(error?error.message:'Account created. Check your email if confirmation is enabled, then sign in.');
    setBusy(false);
  }
  async function signOut(){if(supabase)await supabase.auth.signOut();setUserEmail(null);setSyncMessage('Signed out. This device still has its local save.');}
  function resetDaily(){
    if(!confirm('Start a fresh day? Completed recurring tasks will reset, but your XP and coins will stay.'))return;
    setData(old=>({...old,lastActive:today(),quests:old.quests.map(q=>(q.repeat!=='Once' && q.completed)?{...q,completed:false,completedDate:undefined,due:today()}:q)}));
  }
  const catIcon=(name:Category)=>categories.find(c=>c.name===name)?.icon??Star;
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Leaf size={22}/></div><div><strong>lifequest</strong><span>YOUR LIFE, YOUR QUEST</span></div></div>
      <div className="profile-card"><div className="avatar">{data.avatar}</div><div className="profile-text"><strong>{data.name}</strong><span>Level {level.level} · Growing every day</span></div><button className="icon-btn" title="Customize profile" onClick={()=>setShowSettings(true)}><Settings2 size={17}/></button></div>
      <div className="side-label">YOUR WORLD</div>
      {(['Today','Quests','Rewards','Progress'] as const).map((item,i)=>{const Icon=[Target,ListTodo,GiftIcon,Trophy][i];return <button key={item} className={'nav-item '+(tab===item?'active':'')} onClick={()=>setTab(item)}><Icon size={18}/><span>{item==='Today'?'My day':item==='Quests'?'Quest board':item==='Rewards'?'Reward shop':'My progress'}</span>{item==='Today'&&<span className="nav-count">{todayQuests.filter(q=>!q.completed).length}</span>}</button>})}
      <div className="side-label category-label">LIFE CATEGORIES</div>
      {categories.map(c=>{const Icon=c.icon;return <button key={c.name} className={'category-link '+(filter===c.name?'selected':'')} onClick={()=>{setFilter(filter===c.name?'All':c.name);setTab('Quests')}}><span className="category-dot" style={{background:c.color}}><Icon size={14}/></span><span>{c.name}</span></button>})}
      <div className="sidebar-bottom"><div className="tiny-leaf"><Flower2 size={18}/></div><p>Small steps grow into big things.</p><span>You've got this.</span></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><div className="eyebrow">{new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</div><h1>{tab==='Today'?'A little progress goes a long way.':tab==='Quests'?'Your quest board':tab==='Rewards'?'A little something to look forward to.':'Look how far you have come.'}</h1></div><div className="top-actions"><div className="coin-pill"><Coins size={17}/><strong>{data.coins}</strong><span>coins</span></div><button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={17}/> New quest</button></div></header>
      {tab==='Today'&&<><section className="hero-card"><div className="hero-copy"><div className="pill-label"><Sparkles size={14}/> YOUR DAILY GROWTH</div><h2>Make today<br/>count, <em>your way.</em></h2><p>Every small action is a win. Choose what matters, take it one quest at a time, and give yourself credit for showing up.</p><button className="light-btn" onClick={()=>setTab('Quests')}>See all quests <ChevronRight size={16}/></button></div><div className="hero-art"><div className="sun"></div><div className="hill hill-back"></div><div className="hill hill-front"></div><div className="little-house">⌂</div><div className="plant plant-one">🌿</div><div className="plant plant-two">🌱</div><div className="art-note"><Star size={14} fill="currentColor"/> progress over perfection</div></div></section>
      <section className="stats-grid"><Stat icon={<Zap/>} label="TOTAL EXPERIENCE" value={data.xp.toLocaleString()} foot={`${level.current} / ${level.needed} XP to next level`} color="sage"/><Stat icon={<Coins/>} label="LIFE COINS" value={data.coins.toLocaleString()} foot="Earned by completing quests" color="peach"/><Stat icon={<CheckCircle2/>} label="DONE TODAY" value={`${doneToday}`} foot={`${todayQuests.filter(q=>!q.completed).length} quests left to explore`} color="lavender"/><Stat icon={<Trophy/>} label="CURRENT LEVEL" value={`${level.level}`} foot="Keep growing at your pace" color="yellow"/></section>
      <section className="content-grid"><div className="panel quests-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR NEXT STEPS</span><h3>Today's quests <span className="count-bubble">{todayQuests.filter(q=>!q.completed).length}</span></h3></div><button className="text-btn" onClick={()=>setTab('Quests')}>View all <ChevronRight size={15}/></button></div>{todayQuests.length===0?<Empty text="Your day is wide open. Add a quest to get started."/>:<div className="quest-list">{todayQuests.slice(0,5).map(q=><QuestRow key={q.id} quest={q} onComplete={()=>completeQuest(q)}/>)}</div>}<button className="add-quiet" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add another quest</button></div><div className="panel level-panel"><div className="panel-heading"><div><span className="section-kicker">YOUR JOURNEY</span><h3>Growing steadily</h3></div><div className="level-flower">✿</div></div><div className="level-illustration"><div className="level-orbit orbit-a"></div><div className="level-orbit orbit-b"></div><div className="level-plant">🌿</div><div className="level-number">{level.level}</div></div><div className="level-summary"><div><strong>Level {level.level}</strong><span>Little by little</span></div><span className="xp-small">{level.current} / {level.needed} XP</span></div><div className="progress-track"><div style={{width:`${Math.min(100,level.current/level.needed*100)}%`}}/></div><p className="gentle-note">You don't have to do it all. Just the next small thing.</p></div></section>
      <section className="bottom-grid"><div className="panel"><div className="panel-heading"><div><span className="section-kicker">LIFE IN BALANCE</span><h3>Your life areas</h3></div><button className="text-btn" onClick={()=>setTab('Progress')}>Details <ChevronRight size={15}/></button></div><div className="life-areas">{categories.slice(0,4).map(c=>{const Icon=c.icon;const completed=data.quests.filter(q=>q.category===c.name&&q.completed).length;const total=data.quests.filter(q=>q.category===c.name).length;return <div className="life-area" key={c.name}><span className="area-icon" style={{background:c.color}}><Icon size={16}/></span><div className="area-info"><strong>{c.name}</strong><span>{completed} of {total} quests complete</span></div><div className="mini-track"><div style={{width:`${total?completed/total*100:0}%`}}/></div></div>})}</div></div><div className="quote-card"><div className="quote-mark">“</div><p>Growth isn't always loud. Sometimes it's just keeping a promise to yourself.</p><span>YOUR GENTLE REMINDER</span><div className="quote-flower">✿</div></div></section></>}
      {tab==='Quests'&&<section className="panel full-panel"><div className="panel-heading"><div><span className="section-kicker">MAKE YOUR OWN MOMENTUM</span><h3>Quest board</h3></div><button className="primary-btn" onClick={()=>setShowAdd(true)}><Plus size={17}/> New quest</button></div><div className="filter-row"><button className={filter==='All'?'filter-chip chosen':'filter-chip'} onClick={()=>setFilter('All')}>All quests</button>{categories.map(c=><button key={c.name} className={filter===c.name?'filter-chip chosen':'filter-chip'} onClick={()=>setFilter(c.name)}>{c.name}</button>)}</div><div className="quest-list">{visibleQuests.length?visibleQuests.map(q=><QuestRow key={q.id} quest={q} onComplete={()=>completeQuest(q)} onDelete={()=>setData(old=>({...old,quests:old.quests.filter(item=>item.id!==q.id)}))}/>):<Empty text="No quests here yet. Add one small step to begin."/ >}</div></section>}
      {tab==='Rewards'&&<section className="panel full-panel"><div className="panel-heading"><div><span className="section-kicker">YOU EARNED THIS</span><h3>Reward shop</h3><p className="subheading">You have <b>{data.coins} coins</b> to spend on rewards that feel good to you.</p></div><button className="primary-btn" onClick={()=>setShowReward(true)}><Plus size={17}/> Add reward</button></div><div className="rewards-grid">{data.rewards.map(r=><div className="reward-card" key={r.id}><div className="reward-emoji">{r.emoji}</div><h4>{r.title}</h4><p>{r.description}</p><div className="reward-bottom"><span><Coins size={16}/>{r.cost}</span><button disabled={data.coins<r.cost} onClick={()=>redeemReward(r)}>{data.coins>=r.cost?'Redeem':'Keep earning'}</button></div></div>)}</div><div className="redeem-note"><ShieldCheck size={18}/><span>Rewards are yours to define. Choose things that support your wellbeing and fit your budget.</span></div></section>}
      {tab==='Progress'&&<section className="progress-page"><div className="stats-grid"><Stat icon={<Trophy/>} label="CURRENT LEVEL" value={`${level.level}`} foot={`${level.current} / ${level.needed} XP to next level`} color="yellow"/><Stat icon={<CheckCircle2/>} label="QUESTS COMPLETED" value={`${data.quests.filter(q=>q.completed).length}`} foot="Your effort adds up" color="sage"/><Stat icon={<Target/>} label="COMPLETION RATE" value={`${completionRate}%`} foot="Across all saved quests" color="lavender"/><Stat icon={<Award/>} label="REWARDS REDEEMED" value={`${data.redeemedIds.length}`} foot="Little moments to enjoy" color="peach"/></div><div className="panel"><div className="panel-heading"><div><span className="section-kicker">YOUR JOURNEY, AT A GLANCE</span><h3>Life area progress</h3></div></div><div className="progress-areas">{byCategory.map(c=>{const cat=categories.find(x=>x.name===c.name)!;const Icon=cat.icon;return <div className="progress-area" key={c.name}><span className="area-icon" style={{background:cat.color}}><Icon size={17}/></span><div className="progress-area-main"><div className="progress-area-label"><strong>{c.name}</strong><span>{c.count}/{c.total} completed</span></div><div className="progress-track"><div style={{width:`${c.total?c.count/c.total*100:0}%`}}/></div></div></div>})}</div></div><div className="panel achievements"><div className="panel-heading"><div><span className="section-kicker">MILESTONES</span><h3>Achievements</h3></div></div><div className="achievement-grid"><Achievement emoji="🌱" title="First steps" desc="Complete your first quest" unlocked={data.quests.some(q=>q.completed)}/><Achievement emoji="🌼" title="Getting into it" desc="Complete 5 quests" unlocked={data.quests.filter(q=>q.completed).length>=5}/><Achievement emoji="🌳" title="Growing strong" desc="Reach 500 XP" unlocked={data.xp>=500}/><Achievement emoji="🪙" title="Little saver" desc="Earn 100 coins" unlocked={data.coins>=100}/></div></div></section>}
      <footer className="app-footer"><span>✿ LifeQuest</span><span>{syncMessage}</span><button className="footer-link" onClick={()=>setShowSettings(true)}>Settings & sync</button></footer>
    </main>
    <nav className="mobile-nav">{(['Today','Quests','Rewards','Progress'] as const).map((item,i)=>{const Icon=[Target,ListTodo,GiftIcon,Trophy][i];return <button key={item} className={tab===item?'active':''} onClick={()=>setTab(item)}><Icon size={19}/><span>{item==='Today'?'My day':item==='Quests'?'Quests':item==='Rewards'?'Rewards':'Progress'}</span></button>})}</nav>
    {showAdd&&<Modal title="Create a new quest" close={()=>setShowAdd(false)}><form onSubmit={addQuest} className="form-stack"><label>Quest name<input autoFocus value={questTitle} onChange={e=>setQuestTitle(e.target.value)} placeholder="e.g. Read for 20 minutes" required/></label><label>Life category<select value={questCategory} onChange={e=>setQuestCategory(e.target.value as Category)}>{categories.map(c=><option key={c.name}>{c.name}</option>)}</select></label><div className="form-two"><label>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value as Quest['difficulty'])}><option>Easy</option><option>Medium</option><option>Hard</option><option>Major</option></select></label><label>Repeat<select value={repeat} onChange={e=>setRepeat(e.target.value as Quest['repeat'])}><option>Once</option><option>Daily</option><option>Weekly</option></select></label></div><label>Due date<input type="date" value={due} onChange={e=>setDue(e.target.value)} required/></label><div className="earn-preview"><Zap size={16}/><span>Complete this quest to earn <b>{xpFor(difficulty)} XP</b> and <b>{coinsFor(difficulty)} coins</b>.</span></div><button className="primary-btn submit-btn" type="submit"><Plus size={17}/> Add to my quest board</button></form></Modal>}
    {showReward&&<Modal title="Create a personal reward" close={()=>setShowReward(false)}><form onSubmit={addReward} className="form-stack"><label>Reward name<input autoFocus value={rewardTitle} onChange={e=>setRewardTitle(e.target.value)} placeholder="Something to look forward to" required/></label><div className="form-two"><label>Coin cost<input type="number" min="1" value={rewardCost} onChange={e=>setRewardCost(e.target.value)} required/></label><label>Emoji<input value={rewardEmoji} onChange={e=>setRewardEmoji(e.target.value)} maxLength={4}/></label></div><div className="earn-preview"><Coins size={16}/><span>Your reward costs virtual coins only. No real-money purchases.</span></div><button className="primary-btn submit-btn" type="submit"><Plus size={17}/> Add reward</button></form></Modal>}
    {showSettings&&<Modal title="Your LifeQuest profile" close={()=>setShowSettings(false)}><div className="form-stack"><label>Your display name<input value={profileName} onChange={e=>setProfileName(e.target.value)} maxLength={28}/></label><div><span className="input-label">Choose your avatar</span><div className="avatar-picker">{['🌿','🌻','🐝','🦊','🐈','🌙','🍄','🪴'].map(a=><button key={a} className={avatar===a?'avatar-choice selected':''} onClick={()=>setAvatar(a)} type="button">{a}</button>)}</div></div><button className="primary-btn submit-btn" onClick={()=>{setData(old=>({...old,name:profileName.trim()||'Player',avatar}));setShowSettings(false)}}><Check size={17}/> Save profile</button><div className="cloud-box"><div className="cloud-title"><ShieldCheck size={18}/> Cloud sync</div><p>{cloudReady?'Supabase is configured. Sign in or create an account to sync your progress across devices.':'Cloud sync needs a free Supabase project. Your progress is currently saved in this browser.'}</p>{cloudReady&&userEmail?<><p className="signed-in"><CheckCircle2 size={15}/> Signed in as {userEmail}</p><button className="secondary-btn" onClick={signOut}><LogOut size={16}/> Sign out</button></>:<form onSubmit={signIn} className="form-stack compact-form"><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} placeholder="At least 6 characters" required/></label><div className="form-two"><button className="primary-btn" type="submit" disabled={busy}><LogIn size={15}/> Sign in</button><button className="secondary-btn" type="button" disabled={busy} onClick={signUp}>Create account</button></div>{authMessage&&<p className="auth-message">{authMessage}</p>}</form>}</div><button className="secondary-btn" onClick={resetDaily}>Reset completed recurring quests for today</button><button className="danger-btn" onClick={()=>{if(confirm('Reset all LifeQuest progress on this device? This cannot be undone.')){const fresh=freshSave();setData(fresh);setShowSettings(false);}}}><Trash2 size={15}/> Reset all local progress</button></div></Modal>}
  </div>
}
function GiftIcon(props: {size?:number}){return <span className="gift-icon" style={{display:'inline-flex'}}><Star size={props.size??18}/></span>}
function Stat({icon,label,value,foot,color}:{icon:React.ReactNode,label:string,value:string,foot:string,color:string}){return <div className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-foot">{foot}</span></div>}
function QuestRow({quest,onComplete,onDelete}:{quest:Quest,onComplete:()=>void,onDelete?:()=>void}){const c=categories.find(c=>c.name===quest.category)!;const Icon=c.icon;return <div className={'quest-row '+(quest.completed?'is-complete':'')}><button className="quest-check" disabled={quest.completed} onClick={onComplete} aria-label="Complete quest">{quest.completed?<Check size={17}/>:<span/>}</button><div className="quest-category-icon" style={{background:c.color}}><Icon size={16}/></div><div className="quest-main"><strong>{quest.title}</strong><div className="quest-meta"><span>{quest.category}</span><span className="meta-dot">·</span><span>{quest.repeat==='Once'?'One-time':quest.repeat}</span>{quest.due!==today()&&<><span className="meta-dot">·</span><span>{quest.due}</span></>}</div></div><div className="quest-reward"><span><Zap size={13}/>{xpFor(quest.difficulty)} XP</span><span><Coins size={13}/>{coinsFor(quest.difficulty)}</span></div>{onDelete&&<button className="delete-quest" onClick={onDelete} title="Delete quest"><Trash2 size={15}/></button>}</div>}
function Empty({text}:{text:string}){return <div className="empty-state"><div>🌱</div><p>{text}</p></div>}
function Achievement({emoji,title,desc,unlocked}:{emoji:string,title:string,desc:string,unlocked:boolean}){return <div className={'achievement-card '+(unlocked?'unlocked':'')}><div>{emoji}</div><strong>{title}</strong><span>{desc}</span><small>{unlocked?'Unlocked':'Not yet unlocked'}</small></div>}
function Modal({title,close,children}:{title:string,close:()=>void,children:React.ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={close}><X size={19}/></button></div>{children}</div></div>}
