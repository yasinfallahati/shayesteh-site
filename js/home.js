// Homepage motion: GSAP timelines, ScrollTrigger scrub/reveals/parallax,
// pointer micro-interactions, and the lazy-loaded Three.js hero.
// Degrades to the static page: no GSAP -> nothing stays hidden; reduced motion -> no motion, no WebGL.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const mobile = matchMedia('(max-width: 760px)').matches;
const { gsap, ScrollTrigger } = window; // classic UMD scripts loaded (defer) before this module
const motion = !reduce && gsap && ScrollTrigger;

if (!reduce) {
  import('/js/hero3d.js')
    .then((m) => m.initHero(document.getElementById('scene'), { mobile }))
    .catch(() => {}); // CDN or WebGL failure: the static hero remains
}

if (motion) {
  gsap.registerPlugin(ScrollTrigger);

  // Hero intro
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .fromTo('.hero .eyebrow', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 })
    .fromTo('.hero h1', { opacity: 0, y: 30, clipPath: 'inset(0 0 100% 0)' }, { opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', duration: 1.6 }, '-=0.6')
    .fromTo('.hero .lead', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2 }, '-=1.1')
    .fromTo('.hero .cta', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2 }, '-=1');

  // Hero scroll: content recedes, orb drifts, 3D scene gets the progress value (lerped inside hero3d)
  const heroRange = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  ScrollTrigger.create({
    trigger: '.hero',
    start: 'top top',
    end: 'bottom top',
    onUpdate: (self) => document.dispatchEvent(new CustomEvent('hero:progress', { detail: self.progress })),
  });
  gsap.to('.hero > .w', { yPercent: -18, opacity: 0.25, ease: 'none', scrollTrigger: heroRange });
  gsap.to('.hero .orb', { yPercent: 25, ease: 'none', scrollTrigger: heroRange });
  gsap.to('.hero canvas', { yPercent: -12, scale: 1.08, ease: 'none', scrollTrigger: heroRange });

  // Page progress bar
  gsap.to('.prog', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // Reveals: staggered, once per element
  gsap.set('.home .rv', { opacity: 0, y: 40 });
  ScrollTrigger.batch('.home .rv', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, overwrite: true }),
  });

  // Parallax on section headers and the CEO portrait
  gsap.utils.toArray('.home .head').forEach((el) => {
    gsap.fromTo(el, { y: 0 }, { y: -40, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.to('.home .lead-m img', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.lead-m', start: 'top bottom', end: 'bottom top', scrub: true } });

  if (fine && !mobile) {
    // Cards: 3D tilt plus a light that follows the pointer
    document.querySelectorAll('.home .card').forEach((card) => {
      gsap.set(card, { transformPerspective: 900 });
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      const lift = gsap.quickTo(card, 'y', { duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        rx((0.5 - y) * 7);
        ry((x - 0.5) * 9);
        card.style.setProperty('--mx', `${x * 100}%`);
        card.style.setProperty('--my', `${y * 100}%`);
      });
      card.addEventListener('pointerenter', () => lift(-6));
      card.addEventListener('pointerleave', () => { rx(0); ry(0); lift(0); });
    });

    // Buttons: magnetic pull toward the pointer
    document.querySelectorAll('.home .btn').forEach((btn) => {
      const mx = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
      const my = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.25);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  }
} else {
  root.classList.remove('js');
}
