const $ = id => document.getElementById(id);
let ws, state = { host:false, playerId:null, room:null, totalQuestions:50, answered:false, startedAt:0, duration:20000 };

function connect() {
  ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host);
  ws.onmessage = e => handle(JSON.parse(e.data));
  ws.onclose = () => showError("Connection lost. Refresh to reconnect.");
}
function send(x){ if(ws?.readyState===1) ws.send(JSON.stringify(x)); }
function show(id){ document.querySelectorAll(".screen").forEach(s=>s.classList.add("hidden")); $(id).classList.remove("hidden"); }
function showError(t){ $("homeError").textContent=t; }

function renderPlayers(players, hostId) {
  $("players").innerHTML = players.map(p => `<div class="player"><span>${escapeHtml(p.name)}</span><span>${p.id===hostId?'<span class="host">HOST</span>':''}</span></div>`).join("");
  $("lobbyHint").textContent = `${players.length}/6 players joined`;
  $("startBtn").disabled = !state.host || players.length < 2;
}

function handle(m) {
  if(m.type==="error"){ showError(m.message); return; }
  if(m.type==="joined"){
    state.playerId=m.playerId; state.room=m.code; state.host=m.host;
    $("roomBadge").textContent=m.code; $("roomBadge").classList.remove("hidden");
    $("code").textContent=m.code; show("lobby"); return;
  }
  if(m.type==="lobby"){ renderPlayers(m.players,m.hostId); return; }
  if(m.type==="gameStarting"){ show("game"); $("answer").disabled=true; $("submitBtn").disabled=true; $("answerState").textContent="Get ready…"; return; }
  if(m.type==="question"){
    state.answered=false; state.startedAt=performance.now(); state.duration=m.timeLimitMs;
    $("roundLabel").textContent=`ROUND ${m.round}/5`;
    $("questionLabel").textContent=`QUESTION ${m.questionNumber}/50`;
    $("question").textContent=m.question;
    $("answer").value=""; $("answer").disabled=false; $("submitBtn").disabled=false;
    $("answerState").textContent=""; $("answer").focus();
    startTimer(); renderMini(m.players||[]);
    return;
  }
  if(m.type==="answerReceived"){
    state.answered=true; $("answer").disabled=true; $("submitBtn").disabled=true;
    $("answerState").textContent=m.correct ? `✓ Correct — +${m.points} points` : "✕ Incorrect — 0 points";
    return;
  }
  if(m.type==="reveal"){
    state.answered=true; $("answer").disabled=true; $("submitBtn").disabled=true;
    $("answerState").textContent=`Answer: ${m.correctAnswer}`;
    renderMini(m.players); return;
  }
  if(m.type==="roundResults"){
    renderLeaderboard(m.players,m.round);
    $("resultsEyebrow").textContent=`ROUND ${m.round} COMPLETE`;
    $("resultsTitle").textContent=`After round ${m.round}`;
    $("continueBtn").classList.remove("hidden");
    show("results"); return;
  }
  if(m.type==="gameOver"){
    renderLeaderboard(m.players,5,true);
    $("resultsEyebrow").textContent="GAME COMPLETE";
    $("resultsTitle").textContent="Final leaderboard";
    $("continueBtn").classList.add("hidden");
    show("results");
  }
}
function startTimer(){
  const end=state.startedAt+state.duration;
  cancelAnimationFrame(window._timer);
  const tick=()=>{
    const left=Math.max(0,end-performance.now());
    $("timer").textContent=(left/1000).toFixed(1);
    $("timerBar").style.transform=`scaleX(${left/state.duration})`;
    if(left>0) window._timer=requestAnimationFrame(tick);
    else { $("answer").disabled=true; $("submitBtn").disabled=true; if(!state.answered) $("answerState").textContent="Time's up!"; }
  }; tick();
}
function renderMini(players){
  $("miniScores").innerHTML=players.sort((a,b)=>b.score-a.score).map(p=>`<div class="mini">${escapeHtml(p.name)} <strong>${p.score}</strong></div>`).join("");
}
function renderLeaderboard(players,round,final=false){
  const sorted=[...players].sort((a,b)=>b.score-a.score);
  $("leaderboard").innerHTML=sorted.map((p,i)=>{
    const avg=(p.score/((final?50:round*10)||1)).toFixed(1);
    const avgTime=p.correct?(p.totalTime/p.correct/1000).toFixed(2):"—";
    return `<div class="score-row ${i===0?'winner':''}">
      <div><strong>${i+1}. ${escapeHtml(p.name)}</strong><div class="stat">${p.correct} correct · ${avgTime}s avg response</div></div>
      <div class="stat">${avg} avg</div><div class="pts">${p.score}</div>
    </div>`;
  }).join("");
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

$("createBtn").onclick=()=>{ const name=$("createName").value.trim(); if(!name)return showError("Enter your name."); connect(); setTimeout(()=>send({type:"create",name}),100); };
$("joinBtn").onclick=()=>{ const name=$("joinName").value.trim(), code=$("joinCode").value.trim().toUpperCase(); if(!name||code.length!==4)return showError("Enter your name and a 4-character room code."); connect(); setTimeout(()=>send({type:"join",name,code}),100); };
$("startBtn").onclick=()=>send({type:"start"});
$("submitBtn").onclick=()=>submit();
$("answer").addEventListener("keydown",e=>{if(e.key==="Enter")submit()});
$("continueBtn").onclick=()=>show("game");
function submit(){ if(state.answered)return; const answer=$("answer").value.trim(); if(!answer)return; state.answered=true; $("answer").disabled=true; $("submitBtn").disabled=true; send({type:"answer",answer}); }
