# 🎭 Holiday Charades - Simple PWA Game

A single-phone charades game you can play at the pub. Pass it around, act things out, have a laugh.

## What You're Building Today

- A web app you install on your phone (like a real app!)
- AI generates charades topics (no more thinking of ideas)
- Keeps score automatically
- Remembers what's been used (no repeats)
- Everyone gets one skip per round
- Works offline once installed

## Quick Start (For Students)

### Step 1: Get the Code (2 minutes)

1. Go to the instructor's GitHub repo
2. Click the **Fork** button (top right)
3. You now have your own copy!

### Step 2: Deploy to Your Phone (3 minutes)

1. In YOUR forked repo, go to **Settings**
2. Click **Pages** (left sidebar)
3. Under "Source", select **main** branch
4. Click **Save**
5. Wait 1-2 minutes
6. Your app is live at: `https://YOUR-USERNAME.github.io/REPO-NAME/`

### Step 3: Install on Your Phone (2 minutes)

**iPhone:**
1. Open the URL in Safari
2. Tap the Share button
3. Scroll down → "Add to Home Screen"
4. Tap "Add"

**Android:**
1. Open the URL in Chrome
2. Tap menu (⋮)
3. Tap "Install app"

**You now have a working charades app!**

### Step 4: Connect to AI (taught together)

We'll do this together in the workshop:
1. Import the n8n workflow
2. Update your webhook URL
3. Test it
4. Topics now generate!

---

## How to Play

1. **Setup**: Add players (names + optional photos), set timer and rounds
2. **Play**: Pass phone to first player → they tap START → topic appears
3. **Act**: Player acts it out while timer runs
4. **Score**: 
   - If someone guessed it → tap "Got It!" → select who guessed → both get points
   - If nobody guessed → tap "Nobody Guessed" → no points
5. **Skip**: Each player can skip ONCE per round if they get something impossible
6. **Win**: Most points after all rounds wins!

---

## Customization Ideas (Afternoon Session)

### Easy Changes (in style.css)

**Change Colors:**
```css
/* Lines 8-15 - Change these! */
--primary: #FF3366;      /* Try #00D9FF for blue */
--secondary: #FFD93D;    /* Try #00FF88 for green */
--success: #6BCF7F;
```

**Change Fonts:**
```css
/* Line 20 */
--font-display: 'Righteous', cursive;  /* Try other Google Fonts */
```

### Medium Changes (in app.js)

**Add Your Own Fallback Topics:**
```javascript
// Lines 218-227 - Add your own!
const fallbacks = [
    { category: 'Movie', emoji: '🎬', topic: 'Your Favorite Movie' },
    // Add more here!
];
```

**Customize Timer Length Options:**
```javascript
// In HTML, lines 20-25
<option value="15">15 seconds</option>  /* Add fast mode! */
<option value="180">3 minutes</option>  /* Add slow mode! */
```

### Advanced Changes

**Modify AI Prompt (in n8n):**
- Make it generate funnier topics
- Add Scottish references
- Make it seasonal
- Add difficulty levels

**Add Sound Effects:**
```javascript
// Add this after line 334
const successSound = new Audio('success.mp3');
successSound.play();
```

---

## Files Explained

- `index.html` - The structure (what's on the page)
- `style.css` - The look (colors, fonts, layout)
- `app.js` - The logic (what happens when you click)
- `manifest.json` - PWA config (makes it installable)
- `service-worker.js` - Offline support (caches the app)
- `n8n-workflow.json` - AI workflow (import this into n8n)

---

## Troubleshooting

**App won't install on phone:**
- Make sure you're using HTTPS (GitHub Pages does this automatically)
- Try a different browser (Safari on iOS, Chrome on Android)
- Check icons exist (they're optional but help)

**AI not generating topics:**
- Check your n8n webhook URL is correct in `app.js` line 8
- Make sure n8n workflow is active (toggle top-right)
- Use fallback topics (they work without AI)

**Photos not working:**
- Camera API requires HTTPS (you have this via GitHub Pages)
- Grant camera permission when asked
- Photos are optional anyway!

**Game stuck:**
- Refresh the page
- Check browser console for errors (F12)
- Ask for help!

---

## What You Learned Today

1. **PWAs**: Web apps that install like native apps
2. **GitHub Pages**: Free hosting for static sites
3. **n8n**: Visual automation/backend tool
4. **Claude API**: Using AI to generate content
5. **State Management**: Keeping track of game data
6. **Camera API**: Taking photos in the browser

---

## Take It Further

**Ideas for next week:**
- Add team mode (2v2 charades)
- Create different game modes (Pictionary? Taboo?)
- Add a global leaderboard
- Make it multiplayer across phones
- Add difficulty levels
- Create themed packs (80s movies, Scottish culture, etc.)

**Share your version!**
Post your customized version in the group chat. Let's see what you create!

---

## Credits

Built at AI Builders Buildathon  
Dundee Founders Collective  
December 2024

---

## License

MIT License - Do whatever you want with it!
