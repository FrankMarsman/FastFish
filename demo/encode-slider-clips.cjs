// Encode actual browser screenshots; no synthetic interface or fish frames.
// Usage: node demo/encode-slider-clips.cjs /path/to/capture-folder
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
if(!process.argv[2])throw Error('Pass the folder containing body-length/, body-height/, tail-length/ and capture.json');
const source=path.resolve(process.argv[2]),media=path.join(__dirname,'media');
for(const name of ['body-length','body-height','tail-length']){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'frank-fish-slider-'));
 const sequence=[...Array(8).fill(0),...Array.from({length:20},(_,i)=>i),...Array(8).fill(19),...Array.from({length:18},(_,i)=>18-i)];
 try{
  sequence.forEach((frame,i)=>fs.copyFileSync(path.join(source,name,String(frame).padStart(3,'0')+'.jpg'),path.join(tmp,String(i).padStart(3,'0')+'.jpg')));
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','12','-i',path.join(tmp,'%03d.jpg'),'-filter_complex','[0:v]scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle','-loop','0',path.join(media,name+'-slider.gif')]);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
 console.log('Encoded '+name+' ('+sequence.length+' playback frames).');
}
const manifest=JSON.parse(fs.readFileSync(path.join(source,'capture.json'),'utf8'));
manifest.playback={fps:12,endpointPauseFrames:8,reverse:true};
fs.writeFileSync(path.join(media,'slider-captures.json'),JSON.stringify(manifest,null,2)+'\n');
