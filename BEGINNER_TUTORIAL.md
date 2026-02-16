# 🏆 Bullet Royale - Complete Beginner's Tutorial

**Build Your Own Lichess Leaderboard - No Experience Required!**

This guide assumes you've **never coded before**. We'll walk through everything step-by-step with pictures and explanations.

**What You're Building:** A website where chess players compete for trophies by playing bullet games on Lichess.

**Time Required:** 1-2 hours (take your time!)  
**Cost:** $0 forever  
**Difficulty:** Beginner (if you can copy-paste, you can do this!)

---

## 📋 What You'll Need

Before we start, let's get everything ready:

### **1. Install Node.js**

**What is it?** Software that runs JavaScript on your computer.

**How to install:**

**Windows:**
1. Go to https://nodejs.org
2. Click the big green button that says "Download Node.js (LTS)"
3. Run the downloaded file (`node-v20.x.x-x64.msi`)
4. Click "Next" through all the steps (keep defaults)
5. Click "Install"
6. Wait for it to finish
7. Click "Finish"

**Mac:**
1. Go to https://nodejs.org
2. Click "Download Node.js (LTS)"
3. Open the downloaded `.pkg` file
4. Click "Continue" through all steps
5. Enter your Mac password when asked
6. Click "Install"

**Check it worked:**
- Press `Windows key + R` (Windows) or `Cmd + Space` (Mac)
- Type `cmd` (Windows) or `terminal` (Mac)
- Press Enter
- Type: `node --version`
- You should see: `v20.x.x` or similar

---

### **2. Install Git**

**What is it?** Software to manage and upload code.

**How to install:**

**Windows:**
1. Go to https://git-scm.com/download/win
2. Download will start automatically
3. Run the downloaded file
4. Click "Next" through everything (defaults are fine)
5. Click "Install"

**Mac:**
- Already installed! Skip this step.

**Check it worked:**
- Open Terminal/CMD (same as before)
- Type: `git --version`
- You should see: `git version 2.x.x`

---

### **3. Create Accounts**

You need 3 free accounts:

**A. Lichess (you probably have this)**
- Go to https://lichess.org
- Click "Sign up" if you don't have an account
- Remember your username and password!

**B. GitHub**
1. Go to https://github.com
2. Click "Sign up" (top right)
3. Enter your email
4. Create a password
5. Choose a username
6. Verify you're human (solve the puzzle)
7. Click "Create account"
8. Check your email and click the verification link

**C. Supabase (for database)**
1. Go to https://supabase.com
2. Click "Start your project"
3. Click "Continue with GitHub" (easier!)
4. Click "Authorize Supabase" when GitHub asks
5. Done!

**D. Render (for hosting)**
1. Go to https://render.com
2. Click "Get Started"
3. Click "GitHub" to sign up with GitHub
4. Click "Authorize Render"
5. Done!

---

## 📥 Part 1: Download the Files

### Step 1.1: Get the Code

1. **Download all the project files** I gave you earlier
2. **Extract the ZIP file** to your Desktop
3. You should see a folder called `bullet-royale-backend`
4. **Open this folder** - you should see files like:
   - `server.js`
   - `database.js`
   - `package.json`
   - `README.md`
   - and more...

---

## 🗄️ Part 2: Setup Database

### Step 2.1: Create Supabase Project

1. **Go to** https://supabase.com/dashboard
2. **Click "New project"** (green button)
3. **Fill in the form:**
   ```
   Name: bullet-royale
   Database Password: [Make up a strong password - WRITE THIS DOWN!]
   Region: [Choose one close to you]
   ```
   
   **Example password:** `MySecret123!Chess` (make yours different!)
   
4. **Click "Create new project"**
5. **WAIT 2-3 MINUTES** - You'll see a loading screen that says "Setting up your project"
6. Get a coffee ☕ while you wait

### Step 2.2: Find Your Connection String

Once the project is ready:

1. **Look for a green "Connect" button** at the top of the screen
2. **Click "Connect"**
3. A popup will appear with different options
4. **Look for "Connection string"** or "Session pooler"
5. **You'll see code that looks like:**
   ```
   postgresql://postgres.abcdefgh:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. **Copy this entire string**
7. **IMPORTANT:** Replace `[YOUR-PASSWORD]` with the password you created in Step 2.1

**Your final connection string should look like:**
```
postgresql://postgres.abcdefgh:MySecret123!Chess@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

8. **Save this somewhere safe!** (Notepad, Notes app, etc.)

**Can't find the Connect button?**
- Click the gear icon ⚙️ (bottom left)
- Click "Database"
- Scroll down to "Connection string"
- Look for "Session mode" - copy that one!

### Step 2.3: Create Database Tables

1. **On the left sidebar, click "SQL Editor"** (looks like `</>`)
2. **Click the "+ New query" button** (top right)
3. **Now open the `schema.sql` file** from your downloaded folder:
   - Right-click `schema.sql` → Open with → Notepad (Windows) or TextEdit (Mac)
4. **Select ALL the text** (Ctrl+A or Cmd+A)
5. **Copy it** (Ctrl+C or Cmd+C)
6. **Go back to Supabase**
7. **Click in the big text box**
8. **Paste** (Ctrl+V or Cmd+V)
9. **Click "Run" button** (bottom right) OR press `Ctrl+Enter`
10. **You should see:** "Success. No rows returned" (this is good!)

**Verify it worked:**
- Click "Table Editor" on left sidebar
- You should see 4 tables: `games`, `season_rankings`, `seasons`, `users`
- If you see these, YOU'RE DONE! ✅

---

## 💻 Part 3: Setup the Code

### Step 3.1: Open Terminal in Your Project

**Windows:**
1. Open the `bullet-royale-backend` folder in File Explorer
2. Click in the address bar (where it shows the folder path)
3. Type `cmd` and press Enter
4. A black window appears - this is the terminal!

**Mac:**
1. Open Finder
2. Go to the `bullet-royale-backend` folder
3. Right-click the folder
4. Hold `Option` key and click "Copy bullet-royale-backend as Pathname"
5. Open Terminal (search for "Terminal" in Spotlight)
6. Type `cd ` (with a space after cd)
7. Paste the path (Cmd+V)
8. Press Enter

### Step 3.2: Install Dependencies

In the terminal, type this command and press Enter:

```bash
npm install
```

**What you'll see:**
- Lots of text scrolling by
- Lines like "added 150 packages"
- This takes 30-60 seconds
- Wait until you see the cursor appear again

**If you get an error:**
- Make sure you're in the right folder (you should see files like `package.json`)
- Make sure Node.js is installed (type `node --version`)

### Step 3.3: Configure Your Settings

1. **In File Explorer/Finder, find the file called `.env.example`**
2. **Right-click it** → Rename
3. **Change the name to just:** `.env` (remove the .example part)
4. **If it asks "Are you sure you want to change the extension?"** → Click Yes

**Can't see .env.example?**
- **Windows:** Open File Explorer → Click "View" → Check "File name extensions"
- **Mac:** It might be hidden. Just create a new file (see below)

**Alternative - Create .env file manually:**
- **Windows:** Right-click in folder → New → Text Document → Name it `.env`
- **Mac:** Open TextEdit → New Document → Save as `.env` in the project folder

5. **Open `.env` file** (Right-click → Open with → Notepad/TextEdit)
6. **You'll see template text. Replace it with THIS:**

```env
# Lichess OAuth (no setup needed!)
LICHESS_CLIENT_ID=bullet-royale
LICHESS_REDIRECT_URI=http://localhost:3001/auth/lichess/callback

# Discord OAuth (skip for now)
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=

# Database - PASTE YOUR CONNECTION STRING HERE
DATABASE_URL=postgresql://postgres.abcdefgh:MySecret123!Chess@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Session Secret - change this to any random text
SESSION_SECRET=make-this-a-random-string-change-it-to-anything-you-want-abc123

# Server settings
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Trophy settings (you can change these later!)
TROPHY_WIN_BASE=30
TROPHY_LOSS_BASE=20
RATING_BONUS_PER_100=5
SYNC_INTERVAL_MINUTES=5
```

7. **IMPORTANT CHANGES:**
   - **Line 8 (`DATABASE_URL`)**: Replace with YOUR connection string from Step 2.2
   - **Line 11 (`SESSION_SECRET`)**: Change to any random text (like `mySecretKey789XYZ`)

8. **Save the file** (Ctrl+S or Cmd+S)
9. **Close it**

### Step 3.4: Start Your Server

In the terminal, type:

```bash
npm start
```

**You should see:**
```
╔═══════════════════════════════════════════════════╗
║       🏆 BULLET ROYALE API SERVER 🏆            ║
╚═══════════════════════════════════════════════════╝

✅ Connected to PostgreSQL database
Server running on port 3001
Ready to accept connections! ⚡
```

**🎉 YOUR SERVER IS RUNNING!**

**DON'T CLOSE THIS WINDOW!** Keep it open. The server needs to stay running.

**If you see an error:**
- Check your `DATABASE_URL` is correct
- Make sure you replaced the password
- Try restarting: Press `Ctrl+C` to stop, then `npm start` again

---

## 🌐 Part 4: Open Your Website Locally

### Step 4.1: Open the Website

1. **Open a NEW terminal/command prompt** (don't close the one running the server!)
2. **Navigate to the `public` folder**:
   
   **Windows:**
   ```bash
   cd Desktop\bullet-royale-backend\public
   ```
   
   **Mac:**
   ```bash
   cd ~/Desktop/bullet-royale-backend/public
   ```

3. **Start a simple web server:**
   
   **If you have Python:**
   ```bash
   python -m http.server 3000
   ```
   
   **Don't have Python? That's okay!**
   - Just **double-click `index.html`** in the public folder
   - It will open in your web browser
   - **Note:** Some features might not work this way, but you can test

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

### Step 4.2: Test It!

You should see:
- **Big title:** "⚡ BULLET ROYALE ⚡"
- **Subtitle:** "Clash for Glory in Monthly Bullet Tournaments"
- **A countdown timer**
- **Green "CONNECT LICHESS TO PLAY" button**

**Click the "CONNECT LICHESS TO PLAY" button:**

1. You'll be taken to Lichess
2. Click "Authorize" to allow the app
3. You'll be redirected back to your site
4. You should see an alert: "Welcome, YOUR_USERNAME!"
5. Your username appears at the top!

**🎊 IT WORKS! You're connected!**

Go back to your terminal where the server is running - you should see:
```
✅ New user created: YOUR_USERNAME
✅ YOUR_USERNAME: 10 games, +245 trophies 🔥 3 streak
```

---

## 🚀 Part 5: Put It On The Internet!

Now let's make it live so others can use it!

### Step 5.1: Upload to GitHub

1. **Go to** https://github.com
2. **Click the "+" icon** (top right) → "New repository"
3. **Fill in:**
   ```
   Repository name: bullet-royale-backend
   Description: Lichess bullet trophy leaderboard
   Public (keep it checked)
   ```
4. **DON'T check** "Add a README file"
5. **Click "Create repository"**
6. **You'll see a page with instructions** - ignore these for now

### Step 5.2: Push Your Code

1. **Go back to your FIRST terminal** (where the server is running)
2. **Press Ctrl+C** to stop the server
3. **Type these commands one at a time** (press Enter after each):

```bash
git init
```
Wait for it to finish, then:

```bash
git add .
```
Wait for it to finish, then:

```bash
git commit -m "Initial commit"
```
Wait for it to finish, then:

```bash
git branch -M main
```

Now **replace YOUR_USERNAME** with your actual GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/bullet-royale-backend.git
```

Finally:

```bash
git push -u origin main
```

**It might ask for your GitHub username and password:**
- Enter your GitHub email
- For password, you need a **Personal Access Token** (GitHub changed this)

**How to get a token:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Bullet Royale"
4. Check "repo" (this checks all sub-boxes)
5. Click "Generate token" at bottom
6. **COPY THE TOKEN** (you can't see it again!)
7. **Paste it as the password** in terminal

**After pushing:**
- Refresh your GitHub repository page
- You should see all your files! 🎉

### Step 5.3: Deploy to Render

1. **Go to** https://render.com/dashboard
2. **Click "New +"** (top right) → "Web Service"
3. **Click "Connect" next to your `bullet-royale-backend` repository**
4. **Fill in the form:**
   ```
   Name: bullet-royale
   Region: Oregon (US West) or closest to you
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
5. **Scroll down to "Environment Variables"**
6. **Click "Add Environment Variable"** and add these ONE AT A TIME:

```
Key: LICHESS_CLIENT_ID
Value: bullet-royale
```

```
Key: LICHESS_REDIRECT_URI
Value: [Leave empty for now - we'll update it]
```

```
Key: DATABASE_URL
Value: [Paste your Supabase connection string]
```

```
Key: SESSION_SECRET
Value: [Same random text you used before]
```

```
Key: NODE_ENV
Value: production
```

```
Key: FRONTEND_URL
Value: [Leave empty for now]
```

```
Key: TROPHY_WIN_BASE
Value: 30
```

```
Key: TROPHY_LOSS_BASE
Value: 20
```

```
Key: RATING_BONUS_PER_100
Value: 5
```

```
Key: SYNC_INTERVAL_MINUTES
Value: 5
```

7. **Click "Create Web Service"** at bottom
8. **WAIT 5-10 MINUTES** - You'll see build logs scrolling
9. **When it says "Your service is live"** - Copy the URL!

It will look like: `https://bullet-royale-abc123.onrender.com`

**Save this URL!**

### Step 5.4: Update Environment Variables

1. **In Render, click "Environment"** (left sidebar)
2. **Find `LICHESS_REDIRECT_URI`** and click "Edit"
3. **Change to:** `https://bullet-royale-abc123.onrender.com/auth/lichess/callback`
   (Use YOUR Render URL!)
4. **Click "Save Changes"**
5. Your service will automatically redeploy (wait 2-3 min)

---

## 🎨 Part 6: Deploy Frontend

### Step 6.1: Update the Frontend

1. **Open `public/index.html`** in Notepad/TextEdit
2. **Press Ctrl+F** (or Cmd+F) to search
3. **Search for:** `localhost:3001`
4. **Replace with:** Your Render URL (like `https://bullet-royale-abc123.onrender.com`)
5. **Save and close**

### Step 6.2: Create Frontend Repository

1. **Create a NEW folder** on your Desktop called `bullet-royale-frontend`
2. **Copy `index.html`** from `bullet-royale-backend/public/` folder
3. **Paste it** into the new `bullet-royale-frontend` folder
4. **Open terminal** in the `bullet-royale-frontend` folder (same way as before)

### Step 6.3: Upload Frontend

Type these commands:

```bash
git init
```

```bash
git add index.html
```

```bash
git commit -m "Initial commit"
```

```bash
git branch -M main
```

Now create a NEW repository on GitHub:
1. Go to https://github.com/new
2. Name: `bullet-royale-frontend`
3. Public
4. Create repository

Copy the repository URL and run (replace YOUR_USERNAME):

```bash
git remote add origin https://github.com/YOUR_USERNAME/bullet-royale-frontend.git
```

```bash
git push -u origin main
```

### Step 6.4: Enable GitHub Pages

1. **Go to your frontend repository** on GitHub
2. **Click "Settings"** tab
3. **Click "Pages"** in left sidebar
4. **Under "Source":**
   - Branch: `main`
   - Folder: `/ (root)`
5. **Click "Save"**
6. **Wait 2-3 minutes**
7. **Refresh the page**
8. **You'll see:** "Your site is published at https://YOUR_USERNAME.github.io/bullet-royale-frontend/"

**Copy this URL!**

### Step 6.5: Final Update

1. **Go back to Render dashboard**
2. **Click your service**
3. **Click "Environment"**
4. **Edit `FRONTEND_URL`**
5. **Set to:** `https://YOUR_USERNAME.github.io/bullet-royale-frontend`
6. **Save** - wait for redeploy

---

## 🎉 YOU'RE LIVE!

### Test Your Site:

1. **Visit:** `https://YOUR_USERNAME.github.io/bullet-royale-frontend`
2. **Click "CONNECT LICHESS TO PLAY"**
3. **Authorize on Lichess**
4. **You're redirected back**
5. **You should see your profile!**

### Share Your Leaderboard:

Your website is now LIVE at:
```
https://YOUR_USERNAME.github.io/bullet-royale-frontend
```

**Share it with:**
- Your chess club
- Friends
- Reddit r/chess
- Twitter
- Discord servers

---

## 🎮 How It Works

### For You (Admin):
- You built a website!
- Backend runs on Render (processes games)
- Frontend hosted on GitHub Pages (what users see)
- Database on Supabase (stores data)
- All FREE! 🎉

### For Players:
1. Visit your website
2. Click "Connect Lichess"
3. Play bullet games on Lichess
4. Games sync automatically every 5 minutes
5. Trophies update
6. Win streaks tracked
7. Compete for #1!

### Trophy System:
- **Win:** 30 + rating bonus + streak bonus
- **Loss:** -20 (fixed)
- **Draw:** Preserve streak + small bonus
- **Streaks:** 3/5/8+ wins = extra trophies!

---

## ❓ Common Problems

### "npm: command not found"
**Fix:** Node.js not installed correctly
- Reinstall Node.js from nodejs.org
- Restart your computer
- Try again

### "Cannot find module"
**Fix:** Didn't run `npm install`
- Go to the project folder
- Run `npm install`
- Wait for it to finish

### "Database connection failed"
**Fix:** Wrong connection string
- Check your `.env` file
- Make sure `DATABASE_URL` is correct
- Make sure you replaced `[YOUR-PASSWORD]`

### "OAuth failed"
**Fix:** Wrong redirect URI
- Check `LICHESS_REDIRECT_URI` in Render
- Make sure it matches your Render URL exactly
- No extra spaces or typos

### "Site not loading"
**Fix:** Backend might be sleeping
- Render free tier sleeps after 15 min
- First visit takes 30 seconds to wake up
- Subsequent visits are instant

### "Can't push to GitHub"
**Fix:** Need Personal Access Token
- Go to https://github.com/settings/tokens
- Generate new token
- Check "repo" permission
- Use token as password

---

## 🎓 What You Just Learned

You now know how to:
- ✅ Use the command line/terminal
- ✅ Install software (Node.js, Git)
- ✅ Set up a database (Supabase)
- ✅ Configure environment variables
- ✅ Use Git and GitHub
- ✅ Deploy to cloud platforms (Render, GitHub Pages)
- ✅ Connect to APIs (Lichess)
- ✅ Build a full-stack web application

**These are real developer skills!** 🚀

---

## 🎊 Congratulations!

You built and deployed a production website from scratch!

Players can now compete on your leaderboard, earn trophies, build win streaks, and battle for #1!

**Welcome to the world of web development!** 🏆⚡

---

## 📚 Next Steps

**Want to customize?**
- Change trophy values in Render environment variables
- Edit colors in `index.html`
- Add more features!

**Want to learn more?**
- Learn JavaScript: https://javascript.info
- Learn Node.js: https://nodejs.dev
- Learn React: https://react.dev

**Need help?**
- Re-read this guide (seriously!)
- Google your error messages
- Ask in programming forums

**You did it!** 🎉

---

**Built with ❤️ for chess players**

Now go play some bullet and watch those trophies grow! ♟️🏆
