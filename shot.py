import sys
import os;BASE=os.environ.get("BASE","http://localhost:8765")
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome")
    for name,url,w,h,full in [("nibero","https://www.nibero.ir",1280,720,False)] if sys.argv[1]=="nib" else [(f"{n}-{d}",BASE+u,w,h,True) for n,u in [("home","/"),("postino","/postino/")] for d,w,h in [("desktop",1366,800),("mobile",390,844)]]:
        pg=b.new_page(viewport={"width":w,"height":h});pg.goto(url,wait_until="networkidle",timeout=60000);pg.evaluate("document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'))");pg.wait_for_timeout(1500)
        pg.screenshot(path=("img/nibero.png" if name=="nibero" else f"shots/{name}.png"),full_page=full);pg.close()
