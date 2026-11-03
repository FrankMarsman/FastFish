'use strict';
function maskBits(data,w,h){const stride=Math.ceil(w/32),bits=new Uint32Array(stride*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[y*w+x])bits[y*stride+(x>>>5)]|=1<<(x&31);return{w,h,stride,bits};}
function dilation(data,w,h,r){if(!r)return data;const a=new Uint8Array(w*h),b=new Uint8Array(w*h);for(let y=0;y<h;y++){let n=0;for(let x=-r;x<w;x++){if(x+r<w)n+=data[y*w+x+r];if(x-r-1>=0)n-=data[y*w+x-r-1];if(x>=0)a[y*w+x]=n>0;}}for(let x=0;x<w;x++){let n=0;for(let y=-r;y<h;y++){if(y+r<h)n+=a[(y+r)*w+x];if(y-r-1>=0)n-=a[(y-r-1)*w+x];if(y>=0)b[y*w+x]=n>0;}}return b;}
function makeBoard(w,h){return{w,h,stride:Math.ceil(w/32),bits:new Uint32Array(Math.ceil(w/32)*h),cw:Math.ceil(w/8),coarse:new Uint8Array(Math.ceil(w/8)*Math.ceil(h/8))};}
function coarseContact(board,m,x,y){let count=0;for(let yy=y>>>3;yy<=((y+m.h-1)>>>3);yy++)for(let xx=x>>>3;xx<=((x+m.w-1)>>>3);xx++)count+=board.coarse[yy*board.cw+xx]||0;return count;}
function maskCollision(board,m,x,y){if(x<0||y<0||x+m.w>board.w||y+m.h>board.h)return true;if(!coarseContact(board,m,x,y))return false;const shift=x&31,xword=x>>>5;for(let row=0;row<m.h;row++){const dest=(y+row)*board.stride+xword,src=row*m.stride;for(let j=0;j<m.stride;j++){const b=m.bits[src+j];if(!b)continue;if(board.bits[dest+j]&(b<<shift))return true;if(shift&&(board.bits[dest+j+1]&(b>>>(32-shift))))return true;}}return false;}
function addMask(board,m,x,y){const shift=x&31,xword=x>>>5;for(let row=0;row<m.h;row++){const dest=(y+row)*board.stride+xword,src=row*m.stride;for(let j=0;j<m.stride;j++){const b=m.bits[src+j];board.bits[dest+j]|=b<<shift;if(shift&&b>>>(32-shift))board.bits[dest+j+1]|=b>>>(32-shift);}}for(let yy=y>>>3;yy<=((y+m.h-1)>>>3);yy++)for(let xx=x>>>3;xx<=((x+m.w-1)>>>3);xx++)board.coarse[yy*board.cw+xx]=1;}
function randomSequence(seed){let state=seed>>>0;return()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296;};}
// Retain exact coordinates in compact buffers rather than millions of point arrays.
function packLines(lines){
 let count=0;for(const line of lines)count+=line.length;
 const coordinates=new Float64Array(count*2),offsets=new Uint32Array(lines.length+1);let point=0;
 for(let i=0;i<lines.length;i++){offsets[i]=point;for(const p of lines[i]){coordinates[point*2]=p[0];coordinates[point*2+1]=p[1];point++;}}offsets[lines.length]=point;
 return{coordinates,offsets};
}
if(typeof module!=='undefined')module.exports={packLines,maskBits,dilation,makeBoard,maskCollision,addMask,randomSequence};
