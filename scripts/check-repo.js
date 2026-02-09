(async ()=>{
  try {
    const { default: AsistenciasRepoMock } = await import('../src/infrastructure/mock/AsistenciasRepoMock.js');
    const repo = new AsistenciasRepoMock();
    const list = await repo.list('1');
    console.log('repo list for 1 length=', list.length);
    console.log(list.slice(0,5));
  } catch(e) { console.error(e); }
})();
