# Helmet Store — Setup Guide (Roman Urdu + English)

Yeh ek full-stack Node.js website hai jo motorcycle/bike helmets bechne ke liye
bani hai. COD (Cash on Delivery) order system, aur English/Urdu bilingual support
ke sath.

## Kaise chalayen (How to run)

1. Sab se pehle terminal khol lein aur is folder mein jayen:
   ```
   cd helmet-store
   ```

2. Dependencies install karen (sirf ek dafa karna hai):
   ```
   npm install
   ```

3. Server start karen:
   ```
   npm start
   ```

4. Browser mein yeh link kholen:
   ```
   http://localhost:3000
   ```

### ⚠️ IMPORTANT — Bahut Zaroori Baat

Yeh Node.js application hai. **Kabhi bhi VS Code ka "Live Server" (port 5500)
se na kholen** — is se app kaam nahi karega, kyunke Live Server sirf plain
HTML files ke liye hota hai, is app ko database aur session ki zarurat hai
jo sirf `node server.js` ya `npm start` se milta hai.

Sahi tareeqa: **Terminal mein `npm start` likhen, phir `localhost:3000` par
jayen.**

## Admin Panel

- URL: `http://localhost:3000/admin/login`
- Username: `admin`
- Password: `admin123`

Admin panel se aap yeh kar sakte hain:
- **Products**: Naye helmets add/edit/delete karen, image upload karen
- **Orders**: Customer orders dekhen, status update karen (Pending → Confirmed → Shipped → Delivered)
- **Branding**: Site ka naam, logo, aur theme color change karen (live preview ke sath, ready-made color presets bhi hain jaise "Light Blue")

⚠️ Pehli dafa login karne ke baad, please apna password change karne ka tareeqa
develop karayen ya kam az kam is default password ko production mein change
karayen.

## Features

- ✅ Bilingual: English / Urdu (RTL support automatically Urdu mein switch hota hai)
- ✅ Dark Mode toggle (top-right corner mein moon icon)
- ✅ Product categories aur search
- ✅ Shopping cart (session-based)
- ✅ COD checkout (Cash on Delivery) — no online payment needed
- ✅ Admin panel: products, orders, branding
- ✅ Image upload for products (multer)
- ✅ Auto stock reduction after order

## Folder Structure

```
helmet-store/
├── server.js              → Main app entry point
├── models/db.js            → Database (lowdb, JSON file storage)
├── middleware/
│   ├── auth.js              → Admin login check
│   └── lang.js               → Bilingual (EN/UR) text dictionary
├── routes/
│   ├── site.js               → Public pages (home, shop, cart, checkout)
│   └── admin.js               → Admin panel routes
├── views/                   → EJS templates (all pages)
│   ├── admin/                 → Admin panel pages
│   └── partials/                → Shared header/footer
├── public/
│   ├── css/style.css           → All styling
│   ├── js/main.js                → Dark mode toggle script
│   └── uploads/                    → Uploaded product images go here
└── data/db.json               → Your database file (auto-created)
```

## Brevo Email Setup (Contact Form → Aap ki Email)

Jab koi customer contact form fill kare (chahe wo `/contact` page ho ya website
ke neeche wala quick contact form), aap ko email mil jayegi. Yeh Brevo
(pehle Sendinblue) ka **free plan** use karta hai — 300 emails/din free hain.

### Step 1: Brevo Account Banayen

1. Browser mein jayen: **https://www.brevo.com**
2. "Sign up free" par click karen
3. Apna email, naam, aur password daal ke account banayen
4. Email verify karen (Brevo aap ko verification email bhejega)

### Step 2: API Key Generate Karen

1. Brevo dashboard mein login karen
2. Top-right corner mein apni profile picture/icon par click karen
3. **"SMTP & API"** option par click karen (ya seedha yeh link kholen: https://app.brevo.com/settings/keys/api)
4. **"Generate a new API key"** button par click karen
5. Key ka naam den (jaise "Helmet Store") aur **"Generate"** par click karen
6. **API key ko copy kar lein** — yeh sirf ek dafa dikhti hai, dhyan se save karen
   (Kuch is tarah dikhegi: `xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxx`)

### Step 3: Sender Email Verify Karen

Brevo aap ko sirf verified email address se mail bhejne dega:

1. Brevo dashboard mein **Settings → Senders, Domains & Dedicated IPs** par jayen
   (Ya seedha: https://app.brevo.com/senders/list)
2. **"Add a sender"** par click karen
3. Apna email address (jaise `noreply@yourdomain.com` ya apni Gmail) aur naam daalen
4. Brevo aap ko us email par ek verification link bhejega — apni email khol ke
   us link par click karen
5. Verified ho jane ke baad, yehi email `.env` file mein `BREVO_SENDER_EMAIL`
   mein daalen

> **Tip:** Agar aap ke pass apna domain nahi hai, to apni personal Gmail bhi
> sender ke taur par verify kar sakte hain — shuru mein yeh sab se asaan tareeqa hai.

### Step 4: `.env` File Set Karen

Project folder mein `.env` file already maujood hai. Usay kholen aur apni
details bharen:

```
BREVO_API_KEY=xkeysib-yahan-apni-real-api-key-paste-karen
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Helmet Store
ADMIN_EMAIL=yahan-apni-email-jahan-message-chahiye@gmail.com
PORT=3000
```

- `BREVO_API_KEY` → Step 2 wali key
- `BREVO_SENDER_EMAIL` → Step 3 mein verify ki hui email
- `BREVO_SENDER_NAME` → jo naam customer ko "From" mein dikhega
- `ADMIN_EMAIL` → **aap ki email jahan customer ke messages aana chahiye** (yeh
  koi bhi email ho sakti hai, verify karne ki zarurat nahi — sirf sender email
  verify honi zaroori hai)

**Zaroori:** `.env` file ko kabhi GitHub par upload NA karen. Yeh already
`.gitignore` mein add hai, is liye normal `git push` se yeh khud-ba-khud
chupi rahegi.

### Step 5: Test Karen

1. `npm start` se server chalayen
2. Website par `/contact` page kholen (ya kisi bhi page ke neeche wala
   contact form use karen)
3. Form fill kar ke submit karen
4. Apni `ADMIN_EMAIL` wali inbox check karen (spam folder bhi dekh lein
   shuru mein) — chand second mein email aa jani chahiye
5. Agar email nahi aayi, terminal mein dekhen — wahan error message dikhega
   jo batayega kya masla hai (galat API key, unverified sender, etc.)

### Step 6: Render Par Deploy Karte Waqt

Jab aap Render par deploy karen, `.env` file upload nahi hoti (wo ignore ho
jati hai), is liye Render ke dashboard mein manually yeh environment
variables add karna hoga:

1. Render dashboard mein apni service kholen
2. **Environment** tab par jayen
3. **"Add Environment Variable"** se yeh 4 variables add karen:
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL`
   - `BREVO_SENDER_NAME`
   - `ADMIN_EMAIL`
4. Same values daalen jo aap ne local `.env` mein daali thi
5. Save karen — Render khud service restart kar dega naye settings ke sath

Is ke baad live website par bhi contact form se email aana shuru ho jayegi.

## Deploying to Render

1. GitHub par push karen (ya ZIP upload karen agar Render support karta ho)
2. Render par "New Web Service" banayen
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Environment: Node

Deploy hone ke baad, apna site is URL par milega jo Render aap ko de ga.

## Changing the default admin password

`models/db.js` file mein yeh line dhoondhen:
```js
db.set('admin', {
  username: 'admin',
  password: bcrypt.hashSync('admin123', 10)
}).write();
```
`'admin123'` ko apni nayi password se replace kar dein, phir `data/db.json`
delete kar ke server ko restart karen (naya password apply ho jayega).
