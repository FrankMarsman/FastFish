#!/usr/bin/env python3
"""Serve the real-worker gallery renderer and save its PNG output locally."""
import argparse,json,os,re
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8768);parser.add_argument('--output',default='media/gallery');args=parser.parse_args()
root=Path(__file__).resolve().parents[1];output=Path(args.output).resolve();output.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
 def do_POST(self):
  name=self.path.removeprefix('/save/')
  if not self.path.startswith('/save/') or not (re.fullmatch(r'composition-\d+-\d+\.png',name) or name=='manifest.json'):self.send_error(400);return
  size=int(self.headers.get('Content-Length','0'))
  if not 0<size<30_000_000:self.send_error(400);return
  data=self.rfile.read(size)
  if name.endswith('.png') and not data.startswith(b'\x89PNG\r\n\x1a\n'):self.send_error(400);return
  if name=='manifest.json':json.loads(data)
  tmp=output/(name+'.tmp');tmp.write_bytes(data);os.replace(tmp,output/name)
  self.send_response(200);self.end_headers();self.wfile.write(b'OK')
print(f'Open http://127.0.0.1:{args.port}/tools/gallery.html; output: {output}',flush=True)
ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
