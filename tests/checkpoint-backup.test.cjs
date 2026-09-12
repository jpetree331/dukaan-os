const {test}=require('node:test'),assert=require('node:assert/strict');
const {create,item}=require('./harness.cjs');
test('BUILD-04: encrypted checkpoint strips PINs and restores records with provenance',async()=>{
  const {A}=await create();item(A);await A.save();
  A.DB().settings.pin='4321';A.DB().staff[0].pin='9876';
  const payload={storageVersion:3,book:A.DB(),provenance:{kind:'snapshot-checkpoint',sourceHash:'a'.repeat(64),capturedAt:1}};
  const envelope=await A.backups.encrypt(payload,'Synthetic-backup-pass');
  const decoded=await A.backups.decrypt(envelope,'Synthetic-backup-pass');
  assert.equal(decoded.storageVersion,3);assert.equal(decoded.book.settings.pin,'');assert.equal(decoded.book.staff[0].pin,'');
  const fresh=await create();await fresh.A.restoreBackup(decoded);
  assert.equal(fresh.A.DB().items.length,1);assert.equal(fresh.A.DB().settings.restoredCheckpoint.kind,'snapshot-checkpoint');
  assert.equal(fresh.A.DB().settings.pin,'');
  assert.throws(()=>A.backups.validatePayload({...payload,provenance:{...payload.provenance,sourceHash:'bad'}}),/provenance/);
  assert.throws(()=>A.backups.validatePayload({...payload,extra:'unexpected'}),/Unknown/);
});
