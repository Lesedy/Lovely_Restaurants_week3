import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowRight, Check, ChefHat, ChevronDown, Clock3, Heart, Leaf, LogIn, LogOut, Menu as MenuIcon, Minus, Plus, Search, ShoppingBag, Sparkles, Star, UserRound, X } from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const categories = ['All', 'Starters', 'Mains', 'Desserts', 'Drinks'];
const currency = amount => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(Number(amount));

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [mobileNav, setMobileNav] = useState(false);

  async function loadMenu() {
    setLoadingMenu(true); setMenuError('');
    try {
      const params = new URLSearchParams();
      if (activeCategory !== 'All') params.set('category', activeCategory);
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`${API_URL}/api/menu?${params.toString()}`);
      if (!response.ok) throw new Error('The menu API could not be reached. Check that the server and database are running.');
      const data = await response.json(); setMenuItems(data.items || []);
    } catch (error) { setMenuError(error.message); setMenuItems([]); }
    finally { setLoadingMenu(false); }
  }

  useEffect(() => { loadMenu(); }, [activeCategory, search]);
  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' }).then(r => r.ok ? r.json() : { user: null }).then(data => setUser(data.user)).catch(() => setUser(null));
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 2800); return () => clearTimeout(timer); }, [notice]);

  const featured = useMemo(() => menuItems.filter(item => item.featured).slice(0, 3), [menuItems]);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  function addToCart(item) {
    setCart(previous => {
      const found = previous.find(row => row.id === item.id);
      return found ? previous.map(row => row.id === item.id ? { ...row, quantity: row.quantity + 1 } : row) : [...previous, { ...item, quantity: 1 }];
    });
    setNotice(`${item.name} added to your bag`);
  }
  function updateQuantity(id, change) {
    setCart(previous => previous.map(item => item.id === id ? { ...item, quantity: item.quantity + change } : item).filter(item => item.quantity > 0));
  }
  function toggleFavourite(id) { setFavourites(old => old.includes(id) ? old.filter(value => value !== id) : [...old, id]); }
  function openAuth(mode = 'login') { setAuthMode(mode); setAuthError(''); setAuthOpen(true); setMobileNav(false); }
  async function submitAuth(event) {
    event.preventDefault(); setAuthBusy(true); setAuthError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/${authMode === 'signup' ? 'signup' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(authForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed.');
      setUser(data.user); setAuthOpen(false); setAuthForm({ name: '', email: '', password: '' }); setNotice(authMode === 'signup' ? `Welcome to the table, ${data.user.name}!` : `Welcome back, ${data.user.name}!`);
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  }
  async function signOut() {
    try { await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }); }
    finally { setUser(null); setNotice('You have signed out. See you soon!'); }
  }

  return <div className="min-h-screen bg-cream text-ink">
    <div className="announcement"><Sparkles size={14} /> A little something lovely is always on the menu <span className="announcement-dot">✦</span> Made fresh, made with love</div>
    <header className="site-header">
      <a href="#home" className="brand" aria-label="Lovely Restaurants home"><span className="brand-mark"><ChefHat size={22} strokeWidth={1.8} /></span><span>lovely<span className="brand-second"> restaurants</span><small>GOOD FOOD. GOOD MOOD.</small></span></a>
      <nav className={`main-nav ${mobileNav ? 'nav-open' : ''}`}>
        <a href="#home" onClick={() => setMobileNav(false)}>Home</a><a href="#menu" onClick={() => setMobileNav(false)}>Our menu</a><a href="#story" onClick={() => setMobileNav(false)}>Our story</a><a href="#visit" onClick={() => setMobileNav(false)}>Find us</a>
        {user ? <button className="mobile-auth" onClick={signOut}><LogOut size={16} /> Sign out</button> : <button className="mobile-auth" onClick={() => openAuth('login')}><LogIn size={16} /> Sign in</button>}
      </nav>
      <div className="header-actions"><button className="user-action" onClick={() => user ? signOut() : openAuth('login')} title={user ? 'Sign out' : 'Sign in'}>{user ? <><UserRound size={18} /><span>{user.name.split(' ')[0]}</span><LogOut size={14} /></> : <><UserRound size={18} /><span>Sign in</span></>}</button><button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open bag, ${cartCount} items`}><ShoppingBag size={19} /><span>Bag</span><b>{cartCount}</b></button><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Toggle navigation">{mobileNav ? <X /> : <MenuIcon />}</button></div>
    </header>

    <main>
      <section id="home" className="hero-section">
        <div className="hero-copy"><div className="eyebrow"><span></span> YOUR NEW FAVOURITE TABLE</div><h1>Good food.<br />Great company.<br /><em>Lovely moments.</em></h1><p>Come as you are, bring your appetite, and let us take care of the delicious details.</p><div className="hero-actions"><a className="button-primary" href="#menu">Explore the menu <ArrowRight size={17} /></a><a className="text-link" href="#story">A little about us <ArrowDownRight size={16} /></a></div><div className="hero-social-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>+</span></div><div><div className="stars"><Star fill="currentColor" size={13} /><Star fill="currentColor" size={13} /><Star fill="currentColor" size={13} /><Star fill="currentColor" size={13} /><Star fill="currentColor" size={13} /></div><small>Loved by our lovely people</small></div></div></div>
        <div className="hero-art"><div className="hero-photo-wrap"><img className="hero-photo" src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=90" alt="A colourful table of freshly prepared food" /><div className="photo-label"><span className="label-icon"><Heart size={19} fill="currentColor" /></span><span><b>Made with love</b><small>Served with a smile</small></span></div></div><div className="floating-note note-top"><span>✳</span> Fresh ingredients, always</div><div className="floating-note note-bottom"><span className="note-star">✦</span><div><b>A table for everyone</b><small>There's a place for you here.</small></div></div><div className="hero-sunburst">GOOD<br />FOOD<br /><span>♡</span></div></div>
        <div className="hero-bottom-line"><span>01 — FOOD THAT FEELS LIKE HOME</span><span>SCROLL TO GET HUNGRY <ChevronDown size={15} /></span></div>
      </section>

      <section className="promise-strip"><div><span className="promise-icon"><Leaf size={21} /></span><span><b>Fresh by nature</b><small>Ingredients we believe in</small></span></div><div><span className="promise-icon"><Heart size={21} /></span><span><b>Made with love</b><small>A little care in every bite</small></span></div><div><span className="promise-icon"><Clock3 size={21} /></span><span><b>Worth slowing down for</b><small>Good food, no rush</small></span></div></section>

      <section id="menu" className="menu-section section-pad"><div className="section-heading"><div><div className="eyebrow"><span></span> SOMETHING DELICIOUS</div><h2>Made to make<br /><em>you smile.</em></h2></div><p>From little bites to the last sweet spoonful, find something that feels just right.</p></div>
        <div className="menu-toolbar"><div className="category-tabs">{categories.map(category => <button key={category} onClick={() => setActiveCategory(category)} className={activeCategory === category ? 'category-tab active' : 'category-tab'}>{category}</button>)}</div><label className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find something lovely..." aria-label="Search menu" />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}</label></div>
        {loadingMenu ? <div className="menu-state"><span className="loader"></span><p>Setting the table...</p></div> : menuError ? <div className="menu-state error-state"><div className="state-icon">☕</div><h3>Our kitchen is warming up</h3><p>{menuError}</p><button className="button-primary" onClick={loadMenu}>Try again <ArrowRight size={16} /></button><small>Tip: configure the database, then run the server's db:setup and db:seed scripts.</small></div> : menuItems.length === 0 ? <div className="menu-state"><div className="state-icon">♡</div><h3>No bites found just yet</h3><p>Try another search or choose a different category.</p><button className="text-link" onClick={() => { setSearch(''); setActiveCategory('All'); }}>Show the full menu <ArrowRight size={16} /></button></div> : <div className="menu-grid">{menuItems.map((item, index) => <article className="menu-card" key={item.id}><div className="menu-image-wrap"><img src={item.image_url} alt={item.name} loading="lazy" /><span className="item-category">{item.category}</span><button className={`favourite-button ${favourites.includes(item.id) ? 'is-favourite' : ''}`} onClick={() => toggleFavourite(item.id)} aria-label={favourites.includes(item.id) ? 'Remove from favourites' : 'Add to favourites'}><Heart size={17} fill={favourites.includes(item.id) ? 'currentColor' : 'none'} /></button>{item.featured && <span className="popular-tag"><Sparkles size={11} /> Guest favourite</span>}</div><div className="menu-card-body"><div className="item-title-row"><h3>{item.name}</h3><strong>{currency(item.price)}</strong></div><p>{item.description}</p><button className="add-button" onClick={() => addToCart(item)}><Plus size={16} /> Add to bag</button></div></article>)}</div>}
        <div className="menu-footnote"><span>✳</span> Prepared with care, just for you. <span>✳</span></div>
      </section>

      <section id="story" className="story-section"><div className="story-image"><img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1100&q=85" alt="A warm restaurant table ready for guests" loading="lazy" /><div className="story-stamp">A little<br /><em>lovely</em><br />goes a long way <Heart size={18} /></div></div><div className="story-copy"><div className="eyebrow"><span></span> THE HEART OF OUR TABLE</div><h2>Food tastes better<br />when there's <em>feeling.</em></h2><p>Lovely Restaurants started with one simple thought: a meal should be more than what's on your plate. It should feel like being welcomed in, catching up with your favourite people, and making room for one more bite.</p><p>That's why we keep things fresh, serve with heart, and believe the best ingredient is always a little kindness.</p><a className="button-outline" href="#visit">Come say hello <ArrowRight size={16} /></a><div className="signature">With love, <span>the Lovely team ♡</span></div></div></section>

      <section id="visit" className="visit-section"><div className="visit-sparkle">✳</div><div className="eyebrow light-eyebrow"><span></span> YOUR SEAT IS WAITING</div><h2>Something lovely<br />is <em>just around the corner.</em></h2><p>Bring your people. Bring your appetite. We'll bring the good stuff.</p><a href="#menu" className="button-light">Find your favourite <ArrowRight size={17} /></a><div className="visit-details"><div><Clock3 size={19} /><span><b>Opening hours</b><small>Mon – Sun · 10:00 – 21:00</small></span></div><div><ShoppingBag size={19} /><span><b>Order at your own pace</b><small>Browse the menu and build your bag</small></span></div><div><Heart size={19} /><span><b>Everyone's welcome</b><small>Come hungry, leave happy</small></span></div></div></section>
    </main>

    <footer className="site-footer"><a href="#home" className="brand footer-brand"><span className="brand-mark"><ChefHat size={22} /></span><span>lovely<span className="brand-second"> restaurants</span><small>GOOD FOOD. GOOD MOOD.</small></span></a><span className="footer-note">Made with <Heart size={13} fill="currentColor" /> and a little extra love.</span><div className="footer-links"><a href="#menu">Menu</a><a href="#story">Our story</a><a href="#visit">Visit us</a></div><small className="copyright">© {new Date().getFullYear()} Lovely Restaurants</small></footer>

    {notice && <div className="toast"><span><Check size={16} /></span>{notice}</div>}

    {authOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setAuthOpen(false); }}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close"><X size={19} /></button><div className="auth-mark"><ChefHat size={25} /></div><div className="eyebrow centered-eyebrow"><span></span> PULL UP A CHAIR <span></span></div><h2 id="auth-title">{authMode === 'signup' ? 'Join our lovely table.' : 'Lovely to see you.'}</h2><p className="auth-subtitle">{authMode === 'signup' ? 'Create an account and make yourself at home.' : 'Sign in and settle right back in.'}</p><form onSubmit={submitAuth} className="auth-form">{authMode === 'signup' && <label>Your name<input autoComplete="name" value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="What should we call you?" required minLength="2" /></label>}<label>Email address<input type="email" autoComplete="email" value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" required /></label><label>Password<input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder={authMode === 'signup' ? 'At least 8 characters' : 'Your password'} required minLength={authMode === 'signup' ? 8 : undefined} /></label>{authError && <div className="auth-error">{authError}</div>}<button className="button-primary auth-submit" disabled={authBusy}>{authBusy ? 'One moment...' : authMode === 'signup' ? 'Create my account' : 'Sign in'} <ArrowRight size={17} /></button></form><div className="auth-switch">{authMode === 'signup' ? 'Already have an account?' : 'New around here?'} <button onClick={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthError(''); }}>{authMode === 'signup' ? 'Sign in' : 'Create an account'}</button></div><small className="auth-security">Your password is securely hashed before it is stored.</small></section></div>}

    {cartOpen && <div className="drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setCartOpen(false); }}><aside className="cart-drawer" aria-label="Your bag"><div className="drawer-header"><div><div className="eyebrow"><span></span> A LITTLE SOMETHING FOR YOU</div><h2>Your lovely bag <span>({cartCount})</span></h2></div><button className="modal-close" onClick={() => setCartOpen(false)} aria-label="Close bag"><X size={20} /></button></div>{cart.length === 0 ? <div className="empty-cart"><div className="empty-bag-icon"><ShoppingBag size={28} /></div><h3>Your bag is feeling lonely.</h3><p>Add a little something delicious from our menu.</p><button className="button-primary" onClick={() => { setCartOpen(false); document.querySelector('#menu')?.scrollIntoView({ behavior: 'smooth' }); }}>Explore the menu <ArrowRight size={16} /></button></div> : <><div className="cart-items">{cart.map(item => <div className="cart-item" key={item.id}><img src={item.image_url} alt="" /><div className="cart-item-info"><h3>{item.name}</h3><strong>{currency(item.price)}</strong><div className="quantity-control"><button onClick={() => updateQuantity(item.id, -1)} aria-label="Remove one"><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} aria-label="Add one"><Plus size={13} /></button></div></div><button className="remove-item" onClick={() => setCart(old => old.filter(row => row.id !== item.id))} aria-label={`Remove ${item.name}`}><X size={15} /></button></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{currency(cartTotal)}</strong></div><small>Final total and payment are not processed in this demo.</small><button className="button-primary checkout-button" onClick={() => { setCartOpen(false); setNotice('Your bag is ready! Online checkout is coming soon.'); }}>Looks delicious <Heart size={16} /></button></div></>}</aside></div>}
  </div>;
}

export default App;
