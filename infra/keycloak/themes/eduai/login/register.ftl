
<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm') ; section>
<#if section = "header">
    ${msg("registerTitle")}
<#elseif section = "form">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%;
  height: 100vh;
  font-family: 'Inter', sans-serif !important;
  background-color: #F8FAFC !important;
  color: #0F172A;
  overflow: hidden;
  position: relative;
}

/* Canvas handles background */

/* Canvas handles background */


.auth-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  width: 100%;
  max-width: 980px;
  height: 90vh;
  max-height: 700px;
  background: transparent;
  gap: 30px;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* LEFT PANEL */
.left-panel {
  flex: 0 1 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-left: 20px;
}

.illustration-circle {
  width: 200px;
  height: 200px;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 0 40px rgba(217, 244, 91, 0.15);
  overflow: hidden;
}

.illustration-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.left-title {
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 900;
  line-height: 1.1;
  color: #0F172A;
  margin-bottom: 12px;
  max-width: 400px;
}

.left-title .highlight { color: #4F46E5; }

.left-description {
  font-size: 14px;
  line-height: 1.5;
  color: #9CA3AF;
  max-width: 380px;
  margin-bottom: 20px;
}

.badges-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.badge {
  background: rgba(79, 70, 229, 0.05);
  border: 1px solid rgba(79, 70, 229, 0.2);
  color: #4F46E5;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-row {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.stat { display: flex; flex-direction: column; align-items: center; }
.stat .val { font-size: 24px; font-weight: 800; color: #0F172A; }
.stat .lbl { font-size: 11px; color: #9CA3AF; font-weight: 500; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;}

/* RIGHT PANEL */
.right-panel {
  flex: 0 1 440px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.top-links {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 420px;
  margin-bottom: 20px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #4F46E5;
  text-decoration: none;
  font-weight: 700;
}

.lang {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #0F172A;
  background: rgba(255,255,255,0.05);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.1);
}

.form-card {
  width: 100%;
  max-width: 420px;
  background: #FFFFFF;
  border: 1px solid rgba(217, 244, 91, 0.1);
  border-radius: 24px;
  padding: 32px 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.form-card h2 {
  font-size: 26px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 6px;
  color: #0F172A;
}

.form-card .subtitle {
  text-align: center;
  font-size: 13px;
  color: #9CA3AF;
  margin-bottom: 24px;
}

.fg { margin-bottom: 16px; }

.fg label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #9CA3AF;
  margin-bottom: 8px;
}

.input-wrap { position: relative; }
.input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #6B7280; transition: 0.2s;}
.input-field {
  width: 100%;
  height: 46px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 0 14px 0 40px;
  font-size: 14px;
  color: #0F172A;
  outline: none;
  transition: all 0.2s;
}
.input-field:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
.input-field::placeholder { color: #4B5563; }
.fg:has(.input-field:focus) .input-icon { color: #4F46E5; }

.eye-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; color: #6B7280; cursor: pointer; }

.options { display: flex; align-items: center; justify-content: space-between; margin: 10px 0 24px; }
.remember { display: flex; align-items: center; gap: 8px; color: #9CA3AF; font-size: 13px; font-weight: 500; }
.remember input { width: 16px; height: 16px; accent-color: #4F46E5; cursor: pointer; }
.forgot { color: #4F46E5; text-decoration: none; font-size: 13px; font-weight: 700; }

.btn-primary {
  width: 100%;
  height: 48px;
  background: #4F46E5;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn-primary:hover { background: #4338CA; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(79, 70, 229, 0.25); }

.divider { display: flex; align-items: center; gap: 14px; margin: 24px 0; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #E2E8F0; }
.divider span { color: #6B7280; font-weight: 600; font-size: 12px; }

.socials { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.social-btn {
  height: 42px;
  border: 1px solid #E2E8F0;
  background: #F8FAFC;
  border-radius: 10px;
  text-decoration: none;
  color: #0F172A;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}
.social-btn:hover { background: #F1F5F9; }

.form-bottom { text-align: center; margin-top: 24px; font-size: 13px; color: #9CA3AF; }
.form-bottom a { color: #4F46E5; font-weight: 700; text-decoration: none; margin-left: 4px; }

.al { padding: 12px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; background: rgba(220, 38, 38, 0.1); color: #FCA5A5; border: 1px solid rgba(220, 38, 38, 0.2); }

#kc-header, #kc-header-wrapper, .pf-v5-c-brand, .pf-v5-c-login__main-header, .pf-v5-c-title, .pf-v5-c-login__footer, .pf-v5-c-login__info, #kc-info, #kc-locale, .pf-v5-c-login__header, [class*="pf-v5-c-brand"], img[src*="logo"], img[alt*="logo" i], img[alt*="keycloak" i], .pf-v5-c-page__header, .pf-v5-c-masthead, nav.pf-v5-c-nav, .pf-v5-c-page__sidebar, #kc-page-title, .pf-v5-c-login__main-header-desc { display: none !important; }
.pf-v5-c-login, .pf-v5-c-login__container, .pf-v5-c-login__main, .pf-v5-c-login__main-body, .pf-v5-l-grid, .pf-v5-l-grid__item, .pf-v5-l-split, .pf-v5-c-page, .pf-v5-c-page__main, .pf-v5-c-login__main-footer-band { all: unset !important; display: block !important; width: 100% !important; }

.register-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.role-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
.role-option {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.role-option:hover { background: #F1F5F9; }
.role-option.active {
  background: rgba(79, 70, 229, 0.05);
  border-color: #4F46E5;
}
.role-icon { font-size: 18px; }
.role-label { font-size: 13px; font-weight: 600; color: #0F172A; }
.role-hint { font-size: 12px; color: #FCA5A5; line-height: 1.4; padding: 8px 12px; background: rgba(220, 38, 38, 0.1); border-radius: 8px; margin-top: 8px; }

@media(max-width: 900px) {
  body { overflow-y: auto; padding: 20px; height: auto; display: block;}
  .auth-container { flex-direction: column; height: auto; max-height: none; gap: 30px; }
  .left-panel { display: none; }
  .right-panel { flex: 1; }
}
</style>

<div class="auth-container">
  <div class="left-panel">
    <div class="illustration-circle">
      <img src="/images/eduai-student-learning.jpg" alt="EduAI" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop';"/>
    </div>
    
    <h1 class="left-title">Apprenez avec <span class="highlight">intelligence</span>, progressez avec <span class="highlight">passion</span>.</h1>
    <p class="left-description">Rejoignez des milliers d'étudiants qui transforment leur avenir grâce à nos cours interactifs et notre tuteur IA.</p>
    
    <div class="badges-row">
      <span class="badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Tuteur IA</span>
      <span class="badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Quiz adaptatifs</span>
      <span class="badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Suivi en temps réel</span>
    </div>
    
    <div class="stats-row">
      <div class="stat"><span class="val">260+</span><span class="lbl">Cours</span></div>
      <div class="stat"><span class="val">5 340+</span><span class="lbl">Étudiants</span></div>
      <div class="stat"><span class="val">99%</span><span class="lbl">Satisfaction</span></div>
    </div>
  </div>

  <div class="right-panel">
    <div class="top-links">
      <a href="http://localhost:3000" class="back-link"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Retour au site</a>
      <div class="lang">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        Français
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <div class="form-card">
      <h2>Créer un compte</h2>
      <p class="subtitle">Rejoignez EduAI et commencez à apprendre gratuitement</p>

      <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
        <div class="al">${kcSanitize(message.summary)?no_esc}</div>
      </#if>

      <form id="kc-register-form" action="${url.registrationAction}" method="post">
        
        <div class="register-grid">
          <div class="fg">
            <label for="firstName">Prénom</label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input type="text" id="firstName" name="firstName" value="${(register.formData.firstName!'')}" class="input-field" placeholder="Prénom" autocomplete="given-name"/>
            </div>
          </div>
          <div class="fg">
            <label for="lastName">Nom</label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input type="text" id="lastName" name="lastName" value="${(register.formData.lastName!'')}" class="input-field" placeholder="Nom" autocomplete="family-name"/>
            </div>
          </div>
        </div>

        <div class="fg">
          <label for="email">Adresse e-mail</label>
          <div class="input-wrap">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <input type="email" id="email" name="email" value="${(register.formData.email!'')}" class="input-field" placeholder="vous@exemple.com" autocomplete="email"/>
          </div>
        </div>

        <#if !realm.registrationEmailAsUsername>
          <div class="fg">
            <label for="username">Nom d'utilisateur</label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/></svg>
              <input type="text" id="username" name="username" value="${(register.formData.username!'')}" class="input-field" placeholder="@ votre_pseudo" autocomplete="username"/>
            </div>
          </div>
        </#if>

        <div class="fg">
          <label>Je suis</label>
          <div class="role-selector">
            <label class="role-option active" data-role="student" onclick="selectRole(this,'student')">
              <input type="radio" name="user.attributes.role" value="student" checked style="display:none"/>
              <span class="role-icon">🎓</span>
              <span class="role-label">Étudiant</span>
            </label>
            <label class="role-option" data-role="instructor" onclick="selectRole(this,'instructor')">
              <input type="radio" name="user.attributes.role" value="instructor" style="display:none"/>
              <span class="role-icon">👨‍🏫</span>
              <span class="role-label">Professeur</span>
            </label>
          </div>
          <div class="role-hint" id="role-hint" style="display:none">
            ⚠️ Les comptes professeurs nécessitent un certificat et une validation par un administrateur.
          </div>
        </div>

        <div class="fg" id="speciality-field" style="display:none">
          <label for="user.attributes.speciality">Domaine / Spécialité</label>
          <div class="input-wrap">
            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <input type="text" id="user.attributes.speciality" name="user.attributes.speciality" class="input-field" placeholder="Ex: Informatique, Mathématiques, Physique..." autocomplete="off"/>
          </div>
        </div>

        <div class="register-grid">
          <div class="fg">
            <label for="password">Mot de passe</label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" id="password" name="password" class="input-field" placeholder="••••••••" autocomplete="new-password"/>
              <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
          </div>
          <div class="fg">
            <label for="password-confirm">Confirmer</label>
            <div class="input-wrap">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <input type="password" id="password-confirm" name="password-confirm" class="input-field" placeholder="••••••••" autocomplete="new-password"/>
              <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
          </div>
        </div>

        <button name="register" id="kc-register" type="submit" class="btn-primary">
          Créer mon compte <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>

        <div class="form-bottom">
          <p>Vous avez déjà un compte ? <a href="${url.loginUrl}">Se connecter</a></p>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
function selectRole(el, role) {
    var opts = document.querySelectorAll('.role-option');
    opts.forEach(function(o) { o.classList.remove('active'); });
    el.classList.add('active');
    el.querySelector('input').checked = true;
    var hint = document.getElementById('role-hint');
    var specField = document.getElementById('speciality-field');
    if (hint) hint.style.display = role === 'instructor' ? 'block' : 'none';
    if (specField) specField.style.display = role === 'instructor' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', function() {
    const eyeIcons = document.querySelectorAll('.eye-icon');
    eyeIcons.forEach(icon => {
      icon.addEventListener('click', function() {
        const input = this.previousElementSibling;
        if (input.type === 'password') {
          input.type = 'text';
          this.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/>';
        } else {
          input.type = 'password';
          this.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
      });
    });
});
</script>

<canvas id="network-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:0;"></canvas>
<script>
  (function() {
    const canvas = document.getElementById('network-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let mouse = { x: null, y: null };
    const CONNECTION_DISTANCE = 160;
    const COLORS = [
      { r: 59, g: 130, b: 246 },
      { r: 14, g: 165, b: 233 },
      { r: 20, g: 184, b: 166 }
    ];
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.baseRadius = Math.random() * 2.5 + 1.2;
        this.radius = this.baseRadius;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.012 + Math.random() * 0.012;
        this.depth = Math.random() * 0.5 + 0.5;
      }
      update() {
        this.pulsePhase += this.pulseSpeed;
        this.radius = this.baseRadius + Math.sin(this.pulsePhase) * 0.6;
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw(ox, oy) {
        const dx = this.x + ox * this.depth;
        const dy = this.y + oy * this.depth;
        const { r, g, b } = this.color;
        const alpha = 0.55;
        ctx.beginPath();
        ctx.arc(dx, dy, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(' + r + ',' + g + ',' + b + ',0.3)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    const initParticles = () => {
      particles = [];
      const area = canvas.width * canvas.height;
      const count = Math.min(Math.max(Math.floor(area / 16000), 30), 100);
      for (let i = 0; i < count; i++) particles.push(new Particle());
    };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let ox = 0, oy = 0;
      if (mouse.x !== null) {
        ox = (canvas.width / 2 - mouse.x) * 0.03;
        oy = (canvas.height / 2 - mouse.y) * 0.03;
      }
      for (const p of particles) p.update();
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x + ox * a.depth;
        const ay = a.y + oy * a.depth;
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const bx = b.x + ox * b.depth;
          const by = b.y + oy * b.depth;
          const dist = Math.hypot(ax - bx, ay - by);
          if (dist < CONNECTION_DISTANCE) {
            const fade = 1 - dist / CONNECTION_DISTANCE;
            const lineAlpha = Math.min(fade * 0.18, 0.3);
            const grad = ctx.createLinearGradient(ax, ay, bx, by);
            grad.addColorStop(0, 'rgba(' + a.color.r + ',' + a.color.g + ',' + a.color.b + ',' + lineAlpha + ')');
            grad.addColorStop(1, 'rgba(' + b.color.r + ',' + b.color.g + ',' + b.color.b + ',' + lineAlpha + ')');
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      for (const p of particles) p.draw(ox, oy);
      animationFrameId = requestAnimationFrame(animate);
    };
    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = null; mouse.y = null; };
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    resizeCanvas();
    animate();
  })();
</script>

</#if>
</@layout.registrationLayout>
