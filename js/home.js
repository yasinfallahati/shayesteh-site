(function(){
  var g=window.gsap,ST=window.ScrollTrigger;
  if(!g||!ST||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  g.registerPlugin(ST);g.ticker.lagSmoothing(0);
  document.documentElement.classList.add('anim');
  // scroll progress bar
  var bar=document.createElement('div');bar.className='prog';document.body.appendChild(bar);
  g.to(bar,{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});
  // hero: split h1 lines (around <br>) into masked lines
  var h1=document.querySelector('.hero h1');
  if(h1){h1.innerHTML=h1.innerHTML.split(/<br\s*\/?>/i).map(function(l){return '<span class="ln"><span>'+l+'</span></span>'}).join('');}
  var tl=g.timeline({defaults:{ease:'power3.out'}});
  tl.from('.hero .eyebrow',{y:16,opacity:0,duration:.7})
    .from('.hero h1 .ln>span',{yPercent:110,duration:1.1,stagger:.14},'-=.35')
    .from('.hero .lead',{y:20,opacity:0,duration:.9},'-=.6')
    .from('.hero .cta',{y:18,opacity:0,duration:.8,clearProps:'transform,opacity'},'-=.55')
    .from('.orb',{scale:.85,opacity:0,duration:1.6,ease:'power2.out'},0)
    .from('header',{y:-20,opacity:0,duration:.8},0);
  // gentle parallax on orb
  g.to('.orb',{yPercent:18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}});
  // section heads + cards reveal
  g.utils.toArray('.head').forEach(function(h){
    g.from(h.children,{y:28,opacity:0,duration:.9,stagger:.1,ease:'power3.out',clearProps:'transform,opacity',scrollTrigger:{trigger:h,start:'top 85%',once:true}});
  });
  ST.batch('.card',{start:'top 88%',once:true,onEnter:function(b){g.from(b,{y:40,opacity:0,scale:.98,duration:1,stagger:.1,ease:'power3.out',clearProps:'transform,opacity'});}});
  // pointer glow on cards (fine pointers only)
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('.card').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');});});
  }
})();
