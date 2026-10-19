// Socket identities only. Never trust client-supplied forwarding headers.
// A reverse proxy may share an identity: configure trusted edge quotas for scale.
function createLimiter({limit=120,windowMs=60000,maxIdentities=4096}={}){
  const clients=new Map();
  return (identity,now=Date.now())=>{
    for(const [key,value] of clients)if(now-value.started>=windowMs)clients.delete(key);
    let value=clients.get(identity);
    if(!value){
      if(clients.size>=maxIdentities)return false;
      value={started:now,count:0};clients.set(identity,value);
    }
    return ++value.count<=limit;
  };
}
module.exports={createLimiter};
