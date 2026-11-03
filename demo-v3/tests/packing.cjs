const assert=require('node:assert/strict'),{maskBits,dilation,makeBoard,maskCollision,addMask}=require('../dist/packing.js');
let checks=0;for(const width of [31,32,33,70]){const board=makeBoard(width,80),reference=new Uint8Array(width*80);for(let i=0;i<250;i++){const w=1+i%19,h=1+i%9,a=Uint8Array.from({length:w*h},(_,j)=>(j*7+i)%4?1:0),m=maskBits(a,w,h),x=(i*13)%(width+4)-2,y=(i*17)%84-2;
let expected=x<0||y<0||x+w>width||y+h>80;if(!expected)for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(a[yy*w+xx]&&reference[(yy+y)*width+x+xx])expected=true;assert.equal(maskCollision(board,m,x,y),expected);
if(!expected){addMask(board,m,x,y);for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(a[yy*w+xx])reference[(yy+y)*width+x+xx]=1;}checks++;}}
const a=new Uint8Array(49);a[24]=1;const b=dilation(a,7,7,2);assert.equal(b.reduce((n,v)=>n+v,0),25);console.log('PASS '+checks+' collision checks against independent per-pixel occupancy, boundaries and gap dilation');
