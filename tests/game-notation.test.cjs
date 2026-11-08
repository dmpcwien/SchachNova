"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const notation=require("../app/src/main/assets/game-notation.js");
const root="app/src/main/assets/";
for(const f of ["game-notation.js","game-archive.js","chess.js","practice-progress.js","training.js"]){
 new vm.Script(fs.readFileSync(root+f,"utf8"),{filename:f});
}
const html=fs.readFileSync(root+"index.html","utf8");
assert.ok(html.indexOf('src="chess.js"')<html.indexOf('src="game-notation.js"'));
assert.ok(html.indexOf('src="game-notation.js"')<html.indexOf('src="game-archive.js"'));
const sq=(s)=>(8-Number(s[1]))*16+"abcdefgh".indexOf(s[0]);
function board(...pieces){const b=Array(128).fill(".");for(const [square,piece] of pieces)b[sq(square)]=piece;return b;}
const base={b:board(["e2","P"],["e7","p"],["e1","K"],["e8","k"]),t:1,full:1};
const afterE4={b:board(["e4","P"],["e7","p"],["e1","K"],["e8","k"]),t:-1,full:1};
const afterE5={b:board(["e4","P"],["e5","p"],["e1","K"],["e8","k"]),t:1,full:2};
const rules={legal:()=>[],checked:()=>false};
assert.equal(notation.san(base,afterE4,[sq("e2"),sq("e4"),"",""],rules),"e4");
const game={variant:"standard",moves:[[sq("e2"),sq("e4"),"",""],[sq("e7"),sq("e5"),"",""]],positions:[base,afterE4,afterE5],timestamp:new Date(2026,10,3,12).getTime(),message:"Remis"};
const result=notation.generate(game,rules);
assert.equal(result.filename,"SchachNova-2026-11-03.pgn");
assert.match(result.text,/\[Result "1\/2-1\/2"\]/);
assert.match(result.text,/1\. e4 e5 1\/2-1\/2/);
assert.equal(notation.san({b:board(["e1","K"],["h1","R"]),t:1},afterE4,[sq("e1"),sq("g1"),"","castle"],rules),"O-O");
assert.equal(notation.san({b:board(["e5","P"],["d6","p"]),t:1},{b:board(["d6","P"]),t:-1},[sq("e5"),sq("d6"),"",""],rules),"exd6");
assert.equal(notation.san({b:board(["e7","P"]),t:1},{b:board(["e8","Q"]),t:-1},[sq("e7"),sq("e8"),"q",""],rules),"e8=Q");
const knights=board(["g1","N"],["d2","N"]);const knightRules={legal:()=>[[sq("d2"),sq("f3")],[sq("g1"),sq("f3")]],checked:()=>false};
assert.equal(notation.san({b:knights,t:1},{b:board(["f3","N"]),t:-1},[sq("g1"),sq("f3"),"",""],knightRules),"Ngf3");
const mateRules={legal:()=>[],checked:()=>true};
assert.equal(notation.san(base,afterE4,[sq("e2"),sq("e4"),"",""],mateRules),"e4#");
const timedPgn=notation.generate({...game,message:"Zeitüberschreitung (Schwarz gewinnt)",
 event:'SchachNova Simultanschach',round:"7",white:"Spieler",black:"Computer",
 timeControl:"300+2"},rules);
assert.match(timedPgn.text,/\[Event "SchachNova Simultanschach"\]/);
assert.match(timedPgn.text,/\[Round "7"\]/);
assert.match(timedPgn.text,/\[White "Spieler"\]/);
assert.match(timedPgn.text,/\[Black "Computer"\]/);
assert.match(timedPgn.text,/\[TimeControl "300\+2"\]/);
assert.match(timedPgn.text,/\[Termination "Time forfeit"\]/);
assert.match(timedPgn.text,/\[Result "0-1"\]/);
assert.match(timedPgn.text,/1\. e4 e5 0-1/);
const malicious=notation.generate({...game,event:'Attack"\n[Result "1-0"]',timeControl:"bad"},rules);
assert.doesNotMatch(malicious.text,/\n\[Result "1-0"\]/);
assert.doesNotMatch(malicious.text,/\[TimeControl/);
assert.equal(notation.resultOf({message:"Weiß gewinnt"},rules),"1-0");
assert.equal(notation.resultOf({message:"Schwarz gewinnt"},rules),"0-1");
const variant=notation.generate({...game,variant:"atomic"},rules);
assert.equal(variant.standard,false);assert.ok(variant.filename.endsWith(".txt"));assert.match(variant.text,/e2e4/);
assert.throws(()=>notation.generate({...game,positions:[base]},rules),/unvollständig/);
const archive=fs.readFileSync(root+"game-archive.js","utf8");
assert.match(archive,/function find\(games,query\)/);
assert.match(archive,/find\(all,\$\("archiveSearch"\)/);
assert.match(archive,/SchachNovaNotation\.download/);
console.log("PASS SAN notation, castling, capture, promotion, ambiguity, checkmate, results, searchable archive");
