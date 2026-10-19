// Reproducible public positions, constructed only through encounter setup and legal play.
export function searchFixtures(engine){
 const {createState,applyChoice,actorToMove,legalActions}=engine,fixtures=[];
 const pair=(s,ids)=>{for(let i=0;i<2;i++)applyChoice(s,ids[actorToMove(s)]);};
 for(const level of [20,50,80])for(const scenario of ['opening','depleted','lethal','foresight','haste','channel','omen','construct'])for(const phase of ['commit','respond']){
  const special=['foresight','haste','channel','omen','construct'].includes(scenario);
  const config={playerLevel:level,opponentLevel:level,playerLoadout:'Duellist',opponentLoadout:'Scholar',spellAccess:special?'all':'kit',firstLeader:0,encounterSeed:20261016};
  if(scenario==='depleted'){config.playerResources={mana:0};config.opponentResources={mana:0};}
  if(scenario==='lethal'){config.healthModel='direct';config.playerResources={health:3};config.opponentResources={health:3};}
  const state=createState(config),commands=[];
  const exchange=ids=>{commands.push(...[ids[actorToMove(state)],ids[1-actorToMove(state)]]);pair(state,ids);};
  if(scenario==='foresight')exchange(['foresight','guard']);
  if(scenario==='haste')exchange(['haste','guard']);
  if(scenario==='channel')exchange([{20:'starlight',50:'wildfire',80:'moonwell'}[level],'guard']);
  if(scenario==='omen'){exchange(['omen','guard']);exchange(['guard','guard']);}
  if(scenario==='construct'){exchange(['contraption','guard']);exchange(['guard','guard']);}
  if(phase==='respond'){const actions=legalActions(state),id=actions.includes('guard')?'guard':actions.includes('hold')?'hold':actions[0];commands.push(id);applyChoice(state,id);}
  fixtures.push({id:`${level}-${scenario}-${phase}`,level,scenario,phase,config,commands,state});
 }
 return fixtures;
}
