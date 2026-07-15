# VOID // MINIMALIST GAMING ZONE

A sleek, responsive, and responsive gaming zone management dashboard. Track console statuses (online, under maintenance, active), schedule future booking sessions with automatic activation, and send OTP codes via EmailJS—all running on **Cloudflare's serverless architecture**!

---

## 🛠️ Technology Stack
* **Frontend**: React + Vite + Vanilla CSS (Glassmorphism & Sci-Fi Aesthetic)
* **Hosting**: Cloudflare Pages
* **Backend Database**: Cloudflare Workers + Cloudflare KV Namespace

---

## 💻 Local Development

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```
2. **Start the local Vite development server**:
   ```bash
   npm run dev
   ```
3. Open **`http://localhost:5173`** in your browser.

---

## ⛅ Cloudflare Deployment Guide

To deploy this application globally on Cloudflare for free, follow these steps:

### Part 1: Deploy the Cloudflare Workers Database Backend

1. **Login to your Cloudflare account**:
   ```bash
   npx wrangler login
   ```
   *(On Windows PowerShell, use `npx.cmd wrangler login` if script execution is blocked)*.

2. **Create the KV Namespace**:
   Create a KV store namespace to persist bookings, sessions, and configurations:
   ```bash
   npx wrangler kv namespace create GAMEZONE_KV
   ```
   Copy the generated **ID** of the KV namespace from the command output.

3. **Configure the Worker**:
   Open **`cloudflare-backend/wrangler.json`** and replace the `"id"` placeholder with your new KV namespace ID:
   ```json
   {
     "binding": "GAMEZONE_KV",
     "id": "YOUR_KV_NAMESPACE_ID"
   }
   ```

4. **Deploy the Worker**:
   Run the deployment command:
   ```bash
   npx wrangler deploy --config cloudflare-backend/wrangler.json
   ```
   Copy the deployed worker URL from the terminal output (e.g., `https://gamezone-backend.white018899.workers.dev`).

---

### Part 2: Deploy the React Frontend (Cloudflare Pages)

1. **Deploy to Pages**:
   Build the static files and deploy them to Cloudflare Pages using the pre-configured script:
   ```bash
   npm run deploy:pages
   ```

2. **Deploy prompts**:
   * Cloudflare will ask if you want to create a new Pages project. Answer **Yes**.
   * Enter a project name (e.g., `gamezone`).
   * Select `dist` as the production directory to upload.
   * Wrangler will output your live URL (e.g., `https://gamezone.pages.dev`).

---

### Part 3: Connect Frontend to Backend

1. Open your live Cloudflare Pages URL with the admin query parameter:
   ```text
   https://your-pages-project.pages.dev/?admin
   ```
2. Enter your Terminal PIN (**`0000`**) or Access Token (**`admin-token-777`**) to authenticate.
3. Select the **Gateways** settings tab.
4. Scroll down, paste your **Cloudflare Workers API URL** (from Part 1, Step 4) into the field, and click **Save Gateways Settings**.

🎉 **Your website is now live, globally synchronized, and database-backed on Cloudflare!**
