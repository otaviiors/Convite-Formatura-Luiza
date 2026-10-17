import { useState, useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   URL do Google Apps Script (grava as confirmações na planilha)
   Cole aqui a URL do app da web depois de implantar o script.
   Enquanto estiver vazia, o convite funciona, mas não envia
   as confirmações para a planilha.
   ═══════════════════════════════════════════════════════════════ */
const SCRIPT_URL = "";

const STORAGE_KEY = "rsvp-list-luiza";

const IMG_HERO = "/luiza-hero.jpg";

const EVENT = {
  calendarUrl:
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    "&text=Formatura+Luiza+Shansis+Tarta" +
    "&dates=20261211T230000Z/20261212T070000Z" +
    "&details=Festa+de+formatura+em+Medicina+-+UCPel.+Luiza+Shansis+Tarta." +
    "&location=Clube+de+Ca%C3%A7a+e+Pesca+de+Pelotas+-+Sal%C3%A3o+Tiro+ao+Prato%2C+Av.+Adolfo+Fetter%2C+400+-+Laranjal%2C+Pelotas+-+RS",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Clube+de+Ca%C3%A7a+e+Pesca+de+Pelotas+Av.+Adolfo+Fetter+400+Laranjal+Pelotas+RS",
};

/* ─── Scroll-reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─── Parallax hook ─── */
function useParallax(speed = 0.3) {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handler = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const vCenter = window.innerHeight / 2;
      setOffset((center - vCenter) * speed);
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [speed]);
  return [ref, offset];
}

/* ─── Ornamento dourado (substitui o monograma) ─── */
function Ornament({ className = "", onClick }) {
  return (
    <svg className={className} onClick={onClick} viewBox="0 0 160 24" aria-hidden="true">
      <line x1="0" y1="12" x2="62" y2="12" stroke="currentColor" strokeWidth="0.8" />
      <line x1="98" y1="12" x2="160" y2="12" stroke="currentColor" strokeWidth="0.8" />
      <path d="M80 2 L88 12 L80 22 L72 12 Z" fill="none" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="80" cy="12" r="2" fill="currentColor" />
      <circle cx="66" cy="12" r="1.2" fill="currentColor" />
      <circle cx="94" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function App() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [rsvpList, setRsvpList] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const formRef = useRef(null);

  const [introRef, introVis] = useReveal(0.2);
  const [detailsRef, detailsVis] = useReveal(0.15);
  const [formRevRef, formVis] = useReveal(0.1);
  const [heroParRef, heroParOff] = useParallax(0.25);

  useEffect(() => {
    try {
      const r = localStorage.getItem(STORAGE_KEY);
      if (r) {
        const list = JSON.parse(r);
        setRsvpList(list);
        if (list.length > 0) setAlreadyDone(true);
      }
    } catch (e) {}
    const t = setTimeout(() => setHeroLoaded(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || sending) return;

    /* ── Prevenir duplicata ── */
    const normalizedName = name.trim().toLowerCase();
    if (rsvpList.some(r => r.name.toLowerCase() === normalizedName)) {
      alert("Este nome já foi confirmado! Se precisar alterar algo, fale com a Luiza.");
      return;
    }

    const entry = {
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      confirmedAt: new Date().toLocaleString("pt-BR"),
    };
    const updated = [...rsvpList, entry];

    setSending(true);
    /* Envia para Google Sheets */
    if (SCRIPT_URL) {
      try {
        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ name: entry.name, phone: entry.phone }),
        });
      } catch (e) { /* silencioso — com no-cors a resposta não é legível */ }
    }

    /* Salva localmente também (evita confirmação repetida no mesmo aparelho) */
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
    setRsvpList(updated);
    setSending(false);
    setSubmitted(true);
  };

  const handleDelete = (id) => {
    const updated = rsvpList.filter((r) => r.id !== id);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch (e) {}
    setRsvpList(updated);
    if (updated.length === 0) { setAlreadyDone(false); setSubmitted(false); }
  };

  const handleOrnamentClick = () => {
    const n = adminClicks + 1;
    setAdminClicks(n);
    if (n >= 5) { setShowAdmin(!showAdmin); setAdminClicks(0); }
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  const revealStyle = (vis, delay = 0) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? "translateY(0) scale(1)" : "translateY(60px) scale(0.98)",
    transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s`,
  });

  const done = submitted || alreadyDone;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Montserrat:wght@300;400;500&display=swap');
        :root{
          --deep:#2F4A3B; --forest:#3D5A49; --sage:#6F8C79; --sage-l:#A9BDAE;
          --mist:#E6ECE4; --paper:#F7F8F5; --gold:#B08C52; --gold-l:#D3B98A;
          --ink:#26302A; --muted:#66716A; --line:#DDE3DA;
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        body{background:var(--paper);overflow-x:hidden;}
        .invite-wrap{font-variant-numeric:lining-nums;font-family:'Montserrat',sans-serif;color:var(--ink);position:relative;overflow-x:hidden;}

        /* ── HERO ── */
        .hero{min-height:100vh;min-height:100svh;display:flex;align-items:flex-end;justify-content:center;position:relative;overflow:hidden;
          background:radial-gradient(120% 80% at 50% 20%,#5E7D69 0%,#3D5A49 45%,#22372B 100%);}
        .hero-bg{position:absolute;inset:-6% 0;background-size:cover;background-position:center 22%;opacity:0;transition:opacity 1.8s ease;filter:brightness(0.6) contrast(1.05) saturate(0.95);}
        .hero-bg.loaded{opacity:1;}
        .hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(34,55,43,0.35) 0%,rgba(34,55,43,0.1) 40%,rgba(28,46,36,0.75) 100%);}
        .hero-grain{position:absolute;inset:0;opacity:0.05;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .hero-content{position:relative;z-index:2;text-align:center;padding:2rem 1.5rem 7rem;}
        .hero-pretitle{font-weight:400;font-size:0.65rem;letter-spacing:7px;text-transform:uppercase;color:var(--gold-l);margin-bottom:1.6rem;opacity:0;transform:translateY(20px);transition:all 1s ease 0.5s;}
        .hero-ornament{display:block;width:150px;height:22px;margin:0 auto 1.4rem;color:var(--gold-l);opacity:0;transform:scaleX(0.4);transition:all 1s cubic-bezier(0.22,1,0.36,1) 0.7s;cursor:default;-webkit-tap-highlight-color:transparent;}
        .hero-name{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:clamp(3rem,12vw,5.6rem);color:#F7F8F5;line-height:1.02;opacity:0;transform:translateY(30px);transition:all 1.2s cubic-bezier(0.22,1,0.36,1) 0.85s;text-shadow:0 2px 40px rgba(0,0,0,0.3);}
        .hero-name em{font-style:italic;font-weight:400;display:block;font-size:0.52em;color:#DCE4DA;margin-top:0.35rem;letter-spacing:0.02em;}
        .hero-degree{font-weight:300;font-size:0.75rem;letter-spacing:4px;text-transform:uppercase;color:rgba(247,248,245,0.7);margin-top:1.1rem;opacity:0;transition:all 1s ease 1.1s;}
        .hero-date{font-family:'Cormorant Garamond',serif;font-size:1.25rem;letter-spacing:0.35em;color:var(--gold-l);margin-top:1.6rem;opacity:0;transition:all 1s ease 1.25s;}
        .hero-cta{display:inline-block;margin-top:2.2rem;font-family:'Montserrat',sans-serif;font-weight:500;font-size:0.65rem;letter-spacing:5px;text-transform:uppercase;color:#F7F8F5;background:transparent;border:1px solid rgba(211,185,138,0.6);padding:1rem 2.6rem;cursor:pointer;transition:all 0.5s ease;opacity:0;transform:translateY(20px);}
        .show{opacity:1 !important;transform:none !important;}
        .hero-cta.show{transition:all 0.5s ease, opacity 1s ease 1.5s, transform 1s ease 1.5s;}
        .hero-cta:hover{background:rgba(211,185,138,0.14);border-color:var(--gold-l);}
        .hero-cta:focus-visible,.action-btn:focus-visible,.submit-btn:focus-visible{outline:2px solid var(--gold);outline-offset:3px;}
        .hero-scroll{position:absolute;bottom:2rem;left:0;right:0;margin:0 auto;width:fit-content;z-index:2;display:flex;flex-direction:column;align-items:center;gap:0.5rem;opacity:0;animation:fadeInUp 1s ease 2.2s forwards;}
        .hero-scroll span{font-size:0.55rem;letter-spacing:4px;text-transform:uppercase;color:rgba(247,248,245,0.45);}
        .scroll-line{width:1px;height:30px;background:linear-gradient(180deg,rgba(211,185,138,0.7),transparent);animation:scrollPulse 2s ease infinite;}

        /* ── INTRO ── */
        .intro{padding:7rem 1.75rem 6rem;text-align:center;background:var(--paper);position:relative;overflow:hidden;}
        .intro::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:1px;height:80px;background:linear-gradient(180deg,var(--gold),transparent);}
        .intro-text{font-family:'Cormorant Garamond',serif;font-size:clamp(1.2rem,2.6vw,1.45rem);font-weight:400;color:#4B554F;line-height:1.95;max-width:540px;margin:0 auto;}
        .intro-text strong{color:var(--forest);font-weight:600;}
        .intro-sign{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.6rem;color:var(--forest);margin-top:2rem;}

        /* ── QUOTE ── */
        .quote-section{padding:5.5rem 2rem;background:var(--forest);text-align:center;position:relative;overflow:hidden;}
        .quote-section::before{content:'';position:absolute;inset:0;opacity:0.04;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
        .quote-orn{display:block;width:110px;height:18px;margin:0 auto 1.8rem;color:var(--gold-l);opacity:0.8;}
        .quote-text{font-family:'Cormorant Garamond',serif;font-size:clamp(1.35rem,3.2vw,1.85rem);font-weight:300;font-style:italic;color:#E2E9E0;line-height:1.75;max-width:600px;margin:0 auto;position:relative;z-index:1;}
        .quote-attr{font-size:0.62rem;letter-spacing:3px;text-transform:uppercase;color:var(--gold-l);margin-top:1.5rem;position:relative;z-index:1;}

        /* ── DETAILS ── */
        .details{padding:6rem 1.75rem;background:#FFFFFF;position:relative;}
        .details::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:200px;height:1px;background:linear-gradient(90deg,transparent,var(--gold),transparent);}
        .section-title{text-align:center;margin-bottom:3.2rem;}
        .section-title h2{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:2.1rem;color:var(--ink);}
        .section-title p{font-weight:300;font-size:0.65rem;letter-spacing:4px;text-transform:uppercase;color:var(--gold);margin-top:0.5rem;}
        .details-grid{max-width:780px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem;text-align:center;}
        .detail-card{padding:2.2rem 1.2rem;border:1px solid var(--line);position:relative;overflow:hidden;background:#fff;}
        .detail-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--sage),var(--gold));}
        .detail-icon{width:26px;height:26px;margin:0 auto 0.9rem;display:block;color:var(--sage);}
        .detail-label{font-weight:500;font-size:0.6rem;letter-spacing:4px;text-transform:uppercase;color:var(--gold);margin-bottom:0.6rem;}
        .detail-value{font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:500;color:var(--ink);line-height:1.45;}
        .detail-sub{font-size:0.78rem;font-weight:300;color:var(--muted);margin-top:0.4rem;line-height:1.5;}
        .action-btn{display:inline-block;margin-top:1.2rem;font-size:0.58rem;font-weight:500;letter-spacing:3px;text-transform:uppercase;color:var(--forest);text-decoration:none;border:1px solid var(--sage);padding:0.7rem 1.2rem;transition:all 0.4s ease;cursor:pointer;}
        .action-btn:hover{background:var(--forest);border-color:var(--forest);color:#F7F8F5;}

        /* ── FORM ── */
        .form-section{padding:6rem 1.75rem;background:linear-gradient(175deg,var(--mist),var(--paper));position:relative;overflow:hidden;}
        .form-container{max-width:460px;margin:0 auto;text-align:center;}
        .form-title{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:2.1rem;color:var(--ink);margin-bottom:0.5rem;}
        .form-sub{font-weight:300;font-size:0.68rem;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-bottom:1.2rem;}
        .form-deadline{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.1rem;color:var(--forest);margin-bottom:2.6rem;}
        .fg{margin-bottom:1.4rem;text-align:left;}
        .fl{display:block;font-weight:500;font-size:0.6rem;letter-spacing:3px;text-transform:uppercase;color:#7A847D;margin-bottom:0.5rem;}
        .fi{width:100%;padding:0.95rem 1.2rem;font-family:'Cormorant Garamond',serif;font-size:1.15rem;color:var(--ink);background:#FFF;border:1px solid #D5DDD2;outline:none;transition:border-color 0.3s,box-shadow 0.3s;-webkit-appearance:none;border-radius:0;}
        .fi:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(176,140,82,0.12);}
        .fi::placeholder{color:#B9C1BA;font-style:italic;}
        .submit-btn{width:100%;margin-top:0.8rem;font-family:'Montserrat',sans-serif;font-weight:500;font-size:0.65rem;letter-spacing:5px;text-transform:uppercase;color:#F7F8F5;background:var(--forest);border:none;padding:1.15rem;cursor:pointer;transition:all 0.4s;}
        .submit-btn:hover{background:var(--deep);box-shadow:0 8px 30px rgba(47,74,59,0.28);}
        .submit-btn:disabled{opacity:0.5;cursor:not-allowed;box-shadow:none;}
        .form-note{font-size:0.72rem;font-weight:300;color:var(--muted);margin-top:1.2rem;line-height:1.6;}
        .success-card{text-align:center;padding:2.5rem 1rem;animation:fadeInUp 0.6s ease;}
        .success-orn{display:block;width:120px;height:20px;margin:0 auto 1.4rem;color:var(--gold);}
        .success-title{font-family:'Cormorant Garamond',serif;font-weight:400;font-size:2rem;color:var(--forest);margin-bottom:0.6rem;}
        .success-text{font-weight:300;font-size:0.88rem;color:var(--muted);line-height:1.75;}

        /* ── ADMIN ── */
        .admin{background:#16201A;padding:4rem 2rem;color:#F7F8F5;}
        .admin-box{max-width:700px;margin:0 auto;}
        .admin-t{font-family:'Cormorant Garamond',serif;font-weight:300;font-size:1.8rem;margin-bottom:0.3rem;}
        .admin-s{font-weight:300;font-size:0.72rem;letter-spacing:2px;color:var(--gold-l);margin-bottom:1.5rem;}
        .admin-note{font-size:0.72rem;color:#9DBAA7;margin-bottom:1.5rem;padding:0.8rem;border:1px solid rgba(157,186,167,0.3);}
        .rsvp-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem 0;border-bottom:1px solid rgba(255,255,255,0.07);}
        .rsvp-name{font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:500;}
        .rsvp-meta{font-size:0.68rem;color:#8A958E;margin-top:0.15rem;}
        .del-btn{background:none;border:1px solid rgba(255,120,120,0.35);color:#FF8A8A;font-size:0.58rem;letter-spacing:2px;text-transform:uppercase;padding:0.4rem 0.8rem;cursor:pointer;}
        .empty-list{font-weight:300;font-size:0.85rem;color:#6E7A72;text-align:center;padding:2rem 0;}

        /* ── FOOTER ── */
        .footer{text-align:center;padding:3.5rem 2rem 3rem;background:var(--paper);}
        .footer-orn{display:block;width:120px;height:20px;margin:0 auto 1rem;color:var(--gold);opacity:0.7;}
        .footer-name{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:1.5rem;color:var(--forest);}
        .footer-sub{font-size:0.58rem;letter-spacing:4px;text-transform:uppercase;color:var(--muted);margin-top:0.4rem;}

        @keyframes fadeInUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}
        @keyframes scrollPulse{0%,100%{opacity:0.3;transform:scaleY(1);}50%{opacity:0.85;transform:scaleY(1.2);}}

        @media(max-width:700px){
          .details-grid{grid-template-columns:1fr;gap:1.2rem;}
          .quote-section{padding:4.5rem 1.5rem;}
        }
        @media(min-width:1024px){
          .hero{align-items:center;justify-content:flex-end;}
          .hero-bg{width:50%;right:auto;left:0;}
          .hero-overlay{width:50%;right:auto;left:0;background:linear-gradient(180deg,rgba(34,55,43,0.15) 0%,rgba(34,55,43,0.05) 40%,rgba(28,46,36,0.5) 100%);}
          .hero-content{width:50%;padding:2rem 4rem;}
          .hero-scroll{left:50%;}
        }
        @media(prefers-reduced-motion:reduce){
          *{animation:none !important;transition:none !important;}
          .hero-scroll{opacity:1;}
        }
      `}</style>

      <div className="invite-wrap">
        {/* ═══ HERO ═══ */}
        <section className="hero" ref={heroParRef}>
          <div
            className={`hero-bg ${heroLoaded ? "loaded" : ""}`}
            style={{ backgroundImage: `url(${IMG_HERO})`, transform: `translateY(${heroParOff}px)` }}
          />
          <div className="hero-overlay" />
          <div className="hero-grain" />
          <div className="hero-content">
            <p className={`hero-pretitle ${heroLoaded ? "show" : ""}`}>Convite Especial</p>
            <Ornament className={`hero-ornament ${heroLoaded ? "show" : ""}`} onClick={handleOrnamentClick} />
            <h1 className={`hero-name ${heroLoaded ? "show" : ""}`}>
              Luiza<em>Shansis Tarta</em>
            </h1>
            <p className={`hero-degree ${heroLoaded ? "show" : ""}`}>Medicina · UCPel · 2026</p>
            <p className={`hero-date ${heroLoaded ? "show" : ""}`}>11 · 12 · 2026</p>
            <button className={`hero-cta ${heroLoaded ? "show" : ""}`} onClick={scrollToForm}>
              Confirmar Presença
            </button>
          </div>
          <div className="hero-scroll">
            <span>Role</span>
            <div className="scroll-line" />
          </div>
        </section>

        {/* ═══ INTRO ═══ */}
        <section className="intro" ref={introRef}>
          <div style={revealStyle(introVis, 0.1)}>
            <p className="intro-text">
              É com muita alegria que convido você para celebrar comigo a minha formatura em <strong>Medicina</strong>.
              Depois de 6 anos de dedicação e aprendizado, chegou o momento de comemorar essa conquista ao lado de
              pessoas especiais. Espero você para tornar essa noite ainda mais especial.
            </p>
            <p className="intro-sign">Luiza</p>
          </div>
        </section>

        {/* ═══ QUOTE ═══ */}
        <section className="quote-section">
          <QuoteReveal />
        </section>

        {/* ═══ DETAILS ═══ */}
        <section className="details" ref={detailsRef}>
          <div className="section-title" style={revealStyle(detailsVis, 0)}>
            <h2>Detalhes da Festa</h2>
            <p>Informações para a noite</p>
          </div>
          <div className="details-grid">
            <div className="detail-card" style={revealStyle(detailsVis, 0.15)}>
              <IconCalendar />
              <p className="detail-label">Data</p>
              <p className="detail-value">11 de dezembro<br />de 2026</p>
              <p className="detail-sub">Sexta-feira</p>
              <a href={EVENT.calendarUrl} target="_blank" rel="noopener noreferrer" className="action-btn">
                Salvar no calendário
              </a>
            </div>
            <div className="detail-card" style={revealStyle(detailsVis, 0.3)}>
              <IconClock />
              <p className="detail-label">Horário</p>
              <p className="detail-value">A partir<br />das 20h</p>
            </div>
            <div className="detail-card" style={revealStyle(detailsVis, 0.45)}>
              <IconPin />
              <p className="detail-label">Local</p>
              <p className="detail-value">Clube de Caça e Pesca<br />de Pelotas</p>
              <p className="detail-sub">Salão Tiro ao Prato<br />Av. Adolfo Fetter, 400 · Laranjal</p>
              <a href={EVENT.mapsUrl} target="_blank" rel="noopener noreferrer" className="action-btn">
                Como chegar
              </a>
            </div>
          </div>
        </section>

        {/* ═══ FORM ═══ */}
        <section className="form-section" ref={formRef}>
          <div className="form-container" ref={formRevRef}>
            {!done ? (
              <div style={revealStyle(formVis, 0)}>
                <h2 className="form-title">Confirme sua presença</h2>
                <p className="form-sub">Vai ser muito bom ter você lá</p>
                <p className="form-deadline">Confirme até 20 de novembro</p>
                <div className="fg">
                  <label className="fl" htmlFor="rsvp-name">Nome completo</label>
                  <input id="rsvp-name" className="fi" type="text" autoComplete="name" placeholder="Seu nome"
                    value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="fg">
                  <label className="fl" htmlFor="rsvp-phone">WhatsApp <span style={{ color: "#AAB3AC", letterSpacing: "1px" }}>(opcional)</span></label>
                  <input id="rsvp-phone" className="fi" type="tel" autoComplete="tel" placeholder="(53) 99999-9999"
                    value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <button className="submit-btn" onClick={handleSubmit} disabled={!name.trim() || sending}>
                  {sending ? "Enviando..." : "Confirmar presença"}
                </button>
                <p className="form-note">O convite é individual. Cada convidado confirma com o próprio nome.</p>
              </div>
            ) : (
              <div className="success-card">
                <Ornament className="success-orn" />
                <h3 className="success-title">
                  {alreadyDone && !submitted ? "Presença já confirmada!" : "Presença confirmada!"}
                </h3>
                <p className="success-text">
                  {alreadyDone && !submitted
                    ? "Você já confirmou sua presença. Nos vemos no dia 11 de dezembro!"
                    : "Obrigada por confirmar! Nos vemos no dia 11 de dezembro."}
                  <br />Vai ser uma noite inesquecível.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══ ADMIN (oculto - 5 toques no ornamento do topo) ═══ */}
        {showAdmin && (
          <section className="admin">
            <div className="admin-box">
              <h3 className="admin-t">Confirmações deste aparelho</h3>
              <p className="admin-s">{rsvpList.length} {rsvpList.length === 1 ? "CONFIRMAÇÃO" : "CONFIRMAÇÕES"}</p>
              <p className="admin-note">A lista oficial completa está na planilha do Google. Aqui aparecem só as confirmações feitas neste navegador.</p>
              {rsvpList.length === 0 ? (
                <p className="empty-list">Nenhuma confirmação ainda.</p>
              ) : rsvpList.map(r => (
                <div key={r.id} className="rsvp-row">
                  <div style={{ flex: 1 }}>
                    <p className="rsvp-name">{r.name}</p>
                    <p className="rsvp-meta">{r.phone && `${r.phone} · `}Confirmado em {r.confirmedAt}</p>
                  </div>
                  <button className="del-btn" onClick={() => handleDelete(r.id)}>Remover</button>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="footer">
          <Ornament className="footer-orn" />
          <p className="footer-name">Luiza Shansis Tarta</p>
          <p className="footer-sub">Medicina · UCPel · 2026</p>
        </footer>
      </div>
    </>
  );
}

/* ── Frase com revelação própria ── */
function QuoteReveal() {
  const [ref, vis] = useReveal(0.2);
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)", transition: "all 1.2s cubic-bezier(0.22,1,0.36,1)" }}>
      <Ornament className="quote-orn" />
      <p className="quote-text">"Curar quando possível, aliviar quando necessário, consolar sempre."</p>
      <p className="quote-attr">— Máxima da Medicina</p>
    </div>
  );
}

/* ── Ícones em traço fino ── */
function IconCalendar() {
  return (
    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg className="detail-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}
